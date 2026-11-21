"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type StarRatingSize = "sm" | "md" | "lg";

export interface StarRatingProps {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Number of stars */
  max?: number;
  /** 0.5 supports half stars */
  precision?: 0.5 | 1;
  /** Read-only display mode; supports any decimal (for example 4.3) */
  readOnly?: boolean;
  disabled?: boolean;
  size?: StarRatingSize;
  /** UI language: en, zh-TW, zh-CN, ja. Tags such as zh-Hant-HK or ja-JP are also accepted */
  locale?: string;
  /** Override built-in strings; an array is treated as the text for each whole score (length equals max) */
  labels?: string[] | Partial<StarRatingLabels>;
  /** Whether to show the text label on the right */
  showLabel?: boolean;
  /** Clicking the current score again clears it to 0 */
  allowClear?: boolean;
  /** Field name when submitted with a form */
  name?: string;
  /** Accessible name of the whole group */
  "aria-label"?: string;
  className?: string;
  /** Reason tags that grow below once a score is chosen; scores <= threshold use low, otherwise high. Can also be a function that returns tags for the score */
  reasons?: { low: string[]; high: string[] } | ((value: number) => string[]);
  /** Boundary between low and high, default 3 */
  threshold?: number;
  selectedReasons?: string[];
  defaultSelectedReasons?: string[];
  onReasonsChange?: (reasons: string[]) => void;
  /** Number of people per score, index 0 is 1 star; once chosen, shows "Same as N% of buyers" */
  distribution?: number[];
}

export interface StarRatingLabels {
  /** Text for each whole score */
  levels: string[];
  /** Default accessible name of the whole group */
  group: string;
  rated: (value: number, max: number) => string;
  stars: (value: number) => string;
  /** Reason prompt for low scores */
  askLow: string;
  /** Reason prompt for high scores */
  askHigh: string;
  /** Share of people who gave the same score as you */
  same: (pct: number) => ReactNode;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Map any language tag to one of the four built-in languages; everything else falls back to English */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, StarRatingLabels> = {
  en: {
    levels: ["Terrible", "Poor", "Okay", "Good", "Great"],
    group: "Rating",
    rated: (v, max) => `Rated ${v} out of ${max}`,
    stars: (v) => `${v} ${v === 1 ? "star" : "stars"}`,
    askLow: "What went wrong?", askHigh: "What did you like?",
    same: (p) => `Same as ${p}% of buyers`,
  },
  "zh-TW": {
    levels: ["很差", "不太好", "普通", "不錯", "很棒"],
    group: "評分",
    rated: (v, max) => `評分 ${v} / ${max}`,
    stars: (v) => `${v} 顆星`,
    askLow: "哪裡不太好？", askHigh: "喜歡哪裡？",
    same: (p) => `和 ${p}% 的買家給一樣的分數`,
  },
  "zh-CN": {
    levels: ["很差", "较差", "一般", "不错", "很棒"],
    group: "评分",
    rated: (v, max) => `评分 ${v} / ${max}`,
    stars: (v) => `${v} 颗星`,
    askLow: "哪里不太好？", askHigh: "喜欢哪里？",
    same: (p) => `和 ${p}% 的买家打了一样的分`,
  },
  ja: {
    levels: ["最悪", "いまいち", "ふつう", "良い", "最高"],
    group: "評価",
    rated: (v, max) => `${max} 点中 ${v} 点`,
    stars: (v) => `星 ${v}`,
    askLow: "どこが気になりましたか？", askHigh: "どこが良かったですか？",
    same: (p) => `${p}% の購入者と同じ評価`,
  },
};

// Design language (DESIGN.md): thin-line stars, no gold
const ink = "text-foreground";
/** Brand accent: follows the theme's --primary by default; buyers set --sunui-spot to use their own brand colour. Used only for selection, offers and current progress */
const spot = "text-[color:var(--sunui-spot,var(--primary))]";
/** Semantic rating colour: filled stars are amber like on every review site, not the brand spot. Buyers can set --sunui-rating */
const rating = "text-[color:var(--sunui-rating,#f5a524)]";
const spotBorder = "border-[color:var(--sunui-spot,var(--primary))]";
const spotFill = "bg-[color:var(--sunui-spot,var(--primary))] text-[color:var(--sunui-spot-foreground,var(--primary-foreground))]";
const snappy = { type: "spring", stiffness: 520, damping: 34 } as const;
const gentle = { type: "spring", stiffness: 240, damping: 30 } as const;
const instant = { duration: 0 } as const;

const starSize: Record<StarRatingSize, string> = { sm: "size-4", md: "size-6", lg: "size-8" };
const labelSize: Record<StarRatingSize, string> = { sm: "text-xs", md: "text-sm", lg: "text-base" };

const STAR = "M12 3.2l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6-4.4-4.2 6-.8z";

/** One star: a thin outline underneath, with a solid fill clipped on top by the fill ratio; in a clickable picker the solid part uses the brand accent */
function Star({ fill, className, fillClassName }: { fill: number; className?: string; fillClassName?: string }) {
  return (
    <span aria-hidden="true" className={cn("relative block", className)}>
      <svg viewBox="0 0 24 24" className="absolute inset-0 size-full" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
        <path d={STAR} className="opacity-45" />
      </svg>
      <span className={cn("absolute inset-0 overflow-hidden", fillClassName)} style={{ width: `${fill * 100}%` }}>
        <svg viewBox="0 0 24 24" className={cn("block", className)} fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
          <path d={STAR} />
        </svg>
      </span>
    </span>
  );
}

const round = (n: number, precision: number) => Math.round(n / precision) * precision;

// The text label scrolls in the direction the score moves: up when it rises, down when it falls
const roll = {
  enter: (d: number) => ({ y: d > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (d: number) => ({ y: d > 0 ? "-100%" : "100%", opacity: 0 }),
};

export function StarRating({
  value: valueProp,
  defaultValue = 0,
  onValueChange,
  max = 5,
  precision = 1,
  readOnly = false,
  disabled = false,
  size = "md",
  locale = "en",
  labels: labelsProp,
  showLabel = true,
  allowClear = true,
  name,
  "aria-label": ariaLabelProp,
  className,
  reasons,
  threshold = 3,
  selectedReasons,
  defaultSelectedReasons = [],
  onReasonsChange,
  distribution,
}: StarRatingProps) {
  const t = {
    ...MESSAGES[resolveLocale(locale)],
    ...(Array.isArray(labelsProp) ? { levels: labelsProp } : labelsProp),
  };
  const labels = t.levels;
  const ariaLabel = ariaLabelProp ?? t.group;
  const reduce = useReducedMotion() ?? false;
  const labelId = useId();
  const askId = useId();
  const [inner, setInner] = useState(defaultValue);
  const value = valueProp ?? inner;
  const [hover, setHover] = useState<number | null>(null);
  const [pressed, setPressed] = useState<number | null>(null);
  const [innerPicked, setInnerPicked] = useState(defaultSelectedReasons);
  const picked = selectedReasons ?? innerPicked;
  const refs = useRef(new Map<number, HTMLElement>());
  const interactive = !readOnly && !disabled;
  const shown = interactive && hover !== null ? hover : value;
  const fillOf = (i: number) => Math.min(1, Math.max(0, shown - i));
  const labelFor = (v: number) => (v > 0 ? (labels[Math.min(Math.ceil(v), labels.length) - 1] ?? "") : "");

  // Remember the previously shown score to work out the scroll direction (state derived during render)
  const [rolled, setRolled] = useState({ v: shown, d: 1 });
  if (rolled.v !== shown) setRolled({ v: shown, d: shown > rolled.v ? 1 : -1 });

  // The reason area below follows its content height, morphing with a gentle spring so content beneath slides along
  const bodyRef = useRef<HTMLDivElement>(null);
  // First render uses auto, so an already chosen state appears directly with no entrance animation
  const [bodyH, setBodyH] = useState<number | "auto">("auto");
  const hasBody = !readOnly && (!!reasons || !!distribution);
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBodyH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasBody]);

  if (readOnly) {
    const fixed = Math.round(value * 10) / 10;
    return (
      <div role="img" aria-label={t.rated(fixed, max)} className={cn("inline-flex items-center gap-0.5", ink, className)}>
        {Array.from({ length: max }, (_, i) => (
          <Star key={i} fill={fillOf(i)} className={starSize[size]} fillClassName={rating} />
        ))}
      </div>
    );
  }

  const low = (v: number) => v <= threshold;
  const reasonsFor = (v: number) => (v <= 0 || !reasons ? [] : typeof reasons === "function" ? reasons(v) : low(v) ? reasons.low : reasons.high);
  const setPicked = (next: string[]) => {
    if (selectedReasons === undefined) setInnerPicked(next);
    onReasonsChange?.(next);
  };

  const commit = (next: number) => {
    if (!interactive) return;
    const v = Math.min(max, Math.max(0, round(next, precision)));
    if (valueProp === undefined) setInner(v);
    onValueChange?.(v);
    // When switching to another reason group, clear the tags chosen in the previous group
    const list = reasonsFor(v);
    const kept = picked.filter((r) => list.includes(r));
    if (kept.length !== picked.length) setPicked(kept);
  };

  // All selectable scores, for example 0.5, 1, 1.5 ...; roving tabindex rests on the current score
  const steps = Array.from({ length: Math.round(max / precision) }, (_, i) => round((i + 1) * precision, precision));
  const tabStop = steps.includes(value) ? value : steps[0];

  const onKeyDown = (e: KeyboardEvent<HTMLElement>, v: number) => {
    if (e.key === " " || e.key === "Enter") return (e.preventDefault(), commit(v));
    if ((e.key === "Backspace" || e.key === "Delete") && allowClear) return (e.preventDefault(), commit(0));
    const c = value || 0;
    const up = Math.min(max, c + precision);
    const down = Math.max(precision, c - precision);
    const next = { ArrowRight: up, ArrowUp: up, ArrowLeft: down, ArrowDown: down, Home: precision, End: max }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const r = round(next, precision);
    commit(r);
    refs.current.get(r)?.focus();
  };

  const radioLabel = (v: number) => `${t.stars(v)}${labelFor(v) ? `, ${labelFor(v)}` : ""}`;
  const list = reasonsFor(value);
  const setKey = typeof reasons === "function" ? list.join("|") : low(value) ? "low" : "high";
  const total = distribution?.reduce((s, n) => s + n, 0) ?? 0;
  const pct = value > 0 && total > 0 ? Math.round(((distribution?.[Math.ceil(value) - 1] ?? 0) / total) * 100) : null;
  const toggle = (r: string) => setPicked(picked.includes(r) ? picked.filter((x) => x !== r) : [...picked, r]);
  const release = () => setPressed(null);
  // The main text arrives first and the tags follow in sequence about 60ms later
  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0 },
    transition: reduce ? instant : { ...snappy, delay },
  });

  return (
    <div className={cn("inline-flex max-w-full flex-col", ink, className)}>
      {/* When the container is too narrow the text label moves below the stars so it does not push out the parent */}
      <div className="flex max-w-full flex-wrap items-center gap-x-3 gap-y-1.5">
        <div
          role="radiogroup"
          aria-label={ariaLabel}
          aria-describedby={showLabel ? labelId : undefined}
          aria-disabled={disabled || undefined}
          onPointerLeave={() => (setHover(null), release())}
          className={cn("flex items-center gap-0.5", disabled && "cursor-not-allowed opacity-50")}
        >
          {Array.from({ length: max }, (_, i) => {
            const whole = i + 1;
            const hits = precision === 0.5 ? [whole - 0.5, whole] : [whole];
            return (
              <span key={i} className={cn("relative block", starSize[size])}>
                {/* On press, squash lightly and return, no stamp-style rebound */}
                <motion.span className="absolute inset-0 block" animate={{ scale: pressed === i && !reduce ? 0.92 : 1 }} transition={snappy}>
                  <Star fill={fillOf(i)} className={starSize[size]} fillClassName={rating} />
                </motion.span>
                {hits.map((v, k) => (
                  <span
                    key={v}
                    role="radio"
                    aria-checked={value === v}
                    aria-label={radioLabel(v)}
                    aria-disabled={disabled || undefined}
                    tabIndex={disabled ? -1 : tabStop === v ? 0 : -1}
                    ref={(el) => void (el ? refs.current.set(v, el) : refs.current.delete(v))}
                    onPointerEnter={() => interactive && setHover(v)}
                    onPointerDown={() => interactive && setPressed(i)}
                    onPointerUp={release}
                    onPointerCancel={release}
                    onClick={() => commit(allowClear && value === v ? 0 : v)}
                    onKeyDown={(e) => onKeyDown(e, v)}
                    className={cn(
                      "absolute inset-y-0 cursor-pointer rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      hits.length === 2 ? (k === 0 ? "left-0 w-1/2" : "right-0 w-1/2") : "inset-x-0",
                      disabled && "cursor-not-allowed",
                    )}
                  />
                ))}
              </span>
            );
          })}
        </div>
        {showLabel && (
          <span id={labelId} className={cn("relative inline-flex min-w-[6.5em] overflow-hidden py-0.5 leading-tight whitespace-nowrap", labelSize[size])}>
            <AnimatePresence initial={false} custom={rolled.d} mode="popLayout">
              <motion.span
                key={shown}
                custom={rolled.d}
                variants={roll}
                initial={reduce ? false : "enter"}
                animate="center"
                exit={reduce ? undefined : "exit"}
                transition={reduce ? instant : { duration: 0.18, ease: [0.2, 0, 0, 1] }}
                className="inline-block"
              >
                {shown > 0 && <span className="font-mono tabular-nums">{shown.toFixed(precision === 0.5 ? 1 : 0)}</span>}
                <span className="ml-1.5 text-current/60">{labelFor(shown)}</span>
              </motion.span>
            </AnimatePresence>
          </span>
        )}
      </div>
      {hasBody && (
        // The same frame grows downward: height uses a gentle spring, and the stars are a fixed anchor
        <motion.div initial={false} animate={{ height: bodyH }} transition={reduce ? instant : gentle} className="overflow-hidden">
          <div ref={bodyRef}>
            {value > 0 && (list.length > 0 || pct !== null) && (
              <div className="px-0.5 pt-3 pb-0.5">
                <AnimatePresence initial={false} mode="wait">
                  {list.length > 0 && (
                    <motion.div key={setKey} exit={reduce ? undefined : { opacity: 0, transition: { duration: 0.1 } }}>
                      <motion.p id={askId} {...rise(0)} className="text-sm font-medium">
                        {low(value) ? t.askLow : t.askHigh}
                      </motion.p>
                      <div role="group" aria-labelledby={askId} className="mt-2 flex flex-wrap gap-1.5">
                        {list.map((r, i) => {
                          const on = picked.includes(r);
                          return (
                            <motion.button
                              key={r}
                              type="button"
                              aria-pressed={on}
                              onClick={() => toggle(r)}
                              {...rise(0.06 * Math.min(i + 1, 5))}
                              className={cn(
                                "rounded-md border px-2.5 py-1 text-xs leading-tight transition-[color,background-color,border-color,opacity,scale] outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-[0.97]",
                                on
                                  ? cn(spotBorder, spotFill)
                                  : "border-foreground/10 text-current/80 hover:border-muted-foreground/70",
                              )}
                            >
                              {r}
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {pct !== null && <p className={cn("text-xs text-current/60 tabular-nums", list.length > 0 && "mt-2.5")}>{t.same(pct)}</p>}
              </div>
            )}
          </div>
        </motion.div>
      )}
      {name && <input type="hidden" name={name} value={value} />}
    </div>
  );
}
