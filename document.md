# Documento de Especificação de Recursos e Funcionalidades
## Sistema Kanban de Logística - WAP

### Visão Geral
Este documento descreve todos os recursos e funcionalidades implementadas no sistema Kanban de controle de processos logísticos desenvolvido para a WAP. O sistema permite visualizar e gerenciar o fluxo de processos em duas categorias: "Com Veículo" e "Sem Veículo", com possibilidade de movimentação entre etapas e entre fluxos.

---

## 1. Interface do Usuário

### 1.1 Layout Principal
- **Cabeçalho** com logos da WAP e WAAW
- **Título principal**: "Evolução do Processo Logístico"
- **Barra de ações** contendo:
  * Botão para alternar tema (claro/escuro) - 🌙 Tema / ☀️ Tema
  * Botão para modo tela cheia - 🔍 Tela Cheia
  * Botão para criar novo card - + Novo Card
  * Botão para histórico geral - 📋 Histórico Geral

### 1.2 Estrutura do Kanban
- Duas seções principais representando os fluxos exibidos lado a lado:
  * **Fluxo Com Veículo** (esquerda)
  * **Fluxo Sem Veículo** (direita)
- Cada fluxo contém colunas representando etapas específicas do processo
- Colunas "Corte" e "Carga Pronta Sem Veículo" possuem estilização especial (borda e fundo destacados em vermelho)

### 1.3 Etapas por Fluxo
**Fluxo Com Veículo:**
1. Corte
2. Planejado
3. Em Separação
4. Customizando
5. Embarcando
6. Finalizado

**Fluxo Sem Veículo:**
1. Reprogramação
2. Planejado Sem Veículo
3. Separando Sem Veículo
4. Customizando Sem Veículo
5. Carga Pronta Sem Veículo
6. Finalizado Sem Veículo

### 1.4 Visualização de Cards
Cada card exibe:
- Nome do cliente/HUB (clicável para recolher/expandir)
- Indicadores visuais coloridos (círculos) para:
  * Customização (verde)
  * Etiqueta Pronta (azul)
  * Carga Batida (rosa)
  * Carga Consolidada (amarelo)
- Informações resumidas (visíveis quando expandido):
  * Notas Fiscais
  * Transportadora
  * Data de Coleta
  * Data de Entrega
  * Valor NF (formatado em BRL)
- Observações (quando existe)
- Tooltip automático para cards recolhidos (cíclico, 4 segundos)
- Barra de ações com botões (visíveis ao passar o mouse):
  * 🔄 Alterar Fluxo
  * ◀ Voltar (etapa anterior)
  * ▶ Avançar (próxima etapa)
  * ✏️ Editar
  * 🗑️ Excluir
  * 📋 Histórico

### 1.5 Barras de Resumo
- **Barra Superior** (Fluxo Com Veículo): scrolling horizontal infinito contínuo
- **Barra Inferior** (Fluxo Sem Veículo): scrolling horizontal infinito contínuo
- Cada item da barra mostra: nome do cliente - valor NF formatado
- Ao final da lista são exibidos:
  * Totais de cada coluna que possuem cards (coluna: valor total)
  * Total geral do fluxo completo
- Ciclo de animação: 35 segundos
- Posicionamento: Uma barra acima e outra abaixo de cada fluxo

### 1.6 Modais
**Modal de Cadastro/Edição:**
- Campos obrigatórios marcados com asterisco (*)
- Cliente/HUB (texto, obrigatório, auto-converte para MAIÚSCULO)
- Notas Fiscais (texto, obrigatório, múltiplos separados por vírgula, auto-converte para MAIÚSCULO)
- Transportadora (texto, obrigatório, auto-converte para MAIÚSCULO)
- Data de Coleta (seletor de data, obrigatório)
- Data de Entrega (seletor de data, obrigatório)
- Valor NF (campo numérico com duas casas decimais, obrigatório)
- Fluxo (seletor: Sem Veículo / Com Veículo)
- Observações (área de texto, opcional, auto-converte para MAIÚSCULO)
- Indicadores (caixas de seleção):
  * Customização
  * Etiqueta Pronta
  * Carga Batida
  * Carga Consolidada
- Layout em grid 2x2 para os checkboxes de indicadores

**Modal de Confirmação:**
- Utilizado para ações que requerem validação do usuário
- Mensagem personalizável baseada na ação
- Botões "Sim" e "Não" com estilos distintos

**Modal de Histórico do Card:**
- Acesso via botão 📋 no card
- Lista todos os eventos do card em ordem cronológica inversa
- Campos: Data/Hora, Ação, Detalhes, Fluxo, Etapa
- Campo de busca por nome do cliente (filtro em tempo real, case-insensitive)

---

## 2. Funcionalidades de Dados

### 2.1 Armazenamento
- Persistência utilizando `localStorage`
- Chave principal: `kanbanCards` (armazena array de objetos card)
- Chave de sincronização: `kanbanCards_updated` (timestamp para polling multi-dispositivo)
- Chave de tema: `kanbanTheme` (preferência do usuário)
- Chave de colapso: `kanbanCollapsedCards` (IDs dos cards recolhidos)
- Formato: Array JSON de objetos card
- Funciona offline após carregamento inicial

### 2.2 Estrutura do Card
Cada card possui os seguintes atributos:
- `id`: Identificador único (gerado automaticamente via timestamp + string aleatória)
- `cliente`: Nome do cliente/HUB
- `notasFiscais`: Array de strings (números das NFs)
- `transportadora`: Nome da transportadora
- `dataColeta`: Data no formato ISO string
- `dataEntrega`: Data no formato ISO string
- `valorNF`: Valor numérico da nota fiscal
- `observacoes`: Texto livre para observações
- `fluxo`: String (`semVeiculo` ou `comVeiculo`)
- `etapa`: Etapa atual do processo
- `etiquetas`: Array de objetos com `tipo` e `cor`
- `dataCriacao`: Timestamp de criação (ISO string)
- `dataAtualizacao`: Timestamp da última atualização (ISO string)
- `historico`: Array de objetos de auditoria (cada entrada contém: `data`, `acao`, `detalhes`, `fluxo`, `etapa`)

### 2.3 Formatação de Dados
- **Moeda**: Valores NF exibidos no formato Brasileiro Real (BRL) via `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
- **Datas**: Exibidas no formato brasileiro (DD/MM/AAAA) via `toLocaleDateString('pt-BR')`
- **Texto**: Todos os campos de texto são automaticamente convertidos para MAIÚSCULO

### 2.4 Dados de Exemplo
O sistema inicializa com três cards de exemplo caso não exista dados previamente armazenados:
1. Card no fluxo "Sem Veículo" na etapa "Reprogramação"
2. Card no fluxo "Sem Veículo" na etapa "Planejado Sem Veículo"
3. Card no fluxo "Com Veículo" na etapa "Planejado"

---

## 3. Funcionalidades Principais

### 3.1 Gerenciamento de Cards (CRUD)
**Criação (Create):**
- Via botão "+ Novo Card" no cabeçalho
- Abertura de modal com formulário completo
- Validação de campos obrigatórios antes do salvamento
- Geração automática de ID único (timestamp + string aleatória)
- Definição automática da etapa inicial baseada no fluxo selecionado (`Planejado` para comVeiculo, `PlanejadoSemVeiculo` para semVeiculo)
- Registro automático de `dataCriacao` e `dataAtualizacao`
- Conversão automática de texto para MAIÚSCULO
- Salvamento imediato no localStorage e atualização da visualização

**Leitura (Read):**
- Cards renderizados em colunas organizadas por fluxo e etapa
- Ordenação automática por data de criação (mais recentes primeiro)

**Edição (Update):**
- Acesso via botão de edição (✏️) no card
- Modal pré-preenchido com dados atuais do card
- Todos os campos modificáveis: cliente, notasFiscais, transportadora, dataColeta, dataEntrega, valorNF, observacoes, fluxo, etiquetas
- Registro de alteração no histórico do card
- Preserva ID original e timestamp de criação
- Atualiza `dataAtualizacao`
- Conversão automática de texto para MAIÚSCULO

**Exclusão (Delete):**
- Acesso via botão de exclusão (🗑️) no card
- Requer confirmação através do modal de confirmação
- Registro da exclusão no histórico antes da remoção
- Remove permanentemente do localStorage
- Atualização imediata da visualização

### 3.2 Navegação entre Etapas
**Avançar Etapa:**
- Via botão "▶ Avançar" no card
- Move o card para a etapa subsequente no mesmo fluxo
- Não requer confirmação
- Registra evento no histórico
- Atualiza `dataAtualizacao`

**Retroceder Etapa:**
- Via botão "◀ Voltar" no card
- Move o card para a etapa anterior no mesmo fluxo
- **Requer confirmação** através do modal
- Registra evento no histórico
- Atualiza `dataAtualizacao`

### 3.3 Alteração de Fluxo
**Com Veículo → Sem Veículo:**
- Via botão "🔄 Alterar Fluxo" ou drag-and-drop
- **Requer confirmação** através do modal
- Mapeia automaticamente para a etapa correspondente no fluxo destino
- Registra evento no histórico
- Atualiza `dataAtualizacao`

**Sem Veículo → Com Veículo:**
- Via botão "🔄 Alterar Fluxo" ou drag-and-drop
- **Não requer confirmação**
- Mapeia automaticamente para a etapa correspondente no fluxo destino
- Registra evento no histórico
- Atualiza `dataAtualizacao`

### 3.4 Mapeamento de Etapas entre Fluxos
Ao mudar de fluxo, as etapas são convertidas conforme o seguinte mapa:

**Sem Veículo → Com Veículo:**
- Reprogramacao → Corte
- PlanejadoSemVeiculo → Planejado
- SeparandoSemVeiculo → EmSeparacao
- CustomizandoSemVeiculo → Customizando
- CargaProntaSemVeiculo → Embarcando
- FinalizadoSemVeiculo → Finalizado

**Com Veículo → Sem Veículo:**
- Corte → Reprogramacao
- Planejado → PlanejadoSemVeiculo
- EmSeparacao → SeparandoSemVeiculo
- Customizando → CustomizandoSemVeiculo
- Embarcando → CargaProntaSemVeiculo
- Finalizado → FinalizadoSemVeiculo

### 3.5 Funcionalidade de Arrastar e Soltar (Drag and Drop)
- Implementação via HTML5 Drag and Drop API
- Cards possuem `draggable="true"`
- Eventos manipulados: `dragstart`, `dragend`, `dragover`, `dragleave`, `drop`
- Cards podem ser arrastados entre colunas dentro do mesmo fluxo
- Cards podem ser arrastados entre os dois fluxos (quadros)
- Feedback visual durante o arrasto:
  * Elemento arrastado: opacidade reduzida (0.5) e rotação de 5 graus
  * Área de destino: borda tracejada azul e fundo azul translúcido
- Lógica de confirmação durante drop:
  * Mudança de Com Veículo para Sem Veículo: **requer confirmação**
  * Movimento para etapa anterior (retrocesso): **requer confirmação**
  * Movimento para etapa subsequente (avanço): **não requer confirmação**
  * Mudança de Sem Veículo para Com Veículo: **não requer confirmação**
- Após confirmação (ou quando não necessária):
  * Atualiza fluxo e/ou etapa conforme destino
  * Registra evento no histórico do card
  * Atualiza `dataAtualizacao`
  * Salva alterações e atualiza a visualização

### 3.6 Histórico e Auditoria
**Histórico por Card:**
- Cada card mantém um registro completo de todas as ações realizadas
- Eventos registrados: criação, edição, avanço de etapa, retrocesso de etapa, alteração de fluxo (via botão), alteração de fluxo (via drag-and-drop), exclusão
- Visualização via modal acessado pelo botão 📋 no card
- Exibição em ordem cronológica inversa (mais recentes primeiro)
- Campos exibidos: Data/Hora, Ação, Detalhes, Fluxo, Etapa

**Histórico Geral:**
- Acesso via botão "📋 Histórico Geral" no cabeçalho
- Exibe todos os eventos de todos os cards combinados
- Ordenado por data (mais recentes primeiro)
- Campo de busca por nome do cliente (filtro em tempo real, case-insensitive)

### 3.7 Recolhimento de Cards (Collapse)
- Quando múltiplos cards existem na mesma coluna, apenas o primeiro é exibido expandido
- Os demais são exibidos em formato recolhido (apenas nome do cliente)
- Clique no nome do cliente para alternar entre recolhido e expandido
- Estado de recolhimento é salvo no localStorage e restaurado ao recarregar
- Tooltip automático exibe: cliente, data de coleta, data de entrega, valor NF
- Ciclagem sequencial dos tooltips a cada 4 segundos, percorrendo todos os cards recolhidos de cima para baixo, por coluna

### 3.8 Sincronização Multi-dispositivo
- Polling automático a cada 2 segundos via localStorage
- Compara timestamp `kanbanCards_updated` para detectar mudanças externas
- Atualiza visualização automaticamente quando alterações são detectadas de outras abas/dispositivos
- Permite múltiplos usuários visualizarem o mesmo quadro em tempo real

### 3.9 Personalização de Tema
- Alternância entre tema claro e escuro
- Preferência do usuário salva no localStorage (chave: `kanbanTheme`)
- Aplicado automaticamente ao carregar a aplicação
- Tema escuro como padrão inicial
- Botão de tema atualiza seu ícone conforme o estado atual:
  * Tema escuro: mostra ☀️
  * Tema claro: mostra 🌙

### 3.10 Modo Tela Cheia
- Ativa/desativa o modo tela cheia do navegador
- Utiliza a API nativa de tela cheia (Fullscreen API)
- Compatível com os principais navegadores modernos
- Alternância através do botão no cabeçalho

---

## 4. Características Técnicas

### 4.1 Arquitetura
- Arquitetura baseada em single-page application (SPA)
- `index.html`: Estrutura HTML base
- `js/app.js`: Toda a lógica da aplicação (funções organizadas por responsabilidade)
- `css/style.css`: Toda a estilização com suporte a temas claro/escuro
- Sem dependências externas ou bibliotecas de terceiros
- Storage, UI, eventos e renderização centralizados para simplicidade

### 4.2 Tratamento de Eventos
- Delegação de eventos para elementos dinâmicos
- Prevenção de comportamento padrão em eventos de arrastar/soltar
- Uso de `stopPropagation()` para evitar disparo acidental de eventos
- Separação clara entre eventos de interface e lógica de negócios

### 4.3 Experiência do Usuário
- Feedback visual imediato para ações do usuário
- Confirmação explícita para ações potencialmente destrutivas (exclusão, retrocesso, mudança Com→Sem)
- Estado visual claro indicando ações disponíveis (cores, ícones, tooltips)
- Design responsivo adaptável a diferentes resoluções
- Tooltips informativos para cards recolhidos
- Animações de scrolling infinito nas barras de resumo
- Transições suaves em modais e tooltips

### 4.4 Persistência de Estado
- Todos os dados salvos automaticamente após modificações
- Estado da interface (tema, cards recolhidos) persistido entre sessões
- Recuperação automática de dados ao carregar a aplicação
- Proteção contra perda de dados
- Suporte a sincronização entre múltiplas abas/dispositivos

---

## 5. Detalhes de Layout, Paleta de Cores e Estilização

### 5.1 Layout Geral
- **Reset CSS**: `margin: 0; padding: 0; box-sizing: border-box` aplicado universalmente
- **Layout baseado em Flexbox**: Estruturas principais organizadas com flexbox
- **Altura total da viewport**: `height: 100vh` no corpo para ocupar toda a tela
- **Overflow oculto**: `overflow: hidden` para evitar scroll da página inteira (scroll interno nos containers)
- **Direção de coluna**: Layout principal organizado em coluna (header + main)
- **Imagem de fundo**: Logo WAP com opacidade 0.05, posicionamento fixo, tamanho 600px

### 5.2 Estrutura de Layout
1. **Header** (fixo no topo)
   - Display flex com `justify-content: space-between`
   - Alinhamento vertical centralizado
   - Padding: 15px 20px
   - Altura automática baseada no conteúdo

2. **Main Container** (`kanban-container`)
   - Flex: 1 (ocupa espaço restante disponível)
   - Direção de coluna
   - Padding: 10px
   - Overflow: hidden
   - Position: relative

3. **Flux Sections** (Com Veículo e Sem Veículo)
   - Flex: 1 (distribui espaço igualmente entre os dois fluxos)
   - Direção de coluna
   - Min-height: 0 (para permitir redução em telas pequenas)

4. **Board Columns**
   - Display flex
   - Gap: 8px (espaçamento entre colunas)
   - Flex: 1 (ocupa espaço disponível)

5. **Individual Columns**
   - Flex: 1 (distribui espaço igualmente entre colunas do mesmo fluxo)
   - Direção de coluna
   - Border-radius: 4px
   - Overflow: visible (necessário para drag-over effects)

6. **Cards Containers**
   - Flex: 1 (ocupa espaço vertical disponível na coluna)
   - Padding: 8px
   - Overflow-y: auto (scroll vertical quando necessário)
   - Min-height: 100px

### 5.3 Paleta de Cores

#### Tema Escuro (dark-theme) - Padrão
- **Body Background**: `#1a1a1a`
- **Body Text**: `#fff`
- **Header Background**: `#2d2d2d`
- **Header Border Bottom**: `2px solid #4a90d9`
- **Header Title**: `#4a90d9` (tamanho: 24px)
- **Primary Button**: `#4a90d9` (hover: `#357abd`)
- **Secondary Button**: `#666` (hover: `#777`)
- **Fluxo Title Background**: `#2d2d2d`
- **Fluxo Title Border Left**: `4px solid #4a90d9`
- **Column Background**: `#252525`
- **Special Columns** (Corte e Carga Pronta Sem Veículo):
  * Border: `5px solid #ff6b6b !important`
  * Background: `#2a1a1a !important`
- **Column Title Background**: `#333`
- **Column Title Border Bottom**: `1px solid #444`
- **Cards Container Background**: Transparente
- **Card Background**: `#383838`
- **Card Border Left**: `4px solid #555` (padrão, alterado por indicadores)
- **Card Header Text**: Cliente: `#fff` (bold, 14px)
- **Card Info Text**: `#ccc` (12px)
- **Scrollbar Track**: `#333`
- **Scrollbar Thumb**: `#555` (border-radius: 3px)
- **Drag Over Background**: `rgba(74, 144, 209, 0.2)`
- **Drag Over Border**: `2px dashed #4a90d9`
- **Modal Background**: `#2d2d2d`
- **Modal Header Border Bottom**: `1px solid #444`
- **Modal Body Background**: Transparente
- **Form Elements**: Background: `#333`, Border: `1px solid #555`, Text: `#fff`

#### Tema Claro (light-theme)
- **Body Background**: `#f5f5f5`
- **Body Text**: `#333`
- **Header Background**: `#e0e0e0`
- **Header Border Bottom**: `2px solid #1976d2`
- **Header Title**: `#1976d2` (tamanho: 24px)
- **Primary Button**: `#1976d2` (hover: `#1565c0`)
- **Secondary Button**: `#ddd` (hover: `#ccc`)
- **Fluxo Title Background**: `#e0e0e0`
- **Fluxo Title Border Left**: `4px solid #1976d2`
- **Column Background**: `#e8e8e8`
- **Special Columns** (Corte e Carga Pronta Sem Veículo):
  * Border: `5px solid #dc3545 !important`
  * Background: `#fff5f5 !important`
- **Column Title Background**: `#d0d0d0`
- **Column Title Border Bottom**: `1px solid #ccc`
- **Cards Container Background**: Transparente
- **Card Background**: `#ffffff`
- **Card Border Left**: `4px solid #999` (padrão, alterado por indicadores)
- **Card Header Text**: Cliente: `#333` (bold, 14px)
- **Card Info Text**: `#666` (12px)
- **Scrollbar Track**: `#e0e0e0`
- **Scrollbar Thumb**: `#999` (border-radius: 3px)
- **Drag Over Background**: `rgba(25, 118, 210, 0.2)`
- **Drag Over Border**: `2psolid #1976d2`
- **Modal Background**: `#f5f5f5`
- **Modal Header Border Bottom**: `1px solid #ccc`
- **Modal Body Background**: Transparente
- **Form Elements**: Background: `#fff`, Border: `1px solid #ccc`, Text: `#333`

### 5.4 Indicadores de Status (Cores)
- **Customização** (verde): `#28a745`
- **Etiqueta Pronta** (azul): `#007bff`
- **Carga Batida** (rosa): `#e83e8c`
- **Carga Consolidada** (amarelo): `#ffc107`

**Efeito nos Cards:**
Quando um card possui um indicador, sua borda esquerda muda para a cor correspondente:
- Customização: `border-left-color: #28a745`
- Etiqueta Pronta: `border-left-color: #007bff`
- Carga Batida: `border-left-color: #e83e8c`
- Carga Consolidada: `border-left-color: #ffc107`

**Efeito de Fundo em Colunas Especiais:**
- Tema Claro (Corte): card com customização → `#f0fff0`, com etiqueta pronta → `#f8f8ff`
- Tema Escuro (Corte): card com customização → `#1a2a1a`, com etiqueta pronta → `#1a1a2a`
- Tema Claro (Carga Pronta Sem Veículo): card com customização → `#f0fff0`, com etiqueta pronta → `#f8f8ff`
- Tema Escuro (Carga Pronta Sem Veículo): card com customização → `#1a2a1a`, com etiqueta pronta → `#1a1a2a`, com carga batida → `#2a1a1a`, com carga consolidada → `#2a2a1a`

### 5.5 Estilização de Componentes Específicos

#### Cards
- **Padding**: `10px`
- **Margin Bottom**: `8px`
- **Border Radius**: `6px`
- **Cursor**: `default` (muda para `grabbing` durante arraste)
- **Position**: Relative
- **Hover**: Exibe botões de ação

#### Card Header
- **Display**: Flex
- **Justify Content**: Space-between
- **Margin Bottom**: `8px`

#### Card Cliente
- **Font Weight**: Bold
- **Font Size**: `14px`
- **Cursor**: Pointer (para toggle collapse)
- **Hover**: Subtle highlight

#### Card Actions
- **Display**: Flex
- **Gap**: `5px`
- **Visibilidade**: Aparecem ao passar o mouse sobre o card

#### Card Buttons
- **Background**: Transparente
- **Border**: None
- **Padding**: `2px 6px`
- **Border Radius**: `3px`
- **Font Size**: `12px`
- **Cursor**: Pointer

#### Tooltip para Cards Recolhidos
- **Posição**: Ligeiramente abaixo do topo e à direita
- **Duração**: 3 segundos visível
- **Transição**: Fade suave de 0.3s (opacity)
- **Conteúdo**: Nome do cliente, Data de Coleta, Data de Entrega, Valor NF
- **Estilo**: Post-it colorido conforme tema (amarelado tema escuro, rosa tema claro)
- **Ciclagem**: Automática a cada 4 segundos, sequencial de cima para baixo por coluna

#### Efeitos de Arrastar e Soltar
- **Card Dragging**: Opacity 0.5, transform rotate(5deg)
- **Column Drag Over**: Borda tracejada azul, fundo translúcido azul
- **Cards Container Drag Over**: Borda tracejada azul, fundo translúcido azul

#### Scrollbars (WebKit)
- **Width**: `6px`
- **Track**: Cores conforme tema
- **Thumb**: Cores conforme tema, border-radius 3px

#### Modais
- **Overlay**: Position fixed, fundo rgba(0,0,0,0.8), z-index 1000
- **Modal**: Border-radius 8px, width 90%, max-width 500px, max-height 90vh
- **Modal Header**: Padding 15px 20px, flex space-between
- **Modal Body**: Padding 20px, overflow-y auto
- **Form Layout**: Grid 2 colunas para campos, checkboxes em grid 2x2
- **Modal Footer**: Padding 15px 20px, flex end

### 5.6 Media Queries (Responsividade)

#### Telas Largas (min-width: 1920px)
- **Fluxo Title**: Font size: 20px
- **Column Title**: Font size: 14px, Padding: 12px
- **Card Cliente**: Font size: 15px
- **Card Info**: Font size: 13px
- **Header Title**: Font size: 28px

#### Telas Médias/Largura Limitada (max-width: 1366px)
- **Fluxo Title**: Font size: 16px
- **Column Title**: Font size: 12px
- **Card Cliente**: Font size: 13px
- **Card Info**: Font size: 11px
- **Checkbox Group**: Grid Template Columns: 1fr (muda de 2 colunas para 1)

### 5.7 Estrutura de Classes e Seletores Principais

#### Seletores de Tema
- `body.dark-theme`: Aplica todas as variáveis do tema escuro
- `body.light-theme`: Aplica todas as variáveis do tema claro

#### Seletores de Estado
- `.hidden`: `display: none` (usado para modais)
- `.dragging`: Aplica opacidade e transform ao card sendo arrastado
- `.drag-over`: Aplica estilo de sobreposição às áreas de drop válidas
- `.column.drag-over`: Estilo específico para colunas em estado de drag-over

#### Seletores de Estrutura
- `.kanban-container`: Container principal
- `.fluxo-section`: Seções de fluxo
- `.board-columns`: Container de colunas
- `.column`: Colunas individuais
- `.cards-container`: Container de cards dentro das colunas
- `.card`: Cards individuais
- `.card-header`: Cabeçalho do card
- `.card-cliente`: Nome do cliente
- `.card-actions`: Container de botões de ação
- `.card-btn`: Botões de ação individuais
- `.card-info`: Informações detalhadas do card
- `.card-indicators`: Container de indicadores
- `.indicator`: Indicadores individuais de status
- `.modal-overlay`: Overlay do modal
- `.modal`: Container do modal
- `.modal-header`: Cabeçalho do modal
- `.modal-body`: Corpo do modal
- `.modal-footer`: Rodapé do modal
- `.form-row`: Linhas do formulário
- `.checkbox-group`: Grupo de checkboxes

#### Seletores de Estado Especiais
- `.card.has-customizacao`: Cards com indicador de customização
- `.card.has-etiquetaPronta`: Cards com indicador de etiqueta pronta
- `.card.has-cargaBatida`: Cards com indicador de carga batida
- `.card.has-cargaConsolidada`: Cards com indicador de carga consolidada
- `.card.collapsed`: Cards recolhidos (info oculta)
- `.column.corte`: Coluna de corte (estilo especial)
- `.column.carga-pronta-sem-veiculo`: Coluna de carga pronta sem veículo (estilo especial)
- `.summary-total`: Totais na barra de resumo
- `.summary-column-total`: Total de coluna específica na barra de resumo
- `.collapsed-tooltip`: Tooltip para cards recolhidos
- `.collapsed-tooltip.visible`: Tooltip visível (com fade)

---

## 6. Requisitos do Sistema
- Navegador web moderno com suporte a:
  * HTML5
  * CSS3
  * JavaScript ES6+
  * API de Arrastar e Soltar (HTML5 Drag and Drop)
  * API de Tela Cheia (Fullscreen API)
  * Web Storage (localStorage)
  * Pseudo-elementos ::before e ::after
  * Flexbox Layout
  * CSS Grid Layout (limitado ao grupo de checkboxes)
  * Media Queries
- Não requer dependências externas ou bibliotecas de terceiros
- Funciona offline após o carregamento inicial
- Compatível com:
  * Desktop: Chrome, Firefox, Safari, Edge
  * Mobile: Chrome Mobile, Safari Mobile (com limitações de arrastar/soltar em alguns dispositivos)
