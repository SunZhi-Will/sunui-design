"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** How long each slide stays, in ms. W3C / UX research suggests 5 to 7 seconds; faster than that and headlines cannot be read */
const SLIDE_MS = 6500;
/** Drag distance in px needed to count as a slide change; too small and a tap is misread as a swipe */
const SWIPE_PX = 48;

export interface HeroBillboardSlide {
  key: string;
  title: string;
  /** When set, the whole card is a link; otherwise onSelect is called */
  href?: string;
  /** Small label overlaid on the cover (shown only with overlayTitle) */
  subtitle?: string;
  /** Cover image URL (16:9) */
  image?: string;
  imageAlt?: string;
  /** Cover content when there is no image, filling the 16:9 cover area */
  cover?: ReactNode;
  /** Overlay a title on the cover when the cover itself has no title text */
  overlayTitle?: boolean;
  overlayColor?: string;
  /** Category text in the info row below, e.g. Free live session */
  eyebrow?: string;
  /** One line of time or extra info */
  meta?: string;
  /** Price or Free */
  price?: string;
  /** Primary button text */
  cta?: string;
  /** Status tag, e.g. Open */
  badge?: string;
  /** Ambient light colour used when there is no image (a single colour, blurred behind the card) */
  accentFrom?: string;
  /** Kept for the old API, no longer used (cross-hue gradients are no longer drawn) */
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
  /** Accessible name of the whole-card link for the current slide */
  hit?: (title: string, cta: string) => string;
}

export interface HeroBillboardCarouselProps {
  items: HeroBillboardSlide[];
  /** A row above the carousel, as wide as the center card (tagline, links) */
  intro?: ReactNode;
  /** Milliseconds each slide stays */
  slideMs?: number;
  /** The original project defaulted to dark; light theme is kept as well */
  theme?: "dark" | "light";
  /** The single accent colour (badge, category text, progress bar, focus ring); defaults to dark #d4a24c, light #a8741f */
  accent?: string;
  /** Called when a card without href is clicked */
  onSelect?: (slide: HeroBillboardSlide, index: number) => void;
  /** UI language: en, zh-TW, zh-CN, ja; tags such as zh-Hant-HK and ja-JP are accepted too */
  locale?: string;
  /** Override built-in strings; takes priority over locale */
  labels?: HeroBillboardCarouselLabels;
  className?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Map any language tag to one of the four built-in languages; everything else uses English */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, Required<HeroBillboardCarouselLabels>> = {
  en: {
    region: "Upcoming events and featured courses",
    prev: "Previous slide",
    next: "Next slide",
    defaultCta: "View details",
    slide: (i, n, title) => `Slide ${i + 1} of ${n}: ${title}`,
    goTo: (title) => `Go to: ${title}`,
    dot: (i, title) => `Slide ${i + 1}: ${title}`,
    hit: (title, cta) => `${title}: ${cta}`,
  },
  "zh-TW": {
    region: "近期活動與精選課程",
    prev: "上一張",
    next: "下一張",
    defaultCta: "查看詳情",
    slide: (i, n, title) => `第 ${i + 1} 張，共 ${n} 張：${title}`,
    goTo: (title) => `前往：${title}`,
    dot: (i, title) => `第 ${i + 1} 張：${title}`,
    hit: (title, cta) => `${title}：${cta}`,
  },
  "zh-CN": {
    region: "近期活动与精选课程",
    prev: "上一张",
    next: "下一张",
    defaultCta: "查看详情",
    slide: (i, n, title) => `第 ${i + 1} 张，共 ${n} 张：${title}`,
    goTo: (title) => `前往：${title}`,
    dot: (i, title) => `第 ${i + 1} 张：${title}`,
    hit: (title, cta) => `${title}：${cta}`,
  },
  ja: {
    region: "今後のイベントとおすすめコース",
    prev: "前のスライド",
    next: "次のスライド",
    defaultCta: "詳細を見る",
    slide: (i, n, title) => `スライド ${i + 1}/${n}：${title}`,
    goTo: (title) => `${title}へ移動`,
    dot: (i, title) => `スライド ${i + 1}：${title}`,
    hit: (title, cta) => `${title}：${cta}`,
  },
};

/** Position of slide i relative to the current one: 0 is the center, ±1 are the visible side slides, the rest are hidden */
function signedOffset(i: number, active: number, n: number, dir: 1 | -1): number {
  const d = (i - active + n) % n;
  if (n % 2 === 0 && d === n / 2) return dir > 0 ? -d : d; // with an even count, the slide directly opposite stays on the side it just left
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
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6) 75%, rgba(0,0,0,0.85) 100%)" }} />
          <div className="absolute inset-x-0 bottom-0" style={{ padding: "4.5cqw", paddingRight: "20cqw" }}>
            <div className="line-clamp-1 font-semibold uppercase tracking-[0.2em]" style={{ fontSize: "clamp(9px,1.6cqw,14px)", marginBottom: "1cqw", color: slide.overlayColor ?? "var(--accent-gold)" }}>
              {slide.subtitle}
            </div>
            <div className="line-clamp-2 font-serif font-normal leading-tight tracking-[-0.01em]" style={{ fontSize: "clamp(16px,3.6cqw,38px)", color: "#f5f5f5" }}>
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
 * Full-bleed focus carousel: one large cover in the middle, the previous and next slides peeking out on either side (tap to switch to them),
 * and when there are images, a low-opacity blurred cover behind as ambient light. Dot indicators sit right below the card, and the current one stretches into a progress bar.
 *
 * Autoplay follows the W3C APG carousel pattern: it pauses on mouse hover, keyboard focus inside, and a hidden tab;
 * it does not autoplay when the system has "reduce motion" on. Slides change on the progress bar's animationend, and it resumes after a pause.
 */
export function HeroBillboardCarousel({ items, intro, slideMs = SLIDE_MS, theme = "dark", accent, onSelect, locale = "en", labels, className }: HeroBillboardCarouselProps) {
  const l = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const n = items.length;
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const reducedMotion = usePrefersReducedMotion();
  const [hovering, setHovering] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  const [docHidden, setDocHidden] = useState(false);
  // Position of each slide in the previous round, used to detect the slide that wraps around and jumps from the other side
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
      style={accent ? ({ "--accent-gold": accent } as CSSProperties) : undefined}
      aria-roledescription="carousel"
      aria-label={l.region}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      // Pause only on keyboard focus: clicking an arrow with the mouse also focuses it, and pausing on any focus would stop autoplay for good after one click
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
            ) : slide.accentFrom ? (
              <div className="absolute inset-0" style={{ background: slide.accentFrom }} />
            ) : null}
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
            // After releasing the mouse following a drag-to-switch, do not also trigger the card link
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
                {/* Image, text and button are one card (one outer frame) */}
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
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold" style={{ background: "var(--accent-gold)", color: "#0a0a0a" }}>
                          {slide.badge}
                        </span>
                      )}
                      {slide.eyebrow && (
                        <span className="font-semibold uppercase tracking-[0.12em] text-[12px]" style={{ color: "var(--accent-gold)" }}>
                          {slide.eyebrow}
                        </span>
                      )}
                      {/* Time and price merge into one run; when too long the whole run ends with an ellipsis */}
                      {(slide.meta || slide.price) && <span>{[slide.meta, slide.price].filter(Boolean).join(" · ")}</span>}
                    </div>
                    <h2 className="hbc-title" title={slide.title}>
                      {slide.title}
                    </h2>
                  </div>
                  {/* The whole card is the link; the button is only a visual hint (a span), to avoid nesting a link inside a link */}
                  <span className="hbc-cta" aria-hidden>
                    {cta} →
                  </span>
                </div>
                <span className="hbc-ring" aria-hidden />
                {pos === "front" ? (
                  slide.href ? (
                    <a href={slide.href} className="hbc-hit" aria-label={l.hit(slide.title, cta)} draggable={false} />
                  ) : (
                    <button type="button" className="hbc-hit" aria-label={l.hit(slide.title, cta)} onClick={() => onSelect?.(slide, i)} />
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

        {/* Indicators: right below the center card, not over the image. The current one stretches into a progress bar that fills up and then advances */}
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
                    // Rebuilt on key change when the slide changes, so progress restarts from 0; when full, advance to the next slide
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

// The original CSS module is ported as-is into scoped classes (hbc- prefix). Viewport units vw become container units cqw,
// so sizes are computed from the container width wherever it sits; @media 768px becomes @container.
const BILLBOARD_CSS = `
.hbc-root {
  --bg: #0a0a0a;
  --text-primary: #f5f5f5;
  --text-secondary: #a3a3a3;
  --card: #141414;
  --card-raised: #1a1a1a;
  --border: rgb(255 255 255 / 0.08);
  --accent-gold: #d4a24c;
  --hero-bg: #0a0a0a;
  --gap: 28px;
  --side-scale: 0.86;
  --side-dim: brightness(0.5) saturate(0.75);
  --side-dim-hover: brightness(0.72) saturate(0.9);
  --ambient-opacity: 0.22;
  --scrim: rgba(12, 10, 9, 0.5);
  container-type: inline-size;
  position: relative;
  overflow: hidden;
  isolation: isolate;
  background: linear-gradient(180deg, transparent 78%, var(--bg) 100%), var(--hero-bg);
  color: var(--text-primary);
}
.hbc-root[data-theme="light"] {
  --bg: #fafafa;
  --text-primary: #171717;
  --text-secondary: #525252;
  --card: #ffffff;
  --card-raised: #f5f5f5;
  --border: rgba(28, 25, 23, 0.08);
  --accent-gold: #a8741f;
  --hero-bg: #fafafa;
  --side-dim: saturate(0.7) opacity(0.55);
  --side-dim-hover: saturate(0.9) opacity(0.8);
  --ambient-opacity: 0.16;
  --scrim: rgba(250, 250, 249, 0.6);
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
  filter: blur(56px);
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
  /* Width of the centre card: at most 1040, narrow containers keep 32px on each side so a sliver of the neighbours shows */
  --card-w: min(1040px, calc(100cqw - 64px));
  /* Fixed height of the text area in the lower half: every card is the same height, so the stack never jumps on change */
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
  /* Side cards scale from their inner edge, which always sits one gap away from the centre card */
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
  box-shadow: 0 22px 44px -22px rgba(0, 0, 0, 0.55), 0 0 0 1px var(--border);
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
/* The card that wraps around to the other side: no slide, only a fade in */
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
  background: var(--card-raised);
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
/* Ken Burns: the current card slowly zooms in */
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
  box-shadow: inset 0 0 0 1px var(--border);
  transition: box-shadow 0.35s ease;
}
.hbc-slide[data-pos="front"]:hover .hbc-ring { box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--accent-gold) 60%, transparent); }
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
  /* Aligned to the vertical centre of the cover image, not of the whole card */
  top: calc(var(--card-w) * 9 / 32);
  z-index: 5;
  display: none;
  width: 52px;
  height: 52px;
  margin-top: -26px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid rgb(255 255 255 / 0.14);
  background: rgba(22, 20, 18, 0.92);
  color: #f5f5f5;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
}
.hbc-arrow:hover { background: rgba(28, 26, 23, 0.96); transform: scale(1.08); }
.hbc-arrow:active { transform: scale(0.96); }
.hbc-arrow:focus-visible { outline: 3px solid var(--accent-gold); outline-offset: 3px; }
.hbc-arrow-prev { left: calc(50% - var(--card-w) / 2 - 26px); }
.hbc-arrow-next { right: calc(50% - var(--card-w) / 2 - 26px); }
.hbc-cta {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 46px;
  padding: 0 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
  /* Brand accent: set --sunui-spot to use your own brand color; without it the default colors stay */
  background: var(--sunui-spot, var(--text-primary));
  color: var(--sunui-spot-foreground, var(--bg));
  transition: transform 0.2s ease;
  white-space: nowrap;
}
.hbc-slide[data-pos="front"]:hover .hbc-cta { transform: translateY(-2px); }
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
  background: var(--sunui-spot, var(--accent-gold));
  opacity: 0;
}
.hbc-dot[aria-current="true"] .hbc-dot-fill {
  opacity: 1;
  animation: hbc-fill var(--dur) linear forwards;
  animation-play-state: var(--play);
}
/* Without autoplay the current segment is simply filled, meaning "you are here" */
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
  .hbc-slide[data-jump="true"] { animation: none; }
}
/* Fixed info bar height: the whole hero never changes height on change */
.hbc-meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  height: 24px;
  margin-bottom: 6px;
  font-size: 13.5px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  color: var(--text-secondary);
}
.hbc-meta-row > span { flex: none; }
.hbc-meta-row > span:last-child { flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.hbc-title {
  font-weight: 600;
  font-size: clamp(17px, 1.75cqw, 24px);
  letter-spacing: -0.01em;
  line-height: 1.3;
  /* Always reserve two lines; a one-line title sits at the top */
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
