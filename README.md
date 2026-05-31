# Kanban WAP - Evolução do Processo Logístico

Aplicação Kanban para gestão de processos logísticos com suporte a dois modos de operação.

## Funcionalidades

- **Fluxo Com Veículo**: Corte, Planejado, EmSeparação, Customizando, Embarcando, Finalizado
- **Fluxo Sem Veículo**: Reprogramação, Planejado, Separando, Customizando, Carga Pronta, Finalizado

## Modos de Operação

### Standalone (GitHub Pages)
- Sem backend necessário
- Persistência local via IndexedDB
- Funciona offline

Configure em `js/storage-provider.js`:
```javascript
const APP_MODE = 'standalone';
```

### Enterprise (Servidor Corporativo)
- Backend REST API
- WebSocket para sincronização em tempo real
- Banco PostgreSQL
- Autenticação JWT

Configure em `js/storage-provider.js`:
```javascript
const APP_MODE = 'enterprise';
```

## Executando

### Frontend (Standalone)
Abra `index.html` diretamente ou publique no GitHub Pages.

### Backend (Enterprise)
```bash
cd backend
npm install
npm run dev
```

### Docker
```bash
docker-compose up -d
```

## Estrutura

```
/js
  app.js              - Aplicação principal
  storage-provider.js - Camada de persistência (IndexedDB/API)
  repository.js       - CardRepository e exportação

/backend
  /src
    /controllers    - Lógica de negócio
    /routes         - Endpoints REST
    /database       - Prisma ORM
  prisma/
    schema.prisma   - Modelos do banco
```

## Exportação

Clique no botão "Exportar" para baixar dados em JSON ou CSV.