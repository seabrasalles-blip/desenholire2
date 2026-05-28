## Objetivo
Fazer a rota `/` parar de cair na tela de erro, tanto na abertura inicial quanto alguns segundos depois da renderização.

## O que vou corrigir
1. **Estabilizar a rota inicial no code splitting**
   - Transformar `src/routes/index.tsx` em um arquivo mínimo de configuração da rota.
   - Mover `PaintPage` para `src/routes/index.lazy.tsx` com `createLazyFileRoute("/")`.
   - Isso evita o problema atual em que a rota está tentando renderizar `WelcomeScreen` e o runtime acusa `ReferenceError: WelcomeScreen is not defined`.

2. **Proteger os hooks que usam refs antes do canvas existir**
   - Revisar os efeitos e helpers em `src/routes/index.tsx`/`index.lazy.tsx` que fazem acesso direto com `canvasRef.current!`, `previewRef.current!` e `containerRef.current!`.
   - Adicionar guardas para só executar lógica de canvas quando `started === true` e quando os refs realmente existirem.
   - Isso cobre o comportamento descrito por você de “abre por alguns segundos e depois quebra”.

3. **Validar a abertura e transição da home**
   - Conferir que a tela `WelcomeScreen` aparece sem cair no fallback.
   - Conferir que o botão **Começar** abre a área de desenho sem erro.
   - Confirmar que a rota `/` não volta para `This page didn't load`.

## Arquivos envolvidos
- `src/routes/index.tsx`
- `src/routes/index.lazy.tsx` (novo)
- possivelmente `src/components/paint/WelcomeScreen.tsx` apenas se eu precisar ajustar import/export de forma cirúrgica

## Detalhes técnicos
- Hoje há **dois riscos reais**:
  - **Erro confirmado nos logs:** `ReferenceError: WelcomeScreen is not defined` em `src/routes/index.tsx:941`.
  - **Risco adicional no cliente:** hooks da página acessam refs do canvas antes da tela de desenho estar montada (`useEffect` com `canvasRef.current!`, `previewRef.current!`, `containerRef.current!`).
- A correção principal será usar o padrão recomendado do TanStack para separar a configuração crítica da rota do componente pesado/lazy.
- Depois disso, vou endurecer a página contra refs nulas para eliminar o crash tardio.

## Resultado esperado
- A tela inicial abre normalmente.
- Ela não cai sozinha após alguns segundos.
- Clicar em **Começar** entra no ateliê sem erro.
- A página deixa de exibir `This page didn't load`. 