"use client";

import { useEffect, useRef, useState } from "react";

import { previewUrl } from "@/lib/demo-locale";
import { format, type Locale } from "@/lib/i18n";
import type { Messages } from "@/lib/messages";
import { cn } from "@/lib/utils";

const viewports = [
  { key: "desktop", width: "100%" },
  { key: "tablet", width: "768px" },
  { key: "mobile", width: "375px" },
] as const;

const MIN_HEIGHT = 448;

export function PreviewFrame({ name, locale, labels }: { name: string; locale: Locale; labels: Messages["preview"] }) {
  const [viewport, setViewport] = useState<(typeof viewports)[number]["key"]>("desktop");
  const [run, setRun] = useState(0);
  const [height, setHeight] = useState(MIN_HEIGHT);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const width = viewports.find((v) => v.key === viewport)!.width;

  useEffect(() => () => observerRef.current?.disconnect(), []);

  // 同源 iframe：直接觀察內容高度，讓外框跟著長高
  function handleLoad() {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    observerRef.current?.disconnect();
    // 量 block 本身而非舞台：舞台是 min-h-dvh，會跟著 iframe 一起長而無法縮回
    const content = doc.querySelector<HTMLElement>("[data-preview-stage] > *");
    if (!content) return;
    const STAGE_PADDING = 64;
    const update = () => setHeight(Math.max(MIN_HEIGHT, Math.ceil(content.offsetHeight) + STAGE_PADDING));
    observerRef.current = new ResizeObserver(update);
    observerRef.current.observe(content);
    update();
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
        <div role="radiogroup" aria-label={labels.viewport} className="flex gap-1">
          {viewports.map((v) => (
            <button
              key={v.key}
              type="button"
              role="radio"
              aria-checked={viewport === v.key}
              onClick={() => setViewport(v.key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                viewport === v.key ? "bg-stage text-fg" : "text-subtle hover:text-fg",
              )}
            >
              {labels[v.key]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {viewport !== "desktop" && <span className="font-mono text-[11px] text-subtle">{width}</span>}
          <button
          type="button"
          onClick={() => setRun((n) => n + 1)}
          className="rounded-md px-2.5 py-1 text-xs font-medium text-subtle transition-colors hover:text-fg"
        >
            {labels.replay}
          </button>
        </div>
      </div>
      {/* 外層不加任何留白：三種尺寸的展示區高度一致，只有寬度改變 */}
      <div className={cn("flex justify-center", viewport === "desktop" ? "stage-dots" : "stage-surround")}>
        <iframe
          // 換語言時 router.refresh() 會帶來新的 locale，iframe 跟著重新載入
          key={`${locale}-${run}`}
          ref={iframeRef}
          src={previewUrl(`/preview/${name}`, locale)}
          title={format(labels.frameTitle, { name })}
          onLoad={handleLoad}
          className={cn(
            "block border-0 transition-[width] duration-300",
            viewport !== "desktop" && "device-frame",
          )}
          style={{ width, maxWidth: "100%", height }}
        />
      </div>
    </div>
  );
}
