"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { Stamp } from "@/components/ui/stamp";
import { cn } from "@/lib/utils";

export type LanguageType = "zh" | "en";

export interface CountdownBannerProps {
  title?: string;
  subtitle?: string;
  /** 折扣字樣，例如「40% OFF」「6 折」 */
  discount?: string;
  originalPrice?: string;
  discountedPrice?: string;
  /** 真實的結束時間（必填）。不提供預設值，避免每次載入都重新倒數的假稀缺 */
  endDate: Date | string;
  /**
   * 活動或直播的開始時間。給了就先倒數到開始（「距離開始」），開始後顯示「進行中」並倒數到 endDate。
   * 只倒數到真正的那一刻，不製造假的截止壓力。
   */
  startDate?: Date | string;
  /**
   * hydration 前顯示的日期文字，例如「11/11（三）23:59」；有 startDate 時指開始時間，否則指結束時間。
   * 伺服器與瀏覽器都只印這段文字，不印跳動的數字，兩邊輸出一致。不給時顯示 --。
   */
  dateLabel?: string;
  /** 倒數跨過 startDate 時呼叫一次 */
  onStart?: () => void;
  /** 倒數結束時呼叫一次 */
  onEnd?: () => void;
  ctaText?: string;
  /** 提供時 CTA 為連結 */
  ctaHref?: string;
  onCtaClick?: () => void;
  /** 舊版寫法：zh 等同 locale="zh-TW"，en 等同 locale="en"；有給 locale 時以 locale 為準 */
  language?: LanguageType;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
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
  /** 有 startDate 時，開始前的小標 */
  startsIn: string;
  /** 有 startDate 時，開始後到結束前的狀態 */
  live: string;
  /** 掛載後計時器下方的日期說明 */
  startsOn: (date: string) => string;
  endsOn: (date: string) => string;
  endedOn: (date: string) => string;
  /** 原價前的螢幕閱讀器文字 */
  original: string;
  /** 倒數計時器的無障礙名稱 */
  timer: (p: { days: number; hours: number; minutes: number }) => string;
  /** 距離開始的倒數的無障礙名稱 */
  startTimer: (p: { days: number; hours: number; minutes: number }) => string;
  /** 沒有給 title、subtitle、ctaText 時的預設文案 */
  defaultTitle: string;
  defaultSubtitle: string;
  defaultCta: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
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

// 設計語言（DESIGN.md）：紙、紙邊、墨、朱紅
const paper = "bg-[#f7f7f7] dark:bg-[#1c1c1c]";
const paperUnder = "bg-[#efefef] dark:bg-[#262626]";
const edge = "border-[#e2e2e2] dark:border-[#333333]";
const ink = "text-[#171717] dark:text-[#ededed]";
const inkMuted = "text-[#171717]/60 dark:text-[#ededed]/60";
/** 品牌專色：預設跟著主題的 --primary，買家設 --sunui-spot 就換成自己的品牌色。只用在選中、優惠、目前進度 */
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

  // 現在時間只在瀏覽器取得；伺服器與 hydration 前只印 dateLabel，兩邊輸出一致
  const [now, setNow] = useState<number | null>(null);
  const [wasRunning, setWasRunning] = useState(false);
  useEffect(() => {
    // 結束時間無效時不倒數，絕不自行編造期限
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
    // 分頁隱藏時停止跳動，回到前景先對時再繼續
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

  // 跨過開始、結束時各通知一次（只在親眼看到跨越時，重新整理不會補發）
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

  // 日期說明在掛載後才用使用者的時區排版
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
      className={cn("@container w-full rounded-md border font-sans shadow-[0_1px_0_rgb(0_0_0/0.04)]", paper, edge, ink, className)}
    >
      <div className="grid gap-5 p-5 @3xl:grid-cols-[1fr_auto_auto] @3xl:items-center @3xl:gap-0 @3xl:p-0">
        <div className="min-w-0 @3xl:px-6 @3xl:py-5">
          <h2 className="text-lg leading-snug font-semibold tracking-tight text-balance @3xl:text-xl">{title}</h2>
          {subtitle && <p className={cn("mt-1 text-sm text-pretty", inkMuted)}>{subtitle}</p>}
        </div>

        <div className={cn("relative border-t border-dashed pt-5 @3xl:border-t-0 @3xl:border-l @3xl:px-6 @3xl:py-5", edge)}>
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
                <Stamp tone="ink" seed="sale-ended" appear={wasRunning}>
                  {t.ended}
                </Stamp>
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className={cn("flex flex-wrap items-end gap-x-6 gap-y-4 border-t border-dashed pt-5 @3xl:border-t-0 @3xl:border-l @3xl:px-6 @3xl:py-5", edge)}>
          <div>
            {/* 進行中只在狀態改變時播報一次，不逐秒朗讀 */}
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

/** 印在紙上的翻頁數字：只有值改變時，上半張沿中線翻下 */
function FlipCard({ value, reduceMotion }: { value: string; reduceMotion: boolean }) {
  const [state, setState] = useState({ prev: value, cur: value });
  if (state.cur !== value) setState({ prev: state.cur, cur: value });
  // 用計時器收掉翻頁片，背景分頁暫停動畫時也不會卡住
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
      <span className="absolute inset-x-0 top-1/2 z-10 h-px bg-[#171717]/15 dark:bg-black/50" />
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
        paperUnder,
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
