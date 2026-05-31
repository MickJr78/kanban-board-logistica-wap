const ETAPAS_COM_VEICULO = ['Corte', 'Planejado', 'EmSeparacao', 'Customizando', 'Embarcando', 'Finalizado'];
const ETAPAS_SEM_VEICULO = ['Reprogramacao', 'PlanejadoSemVeiculo', 'SeparandoSemVeiculo', 'CustomizandoSemVeiculo', 'CargaProntaSemVeiculo', 'FinalizadoSemVeiculo'];

const COLUNA_LABELS = {
  Corte: 'CORTE',
  Planejado: 'PLANEJADO',
  EmSeparacao: 'EM SEPARAÇÃO',
  Customizando: 'CUSTOMIZANDO',
  Embarcando: 'EMBARCANDO',
  Finalizado: 'FINALIZADO',
  Reprogramacao: 'REPROGRAMAÇÃO',
  PlanejadoSemVeiculo: 'PLANEJADO SEM VEÍCULO',
  SeparandoSemVeiculo: 'SEPARANDO SEM VEÍCULO',
  CustomizandoSemVeiculo: 'CUSTOMIZANDO SEM VEÍCULO',
  CargaProntaSemVeiculo: 'CARGA PRONTA - SEM VEÍCULO',
  FinalizadoSemVeiculo: 'FINALIZADO - ROMANEIO BAIXADO'
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function getDefaultEtapa(fluxo) {
  return fluxo === 'comVeiculo' ? 'Planejado' : 'PlanejadoSemVeiculo';
}

function mapEtapaToFluxo(etapa, sourceFluxo, targetFluxo) {
  const mapping = {
    semVeiculo: {
      Reprogramacao: 'Corte',
      PlanejadoSemVeiculo: 'Planejado',
      SeparandoSemVeiculo: 'EmSeparacao',
      CustomizandoSemVeiculo: 'Customizando',
      CargaProntaSemVeiculo: 'Embarcando',
      FinalizadoSemVeiculo: 'Finalizado'
    },
    comVeiculo: {
      Corte: 'Reprogramacao',
      Planejado: 'PlanejadoSemVeiculo',
      EmSeparacao: 'SeparandoSemVeiculo',
      Customizando: 'CustomizandoSemVeiculo',
      Embarcando: 'CargaProntaSemVeiculo',
      Finalizado: 'FinalizadoSemVeiculo'
    }
  };
  return mapping[sourceFluxo][etapa] || getDefaultEtapa(targetFluxo);
}

function getColumnName(etapa) {
  return COLUNA_LABELS[etapa] || etapa;
}

function getColumnClass(etapa) {
  if (etapa === 'Corte') return 'corte';
  if (etapa === 'CargaProntaSemVeiculo') return 'carga-pronta-sem-veiculo';
  return '';
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

class CardRepository {
  constructor(storageProvider) {
    this.storage = storageProvider;
  }

  async getAll(searchTerm = '') {
    const cards = await this.storage.getCards();
    if (searchTerm) {
      return cards.filter(card => card.cliente.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return cards;
  }

  async getById(id) {
    const cards = await this.storage.getCards();
    return cards.find(c => c.id === id);
  }

  async create(card) {
    const cards = await this.storage.getCards();
    const newCard = {
      id: generateId(),
      etapa: getDefaultEtapa(card.fluxo),
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
      ...card
    };
    cards.push(newCard);
    await this.storage.saveCards(cards);
    return newCard;
  }

  async update(id, cardData) {
    const cards = await this.storage.getCards();
    const index = cards.findIndex(c => c.id === id);
    if (index !== -1) {
      const oldCard = cards[index];
      const changes = [];
      if (oldCard.cliente !== cardData.cliente) changes.push('cliente');
      if (oldCard.transportadora !== cardData.transportadora) changes.push('transportadora');
      if (oldCard.valorNF !== cardData.valorNF) changes.push('valor NF');
      if (JSON.stringify(oldCard.etiquetas) !== JSON.stringify(cardData.etiquetas)) changes.push('etiquetas');
      if (changes.length > 0) {
        addToHistory(oldCard, 'Editar', `Campos alterados: ${changes.join(', ')}`);
      }
      cards[index] = { ...oldCard, ...cardData, dataAtualizacao: new Date().toISOString() };
      await this.storage.saveCards(cards);
      return cards[index];
    }
    return null;
  }

  async delete(id) {
    const cards = await this.storage.getCards();
    const card = cards.find(c => c.id === id);
    if (card) {
      addToHistory(card, 'Excluir', `Card excluído: ${card.cliente}`);
    }
    const filtered = cards.filter(c => c.id !== id);
    await this.storage.saveCards(filtered);
  }

  async archive(id) {
    const card = await this.getById(id);
    if (card) {
      card.arquivado = true;
      card.dataArquivado = new Date().toISOString();
      addToHistory(card, 'Arquivar', `Card arquivado: ${card.cliente}`);
      await this.storage.saveCards(await this.storage.getCards().then(c => c.map(c => c.id === id ? card : c)));
    }
  }
}

class ExportService {
  static toJSON(cards) {
    return JSON.stringify({ cards }, null, 2);
  }

  static toCSV(cards) {
    const headers = ['id', 'cliente', 'notasFiscais', 'transportadora', 'dataColeta', 'dataEntrega', 'valorNF', 'fluxo', 'etapa', 'observacoes'];
    const rows = cards.map(c => [
      c.id, c.cliente, c.notasFiscais.join(','), c.transportadora,
      c.dataColeta, c.dataEntrega, c.valorNF, c.fluxo, c.etapa, c.observacoes || ''
    ].map(v => `"${v}"`).join(','));
    return [headers.join(','), ...rows].join('\n');
  }

  static download(filename, content, type = 'application/json') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  static triggerExport(cards) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header"><h3 class="modal-title">Exportar Dados</h3></div>
        <div class="modal-body">
          <button class="btn btn-primary" id="export-json">Exportar JSON</button>
          <button class="btn btn-secondary" id="export-csv">Exportar CSV</button>
        </div>
        <div class="modal-footer"><button class="btn btn-secondary" id="close-export">Fechar</button></div>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('export-json').onclick = () => {
      this.download('kanban-export.json', this.toJSON(cards));
      modal.remove();
    };
    document.getElementById('export-csv').onclick = () => {
      this.download('kanban-export.csv', this.toCSV(cards), 'text/csv');
      modal.remove();
    };
    document.getElementById('close-export').onclick = () => modal.remove();
  }
}

function showOfflineBanner() {
  let banner = document.getElementById('offline-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'offline-banner';
    banner.className = 'offline-banner hidden';
    banner.textContent = 'Modo Offline - Alterações serão sincronizadas quando a conexão for restabelecida';
    document.body.insertBefore(banner, document.body.firstChild);
  }
  return banner;
}

function initConnectionHandling() {
  const banner = showOfflineBanner();
  window.addEventListener('online', () => banner.classList.add('hidden'));
  window.addEventListener('offline', () => banner.classList.remove('hidden'));
}