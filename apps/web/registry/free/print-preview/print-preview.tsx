"use client";

import { Children, useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type PrintPreviewSize = "a4" | "letter";

export interface PrintPreviewLabels {
  page?: (page: number, total: number) => ReactNode;
  region?: string;
}

export interface PrintPreviewProps {
  /** 一個個區塊；分頁只發生在區塊之間，不會切開區塊 */
  children: ReactNode;
  size?: PrintPreviewSize;
  /** 頁邊距（mm） */
  margin?: number;
  header?: (page: number, total: number) => ReactNode;
  /** 預設為「Page 1 of 2」 */
  footer?: (page: number, total: number) => ReactNode;
  labels?: PrintPreviewLabels;
  className?: string;
}

const defaultLabels: Required<PrintPreviewLabels> = {
  page: (page, total) => (
    <>
      Page {page} of {total}
    </>
  ),
  region: "Print preview",
};

// 設計語言（DESIGN.md）：紙、紙邊、墨
const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const inkMuted = "text-[#1c1917]/60 dark:text-[#ece7dc]/60";

const MM = 96 / 25.4;
const sizes: Record<PrintPreviewSize, { w: number; h: number; css: string }> = {
  a4: { w: 210, h: 297, css: "A4" },
  letter: { w: 215.9, h: 279.4, css: "letter" },
};
const BAND = 10; // 頁首、頁尾高度（mm）

/** 依區塊高度貪婪分頁；比一頁還高的區塊獨佔一頁 */
function paginate(heights: number[], capacity: number) {
  const pages: number[][] = [[]];
  let used = 0;
  heights.forEach((h, i) => {
    const current = pages[pages.length - 1];
    if (current.length > 0 && used + h > capacity) {
      pages.push([i]);
      used = h;
    } else {
      current.push(i);
      used += h;
    }
  });
  return pages;
}

export function PrintPreview({
  children,
  size = "a4",
  margin = 16,
  header,
  footer,
  labels,
  className,
}: PrintPreviewProps) {
  const t = { ...defaultLabels, ...labels };
  const blocks = Children.toArray(children);
  const { w, h, css } = sizes[size];
  const pageW = w * MM;
  const pageH = h * MM;
  const pad = margin * MM;
  const headerH = header ? BAND * MM : 0;
  const footerH = BAND * MM;
  const capacity = pageH - pad * 2 - headerH - footerH;

  const outer = useRef<HTMLDivElement>(null);
  const measure = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  // 量測前先把全部區塊放在第一頁，避免伺服器端與首次渲染沒有內容
  const [pages, setPages] = useState<number[][]>(() => [blocks.map((_, i) => i)]);

  useLayoutEffect(() => {
    const el = outer.current;
    const box = measure.current;
    if (!el || !box) return;
    const update = () => {
      setScale(Math.min(1, el.clientWidth / pageW));
      const heights = Array.from(box.children).map((c) => (c as HTMLElement).offsetHeight);
      const next = paginate(heights, capacity);
      setPages((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    Array.from(box.children).forEach((c) => ro.observe(c));
    return () => ro.disconnect();
  }, [blocks.length, capacity, pageW]);

  const total = pages.length;

  return (
    <div ref={outer} role="region" aria-label={t.region} className={cn("relative w-full overflow-hidden print:overflow-visible", ink, className)} data-print-root="">
      <style>{`
        @media print {
          @page { size: ${css}; margin: 0; }
          body * { visibility: hidden; }
          [data-print-root], [data-print-root] * { visibility: visible; }
          [data-print-root] { position: absolute; inset: 0 auto auto 0; }
          [data-print-measure] { display: none !important; }
          [data-print-slot] { height: auto !important; margin: 0 !important; }
          [data-print-page] { transform: none !important; border: 0 !important; break-after: page; }
        }
      `}</style>

      {/* 量測層：與頁面內容同寬、看不見，只用來取得每個區塊的高度 */}
      <div
        ref={measure}
        aria-hidden="true"
        data-print-measure=""
        className="pointer-events-none invisible absolute top-0 left-0 -z-10"
        style={{ width: pageW - pad * 2 }}
        inert
      >
        {blocks.map((b, i) => (
          <div key={i} className="flow-root">
            {b}
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4">
        {pages.map((indexes, p) => (
          <div key={p} data-print-slot="" style={{ width: pageW * scale, height: pageH * scale }}>
            <div
              data-print-page=""
              aria-label={`${p + 1} / ${total}`}
              className={cn("relative flex origin-top-left flex-col overflow-hidden rounded-[2px] border", paper, edge)}
              style={{ width: pageW, height: pageH, padding: pad, transform: `scale(${scale})` }}
            >
              {header && (
                <div className={cn("flex shrink-0 items-start text-xs", inkMuted)} style={{ height: headerH }}>
                  {header(p + 1, total)}
                </div>
              )}
              <div className="min-h-0 flex-1">
                {indexes.map((i) => (
                  <div key={i} className="flow-root">
                    {blocks[i]}
                  </div>
                ))}
              </div>
              <div
                className={cn("flex shrink-0 items-end justify-end text-xs tabular-nums", inkMuted)}
                style={{ height: footerH }}
              >
                {footer ? footer(p + 1, total) : t.page(p + 1, total)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
