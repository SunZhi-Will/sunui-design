"use client";

import { AnimatePresence, motion, useReducedMotion, type Transition, type Variants } from "framer-motion";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { Stamp } from "@/components/ui/stamp";
import { cn } from "@/lib/utils";

/**
 * 顏色全部是 shadcn token（bg-card、border-border、text-muted-foreground），強調只用 primary。
 * system 與 light 跟著頁面；dark 在元件上加 .dark，讓 shadcn 的深色 token 只套在這一張票上。
 */
export type ReservationTheme = "light" | "dark" | "system";
const themeClass = (theme: ReservationTheme) => (theme === "system" ? undefined : theme);

// 數值同 registry/lib/sunui-motion
const snappy: Transition = { type: "spring", stiffness: 520, damping: 34 };
const gentle: Transition = { type: "spring", stiffness: 240, damping: 30 };
const instant: Transition = { duration: 0 };
const ease = [0.23, 1, 0.32, 1] as const;
const roll: Variants = {
  enter: (d: number) => ({ y: d >= 0 ? "60%" : "-60%", opacity: 0 }),
  center: { y: 0, opacity: 1, transition: snappy },
  exit: (d: number) => ({ y: d >= 0 ? "-60%" : "60%", opacity: 0, transition: { duration: 0.12 } }),
};

const MIN = 60_000;
const HOUR = 60 * MIN;
const DOTS = 12;

/** 時間戳可能是秒或毫秒，統一轉成毫秒 */
const toMs = (n: number) => (n < 1e11 ? n * 1000 : n);
const toTime = (v: Date | string | number) => (typeof v === "number" ? toMs(v) : new Date(v).getTime());
const pad = (n: number) => String(n).padStart(2, "0");

/** 舊版倒數格式：「0 hr 09 min 40 sec」。只在傳入 formatCountdown 或 labels.countdown 時才用逐秒格式 */
export function formatHoldCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 3600)} hr ${pad(Math.floor((s % 3600) / 60))} min ${pad(s % 60)} sec`;
}

export interface ReservationTimerLabels {
  /** 小標，例如「為你保留中」 */
  title?: ReactNode;
  /** 主標：保留到幾點 */
  until?: (time: ReactNode) => ReactNode;
  /** 剩一小時以上：只說大約幾小時 */
  about?: (hours: number) => ReactNode;
  /** 剩一小時內：分鐘數（會滾動的數字） */
  minutes?: (digits: ReactNode) => ReactNode;
  /** 最後五分鐘：分:秒 */
  seconds?: (digits: ReactNode) => ReactNode;
  /** 逾時會發生什麼事，照實說 */
  note?: ReactNode;
  /** 到期後的結果標記文字 */
  released?: ReactNode;
  /** 到期後的說明 */
  releasedNote?: ReactNode;
  /** 延長按鈕；extendLabel prop 優先 */
  extend?: ReactNode;
  /** 舊版：給了就用它當主標（保留期限加剩餘時間），取代 until */
  deadline?: (date: string, left: ReactNode) => ReactNode;
  /** 舊版：搭配 deadline，到期後剩餘時間的字 */
  zero?: ReactNode;
  /** 舊版：逐秒的剩餘時間格式；formatCountdown prop 優先 */
  countdown?: (ms: number) => string;
}

export interface ReservationTimerProps {
  /** 保留到期時間，數字可為秒或毫秒 */
  expiresAt: Date | string | number;
  /** 保留開始時間。有它（或 holdMs）才顯示代表整段保留的墨點 */
  startedAt?: Date | string | number;
  /** 整段保留的長度（毫秒），沒有 startedAt 時用來推算開始時間 */
  holdMs?: number;
  /** 保留的是什麼：票的左側錨點，到期時不動 */
  item?: { name: ReactNode; detail?: ReactNode; image?: ReactNode };
  /** 剩餘歸零時呼叫一次，請在這裡重新抓訂單 */
  onExpire?: () => void;
  /** 一次性延長。按過或沒給就不顯示按鈕；延長後請傳入新的 expiresAt */
  onExtend?: () => void;
  extendLabel?: ReactNode;
  formatCountdown?: (ms: number) => string;
  /** 介面語言與時間格式：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  timeZone?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: ReservationTimerLabels;
  theme?: ReservationTheme;
  className?: string;
  style?: CSSProperties;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

type Messages = Required<Omit<ReservationTimerLabels, "deadline" | "countdown">>;
const MESSAGES: Record<SunLocale, Messages> = {
  en: {
    title: "Held for you", released: "Released", zero: "0 sec", extend: "Extend the hold once",
    until: (time) => <>Held until {time}</>,
    about: (h) => `about ${h} h left`,
    minutes: (d) => <>{d} min left</>,
    seconds: (d) => <>{d} left</>,
    note: "When the hold ends the order is cancelled and the item goes back on sale. Payments after that are refunded, so please pay before then.",
    releasedNote: "The hold ended and the item went back on sale.",
  },
  "zh-TW": {
    title: "為你保留中", released: "已釋出", zero: "0 秒", extend: "延長一次保留",
    until: (time) => <>保留至 {time}</>,
    about: (h) => `約剩 ${h} 小時`,
    minutes: (d) => <>剩 {d} 分鐘</>,
    seconds: (d) => <>剩 {d}</>,
    note: "保留結束後訂單會自動取消，商品重新開放購買；之後才付款將改為退款，請在期限內完成付款。",
    releasedNote: "保留已結束，商品已重新開放購買。",
  },
  "zh-CN": {
    title: "为你保留中", released: "已释放", zero: "0 秒", extend: "延长一次保留",
    until: (time) => <>保留至 {time}</>,
    about: (h) => `约剩 ${h} 小时`,
    minutes: (d) => <>剩 {d} 分钟</>,
    seconds: (d) => <>剩 {d}</>,
    note: "保留结束后订单会自动取消，商品重新开放购买；之后才付款将转为退款，请在期限内完成付款。",
    releasedNote: "保留已结束，商品已重新开放购买。",
  },
  ja: {
    title: "お取り置き中", released: "取り置き終了", zero: "0 秒", extend: "一度だけ延長する",
    until: (time) => <>{time} までお取り置き</>,
    about: (h) => `残り約 ${h} 時間`,
    minutes: (d) => <>残り {d} 分</>,
    seconds: (d) => <>残り {d}</>,
    note: "期限を過ぎると注文はキャンセルされ、商品は再び販売されます。期限後のお支払いは返金となるため、それまでにお支払いください。",
    releasedNote: "お取り置きが終了し、商品は再び販売中です。",
  },
};

/** 只有變了的那一位數字滾動；dir 1 往上（增加），-1 往下（減少）。減少動態時直接換字，結構不變 */
function Roll({ text, dir, reduce }: { text: string; dir: number; reduce: boolean }) {
  return (
    <span className="inline-flex whitespace-pre">
      {Array.from(text).map((ch, i, all) => (
        <span key={all.length - i} className="inline-grid">
          <AnimatePresence initial={false} custom={dir}>
            <motion.span
              key={ch}
              custom={dir}
              variants={roll}
              initial={reduce ? false : "enter"}
              animate="center"
              exit={reduce ? { opacity: 0, transition: instant } : "exit"}
              className="[grid-area:1/1]"
              suppressHydrationWarning
            >
              {ch}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}

/** 冷靜的保留票：先說保留到幾點，精度隨剩餘時間提高，墨點逐顆熄滅；到期時同一張票劃掉時刻、標上已釋出。 */
export function ReservationTimer({
  expiresAt,
  startedAt,
  holdMs,
  item,
  onExpire,
  onExtend,
  extendLabel,
  formatCountdown,
  locale = "en-US",
  timeZone,
  labels,
  theme = "system",
  className,
  style,
}: ReservationTimerProps) {
  const reduce = useReducedMotion() ?? false;
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const end = toTime(expiresAt);
  const start = startedAt !== undefined ? toTime(startedAt) : holdMs ? end - holdMs : null;
  const [now, setNow] = useState(() => Date.now());
  const [extended, setExtended] = useState(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  // 以時間為準：每秒取一次現在時間，分頁回到前景時立刻重算（背景分頁的 interval 會被節流）
  useEffect(() => {
    const sync = () => setNow(Date.now());
    const id = setInterval(sync, 1000);
    document.addEventListener("visibilitychange", sync);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  const left = Math.max(0, end - now);
  const expired = left <= 0;
  // 只在跨過到期線時通知一次
  useEffect(() => {
    if (expired) onExpireRef.current?.();
  }, [expired]);

  const day = (ms: number) => new Intl.DateTimeFormat("en-CA", { timeZone, dateStyle: "short" }).format(ms);
  const today = day(end) === day(now);
  const clock = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
    ...(today ? null : { month: "numeric", day: "numeric", weekday: "short" }),
  }).format(end);

  const custom = formatCountdown ?? labels?.countdown;
  const s = Math.floor(left / 1000);
  const remaining = custom
    ? custom(left)
    : left >= HOUR
      ? t.about(Math.round(left / HOUR))
      : left > 5 * MIN
        ? t.minutes(<Roll text={String(Math.floor(left / MIN))} dir={-1} reduce={reduce} />)
        : t.seconds(<Roll text={`${Math.floor(s / 60)}:${pad(s % 60)}`} dir={-1} reduce={reduce} />);

  const total = start !== null ? end - start : 0;
  const lit = total > 0 ? Math.min(DOTS, Math.ceil((left / total) * DOTS)) : 0;
  const fade = (ms: number) => (reduce ? instant : { duration: ms / 1000 });
  const canExtend = Boolean(onExtend) && !extended && !expired;

  const time = (
    <span className="relative inline-block tabular-nums">
      <Roll text={clock} dir={1} reduce={reduce} />
      <motion.span
        aria-hidden
        className="absolute inset-x-0 top-1/2 h-px origin-left bg-current"
        initial={false}
        animate={{ scaleX: expired ? 1 : 0 }}
        transition={reduce ? instant : { duration: 0.24, ease }}
      />
    </span>
  );

  return (
    <motion.div
      layout
      transition={reduce ? instant : gentle}
      className={cn(themeClass(theme), "flex w-full min-w-0 flex-col overflow-hidden border border-border bg-card text-[13px] text-card-foreground", className)}
      style={{ borderRadius: 12, ...style }}
    >
      {item && (
        <motion.div layout="position" className="flex min-w-0 items-center gap-3 border-b border-dashed border-border p-4">
          {item.image && <div className="size-12 shrink-0 overflow-hidden rounded-md bg-muted [&>img]:size-full [&>img]:object-cover">{item.image}</div>}
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{item.name}</p>
            {item.detail && <p className="truncate text-xs text-muted-foreground">{item.detail}</p>}
          </div>
        </motion.div>
      )}
      <motion.div layout="position" className="flex flex-col gap-2 p-4">
        <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">{t.title}</p>
        <p className="text-base font-semibold text-foreground">
          {labels?.deadline ? labels.deadline(clock, <span role="timer">{expired ? t.zero : remaining}</span>) : t.until(time)}
        </p>
        <div className="flex min-h-6 flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <AnimatePresence mode="wait" initial={false}>
            {expired ? (
              <motion.span key="released" exit={{ opacity: 0, transition: fade(100) }}>
                <Stamp tone="ink" void size="sm">
                  {t.released}
                </Stamp>
              </motion.span>
            ) : labels?.deadline ? null : (
              <motion.span key="left" role="timer" exit={{ opacity: 0, transition: fade(100) }} className="text-foreground tabular-nums">
                {remaining}
              </motion.span>
            )}
          </AnimatePresence>
          {total > 0 && (
            <span aria-hidden className="flex items-center gap-1">
              {Array.from({ length: DOTS }, (_, i) => (
                <span key={i} className="relative size-1.5 rounded-full bg-foreground/15">
                  <motion.span
                    className="absolute inset-0 rounded-full bg-foreground"
                    initial={false}
                    animate={{ scale: i < lit ? 1 : 0, opacity: i < lit ? 1 : 0 }}
                    transition={reduce ? instant : { duration: 0.36, ease }}
                  />
                </span>
              ))}
            </span>
          )}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={expired ? "after" : "before"}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1, transition: reduce ? instant : { duration: 0.18, delay: 0.06 } }}
            exit={{ opacity: 0, transition: fade(100) }}
            className="leading-relaxed text-muted-foreground"
          >
            {expired ? t.releasedNote : t.note}
          </motion.p>
        </AnimatePresence>
        <AnimatePresence initial={false}>
          {canExtend && (
            <motion.button
              key="extend"
              type="button"
              exit={{ opacity: 0, transition: fade(100) }}
              onClick={() => {
                setExtended(true);
                onExtend?.();
              }}
              className="self-start rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {extendLabel ?? t.extend}
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
      {/* 只在狀態改變時播報，倒數本身不逐秒朗讀 */}
      <span className="sr-only" aria-live="polite">
        {expired ? (
          <>
            {t.released}. {t.releasedNote}
          </>
        ) : null}
      </span>
    </motion.div>
  );
}

// lucide Clock，線寬 1.5
function ClockIcon() {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export interface ReservationExpiredPanelProps {
  title?: ReactNode;
  children?: ReactNode;
  /** 例如「回到商品頁」按鈕 */
  action?: ReactNode;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale；title / children prop 又優先於這裡 */
  labels?: Partial<ReservationExpiredLabels>;
  theme?: ReservationTheme;
  className?: string;
  style?: CSSProperties;
}

export interface ReservationExpiredLabels {
  title: ReactNode;
  body: ReactNode;
}

const EXPIRED_MESSAGES: Record<SunLocale, ReservationExpiredLabels> = {
  en: { title: "Order expired", body: "The hold has ended, the order was cancelled automatically and the item is back on sale. If you already paid, contact us and we will sort it out or refund you." },
  "zh-TW": { title: "訂單已逾期", body: "保留時間已結束，訂單已自動取消，商品重新開放購買。若你已經付款，請與我們聯繫，我們會協助處理或退款。" },
  "zh-CN": { title: "订单已过期", body: "保留时间已结束，订单已自动取消，商品重新开放购买。如果你已经付款，请联系我们，我们会协助处理或退款。" },
  ja: { title: "注文の期限が切れました", body: "お取り置き期間が終了したため、注文は自動でキャンセルされ、商品は再び販売中です。すでにお支払い済みの場合はご連絡ください。対応または返金いたします。" },
};

/** 保留逾時後取代整個結帳內容的狀態面板。只想在原處標示到期時，ReservationTimer 本身就會變形，不必換成這個。 */
export function ReservationExpiredPanel({ title, children, action, locale = "en", labels, theme = "system", className, style }: ReservationExpiredPanelProps) {
  const t = { ...EXPIRED_MESSAGES[resolveLocale(locale)], ...labels };
  return (
    <div role="status" className={cn(themeClass(theme), "flex flex-col items-start gap-3 text-foreground", className)} style={style}>
      <span className="text-muted-foreground">
        <ClockIcon />
      </span>
      <h2 className="text-xl font-semibold">{title ?? t.title}</h2>
      <div className="flex w-full flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
        <p>{children ?? t.body}</p>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
