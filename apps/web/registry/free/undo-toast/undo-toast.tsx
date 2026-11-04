"use client";

import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  type AnimationPlaybackControls,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface UndoToastItem {
  id: number;
  message: ReactNode;
  /** 毫秒 */
  duration: number;
}

export interface UndoActions {
  /** 使用者按下復原 */
  onUndo?: () => void;
  /** 時間到、按 Escape，或被下一個動作取代時提交 */
  onCommit?: () => void;
}

/** 用復原取代確認對話框：同一時間只有一個待決動作，新的動作會先提交舊的 */
export function useUndo({ duration = 5000 }: { duration?: number } = {}) {
  const [toast, setToast] = useState<UndoToastItem | null>(null);
  const pending = useRef<UndoActions | null>(null);
  const counter = useRef(0);

  const settle = useCallback((kind: "undo" | "commit") => {
    const actions = pending.current;
    if (!actions) return;
    pending.current = null;
    setToast(null);
    if (kind === "undo") actions.onUndo?.();
    else actions.onCommit?.();
  }, []);

  const run = useCallback(
    (message: ReactNode, actions: UndoActions = {}) => {
      settle("commit");
      counter.current += 1;
      pending.current = actions;
      setToast({ id: counter.current, message, duration });
      return counter.current;
    },
    [duration, settle],
  );

  const undo = useCallback(() => settle("undo"), [settle]);
  const dismiss = useCallback(() => settle("commit"), [settle]);

  // 卸載時把還沒決定的動作提交，避免資料卡在「已移除但未刪除」
  useEffect(
    () => () => {
      const actions = pending.current;
      pending.current = null;
      actions?.onCommit?.();
    },
    [],
  );

  return { toast, run, undo, dismiss };
}

export interface UndoToastProps {
  toast: UndoToastItem | null;
  onUndo: () => void;
  /** 時間到或按 Escape 時呼叫（等同提交） */
  onDismiss: () => void;
  /** 預設 fixed 於視窗底部置中；設 false 改為 absolute，交給父層定位 */
  fixed?: boolean;
  labels?: { undo?: ReactNode; region?: string };
  className?: string;
}

// 設計語言（DESIGN.md）：紙、紙邊、墨
const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";

const springs = {
  gentle: { type: "spring", stiffness: 240, damping: 30 },
} as const;

function isEditable(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function UndoToast({ toast, onUndo, onDismiss, fixed = true, labels, className }: UndoToastProps) {
  const reduce = useReducedMotion() ?? false;

  // 顯示期間 Cmd/Ctrl+Z 直接復原；在輸入框內則交還給瀏覽器的文字復原
  useEffect(() => {
    if (!toast) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "z" && !isEditable(e.target)) {
        e.preventDefault();
        onUndo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toast, onUndo]);

  return (
    <div
      role="region"
      aria-label={labels?.region ?? "Notifications"}
      className={cn(
        "pointer-events-none inset-x-0 bottom-4 z-50 flex justify-center px-4",
        fixed ? "fixed" : "absolute",
        className,
      )}
    >
      <div role="status" aria-live="polite" className="w-full max-w-sm">
        <AnimatePresence initial={false}>
          {toast && (
            <Slip
              key={toast.id}
              toast={toast}
              reduce={reduce}
              undoLabel={labels?.undo ?? "Undo"}
              onUndo={onUndo}
              onDismiss={onDismiss}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Slip({
  toast,
  reduce,
  undoLabel,
  onUndo,
  onDismiss,
}: {
  toast: UndoToastItem;
  reduce: boolean;
  undoLabel: ReactNode;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  const bar = useMotionValue(1);
  const controls = useRef<AnimationPlaybackControls | null>(null);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const sync = () => setHidden(document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  // 細線隨時間縮短，走完即提交；這是資訊，所以 reduced motion 下照樣線性前進
  useEffect(() => {
    controls.current = animate(bar, 0, {
      duration: toast.duration / 1000,
      ease: "linear",
      onComplete: () => dismissRef.current(),
    });
    return () => controls.current?.stop();
  }, [bar, toast.duration]);

  const paused = hovered || focused || hidden;
  useEffect(() => {
    if (paused) controls.current?.pause();
    else controls.current?.play();
  }, [paused]);

  return (
    <motion.div
      className={cn("pointer-events-auto relative overflow-hidden rounded-md border", paper, edge, ink)}
      initial={reduce ? false : { y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { y: 12, opacity: 0, transition: { duration: 0.16 } }}
      transition={springs.gentle}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onDismiss();
        }
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <p className="min-w-0 flex-1 text-sm">{toast.message}</p>
        <button
          type="button"
          onClick={onUndo}
          className="shrink-0 rounded-sm text-sm font-semibold underline decoration-current/40 underline-offset-4 transition-colors hover:decoration-current focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {undoLabel}
        </button>
      </div>
      <motion.span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px origin-left bg-current/40"
        style={{ scaleX: bar }}
      />
    </motion.div>
  );
}
