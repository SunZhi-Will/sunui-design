"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// 移植自 死神的祝福 src/presentation/memoir/cg-gallery-panel.tsx、cg-gallery-panel.css、
// cg-viewer-overlay.tsx 與 main.css 的 .records-panel / .memoir-cg-viewer 樣式：
// 回憶錄書庫的「畫面」頁。全部 CG 都列出來，沒看過的格子只告訴玩家這裡有一張圖，
// 不露出圖、標題與說明；點開已解鎖的 CG 進入全畫面檢視，下方是標題與說明。

export interface CgGalleryEntry {
  id: string;
  title: string;
  description: string;
  /** 已解鎖才會顯示圖與標題 */
  unlocked: boolean;
  /** 圖片網址 */
  src?: string;
  /** 沒有圖片時改放任意節點（例如插畫或 CSS 圖），會鋪滿 16:9 的格子 */
  art?: ReactNode;
}

export interface CgGalleryProps {
  entries: readonly CgGalleryEntry[];
  /** true：檢視器鋪滿整個視窗；false：鋪滿圖鑑本身（外層需要有高度） */
  fixed?: boolean;
  /** 開啟或關閉檢視器時呼叫 */
  onOpenChange?: (entry: CgGalleryEntry | undefined) => void;
  /** 指到格子與已解鎖數字的顏色，預設原本的靈魂之絲粉 */
  accent?: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<CgGalleryLabels>;
  className?: string;
  style?: CSSProperties;
}

export interface CgGalleryLabels {
  region: string;
  heading: string;
  unlocked: (count: number, total: number) => string;
  locked: string;
  view: (title: string) => string;
  lockedAria: (index: number) => string;
  hint: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, CgGalleryLabels> = {
  en: {
    region: "CG gallery",
    heading: "Scenes",
    unlocked: (count, total) => `Unlocked ${count}/${total}`,
    locked: "Locked",
    view: (title) => `View CG: ${title}`,
    lockedAria: (index) => `CG ${index}, locked`,
    hint: "Click or press Space to return",
  },
  "zh-TW": {
    region: "CG 圖鑑",
    heading: "現場畫面",
    unlocked: (count, total) => `已解鎖 ${count}／${total}`,
    locked: "尚未解鎖",
    view: (title) => `檢視 CG：${title}`,
    lockedAria: (index) => `第 ${index} 張 CG，尚未解鎖`,
    hint: "點擊或按空白鍵返回",
  },
  "zh-CN": {
    region: "CG 图鉴",
    heading: "现场画面",
    unlocked: (count, total) => `已解锁 ${count}／${total}`,
    locked: "尚未解锁",
    view: (title) => `查看 CG：${title}`,
    lockedAria: (index) => `第 ${index} 张 CG，尚未解锁`,
    hint: "点击或按空格键返回",
  },
  ja: {
    region: "CG ギャラリー",
    heading: "シーン",
    unlocked: (count, total) => `解放 ${count}／${total}`,
    locked: "未解放",
    view: (title) => `CG を見る：${title}`,
    lockedAria: (index) => `CG ${index}、未解放`,
    hint: "クリックかスペースキーで戻る",
  },
};

const LOCK_ICON = "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6zM12 15v2";

function Art({ entry, alt }: { entry: CgGalleryEntry; alt: string }) {
  if (entry.src) return <img src={entry.src} alt={alt} loading="lazy" />;
  return (
    <div className="scg-art" role={alt ? "img" : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true}>
      {entry.art}
    </div>
  );
}

export function CgGallery({
  entries,
  fixed = true,
  onOpenChange,
  accent = "#e6a4b8",
  locale = "en",
  labels,
  className,
  style,
}: CgGalleryProps) {
  const l = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const [open, setOpen] = useState<CgGalleryEntry | undefined>();
  const viewerRef = useRef<HTMLDivElement>(null);
  const returnRef = useRef<HTMLButtonElement | null>(null);
  const unlockedCount = entries.filter((entry) => entry.unlocked).length;

  const show = (entry: CgGalleryEntry | undefined, from?: HTMLButtonElement) => {
    if (from) returnRef.current = from;
    setOpen(entry);
    onOpenChange?.(entry);
  };

  // 開啟時把焦點交給檢視器，關閉後回到原本那一格
  useEffect(() => {
    if (open) viewerRef.current?.focus();
    else returnRef.current?.focus();
  }, [open]);

  // 原作的 ui.escape 與 ui.continue（空白鍵）不論焦點在哪都能關閉
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === " ") {
        event.preventDefault();
        show(undefined);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <section
      className={cn("scg", className)}
      aria-label={l.region}
      style={{ "--scg-thread": accent, ...style } as CSSProperties}
    >
      <style>{css}</style>
      <h3 className="scg-heading">
        {l.heading} <span>{l.unlocked(unlockedCount, entries.length)}</span>
      </h3>
      <ul className="scg-grid">
        {entries.map((entry, index) => (
          <li key={entry.id}>
            {entry.unlocked ? (
              <button
                type="button"
                className="scg-card"
                aria-label={l.view(entry.title)}
                onClick={(event) => show(entry, event.currentTarget)}
              >
                <Art entry={entry} alt="" />
                <span className="scg-title">{entry.title}</span>
              </button>
            ) : (
              <div className="scg-card is-locked" role="img" aria-label={l.lockedAria(index + 1)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d={LOCK_ICON} />
                </svg>
                <span className="scg-title">{l.locked}</span>
              </div>
            )}
          </li>
        ))}
      </ul>

      {open ? (
        <div
          ref={viewerRef}
          className="scg-viewer"
          data-fixed={fixed ? "true" : undefined}
          role="button"
          tabIndex={0}
          onClick={() => show(undefined)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              show(undefined);
            }
          }}
        >
          <Art entry={open} alt={open.title} />
          <figure className="scg-caption">
            <h3>{open.title}</h3>
            <p>{open.description}</p>
          </figure>
          <span className="scg-hint">{l.hint}</span>
        </div>
      ) : null}
    </section>
  );
}

const css = `
.scg{position:relative;container-type:inline-size;display:flex;flex-direction:column;min-height:0;overflow:hidden;box-sizing:border-box;padding:clamp(.5rem,2vh,1.1rem) clamp(.8rem,2.5vw,1.8rem);color:#d7deeb;border:1px solid rgba(143,157,182,.42);border-top-width:3px;border-radius:2px;background:radial-gradient(ellipse 60% 110% at 100% 0%,rgba(163,184,217,.14),transparent 70%),linear-gradient(180deg,#151b28,#0c1019);box-shadow:0 1.2rem 2.5rem rgba(0,0,0,.6);--scg-font:"Noto Serif TC","Songti TC","PMingLiU",serif}
.scg-heading{display:flex;align-items:baseline;gap:.7rem;margin:0 0 clamp(.3rem,1vh,.6rem);color:#8fa3c6;font-family:var(--scg-font);font-size:clamp(.82rem,1.2vw,.98rem);font-weight:400;letter-spacing:.16em}
.scg-heading span{color:var(--scg-thread);font-size:.9em;letter-spacing:.04em}
.scg-grid{flex:1 1 auto;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));align-content:start;gap:clamp(.4rem,1.2vw,.9rem);min-height:0;margin:0;padding:0;overflow-y:auto;list-style:none}
.scg-card{position:relative;display:block;width:100%;aspect-ratio:16/9;padding:0;overflow:hidden;color:#eef2f9;background:#0a0e16;border:1px solid rgba(143,157,182,.42);border-radius:2px;font:inherit}
button.scg-card{cursor:pointer;transition:border-color 160ms ease}
button.scg-card:hover,button.scg-card:focus-visible{border-color:var(--scg-thread);outline:none}
.scg-card img,.scg-card .scg-art{display:block;width:100%;height:100%;object-fit:cover}
.scg-title{position:absolute;right:0;bottom:0;left:0;padding:1.1em .6em .3em;font-family:var(--scg-font);font-size:clamp(.62rem,1vw,.85rem);letter-spacing:.08em;text-align:left;background:linear-gradient(transparent,rgba(5,7,12,.85))}
.scg-card.is-locked{display:flex;align-items:center;justify-content:center;color:rgba(158,177,209,.6);background:repeating-linear-gradient(-45deg,#0f1420 0 .5rem,#0b0f18 .5rem 1rem);border-style:dashed}
.scg-card.is-locked svg{width:clamp(1.1rem,3vw,2rem);height:clamp(1.1rem,3vw,2rem);margin-bottom:.8em;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.scg-card.is-locked .scg-title{background:none;text-align:center}
.scg-viewer{position:absolute;inset:0;z-index:95;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.94);cursor:pointer;outline:none;animation:scg-fade 420ms ease both}
.scg-viewer[data-fixed]{position:fixed}
.scg-viewer img{max-width:100%;max-height:100%;object-fit:contain}
.scg-viewer .scg-art{width:100%;max-height:100%;aspect-ratio:16/9}
.scg-caption{position:absolute;right:0;bottom:0;left:0;margin:0;padding:2.6rem clamp(1.2rem,6vw,4rem) 1.1rem;background:linear-gradient(transparent,rgba(0,0,0,.82));color:#d7deeb;text-align:center;pointer-events:none}
.scg-caption h3{margin:0 0 .35rem;font-size:clamp(1rem,1.4vw,1.3rem);font-weight:600;letter-spacing:.09em}
.scg-caption p{margin:0;color:rgba(215,222,235,.82);font-size:clamp(.78rem,.95vw,.95rem);line-height:1.7}
.scg-hint{position:absolute;top:4%;right:5%;color:rgba(255,255,255,.66);font-size:.8rem;letter-spacing:.1em;text-shadow:0 1px 6px rgba(0,0,0,.9)}
@keyframes scg-fade{from{opacity:0}to{opacity:1}}
@container (max-width:28rem){.scg-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (prefers-reduced-motion:reduce){.scg-viewer{animation:none}button.scg-card{transition:none}}
`;
