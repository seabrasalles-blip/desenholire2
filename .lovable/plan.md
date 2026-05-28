# Fix: "This page didn't load" na pré-visualização

## Causa

O `src/styles.css` tem o `@import` do Google Fonts (Poppins) **depois** de `@import "tailwindcss"`:

```text
1: @import "tailwindcss" source(none);
3: @import "tw-animate-css";
5: @import url("https://fonts.googleapis.com/...Poppins...");
```

Quando o Tailwind v4 expande `@import "tailwindcss"`, ele injeta centenas de regras CSS antes da linha 5. Resultado: o `@import` do Google Fonts deixa de ser o primeiro statement e o PostCSS rejeita com:

```
@import must precede all other statements (besides @charset or empty @layer)
```

A folha de estilos falha em compilar, o SSR quebra, e o usuário vê a tela genérica de erro.

## Correção

Em `src/styles.css`, mover o `@import url(Poppins)` para a **primeira linha** do arquivo (antes de qualquer outro `@import`).

```css
@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap");
@import "tailwindcss" source(none);
@import "tw-animate-css";
/* resto inalterado */
```

Só essa reordenação. Nenhuma outra mudança.

## Arquivo afetado

- `src/styles.css` — reordenar 3 linhas no topo.
