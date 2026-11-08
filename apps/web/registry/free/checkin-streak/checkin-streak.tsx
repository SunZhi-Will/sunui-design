"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// 每日簽到卡：連續天數是主角，下面一句話說清楚「今天簽到會怎樣」；
// 最近 7 天用一條鏈串起來，連續的日子之間是實線，今天還沒簽時是一段虛線，簽了就接上。
// 可選的里程碑（例如每 7 天加碼）給連續簽到一個目標。簽到成功後送出 window 事件，讓額度表重新讀取。

/** 預設的全域事件名稱，quota-meter 也聽這個 */
export const REWARDS_EVENT = "sunui:rewards";

export interface CheckinStreakLabels {
  /** 卡片上方的小標 */
  title?: ReactNode;
  /** 獎勵說明：每天多幾張 */
  description?: (reward: number, streak: number) => ReactNode;
  /** 大數字旁的單位，例如「天連續簽到」 */
  streakUnit?: (streak: number) => ReactNode;
  /** 今天還沒簽、昨天有簽：簽了就接上第幾天 */
  keepGoing?: (next: number) => ReactNode;
  /** 連續天數歸零時 */
  startToday?: ReactNode;
  /** 今天已簽 */
  doneToday?: ReactNode;
  /** 離里程碑還有幾天 */
  milestoneLeft?: (left: number, every: number, bonus: number) => ReactNode;
  /** 這次簽到剛好拿到里程碑加碼 */
  milestoneHit?: (bonus: number) => ReactNode;
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
  /** 實際拿到的張數；不傳時用 reward（遇到里程碑會自動加上 bonus） */
  reward?: number;
  /** 伺服器算好的連續天數；不傳時自動加一 */
  streak?: number;
}

export interface CheckinMilestone {
  /** 每連續幾天一次，例如 7 */
  every: number;
  /** 那一天額外多給幾張 */
  bonus: number;
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
  /** 連續簽到的里程碑加碼；不傳就不顯示進度條 */
  milestone?: CheckinMilestone;
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

const B = ({ children }: { children: ReactNode }) => <span className="font-medium text-[var(--yc-fg)] tabular-nums">{children}</span>;
const weekday = (fallback: string) => (date: Date, locale?: string) => date.toLocaleDateString(locale ?? fallback, { weekday: "short" });

const MESSAGES: Record<SunLocale, Required<CheckinStreakLabels>> = {
  en: {
    title: "Daily check-in",
    description: (reward) => <>Once a day, {reward} more images.</>,
    streakUnit: () => "day streak",
    keepGoing: (next) => <>Check in today to make it <B>{next} days</B>.</>,
    startToday: "Check in today to start a streak.",
    doneToday: "Done for today. Come back tomorrow to keep it going.",
    milestoneLeft: (left, every, bonus) => <><B>{left}</B> more {left === 1 ? "day" : "days"} to day {every}: <B>+{bonus}</B> bonus.</>,
    milestoneHit: (bonus) => <>Day bonus unlocked: <B>+{bonus}</B> extra today.</>,
    weekAria: "Check-ins over the last 7 days",
    today: "Today",
    weekday: weekday("en-US"),
    dayAria: (label, done) => `${label}, ${done ? "checked in" : "not checked in"}`,
    checkIn: (reward) => <>Check in for {reward} images</>,
    done: "Checked in today",
    success: (reward) => `Checked in, ${reward} more images`,
    error: "Check-in failed. Please try again.",
    close: "Close",
  },
  "zh-TW": {
    title: "每日簽到",
    description: (reward) => <>每天一次，多 {reward} 張。</>,
    streakUnit: () => "天連續簽到",
    keepGoing: (next) => <>今天簽到，就能接上第 <B>{next}</B> 天。</>,
    startToday: "今天簽到，開始累積連續天數。",
    doneToday: "今天簽好了，明天回來繼續接上。",
    milestoneLeft: (left, every, bonus) => <>再 <B>{left}</B> 天到第 {every} 天，加碼 <B>+{bonus}</B> 張。</>,
    milestoneHit: (bonus) => <>連續簽到加碼入帳，今天多 <B>+{bonus}</B> 張。</>,
    weekAria: "最近 7 天的簽到紀錄",
    today: "今天",
    weekday: weekday("zh-TW"),
    dayAria: (label, done) => `${label}，${done ? "已簽到" : "未簽到"}`,
    checkIn: (reward) => <>簽到領 {reward} 張</>,
    done: "今天已簽到",
    success: (reward) => `簽到成功，多 ${reward} 張`,
    error: "簽到失敗，請再試一次。",
    close: "關閉",
  },
  "zh-CN": {
    title: "每日签到",
    description: (reward) => <>每天一次，多 {reward} 张。</>,
    streakUnit: () => "天连续签到",
    keepGoing: (next) => <>今天签到，就能接上第 <B>{next}</B> 天。</>,
    startToday: "今天签到，开始累积连续天数。",
    doneToday: "今天签好了，明天回来继续接上。",
    milestoneLeft: (left, every, bonus) => <>再 <B>{left}</B> 天到第 {every} 天，加码 <B>+{bonus}</B> 张。</>,
    milestoneHit: (bonus) => <>连续签到加码到账，今天多 <B>+{bonus}</B> 张。</>,
    weekAria: "最近 7 天的签到记录",
    today: "今天",
    weekday: weekday("zh-CN"),
    dayAria: (label, done) => `${label}，${done ? "已签到" : "未签到"}`,
    checkIn: (reward) => <>签到领 {reward} 张</>,
    done: "今天已签到",
    success: (reward) => `签到成功，多 ${reward} 张`,
    error: "签到失败，请重试。",
    close: "关闭",
  },
  ja: {
    title: "毎日チェックイン",
    description: (reward) => <>1 日 1 回、{reward} 枚追加。</>,
    streakUnit: () => "日連続",
    keepGoing: (next) => <>今日チェックインすると <B>{next}</B> 日連続になります。</>,
    startToday: "今日チェックインして連続記録をはじめましょう。",
    doneToday: "今日は完了です。明日もチェックインして記録をつなげましょう。",
    milestoneLeft: (left, every, bonus) => <>あと <B>{left}</B> 日で {every} 日目、<B>+{bonus}</B> 枚のボーナス。</>,
    milestoneHit: (bonus) => <>連続ボーナス獲得、今日は <B>+{bonus}</B> 枚追加。</>,
    weekAria: "直近 7 日間のチェックイン",
    today: "今日",
    weekday: weekday("ja-JP"),
    dayAria: (label, done) => `${label}、${done ? "チェックイン済み" : "未チェックイン"}`,
    checkIn: (reward) => <>チェックインで {reward} 枚もらう</>,
    done: "今日はチェックイン済み",
    success: (reward) => `チェックイン完了、${reward} 枚追加`,
    error: "チェックインに失敗しました。もう一度お試しください。",
    close: "閉じる",
  },
};

// 原專案（Yumecanvas）的 zinc 色票，亮暗兩套
const tokens =
  "[--yc-card:#FFFFFF] [--yc-fg:#18181B] [--yc-muted:#F4F4F5] [--yc-muted-fg:#6B6B73] [--yc-border:#E4E4E7] [--yc-primary:#18181B] [--yc-primary-fg:#FAFAFA] [--yc-secondary:#F4F4F5] [--yc-ring:#71717A] [--yc-brand-default:var(--primary,#18181B)] [--yc-brand-fg:var(--primary-foreground,#FAFAFA)] [--yc-success:#15803D] [--yc-destructive:#DC2626] [--yc-popover:#FFFFFF] " +
  "dark:[--yc-card:#111113] dark:[--yc-fg:#FAFAFA] dark:[--yc-muted:#27272A] dark:[--yc-muted-fg:#A1A1AA] dark:[--yc-border:rgba(255,255,255,0.08)] dark:[--yc-primary:#FAFAFA] dark:[--yc-primary-fg:#18181B] dark:[--yc-secondary:#27272A] dark:[--yc-ring:#A1A1AA] dark:[--yc-brand-default:var(--primary,#FAFAFA)] dark:[--yc-brand-fg:var(--primary-foreground,#09090B)] dark:[--yc-success:#4ADE80] dark:[--yc-destructive:#F87171] dark:[--yc-popover:#18181B]";

const ease = [0.23, 1, 0.32, 1] as const;
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn("shrink-0", className)}>
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
  milestone,
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
  const [state, setState] = useState({ week: weekProp, streak: streakProp, done: doneProp, hit: false });
  const [toast, setToast] = useState<Toast | null>(null);
  const seq = useRef(0);

  // 外部資料真的變了（例如重新讀取）才跟著換。用日期內容比對，父層每次 render 傳新陣列時不會把剛簽到的狀態洗掉
  const weekKey = weekProp.join(",");
  useEffect(() => {
    setState({ week: weekKey ? weekKey.split(",") : [], streak: streakProp, done: doneProp, hit: false });
  }, [weekKey, streakProp, doneProp]);

  // 提示自動關閉，行為同 sonner 預設的 4 秒
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), toastDuration);
    return () => window.clearTimeout(id);
  }, [toast, toastDuration]);

  const days = lastWeek(today);
  const doneSet = new Set(state.week);
  const { streak, done } = state;
  const every = milestone && milestone.every > 1 ? milestone.every : 0;
  // 進度條上已亮的格數：今天已簽時含今天；剛好走完一輪時整條亮著
  const filled = every ? (streak % every === 0 && streak > 0 && done ? every : streak % every) : 0;
  const left = every ? every - (streak % every) : 0;

  const checkin = async () => {
    setBusy(true);
    try {
      const res = (await onCheckIn?.()) || {};
      const next = res.streak ?? streak + 1;
      const hit = !!every && next % every === 0;
      const got = res.reward ?? reward + (hit && milestone ? milestone.bonus : 0);
      setToast({ id: ++seq.current, kind: "success", text: t.success(got) });
      setState((s) => ({ done: true, week: s.week.includes(today) ? s.week : [...s.week, today], streak: next, hit }));
      onClaimed?.(got);
      if (refreshEvent) window.dispatchEvent(new Event(refreshEvent));
    } catch (e) {
      setToast({ id: ++seq.current, kind: "error", text: e instanceof Error && e.message ? e.message : t.error });
    } finally {
      setBusy(false);
    }
  };

  const style = accent ? ({ "--yc-brand": accent } as CSSProperties) : undefined;
  const line = done ? t.doneToday : streak > 0 && doneSet.has(days[5].iso) ? t.keepGoing(streak + 1) : t.startToday;
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 520, damping: 34 };
  const fade = reduce ? { duration: 0 } : { duration: 0.24, ease };

  return (
    <div
      style={style}
      className={cn(
        tokens,
        "[--yc-brand-c:var(--yc-brand,var(--yc-brand-default))]",
        "relative flex flex-col gap-5 rounded-xl border border-[var(--yc-border)] bg-[var(--yc-card)] p-5 text-[var(--yc-fg)]",
        className,
      )}
    >
      {/* 主角：連續天數。數字換的時候舊的往上退、新的從下面上來 */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[11px] font-medium tracking-[0.14em] text-[var(--yc-muted-fg)] uppercase">{t.title}</h3>
          <p className="text-xs text-[var(--yc-muted-fg)]">{t.description(reward, streak)}</p>
        </div>
        <div className="mt-2 flex items-end gap-2">
          <span className="relative inline-flex h-12 overflow-hidden text-5xl leading-none font-semibold tracking-tight tabular-nums">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={streak} initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "-100%", opacity: 0 }} transition={fade}>
                {streak}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="pb-1 text-sm font-medium">{t.streakUnit(streak)}</span>
        </div>
        <p className="mt-1.5 min-h-5 text-sm text-[var(--yc-muted-fg)]">{line}</p>
      </div>

      {/* 最近 7 天：連續的日子之間畫實線；今天還沒簽、昨天有簽時畫一段虛線，簽了就變實線 */}
      <ol className="grid grid-cols-7" aria-label={t.weekAria}>
        {days.map((d, i) => {
          const on = doneSet.has(d.iso);
          const isToday = i === 6;
          const prevOn = i > 0 && doneSet.has(days[i - 1].iso);
          const label = isToday ? t.today : t.weekday(d.date, locale);
          return (
            <li key={d.iso} className="relative flex min-w-0 flex-col items-center gap-1.5">
              {i > 0 && prevOn && (on || isToday) && (
                <span aria-hidden className="absolute top-[17px] right-1/2 h-0.5 w-full">
                  <span className="absolute inset-0 border-t-2 border-dashed border-[color-mix(in_oklab,var(--yc-brand-c)_45%,transparent)]" />
                  <motion.span
                    className="absolute inset-0 origin-left bg-[var(--yc-brand-c)]"
                    initial={false}
                    animate={{ scaleX: on ? 1 : 0 }}
                    transition={reduce ? { duration: 0 } : { duration: 0.24, ease }}
                  />
                </span>
              )}
              <motion.span
                role="img"
                aria-label={t.dayAria(label, on)}
                initial={false}
                animate={{ scale: isToday && on && !reduce ? [0.86, 1] : 1 }}
                transition={spring}
                className={cn(
                  "relative z-10 flex size-9 items-center justify-center rounded-full text-[11px] font-medium tabular-nums",
                  on
                    ? "bg-[var(--yc-brand-c)] text-[var(--yc-brand-fg)]"
                    : isToday
                      ? "bg-[var(--yc-card)] text-[var(--yc-brand-c)] shadow-[inset_0_0_0_1.5px_var(--yc-brand-c)]"
                      : "bg-[var(--yc-card)] shadow-[inset_0_0_0_1px_var(--yc-border)]",
                )}
              >
                {on ? <Icon d={CheckPath} className="size-4" /> : isToday ? `+${reward}` : <span aria-hidden className="h-px w-2.5 bg-[var(--yc-muted-fg)] opacity-50" />}
              </motion.span>
              <span className={cn("truncate text-[11px]", isToday ? "font-medium text-[var(--yc-fg)]" : "text-[var(--yc-muted-fg)]")}>{label}</span>
            </li>
          );
        })}
      </ol>

      {/* 里程碑：每一格是一天，最後一格是加碼 */}
      {every > 0 && milestone && (
        <div className="space-y-2 rounded-lg bg-[var(--yc-muted)] p-3">
          <div className="flex items-center gap-1" aria-hidden>
            {Array.from({ length: every }, (_, i) => (
              <span key={i} className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--yc-fg)_10%,transparent)]">
                <motion.span className="absolute inset-0 origin-left bg-[var(--yc-brand-c)]" initial={false} animate={{ scaleX: i < filled ? 1 : 0 }} transition={reduce ? { duration: 0 } : { duration: 0.24, ease, delay: 0.12 }} />
              </span>
            ))}
            <span className="ml-1 flex items-center gap-1 text-xs font-medium text-[var(--yc-fg)] tabular-nums">
              <Icon d={GiftPath} className="size-3.5" />+{milestone.bonus}
            </span>
          </div>
          <p className="text-xs text-[var(--yc-muted-fg)]">{done && state.hit ? t.milestoneHit(milestone.bonus) : t.milestoneLeft(left, every, milestone.bonus)}</p>
        </div>
      )}

      <button
        type="button"
        onClick={checkin}
        disabled={done || busy}
        aria-busy={busy}
        className={cn(
          "mt-auto inline-flex h-10 w-full shrink-0 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors outline-none select-none",
          "focus-visible:ring-3 focus-visible:ring-[color-mix(in_oklab,var(--yc-ring)_50%,transparent)] active:translate-y-px",
          done
            ? "cursor-default bg-[var(--yc-secondary)] text-[var(--yc-muted-fg)]"
            : "bg-[var(--yc-primary)] text-[var(--yc-primary-fg)] hover:bg-[color-mix(in_oklab,var(--yc-primary)_85%,transparent)] disabled:opacity-70",
        )}
      >
        {busy ? <Icon d={LoaderPath} className={cn("size-4", !reduce && "animate-spin")} /> : done ? <Icon d={CheckPath} className="size-4" /> : <Icon d={GiftPath} className="size-4" />}
        {done ? t.done : t.checkIn(reward)}
      </button>

      <div aria-live="polite" className={cn("pointer-events-none z-50 flex justify-center", fixed ? "fixed inset-x-4 top-4" : "absolute inset-x-3 top-3")}>
        <AnimatePresence>
          {toast ? (
            <motion.div
              key={toast.id}
              role={toast.kind === "error" ? "alert" : "status"}
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -16 }}
              transition={{ duration: reduce ? 0 : 0.36, ease }}
              className="pointer-events-auto relative flex w-full max-w-[356px] items-center gap-1.5 rounded-lg border border-[var(--yc-border)] bg-[var(--yc-popover)] p-4 text-[13px] text-[var(--yc-fg)] shadow-sm"
            >
              <Icon d={toast.kind === "success" ? CircleCheckPath : OctagonXPath} className={cn("size-4", toast.kind === "success" ? "text-[var(--yc-success)]" : "text-[var(--yc-destructive)]")} />
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
