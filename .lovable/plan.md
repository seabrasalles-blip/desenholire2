# Atualização visual do Paint infantil

Aplicar a identidade visual do portal ao Paint, mantendo a usabilidade infantil e todas as funcionalidades atuais (ferramentas, seleção, carimbos, formas, texto, tesoura, paleta de cores do aluno).

## 1. Tokens de design (`src/styles.css`)

Adicionar variáveis institucionais em `oklch` no `:root`:

- `--brand-navy: #00113C` → textos, títulos, labels principais
- `--brand-blue: #0035BB` → botões primários, bordas ativas
- `--brand-blue-accent: #004ECC` → hover/focus, destaques de navegação
- `--brand-blue-mid: #1B6CA7` → bordas suaves, estados secundários
- `--brand-orange: #DC8F20` → ferramenta selecionada, foco, chamadas de atenção
- `--brand-purple: #A000A0` → detalhes lúdicos pontuais
- `--brand-bg: #F5F8FF` (azul muito claro) → fundo geral da app
- `--brand-panel: #FFFFFF` → painéis flutuantes

Remapear tokens semânticos do shadcn (`--background`, `--foreground`, `--primary`, `--accent`, `--border`, `--ring`) para os novos tokens, de modo que componentes existentes herdem o tema sem edição individual.

## 2. Tipografia Poppins

- Adicionar `<link>` para Google Fonts Poppins (300/400/500/600/700) em `src/routes/__root.tsx` (dentro do `head()`).
- No `@theme inline` de `src/styles.css`: `--font-sans: "Poppins", system-ui, sans-serif;` e aplicar `font-family: var(--font-sans)` no `body`.
- Garantir Poppins em todos os textos da UI do Paint: nomes de ferramentas, botões, mensagens, títulos, campo de texto e confirmações.

## 3. Ícone da paleta (logo)

- Copiar `user-uploads://pinturapaletapequeno.png` para `src/assets/paint-logo.png`.
- Usar no cabeçalho do Paint ao lado do título (substituindo/realçando o ícone atual). Mantém aparência azul institucional.
- Também referenciar em `public/favicon.ico` opcional (manter atual se preferir simplicidade — escopo: só cabeçalho).

## 4. Estrutura visual em `src/routes/index.tsx`

Sem mudar lógica — apenas classes/estilos.

### Header
- Fundo `--brand-navy` com texto branco; logo da paleta + título em Poppins 600.

### Sidebar de ferramentas
- Fundo branco, borda direita em `--brand-blue-mid` 20%.
- `ToolButton`:
  - Default: fundo branco, ícone `--brand-blue`, label `--brand-navy`, borda transparente, `rounded-2xl`, sombra suave.
  - Hover/focus: borda `--brand-blue-accent`, ícone `--brand-blue-accent`.
  - Active (selecionado): fundo `#FFF2E0` (laranja muito claro), borda 2px `--brand-orange`, ícone e label `--brand-orange`, sombra mais marcada.
- Garantir contraste AA e mantê-los grandes (já são; manter tamanhos atuais).

### Painéis flutuantes (Carimbos, Formas, Texto, Seleção/Recolor)
- Fundo branco, borda 1px `--brand-blue-mid`, `rounded-2xl`, sombra `0 10px 30px -10px rgba(0,17,60,0.25)`.
- Título em `--brand-navy` Poppins 600.
- Itens internos: hover com fundo `--brand-bg`; selecionado com borda/ring 2px `--brand-orange`.
- Botões de tamanho do Texto (pequeno/médio/grande): mesmo padrão de `ToolButton`.

### Paleta de cores do aluno (footer)
- Mantém swatches coloridos livres (cores de desenho intactas).
- Container com fundo branco, borda superior `--brand-blue-mid` 30%.
- Swatch selecionado: ring 3px `--brand-orange` + leve `scale`.
- Botões auxiliares (Surpresa, Desfazer, Limpar, Imprimir): mesmo estilo institucional dos `ToolButton`. "Imprimir" pode usar `--brand-blue` como primário cheio, texto branco. "Limpar" usa borda `--brand-orange` (alerta suave) sem virar destrutivo agressivo.

### Caixa de texto (overlay) e mensagens
- Borda 2px `--brand-blue-accent`, fundo branco, texto `--brand-navy` em Poppins.
- Botão Confirmar: fundo `--brand-orange`, texto branco. Cancelar: outline `--brand-blue`.

### Canvas
- Borda 2px `--brand-blue-mid`, `rounded-2xl`, sombra suave. Fundo branco mantido.

### Marching ants (seleção)
- Trocar para tracejado `--brand-orange` sobre contorno `--brand-navy` para destaque claro.

### Toque lúdico (roxo, moderação)
- Pequenos detalhes: ícone do título lateral, badge de "Surpresa", ou underline do título — apenas 1–2 usos pontuais.

## 5. Arquivos afetados

- `src/styles.css` — tokens + Poppins + remapeamento semântico
- `src/routes/__root.tsx` — `<link>` Google Fonts no `head()`
- `src/routes/index.tsx` — classes/estilos de header, sidebar, painéis, paleta, overlay de texto, canvas, marching ants
- `src/assets/paint-logo.png` — novo (copiado do upload)

## 6. Não alterado

- Toda a lógica de desenho, seleção, recolor, tesoura, carimbos, formas, texto, undo, impressão.
- Estrutura responsiva já ajustada (no-scroll a 698×606).
- Cores disponíveis para o aluno desenhar permanecem variadas.

## 7. Critério de sucesso

- Header azul-marinho com logo da paleta e título Poppins.
- Botões e painéis brancos com bordas azuis, ícones azuis, selecionado em laranja, texto em azul escuro.
- Toda UI em Poppins.
- Paleta de desenho intacta e grande.
- Boa legibilidade e contraste; nenhuma regressão funcional.
