# Corrigir painéis secundários do Paint

## Problema

Hoje os painéis de Carimbos, Formas e Tamanhos são renderizados **dentro** do `<aside>` da sidebar (`src/routes/index.lazy.tsx`, linha 970 — `renderPanel()` dentro do aside com `overflow-y: auto`). Por isso ficam cortados, geram rolagem e parecem "presos" à barra lateral.

## Solução

Renderizar os painéis em uma camada independente via React Portal (`document.body`), ancorados ao botão clicado e com posicionamento inteligente baseado no espaço disponível na janela.

## Mudanças

### 1. Novo componente `src/components/paint/ToolPanel.tsx`
- Recebe `anchorEl` (HTMLElement do botão clicado), `onClose`, `title` e `children`.
- Renderiza via `createPortal` em `document.body` (fora de qualquer container com overflow).
- Posicionamento inteligente em `useLayoutEffect`:
  - Lê `anchorEl.getBoundingClientRect()` e o tamanho do próprio painel.
  - **Horizontal:** tenta abrir à direita do botão (`right + 8px`); se ultrapassar `window.innerWidth - 12px`, abre à esquerda (`left - panelWidth - 8px`); se ainda não couber, em telas estreitas centraliza como mini-modal sobre o canvas.
  - **Vertical:** alinha pelo topo do botão; se ultrapassar `window.innerHeight - 12px`, sobe; nunca abaixo de `12px` do topo.
  - Recalcula em `resize` e `scroll` da janela.
- Estilo: `position: fixed`, `z-50`, fundo branco, borda `#1B6CA7`, sombra suave, cantos arredondados, fonte Poppins, padding confortável.
- Fechamento automático:
  - Click/touch fora (`mousedown`/`touchstart` no `document`, ignorando o `anchorEl`).
  - Tecla `Escape`.
  - Quando o filho chamar `onClose` após uma seleção (já é o comportamento atual via `setOpenPanel(null)`).

### 2. Refatorar `renderPanel()` em `src/routes/index.lazy.tsx`
- Guardar a ref do botão clicado (`anchorRef`) em vez de `panelTop`. Atualizar `selectTool` para receber/armazenar `ev.currentTarget`.
- Substituir o `<div className="absolute z-30 ...">` (linhas 917–930) por `<ToolPanel anchorEl={anchor} onClose={() => setOpenPanel(null)} title={title}>{body}</ToolPanel>`.
- Mover a chamada `{renderPanel()}` para **fora** do `<aside>` (o portal não precisa estar dentro, e isso elimina qualquer herança de overflow).
- Remover lógica antiga de `panelTop`/`panelRef` que dependia do aside.

### 3. Ajustes de layout dos painéis
- Carimbos: manter grid `grid-cols-4` (já bom), painel ~`w-64`.
- Formas: grid `grid-cols-2` (já bom), painel ~`w-56`.
- Tamanhos (pincel/borracha): `flex` horizontal (já bom), painel ~`w-56`.
- Tamanho do texto: trocar empilhamento atual por linha horizontal com 3 botões grandes.
- Garantir que nenhum painel use `overflow` interno (altura auto).

### 4. Sidebar
- Continua com `overflow-y-auto` para os botões principais, mas sem mais painéis dentro dela — nada empurra/corta.

## Critérios de sucesso

- Clicar em Carimbos/Formas/Tamanhos abre painel totalmente visível ao lado do botão.
- Painel nunca fica cortado nem cria scroll interno.
- Em viewport estreita (≤698px como o atual), o painel reposiciona para caber.
- Painel fecha ao selecionar opção, clicar fora, `Esc` ou trocar de ferramenta.
- Sidebar mostra apenas botões principais.

## Detalhes técnicos

- Portal: `createPortal(node, document.body)` — SSR-safe usando `useEffect`/`useState` para `mounted`.
- Listener de "click fora": registrado em `pointerdown` no `document`, removido no unmount.
- `useLayoutEffect` para medir antes do paint e evitar flicker.
- Sem dependências novas; apenas React + Tailwind.
