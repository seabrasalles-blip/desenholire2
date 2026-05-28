import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createLazyFileRoute } from "@tanstack/react-router";
import paintLogo from "@/assets/paint-logo.png";
import { WelcomeScreen } from "@/components/paint/WelcomeScreen";
import { ToolButton } from "@/components/paint/ToolButton";
import { ActionButton } from "@/components/paint/ActionButton";
import { hslToHex } from "@/lib/colorUtils";
import { ToolPanel } from "@/components/paint/ToolPanel";

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
  Download,
  Circle,
  Square,
  Triangle,
  RectangleHorizontal,
  Type,
  Check,
  X,
  Scissors,
  MousePointerSquareDashed,
} from "lucide-react";
import { floodFill, hexToRgba } from "@/lib/floodFill";
import { STAMPS, drawStamp, type StampId } from "@/lib/stamps";

export const Route = createLazyFileRoute("/")({
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
  | "forma"
  | "texto"
  | "selecionar"
  | "tesoura";
type Shape = "circulo" | "quadrado" | "triangulo" | "retangulo";
type TextSize = "pequeno" | "medio" | "grande";

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
const TEXT_SIZES: Record<TextSize, number> = { pequeno: 24, medio: 40, grande: 64 };
const TEXT_FONT = '"Poppins",system-ui,sans-serif';

type ToolMeta = { id: Tool; label: string; icon: React.ReactNode; hasPanel: boolean };

const TOOL_GROUPS: { title: string; tools: ToolMeta[] }[] = [
  {
    title: "Desenhar",
    tools: [
      { id: "pincel", label: "Pincel", icon: <Brush />, hasPanel: true },
      { id: "lapis", label: "Lápis", icon: <Pencil />, hasPanel: false },
      { id: "magico", label: "Mágico", icon: <Sparkles />, hasPanel: true },
      { id: "borracha", label: "Borracha", icon: <Eraser />, hasPanel: true },
    ],
  },
  {
    title: "Criar",
    tools: [
      { id: "tinta", label: "Tinta", icon: <PaintBucket />, hasPanel: false },
      { id: "carimbo", label: "Carimbos", icon: <StampIcon />, hasPanel: true },
      { id: "forma", label: "Formas", icon: <Shapes />, hasPanel: true },
      { id: "texto", label: "Texto", icon: <Type />, hasPanel: true },
    ],
  },
  {
    title: "Editar",
    tools: [
      { id: "selecionar", label: "Selecionar", icon: <MousePointerSquareDashed />, hasPanel: false },
      { id: "tesoura", label: "Tesoura", icon: <Scissors />, hasPanel: false },
    ],
  },
];

const TOOLS: ToolMeta[] = TOOL_GROUPS.flatMap((g) => g.tools);

const MICRO_HINTS: Record<Tool, string> = {
  pincel: "Você escolheu: Pincel. Arraste no desenho para pintar.",
  lapis: "Você escolheu: Lápis. Arraste para fazer traços finos.",
  magico: "Você escolheu: Mágico. Arraste para pintar com várias cores.",
  borracha: "Você escolheu: Borracha. Arraste para apagar partes do desenho.",
  tinta: "Você escolheu: Tinta. Toque em uma área fechada para preencher.",
  carimbo: "Você escolheu: Carimbos. Escolha um carimbo e toque no desenho.",
  forma: "Você escolheu: Formas. Escolha uma forma e toque no desenho.",
  texto: "Você escolheu: Texto. Toque onde quer escrever.",
  selecionar: "Você escolheu: Selecionar. Marque uma parte para mover ou mudar a cor.",
  tesoura: "Você escolheu: Tesoura. Marque uma parte para recortar.",
};

// ---------- Page ----------
function PaintPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const asideRef = useRef<HTMLElement | null>(null);

  const [tool, setTool] = useState<Tool>("pincel");
  const [color, setColor] = useState(COLORS[0].hex);
  const [brushSize, setBrushSize] = useState<keyof typeof BRUSH_SIZES>("medio");
  const [eraserSize, setEraserSize] =
    useState<keyof typeof ERASER_SIZES>("media");
  const [stamp, setStamp] = useState<StampId>("estrela");
  const [shape, setShape] = useState<Shape>("circulo");
  const [textSize, setTextSize] = useState<TextSize>("medio");
  const [confirmClear, setConfirmClear] = useState(false);
  const [started, setStarted] = useState(false);

  const [openPanel, setOpenPanel] = useState<Tool | null>(null);
  const [panelAnchor, setPanelAnchor] = useState<HTMLElement | null>(null);
  const [textInput, setTextInput] = useState<{ x: number; y: number; value: string } | null>(null);
  const [textBoxPos, setTextBoxPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const textBoxRef = useRef<HTMLDivElement | null>(null);

  // Selection state for Selecionar/Tesoura
  type Selection = {
    sx: number; sy: number; sw: number; sh: number;
    dx: number; dy: number;
    bitmap: HTMLCanvasElement;
    lifted: boolean;
  };
  const [selection, setSelection] = useState<Selection | null>(null);
  const selectionRef = useRef<Selection | null>(null);
  useEffect(() => { selectionRef.current = selection; }, [selection]);
  const selectDragRef = useRef<
    | { mode: "creating"; startX: number; startY: number; curX: number; curY: number; forCut: boolean }
    | { mode: "moving"; grabDx: number; grabDy: number }
    | null
  >(null);
  const dashOffsetRef = useRef(0);

  const undoStackRef = useRef<string[]>([]);
  const drawingRef = useRef(false);
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);
  const startPtRef = useRef<{ x: number; y: number } | null>(null);
  const hueRef = useRef(0);

  // ---------- Canvas resize with DPR ----------
  useEffect(() => {
    if (!started) return;
    const canvas = canvasRef.current;
    const preview = previewRef.current;
    const container = containerRef.current;
    if (!canvas || !preview || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const prev = canvas.toDataURL();
      for (const c of [canvas, preview]) {
        c.width = Math.floor(rect.width * dpr);
        c.height = Math.floor(rect.height * dpr);
        c.style.width = `${rect.width}px`;
        c.style.height = `${rect.height}px`;
        const cx = c.getContext("2d")!;
        cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
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
  }, [started]);

  // ---------- Close floating panel on outside click ----------
  useEffect(() => {
    if (!openPanel) return;
    const handler = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      if (asideRef.current?.contains(t)) return;
      setOpenPanel(null);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [openPanel]);

  // ---------- Clamp text input overlay inside canvas ----------
  useLayoutEffect(() => {
    if (!textInput) return;
    const container = containerRef.current;
    const box = textBoxRef.current;
    if (!container || !box) return;
    const PAD = 8;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const bw = box.offsetWidth;
    const bh = box.offsetHeight;
    const maxLeft = Math.max(PAD, cw - bw - PAD);
    const maxTop = Math.max(PAD, ch - bh - PAD);
    let left = Math.min(Math.max(textInput.x, PAD), maxLeft);
    let top = textInput.y - 4;
    if (textInput.y + bh + PAD > ch) {
      top = Math.max(PAD, textInput.y - bh - PAD);
    }
    top = Math.min(Math.max(top, PAD), maxTop);
    setTextBoxPos({ left, top });
  }, [textInput]);

  // ---------- Undo helpers ----------
  const pushUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const snap = canvas.toDataURL();
    const stack = undoStackRef.current;
    stack.push(snap);
    if (stack.length > 30) stack.shift();
  }, []);

  // ---------- Selection helpers ----------
  const clearPreviewNow = useCallback(() => {
    const p = previewRef.current;
    if (!p) return;
    const pctx = p.getContext("2d")!;
    const rect = p.getBoundingClientRect();
    pctx.clearRect(0, 0, rect.width, rect.height);
  }, []);

  const renderSelectionOverlay = useCallback(() => {
    const p = previewRef.current;
    if (!p) return;
    const pctx = p.getContext("2d")!;
    const rect = p.getBoundingClientRect();
    pctx.clearRect(0, 0, rect.width, rect.height);
    const sel = selectionRef.current;
    if (sel) {
      if (sel.lifted) {
        pctx.drawImage(sel.bitmap, sel.sx + sel.dx, sel.sy + sel.dy, sel.sw, sel.sh);
      }
      pctx.save();
      pctx.lineWidth = 2;
      pctx.strokeStyle = "#DC8F20";
      pctx.setLineDash([6, 4]);
      pctx.lineDashOffset = -dashOffsetRef.current;
      pctx.strokeRect(sel.sx + sel.dx + 0.5, sel.sy + sel.dy + 0.5, sel.sw - 1, sel.sh - 1);
      pctx.restore();
    }
    const sd = selectDragRef.current;
    if (sd && sd.mode === "creating") {
      const x = Math.min(sd.startX, sd.curX);
      const y = Math.min(sd.startY, sd.curY);
      const w = Math.abs(sd.curX - sd.startX);
      const h = Math.abs(sd.curY - sd.startY);
      pctx.save();
      pctx.lineWidth = 2;
      pctx.strokeStyle = sd.forCut ? "#A000A0" : "#DC8F20";
      pctx.setLineDash([6, 4]);
      pctx.strokeRect(x + 0.5, y + 0.5, w, h);
      pctx.restore();
    }
  }, []);

  // Marching ants animation while a selection exists
  useEffect(() => {
    if (!selection) {
      clearPreviewNow();
      return;
    }
    let raf = 0;
    const tick = () => {
      dashOffsetRef.current = (dashOffsetRef.current + 0.5) % 10;
      renderSelectionOverlay();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [selection, renderSelectionOverlay, clearPreviewNow]);

  const captureSelection = useCallback(
    (sx: number, sy: number, sw: number, sh: number): Selection => {
      const dpr = window.devicePixelRatio || 1;
      const off = document.createElement("canvas");
      off.width = Math.max(1, Math.round(sw * dpr));
      off.height = Math.max(1, Math.round(sh * dpr));
      const octx = off.getContext("2d")!;
      octx.drawImage(
        canvasRef.current!,
        Math.round(sx * dpr), Math.round(sy * dpr),
        Math.round(sw * dpr), Math.round(sh * dpr),
        0, 0,
        off.width, off.height,
      );
      return { sx, sy, sw, sh, dx: 0, dy: 0, bitmap: off, lifted: false };
    },
    [],
  );

  const commitSelection = useCallback(() => {
    const sel = selectionRef.current;
    if (!sel) return;
    if (sel.lifted) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(sel.bitmap, sel.sx + sel.dx, sel.sy + sel.dy, sel.sw, sel.sh);
      }
    }
    selectionRef.current = null;
    setSelection(null);
    clearPreviewNow();
  }, [clearPreviewNow]);

  const recolorSelection = useCallback(
    (hex: string) => {
      const sel = selectionRef.current;
      if (!sel) return;
      pushUndo();
      const ictx = sel.bitmap.getContext("2d")!;
      const img = ictx.getImageData(0, 0, sel.bitmap.width, sel.bitmap.height);
      const d = img.data;
      const [nr, ng, nb] = hexToRgba(hex);
      for (let i = 0; i < d.length; i += 4) {
        const a = d[i + 3];
        if (a === 0) continue;
        const r = d[i], g = d[i + 1], b = d[i + 2];
        if (r > 240 && g > 240 && b > 240) continue;
        d[i] = nr; d[i + 1] = ng; d[i + 2] = nb;
      }
      ictx.putImageData(img, 0, 0);
      if (!sel.lifted) {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d")!;
          ctx.save();
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(sel.sx, sel.sy, sel.sw, sel.sh);
          ctx.restore();
        }
        sel.lifted = true;
      }
      setSelection({ ...sel });
    },
    [pushUndo],
  );

  const undo = useCallback(() => {
    const stack = undoStackRef.current;
    if (!stack.length) return;
    selectionRef.current = null;
    setSelection(null);
    const snap = stack.pop()!;
    const canvas = canvasRef.current;
    if (!canvas) return;
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
    selectionRef.current = null;
    setSelection(null);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    setConfirmClear(false);
  }, [pushUndo]);

  // ---------- Tool selection ----------
  const selectTool = (t: Tool, ev?: React.MouseEvent<HTMLButtonElement>) => {
    if (t !== tool) commitSelection();
    setTool(t);
    setTextInput(null);
    const meta = TOOLS.find((x) => x.id === t)!;
    if (meta.hasPanel) {
      if (ev && asideRef.current) {
        const btnRect = ev.currentTarget.getBoundingClientRect();
        const asideRect = asideRef.current.getBoundingClientRect();
        setPanelTop(btnRect.top - asideRect.top);
      }
      setOpenPanel(t);
    } else {
      setOpenPanel(null);
    }
  };

  // ---------- Pointer position ----------
  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  // ---------- Drawing handlers ----------
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (textInput) return;
    const pos = getPos(e);
    const ctx = canvasRef.current!.getContext("2d")!;

    // Selection / cut tools
    if (tool === "selecionar" || tool === "tesoura") {
      const sel = selectionRef.current;
      if (tool === "selecionar" && sel) {
        const insideX = pos.x >= sel.sx + sel.dx && pos.x <= sel.sx + sel.dx + sel.sw;
        const insideY = pos.y >= sel.sy + sel.dy && pos.y <= sel.sy + sel.dy + sel.sh;
        if (insideX && insideY) {
          if (!sel.lifted) {
            pushUndo();
            ctx.save();
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(sel.sx, sel.sy, sel.sw, sel.sh);
            ctx.restore();
            sel.lifted = true;
            setSelection({ ...sel });
          } else {
            pushUndo();
          }
          selectDragRef.current = {
            mode: "moving",
            grabDx: pos.x - (sel.sx + sel.dx),
            grabDy: pos.y - (sel.sy + sel.dy),
          };
          (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
          return;
        }
        commitSelection();
      } else if (tool === "tesoura" && sel) {
        pushUndo();
        if (!sel.lifted) {
          ctx.save();
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(sel.sx, sel.sy, sel.sw, sel.sh);
          ctx.restore();
        }
        selectionRef.current = null;
        setSelection(null);
        clearPreviewNow();
        return;
      }
      selectDragRef.current = {
        mode: "creating",
        startX: pos.x, startY: pos.y,
        curX: pos.x, curY: pos.y,
        forCut: tool === "tesoura",
      };
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
      renderSelectionOverlay();
      return;
    }

    if (tool === "texto") {
      setTextInput({ x: pos.x, y: pos.y, value: "" });
      return;
    }

    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    pushUndo();

    if (tool === "tinta") {
      floodFill(
        ctx,
        pos.x * (window.devicePixelRatio || 1),
        pos.y * (window.devicePixelRatio || 1),
        hexToRgba(color)
      );
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

    drawingRef.current = true;
    lastPtRef.current = pos;
    hueRef.current = 0;
    drawSegment(pos, pos);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const sd = selectDragRef.current;
    if (sd) {
      const pos = getPos(e);
      if (sd.mode === "creating") {
        sd.curX = pos.x; sd.curY = pos.y;
        renderSelectionOverlay();
      } else if (sd.mode === "moving") {
        const sel = selectionRef.current;
        if (!sel) return;
        const container = containerRef.current;
        if (!container) return;
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        let newDx = pos.x - sd.grabDx - sel.sx;
        let newDy = pos.y - sd.grabDy - sel.sy;
        newDx = Math.min(Math.max(newDx, -sel.sx), cw - sel.sx - sel.sw);
        newDy = Math.min(Math.max(newDy, -sel.sy), ch - sel.sy - sel.sh);
        sel.dx = newDx; sel.dy = newDy;
        renderSelectionOverlay();
      }
      return;
    }
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
    const sd = selectDragRef.current;
    if (sd) {
      if (sd.mode === "creating") {
        const container = containerRef.current;
        if (!container) { selectDragRef.current = null; return; }
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        const sx = Math.max(0, Math.min(sd.startX, sd.curX));
        const sy = Math.max(0, Math.min(sd.startY, sd.curY));
        const ex = Math.min(cw, Math.max(sd.startX, sd.curX));
        const ey = Math.min(ch, Math.max(sd.startY, sd.curY));
        const sw = ex - sx;
        const sh = ey - sy;
        selectDragRef.current = null;
        if (sw < 4 || sh < 4) {
          clearPreviewNow();
          return;
        }
        if (sd.forCut) {
          pushUndo();
          const ctx = canvasRef.current!.getContext("2d")!;
          ctx.save();
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(sx, sy, sw, sh);
          ctx.restore();
          clearPreviewNow();
        } else {
          const newSel = captureSelection(sx, sy, sw, sh);
          selectionRef.current = newSel;
          setSelection(newSel);
        }
      } else {
        selectDragRef.current = null;
      }
      return;
    }

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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (tool === "pincel") {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = color;
      ctx.lineWidth = BRUSH_SIZES[brushSize];
      strokeLine(ctx, a, b);
    } else if (tool === "lapis") {
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

  const drawShapePreview = (
    a: { x: number; y: number },
    b: { x: number; y: number }
  ) => {
    const preview = previewRef.current;
    if (!preview) return;
    const ctx = preview.getContext("2d")!;
    const rect = preview.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    drawShape(ctx, a, b);
  };

  const clearPreview = () => {
    const preview = previewRef.current;
    if (!preview) return;
    const ctx = preview.getContext("2d")!;
    const rect = preview.getBoundingClientRect();
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

  // ---------- Text ----------
  const commitText = () => {
    if (!textInput) return;
    const value = textInput.value.trim();
    if (value) {
      pushUndo();
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) { setTextInput(null); return; }
      const ctx = canvas.getContext("2d")!;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const PAD = 8;
      ctx.save();
      ctx.fillStyle = color;
      ctx.font = `bold ${TEXT_SIZES[textSize]}px ${TEXT_FONT}`;
      ctx.textBaseline = "top";
      const textW = ctx.measureText(value).width;
      const textH = TEXT_SIZES[textSize];
      const drawX = Math.min(Math.max(textInput.x, PAD), Math.max(PAD, cw - textW - PAD));
      const drawY = Math.min(Math.max(textInput.y, PAD), Math.max(PAD, ch - textH - PAD));
      ctx.fillText(value, drawX, drawY);
      ctx.restore();
    }
    setTextInput(null);
  };

  // ---------- Print ----------
  const handlePrint = () => {
    commitSelection();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
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

  // ---------- Save image (PNG download) ----------
  const handleSave = () => {
    commitSelection();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `desenho-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  };

  // ---------- Surprise color ----------
  const surpriseColor = () => {
    const hue = Math.floor(Math.random() * 360);
    const sat = 70 + Math.floor(Math.random() * 25);
    const light = 45 + Math.floor(Math.random() * 15);
    setColor(hslToHex(hue, sat, light));
  };

  // ---------- Panel content ----------
  const renderPanel = () => {
    if (!openPanel) return null;
    let title = "";
    let body: React.ReactNode = null;

    if (openPanel === "pincel" || openPanel === "magico") {
      title = "Tamanho";
      body = (
        <div className="flex justify-around items-center gap-2">
          {(Object.keys(BRUSH_SIZES) as (keyof typeof BRUSH_SIZES)[]).map((k) => (
            <button
              key={k}
              onClick={() => {
                setBrushSize(k);
                setOpenPanel(null);
              }}
              aria-label={k}
              className={`flex items-center justify-center rounded-full w-14 h-14 transition ${brushSize === k ? "bg-[#FFF2DC] ring-4 ring-[#DC8F20]" : "bg-[#F5F8FF] hover:bg-[#E6EEFB]"}`}
            >
              <span
                className="rounded-full bg-[#00113C]"
                style={{ width: BRUSH_SIZES[k], height: BRUSH_SIZES[k] }}
              />
            </button>
          ))}
        </div>
      );
    } else if (openPanel === "borracha") {
      title = "Tamanho";
      body = (
        <div className="flex justify-around items-center gap-2">
          {(Object.keys(ERASER_SIZES) as (keyof typeof ERASER_SIZES)[]).map((k) => (
            <button
              key={k}
              onClick={() => {
                setEraserSize(k);
                setOpenPanel(null);
              }}
              aria-label={k}
              className={`flex items-center justify-center rounded-full w-14 h-14 transition ${eraserSize === k ? "bg-[#FFF2DC] ring-4 ring-[#DC8F20]" : "bg-[#F5F8FF] hover:bg-[#E6EEFB]"}`}
            >
              <span
                className="rounded-full border-2 border-[#1B6CA7] bg-white"
                style={{
                  width: Math.min(36, ERASER_SIZES[k] / 1.5 + 10),
                  height: Math.min(36, ERASER_SIZES[k] / 1.5 + 10),
                }}
              />
            </button>
          ))}
        </div>
      );
    } else if (openPanel === "carimbo") {
      title = "Escolha um carimbo";
      body = (
        <div className="grid grid-cols-4 gap-2">
          {STAMPS.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setStamp(s.id);
                setOpenPanel(null);
              }}
              aria-label={s.label}
              title={s.label}
              className={`text-3xl rounded-2xl w-14 h-14 flex items-center justify-center transition ${stamp === s.id ? "bg-[#FFF2DC] ring-4 ring-[#DC8F20]" : "bg-[#F5F8FF] hover:bg-[#E6EEFB]"}`}
            >
              {s.emoji}
            </button>
          ))}
        </div>
      );
    } else if (openPanel === "forma") {
      title = "Escolha uma forma";
      const shapes: { id: Shape; label: string; icon: React.ReactNode }[] = [
        { id: "circulo", label: "Círculo", icon: <Circle className="w-7 h-7" /> },
        { id: "quadrado", label: "Quadrado", icon: <Square className="w-7 h-7" /> },
        { id: "triangulo", label: "Triângulo", icon: <Triangle className="w-7 h-7" /> },
        { id: "retangulo", label: "Retângulo", icon: <RectangleHorizontal className="w-7 h-7" /> },
      ];
      body = (
        <div className="grid grid-cols-2 gap-2">
          {shapes.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setShape(s.id);
                setOpenPanel(null);
              }}
              aria-label={s.label}
              title={s.label}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl p-3 transition ${shape === s.id ? "bg-[#FFF2DC] ring-4 ring-[#DC8F20]" : "bg-[#F5F8FF] hover:bg-[#E6EEFB]"}`}
            >
              <span className={shape === s.id ? "text-[#DC8F20]" : "text-[#0035BB]"}>{s.icon}</span>
              <span className="text-xs font-semibold text-[#00113C]">{s.label}</span>
            </button>
          ))}
        </div>
      );
    } else if (openPanel === "texto") {
      title = "Tamanho do texto";
      const sizes: { id: TextSize; label: string; preview: number }[] = [
        { id: "pequeno", label: "Pequeno", preview: 16 },
        { id: "medio", label: "Médio", preview: 22 },
        { id: "grande", label: "Grande", preview: 30 },
      ];
      body = (
        <div className="flex flex-col gap-2">
          {sizes.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setTextSize(s.id);
                setOpenPanel(null);
              }}
              className={`flex items-center justify-between rounded-2xl px-4 py-2 transition ${textSize === s.id ? "bg-[#FFF2DC] ring-4 ring-[#DC8F20]" : "bg-[#F5F8FF] hover:bg-[#E6EEFB]"}`}
            >
              <span className="font-semibold text-[#00113C]">{s.label}</span>
              <span
                className={textSize === s.id ? "text-[#DC8F20]" : "text-[#0035BB]"}
                style={{ fontFamily: TEXT_FONT, fontSize: s.preview, fontWeight: 700 }}
              >
                Aa
              </span>
            </button>
          ))}
        </div>
      );
    }

    return (
      <div
        ref={panelRef}
        className="absolute z-30 rounded-2xl bg-white border-2 border-[#1B6CA7] p-4 w-60"
        style={{
          left: "calc(100% + 8px)",
          top: Math.max(0, panelTop),
          boxShadow: "0 10px 30px -10px rgba(0,17,60,0.25)",
        }}
      >
        <p className="text-sm font-semibold text-[#00113C] mb-2 text-center">{title}</p>
        {body}
      </div>
    );
  };

  if (!started) {
    return <WelcomeScreen onStart={() => setStarted(true)} />;
  }

  return (
    <div className="flex h-dvh w-screen flex-col overflow-hidden bg-[#F5F8FF]">
      {/* Header */}
      <header className="flex items-center justify-center gap-2 py-2 px-3 bg-[#00113C] text-white print:hidden">
        <img src={paintLogo} alt="" className="h-7 w-7" />
        <h1 className="text-lg md:text-xl font-semibold tracking-tight">
          Ateliê de Desenho
        </h1>
      </header>

      <div className="flex flex-1 gap-3 px-3 pb-3 pt-3 overflow-hidden">
        {/* Toolbar */}
        <aside
          ref={asideRef}
          className="relative flex flex-col gap-1.5 w-20 md:w-24 print:hidden overflow-y-auto"
        >
          {TOOL_GROUPS.map((group, gi) => (
            <div key={group.title} className="flex flex-col gap-1">
              {gi > 0 && <div className="h-px bg-[#C9D7EC] mx-1 my-1" />}
              <p className="text-[9px] font-bold uppercase tracking-wider text-[#1B6CA7] text-center leading-none">
                {group.title}
              </p>
              {group.tools.map((t) => (
                <ToolButton
                  key={t.id}
                  icon={t.icon}
                  label={t.label}
                  active={tool === t.id}
                  onClick={(ev) => selectTool(t.id, ev)}
                />
              ))}
            </div>
          ))}
          {renderPanel()}
        </aside>

        {/* Canvas area */}
        <main className="flex-1 flex flex-col gap-2 min-w-0">
          {/* Microinstruction */}
          <div className="rounded-xl bg-[#EAF0F9] border border-[#C9D7EC] px-3 py-1.5 text-sm font-medium text-[#00113C] flex items-center gap-2 print:hidden">
            <Sparkles className="w-4 h-4 text-[#DC8F20] shrink-0" />
            <span className="truncate">{MICRO_HINTS[tool]}</span>
          </div>

          <div
            ref={containerRef}
            className="relative flex-1 rounded-2xl bg-white shadow-lg border-2 border-[#1B6CA7] overflow-hidden"
            id="paint-canvas-container"
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0"
              style={{
                touchAction: "none",
                cursor:
                  tool === "texto"
                    ? "text"
                    : tool === "selecionar" || tool === "tesoura"
                    ? "crosshair"
                    : "crosshair",
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            />
            <canvas
              ref={previewRef}
              className="absolute inset-0 pointer-events-none"
            />

            {/* Inline text input overlay */}
            {textInput && (
              <div
                ref={textBoxRef}
                className="absolute z-20 flex items-center gap-1 rounded-xl bg-white border-2 border-[#004ECC] shadow-lg p-1"
                style={{
                  left: textBoxPos.left,
                  top: textBoxPos.top,
                }}
              >
                <input
                  autoFocus
                  value={textInput.value}
                  onChange={(e) =>
                    setTextInput({ ...textInput, value: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitText();
                    else if (e.key === "Escape") setTextInput(null);
                  }}
                  placeholder="Digite aqui..."
                  className="px-2 py-1 outline-none text-[#00113C] font-semibold bg-transparent"
                  style={{
                    fontFamily: TEXT_FONT,
                    fontSize: Math.min(TEXT_SIZES[textSize], 28),
                    minWidth: 160,
                  }}
                />
                <button
                  onClick={commitText}
                  aria-label="Confirmar"
                  className="rounded-lg bg-[#DC8F20] hover:bg-[#c47e18] text-white p-2"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setTextInput(null)}
                  aria-label="Cancelar"
                  className="rounded-lg border-2 border-[#0035BB] text-[#0035BB] hover:bg-[#E6EEFB] p-1.5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Bottom support bar: palette + actions */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl bg-white border-2 border-[#C9D7EC] px-3 py-2 print:hidden">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => {
                    setColor(c.hex);
                    if (selectionRef.current) recolorSelection(c.hex);
                  }}
                  aria-label={c.name}
                  title={c.name}
                  className={`h-10 w-10 rounded-full shadow-md transition-transform ${
                    color === c.hex
                      ? "ring-4 ring-[#DC8F20] scale-110"
                      : "ring-2 ring-[#C9D7EC] hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              <button
                onClick={surpriseColor}
                className="h-10 px-3 rounded-full bg-[#A000A0] hover:bg-[#860086] text-white font-semibold shadow-md flex items-center gap-1 hover:scale-105 transition text-sm"
              >
                <Dices className="h-4 w-4" /> Cor surpresa
              </button>
              <div
                className="h-10 w-10 rounded-xl border-2 border-[#1B6CA7] shadow-inner"
                style={{ backgroundColor: color }}
                aria-label="Cor atual"
                title="Cor atual"
              />
            </div>

            <div className="h-8 w-px bg-[#C9D7EC] hidden md:block" />

            <div className="flex items-center justify-center gap-2 flex-wrap">
              <ActionButton onClick={undo} icon={<Undo2 />} label="Desfazer" variant="secondary" />
              <ActionButton onClick={() => setConfirmClear(true)} icon={<Trash2 />} label="Limpar" variant="outline" />
              <ActionButton onClick={handleSave} icon={<Download />} label="Salvar" variant="primary" />
              <ActionButton onClick={handlePrint} icon={<Printer />} label="Imprimir" variant="secondary" />
            </div>
          </div>
        </main>
      </div>

      {/* Confirm clear modal */}
      {confirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00113C]/50 p-4">
          <div className="rounded-2xl bg-white p-6 shadow-2xl max-w-sm w-full text-center border-2 border-[#1B6CA7]">
            <p className="text-xl font-semibold text-[#00113C] mb-5">
              Quer apagar todo o desenho?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={clearCanvas}
                className="rounded-xl bg-[#DC8F20] hover:bg-[#c47e18] text-white font-semibold px-5 py-3 shadow"
              >
                Sim, apagar
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="rounded-xl border-2 border-[#0035BB] text-[#0035BB] hover:bg-[#E6EEFB] font-semibold px-5 py-3"
              >
                Não, quero continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
