"use client";

import { useEffect, useRef, useState } from "react";

import { previewUrl } from "@/lib/demo-locale";
import { format, type Locale } from "@/lib/i18n";
import type { Messages } from "@/lib/messages";
import { spotCss, spotKeys, spotSwatches, type SpotKey } from "@/lib/spot";
import { cn } from "@/lib/utils";

const viewports = [
  { key: "desktop", width: "100%", icon: "M3 5h18v11H3zM8 20h8M12 16v4" },
  { key: "tablet", width: "768px", icon: "M6 3h12v18H6zM11 18h2" },
  { key: "mobile", width: "375px", icon: "M8 3h8v18H8zM11.5 18h1" },
] as const;

const MIN_HEIGHT = 448;
// 拖曳把手可以縮到的最窄寬度：比最小手機再窄一點，看得到 block 在極窄欄位的樣子
const MIN_DRAG_WIDTH = 320;

export function PreviewFrame({
  name,
  spot: spotSupported,
  locale,
  labels,
}: {
  name: string;
  /** block 已改用 --sunui-spot 時顯示品牌色樣本 */
  spot?: boolean;
  locale: Locale;
  labels: Messages["preview"];
}) {
  const [viewport, setViewport] = useState<(typeof viewports)[number]["key"]>("desktop");
  const [run, setRun] = useState(0);
  const [height, setHeight] = useState(MIN_HEIGHT);
  const [spot, setSpot] = useState<SpotKey>("ink");
  // 拖曳把手給的自訂寬度（px）；按任一個尺寸按鈕就清掉，回到預設寬度
  const [custom, setCustom] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  // 目前實際寬度，顯示在工具列上（桌機是容器寬，會跟著視窗變）
  const [measured, setMeasured] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const width = custom !== null ? `${custom}px` : viewports.find((v) => v.key === viewport)!.width;

  useEffect(() => () => observerRef.current?.disconnect(), []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const observer = new ResizeObserver(() => setMeasured(Math.round(iframe.offsetWidth)));
    observer.observe(iframe);
    return () => observer.disconnect();
  }, [locale, run]);

  // 把手在 iframe 右緣；iframe 置中，所以拖動 dx 時寬度要變 2dx，邊緣才會跟著游標
  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    const stage = stageRef.current;
    const iframe = iframeRef.current;
    if (!stage || !iframe) return;
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = iframe.offsetWidth;
    const max = stage.clientWidth;
    setDragging(true);
    const onMove = (e: PointerEvent) => {
      setCustom(Math.round(Math.min(max, Math.max(MIN_DRAG_WIDTH, startWidth + (e.clientX - startX) * 2))));
    };
    const onUp = () => {
      setDragging(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  // 鍵盤也能調：方向鍵一次 16px，按住 Shift 一次 64px；Home 縮到最窄，End 回到目前尺寸按鈕的寬度
  function nudge(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!stageRef.current || !iframeRef.current) return;
    const max = stageRef.current.clientWidth;
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setCustom(event.key === "Home" ? MIN_DRAG_WIDTH : null);
      return;
    }
    const step = event.shiftKey ? 64 : 16;
    const delta = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
    if (!delta) return;
    event.preventDefault();
    setCustom(Math.min(max, Math.max(MIN_DRAG_WIDTH, iframeRef.current.offsetWidth + delta)));
  }

  // 同源 iframe：把示範品牌色寫進一個 <style>，換色不用重新載入
  function applySpot(key: SpotKey) {
    const doc = iframeRef.current?.contentDocument;
    if (!doc?.head) return;
    let style = doc.getElementById("sunui-spot-demo");
    if (!style) {
      style = doc.createElement("style");
      style.id = "sunui-spot-demo";
      doc.head.appendChild(style);
    }
    style.textContent = spotCss(key);
  }

  useEffect(() => applySpot(spot), [spot]);

  // 同源 iframe：直接觀察內容高度，讓外框跟著長高
  function handleLoad() {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    applySpot(spot);
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
        <div className="flex items-center gap-3">
          <div role="radiogroup" aria-label={labels.viewport} className="flex rounded-md border border-line p-0.5">
            {viewports.map((v) => {
              const active = custom === null && viewport === v.key;
              return (
                <button
                  key={v.key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={labels[v.key]}
                  title={`${labels[v.key]}${v.key === "desktop" ? "" : ` · ${v.width}`}`}
                  onClick={() => {
                    setViewport(v.key);
                    setCustom(null);
                  }}
                  className={cn(
                    "grid h-7 w-8 place-items-center rounded-[5px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    active ? "bg-fg text-bg" : "text-subtle hover:text-fg",
                  )}
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={v.icon} />
                  </svg>
                </button>
              );
            })}
          </div>
          {measured !== null && (
            <span aria-label={labels.width} className="font-mono text-[11px] text-subtle tabular-nums">
              {measured}px
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {spotSupported && (
            <div role="radiogroup" aria-label={labels.spot} className="flex items-center gap-1.5 border-r border-line pr-2">
              {spotKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={spot === key}
                  aria-label={labels.spotColors[key]}
                  title={labels.spotColors[key]}
                  onClick={() => setSpot(key)}
                  className={cn(
                    "grid size-5 place-items-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-accent",
                    spot === key ? "border-fg" : "border-transparent hover:border-line",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn("size-3 rounded-full", key === "ink" && "bg-fg")}
                    style={key === "ink" ? undefined : { background: spotSwatches[key].light }}
                  />
                </button>
              ))}
            </div>
          )}
          <ToolButton label={labels.replay} onClick={() => setRun((n) => n + 1)}>
            <path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4" />
          </ToolButton>
          <a
            href={previewUrl(`/preview/${name}`, locale)}
            target="_blank"
            rel="noreferrer"
            aria-label={labels.openTab}
            title={labels.openTab}
            className="grid size-7 place-items-center rounded-md text-subtle transition-colors outline-none hover:bg-stage hover:text-fg focus-visible:ring-2 focus-visible:ring-accent"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
            </svg>
          </a>
        </div>
      </div>
      {/* 外層不加任何留白：三種尺寸的展示區高度一致，只有寬度改變 */}
      <div
        ref={stageRef}
        className={cn("relative flex justify-center", custom === null && viewport === "desktop" ? "stage-dots" : "stage-surround")}
      >
        <iframe
          // 換語言時 router.refresh() 會帶來新的 locale，iframe 跟著重新載入
          key={`${locale}-${run}`}
          ref={iframeRef}
          src={previewUrl(`/preview/${name}`, locale)}
          title={format(labels.frameTitle, { name })}
          onLoad={handleLoad}
          className={cn(
            "block border-0",
            // 拖曳時不加過渡、也不讓 iframe 吃掉指標事件，否則游標一進 iframe 拖曳就斷了
            dragging ? "pointer-events-none" : "transition-[width] duration-300",
            (custom !== null || viewport !== "desktop") && "device-frame",
          )}
          style={{ width, maxWidth: "100%", height }}
        />
        {/* 右緣拖曳把手：寬度可以停在任何值，看 block 在兩個斷點之間的樣子。手機上沒有足夠寬度，不顯示 */}
        <div
          role="slider"
          tabIndex={0}
          aria-label={labels.resize}
          aria-orientation="horizontal"
          aria-valuemin={MIN_DRAG_WIDTH}
          aria-valuemax={stageRef.current?.clientWidth ?? undefined}
          aria-valuenow={measured ?? undefined}
          title={labels.resize}
          onPointerDown={startDrag}
          onKeyDown={nudge}
          // 雙擊回到目前尺寸按鈕的預設寬度
          onDoubleClick={() => setCustom(null)}
          className="group/handle absolute inset-y-0 hidden w-4 cursor-ew-resize touch-none items-center justify-center outline-none sm:flex"
          style={{ left: `calc(50% + min(${width}, 100%) / 2 - 8px)` }}
        >
          <span
            className={cn(
              "h-10 w-1.5 rounded-full bg-subtle/50 transition-colors group-hover/handle:bg-fg group-focus-visible/handle:bg-fg",
              dragging && "bg-fg",
            )}
          />
        </div>
      </div>
    </div>
  );
}

function ToolButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-7 place-items-center rounded-md text-subtle transition-colors outline-none hover:bg-stage hover:text-fg focus-visible:ring-2 focus-visible:ring-accent"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}
