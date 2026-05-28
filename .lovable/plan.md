# Evolução do Paint infantil — Ateliê de Desenho

Trabalho de UI/UX no frontend. Nenhuma mudança de backend. Toda a interface continua em Poppins e na paleta institucional (#00113C, #0035BB, #004ECC, #1B6CA7, #DC8F20, #A000A0).

## 1. Tela inicial (Splash)

Novo componente `WelcomeScreen` renderizado em `src/routes/index.tsx` enquanto `started === false`. Ao clicar em **Começar**, `setStarted(true)` revela o canvas e a barra de ferramentas (sem mudança de rota — preserva o estado do canvas).

Conteúdo (espelha a imagem de referência):
- Título "Ateliê de" (azul escuro) + "Desenho" (azul intenso), Poppins 700.
- Subtítulo roxo: "Solte a imaginação e crie seu desenho!"
- Apoio cinza-azul: "Escolha uma ferramenta, uma cor e comece a desenhar."
- Botão grande "Começar" (fundo `#0035BB`, texto branco, ícone seta, cantos pílula, sombra azul suave).
- Card "Desafio de hoje: desenhe algo que te faz feliz!" com ícone de sol e lápis.
- Lado direito: ilustração da paleta (nova arte, item 3) + decorativos (giz roxo, coração laranja, estrelinha, lápis azul, formas).
- Fundo `#F5F8FF` com sutil gradiente; cantos arredondados; sombras suaves.
- Logo da paleta (novo asset) no canto superior esquerdo.
- Responsivo: em telas <900px, coluna única (texto em cima, ilustração embaixo ou reduzida). Em <500px, esconder decorativos secundários.

Botões "Galeria" e "Configurações" do mock ficam **fora do escopo** (não há funcionalidade) — omitidos para não prometer recursos inexistentes.

## 2. Novo ícone/ilustração da paleta

Gerar `src/assets/paint-logo.png` (transparente) — paleta arredondada em tons de azul (#0035BB, #1B6CA7, #004ECC, #00113C) com gotas coloridas, sem mão, sem texto. Usar pequeno no header do canvas e maior na tela inicial.

## 3. Reorganização da barra de ferramentas

Agrupar com pequenos rótulos (texto `#1B6CA7`, uppercase, 10px Poppins 600) + separadores finos:

```text
DESENHAR
  Pincel · Lápis · Mágico · Borracha
CRIAR
  Tinta · Carimbos · Formas · Texto
EDITAR
  Selecionar · Tesoura
```

Ações finais (Cor surpresa, Desfazer, Limpar, Imprimir, **Salvar**) saem da lateral e vão para uma **barra inferior** ao lado da paleta de cores, evitando rolagem vertical na sidebar.

Largura da sidebar mantida; em 698×606 (viewport atual do usuário) cabe sem scroll.

## 4. Painéis flutuantes para Carimbos e Formas

Hoje os submenus expandem dentro da sidebar. Trocar por `Popover` flutuante posicionado à direita do botão ativo:
- Fundo branco, borda `#1B6CA7`/20, raio 16px, sombra `0 10px 30px -10px rgba(0,17,60,.25)`.
- Grade 4 colunas de botões grandes (56×56).
- Fecha ao selecionar opção, ao clicar fora, ou ao trocar de ferramenta.
- Carimbos: estrela, coração, flor, sol, lua, carinha feliz, borboleta, foguete (já existem os 4 primeiros; adicionar lua, carinha, borboleta, foguete em `src/lib/stamps.ts`).
- Formas: círculo, quadrado, triângulo, retângulo.
- Item selecionado: ring 2px `#DC8F20`.

## 5. Microinstrução da ferramenta ativa

Faixa fina acima do canvas: ícone da ferramenta + frase curta.
Fundo `#F5F8FF`, texto `#00113C` Poppins 500, raio 12px.
Map ferramenta→frase conforme a lista do brief (Pincel/Lápis/Mágico/Borracha/Tinta/Carimbos/Formas/Texto/Selecionar/Tesoura).

## 6. Renomear "Surpresa" → "Cor surpresa"

Trocar label do botão. Comportamento atual (sortear cor e marcar como ativa) já atende; só garantir que o swatch ativo receba `ring-2 ring-[#DC8F20]` claro após sorteio.

## 7. Caixa de texto — correção de posicionamento

Hoje a caixa pode aparecer cortada perto das margens. Adicionar clamp ao calcular `left/top` do overlay:

```text
const W = textBoxWidth, H = textBoxHeight, M = 8
left = clamp(clickX, M, canvasW - W - M)
top  = clickY + H + M > canvasH ? clickY - H - M : clickY
top  = clamp(top, M, canvasH - H - M)
```

Aplicar em mouse e touch. Fonte da caixa e do texto renderizado: Poppins. Texto pintado também respeita `canvasW/H` (clampar `x` final).

## 8. Salvar imagem (PNG)

Novo botão "Salvar" na barra inferior:
- `canvas.toBlob('image/png')` → download via `<a download="desenho.png">`.
- Exporta apenas o canvas (sem UI).
- Preserva tudo já desenhado (carimbos, formas, texto, pintura).

## 9. Limpar — confirmação infantil

Substituir `confirm()` nativo por `AlertDialog` (shadcn):
- Pergunta: "Quer apagar todo o desenho?"
- Botões: "Sim, apagar" (outline laranja) / "Não, quero continuar" (azul primário).
- Botão "Limpar" na sidebar com peso visual reduzido (outline, não preenchido) para evitar cliques acidentais.

## 10. Imprimir — só o desenho

Já é via `window.print()` com `@media print`. Garantir CSS de impressão:
- `body * { visibility: hidden }` + `#paint-canvas, #paint-canvas * { visibility: visible }`.
- Centralizar com `margin:auto`, `max-width:100%`.

## 11. Acessibilidade / usabilidade

- Todos os botões com `aria-label` + label textual visível.
- Foco visível: `focus-visible:ring-2 ring-[#DC8F20]`.
- Tap targets ≥44px.
- `touch-action: none` no canvas (já existe) — manter.
- `h-dvh` no layout principal.

## Arquivos afetados

- `src/routes/index.tsx` — splash, reagrupamento, popovers, microinstrução, salvar, AlertDialog, clamp do texto, rename "Cor surpresa", barra inferior de ações.
- `src/lib/stamps.ts` — adicionar lua, carinha feliz, borboleta, foguete.
- `src/assets/paint-logo.png` — nova ilustração da paleta.
- `src/assets/welcome-illustration.png` — ilustração principal da splash (paleta grande + materiais).
- `src/styles.css` — pequenos ajustes de tokens se necessário; CSS de impressão.

## Fora de escopo

Galeria, Configurações, persistência de desenhos, contas de usuário, backend. O botão Salvar baixa PNG localmente.

## Critério de sucesso

Abre na splash → "Começar" leva ao canvas; ferramentas agrupadas (Desenhar/Criar/Editar); Carimbos/Formas em popover sem rolagem; caixa de texto nunca corta; "Cor surpresa" no lugar de "Surpresa"; Salvar baixa PNG; Limpar pede confirmação amigável; Imprimir exporta só o desenho; tudo em Poppins e paleta institucional; responsivo em 698×606 e maiores.