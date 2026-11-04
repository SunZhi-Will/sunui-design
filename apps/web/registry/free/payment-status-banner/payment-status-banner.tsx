"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type PaymentStatus = "pending" | "paid" | "failed" | "timeout";
export type PaymentCheckResult = "paid" | "pending" | "failed";

export interface PaymentStatusBannerLabels {
  pendingTitle?: ReactNode;
  pendingBody?: ReactNode;
  paidTitle?: ReactNode;
  paidStamp?: ReactNode;
  failedTitle?: ReactNode;
  failedBody?: ReactNode;
  timeoutTitle?: ReactNode;
  timeoutBody?: (email?: string) => ReactNode;
  checkAgain?: ReactNode;
  retry?: ReactNode;
  order?: ReactNode;
  amount?: ReactNode;
  announce?: (status: PaymentStatus) => string;
}

export interface PaymentStatusBannerProps {
  status?: PaymentStatus;
  defaultStatus?: PaymentStatus;
  onStatusChange?: (status: PaymentStatus) => void;
  /** pending 時輪詢付款結果 */
  check?: () => Promise<PaymentCheckResult>;
  interval?: number;
  maxAttempts?: number;
  orderId?: string;
  amount?: number;
  currency?: string;
  locale?: string;
  email?: string;
  /** failed 時顯示的原因 */
  reason?: ReactNode;
  successAction?: { label: ReactNode; href: string };
  onRetry?: () => void;
  labels?: PaymentStatusBannerLabels;
  className?: string;
}

const defaultLabels: Required<PaymentStatusBannerLabels> = {
  pendingTitle: "Confirming your payment",
  pendingBody: "Your bank confirmed the charge; we're waiting for the payment provider. This usually takes a few seconds.",
  paidTitle: "Payment received",
  paidStamp: "Paid",
  failedTitle: "Payment didn't go through",
  failedBody: "You haven't been charged. Try again or use another payment method.",
  timeoutTitle: "Still confirming",
  timeoutBody: (email) => (
    <>You don't need to pay again. We'll email you{email ? <> at <span className="font-medium">{email}</span></> : null} as soon as it's confirmed.</>
  ),
  checkAgain: "Check again",
  retry: "Try again",
  order: "Order",
  amount: "Amount",
  announce: (s) =>
    s === "paid" ? "Payment received." : s === "failed" ? "Payment failed." : s === "timeout" ? "Payment is still confirming." : "Confirming payment.",
};

// 設計語言（DESIGN.md）：紙、紙邊、墨、朱紅
const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const inkMuted = "text-[#1c1917]/60 dark:text-[#ece7dc]/60";
const vermilion = "text-[#c8361d] dark:text-[#ec6a4f]";

const springs = {
  gentle: { type: "spring", stiffness: 240, damping: 30 },
  stamp: { type: "spring", stiffness: 620, damping: 20, mass: 0.8 },
} as const;

const buttonClass =
  "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none";

export function PaymentStatusBanner({
  status: statusProp,
  defaultStatus = "pending",
  onStatusChange,
  check,
  interval = 3000,
  maxAttempts = 8,
  orderId,
  amount,
  currency = "USD",
  locale = "en-US",
  email,
  reason,
  successAction,
  onRetry,
  labels,
  className,
}: PaymentStatusBannerProps) {
  const t = { ...defaultLabels, ...labels };
  const reduceMotion = useReducedMotion();
  const [inner, setInner] = useState<PaymentStatus>(defaultStatus);
  const status = statusProp ?? inner;
  const [round, setRound] = useState(0);
  const [announcement, setAnnouncement] = useState("");

  const latest = useRef({ check, onStatusChange, announce: t.announce, controlled: statusProp !== undefined });
  latest.current = { check, onStatusChange, announce: t.announce, controlled: statusProp !== undefined };

  const setStatus = (next: PaymentStatus) => {
    if (!latest.current.controlled) setInner(next);
    latest.current.onStatusChange?.(next);
    setAnnouncement(latest.current.announce(next));
  };
  const setStatusRef = useRef(setStatus);
  setStatusRef.current = setStatus;

  // 輪詢：分頁隱藏時暫停，回到前景再繼續；卸載時停止
  useEffect(() => {
    if (status !== "pending" || !latest.current.check) return;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const schedule = () => {
      if (cancelled || document.hidden) return;
      timer = setTimeout(tick, interval);
    };
    const tick = async () => {
      timer = null;
      if (cancelled) return;
      attempts += 1;
      let result: PaymentCheckResult = "pending";
      try {
        result = (await latest.current.check?.()) ?? "pending";
      } catch {
        result = "pending";
      }
      if (cancelled) return;
      if (result !== "pending") return setStatusRef.current(result);
      if (attempts >= maxAttempts) return setStatusRef.current("timeout");
      schedule();
    };
    const onVisibility = () => {
      if (document.hidden) {
        if (timer) clearTimeout(timer);
        timer = null;
      } else if (!timer) {
        schedule();
      }
    };

    schedule();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [status, interval, maxAttempts, round]);

  const money =
    amount === undefined ? null : new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);

  const title =
    status === "paid" ? t.paidTitle : status === "failed" ? t.failedTitle : status === "timeout" ? t.timeoutTitle : t.pendingTitle;

  return (
    <section className={cn("relative w-full max-w-xl overflow-hidden rounded-md border p-5", paper, edge, ink, className)}>
      <div className="flex items-start gap-3">
        <StatusIcon status={status} />
        <div className={cn("min-w-0 flex-1", status === "paid" && "pr-16")}>
          <h3 className="text-base font-semibold tracking-tight">{title}</h3>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={status}
              className={cn("mt-1 text-sm", inkMuted)}
              initial={reduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -4 }}
              transition={springs.gentle}
            >
              {status === "paid"
                ? null
                : status === "failed"
                  ? reason ?? t.failedBody
                  : status === "timeout"
                    ? t.timeoutBody(email)
                    : t.pendingBody}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {(orderId || money) && (
        <dl className={cn("mt-4 grid grid-cols-2 gap-3 border-t border-dashed pt-4 text-sm", edge)}>
          {orderId && (
            <div className="min-w-0">
              <dt className={cn("text-[11px] tracking-[0.14em] uppercase", inkMuted)}>{t.order}</dt>
              <dd className="mt-0.5 truncate font-mono font-semibold tracking-[0.12em]">{orderId}</dd>
            </div>
          )}
          {money && (
            <div className="min-w-0">
              <dt className={cn("text-[11px] tracking-[0.14em] uppercase", inkMuted)}>{t.amount}</dt>
              <dd className="mt-0.5 font-semibold tracking-tight tabular-nums">{money}</dd>
            </div>
          )}
        </dl>
      )}

      {status === "paid" && successAction && (
        <a href={successAction.href} className={cn(buttonClass, "mt-4")}>
          {successAction.label}
        </a>
      )}
      {status === "failed" && onRetry && (
        <button type="button" onClick={onRetry} className={cn(buttonClass, "mt-4")}>
          {t.retry}
        </button>
      )}
      {status === "timeout" && check && (
        <button
          type="button"
          onClick={() => {
            setStatus("pending");
            setRound((r) => r + 1);
          }}
          className={cn(buttonClass, "mt-4")}
        >
          {t.checkAgain}
        </button>
      )}

      <AnimatePresence initial={false}>
        {status === "paid" && (
          <motion.span
            key="stamp"
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute top-4 right-4 rounded-[3px] border-2 border-current px-2 py-0.5 text-xs font-bold tracking-[0.2em] whitespace-nowrap uppercase mix-blend-multiply dark:mix-blend-screen",
              vermilion,
            )}
            initial={reduceMotion ? false : { scale: 1.6, opacity: 0, rotate: -4 }}
            animate={{ scale: 1, opacity: 0.9, rotate: -10 }}
            transition={springs.stamp}
          >
            {t.paidStamp}
          </motion.span>
        )}
      </AnimatePresence>

      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </section>
  );
}

function StatusIcon({ status }: { status: PaymentStatus }) {
  const common = "mt-0.5 size-5 shrink-0";
  if (status === "pending") {
    return (
      <svg viewBox="0 0 20 20" className={cn(common, "animate-spin motion-reduce:animate-none")} fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5" />
        <path d="M17.5 10A7.5 7.5 0 0 0 10 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 20 20"
      className={cn(common, status === "failed" && "text-destructive")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="7.5" />
      {status === "paid" && <path d="m6.75 10.25 2.25 2.25 4.25-4.5" />}
      {status === "failed" && <path d="m7.5 7.5 5 5m0-5-5 5" />}
      {status === "timeout" && <path d="M10 6v4l2.5 1.5" />}
    </svg>
  );
}
