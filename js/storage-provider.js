// StorageProvider - Prepare for future IndexedDB migration
// Currently uses localStorage, but IndexedDB is ready for activation

const APP_MODE = 'standalone';

// IndexedDB implementation (ready for future use)
class IndexedDBStorage {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('kanbanDB', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => { this.db = request.result; resolve(); };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('cards')) {
          db.createObjectStore('cards', { keyPath: 'id' });
        }
      };
    });
  }

  async getAll() {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('cards', 'readonly');
      const store = transaction.objectStore('cards');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async save(cards) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('cards', 'readwrite');
      const store = transaction.objectStore('cards');
      cards.forEach(card => store.put(card));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

window.indexedDbStorage = new IndexedDBStorage();

// ExportService for JSON/CSV export
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
        <div class="modal-header"><h3 class="modal-title">Exportar Dados</h3><button class="modal-close">&times;</button></div>
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
    document.querySelector('.modal-close').onclick = () => modal.remove();
  }
}

window.ExportService = ExportService;

// Selects the preferred server to update data, with fallback to localStorage
class StorageProvider {
  constructor() {
    this.storage = window.indexedDbStorage; // Future-proofing for IndexedDB
  }
  async getCards() {
    try {
      return await this.storage.getAll();
    } catch (error) {
      console.error('Error fetching cards:', error);
      return [];
    }
  }
}

window.storageProvider = new StorageProvider();




