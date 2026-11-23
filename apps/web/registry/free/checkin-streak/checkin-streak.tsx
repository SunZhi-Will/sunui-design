"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// Daily check-in card: the streak length is the hero, with one line below saying what checking in today will do;
// the last 7 days are linked as a chain, solid between consecutive days, a dashed segment when today is not checked in yet, joined up once it is.
// An optional milestone (e.g. a bonus every 7 days) gives the streak a goal. After a successful check-in it fires a window event so the quota meter reloads.

/** Default global event name; quota-meter listens to it too */
export const REWARDS_EVENT = "sunui:rewards";

export interface CheckinStreakLabels {
  /** Small heading above the card */
  title?: ReactNode;
  /** Reward description: extra credits per day */
  description?: (reward: number, streak: number) => ReactNode;
  /** Unit next to the big number, e.g. "day streak" */
  streakUnit?: (streak: number) => ReactNode;
  /** Not checked in today but checked in yesterday: which streak day checking in will reach */
  keepGoing?: (next: number) => ReactNode;
  /** When the streak is reset to zero */
  startToday?: ReactNode;
  /** Already checked in today */
  doneToday?: ReactNode;
  /** Days left until the milestone */
  milestoneLeft?: (left: number, every: number, bonus: number) => ReactNode;
  /** This check-in just earned the milestone bonus */
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
  /** Credits actually received; when omitted, reward is used (a milestone automatically adds bonus) */
  reward?: number;
  /** Streak length computed by the server; when omitted, it is incremented by one */
  streak?: number;
}

export interface CheckinMilestone {
  /** Every this many consecutive days, e.g. 7 */
  every: number;
  /** Extra credits given on that day */
  bonus: number;
}

export interface CheckinStreakProps {
  /** Today, local time, YYYY-MM-DD */
  today: string;
  /** Dates in the last 7 days that were checked in (YYYY-MM-DD) */
  week: string[];
  /** Consecutive check-in days */
  streak: number;
  /** Extra credits per check-in */
  reward: number;
  /** Bonus for a check-in streak milestone; when omitted, no progress bar is shown */
  milestone?: CheckinMilestone;
  /** Whether today is already checked in */
  done?: boolean;
  /** Check in; if it throws, an error toast is shown (Error.message takes priority) */
  onCheckIn?: () => void | CheckinResult | Promise<void | CheckinResult>;
  /** Callback after the reward is received, e.g. to reload the quota */
  onClaimed?: (reward: number) => void;
  /** Window event fired on success; set to null to not fire one */
  refreshEvent?: string | null;
  /** Accent color, follows the theme's primary by default */
  accent?: string;
  /** Pin the toast to the top of the window; when false it sits above the card */
  fixed?: boolean;
  /** Toast auto-dismiss time in milliseconds */
  toastDuration?: number;
  /** UI language and weekday format: en, zh-TW, zh-CN, ja; tags such as zh-Hant-HK and ja-JP are also accepted */
  locale?: string;
  /** Override the built-in strings; takes precedence over locale */
  labels?: CheckinStreakLabels;
  className?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Map any language tag to one of the four built-in languages; everything else uses English */
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

// Zinc palette from the original project (Yumecanvas), one set each for light and dark
const tokens =
  "[--yc-card:#FFFFFF] [--yc-fg:#18181B] [--yc-muted:#F4F4F5] [--yc-muted-fg:#6B6B73] [--yc-border:#E4E4E7] [--yc-primary:#18181B] [--yc-primary-fg:#FAFAFA] [--yc-secondary:#F4F4F5] [--yc-ring:#71717A] [--yc-brand-default:var(--sunui-spot,var(--primary,#18181B))] [--yc-brand-fg:var(--sunui-spot-foreground,var(--primary-foreground,#FAFAFA))] [--yc-success:#15803D] [--yc-destructive:#DC2626] [--yc-popover:#FFFFFF] " +
  "dark:[--yc-card:#111113] dark:[--yc-fg:#FAFAFA] dark:[--yc-muted:#27272A] dark:[--yc-muted-fg:#A1A1AA] dark:[--yc-border:rgba(255,255,255,0.08)] dark:[--yc-primary:#FAFAFA] dark:[--yc-primary-fg:#18181B] dark:[--yc-secondary:#27272A] dark:[--yc-ring:#A1A1AA] dark:[--yc-brand-default:var(--sunui-spot,var(--primary,#FAFAFA))] dark:[--yc-brand-fg:var(--sunui-spot-foreground,var(--primary-foreground,#09090B))] dark:[--yc-success:#4ADE80] dark:[--yc-destructive:#F87171] dark:[--yc-popover:#18181B]";

const ease = [0.23, 1, 0.32, 1] as const;

// Material (DESIGN.md section 7, foil): today's tile is a brand-colour foil coin, light from straight above, a diagonal sheen,
// fine brushed lines and a raised rim. Past days are a light brand tint so the coin is the one object that reads at rest
const coin: CSSProperties = {
  backgroundColor: "var(--yc-brand-c)",
  backgroundImage: [
    "linear-gradient(180deg, rgb(255 255 255 / 0.32), rgb(255 255 255 / 0) 48%, rgb(0 0 0 / 0.18))",
    "linear-gradient(115deg, transparent 34%, rgb(255 255 255 / 0.32) 47%, transparent 60%)",
    "repeating-linear-gradient(90deg, rgb(255 255 255 / 0.06) 0 1px, transparent 1px 3px)",
  ].join(", "),
  backgroundSize: "100% 100%, 260% 100%, auto",
  backgroundPosition: "0 0, 70% 0, 0 0",
};
const coinShadow =
  "shadow-[inset_0_1px_0_rgb(255_255_255/0.45),inset_0_-1px_0_rgb(0_0_0/0.2),inset_0_0_0_3px_rgb(255_255_255/0.14),0_1px_2px_rgb(0_0_0/0.14),0_6px_12px_-6px_rgb(0_0_0/0.35)]";
const pad = (n: number) => String(n).padStart(2, "0");

/** Dates of the last 7 days (including today), in the same local YYYY-MM-DD format as the backend */
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

  // Only follow external data when it really changed (e.g. a reload). Compare by date content so a new array from the parent on every render does not wash out the just-checked-in state
  const weekKey = weekProp.join(",");
  useEffect(() => {
    setState({ week: weekKey ? weekKey.split(",") : [], streak: streakProp, done: doneProp, hit: false });
  }, [weekKey, streakProp, doneProp]);

  // The toast dismisses itself, behaving like sonner's default 4 seconds
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), toastDuration);
    return () => window.clearTimeout(id);
  }, [toast, toastDuration]);

  const days = lastWeek(today);
  const doneSet = new Set(state.week);
  const { streak, done } = state;
  const every = milestone && milestone.every > 1 ? milestone.every : 0;
  // Number of lit cells on the progress bar: includes today when already checked in; the whole bar is lit when a round just completed
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
      {/* Hero: the streak length. When the number changes the old one retreats upward and the new one rises from below */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[11px] font-medium tracking-[0.14em] text-[var(--yc-muted-fg)] uppercase">{t.title}</h3>
          <p className="text-xs text-[var(--yc-muted-fg)]">{t.description(reward, streak)}</p>
        </div>
        <div className="mt-2 flex items-end gap-2">
          <span className="relative inline-flex h-12 overflow-hidden text-5xl leading-none font-semibold tracking-tight text-[var(--yc-brand-c)] tabular-nums">
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

      {/* Last 7 days: solid between consecutive days; a dashed segment when today is not checked in but yesterday was, turning solid once checked in */}
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
                style={isToday ? coin : undefined}
                className={cn(
                  "relative z-10 flex size-9 items-center justify-center rounded-full text-[11px] font-medium tabular-nums",
                  isToday
                    ? cn("font-semibold text-[var(--yc-brand-fg)]", coinShadow)
                    : on
                      ? "bg-[color-mix(in_oklab,var(--yc-brand-c)_16%,var(--yc-card))] text-[var(--yc-brand-c)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--yc-brand-c)_30%,transparent)]"
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

      {/* Milestone: each cell is one day, the last cell is the bonus */}
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
