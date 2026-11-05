"use client";

import { useId, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

// 移植自 山河未歸 src/presentation/memoir/journey-shelf.tsx 與 main.css 的 shelf- / memoir-library- 樣式：
// 一層木頭書架，固定格數，每一格要不是一本側轉的小 3D 書，就是一個空位。

export interface Bookshelf3DItem {
  /** 放在第幾格（從 1 開始） */
  slot: number;
  /** store 模式比對 highlightId 用 */
  id?: string;
  /** 書脊題簽上的短名，約三個字，更長會整條縮小 */
  label: string;
  /** 完整書名，給螢幕閱讀器與預覽讀出 */
  title: string;
  /** 卷數、日期等補充說明 */
  meta?: string;
  /** paused：未完之書，同一套書但褪色 */
  status?: "complete" | "paused";
}

export interface Bookshelf3DProps {
  items: readonly Bookshelf3DItem[];
  /** 總格數，預設 10 */
  slotCount?: number;
  /** read：只有放了書的格子能點；store：每一格都能點，用來選位置 */
  mode?: "read" | "store";
  onPick?: (slot: number, item: Bookshelf3DItem | undefined) => void;
  /** 指到或聚焦某一格時呼叫，離開時傳 undefined */
  onPreview?: (slot: number | undefined, item: Bookshelf3DItem | undefined) => void;
  /** store 模式下，已經放著同一本書的那一格會標出來 */
  highlightId?: string;
  /** 書封圖，未提供時用 CSS 畫的書封 */
  frontSrc?: string;
  /** 書脊圖，未提供時用 CSS 畫的書脊 */
  spineSrc?: string;
  /** CSS 書脊上方的直書書名（只在沒有 spineSrc 時顯示） */
  spineTitle?: string;
  /** 聚焦外框與空位高亮色，預設原本的燈金 */
  accent?: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<Bookshelf3DLabels>;
  className?: string;
  style?: CSSProperties;
}

export interface Bookshelf3DLabels {
  shelf: string;
  slot: (slot: number) => string;
  empty: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, Bookshelf3DLabels> = {
  en: { shelf: "Memoir bookshelf", slot: (slot) => `Slot ${slot}`, empty: "empty" },
  "zh-TW": { shelf: "回憶錄書架", slot: (slot) => `第 ${slot} 格`, empty: "空位" },
  "zh-CN": { shelf: "回忆录书架", slot: (slot) => `第 ${slot} 格`, empty: "空位" },
  ja: { shelf: "回想録の本棚", slot: (slot) => `${slot} 番目の枠`, empty: "空き" },
};

const css = `
.sb3d{--shelf-plank-h:clamp(.9rem,2.2vh,1.3rem);display:grid;grid-template-columns:repeat(var(--shelf-slots,30),minmax(0,1fr));column-gap:2px;align-items:end;margin:0;padding:clamp(.8rem,2.4vh,1.4rem) clamp(.6rem,2vw,1.4rem) 0;list-style:none;background:linear-gradient(180deg,transparent calc(100% - var(--shelf-plank-h)),#7a5634 calc(100% - var(--shelf-plank-h)),#7a5634 calc(100% - var(--shelf-plank-h) + 3px),#4b3220 calc(100% - var(--shelf-plank-h) + 3px),#3a2617 calc(100% - 4px),#1c120a calc(100% - 4px)) 0 0 / 100% 100% no-repeat,repeating-linear-gradient(92deg,transparent 0 22px,rgba(255,220,170,.035) 22px 24px,transparent 24px 57px) 0 0 / 100% 100%}
.sb3d .shelf-slot{position:relative;box-sizing:border-box;display:flex;align-items:flex-end;min-width:0;padding-bottom:var(--shelf-plank-h);container-type:inline-size;--book-h:268cqw;--book-w:calc(var(--book-h) / 1.5);--book-d:calc(var(--book-h) * .1458)}
.sb3d .shelf-spine{position:relative;display:block;width:100%;height:var(--book-h);margin:0;padding:0;border:0;background:none;color:inherit;font:inherit;cursor:pointer;perspective:1600px;-webkit-tap-highlight-color:transparent}
.sb3d .shelf-spine:focus-visible{outline:none}
.sb3d .shelf-book3d{position:absolute;top:0;left:50%;width:var(--book-w);height:var(--book-h);margin-left:calc(var(--book-w) / -2);transform-style:preserve-3d;transform:rotateY(77deg);transition:transform .35s cubic-bezier(.22,1,.36,1)}
.sb3d .shelf-spine:hover .shelf-book3d,.sb3d .shelf-spine:focus-visible .shelf-book3d{transform:translateY(-.5rem) translateZ(1rem) rotateY(68deg)}
.sb3d .shelf-book3d-face{position:absolute;overflow:hidden;backface-visibility:hidden}
.sb3d .shelf-book3d-art{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover;pointer-events:none}
.sb3d .shelf-book3d-front{inset:0;transform:translateZ(calc(var(--book-d) / 2))}
.sb3d .shelf-book3d-front::after{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.45),rgba(0,0,0,.2));content:""}
.sb3d .shelf-book3d-spine{top:0;left:0;width:var(--book-d);height:100%;transform:rotateY(-90deg) translateZ(calc(var(--book-d) / 2))}
.sb3d .shelf-book3d-spine::after{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.5) 0%,rgba(255,240,210,.08) 30%,rgba(255,240,210,.12) 40%,rgba(0,0,0,0) 65%,rgba(0,0,0,.45) 100%);content:"";pointer-events:none}
.sb3d .shelf-book3d-edge{top:0;right:0;width:var(--book-d);height:100%;background:repeating-linear-gradient(to bottom,#ece3cd 0,#ece3cd 2px,#d6c9a6 2px,#d6c9a6 3px);transform:rotateY(90deg) translateZ(calc(var(--book-d) / 2))}
.sb3d .shelf-spine[data-status="paused"] .shelf-book3d-art{filter:grayscale(.75) brightness(.72)}
.sb3d .shelf-spine:focus-visible .shelf-book3d-spine{outline:2px solid var(--sb3d-accent);outline-offset:-2px}
.sb3d .shelf-spine-slip{position:absolute;z-index:1;top:47%;left:50%;box-sizing:border-box;max-height:27%;overflow:hidden;padding:calc(var(--book-d) * .2) calc(var(--book-d) * .06);border:1px solid rgba(138,106,63,.75);background:linear-gradient(170deg,#f1e8d2,#d9ccad);color:#3a2c1c;box-shadow:0 1px 3px rgba(0,0,0,.55);font-family:var(--sb3d-font);font-size:calc(var(--book-d) * .4 * var(--slip-scale,1));line-height:1.1;letter-spacing:.1em;white-space:nowrap;writing-mode:vertical-rl;transform:translateX(-50%)}
.sb3d .shelf-empty{display:block;width:calc(var(--book-h) * .33);height:var(--book-h);margin:0 auto;padding:0;border:1px solid rgba(224,194,145,.08);border-radius:2px;background:linear-gradient(90deg,rgba(255,240,210,.015),rgba(255,240,210,.035),rgba(255,240,210,.015));cursor:pointer;transition:border-color .2s ease,background-color .2s ease}
.sb3d .shelf-empty:disabled{cursor:default}
.sb3d .shelf-empty:not(:disabled):hover,.sb3d .shelf-empty:not(:disabled):focus-visible{border-color:var(--sb3d-accent);background:rgba(232,207,154,.14);outline:none}
.sb3d .shelf-slot-highlight .shelf-book3d-spine{outline:2px solid rgba(232,207,154,.9);outline-offset:-2px}
.sb3d .sb3d-cloth{background:linear-gradient(180deg,#2a2620 0 1.6%,transparent 1.6% 2.6%,#a37b4c 2.6% 3.2%,transparent 3.2% 4.1%,#a37b4c 4.1% 4.6%,transparent 4.6% 95.4%,#a37b4c 95.4% 95.9%,transparent 95.9% 96.8%,#a37b4c 96.8% 97.4%,transparent 97.4% 98.4%,#2a2620 98.4%),linear-gradient(90deg,transparent 0 12%,rgba(176,138,84,.5) 12% 14%,transparent 14% 86%,rgba(176,138,84,.5) 86% 88%,transparent 88%),repeating-linear-gradient(45deg,rgba(255,255,255,.025) 0 1px,transparent 1px 3px),linear-gradient(90deg,#15191f,#252b33 50%,#15191f)}
.sb3d .sb3d-spine-title{position:absolute;top:7%;left:50%;color:#d8d0bf;font-family:var(--sb3d-font);font-size:calc(var(--book-d) * .5);line-height:1.05;writing-mode:vertical-rl;white-space:nowrap;text-shadow:0 1px 1px rgba(0,0,0,.6);transform:translateX(-50%)}
.sb3d .sb3d-seal{position:absolute;top:39%;left:50%;width:calc(var(--book-d) * .2);height:calc(var(--book-d) * .2);background:#a3302a;transform:translateX(-50%)}
.sb3d .sb3d-emblem{position:absolute;bottom:6%;left:50%;width:56%;transform:translateX(-50%)}
@media (prefers-reduced-motion:reduce){.sb3d .shelf-book3d{transition:none}}
`;

/** 沒有書封圖時：霧夜山水的深藍灰書封 */
function FrontArt() {
  const id = useId().replace(/:/g, "");
  return (
    <svg className="shelf-book3d-art" viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b4656" />
          <stop offset=".45" stopColor="#222a35" />
          <stop offset="1" stopColor="#0d1116" />
        </linearGradient>
        <radialGradient id={`${id}-moon`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#e9ebef" stopOpacity=".55" />
          <stop offset="1" stopColor="#e9ebef" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-mist`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9d0da" stopOpacity="0" />
          <stop offset=".5" stopColor="#c9d0da" stopOpacity=".22" />
          <stop offset="1" stopColor="#c9d0da" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="200" height="300" fill={`url(#${id}-sky)`} />
      <circle cx="122" cy="38" r="22" fill={`url(#${id}-moon)`} />
      <circle cx="122" cy="38" r="7" fill="#e6e8ec" opacity=".85" />
      <path d="M0 150 L30 112 L52 128 L84 86 L112 120 L140 92 L170 124 L200 104 V300 H0 Z" fill="#46515f" opacity=".7" />
      <rect y="150" width="200" height="60" fill={`url(#${id}-mist)`} />
      <path d="M0 210 L26 178 L58 196 L96 160 L128 192 L160 170 L200 196 V300 H0 Z" fill="#26303c" />
      <rect y="214" width="200" height="50" fill={`url(#${id}-mist)`} />
      <path d="M0 300 V258 L40 246 L70 262 L120 240 L160 250 L200 236 V300 Z" fill="#0b0e12" />
    </svg>
  );
}

/** 沒有書脊圖時：深色布面、上下燈金箍線、印章與山形徽記 */
function SpineArt({ title }: { title?: string }) {
  return (
    <span className="shelf-book3d-art sb3d-cloth" aria-hidden="true">
      {title && <span className="sb3d-spine-title">{title}</span>}
      <span className="sb3d-seal" />
      <svg className="sb3d-emblem" viewBox="0 0 40 40" fill="none">
        <path d="M30 8 A15 15 0 1 0 31 33" stroke="#9aa3b0" strokeWidth="2" strokeLinecap="round" opacity=".75" />
        <path d="M9 27 L19 13 L23 18 L26 15 L32 27 Z" fill="#c7ccd4" opacity=".8" />
        <path d="M12 32 C18 29 22 33 30 30" stroke="#9aa3b0" strokeWidth="1.5" strokeLinecap="round" opacity=".7" />
      </svg>
    </span>
  );
}

function SpineFace({ item, frontSrc, spineSrc, spineTitle }: { item: Bookshelf3DItem; frontSrc?: string; spineSrc?: string; spineTitle?: string }) {
  // 題簽約放得下三個字，更長的名稱整條縮小，不要切掉半個字。
  const style = { "--slip-scale": Math.min(1, 3 / Math.max(1, item.label.length)).toFixed(3) } as CSSProperties;
  return (
    <span className="shelf-book3d" aria-hidden="true" style={style}>
      <span className="shelf-book3d-face shelf-book3d-front">
        {frontSrc ? <img className="shelf-book3d-art" src={frontSrc} alt="" draggable={false} loading="lazy" /> : <FrontArt />}
      </span>
      <span className="shelf-book3d-face shelf-book3d-edge" />
      <span className="shelf-book3d-face shelf-book3d-spine">
        {spineSrc ? <img className="shelf-book3d-art" src={spineSrc} alt="" draggable={false} /> : <SpineArt title={spineTitle} />}
        <span className="shelf-spine-slip">{item.label}</span>
      </span>
    </span>
  );
}

export function Bookshelf3D({
  items,
  slotCount = 10,
  mode = "read",
  onPick,
  onPreview,
  highlightId,
  frontSrc,
  spineSrc,
  spineTitle,
  accent = "#e7c489",
  locale = "en",
  labels: labelsProp,
  className,
  style,
}: Bookshelf3DProps) {
  const labels = { ...MESSAGES[resolveLocale(locale)], ...labelsProp };
  const bySlot = new Map(items.map((item) => [item.slot, item]));

  return (
    <>
      <style>{css}</style>
      <ul
        className={cn("sb3d", className)}
        aria-label={labels.shelf}
        onMouseLeave={() => onPreview?.(undefined, undefined)}
        style={
          {
            "--shelf-slots": slotCount,
            "--sb3d-accent": accent,
            "--sb3d-font": '"LXGW WenKai TC", "Kaiti TC", "BiauKai", "DFKai-SB", "Noto Serif TC", "Songti TC", serif',
            ...style,
          } as CSSProperties
        }
      >
        {Array.from({ length: slotCount }, (_, index) => index + 1).map((slot) => {
          const item = bySlot.get(slot);
          const slotName = labels.slot(slot);
          const highlighted = mode === "store" && item !== undefined && item.id !== undefined && item.id === highlightId;
          const previewHandlers = {
            onMouseEnter: () => onPreview?.(slot, item),
            onFocus: () => onPreview?.(slot, item),
            onBlur: () => onPreview?.(undefined, undefined),
          };

          return (
            <li key={slot} className={cn("shelf-slot", highlighted && "shelf-slot-highlight")}>
              {item ? (
                <button type="button" className="shelf-spine" data-status={item.status ?? "complete"} onClick={() => onPick?.(slot, item)} {...previewHandlers}>
                  <SpineFace item={item} frontSrc={frontSrc} spineSrc={spineSrc} spineTitle={spineTitle} />
                  <span className="sr-only">
                    {slotName}: {item.title}
                  </span>
                  {item.meta && <span className="sr-only">{item.meta}</span>}
                </button>
              ) : (
                <button type="button" className="shelf-empty" disabled={mode === "read"} onClick={() => onPick?.(slot, undefined)} {...previewHandlers}>
                  <span className="sr-only">
                    {slotName}: {labels.empty}
                  </span>
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
