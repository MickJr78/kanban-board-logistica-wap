const Storage = {
  key: 'kanbanCards',
  
  save(cards) {
    localStorage.setItem(this.key, JSON.stringify(cards));
    localStorage.setItem(this.key + '_updated', Date.now());
  },
  
  load() {
    const data = localStorage.getItem(this.key);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }
};

const ThemeStorage = {
  key: 'kanbanTheme',
  
  save(theme) {
    localStorage.setItem(this.key, theme);
  },
  
  load() {
    return localStorage.getItem(this.key) || 'dark';
  }
};

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

let cards = [];

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

function showModal(title, bodyContent, footerContent) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyContent;
  document.getElementById('modal-footer').innerHTML = footerContent;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function hideModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

function createCardForm(card = null) {
  const cliente = (card?.cliente || '').toUpperCase();
  const notasFiscais = (card?.notasFiscais?.join(', ') || '').toUpperCase();
  const transportadora = (card?.transportadora || '').toUpperCase();
  const dataColeta = card?.dataColeta || '';
  const dataEntrega = card?.dataEntrega || '';
  const valorNF = card?.valorNF || '';
  const observacoes = (card?.observacoes || '').toUpperCase();
  const fluxo = card?.fluxo || 'semVeiculo';
  const etiquetas = card?.etiquetas || [];
  
  const hasCustomizacao = etiquetas.some(e => e.tipo === 'customizacao');
  const hasEtiquetaPronta = etiquetas.some(e => e.tipo === 'etiquetaPronta');
  const hasCargaBatida = etiquetas.some(e => e.tipo === 'cargaBatida');
  const hasCargaConsolidada = etiquetas.some(e => e.tipo === 'cargaConsolidada');
  
  return `
    <form id="card-form">
      <div class="form-row">
        <label for="cliente">Cliente/HUB *</label>
        <input type="text" id="cliente" required value="${cliente}">
      </div>
      <div class="form-row">
        <label for="notas-fiscais">Notas Fiscais *</label>
        <input type="text" id="notas-fiscais" required value="${notasFiscais}">
      </div>
      <div class="form-row">
        <label for="transportadora">Transportadora *</label>
        <input type="text" id="transportadora" required value="${transportadora}">
      </div>
      <div class="form-row">
        <label for="data-coleta">Data de Coleta *</label>
        <input type="date" id="data-coleta" required value="${dataColeta}">
      </div>
      <div class="form-row">
        <label for="data-entrega">Data de Entrega *</label>
        <input type="date" id="data-entrega" required value="${dataEntrega}">
      </div>
      <div class="form-row">
        <label for="valor-nf">Valor NF *</label>
        <input type="number" id="valor-nf" step="0.01" required value="${valorNF}">
      </div>
      <div class="form-row full-width">
        <label for="fluxo">Fluxo *</label>
        <select id="fluxo" required>
          <option value="semVeiculo" ${fluxo === 'semVeiculo' ? 'selected' : ''}>Sem Veículo</option>
          <option value="comVeiculo" ${fluxo === 'comVeiculo' ? 'selected' : ''}>Com Veículo</option>
        </select>
      </div>
      <div class="form-row full-width">
        <label>Etiquetas</label>
        <div class="checkbox-group">
          <label class="checkbox-label">
            <input type="checkbox" id="customizacao" ${hasCustomizacao ? 'checked' : ''}>
            <span class="indicator customizacao" title="Customização"></span>
            Customização
          </label>
          <label class="checkbox-label">
            <input type="checkbox" id="etiqueta-pronta" ${hasEtiquetaPronta ? 'checked' : ''}>
            <span class="indicator etiquetaPronta" title="Etiqueta Pronta"></span>
            Etiqueta Pronta
          </label>
          <label class="checkbox-label">
            <input type="checkbox" id="carga-batida" ${hasCargaBatida ? 'checked' : ''}>
            <span class="indicator cargaBatida" title="Carga Batida"></span>
            Carga Batida
          </label>
          <label class="checkbox-label">
            <input type="checkbox" id="carga-consolidada" ${hasCargaConsolidada ? 'checked' : ''}>
            <span class="indicator cargaConsolidada" title="Carga Consolidada"></span>
            Carga Consolidada
          </label>
        </div>
      </div>
      <div class="form-row full-width">
        <label for="observacoes">Observações</label>
        <textarea id="observacoes" placeholder="Digite observações adicionais...">${observacoes}</textarea>
      </div>
    </form>
  `;
}

function showConfirmModal(message, confirmCallback) {
  showModal('Confirmação', `<p>${message}</p>`, `
    <button id="confirm-no" class="btn btn-secondary">Não</button>
    <button id="confirm-yes" class="btn btn-primary">Sim</button>
  `);
  document.getElementById('confirm-yes').onclick = () => { hideModal(); confirmCallback(); };
  document.getElementById('confirm-no').onclick = () => { hideModal(); };
}

function showCardModal(card = null, onSuccess) {
  const title = card ? 'Editar Card' : 'Novo Card';
  showModal(title, createCardForm(card), `
    <button id="cancel-btn" class="btn btn-secondary">Cancelar</button>
    <button id="save-btn" class="btn btn-primary">${card ? 'Salvar' : 'Criar'}</button>
  `);
  
  document.getElementById('cancel-btn').onclick = hideModal;
  document.getElementById('save-btn').onclick = () => {
    const form = document.getElementById('card-form');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    
    const etiquetas = [];
    if (document.getElementById('customizacao').checked) etiquetas.push({ tipo: 'customizacao', cor: '#28a745' });
    if (document.getElementById('etiqueta-pronta').checked) etiquetas.push({ tipo: 'etiquetaPronta', cor: '#007bff' });
    if (document.getElementById('carga-batida').checked) etiquetas.push({ tipo: 'cargaBatida', cor: '#e83e8c' });
    if (document.getElementById('carga-consolidada').checked) etiquetas.push({ tipo: 'cargaConsolidada', cor: '#ffc107' });
    
    const cardData = {
      cliente: document.getElementById('cliente').value.trim().toUpperCase(),
      notasFiscais: document.getElementById('notas-fiscais').value.split(',').map(n => n.trim().toUpperCase()).filter(n => n),
      transportadora: document.getElementById('transportadora').value.trim().toUpperCase(),
      dataColeta: document.getElementById('data-coleta').value,
      dataEntrega: document.getElementById('data-entrega').value,
      valorNF: parseFloat(document.getElementById('valor-nf').value) || 0,
      observacoes: document.getElementById('observacoes').value.trim().toUpperCase(),
      fluxo: document.getElementById('fluxo').value,
      etiquetas: etiquetas,
      dataAtualizacao: new Date().toISOString()
    };
    
    if (!card) {
      cardData.id = generateId();
      cardData.etapa = getDefaultEtapa(cardData.fluxo);
      cardData.dataCriacao = cardData.dataAtualizacao;
    }
    
    hideModal();
    onSuccess(cardData);
  };
}

function renderBoard(cardsData, searchTerm = '') {
  const semVeiculoContainer = document.getElementById('sem-veiculo-columns');
  const comVeiculoContainer = document.getElementById('com-veiculo-columns');
  
  semVeiculoContainer.innerHTML = '';
  comVeiculoContainer.innerHTML = '';
  
  const cardsByColumn = {};
  cardsData.forEach(card => {
    const key = `${card.fluxo}-${card.etapa}`;
    if (!cardsByColumn[key]) cardsByColumn[key] = [];
    cardsByColumn[key].push(card);
  });

  Object.values(cardsByColumn).forEach(columnCards => {
    if (columnCards.length > 1) {
      columnCards.sort((a, b) => new Date(a.dataCriacao) - new Date(b.dataCriacao));
      columnCards.forEach((card, index) => {
        if (index > 0) {
          const cardIndex = cards.findIndex(c => c.id === card.id);
          if (cardIndex !== -1 && cards[cardIndex].collapsed !== false) {
            cards[cardIndex].collapsed = true;
          }
        }
      });
    }
  });
  
  ETAPAS_SEM_VEICULO.forEach(etapa => semVeiculoContainer.appendChild(createColumn(etapa, 'semVeiculo')));
  ETAPAS_COM_VEICULO.forEach(etapa => comVeiculoContainer.appendChild(createColumn(etapa, 'comVeiculo')));
  
  const filteredCards = searchTerm 
    ? cardsData.filter(card => card.cliente.toLowerCase().includes(searchTerm.toLowerCase()))
    : cardsData;
  
  filteredCards.forEach(card => {
    const cardElement = createCard(card);
    const columnContainer = document.querySelector(`[data-fluxo="${card.fluxo}"][data-etapa="${card.etapa}"] .cards-container`);
    if (columnContainer) columnContainer.appendChild(cardElement);
  });
  
  updateSummaryBars(cardsData);
}

function updateSummaryBars(cardsData) {
  const comVeiculoSummary = document.getElementById('com-veiculo-summary-content');
  const semVeiculoSummary = document.getElementById('sem-veiculo-summary-content');
  
  const comVeiculoCards = cardsData.filter(c => c.fluxo === 'comVeiculo');
  const semVeiculoCards = cardsData.filter(c => c.fluxo === 'semVeiculo');
  
  const comColumnTotals = {};
  const semColumnTotals = {};
  
  ETAPAS_COM_VEICULO.forEach(etapa => {
    const etapaCards = comVeiculoCards.filter(c => c.etapa === etapa);
    if (etapaCards.length > 0) {
      comColumnTotals[etapa] = etapaCards.reduce((sum, c) => sum + (c.valorNF || 0), 0);
    }
  });
  
  ETAPAS_SEM_VEICULO.forEach(etapa => {
    const etapaCards = semVeiculoCards.filter(c => c.etapa === etapa);
    if (etapaCards.length > 0) {
      semColumnTotals[etapa] = etapaCards.reduce((sum, c) => sum + (c.valorNF || 0), 0);
    }
  });
  
  const comFlowTotal = comVeiculoCards.reduce((sum, c) => sum + (c.valorNF || 0), 0);
  const semFlowTotal = semVeiculoCards.reduce((sum, c) => sum + (c.valorNF || 0), 0);
  
  const comHtml = comVeiculoCards.map(c => 
    `<span class="summary-item">${c.cliente} - ${formatCurrency(c.valorNF)}</span>`
  ).join('');
  
  const comTotalHtml = comFlowTotal > 0 ? `<span class="summary-total">TOTAL FLUXO COM VEÍCULO: ${formatCurrency(comFlowTotal)}</span>` : '';
  const comColumnTotalsHtml = Object.entries(comColumnTotals).map(([etapa, total]) => 
    `<span class="summary-total summary-column-total">${getColumnName(etapa)}: ${formatCurrency(total)}</span>`
  ).join('');
  
  const semHtml = semVeiculoCards.map(c => 
    `<span class="summary-item">${c.cliente} - ${formatCurrency(c.valorNF)}</span>`
  ).join('');
  
  const semTotalHtml = semFlowTotal > 0 ? `<span class="summary-total">TOTAL FLUXO SEM VEÍCULO: ${formatCurrency(semFlowTotal)}</span>` : '';
  const semColumnTotalsHtml = Object.entries(semColumnTotals).map(([etapa, total]) => 
    `<span class="summary-total summary-column-total">${getColumnName(etapa)}: ${formatCurrency(total)}</span>`
  ).join('');
  
  let comFullContent = comHtml + comColumnTotalsHtml + comTotalHtml;
  let semFullContent = semHtml + semColumnTotalsHtml + semTotalHtml;
  comVeiculoSummary.innerHTML = comFullContent + comFullContent;
  semVeiculoSummary.innerHTML = semFullContent + semFullContent;
}

function positionTooltip(tooltip, cardElement) {
  const rect = cardElement.getBoundingClientRect();
  const coluna = cardElement.closest('.column');
  const etapa = coluna ? coluna.dataset.etapa : null;
  const finalizado = etapa === 'Finalizado' || etapa === 'FinalizadoSemVeiculo';

  tooltip.style.top = (rect.top + 8) + 'px';
  tooltip.style.maxWidth = '300px';
  const largura = tooltip.offsetWidth || 220;

  let leftFinalizado = Math.max(0, rect.left - largura - 12);
  let leftNormal = rect.right + 12;
  let flippedFinalizado = true;
  let flippedNormal = false;

  if (finalizado && leftFinalizado + largura > window.innerWidth) {
    leftFinalizado = leftNormal;
    flippedFinalizado = false;
  }
  if (!finalizado && leftNormal + largura > window.innerWidth) {
    leftNormal = Math.max(0, leftFinalizado);
    flippedNormal = true;
  }

  tooltip.classList.remove('hidden', 'visible');
  tooltip.classList.toggle('tooltip-flipped', finalizado ? flippedFinalizado : flippedNormal);

  if (finalizado) {
    tooltip.style.left = leftFinalizado + 'px';
  } else {
    tooltip.style.left = leftNormal + 'px';
  }

  requestAnimationFrame(() => tooltip.classList.add('visible'));
}

function createCard(card) {
  const cardElement = document.createElement('div');
  cardElement.className = 'card';
  cardElement.dataset.cardId = card.id;
  cardElement.draggable = true;
  
  if (card.etiquetas && card.etiquetas.length > 0) {
    card.etiquetas.forEach(e => cardElement.classList.add(`has-${e.tipo}`));
  }
  
  const indicatorsHtml = card.etiquetas && card.etiquetas.length > 0 
    ? card.etiquetas.map(e => `<span class="indicator ${e.tipo}" title="${e.tipo}"></span>`).join('') 
    : '';
  const isCollapsed = card.collapsed === true;
  
  cardElement.innerHTML = `
    <div class="card-header">
      <h4 class="card-cliente">${card.cliente}</h4>
    </div>
    <div class="card-indicators">${indicatorsHtml}</div>
    <div class="card-info">${isCollapsed ? '' : `
      <div>NF: ${card.notasFiscais.join(', ')}</div>
      <div>Transportadora: ${card.transportadora}</div>
      <div>Coleta: ${card.dataColeta} | Entrega: ${card.dataEntrega}</div>
      <div>Valor: ${formatCurrency(card.valorNF)}</div>
      ${card.observacoes ? `<div>Obs: ${card.observacoes}</div>` : ''}
    `}</div>
    <div class="collapsed-tooltip ${card.fluxo === 'comVeiculo' ? 'tooltip-com-veiculo' : 'tooltip-sem-veiculo'}">
      <div style="font-weight:bold;margin-bottom:3px;">${card.cliente}</div>
      <strong>Coleta:</strong> ${card.dataColeta}<br>
      <strong>Entrega:</strong> ${card.dataEntrega}<br>
      <strong>Valor:</strong> ${formatCurrency(card.valorNF)}
    </div>
    <div class="card-actions" style="${isCollapsed ? 'display:none;' : ''}">
      <button class="card-btn fluxo-btn" title="Alterar Fluxo">🔄</button>
      <button class="card-btn voltar-btn" title="Voltar Etapa">◀</button>
      <button class="card-btn avancar-btn" title="Avançar Etapa">▶</button>
      <button class="card-btn editar-btn" title="Editar">✏️</button>
      <button class="card-btn excluir-btn" title="Excluir">🗑️</button>
    </div>
  `;
  
  if (isCollapsed) {
    cardElement.classList.add('collapsed');
  }
  
  cardElement.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', card.id);
    e.dataTransfer.setData('source-fluxo', card.fluxo);
    e.dataTransfer.setData('source-etapa', card.etapa);
    cardElement.classList.add('dragging');
  });
  
  cardElement.addEventListener('dragend', () => {
    cardElement.classList.remove('dragging');
    document.querySelectorAll('.column').forEach(col => col.classList.remove('drag-over'));
  });

cardElement.querySelector('.card-cliente').addEventListener('click', (e) => {
    if (e.target.closest('.card-btn')) return;
    e.stopPropagation();
    const cards = getCards();
    const cardIndex = cards.findIndex(c => c.id === card.id);
    if (cardIndex !== -1) {
      cards[cardIndex].collapsed = !cards[cardIndex].collapsed;
      saveCards(cards);
      renderBoard(cards);
    }
  });

    const tooltip = cardElement.querySelector('.collapsed-tooltip');

    function showTooltip() {
      // Don't show tooltip if any modal is open
      const modalOverlay = document.getElementById('modal-overlay');
      if (modalOverlay && modalOverlay.classList.contains('hidden')) {
        const currentCard = getCards().find(c => c.id === card.id);
        if (currentCard && currentCard.collapsed === true && tooltip) {
          positionTooltip(tooltip, cardElement);
        }
      }
    }

    function hideTooltip() {
      if (tooltip) {
        tooltip.classList.remove('visible');
        setTimeout(() => tooltip.classList.add('hidden'), 300);
      }
    }

    if (isCollapsed) {
      cardElement.addEventListener('mouseenter', () => showTooltip());
      cardElement.addEventListener('mouseleave', () => hideTooltip());
    }

  cardElement.querySelector('.avancar-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const cards = getCards();
    const cardIndex = cards.findIndex(c => c.id === card.id);
    if (cardIndex === -1) return;
    const etapas = card.fluxo === 'comVeiculo' ? ETAPAS_COM_VEICULO : ETAPAS_SEM_VEICULO;
    const currentIndex = etapas.indexOf(card.etapa);
    if (currentIndex < etapas.length - 1) {
      addToHistory(cards[cardIndex], 'Avançar etapa', `De ${etapas[currentIndex]} para ${etapas[currentIndex + 1]}`);
      cards[cardIndex].etapa = etapas[currentIndex + 1];
      cards[cardIndex].dataAtualizacao = new Date().toISOString();
      saveCards(cards);
      renderBoard(cards);
    }
  });

  cardElement.querySelector('.voltar-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const etapas = card.fluxo === 'comVeiculo' ? ETAPAS_COM_VEICULO : ETAPAS_SEM_VEICULO;
    const currentIndex = etapas.indexOf(card.etapa);
    if (currentIndex > 0) {
      showConfirmModal('Deseja retroceder esta etapa?', () => {
        const cards = getCards();
        const cardIndex = cards.findIndex(c => c.id === card.id);
        if (cardIndex !== -1) {
          addToHistory(cards[cardIndex], 'Retroceder etapa', `De ${etapas[currentIndex]} para ${etapas[currentIndex - 1]}`);
          cards[cardIndex].etapa = etapas[currentIndex - 1];
          cards[cardIndex].dataAtualizacao = new Date().toISOString();
          saveCards(cards);
renderBoard(cards);
  
  setTimeout(scheduleTooltipsSequentially, 1000);
        }
      });
    }
  });

  cardElement.querySelector('.fluxo-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const targetFluxo = card.fluxo === 'comVeiculo' ? 'semVeiculo' : 'comVeiculo';
    const targetEtapa = mapEtapaToFluxo(card.etapa, card.fluxo, targetFluxo);
    if (card.fluxo === 'comVeiculo') {
      showConfirmModal('Deseja alterar para fluxo Sem Veículo?', () => {
        updateCardFluxo(card.id, targetFluxo, targetEtapa, 'Com Veículo → Sem Veículo');
      });
    } else {
      updateCardFluxo(card.id, targetFluxo, targetEtapa, 'Sem Veículo → Com Veículo');
    }
  });

  cardElement.querySelector('.editar-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    showCardModal(card, (cardData) => {
      const cards = getCards();
      const cardIndex = cards.findIndex(c => c.id === card.id);
      if (cardIndex !== -1) {
        const changes = [];
        if (cards[cardIndex].cliente !== cardData.cliente) changes.push('cliente');
        if (cards[cardIndex].transportadora !== cardData.transportadora) changes.push('transportadora');
        if (cards[cardIndex].valorNF !== cardData.valorNF) changes.push('valor NF');
        if (JSON.stringify(cards[cardIndex].etiquetas) !== JSON.stringify(cardData.etiquetas)) changes.push('etiquetas');
        if (changes.length > 0) {
          addToHistory(cards[cardIndex], 'Editar', `Campos alterados: ${changes.join(', ')}`);
        }
        cards[cardIndex] = { ...card, ...cardData };
        saveCards(cards);
        renderBoard(cards);
      }
    });
  });

  cardElement.querySelector('.excluir-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    showConfirmModal('Deseja excluir este card?', () => {
      const cards = getCards();
      const cardIndex = cards.findIndex(c => c.id === card.id);
      if (cardIndex !== -1) {
        addToHistory(cards[cardIndex], 'Excluir', `Card excluído: ${cards[cardIndex].cliente}`);
      }
      const filtered = getCards().filter(c => c.id !== card.id);
      saveCards(filtered);
      renderBoard(filtered);
    });
  });

  return cardElement;
}

function updateCardFluxo(cardId, targetFluxo, targetEtapa, detalhes) {
  const cards = getCards();
  const cardIndex = cards.findIndex(c => c.id === cardId);
  if (cardIndex !== -1) {
    addToHistory(cards[cardIndex], 'Alterar fluxo', detalhes);
    cards[cardIndex].fluxo = targetFluxo;
    cards[cardIndex].etapa = targetEtapa;
    cards[cardIndex].dataAtualizacao = new Date().toISOString();
    saveCards(cards);
    renderBoard(cards);
  }
}

function createColumn(etapa, fluxo) {
  const column = document.createElement('div');
  column.className = `column ${getColumnClass(etapa)}`;
  column.dataset.fluxo = fluxo;
  column.dataset.etapa = etapa;
  column.innerHTML = `
    <div class="column-header">
      <h3 class="column-title">${getColumnName(etapa)}</h3>
    </div>
    <div class="cards-container"></div>
  `;
  
  column.addEventListener('dragover', (e) => {
    e.preventDefault();
    const cardId = document.querySelector('.card.dragging')?.dataset.cardId;
    if (cardId) {
      const card = getCards().find(c => c.id === cardId);
      if (card) {
        const targetEtapas = column.dataset.fluxo === 'comVeiculo' ? ETAPAS_COM_VEICULO : ETAPAS_SEM_VEICULO;
        const currentIndex = (card.fluxo === 'comVeiculo' ? ETAPAS_COM_VEICULO : ETAPAS_SEM_VEICULO).indexOf(card.etapa);
        const targetIndex = targetEtapas.indexOf(column.dataset.etapa);
        const isMovingToEarlier = targetEtapas.slice(0, targetIndex + 1).includes(card.etapa) && targetIndex < currentIndex;
        const isChangingToSemVeiculo = column.dataset.fluxo === 'semVeiculo' && card.fluxo === 'comVeiculo';
        if (!isMovingToEarlier && !isChangingToSemVeiculo) column.classList.add('drag-over');
      }
    }
  });
  
  column.addEventListener('dragleave', () => column.classList.remove('drag-over'));
  
  column.addEventListener('drop', (e) => {
    e.preventDefault();
    column.classList.remove('drag-over');
    const cardId = e.dataTransfer.getData('text/plain');
    const cardsData = getCards();
    const cardIndex = cardsData.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;
    const card = cardsData[cardIndex];
    const targetFluxo = column.dataset.fluxo;
    const targetEtapa = column.dataset.etapa;
    
    if (card.fluxo !== targetFluxo) {
      if (card.fluxo === 'comVeiculo') {
        showConfirmModal('Deseja alterar para fluxo Sem Veículo?', () => finalizeDrop(cardsData, cardIndex, card, targetFluxo, targetEtapa));
      } else {
        finalizeDrop(cardsData, cardIndex, card, targetFluxo, targetEtapa);
      }
    } else {
      const etapas = card.fluxo === 'comVeiculo' ? ETAPAS_COM_VEICULO : ETAPAS_SEM_VEICULO;
      const currentIndex = etapas.indexOf(card.etapa);
      const targetIndex = etapas.indexOf(targetEtapa);
      if (targetIndex < currentIndex) {
        showConfirmModal('Deseja retroceder esta etapa?', () => finalizeDrop(cardsData, cardIndex, card, targetFluxo, targetEtapa));
      } else if (targetIndex > currentIndex) {
        finalizeDrop(cardsData, cardIndex, card, targetFluxo, targetEtapa);
      }
    }
  });
  
  return column;
}

function finalizeDrop(cardsData, cardIndex, card, targetFluxo, targetEtapa) {
  const oldFluxo = cardsData[cardIndex].fluxo;
  const oldEtapa = cardsData[cardIndex].etapa;
  cardsData[cardIndex].fluxo = targetFluxo;
  cardsData[cardIndex].etapa = targetEtapa;
  cardsData[cardIndex].dataAtualizacao = new Date().toISOString();
  addToHistory(cardsData[cardIndex], 'Arrastar/Soltar', `De ${getColumnName(oldEtapa)} (${oldFluxo}) para ${getColumnName(targetEtapa)} (${targetFluxo})`);
  saveCards(cardsData);
  renderBoard(cardsData);
}

function getCards() {
  return cards;
}

async function saveCards(updatedCards) {
  cards = updatedCards;
  Storage.save(cards);
  if (typeof StorageProvider !== 'undefined' && StorageProvider.save) {
    StorageProvider.save(cards).catch(() => {});
  }
}

let tooltipInterval = null;
let tooltipCardIndex = 0;

function scheduleTooltipsSequentially() {
  if (tooltipInterval) clearInterval(tooltipInterval);
  
  tooltipInterval = setInterval(() => {
    // Don't show tooltips if any modal is open
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay && modalOverlay.classList.contains('hidden')) {
      const allCards = Array.from(document.querySelectorAll('.card.collapsed'));
      
      const sortedCards = allCards.sort((a, b) => {
        const colA = a.closest('.column');
        const colB = b.closest('.column');
        const fluxoA = colA?.dataset.fluxo;
        const fluxoB = colB?.dataset.fluxo;
        
        if (fluxoA !== fluxoB) {
          return fluxoA === 'comVeiculo' ? -1 : 1;
        }
        
        const etapaA = colA?.dataset.etapa;
        const etapaB = colB?.dataset.etapa;
        const etapas = fluxoA === 'comVeiculo' ? ETAPAS_COM_VEICULO : ETAPAS_SEM_VEICULO;
        
        if (etapaA !== etapaB) {
          return etapas.indexOf(etapaA) - etapas.indexOf(etapaB);
        }
        
        const allCols = document.querySelectorAll(`[data-fluxo="${fluxoA}"][data-etapa="${etapaA}"] .card.collapsed`);
        const indexA = Array.from(allCols).indexOf(a);
        const indexB = Array.from(allCols).indexOf(b);
        return indexA - indexB;
      });
      
      if (sortedCards.length === 0) return;
      
      const currentCard = sortedCards[tooltipCardIndex];
      const tooltip = currentCard.querySelector('.collapsed-tooltip');
      if (tooltip) {
        positionTooltip(tooltip, currentCard);
        setTimeout(() => {
          tooltip.classList.remove('visible');
          setTimeout(() => tooltip.classList.add('hidden'), 300);
        }, 3000);
      }
      
      tooltipCardIndex = (tooltipCardIndex + 1) % sortedCards.length;
    }
  }, 4000);
}

async function init() {
  let saved;
  
  // Use IndexedDB if available, fallback to localStorage
  if (typeof StorageProvider !== 'undefined' && StorageProvider.getAll) {
    try {
      saved = await StorageProvider.getAll();
    } catch (e) {
      saved = [];
    }
  } else {
    const data = localStorage.getItem('kanbanCards');
    saved = data ? JSON.parse(data) : null;
  }
  
  cards = saved && saved.length > 0 ? saved : [
    { id: generateId(), cliente: 'Cliente Exemplo Sem Veículo', notasFiscais: ['1001', '1002'], transportadora: 'Transportadora A', dataColeta: '2026-01-15', dataEntrega: '2026-01-20', valorNF: 1500.00, observacoes: 'Exemplo de observações', fluxo: 'semVeiculo', etapa: 'Reprogramacao', etiquetas: [{ tipo: 'customizacao', cor: '#28a745' }], dataCriacao: new Date().toISOString(), dataAtualizacao: new Date().toISOString() },
    { id: generateId(), cliente: 'Cliente Dois Sem Veículo', notasFiscais: ['1003'], transportadora: 'Transportadora X', dataColeta: '2026-02-10', dataEntrega: '2026-02-15', valorNF: 1800.00, observacoes: 'Outro exemplo', fluxo: 'semVeiculo', etapa: 'Reprogramacao', etiquetas: [{ tipo: 'etiquetaPronta', cor: '#007bff' }], dataCriacao: new Date().toISOString(), dataAtualizacao: new Date().toISOString() },
    { id: generateId(), cliente: 'Cliente Exemplo Com Veículo', notasFiscais: ['2001'], transportadora: 'Transportadora B', dataColeta: '2026-01-18', dataEntrega: '2026-01-25', valorNF: 2500.00, observacoes: 'Outro exemplo', fluxo: 'comVeiculo', etapa: 'Planejado', etiquetas: [{ tipo: 'etiquetaPronta', cor: '#007bff' }], dataCriacao: new Date().toISOString(), dataAtualizacao: new Date().toISOString() }
  ];
  
  if (saved && saved.length === 0) {
    await StorageProvider.save(cards);
  }
  
  renderBoard(cards);
  setTimeout(scheduleTooltipsSequentially, 1000);
  
  document.getElementById('theme-toggle').addEventListener('click', () => {
    if (document.body.classList.contains('dark-theme')) {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      document.getElementById('theme-toggle').innerHTML = '☀️ Tema';
      ThemeStorage.save('light');
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
      document.getElementById('theme-toggle').innerHTML = '🌙 Tema';
      ThemeStorage.save('dark');
    }
  });
  
  const currentTheme = ThemeStorage.load();
  if (currentTheme === 'light') {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
    document.getElementById('theme-toggle').innerHTML = '☀️ Tema';
  }
  
  document.getElementById('fullscreen-btn').addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  });
  
  document.getElementById('new-card-btn').addEventListener('click', () => {
    showCardModal(null, (cardData) => {
      saveCards([...getCards(), cardData]);
      renderBoard(getCards());
    });
  });

  document.getElementById('export-btn').addEventListener('click', () => {
    ExportService.triggerExport(getCards());
  });
  
  document.getElementById('history-all-btn').addEventListener('click', () => {
    showAllHistoryModal();
  });
  
  document.getElementById('modal-close').addEventListener('click', hideModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-overlay')) hideModal();
  });
  
  setInterval(() => {
    const lastUpdate = localStorage.getItem('kanbanCards_updated');
    const lastRendered = localStorage.getItem('kanbanCards_last_rendered');
    if (lastUpdate && lastRendered && lastUpdate !== lastRendered) {
      const savedCards = Storage.load();
      if (savedCards) {
        cards = savedCards;
        localStorage.setItem('kanbanCards_last_rendered', lastUpdate);
        renderBoard(cards);
      }
    }
  }, 2000);
  
  scheduleTooltipsSequentially();
}

function showHistoryModal(card) {
  const historicoHtml = card.historico && card.historico.length > 0 
    ? card.historico.slice().reverse().map(h => `
      <div class="history-item">
        <strong>${new Date(h.data).toLocaleString('pt-BR')}</strong> - ${h.acao}<br>
        <small>${h.detalhes || ''}</small>
      </div>
    `).join('')
    : '<p>Nenhuma movimentação registrada.</p>';
  
  showModal('Histórico do Card', `<div class="history-list">${historicoHtml}</div>`, `
    <button id="close-history" class="btn btn-secondary">Fechar</button>
  `);
  document.getElementById('close-history').onclick = hideModal;
}

function showAllHistoryModal() {
  const cards = getCards();
  const allHistory = [];
  
  cards.forEach(card => {
    if (card.historico && card.historico.length > 0) {
      card.historico.forEach(h => {
        allHistory.push({
          ...h,
          cliente: card.cliente,
          id: card.id
        });
      });
    }
  });
  
  allHistory.sort((a, b) => new Date(b.data) - new Date(a.data));
  
  const historyHtml = allHistory.length > 0 
    ? allHistory.map(h => `
      <div class="history-item">
        <strong>${new Date(h.data).toLocaleString('pt-BR')}</strong> - ${h.cliente}<br>
        <small>${h.acao}: ${h.detalhes || ''}</small>
      </div>
    `).join('')
    : '<p>Nenhuma movimentação registrada.</p>';
  
  showModal('Histórico Geral', `
    <div class="history-filter">
      <input type="text" id="history-search" placeholder="Pesquisar por cliente..." class="search-input" style="margin-bottom: 10px; width: 100%;">
    </div>
    <div class="history-list" id="history-list">${historyHtml}</div>
  `, `
    <button id="close-history-all" class="btn btn-secondary">Fechar</button>
  `);
  
  document.getElementById('close-history-all').onclick = hideModal;
  document.getElementById('history-search').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const items = document.querySelectorAll('.history-item');
    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(term) ? '' : 'none';
    });
  });
}

document.addEventListener('DOMContentLoaded', init);

// Order cards by collect date (dataColeta) within each column, oldest to newest

function orderCardsByCollectDate(cardsData) {
  const columns = {};
  cardsData.forEach(card => {
    const key = `${card.fluxo}-${card.etapa}`;
    if (!columns[key]) columns[key] = [];
    columns[key].push(card);
  });

  Object.values(columns).forEach(columnCards => {
    columnCards.sort((a, b) => new Date(a.dataColeta) - new Date(b.dataColeta));
  });
  return cardsData;
}
