## Objetivo
Fazer com que as opções de Carimbos, Formas e Tamanhos abram como painéis flutuantes independentes, fora da sidebar, ancorados ao botão clicado, sem clipping, sem scroll interno desnecessário e sem empurrar a interface.

## O que vou implementar
1. Corrigir a falha atual de carregamento do módulo `ToolPanel` para que os painéis voltem a renderizar.
2. Manter os painéis fora da sidebar usando portal para `document.body`, com `position: fixed` e `z-index` alto.
3. Garantir posicionamento inteligente ao lado do botão clicado:
   - abre à direita quando houver espaço;
   - cai para a esquerda se necessário;
   - centraliza em telas estreitas.
4. Ajustar os conteúdos dos painéis de Carimbos, Formas e Tamanhos para caberem integralmente, sem herdar `overflow` da barra lateral.
5. Fechar o painel ao selecionar uma opção, clicar fora ou pressionar `Esc`.
6. Validar no preview que os painéis aparecem por cima da interface e funcionam bem no viewport atual menor.

## Resultado esperado
- Carimbos, Formas e Tamanhos aparecem completos e visíveis.
- Nada fica escondido atrás da sidebar.
- Não surge barra de rolagem dentro do painel.
- A sidebar continua fixa com apenas os botões principais.
- A escolha da opção fica fácil também em tela menor.

## Detalhes técnicos
- Arquivos principais: `src/components/paint/ToolPanel.tsx` e `src/routes/index.lazy.tsx`.
- O `ToolPanel` continuará sendo um componente desacoplado da sidebar, renderizado por portal.
- A lógica de âncora seguirá usando o botão clicado (`panelAnchor`) no `index.lazy.tsx`.
- Vou revisar o componente para remover a causa do erro de importação dinâmica e então validar o overlay no preview antes de concluir.