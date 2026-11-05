"use client";

import { cn } from "@/lib/utils";

export type SnapGuide = {
  type: "horizontal" | "vertical";
  /** 畫布座標（未縮放） */
  position: number;
  elementIds?: string[];
};

export type SnapRect = { x: number; y: number; width: number; height: number };
export type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

/** 對齊閾值（像素），與 CardFlow 相同 */
export const SNAP_THRESHOLD = 5;

const edges = (r: SnapRect) => ({
  left: r.x,
  right: r.x + r.width,
  top: r.y,
  bottom: r.y + r.height,
  centerX: r.x + r.width / 2,
  centerY: r.y + r.height / 2,
});

/** 多個矩形的外框 */
export function getBounds(rects: SnapRect[]): SnapRect {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const r of rects) {
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.width);
    maxY = Math.max(maxY, r.y + r.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

type Candidate<T extends string> = { value: number; type: T; snapTo: number };

function closest<T extends { value: number }>(list: T[], threshold: number) {
  let best: T | null = null;
  let min = Infinity;
  for (const c of list) {
    const d = Math.abs(c.value);
    if (d < threshold && d < min) {
      min = d;
      best = c;
    }
  }
  return best;
}

/**
 * 拖動時的對齊：輸入移動中物件的起始外框與位移量，
 * 回傳對齊後的位移量與要顯示的輔助線（左、右、中心對齊到其他物件的左、右、中心）。
 */
export function snapMove(
  moving: SnapRect,
  delta: { x: number; y: number },
  targets: SnapRect[],
  threshold = SNAP_THRESHOLD,
): { delta: { x: number; y: number }; guides: SnapGuide[] } {
  const guides: SnapGuide[] = [];
  const next = { ...delta };
  const minX = moving.x, minY = moving.y;
  const maxX = moving.x + moving.width, maxY = moving.y + moving.height;
  const nMinX = minX + delta.x, nMaxX = maxX + delta.x;
  const nMinY = minY + delta.y, nMaxY = maxY + delta.y;
  const nCX = (nMinX + nMaxX) / 2, nCY = (nMinY + nMaxY) / 2;

  const xs: number[] = [], ys: number[] = [], cxs: number[] = [], cys: number[] = [];
  for (const t of targets) {
    const k = edges(t);
    xs.push(k.left, k.right, k.centerX);
    ys.push(k.top, k.bottom, k.centerY);
    cxs.push(k.centerX);
    cys.push(k.centerY);
  }

  const bx = closest<Candidate<"left" | "right" | "centerX">>(
    [
      ...xs.map((x) => ({ value: x - nMinX, type: "left" as const, snapTo: x })),
      ...xs.map((x) => ({ value: x - nMaxX, type: "right" as const, snapTo: x })),
      ...cxs.map((x) => ({ value: x - nCX, type: "centerX" as const, snapTo: x })),
    ],
    threshold,
  );
  if (bx) {
    next.x = bx.type === "left" ? bx.snapTo - minX : bx.type === "right" ? bx.snapTo - maxX : bx.snapTo - (minX + maxX) / 2;
    guides.push({ type: "vertical", position: bx.snapTo });
  }

  const by = closest<Candidate<"top" | "bottom" | "centerY">>(
    [
      ...ys.map((y) => ({ value: y - nMinY, type: "top" as const, snapTo: y })),
      ...ys.map((y) => ({ value: y - nMaxY, type: "bottom" as const, snapTo: y })),
      ...cys.map((y) => ({ value: y - nCY, type: "centerY" as const, snapTo: y })),
    ],
    threshold,
  );
  if (by) {
    next.y = by.type === "top" ? by.snapTo - minY : by.type === "bottom" ? by.snapTo - maxY : by.snapTo - (minY + maxY) / 2;
    guides.push({ type: "horizontal", position: by.snapTo });
  }

  return { delta: next, guides };
}

/**
 * 縮放時的對齊：拉動的邊對齊到其他物件的邊，或寬高對齊到其他物件的寬高。
 */
export function snapResize(
  rect: SnapRect,
  direction: string,
  targets: SnapRect[],
  threshold = SNAP_THRESHOLD,
): { rect: SnapRect; guides: SnapGuide[] } {
  const guides: SnapGuide[] = [];
  const out = { ...rect };
  const xs: number[] = [], ys: number[] = [], widths: number[] = [], heights: number[] = [];
  for (const t of targets) {
    const k = edges(t);
    xs.push(k.left, k.right);
    ys.push(k.top, k.bottom);
    widths.push(t.width);
    heights.push(t.height);
  }
  const right = rect.x + rect.width;
  const bottom = rect.y + rect.height;

  if (direction.includes("e") || direction.includes("w")) {
    type C = Candidate<"left" | "right" | "width"> & { target?: number };
    const list: C[] = [];
    if (direction.includes("e")) {
      list.push(...xs.map((x) => ({ value: x - right, type: "right" as const, snapTo: x })));
      for (const w of widths) {
        if (Math.abs(w - rect.width) < threshold) {
          const tr = rect.x + w;
          list.push({ value: tr - right, type: "width", snapTo: tr, target: w });
        }
      }
    }
    if (direction.includes("w")) {
      list.push(...xs.map((x) => ({ value: x - rect.x, type: "left" as const, snapTo: x })));
      for (const w of widths) {
        if (Math.abs(w - rect.width) < threshold) {
          const tl = right - w;
          list.push({ value: rect.x - tl, type: "width", snapTo: tl, target: w });
        }
      }
    }
    const b = closest(list, threshold);
    if (b) {
      if (b.type === "width" && b.target !== undefined) {
        if (direction.includes("e")) {
          out.width = b.target;
          guides.push({ type: "vertical", position: b.snapTo });
        } else {
          out.x = b.snapTo;
          out.width = b.target;
          guides.push({ type: "vertical", position: right });
        }
      } else if (direction.includes("e") && b.type === "right") {
        out.width = b.snapTo - out.x;
        guides.push({ type: "vertical", position: b.snapTo });
      } else if (direction.includes("w") && b.type === "left") {
        out.width = out.x + out.width - b.snapTo;
        out.x = b.snapTo;
        guides.push({ type: "vertical", position: b.snapTo });
      }
    }
  }

  if (direction.includes("s") || direction.includes("n")) {
    type C = Candidate<"top" | "bottom" | "height"> & { target?: number };
    const list: C[] = [];
    if (direction.includes("s")) {
      list.push(...ys.map((y) => ({ value: y - bottom, type: "bottom" as const, snapTo: y })));
      for (const h of heights) {
        if (Math.abs(h - rect.height) < threshold) {
          const tb = rect.y + h;
          list.push({ value: tb - bottom, type: "height", snapTo: tb, target: h });
        }
      }
    }
    if (direction.includes("n")) {
      list.push(...ys.map((y) => ({ value: y - rect.y, type: "top" as const, snapTo: y })));
      for (const h of heights) {
        if (Math.abs(h - rect.height) < threshold) {
          const tt = bottom - h;
          list.push({ value: rect.y - tt, type: "height", snapTo: tt, target: h });
        }
      }
    }
    const b = closest(list, threshold);
    if (b) {
      if (b.type === "height" && b.target !== undefined) {
        if (direction.includes("s")) {
          out.height = b.target;
          guides.push({ type: "horizontal", position: b.snapTo });
        } else {
          out.y = b.snapTo;
          out.height = b.target;
          guides.push({ type: "horizontal", position: bottom });
        }
      } else if (direction.includes("s") && b.type === "bottom") {
        out.height = b.snapTo - out.y;
        guides.push({ type: "horizontal", position: b.snapTo });
      } else if (direction.includes("n") && b.type === "top") {
        out.height = out.y + out.height - b.snapTo;
        out.y = b.snapTo;
        guides.push({ type: "horizontal", position: b.snapTo });
      }
    }
  }

  return { rect: out, guides };
}

export type SnapGuidesProps = {
  guides: SnapGuide[];
  /** 畫布縮放倍率 */
  scale?: number;
  /** 畫布平移量（螢幕像素） */
  offset?: { x: number; y: number };
  /** 輔助線顏色，預設為 CardFlow 的藍 */
  color?: string;
  className?: string;
};

/** 對齊輔助線：放在畫布的 relative 容器內、縮放層之外 */
export function SnapGuides({ guides, scale = 1, offset = { x: 0, y: 0 }, color = "#2563eb", className }: SnapGuidesProps) {
  if (guides.length === 0) return null;

  return (
    <>
      {guides.map((guide, index) => {
        const position = guide.position * scale + (guide.type === "horizontal" ? offset.y : offset.x);
        return guide.type === "horizontal" ? (
          <div
            key={`guide-${index}`}
            aria-hidden
            className={cn("pointer-events-none absolute z-40", className)}
            style={{
              left: 0,
              top: position,
              width: "100%",
              height: "1px",
              background: `linear-gradient(to right, transparent, ${color}, transparent)`,
              borderTop: `1px dashed ${color}`,
            }}
          />
        ) : (
          <div
            key={`guide-${index}`}
            aria-hidden
            className={cn("pointer-events-none absolute z-40", className)}
            style={{
              left: position,
              top: 0,
              width: "1px",
              height: "100%",
              background: `linear-gradient(to bottom, transparent, ${color}, transparent)`,
              borderLeft: `1px dashed ${color}`,
            }}
          />
        );
      })}
    </>
  );
}
