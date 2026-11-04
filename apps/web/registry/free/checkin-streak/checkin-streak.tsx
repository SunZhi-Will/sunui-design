"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type CheckinDayStatus = "done" | "missed" | "today" | "todayDone" | "upcoming";

export interface CheckinDay {
  label: ReactNode;
  reward: number;
}

export interface CheckinStreakLabels {
  title?: ReactNode;
  streak?: (days: number) => ReactNode;
  points?: (points: string) => ReactNode;
  checkIn?: (reward: number) => ReactNode;
  checking?: ReactNode;
  retry?: ReactNode;
  error?: ReactNode;
  comeBack?: (reward: number | null) => ReactNode;
  announce?: (reward: number) => string;
}

export interface CheckinStreakProps {
  /** 一週七天，依序排列 */
  days: CheckinDay[];
  /** 今天在 days 中的位置 */
  todayIndex: number;
  /** 今天以前已簽到的位置；不在其中的視為漏簽 */
  checked?: number[];
  checkedInToday?: boolean;
  defaultCheckedInToday?: boolean;
  /** 連續天數；不傳時由本週資料推算 */
  streak?: number;
  points?: number;
  /** 簽到；拋錯顯示重試，回傳 reward 覆寫當天獎勵 */
  onCheckIn?: () => void | { reward?: number } | Promise<void | { reward?: number }>;
  locale?: string;
  labels?: CheckinStreakLabels;
  className?: string;
}

const defaultLabels: Required<CheckinStreakLabels> = {
  title: "Daily check-in",
  streak: (days) => <>{days}-day streak</>,
  points: (points) => <>{points} pts</>,
  checkIn: (reward) => <>Check in, +{reward} pts</>,
  checking: "Checking in",
  retry: "Try again",
  error: "Couldn't check in. Try again.",
  comeBack: (reward) => (reward === null ? "See you next week" : <>Come back tomorrow for +{reward}</>),
  announce: (reward) => `Checked in. +${reward} points.`,
};

// 設計語言（DESIGN.md）：紙、紙邊、墨、朱紅
const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const inkMuted = "text-[#1c1917]/60 dark:text-[#ece7dc]/60";
const vermilion = "text-[#c8361d] dark:text-[#ec6a4f]";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  stamp: { type: "spring", stiffness: 620, damping: 20, mass: 0.8 },
} as const;

export function CheckinStreak({
  days,
  todayIndex,
  checked = [],
  checkedInToday: checkedProp,
  defaultCheckedInToday = false,
  streak: streakProp,
  points = 0,
  onCheckIn,
  locale = "en-US",
  labels,
  className,
}: CheckinStreakProps) {
  const t = { ...defaultLabels, ...labels };
  const reduceMotion = useReducedMotion();
  const [inner, setInner] = useState(defaultCheckedInToday);
  const done = checkedProp ?? inner;
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [earned, setEarned] = useState(0);
  const [stamped, setStamped] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const doneSet = new Set(checked);
  const statusOf = (i: number): CheckinDayStatus =>
    i < todayIndex ? (doneSet.has(i) ? "done" : "missed") : i === todayIndex ? (done ? "todayDone" : "today") : "upcoming";

  // 從昨天往回數連續簽到天數
  let computed = done ? 1 : 0;
  for (let i = todayIndex - 1; i >= 0 && doneSet.has(i); i--) computed++;
  const streak = streakProp !== undefined ? streakProp + (earned ? 1 : 0) : computed;

  const todayReward = days[todayIndex]?.reward ?? 0;
  const nextReward = days[todayIndex + 1]?.reward ?? null;

  async function checkIn() {
    if (done || pending) return;
    setPending(true);
    setFailed(false);
    try {
      const result = await onCheckIn?.();
      const reward = (result && typeof result === "object" && result.reward) || todayReward;
      setEarned(reward);
      setStamped(true);
      setInner(true);
      setAnnouncement(t.announce(reward));
    } catch {
      setFailed(true);
      setAnnouncement(typeof t.error === "string" ? t.error : "Couldn't check in.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className={cn("w-full max-w-md min-w-0 rounded-md border p-4 sm:p-5", paper, edge, ink, className)}>
      <header className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className={cn("text-[11px] font-medium tracking-[0.14em] uppercase", inkMuted)}>{t.title}</p>
          <p className="mt-1 text-xl font-semibold tracking-tight tabular-nums">{t.streak(streak)}</p>
        </div>
        <p className={cn("shrink-0 text-sm tabular-nums", inkMuted)}>
          {t.points(new Intl.NumberFormat(locale).format(points + earned))}
        </p>
      </header>

      <ol className="mt-4 grid grid-cols-7 gap-1 sm:gap-2">
        {days.map((day, i) => {
          const status = statusOf(i);
          return (
            <li key={i} className="flex min-w-0 flex-col items-center gap-1.5">
              <span className={cn("text-[11px] tabular-nums", status === "today" || status === "todayDone" ? "font-semibold" : inkMuted)}>
                {day.label}
              </span>
              <span
                className={cn(
                  "relative flex aspect-square w-full max-w-10 items-center justify-center rounded-full text-[11px] font-medium tabular-nums",
                  status === "done" && "bg-[#1c1917] text-[#faf7f0] dark:bg-[#ece7dc] dark:text-[#1f1c18]",
                  status === "today" && "border-2 border-current",
                  status === "missed" && cn("border border-dashed border-current", inkMuted, "opacity-60"),
                  status === "upcoming" && cn("border", edge, inkMuted),
                )}
                role="img"
                aria-label={`${typeof day.label === "string" ? day.label : `Day ${i + 1}`}: ${status === "todayDone" ? "checked in" : status === "done" ? "checked in" : status === "missed" ? "missed" : `+${day.reward}`}`}
              >
                {status === "done" && <CheckIcon />}
                {(status === "today" || status === "upcoming") && <span aria-hidden="true">+{day.reward}</span>}
                {status === "missed" && <span aria-hidden="true">&times;</span>}
                {status === "todayDone" && (
                  <motion.span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-0 flex items-center justify-center rounded-full border-2 border-current mix-blend-multiply dark:mix-blend-screen",
                      vermilion,
                    )}
                    initial={reduceMotion || !stamped ? false : { scale: 1.6, opacity: 0, rotate: 8 }}
                    animate={{ scale: 1, opacity: 0.9, rotate: -10 }}
                    transition={springs.stamp}
                  >
                    <CheckIcon />
                  </motion.span>
                )}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-4">
        {done ? (
          <p className={cn("text-center text-sm", inkMuted)}>{t.comeBack(nextReward)}</p>
        ) : (
          <>
            <motion.button
              type="button"
              onClick={checkIn}
              aria-disabled={pending}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              transition={springs.snappy}
              className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none aria-disabled:cursor-progress aria-disabled:opacity-70"
            >
              {pending ? t.checking : failed ? t.retry : t.checkIn(todayReward)}
            </motion.button>
            {failed && <p className="mt-2 text-center text-xs text-destructive">{t.error}</p>}
          </>
        )}
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="m3.5 8.5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
