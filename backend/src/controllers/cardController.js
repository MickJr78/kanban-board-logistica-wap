const { prisma, io } = require('../../server');

const ETAPAS_COM_VEICULO = ['Corte', 'Planejado', 'EmSeparacao', 'Customizando', 'Embarcando', 'Finalizado'];
const ETAPAS_SEM_VEICULO = ['Reprogramacao', 'PlanejadoSemVeiculo', 'SeparandoSemVeiculo', 'CustomizandoSemVeiculo', 'CargaProntaSemVeiculo', 'FinalizadoSemVeiculo'];

function getDefaultEtapa(fluxo) {
  return fluxo === 'comVeiculo' ? 'Planejado' : 'PlanejadoSemVeiculo';
}

function addToHistory(card, acao, detalhes) {
  if (!card.historico) card.historico = [];
  card.historico.push({
    data: new Date().toISOString(),
    acao: acao,
    detalhes: detalhes,
    fluxo: card.fluxo,
    etapa: card.etapa
  });
}

const cardController = {
  async getAll(req, res) {
    try {
      const { search, fluxo, etapa, page = 1, limit = 50 } = req.query;
      const skip = (page - 1) * limit;
      
      const where = {};
      if (search) where.cliente = { contains: search, mode: 'insensitive' };
      if (fluxo) where.fluxo = fluxo;
      if (etapa) where.etapa = etapa;
      
      const cards = await prisma.card.findMany({ where, skip, take: parseInt(limit) });
      res.json(cards);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const card = await prisma.card.findUnique({ where: { id: req.params.id } });
      if (!card) return res.status(404).json({ error: 'Card not found' });
      res.json(card);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req, res) {
    try {
      const card = await prisma.card.create({
        data: {
          ...req.body,
          etapa: req.body.etapa || getDefaultEtapa(req.body.fluxo),
        }
      });
      io.emit('card_created', card);
      res.status(201).json(card);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const oldCard = await prisma.card.findUnique({ where: { id } });
      
      const card = await prisma.card.update({
        where: { id },
        data: { ...req.body, dataAtualizacao: new Date() }
      });
      
      if (oldCard.fluxo !== card.fluxo || oldCard.etapa !== card.etapa) {
        addToHistory(card, 'Movimentação', `De ${oldCard.etapa} para ${card.etapa}`);
      }
      
      io.emit('card_updated', card);
      res.json(card);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      await prisma.card.delete({ where: { id } });
      io.emit('card_deleted', id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = cardController;