import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface ToolPanelProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  title: string;
  width?: number;
  children: React.ReactNode;
}

const MARGIN = 12;
const GAP = 8;

export function ToolPanel({
  anchorEl,
  onClose,
  title,
  width = 240,
  children,
}: ToolPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; centered: boolean }>({
    left: -9999,
    top: -9999,
    centered: false,
  });

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!mounted || !anchorEl || !panelRef.current) return;

    const compute = () => {
      const el = panelRef.current;
      if (!el || !anchorEl) return;
      const a = anchorEl.getBoundingClientRect();
      const pw = el.offsetWidth || width;
      const ph = el.offsetHeight || 0;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Horizontal: prefer right of the anchor
      let left = a.right + GAP;
      let centered = false;
      if (left + pw > vw - MARGIN) {
        const leftSide = a.left - GAP - pw;
        if (leftSide >= MARGIN) {
          left = leftSide;
        } else {
          left = Math.max(MARGIN, (vw - pw) / 2);
          centered = true;
        }
      }

      let top = a.top;
      if (centered) {
        top = Math.max(MARGIN, (vh - ph) / 2);
      } else {
        if (top + ph > vh - MARGIN) top = vh - MARGIN - ph;
        if (top < MARGIN) top = MARGIN;
      }

      setPos({ left, top, centered });
    };

    compute();
    // Re-measure after the next frame in case fonts/icons shift size.
    const raf = requestAnimationFrame(compute);
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [mounted, anchorEl, width, children]);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      if (anchorEl?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [anchorEl, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label={title}
      className="fixed z-50 rounded-2xl bg-white border-2 border-[#1B6CA7] p-4"
      style={{
        left: pos.left,
        top: pos.top,
        width,
        boxShadow: "0 10px 30px -10px rgba(0,17,60,0.35)",
        fontFamily: "Poppins, system-ui, sans-serif",
      }}
    >
      <p className="text-sm font-semibold text-[#00113C] mb-2 text-center">
        {title}
      </p>
      {children}
    </div>,
    document.body
  );
}
