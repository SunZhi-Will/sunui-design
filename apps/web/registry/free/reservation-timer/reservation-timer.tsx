"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ReservationTheme = "light" | "dark" | "system";

// V窩品牌 token：亮色「午後」為預設、暗色「夜間配信」。可用同名 CSS 變數覆寫。
const LIGHT = {
  "--vw-text-primary": "#3B2A26",
  "--vw-text-secondary": "#6F574F",
  "--vw-text-muted": "#7E655C",
  "--vw-border": "#EADBCD",
  "--vw-accent-soft": "#F6E1E3",
};
const DARK: typeof LIGHT = {
  "--vw-text-primary": "#F6EBE3",
  "--vw-text-secondary": "#C9B5AA",
  "--vw-text-muted": "#A99288",
  "--vw-border": "#3C2F2A",
  "--vw-accent-soft": "#3A2328",
};

const rule = (sel: string, vars: Record<string, string>) =>
  `${sel}{${Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";")}}`;
const SYSTEM_CSS = `${rule(".sunui-vw-hold", LIGHT)}@media (prefers-color-scheme: dark){${rule(".sunui-vw-hold", DARK)}}`;

function themeStyle(theme: ReservationTheme) {
  return theme === "system" ? undefined : ((theme === "dark" ? DARK : LIGHT) as CSSProperties);
}

function ThemeStyle({ theme }: { theme: ReservationTheme }) {
  if (theme !== "system") return null;
  return (
    <style href="sunui-vw-hold" precedence="default">
      {SYSTEM_CSS}
    </style>
  );
}

/** 時間戳可能是秒或毫秒，統一轉成毫秒 */
const toMs = (n: number) => (n < 1e11 ? n * 1000 : n);
const toTime = (v: Date | string | number) => (typeof v === "number" ? toMs(v) : new Date(v).getTime());

const pad = (n: number) => String(n).padStart(2, "0");

/** 預設倒數格式：「0 hr 09 min 40 sec」，對應原本的「0 小時 09 分 40 秒」 */
export function formatHoldCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 3600)} hr ${pad(Math.floor((s % 3600) / 60))} min ${pad(s % 60)} sec`;
}

export interface ReservationTimerLabels {
  title?: ReactNode;
  /** 第二行：保留期限與剩餘時間 */
  deadline?: (date: string, left: ReactNode) => ReactNode;
  /** 到期後剩餘時間顯示的字 */
  zero?: ReactNode;
  /** 第三行：逾時會發生什麼事，照實說 */
  note?: ReactNode;
  /** 剩餘時間格式；formatCountdown prop 優先 */
  countdown?: (ms: number) => string;
}

export interface ReservationTimerProps {
  /** 保留到期時間，數字可為秒或毫秒 */
  expiresAt: Date | string | number;
  /** 剩餘歸零時呼叫一次（原本用來重新抓訂單，讓頁面切到「已逾期」） */
  onExpire?: () => void;
  formatCountdown?: (ms: number) => string;
  /** 介面語言與日期格式：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
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

/** 依單位字組出「0 小時 09 分 40 秒」這類格式 */
const countdownWith = (h: string, m: string, sec: string) => (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 3600)} ${h} ${pad(Math.floor((s % 3600) / 60))} ${m} ${pad(s % 60)} ${sec}`;
};

const MESSAGES: Record<SunLocale, Required<ReservationTimerLabels>> = {
  en: {
    title: "This item is held for you",
    deadline: (date, left) => (
      <>
        Held until {date}, <strong className="tabular-nums">{left}</strong> left
      </>
    ),
    zero: "0 sec",
    note: "When the hold runs out the order is cancelled automatically and the item goes back on sale. If you pay after that, the order is handled by hand (usually a refund), so please finish paying before the deadline.",
    countdown: formatHoldCountdown,
  },
  "zh-TW": {
    title: "為你保留中",
    deadline: (date, left) => (
      <>
        保留至 {date}，剩餘 <strong className="tabular-nums">{left}</strong>
      </>
    ),
    zero: "0 秒",
    note: "保留時間結束後，訂單會自動取消，商品重新開放購買。若在那之後才付款，訂單將改由人工處理（通常為退款），請在期限內完成付款。",
    countdown: countdownWith("小時", "分", "秒"),
  },
  "zh-CN": {
    title: "为你保留中",
    deadline: (date, left) => (
      <>
        保留至 {date}，剩余 <strong className="tabular-nums">{left}</strong>
      </>
    ),
    zero: "0 秒",
    note: "保留时间结束后，订单会自动取消，商品重新开放购买。若在此之后才付款，订单将转为人工处理（通常为退款），请在期限内完成付款。",
    countdown: countdownWith("小时", "分", "秒"),
  },
  ja: {
    title: "お取り置き中です",
    deadline: (date, left) => (
      <>
        {date} までお取り置き、残り <strong className="tabular-nums">{left}</strong>
      </>
    ),
    zero: "0 秒",
    note: "お取り置き期間を過ぎると注文は自動でキャンセルされ、商品は再び販売されます。期限後のお支払いは個別対応（通常は返金）となるため、期限内にお支払いを済ませてください。",
    countdown: countdownWith("時間", "分", "秒"),
  },
};

// lucide Timer
function TimerIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="10" x2="14" y1="2" y2="2" />
      <line x1="12" x2="15" y1="14" y2="11" />
      <circle cx="12" cy="14" r="8" />
    </svg>
  );
}

/** 「為你保留中」倒數面板：保留期限、每秒更新的剩餘時間，加上逾時後果的說明。 */
export function ReservationTimer({
  expiresAt,
  onExpire,
  formatCountdown,
  locale = "en-US",
  timeZone,
  labels,
  theme = "system",
  className,
  style,
}: ReservationTimerProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const format = formatCountdown ?? t.countdown;
  const end = toTime(expiresAt);
  const [now, setNow] = useState(() => Date.now());
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const left = end - now;
  const expired = left <= 0;
  // 只在跨過到期線時通知一次
  useEffect(() => {
    if (expired) onExpireRef.current?.();
  }, [expired]);

  const date = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(end));

  return (
    <>
      <ThemeStyle theme={theme} />
      <div
        className={cn("sunui-vw-hold flex flex-col gap-1 p-4 text-[13px]", className)}
        style={{
          ...themeStyle(theme),
          borderRadius: 12,
          background: "var(--vw-accent-soft)",
          border: "1px solid var(--vw-border)",
          color: "var(--vw-text-primary)",
          ...style,
        }}
      >
        <p className="flex items-center gap-2 font-bold">
          <TimerIcon />
          {t.title}
        </p>
        <p suppressHydrationWarning>
          {t.deadline(date, <span role="timer" suppressHydrationWarning>{left > 0 ? format(left) : t.zero}</span>)}
        </p>
        <p style={{ color: "var(--vw-text-secondary)" }}>{t.note}</p>
      </div>
    </>
  );
}

// lucide Clock
function ClockIcon() {
  return (
    <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
  en: {
    title: "Order expired",
    body: "The hold has ended, the order was cancelled automatically and the item is back on sale. If you already paid, contact us and we will sort it out or refund you.",
  },
  "zh-TW": {
    title: "訂單已逾期",
    body: "保留時間已結束，訂單已自動取消，商品重新開放購買。若你已經付款，請與我們聯繫，我們會協助處理或退款。",
  },
  "zh-CN": {
    title: "订单已过期",
    body: "保留时间已结束，订单已自动取消，商品重新开放购买。如果你已经付款，请联系我们，我们会协助处理或退款。",
  },
  ja: {
    title: "注文の期限が切れました",
    body: "お取り置き期間が終了したため、注文は自動でキャンセルされ、商品は再び販売中です。すでにお支払い済みの場合はご連絡ください。対応または返金いたします。",
  },
};

/** 保留逾時後取代結帳內容的狀態面板。 */
export function ReservationExpiredPanel({
  title,
  children,
  action,
  locale = "en",
  labels,
  theme = "system",
  className,
  style,
}: ReservationExpiredPanelProps) {
  const t = { ...EXPIRED_MESSAGES[resolveLocale(locale)], ...labels };
  return (
    <>
      <ThemeStyle theme={theme} />
      <div role="status" className={cn("sunui-vw-hold flex flex-col items-start gap-3", className)} style={{ ...themeStyle(theme), ...style }}>
        <span style={{ color: "var(--vw-text-muted)" }}>
          <ClockIcon />
        </span>
        <h2 className="text-[22px] tracking-[0.02em]" style={{ color: "var(--vw-text-primary)" }}>
          {title ?? t.title}
        </h2>
        <div className="flex w-full flex-col gap-3 text-[14px] leading-relaxed" style={{ color: "var(--vw-text-secondary)" }}>
          <p>{children ?? t.body}</p>
          {action && <div>{action}</div>}
        </div>
      </div>
    </>
  );
}
