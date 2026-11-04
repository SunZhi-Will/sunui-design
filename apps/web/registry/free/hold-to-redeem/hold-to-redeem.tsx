"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type AnimationPlaybackControls,
} from "framer-motion";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface HoldToRedeemLabels {
  /** 按鈕下方的說明，也是 aria-describedby 的內容 */
  hint?: ReactNode;
  keepHolding?: ReactNode;
  confirming?: ReactNode;
  retry?: ReactNode;
  error?: ReactNode;
  redeemed?: ReactNode;
  redeemedStamp?: ReactNode;
  doneAnnouncement?: string;
  errorAnnouncement?: string;
}

export interface HoldToRedeemProps {
  label?: ReactNode;
  /** 顯示在按鈕右側的花費，例如「500 pts」 */
  cost?: ReactNode;
  /** 需要按住多久（ms） */
  holdMs?: number;
  /** 按滿後呼叫；拋錯顯示重試 */
  onConfirm?: () => void | Promise<void>;
  disabled?: boolean;
  /** 停用時顯示的原因，取代說明文字 */
  disabledReason?: ReactNode;
  done?: boolean;
  defaultDone?: boolean;
  /** 兌換完成後印在票面上的內容，例如兌換碼 */
  result?: ReactNode;
  labels?: HoldToRedeemLabels;
  className?: string;
}

const defaultLabels: Required<HoldToRedeemLabels> = {
  hint: "Press and hold to confirm",
  keepHolding: "Keep holding to redeem",
  confirming: "Redeeming",
  retry: "Hold to try again",
  error: "Couldn't redeem. Your points were not used.",
  redeemed: "Redeemed",
  redeemedStamp: "Redeemed",
  doneAnnouncement: "Redeemed.",
  errorAnnouncement: "Couldn't redeem. Your points were not used.",
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

const isHoldKey = (key: string) => key === " " || key === "Enter";

export function HoldToRedeem({
  label = "Hold to redeem",
  cost,
  holdMs = 1200,
  onConfirm,
  disabled = false,
  disabledReason,
  done: doneProp,
  defaultDone = false,
  result,
  labels,
  className,
}: HoldToRedeemProps) {
  const t = { ...defaultLabels, ...labels };
  const reduce = useReducedMotion() ?? false;
  const id = useId();

  const [doneState, setDoneState] = useState(defaultDone);
  const done = doneProp ?? doneState;
  const [phase, setPhase] = useState<"idle" | "holding" | "confirming" | "error">("idle");
  const [nudge, setNudge] = useState(false);
  const [justDone, setJustDone] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const progress = useMotionValue(0);
  const controls = useRef<AnimationPlaybackControls | null>(null);
  const holding = useRef(false);
  const nudgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      controls.current?.stop();
      if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
    },
    [],
  );

  const busy = phase === "confirming";

  async function complete() {
    holding.current = false;
    setPhase("confirming");
    try {
      await onConfirm?.();
      setDoneState(true);
      setJustDone(true);
      setPhase("idle");
      setAnnouncement(t.doneAnnouncement);
    } catch {
      progress.set(0);
      setPhase("error");
      setAnnouncement(t.errorAnnouncement);
    }
  }

  // 從目前進度繼續線性填滿，剩餘時間按比例計算
  function start() {
    if (disabled || busy || done || holding.current) return;
    holding.current = true;
    setPhase("holding");
    setNudge(false);
    controls.current?.stop();
    const remaining = ((1 - progress.get()) * holdMs) / 1000;
    controls.current = animate(progress, 1, {
      duration: remaining,
      ease: "linear",
      onComplete: () => {
        if (holding.current) void complete();
      },
    });
  }

  // 提早放開：倒退回 0，並短暫提示要按住
  function release() {
    if (!holding.current) return;
    holding.current = false;
    controls.current?.stop();
    if (reduce) {
      progress.set(0);
      controls.current = null;
    } else {
      controls.current = animate(progress, 0, springs.gentle);
    }
    setPhase("idle");
    setNudge(true);
    if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
    nudgeTimer.current = setTimeout(() => setNudge(false), 1800);
  }

  function onPointerDown(e: PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    start();
  }

  // 有 pointer capture 時 pointerleave 不會觸發，改用座標判斷手指是否滑出按鈕
  function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
    if (!holding.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) release();
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (!isHoldKey(e.key)) return;
    e.preventDefault();
    if (!e.repeat) start();
  }

  function onKeyUp(e: KeyboardEvent<HTMLButtonElement>) {
    if (!isHoldKey(e.key)) return;
    e.preventDefault();
    release();
  }

  const note = disabled && disabledReason ? disabledReason : phase === "error" ? t.error : nudge ? t.keepHolding : t.hint;

  return (
    <div className={cn("relative w-full", ink, className)}>
      {done ? (
        <div className={cn("flex min-h-11 items-center gap-3 rounded-md border px-3 py-2", paper, edge)}>
          <div className="min-w-0 flex-1">
            <p className={cn("text-[11px] tracking-[0.14em] uppercase", inkMuted)}>{t.redeemed}</p>
            {result && <p className="truncate font-mono text-sm font-semibold tracking-[0.12em] select-all">{result}</p>}
          </div>
          <motion.span
            aria-hidden="true"
            className={cn(
              "shrink-0 rounded-[3px] border-2 border-current px-1.5 py-0.5 text-[10px] font-bold tracking-[0.16em] whitespace-nowrap uppercase mix-blend-multiply dark:mix-blend-screen",
              vermilion,
            )}
            initial={reduce || !justDone ? false : { scale: 1.6, opacity: 0, rotate: -4 }}
            animate={{ scale: 1, opacity: 0.9, rotate: -10 }}
            transition={springs.stamp}
          >
            {t.redeemedStamp}
          </motion.span>
        </div>
      ) : (
        <>
          <button
            type="button"
            disabled={disabled}
            aria-disabled={busy || undefined}
            aria-describedby={`${id}-note`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={release}
            onPointerCancel={release}
            onLostPointerCapture={release}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            onBlur={release}
            onContextMenu={(e) => e.preventDefault()}
            className={cn(
              "relative flex h-11 w-full touch-none items-center justify-between gap-3 overflow-hidden rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground select-none [-webkit-touch-callout:none]",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-45 aria-disabled:cursor-progress",
            )}
          >
            {/* 按住時由左往右填滿的墨色 */}
            <motion.span
              aria-hidden="true"
              className="absolute inset-0 origin-left bg-primary-foreground/20"
              style={{ scaleX: progress }}
            />
            <span className="relative truncate">{busy ? t.confirming : phase === "error" ? t.retry : label}</span>
            {cost && <span className="relative shrink-0 tabular-nums opacity-80">{cost}</span>}
          </button>
          <p
            id={`${id}-note`}
            className={cn("mt-1.5 min-h-4 text-xs", phase === "error" ? "text-destructive" : inkMuted)}
          >
            {note}
          </p>
        </>
      )}

      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}
