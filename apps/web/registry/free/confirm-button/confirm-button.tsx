"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ConfirmButtonTone = "default" | "danger";

export interface ConfirmButtonLabels {
  armed?: ReactNode;
  busy?: ReactNode;
  done?: ReactNode;
  error?: ReactNode;
  /** 螢幕閱讀器在待確認時聽到的說明 */
  hint?: (seconds: number) => string;
  doneAnnouncement?: string;
  errorAnnouncement?: string;
}

export interface ConfirmButtonProps {
  /** 平常的按鈕文字，寫動作本身，例如「Remove」 */
  children: ReactNode;
  /** 第一次按下後的文字，寫出結果，例如「Press again to remove」 */
  armedLabel?: ReactNode;
  /** 完成後的文字，例如「Removed」 */
  doneLabel?: ReactNode;
  /** 第二次按下的期限（ms） */
  window?: number;
  /** 完成狀態停留多久（ms）；Infinity 表示停在完成並停用 */
  doneDuration?: number;
  /** 拋錯時顯示錯誤並回到可再按的狀態 */
  onConfirm?: () => void | Promise<void>;
  tone?: ConfirmButtonTone;
  disabled?: boolean;
  labels?: ConfirmButtonLabels;
  className?: string;
}

type Phase = "idle" | "armed" | "busy" | "done" | "error";

const defaultLabels: Required<ConfirmButtonLabels> = {
  armed: "Press again to confirm",
  busy: "Working",
  done: "Done",
  error: "That didn't work. Try again.",
  hint: (s) => `Press again within ${s} seconds to confirm, or press Escape to cancel.`,
  doneAnnouncement: "Done.",
  errorAnnouncement: "That didn't work. Try again.",
};

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
} as const;

export function ConfirmButton({
  children,
  armedLabel,
  doneLabel,
  window: windowMs = 2500,
  doneDuration = 1800,
  onConfirm,
  tone = "default",
  disabled = false,
  labels,
  className,
}: ConfirmButtonProps) {
  const t = { ...defaultLabels, ...labels };
  const reduce = useReducedMotion() ?? false;
  const id = useId();
  const [phase, setPhase] = useState<Phase>("idle");
  const [armCount, setArmCount] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => clear, []);

  const finalDone = phase === "done" && !Number.isFinite(doneDuration);
  const inactive = disabled || phase === "busy" || finalDone;

  function disarm() {
    if (phase !== "armed") return;
    clear();
    setPhase("idle");
    setAnnouncement("");
  }

  async function press() {
    if (inactive) return;
    if (phase === "armed") {
      clear();
      setPhase("busy");
      try {
        await onConfirm?.();
        setPhase("done");
        setAnnouncement(t.doneAnnouncement);
        if (Number.isFinite(doneDuration)) {
          timer.current = setTimeout(() => setPhase((p) => (p === "done" ? "idle" : p)), doneDuration);
        }
      } catch {
        setPhase("error");
        setAnnouncement(t.errorAnnouncement);
      }
      return;
    }
    // 第一次按：只武裝，不做任何事
    clear();
    setPhase("armed");
    setArmCount((n) => n + 1);
    setAnnouncement(t.hint(Math.round(windowMs / 1000)));
    timer.current = setTimeout(() => setPhase((p) => (p === "armed" ? "idle" : p)), windowMs);
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Escape" && phase === "armed") {
      e.preventDefault();
      disarm();
    }
  }

  const armed = phase === "armed";
  const danger = tone === "danger";
  const text =
    phase === "armed"
      ? (armedLabel ?? t.armed)
      : phase === "busy"
        ? t.busy
        : phase === "done"
          ? (doneLabel ?? t.done)
          : children;

  return (
    <span className={cn("inline-flex flex-col items-start gap-1", className)}>
      <button
        type="button"
        onClick={press}
        onBlur={disarm}
        onKeyDown={onKeyDown}
        disabled={disabled || finalDone}
        aria-disabled={phase === "busy" || undefined}
        aria-describedby={armed ? `${id}-hint` : phase === "error" ? `${id}-error` : undefined}
        className={cn(
          "relative inline-flex h-9 items-center gap-1.5 overflow-hidden rounded-md border bg-card px-3 text-sm font-medium whitespace-nowrap text-card-foreground transition-colors",
          "hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-progress",
          armed ? (danger ? "border-destructive text-destructive" : "border-foreground") : "border-border",
          phase === "done" && "text-muted-foreground",
        )}
      >
        {phase === "done" && <CheckIcon />}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={phase === "error" ? "idle" : phase}
            initial={reduce ? false : { y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { y: -8, opacity: 0 }}
            transition={reduce ? { duration: 0 } : springs.snappy}
            className="block"
          >
            {text}
          </motion.span>
        </AnimatePresence>
        {/* 第二次按下的剩餘時間，從滿到空 */}
        {armed && (
          <motion.span
            key={armCount}
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-px origin-left bg-current"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: windowMs / 1000, ease: "linear" }}
          />
        )}
      </button>

      {armed && (
        <span id={`${id}-hint`} className="sr-only">
          {t.hint(Math.round(windowMs / 1000))}
        </span>
      )}
      {phase === "error" && (
        <span id={`${id}-error`} className="text-xs text-destructive">
          {t.error}
        </span>
      )}
      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </span>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="m3 8.5 3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
