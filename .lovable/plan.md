
## Objetivo

Reequilibrar a tela do Paint para que a área de desenho fique centralizada e mais estreita, com ferramentas distribuídas em duas barras laterais (esquerda = criar, direita = editar) e a barra inferior dedicada a cores e ações finais. Sem barra de rolagem global.

## Nova estrutura visual

```text
┌─────────────────────── Header ───────────────────────┐
│                  Ateliê de Desenho                    │
├──────┬──────────────────────────────────────┬────────┤
│ Crear│                                      │ Editar │
│      │                                      │        │
│ Pinc.│         CANVAS (centralizado,        │ Selec. │
│ Lápis│          max-width ~ 60-65%)         │ Tesoura│
│ Mágic│                                      │        │
│ Borr.│                                      │        │
│ Tinta│                                      │        │
│ Cari.│                                      │        │
│ Form.│                                      │        │
│ Texto│                                      │        │
├──────┴──────────────────────────────────────┴────────┤
│  Paleta · Cor surpresa · Desfazer · Limpar · Salvar  │
└───────────────────────────────────────────────────────┘
```

## Mudanças em `src/routes/index.lazy.tsx`

1. Reorganizar `TOOL_GROUPS` em dois conjuntos:
   - `LEFT_TOOLS` (criação): `pincel`, `lapis`, `magico`, `borracha`, `tinta`, `carimbo`, `forma`, `texto`.
   - `RIGHT_TOOLS` (edição): `selecionar`, `tesoura`. Espaço reservado para futuros controles de edição.

2. Substituir o bloco atual (`<aside>` única + `<main>`) por três colunas dentro do wrapper flex (linhas 940–1091):
   - `<aside>` esquerda (`ref={asideLeftRef}`) — largura `w-16 md:w-20`, `shrink-0`, `min-h-0 overflow-y-auto`, renderiza `LEFT_TOOLS` com `ToolButton`.
   - `<main>` central — `flex-1 min-w-0 min-h-0 flex flex-col items-center`. O canvas container passa a usar `w-full max-w-[min(65%,900px)] mx-auto flex-1` para limitar a largura. Microinstrução e overlay de texto permanecem dentro dessa coluna.
   - `<aside>` direita (`ref={asideRightRef}`) — mesma largura/estilo da esquerda, renderiza `RIGHT_TOOLS`.

3. Barra inferior: mover para fora do `<main>`, como filho direto do container vertical (irmã do `flex-1` central), garantindo que a paleta + ações ocupem toda a largura útil abaixo das três colunas. Manter `shrink-0` e estilo atual.

4. Painéis flutuantes (`renderPanel` + `ToolPanel`): sem alteração de lógica; apenas garantir que `panelAnchor` continue sendo o botão clicado em qualquer das duas sidebars (já é, pois usa o `ev.currentTarget`). Os popovers já são renderizados via `createPortal` no `document.body`, então não herdam overflow.

5. Ajustar `ResizeObserver` do canvas (se necessário) para reagir à nova largura — já observa `containerRef`, então funciona automaticamente.

## Requisitos técnicos garantidos

- Wrapper raiz mantém `flex h-dvh flex-col overflow-hidden`.
- Linha central usa `flex flex-1 min-h-0 gap-2 overflow-hidden`.
- Cada `<aside>` lateral: `shrink-0`, largura fixa moderada, `min-h-0`, scroll interno só se necessário.
- `<main>` central: `flex-1 min-w-0 min-h-0`, com canvas em `max-w-[min(65%,900px)] w-full mx-auto flex-1`.
- Barra inferior: `shrink-0`, fora do `<main>`, ocupando largura total.
- Sem `overflow-y` no body/root (já garantido em `styles.css`).
- Popovers continuam via portal, sem herdar overflow.

## Arquivos afetados

- `src/routes/index.lazy.tsx` — única alteração estrutural (reagrupar tools, dividir aside, mover bottom bar, limitar largura do canvas).

Nenhuma mudança em `ToolPanel`, `ToolButton`, `ActionButton`, `styles.css` ou `WelcomeScreen`.

## Validação

Testar em 698×606 (viewport atual), 1280×720 e 1024×600:
- Sem scrollbar global.
- Canvas centralizado e visivelmente mais estreito que antes.
- Botões das duas sidebars totalmente visíveis.
- Popovers de Carimbos/Formas/Tamanhos abrindo ao lado do botão clicado, em ambas as sidebars.
- Barra inferior completa e legível.
