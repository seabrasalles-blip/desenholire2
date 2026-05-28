// Stamp drawings rendered into the canvas as vector paths so they always look crisp
// and use the active color where it makes sense.
export type StampId =
  | "estrela"
  | "coracao"
  | "flor"
  | "sol"
  | "lua"
  | "feliz"
  | "borboleta"
  | "foguete";

export const STAMPS: { id: StampId; label: string; emoji: string }[] = [
  { id: "estrela", label: "Estrela", emoji: "⭐" },
  { id: "coracao", label: "Coração", emoji: "❤️" },
  { id: "flor", label: "Flor", emoji: "🌸" },
  { id: "sol", label: "Sol", emoji: "☀️" },
  { id: "lua", label: "Lua", emoji: "🌙" },
  { id: "feliz", label: "Feliz", emoji: "😊" },
  { id: "borboleta", label: "Borboleta", emoji: "🦋" },
  { id: "foguete", label: "Foguete", emoji: "🚀" },
];

// Draw an emoji glyph centered at (x,y) — simple, stable, colorful.
export function drawStamp(
  ctx: CanvasRenderingContext2D,
  id: StampId,
  x: number,
  y: number,
  size = 64
) {
  const stamp = STAMPS.find((s) => s.id === id);
  if (!stamp) return;
  ctx.save();
  ctx.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(stamp.emoji, x, y);
  ctx.restore();
}
