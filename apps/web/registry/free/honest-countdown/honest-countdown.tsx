"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface HonestCountdownLabels {
  days?: ReactNode;
  hours?: ReactNode;
  minutes?: ReactNode;
  seconds?: ReactNode;
  endedStamp?: ReactNode;
  endsAt?: (date: string) => ReactNode;
  endedAt?: (date: string) => ReactNode;
  endedAnnouncement?: string;
}

export interface HonestCountdownProps {
  /** 結束時間 */
  target: Date | string | number;
  /** 倒數上方的標題，例如「Sale ends in」 */
  label?: ReactNode;
  /** 結束後取代倒數的文字 */
  endedLabel?: ReactNode;
  onEnd?: () => void;
  /** 剩餘時間低於這個值（毫秒）才顯示秒數，預設 1 小時 */
  showSecondsUnder?: number;
  locale?: string;
  timeZone?: string;
  labels?: HonestCountdownLabels;
  className?: string;
}

const defaultLabels: Required<HonestCountdownLabels> = {
  days: "days",
  hours: "hrs",
  minutes: "min",
  seconds: "sec",
  endedStamp: "Ended",
  endsAt: (date) => <>Ends {date}</>,
  endedAt: (date) => <>Ended {date}</>,
  endedAnnouncement: "The countdown has ended.",
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

const HOUR = 3_600_000;
const DAY = 86_400_000;

const pad = (n: number) => String(n).padStart(2, "0");

export function HonestCountdown({
  target,
  label,
  endedLabel,
  onEnd,
  showSecondsUnder = HOUR,
  locale = "en-US",
  timeZone,
  labels,
  className,
}: HonestCountdownProps) {
  const t = { ...defaultLabels, ...labels };
  const reduce = useReducedMotion();
  const end = new Date(target).getTime();

  // 「現在」只在瀏覽器取得；伺服器端只輸出絕對日期
  const [now, setNow] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const firstNow = useRef<number | null>(null);
  const ticked = useRef(false);
  const ended = useRef(false);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const tick = () => setNow(Date.now());
    const start = () => {
      tick();
      if (!timer) timer = setInterval(tick, 1000);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    // 分頁隱藏時不跑計時器，回來時重新計算
    const onVisibility = () => (document.hidden ? stop() : start());
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  if (now !== null && firstNow.current === null) firstNow.current = now;
  const remaining = now === null ? null : Math.max(0, end - now);
  const isEnded = remaining === 0;
  const endedOnLoad = firstNow.current !== null && firstNow.current >= end;

  useEffect(() => {
    if (!isEnded || ended.current) return;
    ended.current = true;
    if (!endedOnLoad) setAnnouncement(t.endedAnnouncement);
    onEndRef.current?.();
  }, [isEnded, endedOnLoad, t.endedAnnouncement]);

  useEffect(() => {
    if (now !== null) ticked.current = true;
  }, [now]);

  const absolute = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
    timeZoneName: "short",
  }).format(end);

  const units: { key: string; value: number; label: ReactNode }[] = [];
  if (remaining !== null && !isEnded) {
    const d = Math.floor(remaining / DAY);
    const h = Math.floor((remaining % DAY) / HOUR);
    const m = Math.floor((remaining % HOUR) / 60_000);
    const s = Math.floor((remaining % 60_000) / 1000);
    if (d > 0) units.push({ key: "d", value: d, label: t.days });
    if (d > 0 || h > 0) units.push({ key: "h", value: h, label: t.hours });
    units.push({ key: "m", value: m, label: t.minutes });
    // 一天以上不顯示秒數，避免製造焦慮
    if (d === 0 && remaining < showSecondsUnder) units.push({ key: "s", value: s, label: t.seconds });
  }
  const finalHour = remaining !== null && remaining > 0 && remaining < HOUR;
  const spoken = units.map((u) => `${u.value} ${typeof u.label === "string" ? u.label : u.key}`).join(" ");

  return (
    <div className={cn("relative w-full max-w-sm rounded-md border p-4 font-sans", paper, edge, ink, className)}>
      {label && <p className={cn("text-[11px] font-medium tracking-[0.14em] uppercase", inkMuted)}>{label}</p>}

      <div className="mt-2 flex min-h-[3.75rem] items-center">
        {isEnded ? (
          <p className={cn("text-base font-medium", inkMuted)}>{endedLabel ?? t.endedAt(absolute)}</p>
        ) : (
          units.length > 0 && (
            <div role="timer" aria-label={spoken} className="flex gap-2">
              {units.map((u) => (
                <div
                  key={u.key}
                  aria-hidden="true"
                  className={cn("flex min-w-[3.25rem] flex-col items-center rounded-md border px-2 py-1.5", edge)}
                >
                  <span className="relative h-7 overflow-hidden">
                    <motion.span
                      key={u.value}
                      className={cn(
                        "block font-mono text-2xl leading-7 font-semibold tracking-tight tabular-nums",
                        finalHour && vermilion,
                      )}
                      initial={reduce || !ticked.current ? false : { y: -6, opacity: 0.4 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={springs.snappy}
                    >
                      {u.key === "d" ? u.value : pad(u.value)}
                    </motion.span>
                  </span>
                  <span className={cn("text-[10px] tracking-[0.14em] uppercase", inkMuted)}>{u.label}</span>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* 絕對日期永遠保留，倒數不取代真實資訊 */}
      <p className={cn("mt-2 text-xs tabular-nums", inkMuted)}>
        <time dateTime={new Date(end).toISOString()} suppressHydrationWarning>
          {isEnded ? absolute : t.endsAt(absolute)}
        </time>
      </p>

      <AnimatePresence initial={false}>
        {isEnded && (
          <motion.span
            key="stamp"
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute top-3 right-4 rounded-[3px] border-2 border-current px-2 py-0.5 text-xs font-bold tracking-[0.2em] whitespace-nowrap uppercase mix-blend-multiply dark:mix-blend-screen",
              inkMuted,
            )}
            initial={reduce || endedOnLoad ? false : { scale: 1.6, opacity: 0, rotate: -4 }}
            animate={{ scale: 1, opacity: 0.7, rotate: -10 }}
            transition={springs.stamp}
          >
            {t.endedStamp}
          </motion.span>
        )}
      </AnimatePresence>

      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}
