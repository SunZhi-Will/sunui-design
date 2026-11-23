"use client";

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export type BrowserFrameTone = "default" | "danger" | "success" | "brand";
/** auto follows light and dark; dark / light are fixed colors, for presentation stages that do not follow the theme */
export type BrowserFrameScheme = "auto" | "dark" | "light";
/** The window version (WindowFrame) and the browser version share the same tones and palette */
export type WindowFrameTone = BrowserFrameTone;
export type WindowFrameScheme = BrowserFrameScheme;

/*
 * Color tokens. auto reuses the blog's tokens.css (stone in light, zinc in dark),
 * dark / light reuse the fixed colors of the presentation device frames.
 */
const BRAND = "[--wf-brand:color-mix(in_oklch,var(--sunui-spot,var(--primary))_70%,transparent)]";
/* Brushed-metal chrome: --wf-metal-a (top) and --wf-metal-b (bottom) mix the scheme's foreground into its surface so the bar is
   lit from straight above in every scheme; --wf-hi is the 1px top highlight */
const metalLight =
  "[--wf-metal-a:color-mix(in_oklch,var(--wf-fg)_2%,var(--wf-surface))] [--wf-metal-b:color-mix(in_oklch,var(--wf-fg)_13%,var(--wf-surface))] [--wf-hi:rgb(255_255_255/0.85)]";
const metalDark =
  "[--wf-metal-a:color-mix(in_oklch,var(--wf-fg)_15%,var(--wf-surface))] [--wf-metal-b:color-mix(in_oklch,var(--wf-fg)_5%,var(--wf-surface))] [--wf-hi:rgb(255_255_255/0.12)]";
const lightVars =
  `[--wf-surface:#ffffff] [--wf-raised:#f5f5f5] [--wf-sunken:#f4f4f5] [--wf-fg:#171717] [--wf-fg-body:#262626] [--wf-fg-muted:#525252] [--wf-line:rgba(0,0,0,0.1)] [--wf-line-strong:rgba(0,0,0,0.2)] [--wf-dot:rgba(0,0,0,0.08)] [--wf-success:rgba(5,150,105,0.6)] [--wf-danger:rgba(220,38,38,0.6)] ${BRAND} [--wf-shadow:0_1px_2px_rgba(0,0,0,0.05),0_4px_14px_-6px_rgba(0,0,0,0.08)] ${metalLight}`;
const darkAutoVars =
  "dark:[--wf-surface:#111113] dark:[--wf-raised:#1a1a1d] dark:[--wf-sunken:#161619] dark:[--wf-fg:#fafafa] dark:[--wf-fg-body:#e4e4e7] dark:[--wf-fg-muted:#e4e4e7] dark:[--wf-line:rgba(255,255,255,0.1)] dark:[--wf-line-strong:rgba(255,255,255,0.22)] dark:[--wf-dot:rgba(250,250,250,0.08)] dark:[--wf-success:rgba(52,211,153,0.6)] dark:[--wf-danger:rgba(248,113,113,0.6)] dark:[--wf-shadow:none] dark:[--wf-metal-a:color-mix(in_oklch,var(--wf-fg)_15%,var(--wf-surface))] dark:[--wf-metal-b:color-mix(in_oklch,var(--wf-fg)_5%,var(--wf-surface))] dark:[--wf-hi:rgb(255_255_255/0.12)]";
const fixedDark =
  `[--wf-surface:#151518] [--wf-raised:#1c1c20] [--wf-sunken:#1c1c20] [--wf-fg:#f4f4f4] [--wf-fg-body:#f4f4f4] [--wf-fg-muted:#b4b4b8] [--wf-line:#3a3a42] [--wf-line-strong:#3a3a42] [--wf-dot:rgba(255,255,255,0.08)] [--wf-success:rgba(52,211,153,0.6)] [--wf-danger:rgba(248,113,113,0.6)] ${BRAND} [--wf-shadow:0_12px_30px_rgba(0,0,0,0.22)] ${metalDark}`;
const fixedLight =
  `[--wf-surface:#ffffff] [--wf-raised:#ebebeb] [--wf-sunken:#f4f4f5] [--wf-fg:#141414] [--wf-fg-body:#141414] [--wf-fg-muted:#555555] [--wf-line:#d4d4d4] [--wf-line-strong:#d4d4d4] [--wf-dot:rgba(0,0,0,0.08)] [--wf-success:rgba(5,150,105,0.6)] [--wf-danger:rgba(220,38,38,0.6)] ${BRAND} [--wf-shadow:0_12px_30px_rgba(0,0,0,0.22)] ${metalLight}`;

const schemeVars: Record<BrowserFrameScheme, string> = {
  auto: `${lightVars} ${darkAutoVars}`,
  dark: fixedDark,
  light: fixedLight,
};

const toneRing: Record<BrowserFrameTone, string> = {
  default: "border-[var(--wf-line-strong)]",
  danger: "border-[var(--wf-danger)]",
  success: "border-[var(--wf-success)]",
  brand: "border-[var(--wf-brand)]",
};

/** Traffic lights read as small domed lenses set into the metal: lit on top, a dark seat below */
const lens =
  "h-2.5 w-2.5 rounded-full bg-[image:linear-gradient(180deg,rgb(255_255_255/0.35),transparent_55%,rgb(0_0_0/0.12))] shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.18),0_1px_0_var(--wf-hi)]";

/** Brushed-metal title bar shared by both frames: top-lit gradient, fine vertical grain, 1px top highlight */
const metalBar: CSSProperties = {
  backgroundColor: "var(--wf-raised)",
  backgroundImage:
    "repeating-linear-gradient(90deg, rgb(255 255 255 / 0.05) 0 1px, rgb(0 0 0 / 0.015) 1px 2px, transparent 2px 4px), linear-gradient(180deg, var(--wf-metal-a), var(--wf-metal-b))",
  boxShadow: "inset 0 1px 0 var(--wf-hi), inset 0 -1px 0 rgb(0 0 0 / 0.06)",
};

/** macOS red, yellow and green traffic lights */
export function TrafficLights({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("flex shrink-0 gap-1.5", className)}>
      <span className={cn(lens, "bg-[#ff5f57]")} />
      <span className={cn(lens, "bg-[#febc2e]")} />
      <span className={cn(lens, "bg-[#28c840]")} />
    </span>
  );
}

function SimBadge({ children }: { children: ReactNode }) {
  return (
    <span className="flex-none rounded-full border border-[var(--wf-line-strong)] bg-[var(--wf-sunken)] px-2 py-px text-[11px] font-bold tracking-[0.04em] text-[var(--wf-fg-muted)]">
      {children}
    </span>
  );
}

function LockIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/** Shell shared by both frames: rounded corners, color variables, tinted outline */
function frameShell(scheme: BrowserFrameScheme, tone: BrowserFrameTone, className?: string) {
  return cn(
    "m-0 min-w-0 overflow-hidden rounded-xl border bg-[var(--wf-surface)] transition-colors",
    schemeVars[scheme],
    toneRing[tone],
    className,
  );
}

/** Content area, scrolls inside the frame when maxHeight is set */
function FrameBody({ maxHeight, className, children }: { maxHeight?: number; className?: string; children: ReactNode }) {
  return (
    <div className={className} style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}>
      {children}
    </div>
  );
}

/* ───────── Desktop browser ───────── */

export interface BrowserFrameLabels {
  /** Accessible name of the frame */
  window: (url: string) => string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Map any language tag to one of the four built-in languages; everything else falls back to English */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, BrowserFrameLabels> = {
  en: { window: (url) => `Browser window, ${url}` },
  "zh-TW": { window: (url) => `瀏覽器視窗，${url}` },
  "zh-CN": { window: (url) => `浏览器窗口，${url}` },
  ja: { window: (url) => `ブラウザウィンドウ、${url}` },
};

export interface BrowserFrameProps {
  /** Address bar (shows only the domain and path) */
  url: string;
  /** Tab title; shows the URL when not given */
  title?: ReactNode;
  tone?: BrowserFrameTone;
  scheme?: BrowserFrameScheme;
  badge?: ReactNode;
  maxHeight?: number;
  /** UI language: en, zh-TW, zh-CN, ja; tags such as zh-Hant-HK and ja-JP are also accepted */
  locale?: string;
  /** Override the built-in strings, takes priority over locale */
  labels?: Partial<BrowserFrameLabels>;
  children: ReactNode;
  className?: string;
}

export function BrowserFrame(props: BrowserFrameProps) {
  return <BrowserChrome {...props} />;
}

/** Same ease-out curve as the site shell */
const EASE = [0.23, 1, 0.32, 1] as const;

/** URL and title text on page change: the old one exits in about 100ms, then the new one enters; with reduced motion it swaps instantly */
function SwapText({ swapKey, reduce, children }: { swapKey?: number; reduce?: boolean; children: ReactNode }) {
  if (swapKey === undefined) return <>{children}</>;
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={swapKey}
        className="block truncate"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: reduce ? { duration: 0 } : { duration: 0.16, ease: EASE } }}
        exit={{ opacity: 0, transition: reduce ? { duration: 0 } : { duration: 0.1, ease: EASE } }}
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}

/** The BrowserFrame body. swapKey is for BrowserStack: the URL bar and title fade on page change while the frame stays put */
function BrowserChrome({
  url,
  title,
  tone = "default",
  scheme = "auto",
  badge,
  maxHeight,
  locale = "en",
  labels,
  children,
  className,
  swapKey,
  reduce,
}: BrowserFrameProps & { swapKey?: number; reduce?: boolean }) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  return (
    <figure
      aria-label={t.window(url)}
      className={frameShell(
        scheme,
        tone,
        cn("text-[var(--wf-fg)] shadow-[0_12px_30px_rgba(0,0,0,0.22)]", className),
      )}
    >
      <div
        aria-hidden="true"
        className="flex items-center gap-2.5 border-b border-[var(--wf-line-strong)] px-3 py-2 text-xs text-[var(--wf-fg-muted)]"
        style={metalBar}
      >
        <TrafficLights />
        <span className="min-w-0 flex-1 truncate text-center">
          <SwapText swapKey={swapKey} reduce={reduce}>
            {title ?? url}
          </SwapText>
        </span>
        {badge && <SimBadge>{badge}</SimBadge>}
      </div>
      <div className="mx-3 my-2 flex items-center gap-2 rounded-full border border-[var(--wf-line-strong)] bg-[var(--wf-sunken)] px-3 py-1.5 shadow-[inset_0_1px_2px_rgb(0_0_0/0.06)] text-[12.5px] text-[var(--wf-fg-muted)]">
        <LockIcon size={12} />
        <span className="min-w-0 truncate text-[var(--wf-fg)]">
          <SwapText swapKey={swapKey} reduce={reduce}>
            {url}
          </SwapText>
        </span>
      </div>
      <FrameBody maxHeight={maxHeight} className="min-h-[120px]">
        {children}
      </FrameBody>
    </figure>
  );
}

/* ───────── macOS window (formerly window-frame) ───────── */

export interface WindowFrameProps {
  /** Centered text in the title bar (file name, app name) */
  title: ReactNode;
  /** Small icon before the title */
  icon?: ReactNode;
  /** Slot on the right of the title bar */
  right?: ReactNode;
  /** Menu bar below the title bar (hidden on narrow screens) */
  menus?: string[];
  /** Outline color for demo states: failed, success, brand */
  tone?: WindowFrameTone;
  scheme?: WindowFrameScheme;
  /** When given, a small badge hangs at the top right, for example "Simulated", showing the picture is drawn by code */
  badge?: ReactNode;
  /** Maximum height of the content area, scrolls inside the frame beyond that */
  maxHeight?: number;
  children: ReactNode;
  className?: string;
}

/** Window frame like an editor or app: centered title, no address bar */
export function WindowFrame({
  title,
  icon,
  right,
  menus,
  tone = "default",
  scheme = "auto",
  badge,
  maxHeight,
  children,
  className,
}: WindowFrameProps) {
  return (
    <div className={frameShell(scheme, tone, cn("text-[var(--wf-fg-body)] shadow-[var(--wf-shadow)]", className))}>
      <div className="flex h-9 items-center gap-2 border-b border-[var(--wf-line)] px-3" style={metalBar}>
        <TrafficLights />
        <span className="flex min-w-0 flex-1 items-center justify-center gap-1.5 truncate font-mono text-[11px] font-semibold text-[var(--wf-fg-body)]">
          {icon && (
            <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center text-[var(--wf-fg)] [&>svg]:h-3.5 [&>svg]:w-3.5">
              {icon}
            </span>
          )}
          <span className="truncate">{title}</span>
        </span>
        <span className="flex min-w-[42px] items-center justify-end gap-2">
          {badge && <SimBadge>{badge}</SimBadge>}
          {right}
        </span>
      </div>
      {menus && menus.length > 0 && (
        <div
          aria-hidden="true"
          className="hidden gap-4 border-b border-[var(--wf-line)] px-3 py-1.5 text-[11px] text-[var(--wf-fg-muted)] sm:flex"
        >
          {menus.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      )}
      <FrameBody maxHeight={maxHeight}>{children}</FrameBody>
    </div>
  );
}

/* ───────── Showcase area ───────── */

export interface StageProps {
  children: ReactNode;
  scheme?: BrowserFrameScheme;
  className?: string;
  style?: CSSProperties;
}

/** Showcase area with a dotted pattern, for charts, illustrations and frames */
export function Stage({ children, scheme = "auto", className, style }: StageProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-[var(--wf-line)] bg-[var(--wf-sunken)]",
        schemeVars[scheme],
        className,
      )}
      style={{
        backgroundImage: "radial-gradient(var(--wf-dot) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ───────── 3D stacked carousel (formerly browser-showcase-3d) ───────── */

export interface BrowserStackSlide {
  /** URL of this slide; the URL bar changes with the slide */
  url: string;
  /** Tab title; falls back to the URL */
  title?: ReactNode;
  /** Screenshot; use either this or content */
  image?: { src: string; alt: string };
  /** Custom screen content */
  content?: ReactNode;
}

export interface BrowserStackLabels {
  carousel: string;
  prev: string;
  next: string;
  slide: (index: number, total: number) => string;
  pause: string;
  play: string;
}

const STACK_MESSAGES: Record<SunLocale, BrowserStackLabels> = {
  en: { carousel: "Website showcase", prev: "Previous slide", next: "Next slide", slide: (i, n) => `Slide ${i} of ${n}`, pause: "Pause", play: "Play" },
  "zh-TW": { carousel: "網站展示", prev: "上一張", next: "下一張", slide: (i, n) => `第 ${i} 張，共 ${n} 張`, pause: "暫停", play: "播放" },
  "zh-CN": { carousel: "网站展示", prev: "上一张", next: "下一张", slide: (i, n) => `第 ${i} 张，共 ${n} 张`, pause: "暂停", play: "播放" },
  ja: { carousel: "ウェブサイトのショーケース", prev: "前のスライド", next: "次のスライド", slide: (i, n) => `スライド ${i} / ${n}`, pause: "一時停止", play: "再生" },
};

export interface BrowserStackProps {
  slides: BrowserStackSlide[];
  /** Autoplay interval (ms). Off by default. When on, it pauses off screen, in a hidden tab, and on hover or focus, and does not autoplay with reduced motion */
  autoplay?: number;
  /** Tilt that follows the cursor, on by default; only for fine pointers such as a mouse */
  parallax?: boolean;
  tone?: BrowserFrameTone;
  scheme?: BrowserFrameScheme;
  badge?: ReactNode;
  locale?: string;
  labels?: Partial<BrowserStackLabels & BrowserFrameLabels>;
  className?: string;
}

const GENTLE = { stiffness: 240, damping: 30 };
/** Current slide marker: a short bar of brand-colour lacquer, light from above */
const lacquer: CSSProperties = {
  backgroundImage:
    "linear-gradient(180deg, color-mix(in oklch, var(--sunui-spot, var(--primary)) 62%, white), var(--sunui-spot, var(--primary)) 55%, color-mix(in oklch, var(--sunui-spot, var(--primary)) 78%, black))",
};
/** Control button: e1 shadow, hover fast in and slow out, 0.97 on press, focus-visible ring */
const controlBtn =
  "grid size-8 place-items-center rounded-full bg-[var(--wf-surface)] text-[var(--wf-fg-muted)] shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.05)] transition-[color,scale] duration-150 hover:text-[var(--wf-fg)] hover:duration-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wf-fg)] motion-safe:active:scale-[0.97] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(255_255_255/0.08)]";

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
}

/**
 * A BrowserFrame tilted in 3D with two quieter windows stacked behind. On slide change the frame, traffic lights and URL bar stay put;
 * only the URL text and the screen fade. Slides change only on arrows, dots, left/right keys, or when autoplay is explicitly on.
 */
export function BrowserStack({
  slides,
  autoplay,
  parallax = true,
  tone = "default",
  scheme = "auto",
  badge,
  locale = "en",
  labels,
  className,
}: BrowserStackProps) {
  const t = { ...STACK_MESSAGES[resolveLocale(locale)], ...labels };
  const reduce = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [fine, setFine] = useState(false);
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(true);
  const [holding, setHolding] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const px = useSpring(x, GENTLE);
  const py = useSpring(y, GENTLE);
  const rotateY = useTransform(px, (v) => -12 + v * 8);
  const rotateX = useTransform(py, (v) => 5 - v * 6);
  const total = slides.length;
  const current = slides[Math.min(index, total - 1)];
  const tiltOn = parallax && fine && !reduce;
  const canAutoplay = !!autoplay && autoplay > 0 && total > 1 && !reduce;
  const running = canAutoplay && inView && visible && !holding && !userPaused;

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setFine(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!canAutoplay) return;
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? false));
    io.observe(el);
    const onVis = () => setVisible(!document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [canAutoplay]);

  // Restart the timer on every slide change, so a manual change also waits a full interval
  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % total), autoplay);
    return () => window.clearTimeout(id);
  }, [running, index, total, autoplay]);

  useEffect(() => {
    if (index >= total && total > 0) setIndex(0);
  }, [index, total]);

  useEffect(() => {
    if (tiltOn) return;
    x.set(0);
    y.set(0);
    if (reduce) {
      px.jump(0);
      py.jump(0);
    }
  }, [tiltOn, reduce, x, y, px, py]);

  if (!current) return null;

  const go = (step: number) => setIndex((i) => (i + step + total) % total);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") go(-1);
    else if (e.key === "ArrowRight") go(1);
    else return;
    e.preventDefault();
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!tiltOn || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };
  const decoy = "pointer-events-none absolute inset-0 rounded-xl bg-[var(--wf-raised)] shadow-[0_0_0_1px_var(--wf-line)]";

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={t.carousel}
      onKeyDown={onKeyDown}
      onPointerEnter={() => setHolding(true)}
      onPointerLeave={() => {
        setHolding(false);
        x.set(0);
        y.set(0);
      }}
      onFocus={() => setHolding(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHolding(false);
      }}
      className={cn("mx-auto grid w-full max-w-[680px] min-w-0 gap-5", schemeVars[scheme], className)}
    >
      <div onPointerMove={onPointerMove} className="pr-[6%] pb-[8%]">
        <motion.div className="relative" style={{ rotateX, rotateY, transformPerspective: 1600, transformStyle: "preserve-3d" }}>
          <div aria-hidden="true" className={cn(decoy, "opacity-50")} style={{ transform: "translate3d(8%, 10%, -80px) scale(0.94)" }} />
          <div aria-hidden="true" className={cn(decoy, "opacity-80")} style={{ transform: "translate3d(4%, 5%, -40px) scale(0.97)" }} />
          <BrowserChrome
            url={current.url}
            title={current.title}
            tone={tone}
            scheme={scheme}
            badge={badge}
            locale={locale}
            labels={labels}
            swapKey={index}
            reduce={reduce}
            className="relative"
          >
            <div className="relative aspect-[16/10] overflow-hidden" aria-live={running ? "off" : "polite"}>
              <AnimatePresence initial={false}>
                <motion.div
                  key={index}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={t.slide(index + 1, total)}
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: reduce ? { duration: 0 } : { duration: 0.22, delay: 0.06, ease: EASE } }}
                  exit={{ opacity: 0, transition: reduce ? { duration: 0 } : { duration: 0.1, ease: EASE } }}
                >
                  {current.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={current.image.src} alt={current.image.alt} className="block size-full object-cover" />
                  ) : (
                    current.content
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </BrowserChrome>
        </motion.div>
      </div>
      {total > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button type="button" aria-label={t.prev} onClick={() => go(-1)} className={controlBtn}>
            <Chevron dir="left" />
          </button>
          <div className="flex items-center gap-1">
            {slides.map((s, i) => (
              <button
                key={s.url + i}
                type="button"
                aria-label={t.slide(i + 1, total)}
                aria-current={i === index ? "true" : undefined}
                onClick={() => setIndex(i)}
                className="group/dot grid h-6 place-items-center rounded-full px-1 transition-[scale] duration-150 focus-visible:outline-2 focus-visible:outline-[var(--wf-fg)] motion-safe:active:scale-[0.97]"
              >
                <span
                  className={cn(
                    "block h-1.5 rounded-full transition-[width,background-color] duration-150 motion-reduce:transition-none",
                    i === index ? "w-5 shadow-[inset_0_1px_0_rgb(255_255_255/0.4),inset_0_-1px_0_rgb(0_0_0/0.18)]" : "w-1.5 bg-[var(--wf-line-strong)] group-hover/dot:bg-[var(--wf-fg-muted)]",
                  )}
                  style={i === index ? lacquer : undefined}
                />
              </button>
            ))}
          </div>
          <button type="button" aria-label={t.next} onClick={() => go(1)} className={controlBtn}>
            <Chevron dir="right" />
          </button>
          {canAutoplay && (
            <button
              type="button"
              aria-label={userPaused ? t.play : t.pause}
              onClick={() => setUserPaused((p) => !p)}
              className={controlBtn}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {userPaused ? <path d="M7 4.5v15l12-7.5z" /> : <path d="M9 5v14M15 5v14" />}
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
