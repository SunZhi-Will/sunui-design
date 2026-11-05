"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

const GUTTER = { card: 20, sheet: 32 } as const;
// 卡片排版的最小寬度：375 手機扣掉頁面左右留白，demo 本來就要在這個寬度下好看
const MIN_LAYOUT_WIDTH = 360;

/**
 * 型錄卡片 iframe 內的舞台：block 以原尺寸置中顯示。
 * 只有內容比卡片大時才等比縮小，放得下就維持 1:1，不放大。
 *
 * 自帶底色的 block（墨色主題、暗色 App 介面）會「滿版」：舞台改用 block 的底色，
 * 並拿掉 block 外框的圓角與邊線，看起來是一張同色的卡片，而不是白卡片裡浮著一塊黑框。
 *
 * mode="sheet" 給展開面板用：完整 demo、不縮小，內容太高就在舞台裡捲動；滿版規則相同。
 */
export function FitStage({ children, mode = "card" }: { children: ReactNode; mode?: "card" | "sheet" }) {
  const gutter = GUTTER[mode];
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [surface, setSurface] = useState<string | null>(null);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const update = () => {
      const available = window.innerWidth - gutter * 2;
      if (mode === "card") {
        // 卡片比手機還窄，直接用卡片寬排版會把流動寬度的 demo 擠扁（文字斷成一字一行、欄位疊不下）。
        // 至少給手機寬排版，block 真的用到這麼寬時再整體等比縮小，看起來就是縮圖而不是被壓扁
        content.style.width = `${Math.max(available, MIN_LAYOUT_WIDTH)}px`;
      }
      // block 根元素是置中的 flex 子項，寬度就是它實際用到的寬；按鈕這類小元件維持 1:1。
      // scrollWidth 再抓出撐破版面的固定寬元素；高度用版面高度，
      // 避免 hover 浮層或內部捲動區被裁掉的部分也算進去而無故縮小
      const root = content.firstElementChild?.firstElementChild;
      const used = root instanceof HTMLElement ? root.offsetWidth : 0;
      const overflow = content.scrollWidth > content.clientWidth ? content.scrollWidth : 0;
      const width = Math.max(used, overflow, 1);
      const height = Math.max(content.offsetHeight, 1);
      const byWidth = available / width;
      const byHeight = (window.innerHeight - gutter * 2) / height;
      setScale(mode === "sheet" ? 1 : Math.min(byWidth, byHeight, 1));
      setSurface(findSurface(content));
    };

    const observer = new ResizeObserver(update);
    observer.observe(content);
    window.addEventListener("resize", update);
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    scheme.addEventListener("change", update);
    update();
    // block 是動態載入的；背景分頁不繪製影格時 ResizeObserver 也不會觸發，所以再補幾次偵測
    const late = [400, 1200, 2500].map((ms) => window.setTimeout(update, ms));
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      scheme.removeEventListener("change", update);
      late.forEach(window.clearTimeout);
    };
  }, [gutter, mode]);

  if (mode === "sheet") {
    return (
      <div
        className="fixed inset-0 overflow-y-auto bg-card transition-colors duration-300"
        style={surface ? { backgroundColor: surface } : undefined}
      >
        <style>{BLEED_CSS}</style>
        <div className="flex min-h-full items-center justify-center" style={{ padding: gutter }}>
          <div ref={contentRef} className="w-full">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex cursor-zoom-in items-center justify-center overflow-clip bg-card transition-colors duration-300"
      style={surface ? { backgroundColor: surface } : undefined}
      // 點到元件以外的空白處（舞台或滿版的外框本身），請外層型錄展開成面板
      onClick={(event) => {
        const target = event.target as HTMLElement;
        const blank =
          target === event.currentTarget ||
          target === contentRef.current ||
          target === contentRef.current?.firstElementChild ||
          target.hasAttribute("data-card-bleed");
        if (blank && window.parent !== window) window.parent.postMessage({ type: "sunui:expand" }, window.location.origin);
      }}
    >
      <style>{BLEED_CSS}</style>
      <div
        ref={contentRef}
        // block 根元素是 flex 子項，預設會被壓窄（overflow-hidden 的固定寬元素甚至能壓到 0）；
        // 卡片要的是原寸排版再整體縮小，所以不讓它收縮
        className="shrink-0 origin-center [&>div>*]:shrink-0"
        style={{
          transform: `scale(${scale})`,
          opacity: scale ? 1 : 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// 滿版時拿掉 block 外框，讓它和舞台融成一片
const BLEED_CSS = `[data-card-bleed]{border-color:transparent!important;border-radius:0!important;box-shadow:none!important;outline:none!important}`;

/**
 * 沿著 block 最外層往下找第一個「有實心底色、而且佔滿大部分寬度」的元素。
 * 它的底色和舞台差很多時（例如亮色網站上的黑底 demo），回傳這個顏色讓舞台跟著換。
 */
function findSurface(content: HTMLElement): string | null {
  for (const el of content.querySelectorAll("[data-card-bleed]")) el.removeAttribute("data-card-bleed");

  // 和主題的卡片色比，而不是舞台目前的底色：滿版後舞台已經換成 block 的顏色，拿它比會來回抵銷
  const stageColor = parseColor(getComputedStyle(document.documentElement).getPropertyValue("--card").trim());
  let el: Element | null = content.firstElementChild;
  for (let depth = 0; el && depth < 5; depth++, el = el.firstElementChild) {
    if (!(el instanceof HTMLElement)) break;
    const style = getComputedStyle(el);
    // 底色透明但鋪了漸層的（墨色場景常見），取最後一個色標，也就是漸層外圍的顏色
    const color = parseColor(style.backgroundColor) ?? gradientEdge(style.backgroundImage);
    if (!color || color[3] < 0.95) continue;
    // 太小的色塊（按鈕、標籤）不算；窄長的直式面板（書櫃、手機框）算
    if (el.offsetWidth < content.offsetWidth * 0.3 && el.offsetHeight < content.offsetHeight * 0.6) return null;
    // 看得出邊界就滿版（純黑放在近黑卡片上也算）；紙色和白卡片的差距在門檻以下，維持原樣
    if (stageColor && Math.abs(luminance(color) - luminance(stageColor)) < 0.035) return null;
    el.setAttribute("data-card-bleed", "");
    return `rgb(${color[0]} ${color[1]} ${color[2]})`;
  }
  return null;
}

function gradientEdge(image: string): [number, number, number, number] | null {
  if (!image.includes("gradient")) return null;
  const stops = image.match(/(?:rgba?|lab|lch|oklab|oklch|color)\([^()]*\)|#[0-9a-f]{3,8}\b/gi);
  return stops ? parseColor(stops[stops.length - 1]) : null;
}

let probe: CanvasRenderingContext2D | null = null;

// Tailwind v4 的顏色是 lab() / oklch()，直接畫一個像素再讀回 sRGB，任何格式都能比較
function parseColor(value: string): [number, number, number, number] | null {
  if (!value || value === "transparent") return null;
  probe ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!probe) return null;
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = value;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data;
  return a === 0 ? null : [r, g, b, a / 255];
}

function luminance([r, g, b]: [number, number, number, number]) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}
