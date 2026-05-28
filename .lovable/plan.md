## Objetivo

Permitir que a criança selecione uma região retangular do desenho para mover, recolorir ou recortar — tudo integrado com o Desfazer existente.

## Novas ferramentas na sidebar

Adicionar à lista `TOOLS` em `src/routes/index.tsx`:

- `selecionar` — ícone `MousePointerSquareDashed` (lucide), rótulo "Selecionar", sem painel.
- `tesoura` — ícone `Scissors`, rótulo "Tesoura", sem painel.

A sidebar passa de 8 para 10 ferramentas. Para evitar rolagem em telas pequenas (698×606), reduzir levemente a altura/padding dos botões e/ou usar grid 2 colunas dentro da sidebar quando necessário. Paleta de cores, Cor surpresa, Desfazer, Limpar e Imprimir continuam no rodapé.

## Modelo de estado

Novo estado em `PaintPage`:

```ts
type Selection = {
  // retângulo de origem no canvas (em px do canvas, já normalizado)
  sx: number; sy: number; sw: number; sh: number;
  // deslocamento atual em relação à origem
  dx: number; dy: number;
  // bitmap recortado da área original (ImageData -> canvas offscreen)
  bitmap: HTMLCanvasElement;
  // se já "cortamos" o original do canvas (true após começar a arrastar/cortar)
  lifted: boolean;
};

const [selection, setSelection] = useState<Selection | null>(null);
const [selectDrag, setSelectDrag] = useState<
  | { mode: "creating"; startX: number; startY: number }
  | { mode: "moving"; grabDx: number; grabDy: number }
  | null
>(null);
```

A seleção vive numa camada visual sobreposta ao canvas (um segundo `<canvas>` posicionado absoluto sobre o canvas principal, mesmo tamanho), para não modificar o bitmap principal enquanto a criança arrasta.

## Fluxos

### Criar seleção (ferramenta `selecionar`)

1. `pointerdown` no canvas → `selectDrag = { creating, startX, startY }`; limpar `selection` anterior (commitando primeiro, ver abaixo).
2. `pointermove` → desenhar retângulo pontilhado (marching ants) na camada overlay.
3. `pointerup` → normalizar retângulo, clamp aos limites do canvas, ignorar se área < 4×4 px. Capturar `ImageData` da região para o `bitmap` offscreen. NÃO recortar do canvas ainda (lifted=false) — assim recolorir sem mover não cria buraco.

### Mover seleção

- `pointerdown` dentro do retângulo da seleção (com ferramenta `selecionar` ainda ativa) → empurrar `pushHistory()`; se `!lifted`, pintar a região original de branco no canvas principal e marcar `lifted=true`. Começar `moving`.
- `pointermove` → atualizar `dx,dy`; clamp para que `sx+dx ∈ [0, canvasW - sw]` e idem em Y.
- `pointerup` → permanece selecionado no novo local (sem commitar ainda; commit acontece no "finalizar").

### Recolorir seleção (clique numa cor da paleta enquanto há seleção)

Quando `selection` existe e o usuário escolhe uma cor:

1. `pushHistory()`.
2. No `bitmap` offscreen, percorrer pixels: para cada pixel com `alpha > 0` e que NÃO seja branco puro/quase-branco (limiar simples: `r>240 && g>240 && b>240`), substituir RGB pela cor escolhida mantendo o alpha. Isso preserva contornos e evita pintar o "fundo branco" da seleção.
3. Redesenhar overlay. Seleção continua ativa.

Importante: a seleção da cor pela paleta passa a ter duplo comportamento — se houver `selection`, recolorir; senão, comportamento atual (definir `color`).

### Cortar (ferramenta `tesoura`)

Comportamento simples e estável: **funciona em conjunto com a seleção**.

- Se já existe `selection`: clicar em `tesoura` → `pushHistory()`; se `!lifted`, pintar a área original de branco; descartar `bitmap`; `selection = null`.
- Se não existe seleção e a criança clica em `tesoura`: a ferramenta vira ativa e funciona igual à `selecionar` para criar o retângulo, mas no `pointerup` já apaga a área (pinta de branco), sem deixar seleção ativa. Um único gesto = recortar.

### Finalizar seleção

A seleção é "comitada" no canvas principal (desenhar `bitmap` em `sx+dx, sy+dy`) e `selection` vira `null` quando:

- a criança clica fora do retângulo da seleção (no canvas), OU
- escolhe outra ferramenta, OU
- usa Limpar / Imprimir / Desfazer.

O commit em si não cria novo `pushHistory` (o histórico já foi salvo quando o lift ou o recolor aconteceu). Se a seleção nunca foi modificada (sem move, sem recolor), descarta sem alterar o canvas e sem mexer no histórico.

## Integração com Desfazer

`pushHistory()` (que já existe e salva `ImageData` do canvas) é chamado:

- ao começar a mover (no momento do "lift");
- ao recolorir;
- ao cortar (tanto via tesoura+seleção quanto via tesoura+retângulo direto).

Desfazer já restaura o `ImageData`; basta também limpar `selection` ao desfazer para evitar inconsistência visual.

## Cuidados técnicos

- Clamp do retângulo de seleção e do movimento aos limites do canvas (0..W, 0..H).
- Coordenadas vêm do mesmo helper de `pointer -> canvas px` já usado pelas outras ferramentas (respeita devicePixelRatio).
- Pointer events apenas no elemento canvas/overlay; overlay com `pointer-events: none` exceto quando ferramenta é `selecionar`/`tesoura` (na verdade, podemos manter os eventos no canvas principal e desenhar o overlay por cima sem capturar eventos — mais simples).
- Suporte a toque: usar pointer events (já é o padrão do projeto).
- Marching ants: `setLineDash([6,4])` + `lineDashOffset` animado via `requestAnimationFrame` enquanto `selection` existir.

## Arquivos afetados

- `src/routes/index.tsx` — toda a lógica acima, novas ferramentas, novo overlay canvas, branch de paleta para recolorir, integração com undo/limpar/imprimir/trocar ferramenta.

Nenhum novo arquivo necessário. Sem mudanças de backend.

## Critério de aceitação

- Selecionar → arrastar retângulo → borda pontilhada animada aparece.
- Arrastar a seleção move o pedaço; origem fica branca; movimento limitado ao canvas.
- Com seleção ativa, clicar numa cor recolore apenas os traços (não o branco).
- Tesoura sozinha: arrastar retângulo apaga aquela área.
- Tesoura com seleção ativa: apaga a área selecionada.
- Desfazer reverte mover, recolorir e cortar.
- Trocar de ferramenta ou clicar fora finaliza a seleção sem perder o resultado.
- Sem rolagem na sidebar em 698×606.
