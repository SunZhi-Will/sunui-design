"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface ReservationTimerLabels {
  title?: ReactNode;
  heldFor?: ReactNode;
  releasedStamp?: ReactNode;
  released?: ReactNode;
  holdAgain?: ReactNode;
  renewing?: ReactNode;
  warnAnnouncement?: (minutes: number, seconds: number) => string;
  expiredAnnouncement?: string;
}

export interface ReservationTimerProps {
  /** 保留到期時間 */
  expiresAt: Date | string | number;
  /** 整段保留的秒數，用來畫剩餘比例 */
  holdSeconds?: number;
  /** 剩餘秒數低於這個值時轉為警示 */
  warnAt?: number;
  onExpire?: () => void;
  /** 提供時，到期後顯示「再保留一次」；父層負責換新的 expiresAt */
  onRenew?: () => void | Promise<void>;
  title?: ReactNode;
  /** 保留中的商品摘要 */
  children?: ReactNode;
  labels?: ReservationTimerLabels;
  className?: string;
}

const defaultLabels: Required<ReservationTimerLabels> = {
  title: "Held for you",
  heldFor: "Complete checkout before the hold ends",
  releasedStamp: "Released",
  released: "This hold has ended and the item is back on sale.",
  holdAgain: "Hold again",
  renewing: "Holding",
  warnAnnouncement: (m, s) => `${m} minute${m === 1 ? "" : "s"} ${s} seconds left on your hold.`,
  expiredAnnouncement: "Your hold has ended.",
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

const pad = (n: number) => String(n).padStart(2, "0");

export function ReservationTimer({
  expiresAt,
  holdSeconds = 600,
  warnAt = 60,
  onExpire,
  onRenew,
  title,
  children,
  labels,
  className,
}: ReservationTimerProps) {
  const t = { ...defaultLabels, ...labels };
  const reduce = useReducedMotion() ?? false;
  const target = new Date(expiresAt).getTime();

  // 掛載前不知道「現在」，先顯示佔位，避免 SSR 與 client 不一致
  const [now, setNow] = useState<number | null>(null);
  const [renewing, setRenewing] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const expiredFor = useRef<number | null>(null);
  const warnedFor = useRef<number | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    // 分頁回到前景時立刻對時；倒數照真實時間走，不暫停
    const onVisible = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [target]);

  const remaining = now === null ? null : Math.max(0, Math.ceil((target - now) / 1000));
  const expired = remaining === 0;
  const warning = remaining !== null && !expired && remaining <= warnAt;

  // 只在跨過警示線與到期時朗讀，不每秒播報
  useEffect(() => {
    if (remaining === null) return;
    if (expired && expiredFor.current !== target) {
      expiredFor.current = target;
      setAnnouncement(t.expiredAnnouncement);
      onExpireRef.current?.();
    } else if (warning && warnedFor.current !== target) {
      warnedFor.current = target;
      setAnnouncement(t.warnAnnouncement(Math.floor(remaining / 60), remaining % 60));
    }
  }, [remaining, expired, warning, target, t]);

  const fraction = remaining === null ? 1 : Math.min(1, remaining / holdSeconds);
  const clock = remaining === null ? "--:--" : `${pad(Math.floor(remaining / 60))}:${pad(remaining % 60)}`;

  async function renew() {
    if (!onRenew || renewing) return;
    setRenewing(true);
    try {
      await onRenew();
    } finally {
      setRenewing(false);
    }
  }

  return (
    <div className={cn("relative w-full max-w-sm rounded-md border p-4 font-sans", paper, edge, ink, className)}>
      <div className={cn("transition-opacity", expired && "opacity-45")}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className={cn("text-[11px] font-medium tracking-[0.14em] uppercase", inkMuted)}>{title ?? t.title}</p>
            <p className={cn("mt-1 text-xs", inkMuted)}>{expired ? t.released : t.heldFor}</p>
          </div>
          <span
            className={cn(
              "shrink-0 font-mono text-2xl leading-none font-semibold tracking-[0.12em] tabular-nums transition-colors",
              warning && vermilion,
              // 到期後由印章佔據這個位置
              expired && "invisible",
            )}
          >
            <span className="sr-only">{remaining === null ? "" : `${Math.floor(remaining / 60)}:${pad(remaining % 60)} left`}</span>
            <span aria-hidden="true">{clock}</span>
          </span>
        </div>

        <div aria-hidden="true" className="mt-3 h-px w-full bg-[#e7e0d0] dark:bg-[#38332b]">
          <div
            className="h-px origin-left bg-current transition-transform duration-1000 ease-linear motion-reduce:transition-none"
            style={{ transform: `scaleX(${fraction})` }}
          />
        </div>

        {children && <div className={cn("mt-3 border-t border-dashed pt-3 text-sm", edge)}>{children}</div>}
      </div>

      <AnimatePresence initial={false}>
        {expired && (
          <motion.span
            key="stamp"
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute top-3 right-4 rounded-[3px] border-2 border-current px-2 py-0.5 text-xs font-bold tracking-[0.2em] whitespace-nowrap uppercase mix-blend-multiply dark:mix-blend-screen",
              inkMuted,
            )}
            initial={reduce ? false : { scale: 1.6, opacity: 0, rotate: -4 }}
            animate={{ scale: 1, opacity: 0.7, rotate: -10 }}
            exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0 }}
            transition={springs.stamp}
          >
            {t.releasedStamp}
          </motion.span>
        )}
      </AnimatePresence>

      {expired && onRenew && (
        <motion.button
          type="button"
          onClick={renew}
          aria-disabled={renewing}
          whileTap={reduce ? undefined : { scale: 0.96 }}
          transition={springs.snappy}
          className="mt-3 w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none aria-disabled:cursor-progress aria-disabled:opacity-70"
        >
          {renewing ? t.renewing : t.holdAgain}
        </motion.button>
      )}

      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}
