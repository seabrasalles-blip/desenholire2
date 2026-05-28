# Ajustes de UI do Paint Infantil

Objetivo: eliminar rolagem na barra lateral, transformar Carimbos/Formas em painéis flutuantes, adicionar ferramenta de Texto e reorganizar a barra inferior com paleta + ações.

## 1. Barra lateral principal (sem rolagem)

Lateral esquerda exibe somente os 8 botões grandes de ferramentas, distribuídos verticalmente sem `overflow-y-auto`:

`Pincel · Lápis · Tinta · Borracha · Carimbos · Mágico · Formas · Texto`

Os sub-pickers contextuais (tamanho do pincel/borracha, escolha de carimbo/forma, tamanho do texto) saem da coluna e passam a aparecer como **painéis flutuantes** ao lado do botão ativo.

## 2. Painéis flutuantes (Carimbos, Formas, Texto, Tamanhos)

- Posicionados absolutamente à direita do botão clicado (`left: 100%` da aside, top alinhado ao botão).
- Visual: fundo branco, `rounded-2xl`, sombra suave, borda âmbar clara, padding generoso, botões grandes (≥56px).
- Conteúdo:
  - **Carimbos** — grid 4×2 com os 8 emojis (estrela, coração, flor, sol, lua, feliz, borboleta, foguete).
  - **Formas** — grid 2×2 (círculo, quadrado, triângulo, retângulo).
  - **Texto** — três botões de tamanho: Pequeno / Médio / Grande.
  - **Pincel/Mágico** e **Borracha** — também migram para painel flutuante com os 3 tamanhos.
- Comportamento:
  - Abre ao selecionar a ferramenta correspondente.
  - Ao escolher uma opção (carimbo/forma/tamanho), o painel fecha automaticamente e a ferramenta permanece ativa.
  - Fecha ao clicar fora (listener global em `pointerdown` que ignora cliques no botão da ferramenta e no próprio painel).
  - Fecha ao trocar para outra ferramenta.
  - A opção atual fica destacada (ring âmbar).

## 3. Ferramenta Texto

- Novo tipo `Tool = ... | "texto"`.
- Estado novo: `textSize: "pequeno" | "medio" | "grande"` (24 / 40 / 64 px).
- Fonte: `"Nunito", "Comic Sans MS", system-ui, sans-serif` (sem serifa, arredondada).
- Fluxo:
  1. Criança seleciona Texto → painel flutuante mostra os 3 tamanhos.
  2. Ao clicar no canvas, abre um pequeno overlay posicionado no ponto clicado: `<input>` arredondado + botão ✓ Confirmar e ✕ Cancelar. Enter confirma, Esc cancela.
  3. Ao confirmar, desenha o texto no canvas com `ctx.fillStyle = color`, `ctx.font = "${size}px Nunito,..."`, `textBaseline = "top"`. `pushUndo()` antes do desenho.
- O texto vira parte do bitmap → aparece corretamente na impressão (que já usa `toDataURL`).
- Enquanto o overlay de digitação estiver aberto, desativar os handlers normais de pointer no canvas.

## 4. Barra inferior (recursos de apoio)

A faixa abaixo do canvas agrupa, da esquerda para a direita:

`[Paleta de 8 cores]  [Cor surpresa 🎲]   |   [Desfazer]  [Limpar]  [Imprimir]`

- Mesma linha em desktop/tablet; em telas estreitas, quebra em duas linhas (`flex-wrap`).
- Botões grandes com ícone + rótulo em português (mantém o padrão atual).
- Remove os botões de ação que hoje ficam embaixo do canvas separados — tudo num único rodapé.

## 5. Layout responsivo

- Aside fixa em `w-24` (mobile) / `w-28` (md) — apenas ícone+rótulo, 8 botões cabem sem rolagem em 600px de altura.
- Painel flutuante usa `position: absolute` dentro de um wrapper relativo na aside, com `z-30`; largura ~220px para não cobrir muito do canvas.
- Em viewports muito baixos, painel ganha `max-height` e rolagem interna própria (não a barra inteira).

## 6. Detalhes técnicos

Arquivo alterado: `src/routes/index.tsx` (único arquivo da página; mantém arquitetura atual sem fragmentar em vários componentes para reduzir risco).

- Novo estado `openPanel: Tool | null` controla qual painel flutuante está aberto.
- `setTool(t)` passa a abrir o painel se `t ∈ {pincel, lapis(?), borracha, carimbo, forma, magico, texto}` que tenham opções; ferramentas sem opções (lápis, tinta) fecham qualquer painel.
- `useEffect` registra listener `pointerdown` no `document` para fechar o painel ao clicar fora (`ref` no painel + `ref` na aside).
- Novo componente local `FloatingPanel` (function dentro do arquivo) que renderiza o card com título e children.
- Novo overlay local `TextInputOverlay` posicionado em coordenadas do canvas.
- Adicionar import de ícone `Type` do lucide-react para o botão Texto.
- Função `drawText(ctx, text, x, y, size, color)` adicionada junto às outras primitivas.
- `pushUndo()` chamado antes de inserir texto, carimbo ou forma — comportamento já existente é preservado.

## Critério de aceitação

- Barra lateral nunca apresenta rolagem em viewports ≥ 600px de altura.
- Clicar em Carimbos/Formas abre painel ao lado, não empurra botões.
- Escolher carimbo/forma fecha o painel e mantém ferramenta ativa.
- Clicar fora do painel ou em outra ferramenta o fecha.
- Texto pode ser inserido em 3 tamanhos, na cor ativa, e sai na impressão.
- Paleta, cor surpresa, desfazer, limpar e imprimir ficam todos no rodapé, acessíveis sem rolar.
