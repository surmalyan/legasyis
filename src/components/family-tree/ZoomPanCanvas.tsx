import { useState, useRef, useCallback, type ReactNode } from "react";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";

interface ZoomPanCanvasProps {
  children: ReactNode;
}

const ZoomPanCanvas = ({ children }: ZoomPanCanvasProps) => {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((s) => Math.min(3, Math.max(0.3, s + delta)));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only pan on middle-click or if touching the canvas background
    if (e.button === 1 || (e.target as HTMLElement).dataset.canvas === "true") {
      setIsPanning(true);
      lastPos.current = { x: e.clientX, y: e.clientY };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setTranslate((t) => ({ x: t.x + dx, y: t.y + dy }));
  }, [isPanning]);

  const handlePointerUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Touch: two-finger pan
  const touchStart = useRef<{ x: number; y: number; dist: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const cx = (t1.clientX + t2.clientX) / 2;
      const cy = (t1.clientY + t2.clientY) / 2;
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      touchStart.current = { x: cx, y: cy, dist };
    } else if (e.touches.length === 1) {
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setIsPanning(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStart.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const cx = (t1.clientX + t2.clientX) / 2;
      const cy = (t1.clientY + t2.clientY) / 2;
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

      const scaleDelta = dist / touchStart.current.dist;
      setScale((s) => Math.min(3, Math.max(0.3, s * scaleDelta)));

      const dx = cx - touchStart.current.x;
      const dy = cy - touchStart.current.y;
      setTranslate((t) => ({ x: t.x + dx, y: t.y + dy }));
      touchStart.current = { x: cx, y: cy, dist };
    } else if (e.touches.length === 1 && isPanning) {
      const dx = e.touches[0].clientX - lastPos.current.x;
      const dy = e.touches[0].clientY - lastPos.current.y;
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setTranslate((t) => ({ x: t.x + dx, y: t.y + dy }));
    }
  }, [isPanning]);

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
    touchStart.current = null;
  }, []);

  const resetView = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full flex-1 overflow-hidden rounded-2xl border border-border bg-muted/30">
      {/* Controls */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
        <button
          onClick={() => setScale((s) => Math.min(3, s + 0.2))}
          className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-foreground hover:bg-accent transition-colors shadow-sm"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={() => setScale((s) => Math.max(0.3, s - 0.2))}
          className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-foreground hover:bg-accent transition-colors shadow-sm"
        >
          <ZoomOut size={14} />
        </button>
        <button
          onClick={resetView}
          className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-foreground hover:bg-accent transition-colors shadow-sm"
        >
          <Maximize size={14} />
        </button>
      </div>

      {/* Scale indicator */}
      <div className="absolute bottom-3 left-3 z-20 text-[10px] text-muted-foreground bg-card/80 px-2 py-1 rounded-md border border-border">
        {Math.round(scale * 100)}%
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        data-canvas="true"
        className="w-full h-full min-h-[400px] cursor-grab active:cursor-grabbing touch-none"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="inline-flex justify-center w-full pt-8 pb-16 transition-transform duration-75"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transformOrigin: "center top",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default ZoomPanCanvas;
