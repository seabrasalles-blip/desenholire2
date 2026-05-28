## Objetivo
Eliminar a barra de rolagem vertical na tela inicial e no Paint, garantindo que a interativa caiba sempre na altura disponível (incluindo dentro de iframe na plataforma).

## 1. CSS global (`src/styles.css`)
Adicionar no `@layer base`:
- `html, body, #root { height: 100%; margin: 0; overflow: hidden; overscroll-behavior: none; }`
- Garantir que nada herde `min-height: 100vh` extra.

## 2. Tela inicial (`src/components/paint/WelcomeScreen.tsx`)
Reorganizar para caber em 100dvh sem rolagem:
- Container raiz: `h-dvh w-full overflow-hidden flex items-center justify-center p-3 sm:p-4`.
- Card principal: remover `min-h-screen`/altura grande; usar `max-h-[100dvh]` e padding interno reduzido (`p-4 sm:p-6 md:p-8`).
- Grid: manter 2 colunas em md+, mas com `h-full items-center` para distribuir verticalmente.
- Tipografia responsiva por altura usando `clamp()` inline:
  - Título "Ateliê de Desenho" → `clamp(1.75rem, 4.5vh + 0.5rem, 3rem)` e "Desenho" `clamp(2rem, 6vh, 3.75rem)`.
  - Subtítulo e parágrafo: tamanhos menores.
- Ilustração: `max-h-[45dvh] w-auto object-contain` (em mobile `max-h-[28dvh]`), em vez de `max-w-md` fixo.
- Botão "Começar": padding vertical reduzido (`py-3 sm:py-4`).
- Card "Desafio de hoje": padding compacto, sem `mt-2` extra; garantir que não seja cortado.
- Media queries por altura (Tailwind arbitrary): usar `max-[800px]:text-[...]`/`max-h-[700px]:hidden` para esconder elementos decorativos (gradient radial) e reduzir tamanhos em telas baixas.

## 3. Tela do Paint (`src/routes/index.lazy.tsx`)
A raiz já usa `flex h-dvh w-screen flex-col overflow-hidden` — bom. Ajustar:
- **Header** (linha 933): reduzir para `py-1.5`, fonte `text-base md:text-lg`, logo `h-6 w-6`.
- **Wrapper** (linha 940): reduzir gaps/paddings — `gap-2 px-2 pb-2 pt-2`.
- **Aside (sidebar)** (linha 942-963):
  - Trocar `overflow-y-auto` por `overflow-visible` ou, se necessário, `min-h-0 overflow-y-auto` apenas dentro de si mesmo.
  - Reduzir largura `w-16 md:w-20`.
  - Reduzir gap `gap-1` e padding interno dos `ToolButton` (ajustar componente para variante compacta).
  - Esconder labels de grupo em telas baixas: `max-h-[700px]:hidden`.
- **Main** (linha 967): `min-h-0` já implícito via `flex-1`; manter `gap-1.5`.
- **Microinstrução** (linha 969): `py-1 text-xs md:text-sm`, ou esconder em `max-h-[640px]:hidden`.
- **Canvas container** (linha 974): já é `flex-1` com `overflow-hidden`; manter, garantir `min-h-0` no pai.
- **Barra inferior** (linha 1048): compactar — `py-1.5 gap-x-3 gap-y-1`, bolinhas de cor `h-8 w-8`, botão "Cor surpresa" `h-8`, ActionButtons com variante compacta. Em telas baixas (`max-h-[700px]`) reduzir ainda mais.

## 4. ToolButton e ActionButton (compactação)
Revisar `src/components/paint/ToolButton.tsx` e `ActionButton.tsx` para reduzir padding vertical e tamanho dos ícones em telas baixas (usar classes Tailwind responsivas por altura). Mantém usabilidade de toque mas remove altura excedente.

## 5. Garantias técnicas
- Trocar `h-screen`/`min-h-screen` por `h-dvh`/`min-h-dvh` onde existirem, pois `dvh` respeita o viewport real (importante em iframe e mobile).
- `min-h-0` em todos os filhos `flex-1` que contenham conteúdo rolável (já presente no `<main>` indiretamente via `flex-1`; adicionar explicitamente).
- Nenhum `overflow-y: auto` no body/raiz.
- Canvas continua usando `ResizeObserver` no container, então auto-ajusta à nova altura.

## 6. Validação
Após implementar:
- Abrir preview em 698x606 (viewport atual do usuário) e confirmar: capa sem rolagem; Paint sem rolagem; canvas grande; barra inferior visível; sidebar inteira visível.
- Testar também em 1280x720 e 1024x600 (iframe típico).

## Arquivos afetados
- `src/styles.css`
- `src/components/paint/WelcomeScreen.tsx`
- `src/routes/index.lazy.tsx`
- `src/components/paint/ToolButton.tsx`
- `src/components/paint/ActionButton.tsx`
