"use client";

import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, type MotionValue } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import { cn } from "@/lib/utils";

export type ScrollSection = {
  /** ID of the matching section element */
  id: string;
  label: string;
};

export interface ScrollProgressProps {
  /** Scroll container; when omitted, window is tracked */
  container?: RefObject<HTMLElement | null>;
  /** Section ticks, clickable to jump */
  sections?: ScrollSection[];
  /** fixed pins to the top of the window; sticky sticks to the top of the container; static leaves layout to the parent. With fixed, ticks print no text */
  position?: "fixed" | "sticky" | "static";
  /** Thickness of the thin line (px) */
  thickness?: number;
  /** Class for the line color */
  barClassName?: string;
  /** Print the percentage at the top right of the ruler */
  showPercent?: boolean;
  /** Follow smoothly; turned off automatically under reduced motion */
  smooth?: boolean;
  /** UI language: en, zh-TW, zh-CN, ja; tags such as zh-Hant-HK and ja-JP are also accepted */
  locale?: string;
  /** Override the built-in strings; takes precedence over locale */
  labels?: Partial<ScrollProgressLabels>;
  className?: string;
}

export interface ScrollProgressLabels {
  progress: string;
  jumpTo: (label: string) => string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Map any language tag to one of the four built-in languages; everything else uses English */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, ScrollProgressLabels> = {
  en: { progress: "Reading progress", jumpTo: (label) => `Jump to ${label}` },
  "zh-TW": { progress: "閱讀進度", jumpTo: (label) => `跳到「${label}」` },
  "zh-CN": { progress: "阅读进度", jumpTo: (label) => `跳到“${label}”` },
  ja: { progress: "読書の進捗", jumpTo: (label) => `「${label}」へ移動` },
};

// Design language (DESIGN.md): the border as the baseline, the brand accent as progress
const edgeLine = "bg-foreground/10";
/** Brand accent: follows the theme's --primary by default; set --sunui-spot to use your own brand color. Used only for selection, offers and current progress */
const spotBg = "bg-[color:var(--sunui-spot,var(--primary))]";
const ink = "text-foreground";
const inkMuted = "text-muted-foreground";

type Marker = ScrollSection & { at: number; top: number };

export function ScrollProgress({
  container,
  sections = [],
  position = "fixed",
  thickness = 2,
  barClassName,
  showPercent = false,
  smooth = true,
  locale = "en",
  labels,
  className,
}: ScrollProgressProps) {
  const reduceMotion = useReducedMotion();
  const text = { ...MESSAGES[resolveLocale(locale)], ...labels };
  // layoutEffect: false, so it binds only after the parent's container ref is attached, otherwise it falls back to tracking window
  const { scrollYProgress } = useScroll(container ? { container, layoutEffect: false } : undefined);
  const spring = useSpring(scrollYProgress, { stiffness: 240, damping: 30, restDelta: 0.001 });
  const value: MotionValue<number> = smooth && !reduceMotion ? spring : scrollYProgress;

  // Update state only when the integer percentage changes, to avoid re-rendering on every scroll frame
  const [percent, setPercent] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = Math.round(Math.min(Math.max(v, 0), 1) * 100);
    setPercent((p) => (p === next ? p : next));
  });

  const [markers, setMarkers] = useState<Marker[]>([]);
  // sections is often an inline array, so join the ids into a key to decide whether to measure again
  const sectionKey = sections.map((s) => `${s.id}:${s.label}`).join("|");
  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;

  const measure = useCallback(() => {
    const root = container?.current ?? null;
    const max = root ? root.scrollHeight - root.clientHeight : document.documentElement.scrollHeight - window.innerHeight;
    const rootTop = root ? root.getBoundingClientRect().top - root.scrollTop : -window.scrollY;
    const next: Marker[] = [];
    for (const s of sectionsRef.current) {
      const el = root ? root.querySelector<HTMLElement>(`#${CSS.escape(s.id)}`) : document.getElementById(s.id);
      if (!el) continue;
      // Respect scroll-margin-top, so the heading does not sit flush against the edge after jumping
      const top = el.getBoundingClientRect().top - rootTop - (parseFloat(getComputedStyle(el).scrollMarginTop) || 0);
      next.push({ ...s, top, at: max > 0 ? Math.min(Math.max(top / max, 0), 1) : 0 });
    }
    setMarkers(next);
  }, [container, sectionKey]);

  useEffect(() => {
    if (sections.length === 0) return;
    measure();
    const root = container?.current;
    const ro = new ResizeObserver(measure);
    ro.observe(root ?? document.documentElement);
    if (root?.firstElementChild) ro.observe(root.firstElementChild);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, container, sections.length]);

  const jump = (m: Marker) => {
    const target = container?.current ?? window;
    target.scrollTo({ top: m.top, behavior: reduceMotion ? "auto" : "smooth" });
  };

  const printLabels = position !== "fixed" && markers.length > 0;

  return (
    <div
      className={cn(
        "inset-x-0 top-0 z-40 w-full",
        position === "fixed" && "fixed",
        position === "sticky" && "sticky",
        position === "static" && "relative",
        printLabels && "pb-5",
        className,
      )}
    >
      <div
        role="progressbar"
        aria-label={text.progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${percent}%`}
        className="relative flex w-full items-end"
        style={{ height: thickness }}
      >
        <span aria-hidden="true" className={cn("absolute inset-x-0 bottom-0 h-px", edgeLine)} />
        <motion.span
          aria-hidden="true"
          className={cn("absolute inset-0 origin-left", spotBg, barClassName)}
          style={{ scaleX: value }}
        />
      </div>

      {markers.length > 0 && (
        <nav aria-label={text.progress} className="absolute inset-x-0 top-0">
          <ul>
            {markers.map((m, i) => {
              // percent is rounded to an integer; allow a 1% error so the tick counts as read right after jumping
              const passed = percent / 100 >= m.at - 0.01;
              // Ticks near the end print their text to the left of the mark and share space equally with the previous one, so they do not crowd into a point
              const flip = (k: number) => k > 0 && k < markers.length && (markers[k + 1]?.at ?? 1) - markers[k].at < 0.15;
              const room = flip(i)
                ? (m.at - markers[i - 1].at) / 2
                : ((markers[i + 1]?.at ?? 1) - m.at) / (flip(i + 1) ? 2 : 1);
              return (
                <li
                  key={m.id}
                  className="@container absolute top-0 flex"
                  style={{
                    [flip(i) ? "right" : "left"]: `${(flip(i) ? 1 - m.at : m.at) * 100}%`,
                    width: `${room * 100}%`,
                    justifyContent: flip(i) ? "flex-end" : "flex-start",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => jump(m)}
                    aria-label={text.jumpTo(m.label)}
                    title={printLabels ? undefined : m.label}
                    className={cn(
                      "group flex max-w-full items-start gap-1.5 rounded-[2px] outline-none transition-[color,background-color,border-color,opacity,scale] focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-current motion-safe:active:scale-[0.97]",
                      flip(i) ? "flex-row-reverse pl-2 text-right" : "pr-2 text-left",
                      passed ? ink : inkMuted,
                    )}
                    style={{ height: thickness + 18 }}
                  >
                    {/* Tick: like a mark on a ruler */}
                    <span aria-hidden="true" className="h-[9px] w-px shrink-0 bg-current" style={{ marginTop: thickness }} />
                    {/* When space is short keep only the mark, and do not print labels cut down to one or two letters */}
                    {printLabels && (
                      <span
                        aria-hidden="true"
                        className="mt-[3px] hidden truncate text-[11px] @min-[4rem]:block leading-[14px] tracking-[0.04em] decoration-1 underline-offset-[3px] group-hover:underline group-focus-visible:underline"
                        style={{ paddingTop: thickness }}
                      >
                        {m.label}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      {showPercent && (
        <span
          aria-hidden="true"
          className={cn("absolute right-0 bottom-full mb-1.5 text-[11px] leading-none tabular-nums", inkMuted)}
        >
          {percent}%
        </span>
      )}
    </div>
  );
}
