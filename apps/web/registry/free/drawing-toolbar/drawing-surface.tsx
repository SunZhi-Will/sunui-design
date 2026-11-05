"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { cn } from "@/lib/utils";

export type DrawingTool = "pen" | "line" | "rectangle" | "circle" | "arrow";
export type Point = { x: number; y: number };
export type Stroke = { toolType: DrawingTool; points: Point[]; color: string; lineWidth: number };

/** 形狀工具：依起終點產生折線點（與原版 InfiniteCanvas 相同算法） */
export function shapePoints(tool: Exclude<DrawingTool, "pen">, a: Point, b: Point): Point[] {
  if (tool === "line") return [a, b];
  if (tool === "rectangle") return [a, { x: b.x, y: a.y }, b, { x: a.x, y: b.y }, a];
  if (tool === "circle") {
    const cx = (a.x + b.x) / 2;
    const cy = (a.y + b.y) / 2;
    const r = Math.hypot(b.x - a.x, b.y - a.y) / 2;
    const n = Math.max(32, Math.floor(r * 2));
    return Array.from({ length: n + 1 }, (_, i) => {
      const t = (i / n) * Math.PI * 2;
      return { x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) };
    });
  }
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return [a, b];
  const ux = dx / len;
  const uy = dy / len;
  const head = Math.min(20, len * 0.2);
  const w = 10;
  return [
    a,
    b,
    { x: b.x - head * ux + w * uy, y: b.y - head * uy - w * ux },
    b,
    { x: b.x - head * ux - w * uy, y: b.y - head * uy + w * ux },
    b,
  ];
}

// 預覽用路徑（圓形用弧線，箭頭用分段）
function previewPath(tool: Exclude<DrawingTool, "pen">, a: Point, b: Point) {
  if (tool === "line") return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
  if (tool === "rectangle") return `M ${a.x} ${a.y} L ${b.x} ${a.y} L ${b.x} ${b.y} L ${a.x} ${b.y} Z`;
  if (tool === "circle") {
    const cx = (a.x + b.x) / 2;
    const cy = (a.y + b.y) / 2;
    const r = Math.hypot(b.x - a.x, b.y - a.y) / 2;
    return `M ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy}`;
  }
  const p = shapePoints("arrow", a, b);
  if (p.length < 6) return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
  return `M ${a.x} ${a.y} L ${b.x} ${b.y} M ${p[2].x} ${p[2].y} L ${b.x} ${b.y} L ${p[4].x} ${p[4].y}`;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

export interface DrawingSurfaceLabels {
  /** 繪圖區的無障礙名稱 */
  area: string;
  /** 筆畫數量，接在名稱後面 */
  strokes: (n: number) => string;
}

const MESSAGES: Record<SunLocale, DrawingSurfaceLabels> = {
  en: { area: "Drawing area", strokes: (n) => `${n} ${n === 1 ? "stroke" : "strokes"}` },
  "zh-TW": { area: "繪圖區", strokes: (n) => `${n} 筆` },
  "zh-CN": { area: "绘图区", strokes: (n) => `${n} 笔` },
  ja: { area: "描画エリア", strokes: (n) => `${n} 本のストローク` },
};

const line = { fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;

export type DrawingSurfaceProps = {
  /** 已完成的筆畫 */
  strokes: Stroke[];
  /** 放開時呼叫；點一下沒移動不會產生筆畫 */
  onStrokeComplete: (stroke: Stroke) => void;
  /** 繪圖模式；關閉時只顯示筆畫、不攔截指標 */
  active?: boolean;
  tool?: DrawingTool;
  color?: string;
  lineWidth?: number;
  /** 繪圖區名稱，等同 labels.area */
  label?: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<DrawingSurfaceLabels>;
  className?: string;
};

export function DrawingSurface({
  strokes,
  onStrokeComplete,
  active = true,
  tool = "pen",
  color = "#000000",
  lineWidth = 2,
  label,
  locale = "en",
  labels,
  className,
}: DrawingSurfaceProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const area = label ?? t.area;
  const ref = useRef<HTMLDivElement>(null);
  const [penPoints, setPenPoints] = useState<Point[]>([]);
  const [shape, setShape] = useState<{ a: Point; b: Point } | null>(null);
  const drawing = useRef(false);

  const toLocal = (e: ReactPointerEvent): Point => {
    const r = ref.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const down = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!active || e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = toLocal(e);
    if (tool === "pen") setPenPoints([p]);
    else setShape({ a: p, b: p });
  };

  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drawing.current) return;
    const p = toLocal(e);
    if (tool === "pen") setPenPoints((prev) => [...prev, p]);
    else setShape((s) => (s ? { ...s, b: p } : s));
  };

  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (tool === "pen") {
      // 畫筆至少要兩個點
      if (penPoints.length > 1) onStrokeComplete({ toolType: "pen", points: penPoints, color, lineWidth });
    } else if (shape) {
      // 直線容許 1px，其他形狀至少 2px，避免只是點一下
      const min = tool === "line" ? 1 : 2;
      if (Math.hypot(shape.b.x - shape.a.x, shape.b.y - shape.a.y) >= min)
        onStrokeComplete({ toolType: tool, points: shapePoints(tool, shape.a, shape.b), color, lineWidth });
    }
    setPenPoints([]);
    setShape(null);
  };

  return (
    <div
      ref={ref}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      className={cn("absolute inset-0 select-none", active ? "pointer-events-auto" : "pointer-events-none", className)}
      style={{ cursor: active ? "crosshair" : "default", touchAction: active ? "none" : "auto" }}
    >
      <svg className="absolute inset-0 h-full w-full overflow-visible" role="img" aria-label={`${area}, ${t.strokes(strokes.length)}`}>
        {strokes.map((s, i) => (
          <polyline key={i} points={s.points.map((p) => `${p.x},${p.y}`).join(" ")} stroke={s.color} strokeWidth={s.lineWidth} {...line} />
        ))}
        {tool === "pen" && penPoints.length > 0 && (
          <polyline points={penPoints.map((p) => `${p.x},${p.y}`).join(" ")} stroke={color} strokeWidth={lineWidth} {...line} />
        )}
        {tool !== "pen" && shape && <path d={previewPath(tool, shape.a, shape.b)} stroke={color} strokeWidth={lineWidth} {...line} />}
      </svg>
    </div>
  );
}
