"use client";

// Feature story: on desktop the text on the left scrolls paragraph by paragraph while the right panel sticks and switches scenes; on mobile the animation sits directly under each paragraph.
// Each scene plays only while it is the current paragraph and stops when it leaves, to avoid idling in the background.

import { useEffect, useId, useRef, useState, type ComponentType, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/* ---------- Animation styles (the ww-* rules from the original welcome.css) ---------- */

const CSS = `
.ss-root{--ss-success:var(--success,#15803D);--ss-success-fg:var(--success-foreground,#FAFAFA);--ss-warning:var(--warning,#B45309)}
@media (prefers-color-scheme: dark){.ss-root{--ss-success:var(--success,#4ADE80);--ss-success-fg:var(--success-foreground,#09090B);--ss-warning:var(--warning,#FBBF24)}}
.ss-reveal{opacity:0;transform:translateY(18px);transition:opacity 800ms cubic-bezier(.23,1,.32,1),transform 800ms cubic-bezier(.23,1,.32,1);transition-delay:var(--ss-delay,0ms)}
.ss-reveal[data-shown="true"]{opacity:1;transform:none;filter:none}
.ss-scene{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0;transform:translateY(16px) scale(.97);pointer-events:none;transition:opacity 700ms cubic-bezier(.23,1,.32,1),transform 700ms cubic-bezier(.23,1,.32,1)}
.ss-scene[data-active="true"]{opacity:1;transform:none;filter:none;pointer-events:auto}
@keyframes ss-swap-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.ss-swap-in{animation:ss-swap-in 500ms cubic-bezier(.23,1,.32,1) both}
@keyframes ss-strike{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.ss-strike{transform:scaleX(0);animation:ss-strike 420ms cubic-bezier(.23,1,.32,1) forwards}
.ss-press{transition:transform 160ms cubic-bezier(.23,1,.32,1),opacity 160ms,background-color 200ms,box-shadow 200ms}
.ss-press:active{transform:scale(.97)}
@media (prefers-reduced-motion: reduce){
.ss-reveal,.ss-scene[data-active="true"]{opacity:1;transform:none;filter:none}
.ss-reveal,.ss-scene{transition:none}
.ss-swap-in{animation:none}
.ss-strike{transform:none;animation:none}
.ss-root *{transition-duration:0ms!important;transition-delay:0ms!important}
}
`;

/* ---------- hooks ---------- */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

function useInView<T extends Element>(options?: { once?: boolean; threshold?: number; rootMargin?: string }) {
  const { once = true, threshold = 0.2, rootMargin } = options ?? {};
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
      { threshold, rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [once, threshold, rootMargin]);

  return { ref, inView };
}

/**
 * While active, calls onStep(index) in a loop over steps (milliseconds per step).
 * With reduced motion it stops at the last step (usually the finished view) and does not loop.
 */
export function useLoop(active: boolean, steps: number[], onStep: (index: number) => void) {
  const reduced = usePrefersReducedMotion();
  const stepRef = useRef(onStep);
  stepRef.current = onStep;
  const stepsKey = steps.join(",");

  useEffect(() => {
    if (!active) return;
    const durations = stepsKey.split(",").map(Number);
    if (reduced) {
      stepRef.current(durations.length - 1);
      return;
    }
    let index = 0;
    let timer = 0;
    const run = () => {
      stepRef.current(index);
      timer = window.setTimeout(() => {
        index = (index + 1) % durations.length;
        run();
      }, durations[index]);
    };
    run();
    return () => window.clearTimeout(timer);
  }, [active, stepsKey, reduced]);
}

/* ---------- Shared components ---------- */

function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.15 });
  return (
    <div ref={ref} data-shown={inView} className={cn("ss-reveal", className)} style={{ "--ss-delay": `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  );
}

/** Scene frame: white card, large radius, soft long shadow. */
export function StoryPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "w-full max-w-[30rem] min-w-0 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm sm:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ---------- Story body ---------- */

export interface ScrollStoryStep {
  key: string;
  /** Short heading, also the tab text below the right-hand panel */
  tab: string;
  title: ReactNode;
  body?: ReactNode;
  /** Plays its own looping animation only when active is true */
  Visual: ComponentType<{ active: boolean }>;
}

export interface ScrollStoryProps {
  steps: ScrollStoryStep[];
  /** UI language: en, zh-TW, zh-CN, ja; tags such as zh-Hant-HK and ja-JP are accepted too */
  locale?: string;
  /** Override built-in strings; takes priority over locale */
  labels?: Partial<ScrollStoryLabels>;
  className?: string;
}

export interface ScrollStoryLabels {
  /** Accessible name of the right-hand tab navigation */
  nav: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Map any language tag to one of the four built-in languages; everything else uses English */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, ScrollStoryLabels> = {
  en: { nav: "Story sections" },
  "zh-TW": { nav: "故事段落" },
  "zh-CN": { nav: "故事段落" },
  ja: { nav: "ストーリーのセクション" },
};

function StepBlock({
  id,
  index,
  step,
  onActive,
}: {
  id: string;
  index: number;
  step: ScrollStoryStep;
  onActive: (index: number) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { ref: mobileRef, inView: mobileInView } = useInView<HTMLDivElement>({ once: false, threshold: 0.35 });

  // A paragraph becomes the current one when it crosses the vertical center line of the view
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onActive(index);
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [index, onActive]);

  const Visual = step.Visual;

  return (
    <div id={id} ref={ref} className="flex scroll-mt-28 flex-col justify-center py-10 lg:min-h-[78vh] lg:py-0">
      <Reveal>
        <p className="text-sm font-medium text-muted-foreground">{step.tab}</p>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-[2rem] sm:leading-tight">{step.title}</h3>
        {step.body ? <p className="mt-4 max-w-md text-pretty text-muted-foreground">{step.body}</p> : null}
      </Reveal>
      {/* Mobile: the animation sits directly under the text, and plays once it enters the view */}
      <div ref={mobileRef} aria-hidden className="mt-8 flex min-w-0 justify-center lg:hidden">
        <Visual active={mobileInView} />
      </div>
    </div>
  );
}

export function ScrollStory({ steps, locale = "en", labels, className }: ScrollStoryProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const uid = useId().replace(/:/g, "");
  const [active, setActive] = useState(0);
  const { ref: panelRef, inView: panelInView } = useInView<HTMLDivElement>({ once: false, threshold: 0.2 });
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const anchor = (key: string) => `story-${uid}-${key}`;

  return (
    <div className={cn("ss-root lg:grid lg:grid-cols-[1fr_1.1fr] lg:gap-16", className)}>
      <style>{CSS}</style>
      <div className="min-w-0">
        {steps.map((step, i) => (
          <StepBlock key={step.key} id={anchor(step.key)} index={i} step={step} onActive={setActive} />
        ))}
      </div>

      <div className="hidden lg:block">
        <div ref={panelRef} className="sticky top-[11vh] flex h-[78vh] flex-col">
          <div aria-hidden className="relative flex-1 overflow-hidden rounded-xl border border-border bg-muted/50">
            {steps.map((step, i) => {
              const Visual = step.Visual;
              return (
                <div key={step.key} className="ss-scene px-8" data-active={active === i}>
                  <Visual active={isDesktop && panelInView && active === i} />
                </div>
              );
            })}
          </div>
          <nav aria-label={t.nav} className="mt-4 flex justify-center gap-1">
            {steps.map((step, i) => (
              <a
                key={step.key}
                href={`#${anchor(step.key)}`}
                aria-current={active === i ? "step" : undefined}
                className={cn(
                  "ss-press rounded-full px-3 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  active === i ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {step.tab}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
