"use client";

// Scripted product demo: plays scenes automatically inside a browser frame, with a fake cursor that moves to targets, click ripples and a chapter progress bar.
// Advances only while playing and on screen; also pauses when the tab is in the background.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

/* ---------- Animation styles (the ww-* keyframes from the original welcome.css) ---------- */

const CSS = `
.sd-root{--sd-success:var(--success,#15803D);--sd-warning:var(--warning,#B45309);--sd-popover:var(--popover,var(--card))}
@media (prefers-color-scheme: dark){.sd-root{--sd-success:var(--success,#4ADE80);--sd-warning:var(--warning,#FBBF24)}}
@keyframes sd-pop{0%{opacity:0;transform:translateY(6px) scale(.85)}70%{opacity:1;transform:translateY(-1px) scale(1.04)}100%{opacity:1;transform:translateY(0) scale(1)}}
@keyframes sd-fade-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes sd-slide-in-right{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
@keyframes sd-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-3px)}40%{transform:translateX(3px)}60%{transform:translateX(-2px)}80%{transform:translateX(2px)}}
@keyframes sd-progress{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes sd-ripple{from{opacity:.55;transform:translate(-50%,-50%) scale(.2)}to{opacity:0;transform:translate(-50%,-50%) scale(1.6)}}
@keyframes sd-glow{0%,100%{box-shadow:0 0 0 0 color-mix(in oklab,var(--sd-warning) 45%,transparent)}50%{box-shadow:0 0 0 5px color-mix(in oklab,var(--sd-warning) 0%,transparent)}}
@keyframes sd-blink{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes sd-spin{to{transform:rotate(360deg)}}
.sd-pop{animation:sd-pop 420ms cubic-bezier(.2,.8,.2,1) both}
.sd-fade-up{animation:sd-fade-up 520ms cubic-bezier(.2,.8,.2,1) both}
.sd-slide-in-right{animation:sd-slide-in-right 480ms cubic-bezier(.2,.8,.2,1) both}
.sd-shake{animation:sd-shake 480ms ease-in-out 2}
.sd-glow{animation:sd-glow 1.4s ease-in-out infinite}
.sd-blink{animation:sd-blink 1.2s ease-in-out infinite}
.sd-spin{animation:sd-spin 1s linear infinite}
.sd-progress{transform-origin:left center;animation:sd-progress var(--sd-duration,2s) cubic-bezier(.4,0,.2,1) both}
.sd-ripple{position:absolute;left:4px;top:4px;width:36px;height:36px;border-radius:9999px;background:var(--foreground);pointer-events:none;animation:sd-ripple 700ms ease-out both}
@media (prefers-reduced-motion: reduce){
.sd-pop,.sd-fade-up,.sd-slide-in-right,.sd-shake,.sd-glow,.sd-blink,.sd-spin{animation:none}
.sd-progress{animation-duration:1ms}
.sd-ripple{display:none}
.sd-cursor{transition:none!important}
}
`;

/* ---------- Types ---------- */

export interface ScriptedDemoScene<K extends string = string> {
  key: K;
  /** How long this scene stays, in ms */
  duration: number;
  /** Index of the chapter it belongs to (0-based) */
  chapter: number;
  /** Name of the target the cursor moves to (registered with target(name)) */
  cursor?: string;
  /** Whether to play a click ripple at the cursor position in this scene */
  click?: boolean;
  /** Ripple delay in ms, e.g. wait for the cursor to arrive before clicking */
  clickDelay?: number;
  /** Name of the target the explanation card sticks to; the position comes from popover */
  popover?: string;
}

export interface ScriptedDemoChapter {
  title: ReactNode;
  caption?: ReactNode;
}

export interface ScriptedDemoLabels {
  /** Group name for the whole demo */
  group: string;
  play: string;
  pause: string;
}

export interface ScriptedDemoProps<K extends string = string> {
  scenes: ScriptedDemoScene<K>[];
  chapters: ScriptedDemoChapter[];
  /** Text in the browser frame's address bar; not shown if omitted */
  url?: string;
  /** Whether to autoplay at the start */
  autoPlay?: boolean;
  /** UI language: en, zh-TW, zh-CN, ja; tags such as zh-Hant-HK and ja-JP are accepted too */
  locale?: string;
  /** Override built-in strings; takes priority over locale */
  labels?: Partial<ScriptedDemoLabels>;
  className?: string;
  children: ReactNode;
}

interface DemoContextValue {
  /** Current scene index */
  scene: number;
  /** Current scene key */
  sceneKey: string;
  /** Round number; incremented on a chapter jump or replay, used as a key so enter animations replay */
  loop: number;
  /** Playing and on screen */
  active: boolean;
  reduced: boolean;
  /** Register a cursor target or the explanation card anchor */
  target: (name: string) => (el: HTMLElement | null) => void;
  /** Position of the explanation card (relative to the browser frame) */
  popover: { top: number; left: number; width: number };
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function useScriptedDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useScriptedDemo must be used inside <ScriptedDemo>");
  return ctx;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Map any language tag to one of the four built-in languages; everything else uses English */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, ScriptedDemoLabels> = {
  en: { group: "Animated product demo", play: "Play animation", pause: "Pause animation" },
  "zh-TW": { group: "產品動畫示範", play: "播放動畫", pause: "暫停動畫" },
  "zh-CN": { group: "产品动画演示", play: "播放动画", pause: "暂停动画" },
  ja: { group: "製品のアニメーションデモ", play: "アニメーションを再生", pause: "アニメーションを一時停止" },
};

/* ---------- Helpers ---------- */

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function useReducedMotionPref() {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

function useInView<T extends Element>({ once = true, threshold = 0.2 }: { once?: boolean; threshold?: number } = {}) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [once, threshold]);
  return { ref, inView };
}

function useTabVisible() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState === "visible");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  return visible;
}

const svg = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg {...svg} className={cn("sd-spin", className)}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

/* ---------- Main component ---------- */

export function ScriptedDemo<K extends string = string>({
  scenes,
  chapters,
  url,
  autoPlay = true,
  locale = "en",
  labels,
  className,
  children,
}: ScriptedDemoProps<K>) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const reduced = useReducedMotionPref();
  const tabVisible = useTabVisible();
  const [scene, setScene] = useState(0);
  const [loop, setLoop] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const { ref: viewRef, inView } = useInView<HTMLDivElement>({ once: false, threshold: 0.25 });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const targets = useRef(new Map<string, HTMLElement>());
  const targetRefs = useRef(new Map<string, (el: HTMLElement | null) => void>());
  const [cursor, setCursor] = useState({ x: 0, y: 0, ready: false });
  const [popover, setPopover] = useState({ top: 0, left: 0, width: 280 });

  const current = scenes[Math.min(scene, scenes.length - 1)];
  const chapter = current.chapter;
  const active = playing && inView && tabVisible;

  const target = useCallback((name: string) => {
    let fn = targetRefs.current.get(name);
    if (!fn) {
      fn = (el: HTMLElement | null) => {
        if (el) targets.current.set(name, el);
        else targets.current.delete(name);
      };
      targetRefs.current.set(name, fn);
    }
    return fn;
  }, []);

  // Scene timer: advances only while playing and on screen.
  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => {
      setScene((s) => {
        if (s >= scenes.length - 1) {
          setLoop((l) => l + 1);
          return 0;
        }
        return s + 1;
      });
    }, current.duration);
    return () => window.clearTimeout(timer);
  }, [active, scene, current.duration, loop, scenes.length]);

  // Measure the cursor target and explanation card position for each scene.
  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const box = container.getBoundingClientRect();
    const center = (el: Element | undefined) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left - box.left + r.width * 0.55, y: r.top - box.top + r.height * 0.6 };
    };
    const point = current.cursor ? center(targets.current.get(current.cursor)) : null;
    if (point) setCursor({ ...point, ready: true });

    const anchor = current.popover ? targets.current.get(current.popover) : undefined;
    if (anchor) {
      const r = anchor.getBoundingClientRect();
      const width = Math.min(290, box.width - 16);
      const left = Math.max(8, Math.min(r.left - box.left - 24, box.width - width - 8));
      setPopover({ top: r.bottom - box.top + 10, left, width });
    }
  }, [current.cursor, current.popover]);

  useLayoutEffect(() => {
    measure();
  }, [measure, scene, loop]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const goToChapter = (index: number) => {
    const first = scenes.findIndex((s) => s.chapter === index);
    if (first < 0) return;
    setScene(first);
    setLoop((l) => l + 1);
  };

  const chapterDuration = (index: number) =>
    scenes.filter((s) => s.chapter === index).reduce((sum, s) => sum + s.duration, 0);

  const value: DemoContextValue = { scene, sceneKey: current.key, loop, active, reduced, target, popover };

  return (
    <DemoContext.Provider value={value}>
      <style>{CSS}</style>
      <div ref={viewRef} role="group" aria-label={t.group} className={cn("sd-root w-full", className)}>
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-20px_rgba(0,0,0,0.18)]"
        >
          {/* Browser frame */}
          <div aria-hidden className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2.5">
            <span className="size-2.5 rounded-full bg-[#FF5F57]" />
            <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="size-2.5 rounded-full bg-[#28C840]" />
            {url ? (
              <div className="mx-auto hidden rounded-md bg-background px-3 py-0.5 font-mono text-[11px] text-muted-foreground sm:block">
                {url}
              </div>
            ) : null}
            <div className="w-10 sm:hidden" />
          </div>

          {children}

          {/* Simulated cursor */}
          <div
            aria-hidden
            className={cn(
              "sd-cursor pointer-events-none absolute top-0 left-0 z-30 transition-[transform,opacity] duration-[900ms] ease-[cubic-bezier(0.65,0,0.35,1)]",
              cursor.ready ? "opacity-100" : "opacity-0",
            )}
            style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
          >
            {current.click ? (
              <span key={`${scene}-${loop}`} className="sd-ripple" style={{ animationDelay: `${current.clickDelay ?? 0}ms` }} />
            ) : null}
            <svg viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="relative size-5 fill-foreground stroke-background drop-shadow-md">
              <path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z" />
            </svg>
          </div>
        </div>

        {/* Chapter controls */}
        <div className="mt-4 flex items-start gap-3">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label={playing ? t.pause : t.play}
          >
            {playing ? (
              <svg {...svg} className="size-3.5">
                <rect x="14" y="4" width="4" height="16" rx="1" />
                <rect x="6" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg {...svg} className="size-3.5">
                <polygon points="6 3 20 12 6 21 6 3" />
              </svg>
            )}
          </button>
          <ol className="grid min-w-0 flex-1 gap-2" style={{ gridTemplateColumns: `repeat(${chapters.length}, minmax(0, 1fr))` }}>
            {chapters.map((c, i) => (
              <li key={i} className="min-w-0">
                <button
                  type="button"
                  onClick={() => goToChapter(i)}
                  className="group w-full rounded-sm text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  aria-current={i === chapter ? "step" : undefined}
                >
                  <span className="relative block h-1 overflow-hidden rounded-full bg-muted">
                    {i < chapter ? <span className="absolute inset-0 bg-foreground/70" /> : null}
                    {i === chapter ? (
                      <span
                        key={`${loop}-${i}`}
                        className="sd-progress absolute inset-0 bg-foreground"
                        style={
                          {
                            "--sd-duration": `${chapterDuration(i)}ms`,
                            animationPlayState: active ? "running" : "paused",
                          } as CSSProperties
                        }
                      />
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      "mt-2 block truncate text-xs font-medium transition-colors",
                      i === chapter ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    {c.title}
                  </span>
                  {c.caption ? (
                    <span className="mt-0.5 hidden text-[11px] leading-snug text-muted-foreground md:block">{c.caption}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </DemoContext.Provider>
  );
}

/* ---------- Parts commonly used inside scenes ---------- */

/** Wrapper with an enter animation: chips pop in one after another, delay in ms. */
export function Pop({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <span className={cn("sd-pop", className)} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </span>
  );
}

export type DemoTone = "muted" | "brand" | "success" | "warning";

/** Status pill: replays a fade-in when the text changes; the brand-coloured dot pulses. */
export function DemoStatus({ text, tone }: { text: string; tone: DemoTone }) {
  return (
    <span
      key={text}
      className={cn(
        "sd-fade-up hidden items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium sm:inline-flex",
        tone === "muted" && "border-border text-muted-foreground",
        tone === "brand" && "border-border bg-muted text-foreground",
        tone === "success" && "border-(--sd-success)/30 bg-(--sd-success)/10 text-(--sd-success)",
        tone === "warning" && "border-(--sd-warning)/30 bg-(--sd-warning)/10 text-(--sd-warning)",
      )}
    >
      <span className={cn("size-1.5 rounded-full bg-current", tone === "brand" && "sd-blink")} />
      {text}
    </span>
  );
}
