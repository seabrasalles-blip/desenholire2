# Paint Infantil — Plano de Implementação

Aplicação web React + Canvas, em português, otimizada para crianças em desktop e tablet.

## Estrutura

- Projeto web (TanStack Start, template padrão).
- Página única `/` com:
  - Faixa superior: título "Solte a imaginação e crie seu desenho!"
  - Barra de ferramentas (topo em desktop, lateral adaptativa em tablet).
  - Paleta de 8 cores + botão "Cor surpresa".
  - Área central de desenho (Canvas branco, ocupa maior parte da tela).
  - Barra de ações: Desfazer, Limpar, Imprimir.

## Ferramentas (estado global simples via hook)

1. **Pincel** — linhas suaves, 3 espessuras (fino/médio/grosso) mostradas como 3 círculos.
2. **Lápis** — traço com leve textura (jitter de opacidade/posição para simular giz).
3. **Tinta (balde)** — flood fill em pixels do canvas com tolerância moderada (~32).
4. **Borracha** — desenha em branco, 3 tamanhos.
5. **Carimbos** — estrela, coração, flor, sol, lua, carinha feliz, borboleta, foguete (emoji ou SVG simples desenhado no canvas no clique/toque).
6. **Mágico** — pincel arco-íris (matiz HSL avança a cada ponto).
7. **Formas** — círculo, quadrado, triângulo, retângulo, preenchidas com a cor ativa (clique-arrasta para definir tamanho; preview em camada temporária).

## Paleta

- 8 botões grandes: vermelho, azul, amarelo, verde, laranja, roxo, branco, preto.
- Cor ativa destacada com borda animada.
- "Cor surpresa": sorteia cor aleatória (HSL aleatório), aplica e destaca.

## Ações

- **Desfazer**: pilha de snapshots (`ImageData` ou `toDataURL`) salvos após cada ação concluída (pincelada, carimbo, forma, borracha, balde). Limite ~30 estados.
- **Limpar**: modal de confirmação "Quer apagar todo o desenho?" com "Sim, apagar" / "Não, voltar".
- **Imprimir**: abre janela com apenas a imagem do canvas (`toDataURL`) e dispara `window.print()`; CSS `@media print` esconde UI como fallback.

## Detalhes técnicos do Canvas

- Canvas redimensionado ao container com `devicePixelRatio` para traços nítidos.
- Eventos unificados via Pointer Events (`pointerdown/move/up`), `touch-action: none` para evitar rolagem.
- Traços suaves: `lineCap/lineJoin = round`, interpolação entre pontos com `quadraticCurveTo`.
- Camada de preview separada (segundo canvas sobreposto) para formas durante o arrasto.
- Snapshot salvo no `pointerup` / após carimbo / após balde.

## Estilo

- Tailwind: fundo suave (creme), botões grandes arredondados (`rounded-2xl`), sombras leves, ícones lucide-react, fonte sans (Nunito ou padrão).
- Feedback visual: botão ativo com escala 1.05, borda colorida, leve glow.
- Sem sons, animações mínimas.

## Arquivos principais

```
src/
  routes/index.tsx          # layout da página
  components/
    PaintCanvas.tsx         # canvas + lógica de desenho/undo
    Toolbar.tsx             # ferramentas + espessuras
    ColorPalette.tsx        # 8 cores + surpresa
    ActionBar.tsx           # desfazer/limpar/imprimir
    ConfirmDialog.tsx       # modal limpar
    StampPicker.tsx         # grid de carimbos
    ShapePicker.tsx         # grid de formas
  lib/
    floodFill.ts            # algoritmo balde
    drawing.ts              # helpers (pincel, lápis, formas, carimbos)
    usePaintState.ts        # hook de estado (ferramenta, cor, tamanho, undo stack)
```

## Critérios de aceitação

Criança consegue: escolher cor, desenhar com pincel/lápis, apagar, carimbar, inserir formas, usar cor surpresa, desfazer, limpar (com confirmação) e imprimir somente o desenho.
