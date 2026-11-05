"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface HonestCountdownLabels {
  /** 倒數前的小標 */
  until?: ReactNode;
  days?: ReactNode;
  hours?: ReactNode;
  minutes?: ReactNode;
  seconds?: ReactNode;
  /** 進行中 */
  live?: ReactNode;
  /** 結束後 */
  ended?: (dateLabel: ReactNode) => ReactNode;
  /** 給螢幕閱讀器的靜態完整說法，不每秒朗讀 */
  srRemaining?: (days: number, hours: number, dateLabel: string) => string;
}

export interface HonestCountdownProps {
  /** 開始時間（ISO 字串、Date 或毫秒）；沒有就只顯示日期文字 */
  startAt?: Date | string | number;
  /** 結束時間，預設開始後 2 小時 */
  endAt?: Date | string | number;
  /** 日期文字，掛載前、沒有時間、結束後都會用到，例如「Wed Oct 28, 8 PM」 */
  dateLabel: string;
  onStart?: () => void;
  onEnd?: () => void;
  /** 強調色，預設品牌金 */
  accent?: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: HonestCountdownLabels;
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

const MESSAGES: Record<SunLocale, Required<HonestCountdownLabels>> = {
  en: {
    until: "Starts in",
    days: "d",
    hours: "h",
    minutes: "m",
    seconds: "s",
    live: "Live now",
    ended: (d) => <>The live stream has ended, {d}</>,
    srRemaining: (d, h, label) =>
      `${d} ${d === 1 ? "day" : "days"} ${h} ${h === 1 ? "hour" : "hours"} to go, ${label}`,
  },
  "zh-TW": {
    until: "距離開始",
    days: "天",
    hours: "時",
    minutes: "分",
    seconds: "秒",
    live: "直播中",
    ended: (d) => <>直播已結束，{d}</>,
    srRemaining: (d, h, label) => `還有 ${d} 天 ${h} 小時，${label}`,
  },
  "zh-CN": {
    until: "距离开始",
    days: "天",
    hours: "时",
    minutes: "分",
    seconds: "秒",
    live: "直播中",
    ended: (d) => <>直播已结束，{d}</>,
    srRemaining: (d, h, label) => `还有 ${d} 天 ${h} 小时，${label}`,
  },
  ja: {
    until: "開始まで",
    days: "日",
    hours: "時間",
    minutes: "分",
    seconds: "秒",
    live: "配信中",
    ended: (d) => <>配信は終了しました（{d}）</>,
    srRemaining: (d, h, label) => `あと ${d} 日 ${h} 時間、${label}`,
  },
};

const parse = (v?: Date | string | number) => (v === undefined ? NaN : typeof v === "number" ? v : new Date(v).getTime());

// 原站暗色 token 與活動頁的金色、等寬字
const VARS = {
  "--hc-accent": "#F5C045",
  "--hc-text": "rgba(255,255,255,0.93)",
  "--hc-text-secondary": "rgba(255,255,255,0.58)",
  "--hc-text-muted": "rgba(255,255,255,0.50)",
  "--hc-card": "rgba(255,255,255,0.05)",
  "--hc-border-subtle": "rgba(255,255,255,0.06)",
  "--hc-mono": 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
} as CSSProperties;

const CSS = `@keyframes sunui-hc-pulse{0%,100%{opacity:1}50%{opacity:.35}}
.sunui-hc-dot{width:8px;height:8px;border-radius:999px;background:var(--hc-accent);animation:sunui-hc-pulse 2s ease-in-out infinite}
@media (prefers-reduced-motion: reduce){.sunui-hc-dot{animation:none}}`;

/**
 * 距離開始的倒數。只倒數到「真正開始的那一刻」，不製造假的截止壓力。
 * 伺服器端與 hydration 前只顯示日期文字，掛載後才開始算，避免時間不同造成 hydration 不一致。
 */
export function HonestCountdown({ startAt, endAt, dateLabel, onStart, onEnd, accent, locale = "en", labels, className, style }: HonestCountdownProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const [now, setNow] = useState<number | null>(null);
  const start = parse(startAt);
  const end = endAt === undefined ? start + 2 * 60 * 60 * 1000 : parse(endAt);

  useEffect(() => {
    if (Number.isNaN(start)) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    // 分頁回到前景時再對時一次
    const onVisible = () => document.visibilityState === "visible" && setNow(Date.now());
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [start]);

  const phase = now === null || Number.isNaN(start) ? "idle" : now >= end ? "ended" : now >= start ? "live" : "before";

  // 跨過開始、結束時各通知一次
  const startRef = useRef(onStart);
  startRef.current = onStart;
  const endRef = useRef(onEnd);
  endRef.current = onEnd;
  const prev = useRef(phase);
  useEffect(() => {
    if (prev.current === "before" && phase === "live") startRef.current?.();
    if ((prev.current === "before" || prev.current === "live") && phase === "ended") endRef.current?.();
    prev.current = phase;
  }, [phase]);

  const rootStyle = { ...VARS, ...(accent ? { "--hc-accent": accent } : null), ...style } as CSSProperties;
  const fallback = "m-0 text-[14px] font-bold text-[color:var(--hc-text-secondary)]";

  if (phase === "idle") {
    return (
      <p className={cn(fallback, className)} style={rootStyle}>
        {dateLabel}
      </p>
    );
  }
  if (phase === "ended") {
    return (
      <p className={cn(fallback, className)} style={rootStyle}>
        {t.ended(dateLabel)}
      </p>
    );
  }
  if (phase === "live") {
    return (
      <p role="status" className={cn("m-0 inline-flex items-center gap-2 font-black text-[color:var(--hc-accent)]", className)} style={rootStyle}>
        <style href="sunui-honest-countdown" precedence="default">
          {CSS}
        </style>
        <span className="sunui-hc-dot" aria-hidden="true" />
        {t.live}
      </p>
    );
  }

  const total = Math.floor((start - (now as number)) / 1000);
  const parts = [
    { value: Math.floor(total / 86400), unit: t.days, key: "d" },
    { value: Math.floor((total % 86400) / 3600), unit: t.hours, key: "h" },
    { value: Math.floor((total % 3600) / 60), unit: t.minutes, key: "m" },
    { value: total % 60, unit: t.seconds, key: "s" },
  ];

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-3 text-[color:var(--hc-text)]", className)} style={rootStyle}>
      <span className="text-[13px] font-bold text-[color:var(--hc-text-muted)]">{t.until}</span>
      {/* 每秒變動的數字不讓螢幕閱讀器一直念，給一個靜態的完整說法 */}
      <span className="sr-only">{t.srRemaining(parts[0].value, parts[1].value, dateLabel)}</span>
      <span className="flex gap-2" aria-hidden="true">
        {parts.map((part) => (
          <span
            key={part.key}
            className="grid min-w-[52px] justify-items-center rounded-[10px] border border-[color:var(--hc-border-subtle)] bg-[color:var(--hc-card)] px-1 py-2"
          >
            <b className="text-[22px] leading-[1.1] tabular-nums" style={{ fontFamily: "var(--hc-mono)" }}>
              {String(part.value).padStart(2, "0")}
            </b>
            <small className="text-[11px] text-[color:var(--hc-text-muted)]">{part.unit}</small>
          </span>
        ))}
      </span>
    </div>
  );
}
