"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";

import { variantPreviews } from "@/registry/__generated__/previews";

// 每格的排版寬度：和型錄卡片一樣至少給手機寬，樣式實際用多寬再整體縮放
const LAYOUT_WIDTH = 360;
const PAD = 10;
// 小元件（按鈕、載入圖示）放大到看得清楚
const MAX_UPSCALE = 2.2;

function Cell({ name, variant }: { name: string; variant: string }) {
  const cell = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const Preview = variantPreviews[name];

  useLayoutEffect(() => {
    const box = cell.current;
    const inner = content.current;
    if (!box || !inner) return;
    const update = () => {
      const root = inner.firstElementChild;
      const w = Math.max(root instanceof HTMLElement ? root.offsetWidth : 0, 1);
      const h = Math.max(inner.offsetHeight, 1);
      if (w < 2 || h < 2) return;
      setScale(Math.min((box.clientWidth - PAD * 2) / w, (box.clientHeight - PAD * 2) / h, MAX_UPSCALE));
    };
    const observer = new ResizeObserver(update);
    observer.observe(inner);
    observer.observe(box);
    // 樣式是動態載入的，背景分頁不觸發 ResizeObserver：補量幾次
    const late = [300, 900, 1800, 2800].map((ms) => window.setTimeout(update, ms));
    update();
    return () => {
      observer.disconnect();
      late.forEach(window.clearTimeout);
    };
  }, []);

  return (
    <div ref={cell} data-wall-cell={variant} className="relative overflow-hidden bg-card">
      <div
        ref={content}
        className="absolute left-1/2 top-1/2 flex justify-center"
        style={{ width: LAYOUT_WIDTH, transform: `translate(-50%, -50%) scale(${scale})`, opacity: scale ? 1 : 0 }}
      >
        {Preview ? <Preview variant={variant} /> : null}
      </div>
    </div>
  );
}

/** 效果庫的同屏牆：每格一種樣式，各自縮放到剛好裝進格子。 */
export function VariantWall({ name, variants }: { name: string; variants: string[] }) {
  const cols = variants.length <= 4 ? 2 : 3;
  return (
    // 效果庫的顏色跟著主題的 primary；網站的 primary 是墨色，牆上看起來全是灰的。
    // 這裡示範「primary 就是品牌色」的主題：把 primary 指到 --sunui-spot，效果才有顏色
    <div
      data-fit-stage=""
      className="fixed inset-0 bg-border"
      style={{ "--primary": "var(--sunui-spot)", "--primary-foreground": "var(--sunui-spot-foreground)" } as CSSProperties}
    >
      <div className="grid h-full w-full gap-px" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridAutoRows: "minmax(0, 1fr)" }}>
        {variants.map((variant) => (
          <Cell key={variant} name={name} variant={variant} />
        ))}
      </div>
    </div>
  );
}
