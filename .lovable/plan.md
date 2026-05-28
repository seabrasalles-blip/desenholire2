## Problema

A caixa de texto da ferramenta Texto é posicionada exatamente em `(textInput.x, textInput.y)` dentro do container do canvas. Quando a criança clica perto da borda direita ou inferior, a caixa transborda e fica cortada.

## Solução

Aplicar um "clamp" na posição visual da caixa, sem mudar a posição lógica em que o texto será desenhado no canvas (essa também recebe um clamp leve só para que o texto inserido não saia da área de desenho).

### Mudanças em `src/routes/index.tsx`

1. **Medir a caixa após renderizar.** Adicionar `textBoxRef = useRef<HTMLDivElement>(null)` no overlay e um `useLayoutEffect` que, quando `textInput` muda, mede `offsetWidth/offsetHeight` da caixa e o tamanho do `containerRef` (canvas wrapper).

2. **Calcular posição clamped.** Novo estado `textBoxPos: { left: number; top: number }`:
   - Margem de segurança `PAD = 8px`.
   - `left = clamp(textInput.x, PAD, containerW - boxW - PAD)`
   - `top  = clamp(textInput.y - 4, PAD, containerH - boxH - PAD)` (mantém o leve offset para cima já existente, mas dentro dos limites).
   - Se o ponto clicado estiver muito perto do rodapé (`textInput.y + boxH + PAD > containerH`), posicionar a caixa ACIMA do ponto: `top = max(PAD, textInput.y - boxH - PAD)`.
   - Fallback enquanto a medição não chega: usar `textInput.x, textInput.y` (primeiro frame), então o `useLayoutEffect` recalcula antes da pintura.

3. **Usar a posição clamped no JSX.** Trocar `left: textInput.x / top: textInput.y` por `left: textBoxPos.left / top: textBoxPos.top` e remover o `transform: translateY(-4px)` (o offset agora está embutido no cálculo).

4. **Clamp do ponto de desenho do texto.** Em `commitText`, antes do `ctx.fillText`, garantir que o texto também não saia do canvas:
   - Medir largura aproximada do texto com `ctx.measureText(value).width` e a altura ≈ `TEXT_SIZES[textSize]`.
   - `drawX = clamp(textInput.x, PAD, canvasW - textW - PAD)`
   - `drawY = clamp(textInput.y, PAD, canvasH - textH - PAD)` (`textBaseline = "top"` já é usado).
   - Desenhar em `(drawX, drawY)`.

5. **Recalcular em resize.** O `ResizeObserver` já existente no `containerRef` dispara re-render do canvas; adicionar dependência para recomputar `textBoxPos` quando o container muda de tamanho enquanto o input está aberto.

### Critério de aceitação

- Clicar próximo à borda direita: caixa cola na borda direita com 8px de folga.
- Clicar próximo à borda inferior: caixa aparece acima do ponto clicado, totalmente visível.
- Clicar próximo às bordas esquerda/superior: caixa mantém ≥ 8px de margem.
- Texto confirmado é desenhado dentro da área do canvas, mesmo se o clique tiver sido na beirada.
- Funciona em desktop, tablet e mobile (698×606 e menores).
