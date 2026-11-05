"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// 每日簽到卡：最近 7 天（含今天）的圓圈、連續天數、簽到按鈕與結果提示。
// 簽到成功後送出一個 window 事件，讓額度表之類的元件重新讀取。

/** 預設的全域事件名稱，quota-meter 也聽這個 */
export const REWARDS_EVENT = "sunui:rewards";

export interface CheckinStreakLabels {
  title?: ReactNode;
  /** 說明行：每天多幾張，以及連續天數 */
  description?: (reward: number, streak: number) => ReactNode;
  weekAria?: string;
  today?: string;
  weekday?: (date: Date, locale?: string) => string;
  dayAria?: (label: string, done: boolean) => string;
  checkIn?: (reward: number) => ReactNode;
  done?: ReactNode;
  success?: (reward: number) => string;
  error?: string;
  close?: string;
}

export interface CheckinResult {
  /** 實際拿到的張數；不傳時用 reward */
  reward?: number;
  /** 伺服器算好的連續天數；不傳時自動加一 */
  streak?: number;
}

export interface CheckinStreakProps {
  /** 今天，當地時間 YYYY-MM-DD */
  today: string;
  /** 最近 7 天裡已簽到的日期（YYYY-MM-DD） */
  week: string[];
  /** 連續簽到天數 */
  streak: number;
  /** 每次簽到多幾張 */
  reward: number;
  /** 今天是否已簽到 */
  done?: boolean;
  /** 簽到；拋錯會顯示錯誤提示（Error.message 優先） */
  onCheckIn?: () => void | CheckinResult | Promise<void | CheckinResult>;
  /** 拿到獎勵後的回呼，例如重新讀取額度 */
  onClaimed?: (reward: number) => void;
  /** 成功後送出的 window 事件；設為 null 不送 */
  refreshEvent?: string | null;
  /** 強調色，預設跟隨主題的 primary */
  accent?: string;
  /** 提示固定在視窗上方；false 時放在卡片上方 */
  fixed?: boolean;
  /** 提示自動關閉毫秒數 */
  toastDuration?: number;
  /** 介面語言與星期格式：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: CheckinStreakLabels;
  className?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const Num = ({ children }: { children: ReactNode }) => <span className="font-medium text-[var(--yc-fg)] tabular-nums">{children}</span>;
const weekday = (fallback: string) => (date: Date, locale?: string) => date.toLocaleDateString(locale ?? fallback, { weekday: "short" });

const MESSAGES: Record<SunLocale, Required<CheckinStreakLabels>> = {
  en: {
    title: "Daily check-in",
    description: (reward, streak) => (
      <>
        Once a day, {reward} more images.
        {streak ? (
          <>
            {" "}
            <Num>{streak}</Num>-day streak.
          </>
        ) : null}
      </>
    ),
    weekAria: "Check-ins over the last 7 days",
    today: "Today",
    weekday: weekday("en-US"),
    dayAria: (label, done) => `${label}, ${done ? "checked in" : "not checked in"}`,
    checkIn: (reward) => <>Check in for {reward} images</>,
    done: "Checked in today, come back tomorrow",
    success: (reward) => `Checked in, ${reward} more images`,
    error: "Check-in failed. Please try again.",
    close: "Close",
  },
  "zh-TW": {
    title: "每日簽到",
    description: (reward, streak) => (
      <>
        每天一次，多 {reward} 張。
        {streak ? (
          <>
            已連續簽到 <Num>{streak}</Num> 天。
          </>
        ) : null}
      </>
    ),
    weekAria: "最近 7 天的簽到紀錄",
    today: "今天",
    weekday: weekday("zh-TW"),
    dayAria: (label, done) => `${label}，${done ? "已簽到" : "未簽到"}`,
    checkIn: (reward) => <>簽到領 {reward} 張</>,
    done: "今天已簽到，明天再來",
    success: (reward) => `簽到成功，多 ${reward} 張`,
    error: "簽到失敗，請再試一次。",
    close: "關閉",
  },
  "zh-CN": {
    title: "每日签到",
    description: (reward, streak) => (
      <>
        每天一次，多 {reward} 张。
        {streak ? (
          <>
            已连续签到 <Num>{streak}</Num> 天。
          </>
        ) : null}
      </>
    ),
    weekAria: "最近 7 天的签到记录",
    today: "今天",
    weekday: weekday("zh-CN"),
    dayAria: (label, done) => `${label}，${done ? "已签到" : "未签到"}`,
    checkIn: (reward) => <>签到领 {reward} 张</>,
    done: "今天已签到，明天再来",
    success: (reward) => `签到成功，多 ${reward} 张`,
    error: "签到失败，请重试。",
    close: "关闭",
  },
  ja: {
    title: "毎日チェックイン",
    description: (reward, streak) => (
      <>
        1 日 1 回、{reward} 枚追加。
        {streak ? (
          <>
            <Num>{streak}</Num> 日連続。
          </>
        ) : null}
      </>
    ),
    weekAria: "直近 7 日間のチェックイン",
    today: "今日",
    weekday: weekday("ja-JP"),
    dayAria: (label, done) => `${label}、${done ? "チェックイン済み" : "未チェックイン"}`,
    checkIn: (reward) => <>チェックインで {reward} 枚もらう</>,
    done: "今日はチェックイン済み。また明日",
    success: (reward) => `チェックイン完了、${reward} 枚追加`,
    error: "チェックインに失敗しました。もう一度お試しください。",
    close: "閉じる",
  },
};

// 原專案（Yumecanvas）的 zinc 色票，亮暗兩套
const tokens =
  "[--yc-card:#FFFFFF] [--yc-fg:#18181B] [--yc-muted:#F4F4F5] [--yc-muted-fg:#6B6B73] [--yc-border:#E4E4E7] [--yc-primary:#18181B] [--yc-primary-fg:#FAFAFA] [--yc-secondary:#F4F4F5] [--yc-ring:#71717A] [--yc-brand-default:var(--primary,#18181B)] [--yc-brand-fg:var(--primary-foreground,#FAFAFA)] [--yc-success:#15803D] [--yc-destructive:#DC2626] [--yc-popover:#FFFFFF] " +
  "dark:[--yc-card:#111113] dark:[--yc-fg:#FAFAFA] dark:[--yc-muted:#27272A] dark:[--yc-muted-fg:#A1A1AA] dark:[--yc-border:rgba(255,255,255,0.08)] dark:[--yc-primary:#FAFAFA] dark:[--yc-primary-fg:#18181B] dark:[--yc-secondary:#27272A] dark:[--yc-ring:#A1A1AA] dark:[--yc-brand-default:var(--primary,#FAFAFA)] dark:[--yc-brand-fg:var(--primary-foreground,#09090B)] dark:[--yc-success:#4ADE80] dark:[--yc-destructive:#F87171] dark:[--yc-popover:#18181B]";

const pad = (n: number) => String(n).padStart(2, "0");

/** 最近 7 天（含今天）的日期，格式和後端一樣是當地的 YYYY-MM-DD */
function lastWeek(today: string) {
  const [y, m, d] = today.split("-").map(Number);
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(y, m - 1, d - 6 + i);
    return { iso: `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`, date: dt };
  });
}

function Icon({ d, className }: { d: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn("shrink-0", className)}>
      {d}
    </svg>
  );
}

const CheckPath = <path d="M20 6 9 17l-5-5" />;
const GiftPath = (
  <>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M12 8v13" />
    <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
    <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
  </>
);
const CalendarCheckPath = (
  <>
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M3 10h18" />
    <path d="m9 16 2 2 4-4" />
  </>
);
const LoaderPath = <path d="M21 12a9 9 0 1 1-6.219-8.56" />;
const CircleCheckPath = (
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </>
);
const OctagonXPath = (
  <>
    <path d="m15 9-6 6" />
    <path d="M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z" />
    <path d="m9 9 6 6" />
  </>
);
const XPath = (
  <>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </>
);

type Toast = { id: number; kind: "success" | "error"; text: string };

export function CheckinStreak({
  today,
  week: weekProp,
  streak: streakProp,
  reward,
  done: doneProp = false,
  onCheckIn,
  onClaimed,
  refreshEvent = REWARDS_EVENT,
  accent,
  fixed = true,
  toastDuration = 4000,
  locale,
  labels,
  className,
}: CheckinStreakProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const reduce = useReducedMotion() ?? false;
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState({ week: weekProp, streak: streakProp, done: doneProp });
  const [toast, setToast] = useState<Toast | null>(null);
  const seq = useRef(0);

  // 外部資料更新（例如重新讀取）時跟著換
  useEffect(() => {
    setState({ week: weekProp, streak: streakProp, done: doneProp });
  }, [weekProp, streakProp, doneProp]);

  // 提示自動關閉，行為同 sonner 預設的 4 秒
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), toastDuration);
    return () => window.clearTimeout(id);
  }, [toast, toastDuration]);

  const days = lastWeek(today);
  const doneSet = new Set(state.week);

  const checkin = async () => {
    setBusy(true);
    try {
      const res = (await onCheckIn?.()) || {};
      const got = res.reward ?? reward;
      setToast({ id: ++seq.current, kind: "success", text: t.success(got) });
      setState((s) => ({
        done: true,
        week: s.week.includes(today) ? s.week : [...s.week, today],
        streak: res.streak ?? s.streak + 1,
      }));
      onClaimed?.(got);
      if (refreshEvent) window.dispatchEvent(new Event(refreshEvent));
    } catch (e) {
      setToast({ id: ++seq.current, kind: "error", text: e instanceof Error && e.message ? e.message : t.error });
    } finally {
      setBusy(false);
    }
  };

  const style = accent ? ({ "--yc-brand": accent } as CSSProperties) : undefined;

  return (
    <div
      style={style}
      className={cn(
        tokens,
        "[--yc-brand-c:var(--yc-brand,var(--yc-brand-default))]",
        "relative flex flex-col gap-4 rounded-[0.7rem] border border-[var(--yc-border)] bg-[var(--yc-card)] p-4 text-[var(--yc-fg)]",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[0.5rem] bg-[color-mix(in_oklab,var(--yc-brand-c)_15%,transparent)] text-[var(--yc-brand-c)]">
          <Icon d={CalendarCheckPath} className="size-[1.125rem]" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">{t.title}</h3>
          <p className="mt-0.5 text-xs text-[var(--yc-muted-fg)]">{t.description(reward, state.streak)}</p>
        </div>
      </div>

      <ol className="grid grid-cols-7 gap-1" aria-label={t.weekAria}>
        {days.map((d, i) => {
          const on = doneSet.has(d.iso);
          const isToday = i === 6;
          const label = isToday ? t.today : t.weekday(d.date, locale);
          return (
            <li key={d.iso} className="flex min-w-0 flex-col items-center gap-1">
              <span
                role="img"
                aria-label={t.dayAria(label, on)}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border text-[11px] tabular-nums sm:size-9",
                  on
                    ? "border-transparent bg-[var(--yc-brand-c)] text-[var(--yc-brand-fg)]"
                    : isToday
                      ? "border-[color-mix(in_oklab,var(--yc-fg)_40%,transparent)] text-[var(--yc-fg)]"
                      : "border-dashed border-[var(--yc-border)] text-[var(--yc-muted-fg)]",
                )}
              >
                {on ? <Icon d={CheckPath} className="size-4" /> : `+${reward}`}
              </span>
              <span className={cn("truncate text-[11px]", isToday ? "font-medium text-[var(--yc-fg)]" : "text-[var(--yc-muted-fg)]")}>{label}</span>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        onClick={checkin}
        disabled={state.done || busy}
        className={cn(
          "mt-auto inline-flex h-8 w-full shrink-0 items-center justify-center gap-1.5 rounded-[0.5rem] border border-transparent px-2.5 text-sm font-medium whitespace-nowrap transition-all outline-none select-none",
          "focus-visible:border-[var(--yc-ring)] focus-visible:ring-3 focus-visible:ring-[color-mix(in_oklab,var(--yc-ring)_50%,transparent)] active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
          state.done
            ? "bg-[var(--yc-secondary)] text-[var(--yc-fg)]"
            : "bg-[var(--yc-primary)] text-[var(--yc-primary-fg)] hover:bg-[color-mix(in_oklab,var(--yc-primary)_80%,transparent)]",
        )}
      >
        {busy ? (
          <Icon d={LoaderPath} className={cn("size-4", !reduce && "animate-spin")} />
        ) : state.done ? (
          <Icon d={CheckPath} className="size-4" />
        ) : (
          <Icon d={GiftPath} className="size-4" />
        )}
        {state.done ? t.done : t.checkIn(reward)}
      </button>

      <div
        aria-live="polite"
        className={cn("pointer-events-none z-50 flex justify-center", fixed ? "fixed inset-x-4 top-4" : "absolute inset-x-3 top-3")}
      >
        <AnimatePresence>
          {toast ? (
            <motion.div
              key={toast.id}
              role={toast.kind === "error" ? "alert" : "status"}
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -16 }}
              transition={{ duration: reduce ? 0 : 0.4, ease: [0.21, 1.02, 0.73, 1] }}
              className="pointer-events-auto relative flex w-full max-w-[356px] items-center gap-1.5 rounded-[0.5rem] border border-[var(--yc-border)] bg-[var(--yc-popover)] py-4 pr-4 pl-4 text-[13px] text-[var(--yc-fg)] shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
            >
              <Icon
                d={toast.kind === "success" ? CircleCheckPath : OctagonXPath}
                className={cn("size-4", toast.kind === "success" ? "text-[var(--yc-success)]" : "text-[var(--yc-destructive)]")}
              />
              <span className="min-w-0 flex-1">{toast.text}</span>
              <button
                type="button"
                onClick={() => setToast(null)}
                aria-label={t.close}
                className="absolute -top-2 -left-2 flex size-5 items-center justify-center rounded-full border border-[var(--yc-border)] bg-[var(--yc-popover)] text-[var(--yc-fg)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--yc-ring)]"
              >
                <Icon d={XPath} className="size-3" />
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
