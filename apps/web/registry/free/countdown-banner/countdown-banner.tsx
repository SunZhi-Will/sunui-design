"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { Result } from "@/components/ui/stamp";
import { cn } from "@/lib/utils";

export type LanguageType = "zh" | "en";

export interface CountdownBannerProps {
  title?: string;
  subtitle?: string;
  /** Discount text, for example "40% OFF" or "60% of original price" */
  discount?: string;
  originalPrice?: string;
  discountedPrice?: string;
  /** The real end time (required). There is no default, to avoid fake scarcity from a countdown that restarts on every load */
  endDate: Date | string;
  /**
   * Start time of the event or livestream. When given, it counts down to the start first ("starts in"), then shows "live" after it begins and counts down to endDate.
   * It only counts down to real moments and never creates fake deadline pressure.
   */
  startDate?: Date | string;
  /**
   * Date text shown before hydration, for example "11/11 (Wed) 23:59"; with startDate it means the start time, otherwise the end time.
   * The server and the browser both print only this text, never the ticking digits, so the two outputs match. Shows -- when not given.
   */
  dateLabel?: string;
  /** Called once when the countdown crosses startDate */
  onStart?: () => void;
  /** Called once when the countdown ends */
  onEnd?: () => void;
  ctaText?: string;
  /** When provided, the CTA is a link */
  ctaHref?: string;
  onCtaClick?: () => void;
  /** Legacy form: zh equals locale="zh-TW", en equals locale="en"; when locale is given, locale wins */
  language?: LanguageType;
  /** UI language: en, zh-TW, zh-CN, ja; tags such as zh-Hant-HK and ja-JP are also accepted */
  locale?: string;
  /** Override the built-in strings, takes priority over locale */
  labels?: Partial<CountdownBannerLabels>;
  className?: string;
  style?: CSSProperties;
}

export interface CountdownBannerLabels {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  endsIn: string;
  ended: string;
  /** With startDate, the small label before the start */
  startsIn: string;
  /** With startDate, the status between the start and the end */
  live: string;
  /** Date note under the timer after mount */
  startsOn: (date: string) => string;
  endsOn: (date: string) => string;
  endedOn: (date: string) => string;
  /** Screen reader text before the original price */
  original: string;
  /** Accessible name of the countdown timer */
  timer: (p: { days: number; hours: number; minutes: number }) => string;
  /** Accessible name of the countdown to the start */
  startTimer: (p: { days: number; hours: number; minutes: number }) => string;
  /** Default copy when title, subtitle and ctaText are not given */
  defaultTitle: string;
  defaultSubtitle: string;
  defaultCta: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Map any language tag to one of the four built-in languages; everything else falls back to English */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, CountdownBannerLabels> = {
  en: {
    days: "Days",
    hours: "Hrs",
    minutes: "Min",
    seconds: "Sec",
    endsIn: "Ends in",
    ended: "Ended",
    startsIn: "Starts in",
    live: "Live now",
    startsOn: (d) => `Starts ${d}`,
    endsOn: (d) => `Ends ${d}`,
    endedOn: (d) => `Ended ${d}`,
    original: "Was",
    timer: (p) => `Time left: ${p.days} Days ${p.hours} Hrs ${p.minutes} Min`,
    startTimer: (p) => `Starts in ${p.days} Days ${p.hours} Hrs ${p.minutes} Min`,
    defaultTitle: "Limited-time offer",
    defaultSubtitle: "When the countdown ends, so does the deal.",
    defaultCta: "View the offer",
  },
  "zh-TW": {
    days: "天",
    hours: "時",
    minutes: "分",
    seconds: "秒",
    endsIn: "倒數",
    ended: "已結束",
    startsIn: "距離開始",
    live: "進行中",
    startsOn: (d) => `${d} 開始`,
    endsOn: (d) => `${d} 結束`,
    endedOn: (d) => `已於 ${d} 結束`,
    original: "原價",
    timer: (p) => `距離結束還有 ${p.days} 天 ${p.hours} 時 ${p.minutes} 分`,
    startTimer: (p) => `距離開始還有 ${p.days} 天 ${p.hours} 時 ${p.minutes} 分`,
    defaultTitle: "限時優惠活動",
    defaultSubtitle: "倒數結束，錯過不再",
    defaultCta: "立即查看優惠",
  },
  "zh-CN": {
    days: "天",
    hours: "时",
    minutes: "分",
    seconds: "秒",
    endsIn: "倒计时",
    ended: "已结束",
    startsIn: "距离开始",
    live: "进行中",
    startsOn: (d) => `${d} 开始`,
    endsOn: (d) => `${d} 结束`,
    endedOn: (d) => `已于 ${d} 结束`,
    original: "原价",
    timer: (p) => `距离结束还有 ${p.days} 天 ${p.hours} 小时 ${p.minutes} 分`,
    startTimer: (p) => `距离开始还有 ${p.days} 天 ${p.hours} 小时 ${p.minutes} 分`,
    defaultTitle: "限时优惠活动",
    defaultSubtitle: "倒计时结束，错过不再",
    defaultCta: "立即查看优惠",
  },
  ja: {
    days: "日",
    hours: "時間",
    minutes: "分",
    seconds: "秒",
    endsIn: "終了まで",
    ended: "終了",
    startsIn: "開始まで",
    live: "開催中",
    startsOn: (d) => `${d} 開始`,
    endsOn: (d) => `${d} 終了`,
    endedOn: (d) => `${d} に終了しました`,
    original: "通常価格",
    timer: (p) => `終了まで残り ${p.days} 日 ${p.hours} 時間 ${p.minutes} 分`,
    startTimer: (p) => `開始まで残り ${p.days} 日 ${p.hours} 時間 ${p.minutes} 分`,
    defaultTitle: "期間限定セール",
    defaultSubtitle: "カウントダウンが終わると締め切りです",
    defaultCta: "セール内容を見る",
  },
};

// Design language (DESIGN.md, craft quality): surfaces, hairlines, text colors, brand accent color
const surface = "bg-card shadow-[0_1px_2px_rgb(0_0_0/0.05),0_4px_12px_-6px_rgb(0_0_0/0.06)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]";
const surfaceUnder = "bg-muted dark:bg-foreground/10";
const edge = "border-foreground/10";
const ink = "text-foreground";
const inkMuted = "text-muted-foreground";
/** Brand accent color: follows the theme's --primary by default; buyers set --sunui-spot to use their own brand color. Used only for selection, the offer and current progress */
const spot = "text-[color:var(--sunui-spot,var(--primary))]";
const spotFill = "bg-[color:var(--sunui-spot,var(--primary))] text-[color:var(--sunui-spot-foreground,var(--primary-foreground))]";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
} as const;

export function CountdownBanner({
  title,
  subtitle,
  discount = "40% OFF",
  originalPrice = "42,000 NTD",
  discountedPrice = "25,200 NTD",
  endDate,
  startDate,
  dateLabel,
  onStart,
  onEnd,
  ctaText,
  ctaHref,
  onCtaClick,
  language,
  locale,
  labels,
  className,
  style,
}: CountdownBannerProps) {
  const lang = resolveLocale(locale ?? (language === "zh" ? "zh-TW" : language));
  const t = { ...MESSAGES[lang], ...labels };
  title ??= t.defaultTitle;
  subtitle ??= t.defaultSubtitle;
  ctaText ??= t.defaultCta;
  const reduceMotion = !!useReducedMotion();
  const endTime = new Date(endDate).getTime();
  const endKey = Number.isNaN(endTime) ? null : endTime;
  const startTime = startDate === undefined ? NaN : new Date(startDate).getTime();
  const startKey = Number.isNaN(startTime) ? null : startTime;

  // The current time is only read in the browser; the server and pre-hydration output print only dateLabel, so both match
  const [now, setNow] = useState<number | null>(null);
  const [wasRunning, setWasRunning] = useState(false);
  useEffect(() => {
    // When the end time is invalid it does not count down, and never makes up a deadline
    if (endKey === null) return;
    const end = endKey;
    let id: number | undefined;
    const stop = () => {
      window.clearInterval(id);
      id = undefined;
    };
    const tick = () => {
      const n = Date.now();
      setNow(n);
      if (n < end) setWasRunning(true);
      else stop();
    };
    // Stop ticking while the tab is hidden; on return to the foreground, resync the time before continuing
    const resume = () => {
      tick();
      if (id === undefined && Date.now() < end) id = window.setInterval(tick, 1000);
    };
    const onVisibility = () => (document.hidden ? stop() : resume());
    if (document.hidden) tick();
    else resume();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [endKey]);

  const phase = now === null ? "idle" : now >= (endKey ?? Infinity) ? "ended" : startKey !== null && now < startKey ? "upcoming" : "running";
  const ended = phase === "ended";
  const upcoming = phase === "upcoming";
  const live = phase === "running" && startKey !== null;
  const target = upcoming ? (startKey as number) : (endKey ?? 0);
  const remaining = now === null ? null : Math.max(0, target - now);

  // Notify once each when the start and the end are crossed (only when the crossing is actually seen, a refresh does not fire it again)
  const startRef = useRef(onStart);
  const endRef = useRef(onEnd);
  useEffect(() => {
    startRef.current = onStart;
    endRef.current = onEnd;
  });
  const prevPhase = useRef(phase);
  useEffect(() => {
    const prev = prevPhase.current;
    if (prev === "upcoming" && phase === "running") startRef.current?.();
    if ((prev === "upcoming" || prev === "running") && phase === "ended") endRef.current?.();
    prevPhase.current = phase;
  }, [phase]);

  // The date note is laid out in the user's time zone only after mount
  const dateText =
    now === null ? null : new Intl.DateTimeFormat(lang, { month: "short", day: "numeric", weekday: "short", hour: "numeric", minute: "2-digit" }).format(target);
  const dateLine = dateText && (upcoming ? t.startsOn(dateText) : ended ? t.endedOn(dateText) : t.endsOn(dateText));

  const s = Math.floor((remaining ?? 0) / 1000);
  const parts = { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
  const units = (["days", "hours", "minutes", "seconds"] as const).filter((k) => k !== "days" || parts.days > 0 || remaining === null);
  const timerLabel = upcoming ? t.startTimer(parts) : t.timer(parts);
  const idleText = now === null && dateLabel ? (startKey !== null ? t.startsOn(dateLabel) : t.endsOn(dateLabel)) : null;

  return (
    <section
      style={style}
      className={cn("@container w-full rounded-xl border font-sans shadow-[0_1px_2px_rgb(0_0_0/0.05),0_4px_12px_-6px_rgb(0_0_0/0.06)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]", surface, edge, ink, className)}
    >
      <div className="grid gap-5 p-5 @3xl:grid-cols-[1fr_auto_auto] @3xl:items-center @3xl:gap-0 @3xl:p-0">
        <div className="min-w-0 @3xl:px-6 @3xl:py-5">
          <h2 className="text-lg leading-snug font-semibold tracking-tight text-balance @3xl:text-xl">{title}</h2>
          {subtitle && <p className={cn("mt-1 text-sm text-pretty", inkMuted)}>{subtitle}</p>}
        </div>

        <div className={cn("relative border-t pt-5 @3xl:border-t-0 @3xl:border-l @3xl:px-6 @3xl:py-5", edge)}>
          <p className={cn("text-4xl leading-none font-black tracking-tight tabular-nums transition-opacity", ended ? cn(inkMuted, "opacity-40") : spot)}>{discount}</p>
          {(discountedPrice || originalPrice) && (
            <p className="mt-2 flex flex-wrap items-baseline gap-x-2 text-sm tabular-nums">
              {discountedPrice && <span className="font-semibold">{discountedPrice}</span>}
              {originalPrice && (
                <span className={inkMuted}>
                  <span className="sr-only">{t.original} </span>
                  <s>{originalPrice}</s>
                </span>
              )}
            </p>
          )}
          <AnimatePresence initial={false}>
            {ended && (
              <motion.span key="ended" exit={{ opacity: 0, transition: { duration: 0.15 } }} className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%]">
                <Result tone="muted" seed="sale-ended" appear={wasRunning}>
                  {t.ended}
                </Result>
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className={cn("flex flex-wrap items-end gap-x-6 gap-y-4 border-t pt-5 @3xl:border-t-0 @3xl:border-l @3xl:px-6 @3xl:py-5", edge)}>
          <div>
            {/* While live, announce only once when the state changes, not every second */}
            <span className="sr-only" role="status">
              {live ? t.live : ""}
            </span>
            {idleText ? (
              <p className="text-lg leading-snug font-semibold tabular-nums">{idleText}</p>
            ) : (
              <>
                <p className={cn("mb-1.5 flex flex-wrap items-center gap-x-2 text-[11px] font-medium tracking-[0.16em] uppercase", inkMuted)}>
                  {live && (
                    <span aria-hidden="true" className={cn("inline-flex items-center gap-1.5 font-semibold", ink)}>
                      <span className="size-1.5 rounded-full bg-current" />
                      {t.live}
                    </span>
                  )}
                  <span>{upcoming ? t.startsIn : t.endsIn}</span>
                </p>
                <div role="timer" aria-live="off" aria-label={remaining === null ? undefined : ended ? t.ended : timerLabel} className={cn("flex items-start gap-1.5", ended && "opacity-40")}>
                  {units.map((k, i) => (
                    <div key={k} aria-hidden="true" className="flex items-start gap-1.5">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex gap-0.5 text-lg font-semibold tabular-nums">
                          {(remaining === null ? "--" : String(parts[k]).padStart(2, "0")).split("").map((d, di) => (
                            <FlipCard key={di} value={d} reduceMotion={reduceMotion} />
                          ))}
                        </div>
                        <span className={cn("text-[10px] tracking-[0.12em] uppercase", inkMuted)}>{t[k]}</span>
                      </div>
                      {i < units.length - 1 && <span className={cn("pt-1.5 text-sm", inkMuted)}>:</span>}
                    </div>
                  ))}
                </div>
                {dateLine && <p className={cn("mt-2 text-xs tabular-nums", inkMuted)}>{dateLine}</p>}
              </>
            )}
          </div>
          {!ended && ctaText && <Cta href={ctaHref} onClick={onCtaClick} label={ctaText} reduceMotion={reduceMotion} />}
        </div>
      </div>
    </section>
  );
}

/** Flip digit: only when the value changes, the upper half flips down along the midline */
function FlipCard({ value, reduceMotion }: { value: string; reduceMotion: boolean }) {
  const [state, setState] = useState({ prev: value, cur: value });
  if (state.cur !== value) setState({ prev: state.cur, cur: value });
  // Remove the flip leaf with a timer, so it cannot get stuck when a background tab pauses animation
  useEffect(() => {
    if (state.prev === state.cur) return;
    const id = window.setTimeout(() => setState((st) => ({ ...st, prev: st.cur })), 340);
    return () => window.clearTimeout(id);
  }, [state]);
  const flipping = !reduceMotion && state.prev !== state.cur && state.prev !== "-";
  return (
    <span className="relative block h-9 w-[1.6rem] [perspective:300px]">
      <Half top value={state.cur} />
      <Half value={flipping ? state.prev : state.cur} />
      <span className="absolute inset-x-0 top-1/2 z-10 h-px bg-foreground/15 dark:bg-black/50" />
      {flipping && (
        <>
          {[true, false].map((top) => (
            <motion.span
              key={`${top}${state.cur}`}
              className={cn("absolute inset-x-0 h-1/2 [backface-visibility:hidden]", top ? "top-0 origin-bottom" : "bottom-0 origin-top")}
              initial={{ rotateX: top ? 0 : 90 }}
              animate={{ rotateX: top ? -90 : 0 }}
              transition={{ duration: 0.16, delay: top ? 0 : 0.16, ease: top ? "easeIn" : "easeOut" }}
            >
              <Half top={top} flap value={top ? state.prev : state.cur} />
            </motion.span>
          ))}
        </>
      )}
    </span>
  );
}

function Half({ top, flap, value }: { top?: boolean; flap?: boolean; value: string }) {
  return (
    <span
      className={cn(
        "block overflow-hidden border",
        surfaceUnder,
        edge,
        flap ? "relative size-full" : cn("absolute inset-x-0 h-1/2", top ? "top-0" : "bottom-0"),
        top ? "rounded-t-[3px] border-b-0" : "rounded-b-[3px]",
      )}
    >
      <span className={cn("absolute inset-x-0 flex h-[200%] items-center justify-center", top ? "top-0" : "bottom-0")}>{value}</span>
    </span>
  );
}

function Cta({ href, onClick, label, reduceMotion }: { href?: string; onClick?: () => void; label: string; reduceMotion: boolean }) {
  const cls = cn(
    spotFill,
    "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium whitespace-nowrap hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
  );
  const tap = reduceMotion ? undefined : { scale: 0.97 };
  return href ? (
    <motion.a href={href} onClick={onClick} whileTap={tap} transition={springs.snappy} className={cls}>
      {label}
    </motion.a>
  ) : (
    <motion.button type="button" onClick={onClick} whileTap={tap} transition={springs.snappy} className={cls}>
      {label}
    </motion.button>
  );
}
