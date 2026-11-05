"use client";

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";

import { cn } from "@/lib/utils";

export type BoundsItem = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** 角度（deg），只有單選時會顯示旋轉 */
  rotation?: number;
};

type Rect = { x: number; y: number; width: number; height: number };
type Guide = { type: "horizontal" | "vertical"; position: number };
type Direction = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
type Mode = "move" | "rotate" | Direction;

export type SelectionBoundsLabels = {
  selection: (count: number) => string;
  /** 接在 selection 後面的位置、大小與角度說明 */
  geometry: (g: { x: number; y: number; width: number; height: number; rotation: number }) => string;
  rotate: string;
  hint: string;
};

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, SelectionBoundsLabels> = {
  en: {
    selection: (n) => (n === 1 ? "Selected element" : `${n} selected elements`),
    geometry: (g) => `x ${g.x}, y ${g.y}, ${g.width} by ${g.height}${g.rotation ? `, rotated ${g.rotation} degrees` : ""}`,
    rotate: "Rotate",
    hint: "Arrow keys move, Alt plus arrow keys resize, [ and ] rotate.",
  },
  "zh-TW": {
    selection: (n) => (n === 1 ? "已選取的物件" : `已選取 ${n} 個物件`),
    geometry: (g) => `x ${g.x}，y ${g.y}，寬 ${g.width} 高 ${g.height}${g.rotation ? `，旋轉 ${g.rotation} 度` : ""}`,
    rotate: "旋轉",
    hint: "方向鍵移動，Alt 加方向鍵調整大小，[ 與 ] 旋轉。",
  },
  "zh-CN": {
    selection: (n) => (n === 1 ? "已选中的对象" : `已选中 ${n} 个对象`),
    geometry: (g) => `x ${g.x}，y ${g.y}，宽 ${g.width} 高 ${g.height}${g.rotation ? `，旋转 ${g.rotation} 度` : ""}`,
    rotate: "旋转",
    hint: "方向键移动，Alt 加方向键调整大小，[ 和 ] 旋转。",
  },
  ja: {
    selection: (n) => (n === 1 ? "選択中の要素" : `${n} 個の要素を選択中`),
    geometry: (g) => `x ${g.x}、y ${g.y}、幅 ${g.width} 高さ ${g.height}${g.rotation ? `、${g.rotation} 度回転` : ""}`,
    rotate: "回転",
    hint: "矢印キーで移動、Alt と矢印キーでサイズ変更、[ と ] で回転します。",
  },
};

export type SelectionBoundsProps = {
  /** 目前選取的物件（畫布座標） */
  items: BoundsItem[];
  /** 物件更新後回傳變動的物件（完整資料） */
  onChange: (changed: BoundsItem[]) => void;
  /** 一次拖動或縮放結束，可用來寫入復原紀錄 */
  onChangeEnd?: () => void;
  /** 畫布縮放倍率，滑鼠位移會除以它 */
  scale?: number;
  /** 最小寬高，原版為 50 */
  minSize?: number;
  /** 單選時顯示旋轉手柄 */
  rotatable?: boolean;
  /** 拖動對齊，簽名與 snap-guides 的 snapMove 相容 */
  snapMove?: (bounds: Rect, delta: { x: number; y: number }) => { delta: { x: number; y: number }; guides: Guide[] };
  /** 縮放對齊，簽名與 snap-guides 的 snapResize 相容 */
  snapResize?: (rect: Rect, direction: string) => { rect: Rect; guides: Guide[] };
  onGuidesChange?: (guides: Guide[]) => void;
  /** 選取框顏色，預設為畫布工具慣用的藍 #2563eb */
  color?: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<SelectionBoundsLabels>;
  className?: string;
};

/** 拖動閾值（像素），與原版相同 */
const DRAG_THRESHOLD = 3;

const DIRECTIONS: { dir: Direction; className: string; cursor: string }[] = [
  { dir: "nw", className: "-top-1 -left-1", cursor: "nw-resize" },
  { dir: "n", className: "-top-1 left-1/2 -translate-x-1/2", cursor: "n-resize" },
  { dir: "ne", className: "-top-1 -right-1", cursor: "ne-resize" },
  { dir: "e", className: "top-1/2 -translate-y-1/2 -right-1", cursor: "e-resize" },
  { dir: "se", className: "-bottom-1 -right-1", cursor: "se-resize" },
  { dir: "s", className: "-bottom-1 left-1/2 -translate-x-1/2", cursor: "s-resize" },
  { dir: "sw", className: "-bottom-1 -left-1", cursor: "sw-resize" },
  { dir: "w", className: "top-1/2 -translate-y-1/2 -left-1", cursor: "w-resize" },
];

function boundsOf(items: BoundsItem[]): Rect {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const el of items) {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.width);
    maxY = Math.max(maxY, el.y + el.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

const normalize = (deg: number) => {
  const d = ((deg % 360) + 360) % 360;
  return d > 180 ? d - 360 : d;
};

/** 單一物件在自身座標系中縮放，旋轉後對角保持不動 */
function resizeLocal(start: BoundsItem, dir: string, dx: number, dy: number, min: number): Rect {
  const t = ((start.rotation ?? 0) * Math.PI) / 180;
  const cos = Math.cos(t), sin = Math.sin(t);
  const lx = dx * cos + dy * sin;
  const ly = -dx * sin + dy * cos;
  let w = start.width, h = start.height, sx = 0, sy = 0;
  if (dir.includes("e")) w = Math.max(min, start.width + lx);
  if (dir.includes("w")) {
    w = Math.max(min, start.width - lx);
    sx = start.width - w;
  }
  if (dir.includes("s")) h = Math.max(min, start.height + ly);
  if (dir.includes("n")) {
    h = Math.max(min, start.height - ly);
    sy = start.height - h;
  }
  const cx = sx + w / 2 - start.width / 2;
  const cy = sy + h / 2 - start.height / 2;
  const centerX = start.x + start.width / 2 + cx * cos - cy * sin;
  const centerY = start.y + start.height / 2 + cx * sin + cy * cos;
  return { x: centerX - w / 2, y: centerY - h / 2, width: w, height: h };
}

export function SelectionBounds({
  items,
  onChange,
  onChangeEnd,
  scale = 1,
  minSize = 50,
  rotatable = false,
  snapMove,
  snapResize,
  onGuidesChange,
  color = "#2563eb",
  locale = "en",
  labels: labelsProp,
  className,
}: SelectionBoundsProps) {
  const labels = { ...MESSAGES[resolveLocale(locale)], ...labelsProp };
  const frameRef = useRef<HTMLDivElement>(null);
  const hintId = useId();
  const [active, setActive] = useState<Mode | null>(null);

  // 監聽器只註冊一次，用 ref 拿最新的 props
  const live = useRef({ items, onChange, onChangeEnd, scale, minSize, snapMove, snapResize, onGuidesChange });
  live.current = { items, onChange, onChangeEnd, scale, minSize, snapMove, snapResize, onGuidesChange };

  const drag = useRef({
    mode: null as Mode | null,
    hasMoved: false,
    startX: 0,
    startY: 0,
    startBounds: { x: 0, y: 0, width: 0, height: 0 } as Rect,
    starts: [] as BoundsItem[],
    center: { x: 0, y: 0 },
    startAngle: 0,
  });

  const handleMove = useCallback((e: PointerEvent) => {
    const s = drag.current;
    const p = live.current;
    if (!s.mode) return;

    const distance = Math.hypot(e.clientX - s.startX, e.clientY - s.startY);
    if (!s.hasMoved && distance < DRAG_THRESHOLD) return;
    s.hasMoved = true;

    const dx = (e.clientX - s.startX) / p.scale;
    const dy = (e.clientY - s.startY) / p.scale;

    if (s.mode === "move") {
      let delta = { x: dx, y: dy };
      if (p.snapMove) {
        const r = p.snapMove(s.startBounds, delta);
        delta = r.delta;
        p.onGuidesChange?.(r.guides);
      }
      p.onChange(s.starts.map((el) => ({ ...el, x: el.x + delta.x, y: el.y + delta.y })));
      return;
    }

    if (s.mode === "rotate") {
      const el = s.starts[0];
      const angle = (Math.atan2(e.clientY - s.center.y, e.clientX - s.center.x) * 180) / Math.PI;
      let next = (el.rotation ?? 0) + angle - s.startAngle;
      if (e.shiftKey) next = Math.round(next / 15) * 15;
      p.onChange([{ ...el, rotation: normalize(next) }]);
      return;
    }

    const dir = s.mode;

    // 單選：在物件自身座標系縮放（支援旋轉）
    if (s.starts.length === 1) {
      const el = s.starts[0];
      let rect = resizeLocal(el, dir, dx, dy, p.minSize);
      if (p.snapResize && !(el.rotation ?? 0)) {
        const r = p.snapResize(rect, dir);
        rect = r.rect;
        p.onGuidesChange?.(r.guides);
      }
      p.onChange([{ ...el, ...rect }]);
      return;
    }

    // 多選：縮放整體外框，每個物件依比例調整位置與大小
    const sb = s.startBounds;
    let nb = { ...sb };
    if (dir.includes("e")) nb.width = Math.max(p.minSize, sb.width + dx);
    if (dir.includes("w")) {
      const w = Math.max(p.minSize, sb.width - dx);
      nb.x = sb.x + (sb.width - w);
      nb.width = w;
    }
    if (dir.includes("s")) nb.height = Math.max(p.minSize, sb.height + dy);
    if (dir.includes("n")) {
      const h = Math.max(p.minSize, sb.height - dy);
      nb.y = sb.y + (sb.height - h);
      nb.height = h;
    }
    if (p.snapResize) {
      const r = p.snapResize(nb, dir);
      nb = r.rect;
      p.onGuidesChange?.(r.guides);
    }
    const kx = nb.width / sb.width;
    const ky = nb.height / sb.height;
    p.onChange(
      s.starts.map((el) => ({
        ...el,
        x: nb.x + (el.x - sb.x) * kx,
        y: nb.y + (el.y - sb.y) * ky,
        width: el.width * kx,
        height: el.height * ky,
      })),
    );
  }, []);

  const handleUp = useCallback(() => {
    const s = drag.current;
    const moved = s.hasMoved;
    s.mode = null;
    s.hasMoved = false;
    setActive(null);
    // 清除對齊線
    live.current.onGuidesChange?.([]);
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleUp);
    window.removeEventListener("pointercancel", handleUp);
    if (moved) live.current.onChangeEnd?.();
  }, [handleMove]);

  useEffect(() => () => {
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleUp);
    window.removeEventListener("pointercancel", handleUp);
  }, [handleMove, handleUp]);

  const start = (e: ReactPointerEvent, mode: Mode) => {
    if (e.button !== 0) return;
    // 阻止事件冒泡到畫布
    e.stopPropagation();
    e.preventDefault();
    const rect = frameRef.current?.getBoundingClientRect();
    const center = rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : { x: 0, y: 0 };
    drag.current = {
      mode,
      hasMoved: false,
      startX: e.clientX,
      startY: e.clientY,
      startBounds: boundsOf(items),
      starts: items.map((el) => ({ ...el })),
      center,
      startAngle: (Math.atan2(e.clientY - center.y, e.clientX - center.x) * 180) / Math.PI,
    };
    setActive(mode);
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
  };

  if (items.length === 0) return null;

  const single = items.length === 1 ? items[0] : null;
  const bounds = single ?? boundsOf(items);
  const rotation = single?.rotation ?? 0;
  const showRotate = rotatable && !!single;

  // 鍵盤：方向鍵移動，Alt 加方向鍵縮放，[ ] 旋轉
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 1;
    const arrows: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    if (arrows[e.key]) {
      e.preventDefault();
      const [dx, dy] = arrows[e.key];
      if (e.altKey) {
        const sb = boundsOf(items);
        const w = Math.max(minSize, sb.width + dx);
        const h = Math.max(minSize, sb.height + dy);
        const kx = w / sb.width, ky = h / sb.height;
        onChange(items.map((el) => ({ ...el, x: sb.x + (el.x - sb.x) * kx, y: sb.y + (el.y - sb.y) * ky, width: el.width * kx, height: el.height * ky })));
      } else {
        onChange(items.map((el) => ({ ...el, x: el.x + dx, y: el.y + dy })));
      }
      onChangeEnd?.();
    } else if (showRotate && single && (e.key === "[" || e.key === "]")) {
      e.preventDefault();
      onChange([{ ...single, rotation: normalize((single.rotation ?? 0) + (e.key === "]" ? 15 : -15)) }]);
      onChangeEnd?.();
    }
  };

  const grabCursor = active === "move" ? "grabbing" : "grab";
  const edge = (style: CSSProperties, cls: string) => (
    <div className={cn("pointer-events-auto absolute touch-none", cls)} style={{ ...style, cursor: grabCursor }} onPointerDown={(e) => start(e, "move")} />
  );

  return (
    <div
      ref={frameRef}
      data-selection-bounds="true"
      role="group"
      tabIndex={0}
      aria-label={`${labels.selection(items.length)}, ${labels.geometry({ x: Math.round(bounds.x), y: Math.round(bounds.y), width: Math.round(bounds.width), height: Math.round(bounds.height), rotation: Math.round(rotation) })}`}
      aria-describedby={hintId}
      onKeyDown={onKeyDown}
      className={cn("absolute outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-dashed", className)}
      style={{
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: bounds.height,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        border: `2px solid ${color}`,
        backgroundColor: `color-mix(in srgb, ${color} 5%, transparent)`,
        outlineColor: color,
        // 讓點擊穿透到下方元素
        pointerEvents: "none",
      }}
    >
      <span id={hintId} className="sr-only">
        {labels.hint}
      </span>

      {/* 四個邊框：可拖動區域 */}
      {edge({ height: 8, marginTop: -4 }, "top-0 left-0 right-0")}
      {edge({ height: 8, marginBottom: -4 }, "bottom-0 left-0 right-0")}
      {edge({ width: 8, marginLeft: -4 }, "top-0 bottom-0 left-0")}
      {edge({ width: 8, marginRight: -4 }, "top-0 bottom-0 right-0")}

      {/* 四個角落：額外的拖動區域 */}
      {edge({ width: 20, height: 20, marginTop: -4, marginLeft: -4 }, "top-0 left-0")}
      {edge({ width: 20, height: 20, marginTop: -4, marginRight: -4 }, "top-0 right-0")}
      {edge({ width: 20, height: 20, marginBottom: -4, marginLeft: -4 }, "bottom-0 left-0")}
      {edge({ width: 20, height: 20, marginBottom: -4, marginRight: -4 }, "bottom-0 right-0")}

      {/* 調整大小手柄 */}
      {DIRECTIONS.map(({ dir, className: pos, cursor }) => (
        <div
          key={dir}
          aria-hidden
          data-direction={dir}
          className={cn(
            "resize-handle pointer-events-auto absolute z-20 size-3 touch-none rounded-full after:absolute after:-inset-2 after:content-['']",
            pos,
          )}
          style={{ backgroundColor: color, cursor }}
          onPointerDown={(e) => start(e, dir)}
        />
      ))}

      {/* 旋轉手柄 */}
      {showRotate && (
        <>
          <div aria-hidden className="pointer-events-none absolute left-1/2 h-4 w-px -translate-x-1/2" style={{ top: -18, backgroundColor: color }} />
          <div
            aria-hidden
            title={labels.rotate}
            data-rotate-handle
            className="pointer-events-auto absolute left-1/2 z-20 size-3 -translate-x-1/2 touch-none rounded-full bg-white after:absolute after:-inset-2 after:content-['']"
            style={{ top: -28, border: `2px solid ${color}`, cursor: active === "rotate" ? "grabbing" : "grab" }}
            onPointerDown={(e) => start(e, "rotate")}
          />
        </>
      )}
    </div>
  );
}

export type SelectionMarqueeProps = {
  /** 框選起點與終點（容器座標） */
  box: { startX: number; startY: number; endX: number; endY: number } | null;
  color?: string;
  className?: string;
};

/** 框選框：在畫布背景拖曳時顯示 */
export function SelectionMarquee({ box, color = "#2563eb", className }: SelectionMarqueeProps) {
  if (!box) return null;
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute z-50 border-2", className)}
      style={{
        left: Math.min(box.startX, box.endX),
        top: Math.min(box.startY, box.endY),
        width: Math.abs(box.endX - box.startX),
        height: Math.abs(box.endY - box.startY),
        borderColor: color,
        backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
      }}
    />
  );
}

/** 物件與框選框有交集就算選到，與原版相同 */
export function intersects(a: Rect, b: { left: number; top: number; right: number; bottom: number }) {
  return a.x < b.right && a.x + a.width > b.left && a.y < b.bottom && a.y + a.height > b.top;
}
