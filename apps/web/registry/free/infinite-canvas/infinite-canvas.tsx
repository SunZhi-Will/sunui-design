"use client";

import { useInView, useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export type InfiniteCanvasItem = {
  id?: string;
  /** Image URL. Leave out and pass `content` to render your own node. */
  src?: string;
  alt?: string;
  caption?: ReactNode;
  /** Plain-text name, read by screen readers and announced on keyboard moves. */
  label?: string;
  content?: ReactNode;
};

export type InfiniteCanvasProps = {
  items: InfiniteCanvasItem[];
  cellWidth?: number;
  cellHeight?: number;
  gap?: number;
  /** Slow idle pan in px per second. A number drifts left; an object sets both axes. Off by default. */
  drift?: number | { x: number; y: number };
  /** Let the mouse wheel and trackpad pan the canvas (this stops the page from scrolling while over it). */
  wheel?: boolean;
  onSelect?: (item: InfiniteCanvasItem, index: number) => void;
  renderItem?: (item: InfiniteCanvasItem, index: number, state: { active: boolean }) => ReactNode;
  /** Accessible name of the canvas. */
  label?: string;
  /** Screen reader hint for the keyboard. */
  hint?: string;
  className?: string;
};

const mod = (a: number, n: number) => ((a % n) + n) % n;
const DRAG_THRESHOLD = 6;

function itemText(item: InfiniteCanvasItem) {
  return item.label ?? item.alt ?? (typeof item.caption === "string" ? item.caption : "");
}

function DefaultTile({ item, active }: { item: InfiniteCanvasItem; active: boolean }) {
  return (
    <figure
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow",
        active && "group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background",
      )}
    >
      <div className="relative min-h-0 flex-1 overflow-hidden bg-muted">
        {item.src ? (
          <img src={item.src} alt="" draggable={false} className="h-full w-full object-cover" />
        ) : (
          item.content
        )}
      </div>
      {item.caption ? (
        <figcaption className="truncate px-3 py-2 text-xs text-muted-foreground">{item.caption}</figcaption>
      ) : null}
    </figure>
  );
}

export function InfiniteCanvas({
  items,
  cellWidth = 220,
  cellHeight = 280,
  gap = 24,
  drift,
  wheel = true,
  onSelect,
  renderItem,
  label = "Gallery canvas",
  hint = "Drag, scroll or use the arrow keys to move. Press Enter to open the centered item.",
  className,
}: InfiniteCanvasProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;
  const inView = useInView(rootRef, { margin: "100px" });
  const [visible, setVisible] = useState(true);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [base, setBase] = useState({ col: 0, row: 0 });
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");

  const stepX = cellWidth + gap;
  const stepY = cellHeight + gap;
  const n = items.length;
  const shift = n > 3 ? Math.ceil(n * 0.4) : 1;
  const indexAt = useCallback((col: number, row: number) => mod(col + row * shift, Math.max(1, n)), [n, shift]);

  const off = useRef({ x: 0, y: 0 });
  const vel = useRef({ x: 0, y: 0 });
  const target = useRef<{ x: number; y: number } | null>(null);
  const drag = useRef<{ id: number; sx: number; sy: number; lx: number; ly: number; lt: number; moved: boolean } | null>(null);
  const pressed = useRef<number | null>(null);
  const cells = useRef<(HTMLDivElement | null)[]>([]);
  const baseRef = useRef(base);
  const requested = useRef(base);
  const raf = useRef(0);
  const last = useRef(0);
  const initialized = useRef(false);

  const cols = size.w ? Math.ceil(size.w / stepX) + 2 : 0;
  const rows = size.h ? Math.ceil(size.h / stepY) + 2 : 0;
  const colsRef = useRef(cols);
  colsRef.current = cols;

  const driftV = reduce || !drift ? null : typeof drift === "number" ? { x: -drift, y: 0 } : drift;
  const active = inView && visible;
  const activeRef = useRef(active);
  activeRef.current = active;
  const driftRef = useRef(driftV);
  driftRef.current = driftV;

  const place = useCallback(() => {
    const { x, y } = off.current;
    const b = baseRef.current;
    const c = colsRef.current;
    cells.current.forEach((el, k) => {
      if (!el || !c) return;
      const i = k % c;
      const j = Math.floor(k / c);
      el.style.transform = `translate3d(${(b.col + i - 1) * stepX + x}px, ${(b.row + j - 1) * stepY + y}px, 0)`;
    });
    const nc = Math.floor(-x / stepX);
    const nr = Math.floor(-y / stepY);
    if (nc !== requested.current.col || nr !== requested.current.row) {
      requested.current = { col: nc, row: nr };
      setBase({ col: nc, row: nr });
    }
  }, [stepX, stepY]);

  useLayoutEffect(() => {
    baseRef.current = base;
    place();
  }, [base, cols, rows, place]);

  const tick = useCallback(
    (t: number) => {
      const dt = last.current ? Math.min(64, t - last.current) : 16;
      last.current = t;
      let moving = false;
      const o = off.current;
      if (target.current) {
        const k = 1 - Math.pow(0.8, dt / 16);
        o.x += (target.current.x - o.x) * k;
        o.y += (target.current.y - o.y) * k;
        if (Math.abs(target.current.x - o.x) < 0.5 && Math.abs(target.current.y - o.y) < 0.5) {
          o.x = target.current.x;
          o.y = target.current.y;
          target.current = null;
        } else moving = true;
      } else if (!drag.current) {
        const v = vel.current;
        if (Math.abs(v.x) > 0.01 || Math.abs(v.y) > 0.01) {
          o.x += v.x * dt;
          o.y += v.y * dt;
          const f = Math.pow(0.94, dt / 16);
          v.x *= f;
          v.y *= f;
          moving = true;
        } else v.x = v.y = 0;
        const d = driftRef.current;
        if (d) {
          o.x += (d.x * dt) / 1000;
          o.y += (d.y * dt) / 1000;
          moving = true;
        }
      }
      place();
      raf.current = moving && activeRef.current ? requestAnimationFrame(tick) : 0;
    },
    [place],
  );

  const wake = useCallback(() => {
    if (raf.current || !activeRef.current) return;
    last.current = 0;
    raf.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => {
    if (active) wake();
    return () => {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [active, driftV?.x, driftV?.y, wake]);

  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState === "visible");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!initialized.current && width > 0) {
        initialized.current = true;
        off.current = { x: width / 2 - cellWidth / 2, y: height / 2 - cellHeight / 2 };
      }
      setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [cellWidth, cellHeight]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || !wheel) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      target.current = null;
      vel.current = { x: 0, y: 0 };
      const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX;
      const dy = e.shiftKey && !e.deltaX ? 0 : e.deltaY;
      off.current.x -= dx;
      off.current.y -= dy;
      place();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [wheel, place]);

  const centerCell = (o: { x: number; y: number }) => ({
    col: Math.floor((size.w / 2 - o.x) / stepX),
    row: Math.floor((size.h / 2 - o.y) / stepY),
  });

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY, lt: e.timeStamp, moved: false };
    vel.current = { x: 0, y: 0 };
    target.current = null;
    const cell = (e.target as HTMLElement).closest<HTMLElement>("[data-index]");
    pressed.current = cell ? Number(cell.dataset.index) : null;
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > DRAG_THRESHOLD) {
      d.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (!d.moved) return;
    const dx = e.clientX - d.lx;
    const dy = e.clientY - d.ly;
    const dt = Math.max(1, e.timeStamp - d.lt);
    off.current.x += dx;
    off.current.y += dy;
    vel.current = { x: vel.current.x * 0.4 + (dx / dt) * 0.6, y: vel.current.y * 0.4 + (dy / dt) * 0.6 };
    d.lx = e.clientX;
    d.ly = e.clientY;
    d.lt = e.timeStamp;
    place();
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!d.moved && e.type === "pointerup" && pressed.current !== null && onSelect) {
      onSelect(items[pressed.current], pressed.current);
    }
    pressed.current = null;
    if (reduce || !d.moved || e.timeStamp - d.lt > 80) vel.current = { x: 0, y: 0 };
    wake();
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [stepX, 0],
      ArrowRight: [-stepX, 0],
      ArrowUp: [0, stepY],
      ArrowDown: [0, -stepY],
    };
    const from = target.current ?? off.current;
    if (moves[e.key]) {
      e.preventDefault();
      vel.current = { x: 0, y: 0 };
      const next = { x: from.x + moves[e.key][0], y: from.y + moves[e.key][1] };
      const c = centerCell(next);
      setActiveKey(`${c.col},${c.row}`);
      if (n) setAnnounce(itemText(items[indexAt(c.col, c.row)]));
      if (reduce) {
        target.current = null;
        off.current = { ...next };
        place();
      } else {
        target.current = next;
        wake();
      }
    } else if ((e.key === "Enter" || e.key === " ") && onSelect && n) {
      e.preventDefault();
      const c = centerCell(from);
      const index = indexAt(c.col, c.row);
      onSelect(items[index], index);
    }
  };

  const pool: ReactNode[] = [];
  if (n && cols && rows) {
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i;
        const col = base.col + i - 1;
        const row = base.row + j - 1;
        const index = indexAt(col, row);
        const item = items[index];
        const isActive = activeKey === `${col},${row}`;
        pool.push(
          <div
            key={`${col},${row}`}
            ref={(el) => {
              cells.current[k] = el;
            }}
            className="absolute left-0 top-0 will-change-transform"
            style={{ width: cellWidth, height: cellHeight }}
            data-index={index}
          >
            {renderItem ? renderItem(item, index, { active: isActive }) : <DefaultTile item={item} active={isActive} />}
          </div>,
        );
      }
    }
  }
  cells.current.length = cols * rows;

  // 整塊畫布是一個可聚焦的平移控制項：方向鍵平移、Enter 開啟中央那張
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      ref={rootRef}
      role="application"
      aria-roledescription="canvas"
      aria-label={label}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      onKeyDown={onKeyDown}
      onFocus={() => {
        if (activeKey === null && size.w) {
          const c = centerCell(off.current);
          setActiveKey(`${c.col},${c.row}`);
        }
      }}
      onBlur={() => setActiveKey(null)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={cn(
        "group relative h-[480px] w-full touch-none select-none overflow-hidden rounded-xl bg-background outline-none",
        onSelect ? "cursor-grab active:cursor-grabbing" : "cursor-grab",
        "focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <div aria-hidden className={cn(onSelect && "[&_figure]:cursor-pointer")}>
        {pool}
      </div>
      <p className="sr-only">{hint}</p>
      <ul className="sr-only">
        {items.map((item, i) => (
          <li key={item.id ?? i}>{itemText(item)}</li>
        ))}
      </ul>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}

export default InfiniteCanvas;
