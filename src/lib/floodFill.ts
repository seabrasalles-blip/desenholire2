// Flood fill with tolerance for forgiving child-friendly painting.
export function floodFill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  fillColor: [number, number, number, number],
  tolerance = 32
) {
  const { width, height } = ctx.canvas;
  const img = ctx.getImageData(0, 0, width, height);
  const data = img.data;
  const sx = Math.floor(x);
  const sy = Math.floor(y);
  if (sx < 0 || sy < 0 || sx >= width || sy >= height) return;

  const startIdx = (sy * width + sx) * 4;
  const sr = data[startIdx];
  const sg = data[startIdx + 1];
  const sb = data[startIdx + 2];
  const sa = data[startIdx + 3];

  const [fr, fg, fb, fa] = fillColor;
  // Skip if already same color.
  if (sr === fr && sg === fg && sb === fb && sa === fa) return;

  const matches = (i: number) => {
    const dr = data[i] - sr;
    const dg = data[i + 1] - sg;
    const db = data[i + 2] - sb;
    const da = data[i + 3] - sa;
    return (
      Math.abs(dr) <= tolerance &&
      Math.abs(dg) <= tolerance &&
      Math.abs(db) <= tolerance &&
      Math.abs(da) <= tolerance
    );
  };

  const stack: number[] = [sx, sy];
  while (stack.length) {
    const py = stack.pop()!;
    const px = stack.pop()!;
    let nx = px;
    // walk left
    while (nx >= 0 && matches((py * width + nx) * 4)) nx--;
    nx++;
    let spanAbove = false;
    let spanBelow = false;
    while (nx < width && matches((py * width + nx) * 4)) {
      const i = (py * width + nx) * 4;
      data[i] = fr;
      data[i + 1] = fg;
      data[i + 2] = fb;
      data[i + 3] = fa;
      if (py > 0) {
        const above = ((py - 1) * width + nx) * 4;
        if (matches(above)) {
          if (!spanAbove) {
            stack.push(nx, py - 1);
            spanAbove = true;
          }
        } else {
          spanAbove = false;
        }
      }
      if (py < height - 1) {
        const below = ((py + 1) * width + nx) * 4;
        if (matches(below)) {
          if (!spanBelow) {
            stack.push(nx, py + 1);
            spanBelow = true;
          }
        } else {
          spanBelow = false;
        }
      }
      nx++;
    }
  }

  ctx.putImageData(img, 0, 0);
}

export function hexToRgba(hex: string, alpha = 255): [number, number, number, number] {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return [r, g, b, alpha];
}
