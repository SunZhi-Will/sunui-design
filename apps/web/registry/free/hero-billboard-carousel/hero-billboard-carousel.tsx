"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** 每張停留多久（毫秒）。W3C／UX 研究建議 5 到 7 秒，太快讀不完標題 */
const SLIDE_MS = 6500;
/** 拖曳超過多少 px 才算換張，太小會把「點一下」誤判成滑動 */
const SWIPE_PX = 48;

export interface HeroBillboardSlide {
  key: string;
  title: string;
  /** 有就整張卡是連結；沒有就呼叫 onSelect */
  href?: string;
  /** 疊在封面上的小標（overlayTitle 時才顯示） */
  subtitle?: string;
  /** 封面圖片網址（16:9） */
  image?: string;
  imageAlt?: string;
  /** 沒有圖片時的封面內容，填滿 16:9 封面區 */
  cover?: ReactNode;
  /** 封面本身沒有標題字時，在封面上疊一層標題 */
  overlayTitle?: boolean;
  overlayColor?: string;
  /** 下方資訊列的分類字，例：Free live session */
  eyebrow?: string;
  /** 一行時間或補充資訊 */
  meta?: string;
  /** 金額或 Free */
  price?: string;
  /** 主要按鈕文字 */
  cta?: string;
  /** 狀態標籤，例：Open */
  badge?: string;
  /** 沒有圖片時環境光改用這兩個顏色 */
  accentFrom?: string;
  accentTo?: string;
}

export interface HeroBillboardCarouselLabels {
  region?: string;
  prev?: string;
  next?: string;
  defaultCta?: string;
  slide?: (index: number, total: number, title: string) => string;
  goTo?: (title: string) => string;
  dot?: (index: number, title: string) => string;
}

export interface HeroBillboardCarouselProps {
  items: HeroBillboardSlide[];
  /** 輪播上方、與中間卡片同寬的一列（標語、連結） */
  intro?: ReactNode;
  /** 每張停留毫秒數 */
  slideMs?: number;
  /** 原專案預設暗色，淺色主題一起保留 */
  theme?: "dark" | "light";
  /** 沒有 href 的卡片被點擊時 */
  onSelect?: (slide: HeroBillboardSlide, index: number) => void;
  labels?: HeroBillboardCarouselLabels;
  className?: string;
}

const defaultLabels: Required<HeroBillboardCarouselLabels> = {
  region: "Upcoming events and featured courses",
  prev: "Previous slide",
  next: "Next slide",
  defaultCta: "View details",
  slide: (i, n, title) => `Slide ${i + 1} of ${n}: ${title}`,
  goTo: (title) => `Go to: ${title}`,
  dot: (i, title) => `Slide ${i + 1}: ${title}`,
};

/** 第 i 張相對於目前這張的位置：0 是中間，±1 是兩側露出的那張，其餘藏起來 */
function signedOffset(i: number, active: number, n: number, dir: 1 | -1): number {
  const d = (i - active + n) % n;
  if (n % 2 === 0 && d === n / 2) return dir > 0 ? -d : d; // 偶數張時正對面那張：留在剛離開的那一側
  return d > n / 2 ? d - n : d;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

function SlideMedia({ slide }: { slide: HeroBillboardSlide }) {
  return (
    <>
      {slide.image ? (
        <img src={slide.image} alt={slide.imageAlt ?? slide.title} draggable={false} className="absolute inset-0 h-full w-full object-cover" />
      ) : slide.cover != null ? (
        <div className="absolute inset-0">{slide.cover}</div>
      ) : (
        <div className="absolute inset-0" style={{ background: "var(--card-raised)" }} />
      )}
      {slide.overlayTitle && (
        <div className="absolute inset-0" style={{ containerType: "inline-size" }}>
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(6,6,20,0.65) 75%, rgba(6,6,20,0.92) 100%)" }} />
          <div className="absolute inset-x-0 bottom-0" style={{ padding: "4.5cqw", paddingRight: "20cqw" }}>
            <div className="line-clamp-1 font-bold uppercase tracking-[0.2em]" style={{ fontSize: "clamp(9px,1.6cqw,14px)", marginBottom: "1cqw", color: slide.overlayColor }}>
              {slide.subtitle}
            </div>
            <div className="line-clamp-2 font-black leading-tight" style={{ fontSize: "clamp(16px,3.6cqw,38px)", color: "#fff" }}>
              {slide.title}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ArrowIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {dir === "left" ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
    </svg>
  );
}

/**
 * 滿版焦點輪播：中間一張大封面、左右各露出上一張與下一張（點了就切過去），
 * 背後是目前封面模糊放大的環境光。卡片正下方是圓點指示器，目前這張拉長成進度條。
 *
 * 自動播放依 W3C APG 輪播模式：滑鼠移入、鍵盤焦點進入、分頁隱藏時暫停；
 * 系統開了「減少動態」時不自動播放。換張由進度條的 animationend 觸發，暫停後接著走。
 */
export function HeroBillboardCarousel({ items, intro, slideMs = SLIDE_MS, theme = "dark", onSelect, labels, className }: HeroBillboardCarouselProps) {
  const l = { ...defaultLabels, ...labels };
  const n = items.length;
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const reducedMotion = usePrefersReducedMotion();
  const [hovering, setHovering] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  const [docHidden, setDocHidden] = useState(false);
  // 上一輪每張的位置，用來偵測「繞圈從另一側跳過去」的那張
  const prevOffsets = useRef<number[]>([]);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    const onVis = () => setDocHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const go = useCallback(
    (target: number, direction?: 1 | -1) => {
      if (n < 2) return;
      const next = ((target % n) + n) % n;
      setActive((cur) => {
        if (next === cur) return cur;
        if (direction) setDir(direction);
        else {
          const forward = (next - cur + n) % n;
          setDir(forward <= n / 2 ? 1 : -1);
        }
        return next;
      });
    },
    [n],
  );
  const next = useCallback(() => go(active + 1, 1), [go, active]);
  const prev = useCallback(() => go(active - 1, -1), [go, active]);

  const autoplay = n > 1 && !reducedMotion;
  const playing = autoplay && !hovering && !focusInside && !docHidden;

  const offsets = items.map((_, i) => signedOffset(i, active, n, dir));
  const jumps = offsets.map((o, i) => {
    const p = prevOffsets.current[i];
    return p !== undefined && p !== o && Math.sign(p) !== Math.sign(o) && Math.sign(p) !== 0 && Math.sign(o) !== 0;
  });
  useEffect(() => {
    prevOffsets.current = offsets;
  });

  const onPointerMoveCard = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  if (n === 0) return null;

  return (
    <section
      className={cn("hbc-root", className)}
      data-theme={theme}
      aria-roledescription="carousel"
      aria-label={l.region}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      // 只有鍵盤焦點才暫停：滑鼠點箭頭也會拿到焦點，若一律暫停，點過一次就再也不會自動換張
      onFocus={(e) => {
        if ((e.target as HTMLElement).matches?.(":focus-visible")) setFocusInside(true);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusInside(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          next();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          prev();
        }
      }}
    >
      <style>{BILLBOARD_CSS}</style>
      <div className="hbc-ambient" aria-hidden>
        {items.map((slide, i) => (
          <div key={slide.key} className="hbc-ambient-layer" data-active={i === active}>
            {slide.image ? (
              <img src={slide.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${slide.accentFrom ?? "#1a1a24"}, ${slide.accentTo ?? "#f5c045"})` }} />
            )}
          </div>
        ))}
      </div>
      <div className="hbc-scrim" aria-hidden />

      <div className="hbc-inner">
        {intro && <div className="hbc-intro">{intro}</div>}

        <div
          className="hbc-track"
          onPointerDown={(e) => {
            if (n < 2 || (e.pointerType === "mouse" && e.button !== 0)) return;
            drag.current = { x: e.clientX, y: e.clientY, moved: false };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (d && Math.abs(e.clientX - d.x) > 8) d.moved = true;
          }}
          onPointerUp={(e) => {
            const d = drag.current;
            drag.current = null;
            if (!d) return;
            const dx = e.clientX - d.x;
            if (Math.abs(dx) >= SWIPE_PX && Math.abs(dx) > Math.abs(e.clientY - d.y)) {
              suppressClick.current = true;
              if (dx < 0) next();
              else prev();
            }
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
          onClickCapture={(e) => {
            // 拖曳換張後放開滑鼠，不要順便觸發卡片連結
            if (suppressClick.current) {
              suppressClick.current = false;
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          {items.map((slide, i) => {
            const o = offsets[i];
            const pos = o === 0 ? "front" : Math.abs(o) === 1 ? "side" : "hidden";
            const cta = slide.cta ?? l.defaultCta;
            return (
              <div
                key={slide.key}
                className="hbc-slide"
                data-pos={pos}
                data-jump={jumps[i] || undefined}
                role="group"
                aria-roledescription="slide"
                aria-label={l.slide(i, n, slide.title)}
                aria-hidden={pos !== "front"}
                onPointerMove={pos === "front" ? onPointerMoveCard : undefined}
                style={{ "--o": o, "--origin": o > 0 ? "0%" : o < 0 ? "100%" : "50%" } as CSSProperties}
              >
                {/* 圖片、文字、按鈕同一張卡（同一個外框） */}
                <div className="hbc-frame">
                  <div className="hbc-media">
                    <SlideMedia slide={slide} />
                  </div>
                  <span className="hbc-glare" aria-hidden />
                </div>
                <div className="hbc-panel">
                  <div className="hbc-panel-text">
                    <div className="hbc-meta-row">
                      {slide.badge && (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-extrabold" style={{ background: "var(--accent-gold)", color: "#111" }}>
                          {slide.badge}
                        </span>
                      )}
                      {slide.eyebrow && (
                        <span className="font-extrabold tracking-[0.06em]" style={{ color: "var(--accent-gold)" }}>
                          {slide.eyebrow}
                        </span>
                      )}
                      {/* 時間與價格併成一段，太長時整段一起以刪節號收尾 */}
                      {(slide.meta || slide.price) && <span>{[slide.meta, slide.price].filter(Boolean).join(" · ")}</span>}
                    </div>
                    <h2 className="hbc-title" title={slide.title}>
                      {slide.title}
                    </h2>
                  </div>
                  {/* 整張卡就是連結，按鈕只是視覺提示（span），避免連結裡再包連結 */}
                  <span className="hbc-cta" aria-hidden>
                    {cta} →
                  </span>
                </div>
                <span className="hbc-ring" aria-hidden />
                {pos === "front" ? (
                  slide.href ? (
                    <a href={slide.href} className="hbc-hit" aria-label={`${slide.title}: ${cta}`} draggable={false} />
                  ) : (
                    <button type="button" className="hbc-hit" aria-label={`${slide.title}: ${cta}`} onClick={() => onSelect?.(slide, i)} />
                  )
                ) : (
                  <button type="button" className="hbc-hit" tabIndex={-1} aria-label={l.goTo(slide.title)} onClick={() => go(i, o > 0 ? 1 : -1)} />
                )}
              </div>
            );
          })}

          {n > 1 && (
            <>
              <button type="button" className="hbc-arrow hbc-arrow-prev" onClick={prev} aria-label={l.prev}>
                <ArrowIcon dir="left" />
              </button>
              <button type="button" className="hbc-arrow hbc-arrow-next" onClick={next} aria-label={l.next}>
                <ArrowIcon dir="right" />
              </button>
            </>
          )}
        </div>

        {/* 指示器：在中間那張正下方、不疊在圖上。目前這張拉長成進度條，跑滿換下一張 */}
        {n > 1 && (
          <div className="hbc-dots">
            {items.map((slide, i) => {
              const isCurrent = i === active;
              return (
                <button
                  key={slide.key}
                  type="button"
                  className="hbc-dot"
                  aria-current={isCurrent}
                  aria-label={l.dot(i, slide.title)}
                  data-static={(isCurrent && !autoplay) || undefined}
                  onClick={() => go(i)}
                  style={{ "--dur": `${slideMs}ms`, "--play": playing ? "running" : "paused" } as CSSProperties}
                >
                  <span
                    // key 換張時重建，進度從 0 開始；跑滿就換下一張
                    key={isCurrent ? `run-${active}` : "idle"}
                    className="hbc-dot-fill"
                    onAnimationEnd={isCurrent ? next : undefined}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// 原本的 CSS module 照搬成 scoped class（hbc- 前綴）。視窗單位 vw 改成容器單位 cqw，
// 放在任何寬度的容器裡都以容器寬度計算；@media 768px 改成 @container。
const BILLBOARD_CSS = `
.hbc-root {
  --bg: #000000;
  --text-primary: rgba(255,255,255,0.93);
  --text-secondary: rgba(255,255,255,0.58);
  --card: rgba(255,255,255,0.05);
  --card-raised: rgba(255,255,255,0.08);
  --border: rgba(255,255,255,0.10);
  --accent-gold: #F5C045;
  --hero-bg: radial-gradient(120% 85% at 76% 6%, rgba(245,192,69,0.16), transparent 56%), linear-gradient(180deg, #0d0d11 0%, #08080b 100%);
  --gap: 28px;
  --side-scale: 0.86;
  --side-dim: brightness(0.5) saturate(0.75);
  --side-dim-hover: brightness(0.72) saturate(0.9);
  --ambient-opacity: 0.6;
  --scrim: rgba(8, 8, 11, 0.42);
  container-type: inline-size;
  position: relative;
  overflow: hidden;
  isolation: isolate;
  background: linear-gradient(180deg, transparent 78%, var(--bg) 100%), var(--hero-bg);
  color: var(--text-primary);
}
.hbc-root[data-theme="light"] {
  --bg: #ffffff;
  --text-primary: rgba(15, 23, 42, 0.95);
  --text-secondary: rgba(15, 23, 42, 0.75);
  --card: #ffffff;
  --card-raised: #ffffff;
  --border: rgba(15, 23, 42, 0.06);
  --accent-gold: #d97706;
  --hero-bg: radial-gradient(120% 85% at 76% 6%, rgba(217,119,6,0.09), transparent 56%), linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
  --side-dim: saturate(0.7) opacity(0.55);
  --side-dim-hover: saturate(0.9) opacity(0.8);
  --ambient-opacity: 0.4;
  --scrim: rgba(255, 255, 255, 0.5);
}
.hbc-ambient {
  position: absolute;
  inset: -12%;
  z-index: -2;
  pointer-events: none;
  -webkit-mask-image: linear-gradient(180deg, #000 0%, #000 50%, transparent 88%);
  mask-image: linear-gradient(180deg, #000 0%, #000 50%, transparent 88%);
}
.hbc-ambient-layer {
  position: absolute;
  inset: 0;
  opacity: 0;
  filter: blur(56px) saturate(1.5);
  transform: scale(1.1);
  transition: opacity 1.2s ease;
}
.hbc-ambient-layer[data-active="true"] { opacity: var(--ambient-opacity); }
.hbc-scrim {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    linear-gradient(180deg, var(--scrim) 0%, transparent 28%),
    radial-gradient(130% 80% at 50% 35%, transparent 45%, var(--scrim) 100%);
}
.hbc-inner {
  /* 中間那張的寬度：最寬 1040，窄容器留左右各 32px 讓旁邊那張露出一條 */
  --card-w: min(1040px, calc(100cqw - 64px));
  /* 卡片下半部文字區的固定高度：每張一樣高，換張時整疊不會跳 */
  --panel-h: 168px;
  position: relative;
  padding: 28px 0 28px;
}
.hbc-intro {
  width: var(--card-w);
  margin: 0 auto 18px;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px 20px;
}
.hbc-track {
  position: relative;
  height: calc(var(--card-w) * 9 / 16 + var(--panel-h));
  perspective: 1600px;
  perspective-origin: 50% 50%;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
}
.hbc-slide {
  position: absolute;
  top: 0;
  left: 50%;
  width: var(--card-w);
  height: calc(var(--card-w) * 9 / 16 + var(--panel-h));
  margin-left: calc(var(--card-w) / -2);
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  overflow: hidden;
  background: var(--card);
  /* 往旁邊縮的那張以靠中間那一側為軸，內緣永遠貼在中間那張旁邊 gap 的位置 */
  transform:
    translateX(calc(var(--o) * (100% + var(--gap))))
    rotateY(calc(var(--o) * -9deg))
    scale(var(--s));
  transform-origin: var(--origin, 50%) 50%;
  opacity: var(--op);
  filter: var(--filter, none);
  transition:
    transform 0.85s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.5s ease,
    filter 0.6s ease,
    box-shadow 0.6s ease;
  will-change: transform;
}
.hbc-slide[data-pos="front"] {
  --s: 1;
  --op: 1;
  z-index: 3;
  box-shadow: 0 22px 44px -22px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.08);
}
.hbc-slide[data-pos="side"] {
  --s: var(--side-scale);
  --op: 1;
  --filter: var(--side-dim);
  z-index: 2;
  cursor: pointer;
  box-shadow: 0 16px 32px -18px rgba(0, 0, 0, 0.45);
}
.hbc-slide[data-pos="side"]:hover { --filter: var(--side-dim-hover); }
.hbc-slide[data-pos="hidden"] {
  --s: 0.7;
  --op: 0;
  z-index: 1;
  pointer-events: none;
}
/* 繞圈時從另一側跳過去的那張：不播位移，只淡入 */
.hbc-slide[data-jump="true"] {
  transition: opacity 0.5s ease, filter 0.6s ease;
  animation: hbc-jump-in 0.55s ease both;
}
@keyframes hbc-jump-in { from { opacity: 0; } }
.hbc-frame {
  position: relative;
  flex: none;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #0a0c1e;
}
.hbc-media { position: absolute; inset: 0; }
.hbc-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  padding: 14px 16px 16px;
  border-top: 1px solid var(--border);
  background: var(--card);
}
.hbc-panel-text { min-width: 0; }
.hbc-slide[data-pos="front"] .hbc-panel-text { animation: hbc-rise 0.6s 0.1s cubic-bezier(0.22, 1, 0.36, 1) both; }
.hbc-slide[data-pos="front"] .hbc-cta { animation: hbc-rise 0.6s 0.18s cubic-bezier(0.22, 1, 0.36, 1) both; }
/* Ken Burns：當前這張緩慢推近 */
.hbc-slide[data-pos="front"] .hbc-media { animation: hbc-kenburns 9s ease-out both; }
@keyframes hbc-kenburns { from { transform: scale(1); } to { transform: scale(1.055); } }
.hbc-glare {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  background: radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.04) 36%, transparent 62%);
  mix-blend-mode: soft-light;
  transition: opacity 0.35s ease;
}
.hbc-slide[data-pos="front"]:hover .hbc-glare { opacity: 1; }
.hbc-ring {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  box-shadow: inset 0 0 0 1px rgba(245, 192, 69, 0.18);
  transition: box-shadow 0.35s ease;
}
.hbc-slide[data-pos="front"]:hover .hbc-ring { box-shadow: inset 0 0 0 1.5px rgba(245, 192, 69, 0.6); }
.hbc-hit {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: block;
  border: 0;
  padding: 0;
  margin: 0;
  background: transparent;
  cursor: pointer;
  border-radius: inherit;
}
.hbc-hit:focus-visible { outline: 3px solid var(--accent-gold); outline-offset: -3px; }
.hbc-arrow {
  position: absolute;
  /* 對齊封面圖片的垂直中心，不是整張卡的中心 */
  top: calc(var(--card-w) * 9 / 32);
  z-index: 5;
  display: none;
  width: 52px;
  height: 52px;
  margin-top: -26px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(10, 10, 14, 0.55);
  color: #fff;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
}
.hbc-arrow:hover { background: rgba(10, 10, 14, 0.8); transform: scale(1.08); }
.hbc-arrow:active { transform: scale(0.96); }
.hbc-arrow:focus-visible { outline: 3px solid var(--accent-gold); outline-offset: 3px; }
.hbc-arrow-prev { left: calc(50% - var(--card-w) / 2 - 26px); }
.hbc-arrow-next { right: calc(50% - var(--card-w) / 2 - 26px); }
@keyframes hbc-rise { from { opacity: 0; transform: translateY(10px); } }
.hbc-cta {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 46px;
  padding: 0 24px;
  border-radius: 12px;
  font-weight: 800;
  font-size: 15px;
  background: var(--text-primary);
  color: var(--bg);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  white-space: nowrap;
}
.hbc-slide[data-pos="front"]:hover .hbc-cta {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px -10px color-mix(in srgb, var(--text-primary) 45%, transparent);
}
.hbc-slide[data-pos="side"] .hbc-cta,
.hbc-slide[data-pos="hidden"] .hbc-cta {
  background: color-mix(in srgb, var(--text-primary) 14%, transparent);
  color: var(--text-secondary);
}
.hbc-dots {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  margin: 14px auto 0;
  height: 22px;
}
.hbc-dot {
  position: relative;
  width: 18px;
  height: 22px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  border-radius: 999px;
  transition: width 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}
.hbc-dot::before {
  content: "";
  position: absolute;
  left: 6px;
  right: 6px;
  top: 50%;
  height: 6px;
  margin-top: -3px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--text-primary) 28%, transparent);
  transition: background 0.25s ease;
}
.hbc-dot:hover::before { background: color-mix(in srgb, var(--text-primary) 55%, transparent); }
.hbc-dot[aria-current="true"] { width: 52px; }
.hbc-dot[aria-current="true"]::before { background: color-mix(in srgb, var(--text-primary) 18%, transparent); }
.hbc-dot-fill {
  position: absolute;
  left: 6px;
  right: 6px;
  top: 50%;
  height: 6px;
  margin-top: -3px;
  border-radius: 999px;
  transform-origin: 0 50%;
  transform: scaleX(0);
  background: var(--accent-gold);
  opacity: 0;
}
.hbc-dot[aria-current="true"] .hbc-dot-fill {
  opacity: 1;
  animation: hbc-fill var(--dur) linear forwards;
  animation-play-state: var(--play);
}
/* 不自動播放時目前這格直接填滿，表示「你在這一張」 */
.hbc-dot[aria-current="true"][data-static="true"] .hbc-dot-fill { animation: none; transform: scaleX(1); }
@keyframes hbc-fill { to { transform: scaleX(1); } }
.hbc-dot:focus-visible { outline: 2px solid var(--accent-gold); outline-offset: 1px; }
@container (min-width: 768px) {
  .hbc-inner {
    --card-w: min(1040px, calc(100cqw - 240px), max(520px, calc((100svh - 260px - var(--panel-h)) * 16 / 9)));
    --panel-h: 116px;
    padding: 36px 0 32px;
  }
  .hbc-panel {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 28px;
    padding: 0 28px;
  }
  .hbc-panel-text { flex: 1; }
  .hbc-arrow { display: inline-flex; }
}
@media (prefers-reduced-motion: reduce) {
  .hbc-slide,
  .hbc-ambient-layer { transition: opacity 0.3s ease; }
  .hbc-slide[data-pos="front"] .hbc-media,
  .hbc-slide[data-pos="front"] .hbc-panel-text,
  .hbc-slide[data-pos="front"] .hbc-cta,
  .hbc-slide[data-jump="true"] { animation: none; }
}
/* 資訊列高度固定：換張時整個 Hero 高度都不跳 */
.hbc-meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  height: 24px;
  margin-bottom: 6px;
  font-size: 13.5px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  color: var(--text-secondary);
}
.hbc-meta-row > span { flex: none; }
.hbc-meta-row > span:last-child { flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.hbc-title {
  font-weight: 900;
  font-size: clamp(17px, 1.75cqw, 24px);
  line-height: 1.3;
  /* 永遠保留兩行高度；一行的標題就靠上 */
  height: 2.6em;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: var(--text-primary);
  text-wrap: pretty;
}
`;
