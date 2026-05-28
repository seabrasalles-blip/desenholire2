import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Brush,
  Pencil,
  PaintBucket,
  Eraser,
  Sparkles,
  Shapes,
  Stamp as StampIcon,
  Undo2,
  Trash2,
  Printer,
  Dices,
  Circle,
  Square,
  Triangle,
  RectangleHorizontal,
} from "lucide-react";
import { floodFill, hexToRgba } from "@/lib/floodFill";
import { STAMPS, drawStamp, type StampId } from "@/lib/stamps";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Paint Infantil — Solte a imaginação!" },
      {
        name: "description",
        content:
          "Aplicativo de pintura infantil: desenhe, carimbe, use cores e imprima seu desenho.",
      },
    ],
  }),
  component: PaintPage,
});

// ---------- Configuration ----------
type Tool =
  | "pincel"
  | "lapis"
  | "tinta"
  | "borracha"
  | "carimbo"
  | "magico"
  | "forma";
type Shape = "circulo" | "quadrado" | "triangulo" | "retangulo";

const COLORS = [
  { name: "Vermelho", hex: "#ef4444" },
  { name: "Azul", hex: "#3b82f6" },
  { name: "Amarelo", hex: "#facc15" },
  { name: "Verde", hex: "#22c55e" },
  { name: "Laranja", hex: "#f97316" },
  { name: "Roxo", hex: "#a855f7" },
  { name: "Branco", hex: "#ffffff" },
  { name: "Preto", hex: "#111827" },
];

const BRUSH_SIZES = { fino: 4, medio: 12, grosso: 24 } as const;
const ERASER_SIZES = { pequena: 12, media: 28, grande: 56 } as const;

// ---------- Page ----------
function PaintPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [tool, setTool] = useState<Tool>("pincel");
  const [color, setColor] = useState(COLORS[0].hex);
  const [brushSize, setBrushSize] = useState<keyof typeof BRUSH_SIZES>("medio");
  const [eraserSize, setEraserSize] =
    useState<keyof typeof ERASER_SIZES>("media");
  const [stamp, setStamp] = useState<StampId>("estrela");
  const [shape, setShape] = useState<Shape>("circulo");
  const [confirmClear, setConfirmClear] = useState(false);

  // Undo stack of snapshots (data URLs). Limited to ~30.
  const undoStackRef = useRef<string[]>([]);

  // Drawing state refs (avoid re-renders during pointer moves).
  const drawingRef = useRef(false);
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);
  const startPtRef = useRef<{ x: number; y: number } | null>(null);
  const hueRef = useRef(0);

  // ---------- Setup canvas size with DPR ----------
  useEffect(() => {
    const canvas = canvasRef.current!;
    const preview = previewRef.current!;
    const container = containerRef.current!;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      // Preserve current drawing.
      const prev = canvas.toDataURL();
      for (const c of [canvas, preview]) {
        c.width = Math.floor(rect.width * dpr);
        c.height = Math.floor(rect.height * dpr);
        c.style.width = `${rect.width}px`;
        c.style.height = `${rect.height}px`;
        const cx = c.getContext("2d")!;
        cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      // White background + restore.
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, rect.width, rect.height);
      if (prev && prev !== "data:,") {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
        img.src = prev;
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // ---------- Undo helpers ----------
  const pushUndo = useCallback(() => {
    const canvas = canvasRef.current!;
    const snap = canvas.toDataURL();
    const stack = undoStackRef.current;
    stack.push(snap);
    if (stack.length > 30) stack.shift();
  }, []);

  const undo = useCallback(() => {
    const stack = undoStackRef.current;
    if (!stack.length) return;
    const snap = stack.pop()!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.onload = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
    };
    img.src = snap;
  }, []);

  const clearCanvas = useCallback(() => {
    pushUndo();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    setConfirmClear(false);
  }, [pushUndo]);

  // ---------- Pointer position ----------
  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  // ---------- Drawing handlers ----------
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    const pos = getPos(e);
    const ctx = canvasRef.current!.getContext("2d")!;

    pushUndo();

    if (tool === "tinta") {
      floodFill(ctx, pos.x * (window.devicePixelRatio || 1), pos.y * (window.devicePixelRatio || 1), hexToRgba(color));
      return;
    }

    if (tool === "carimbo") {
      drawStamp(ctx, stamp, pos.x, pos.y, 72);
      return;
    }

    if (tool === "forma") {
      startPtRef.current = pos;
      drawingRef.current = true;
      return;
    }

    // Stroke-based tools.
    drawingRef.current = true;
    lastPtRef.current = pos;
    hueRef.current = 0;
    drawSegment(pos, pos);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const pos = getPos(e);

    if (tool === "forma") {
      drawShapePreview(startPtRef.current!, pos);
      return;
    }

    const last = lastPtRef.current!;
    drawSegment(last, pos);
    lastPtRef.current = pos;
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    if (tool === "forma") {
      const pos = getPos(e);
      const ctx = canvasRef.current!.getContext("2d")!;
      drawShape(ctx, startPtRef.current!, pos);
      clearPreview();
    }
    drawingRef.current = false;
    lastPtRef.current = null;
    startPtRef.current = null;
  };

  // ---------- Drawing primitives ----------
  const drawSegment = (
    a: { x: number; y: number },
    b: { x: number; y: number }
  ) => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (tool === "pincel") {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = color;
      ctx.lineWidth = BRUSH_SIZES[brushSize];
      strokeLine(ctx, a, b);
    } else if (tool === "lapis") {
      // Pencil: thinner, slightly translucent, with tiny jitter for texture.
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      const steps = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y) / 1.5);
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const x = a.x + (b.x - a.x) * t + (Math.random() - 0.5) * 1.2;
        const y = a.y + (b.y - a.y) * t + (Math.random() - 0.5) * 1.2;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.35 + Math.random() * 0.4;
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (tool === "borracha") {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = ERASER_SIZES[eraserSize];
      strokeLine(ctx, a, b);
    } else if (tool === "magico") {
      // Rainbow brush — hue advances along the stroke.
      hueRef.current = (hueRef.current + 8) % 360;
      ctx.globalAlpha = 1;
      ctx.strokeStyle = `hsl(${hueRef.current}, 90%, 55%)`;
      ctx.lineWidth = BRUSH_SIZES[brushSize];
      strokeLine(ctx, a, b);
    }
  };

  const strokeLine = (
    ctx: CanvasRenderingContext2D,
    a: { x: number; y: number },
    b: { x: number; y: number }
  ) => {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  };

  // Shape preview while dragging (rendered on overlay canvas).
  const drawShapePreview = (
    a: { x: number; y: number },
    b: { x: number; y: number }
  ) => {
    const ctx = previewRef.current!.getContext("2d")!;
    const rect = previewRef.current!.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    drawShape(ctx, a, b);
  };

  const clearPreview = () => {
    const ctx = previewRef.current!.getContext("2d")!;
    const rect = previewRef.current!.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
  };

  const drawShape = (
    ctx: CanvasRenderingContext2D,
    a: { x: number; y: number },
    b: { x: number; y: number }
  ) => {
    ctx.fillStyle = color;
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    const w = Math.abs(b.x - a.x);
    const h = Math.abs(b.y - a.y);
    if (shape === "circulo") {
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (shape === "quadrado") {
      const s = Math.max(w, h);
      ctx.fillRect(x, y, s, s);
    } else if (shape === "retangulo") {
      ctx.fillRect(x, y, w, h);
    } else if (shape === "triangulo") {
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x + w, y + h);
      ctx.closePath();
      ctx.fill();
    }
  };

  // ---------- Print ----------
  const handlePrint = () => {
    const dataUrl = canvasRef.current!.toDataURL("image/png");
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>Meu desenho</title>
          <style>
            html,body{margin:0;padding:0;height:100%;}
            body{display:flex;align-items:center;justify-content:center;}
            img{max-width:100%;max-height:100vh;}
            @media print { body { height:auto; } }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="window.focus();window.print();" />
        </body>
      </html>`);
    w.document.close();
  };

  // ---------- Surprise color ----------
  const surpriseColor = () => {
    const hue = Math.floor(Math.random() * 360);
    const sat = 70 + Math.floor(Math.random() * 25);
    const light = 45 + Math.floor(Math.random() * 15);
    setColor(hslToHex(hue, sat, light));
  };

  return (
    <div
      className="flex h-screen w-screen flex-col overflow-hidden"
      style={{ backgroundColor: "#fef7e6" }}
    >
      {/* Header */}
      <header className="flex items-center justify-center py-3 print:hidden">
        <h1 className="text-2xl md:text-3xl font-bold text-amber-700">
          🎨 Solte a imaginação e crie seu desenho!
        </h1>
      </header>

      <div className="flex flex-1 gap-3 px-3 pb-3 overflow-hidden">
        {/* Toolbar */}
        <aside className="flex flex-col gap-2 w-28 md:w-32 print:hidden overflow-y-auto">
          <ToolButton icon={<Brush />} label="Pincel" active={tool === "pincel"} onClick={() => setTool("pincel")} />
          <ToolButton icon={<Pencil />} label="Lápis" active={tool === "lapis"} onClick={() => setTool("lapis")} />
          <ToolButton icon={<PaintBucket />} label="Tinta" active={tool === "tinta"} onClick={() => setTool("tinta")} />
          <ToolButton icon={<Eraser />} label="Borracha" active={tool === "borracha"} onClick={() => setTool("borracha")} />
          <ToolButton icon={<StampIcon />} label="Carimbos" active={tool === "carimbo"} onClick={() => setTool("carimbo")} />
          <ToolButton icon={<Sparkles />} label="Mágico" active={tool === "magico"} onClick={() => setTool("magico")} />
          <ToolButton icon={<Shapes />} label="Formas" active={tool === "forma"} onClick={() => setTool("forma")} />

          {/* Contextual size/option pickers */}
          {(tool === "pincel" || tool === "magico") && (
            <div className="mt-2 rounded-2xl bg-white p-2 shadow-sm">
              <p className="text-xs font-semibold text-center text-amber-700 mb-1">Tamanho</p>
              <div className="flex justify-around items-center">
                {(Object.keys(BRUSH_SIZES) as (keyof typeof BRUSH_SIZES)[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setBrushSize(k)}
                    aria-label={k}
                    className={`flex items-center justify-center rounded-full transition ${brushSize === k ? "ring-4 ring-amber-400" : ""}`}
                    style={{ width: 36, height: 36 }}
                  >
                    <span
                      className="rounded-full bg-slate-700"
                      style={{ width: BRUSH_SIZES[k], height: BRUSH_SIZES[k] }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
          {tool === "borracha" && (
            <div className="mt-2 rounded-2xl bg-white p-2 shadow-sm">
              <p className="text-xs font-semibold text-center text-amber-700 mb-1">Tamanho</p>
              <div className="flex justify-around items-center">
                {(Object.keys(ERASER_SIZES) as (keyof typeof ERASER_SIZES)[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setEraserSize(k)}
                    aria-label={k}
                    className={`flex items-center justify-center rounded-full transition ${eraserSize === k ? "ring-4 ring-amber-400" : ""}`}
                    style={{ width: 40, height: 40 }}
                  >
                    <span
                      className="rounded-full border-2 border-slate-400 bg-white"
                      style={{
                        width: Math.min(28, ERASER_SIZES[k] / 1.5 + 8),
                        height: Math.min(28, ERASER_SIZES[k] / 1.5 + 8),
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
          {tool === "carimbo" && (
            <div className="mt-2 rounded-2xl bg-white p-2 shadow-sm">
              <p className="text-xs font-semibold text-center text-amber-700 mb-1">Escolha</p>
              <div className="grid grid-cols-2 gap-1">
                {STAMPS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStamp(s.id)}
                    aria-label={s.label}
                    className={`text-2xl rounded-xl p-1 transition ${stamp === s.id ? "bg-amber-200 ring-2 ring-amber-400" : "hover:bg-amber-50"}`}
                  >
                    {s.emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
          {tool === "forma" && (
            <div className="mt-2 rounded-2xl bg-white p-2 shadow-sm">
              <p className="text-xs font-semibold text-center text-amber-700 mb-1">Forma</p>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { id: "circulo", icon: <Circle /> },
                  { id: "quadrado", icon: <Square /> },
                  { id: "triangulo", icon: <Triangle /> },
                  { id: "retangulo", icon: <RectangleHorizontal /> },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setShape(s.id as Shape)}
                    aria-label={s.id}
                    className={`flex items-center justify-center rounded-xl p-2 transition ${shape === s.id ? "bg-amber-200 ring-2 ring-amber-400" : "hover:bg-amber-50"}`}
                  >
                    {s.icon}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Canvas area */}
        <main className="flex-1 flex flex-col gap-3 min-w-0">
          <div
            ref={containerRef}
            className="relative flex-1 rounded-3xl bg-white shadow-lg border-4 border-amber-200 overflow-hidden"
            id="paint-canvas-container"
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0"
              style={{ touchAction: "none", cursor: "crosshair" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            />
            <canvas
              ref={previewRef}
              className="absolute inset-0 pointer-events-none"
            />
          </div>

          {/* Color palette */}
          <div className="flex flex-wrap items-center justify-center gap-2 print:hidden">
            {COLORS.map((c) => (
              <button
                key={c.hex}
                onClick={() => setColor(c.hex)}
                aria-label={c.name}
                title={c.name}
                className={`h-12 w-12 rounded-full shadow-md transition-transform ${
                  color === c.hex
                    ? "ring-4 ring-amber-500 scale-110"
                    : "ring-2 ring-slate-200 hover:scale-105"
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
            <button
              onClick={surpriseColor}
              className="h-12 px-4 rounded-full bg-gradient-to-r from-pink-400 via-yellow-300 to-sky-400 text-slate-900 font-bold shadow-md flex items-center gap-2 hover:scale-105 transition"
            >
              <Dices className="h-5 w-5" /> Cor surpresa
            </button>
            <div
              className="ml-2 h-12 w-12 rounded-xl border-2 border-slate-300 shadow-inner"
              style={{ backgroundColor: color }}
              aria-label="Cor atual"
              title="Cor atual"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3 print:hidden">
            <ActionButton onClick={undo} icon={<Undo2 />} label="Desfazer" color="bg-sky-400 hover:bg-sky-500" />
            <ActionButton onClick={() => setConfirmClear(true)} icon={<Trash2 />} label="Limpar" color="bg-rose-400 hover:bg-rose-500" />
            <ActionButton onClick={handlePrint} icon={<Printer />} label="Imprimir" color="bg-emerald-400 hover:bg-emerald-500" />
          </div>
        </main>
      </div>

      {/* Confirm clear modal */}
      {confirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="rounded-3xl bg-white p-6 shadow-2xl max-w-sm w-full text-center">
            <p className="text-xl font-bold text-slate-800 mb-5">
              Quer apagar todo o desenho?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={clearCanvas}
                className="rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold px-5 py-3 shadow"
              >
                Sim, apagar
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-5 py-3 shadow"
              >
                Não, voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Sub-components ----------
function ToolButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 rounded-2xl p-2 shadow-sm transition-all ${
        active
          ? "bg-amber-300 ring-4 ring-amber-500 scale-105"
          : "bg-white hover:bg-amber-100"
      }`}
    >
      <span className={`text-amber-700 ${active ? "scale-110" : ""}`}>
        {icon}
      </span>
      <span className="text-xs font-semibold text-slate-700">{label}</span>
    </button>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-white font-bold shadow-md transition-transform hover:scale-105 ${color}`}
    >
      {icon}
      {label}
    </button>
  );
}

// ---------- Utils ----------
function hslToHex(h: number, s: number, l: number) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
