"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/* 分頁計算：依區塊邊界切頁，每頁以 clip 高度顯示一段連續內容（底部可留白），不與下一頁重疊 */

export type BlockInterval = { top: number; bottom: number };

export type A4PageSlice = {
  /** translateY（像素），對齊內容頂端 */
  offset: number;
  /** 本頁實際顯示的內容高度（不超過頁高），其下為留白 */
  clipH: number;
};

const EPS = 2;
const MAX_PAGES = 30;

function isSafeY(y: number, intervals: BlockInterval[]) {
  return !intervals.some(({ top, bottom }) => top + EPS < y && y < bottom - EPS);
}

/** 區間 (lo, hi] 內最大的安全裁切 y；若無則回傳 hi（接受在邊界切斷） */
function largestSafeYInRange(lo: number, hi: number, intervals: BlockInterval[]) {
  const cands = new Set<number>([hi]);
  for (const { top, bottom } of intervals) {
    if (top > lo && top <= hi) cands.add(top);
    if (bottom > lo && bottom <= hi) cands.add(bottom);
  }
  let best = -Infinity;
  for (const y of cands) {
    if (y > lo && y <= hi && isSafeY(y, intervals)) best = Math.max(best, y);
  }
  return Number.isFinite(best) && best > lo + EPS ? best : hi;
}

function yInRoot(el: HTMLElement, root: HTMLElement) {
  const rr = root.getBoundingClientRect();
  const er = el.getBoundingClientRect();
  return { top: er.top - rr.top + root.scrollTop, bottom: er.bottom - rr.top + root.scrollTop };
}

/**
 * 收集「盡量不要從中間切開」的區塊：根節點的直接子元素。
 * 若子元素符合 splitSelector（例如雙欄），改收它裡面符合 splitChildSelector 的元素。
 */
export function collectBlockIntervals(
  root: HTMLElement,
  splitSelector = "[data-print-split]",
  splitChildSelector = "[data-print-column] > *",
): BlockInterval[] {
  const out: BlockInterval[] = [];
  const push = (el: HTMLElement) => {
    const { top, bottom } = yInRoot(el, root);
    if (bottom > top + EPS) out.push({ top, bottom });
  };
  for (const child of root.children) {
    if (!(child instanceof HTMLElement)) continue;
    if (child.matches(splitSelector)) {
      child.querySelectorAll<HTMLElement>(splitChildSelector).forEach(push);
      continue;
    }
    push(child);
  }
  return out;
}

/** 產生每頁 offset 與 clipH，連續覆蓋 [0, totalH)；單一區塊高於一頁時仍會在頁高處切斷 */
export function computeA4PageSlices(totalHeightPx: number, pageHeightPx: number, intervals: BlockInterval[], maxPages = MAX_PAGES): A4PageSlice[] {
  if (pageHeightPx <= 0) return [{ offset: 0, clipH: 0 }];
  if (totalHeightPx <= EPS) return [{ offset: 0, clipH: Math.min(pageHeightPx, totalHeightPx) }];
  const slices: A4PageSlice[] = [];
  let s = 0;
  for (let n = 0; n < maxPages && s < totalHeightPx - EPS; n++) {
    const cap = Math.min(s + pageHeightPx, totalHeightPx);
    const end = largestSafeYInRange(s + EPS, cap, intervals);
    slices.push({ offset: s, clipH: Math.max(EPS, end - s) });
    s = end;
    if (s >= totalHeightPx - EPS) break;
  }
  if (slices.length === 0) slices.push({ offset: 0, clipH: Math.min(pageHeightPx, totalHeightPx) });
  return slices;
}

/* 元件 */

const SHEET_SHADOW = "shadow-[0_2px_12px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.08)]";
const defaultPageH = () => (297 * 96) / 25.4;

export interface PrintPreviewProps {
  /** 文件內容；直接子元素就是分頁時不切開的區塊 */
  children: ReactNode;
  /** 紙邊內距，預設 7.5mm */
  padding?: string;
  /** 根節點的字型（原本由版型決定） */
  fontFamily?: string;
  maxPages?: number;
  /** 雙欄等容器的選擇器，會改收它內部欄位的子元素 */
  splitSelector?: string;
  splitChildSelector?: string;
  /** 內容變動但子節點參照不變時，可傳入此值強制重新分頁 */
  layoutKey?: unknown;
  onPagesChange?: (pages: number) => void;
  labels?: { region?: string; page?: (n: number, total: number) => string };
  className?: string;
  contentClassName?: string;
}

export function PrintPreview({
  children,
  padding = "7.5mm",
  fontFamily,
  maxPages = MAX_PAGES,
  splitSelector,
  splitChildSelector,
  layoutKey,
  onPagesChange,
  labels,
  className,
  contentClassName,
}: PrintPreviewProps) {
  const t = {
    region: "Print preview",
    page: (n: number, total: number) => `Page ${n} of ${total}`,
    ...labels,
  };
  const probeRef = useRef<HTMLDivElement>(null);
  const measureSliceRef = useRef<HTMLDivElement>(null);
  const [pageHeightPx, setPageHeightPx] = useState(defaultPageH);
  const [pageSlices, setPageSlices] = useState<A4PageSlice[]>([{ offset: 0, clipH: defaultPageH() }]);
  const onPagesRef = useRef(onPagesChange);
  onPagesRef.current = onPagesChange;

  // 量 297mm 實際的像素高度（受縮放影響）
  useLayoutEffect(() => {
    const probe = probeRef.current;
    if (!probe) return;
    const sync = () => {
      const h = probe.getBoundingClientRect().height;
      if (h > 0) setPageHeightPx(h);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(probe);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const wrap = measureSliceRef.current;
    if (!wrap || pageHeightPx <= 0) return;
    const apply = () => {
      const root = wrap.firstElementChild;
      if (!(root instanceof HTMLElement)) {
        setPageSlices([{ offset: 0, clipH: pageHeightPx }]);
        return;
      }
      const totalH = root.scrollHeight;
      let slices = computeA4PageSlices(totalH, pageHeightPx, collectBlockIntervals(root, splitSelector, splitChildSelector), maxPages).slice(0, maxPages);
      if (slices.length === 0) slices = [{ offset: 0, clipH: Math.min(pageHeightPx, totalH) }];
      setPageSlices((prev) =>
        prev.length === slices.length && prev.every((p, i) => p.offset === slices[i].offset && p.clipH === slices[i].clipH) ? prev : slices,
      );
      onPagesRef.current?.(slices.length);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(wrap);
    if (wrap.firstElementChild) ro.observe(wrap.firstElementChild);
    return () => ro.disconnect();
  }, [pageHeightPx, children, layoutKey, maxPages, splitSelector, splitChildSelector]);

  const total = pageSlices.length;
  const rootStyle: CSSProperties = { fontSize: "11pt", lineHeight: 1.5, color: "#111827", padding, fontFamily };

  return (
    <div role="region" aria-label={t.region} className={cn("relative w-full", className)}>
      <div ref={probeRef} className="pointer-events-none absolute top-0 left-0 -z-[100] h-[297mm] w-px opacity-0" aria-hidden="true" />
      <div className="flex w-full flex-col items-center gap-4">
        {pageSlices.map((slice, i) => (
          <div
            key={i}
            role="group"
            aria-label={t.page(i + 1, total)}
            className={cn("flex w-[210mm] max-w-full shrink-0 flex-col overflow-hidden bg-white", SHEET_SHADOW)}
            style={{ height: "297mm" }}
          >
            {/* 第二頁起是同一份內容的位移副本，對輔助技術隱藏 */}
            <div className="w-full shrink-0 overflow-hidden" style={{ height: `${Math.min(slice.clipH, pageHeightPx)}px` }} aria-hidden={i > 0 || undefined} inert={i > 0 || undefined}>
              <div ref={i === 0 ? measureSliceRef : undefined} style={{ transform: `translateY(-${slice.offset}px)` }}>
                <div className={cn("relative isolate max-w-none", contentClassName)} style={rootStyle}>
                  {children}
                </div>
              </div>
            </div>
            <div className="min-h-0 flex-1 bg-white" aria-hidden="true" />
          </div>
        ))}
      </div>
    </div>
  );
}
