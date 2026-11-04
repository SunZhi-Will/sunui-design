"use client";

import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import { cn } from "@/lib/utils";

// 原版用 sonner：<Toaster position="top-center" closeButton />，這裡在元件內重做同樣的行為與長相。

export type ToastKind = "default" | "success";

export interface ToastAction {
  label: ReactNode;
  onClick: () => void;
}

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: ReactNode;
  /** 毫秒；Infinity 代表不自動消失 */
  duration: number;
  action?: ToastAction;
}

export interface ToastOptions {
  duration?: number;
  action?: ToastAction;
}

/** sonner 的預設顯示時間 */
const DEFAULT_DURATION = 4000;
/** 同時看得到的張數（sonner visibleToasts） */
const VISIBLE = 3;
/** 疊在一起時每張的間距（sonner --gap） */
const GAP = 14;
/** 往上滑超過這個距離就關掉（sonner SWIPE_THRESHOLD） */
const SWIPE = 45;

let seq = 0;

/** 元件內的 toast 佇列，用法對應 sonner 的 toast() 與 toast.success() */
export function useToaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id?: number) => {
    setToasts((list) => (id === undefined ? [] : list.filter((t) => t.id !== id)));
  }, []);

  const push = useCallback((kind: ToastKind, message: ReactNode, options: ToastOptions = {}) => {
    seq += 1;
    const item: ToastItem = { id: seq, kind, message, duration: options.duration ?? DEFAULT_DURATION, action: options.action };
    // 新的放最前面
    setToasts((list) => [item, ...list]);
    return item.id;
  }, []);

  const toast = useCallback((message: ReactNode, options?: ToastOptions) => push("default", message, options), [push]);
  const success = useCallback((message: ReactNode, options?: ToastOptions) => push("success", message, options), [push]);

  return { toasts, toast, success, dismiss };
}

export type Toaster = ReturnType<typeof useToaster>;

export interface UndoableOptions<T> {
  /** 原狀態是空的就不給復原，只跳一般的成功提示 */
  isEmpty?: (value: T) => boolean;
  undoLabel?: ReactNode;
}

/**
 * 換掉整份資料、刪東西：都給「復原」，不跳確認視窗。帶復原的提示不自動消失。
 * 變更立刻生效；按復原就把變更前的整份狀態放回去。
 */
export function useUndoable<T>(
  value: T,
  setValue: Dispatch<SetStateAction<T>>,
  toaster: Pick<Toaster, "toast" | "success">,
  { isEmpty, undoLabel = "Undo" }: UndoableOptions<T> = {},
) {
  return (change: (prev: T) => T, message: ReactNode) => {
    const before = value;
    setValue(change);
    if (!isEmpty?.(before)) {
      toaster.toast(message, { duration: Infinity, action: { label: undoLabel, onClick: () => setValue(before) } });
    } else {
      toaster.success(message);
    }
  };
}

export interface UndoToasterProps {
  toaster: Pick<Toaster, "toasts" | "dismiss">;
  /** 預設 fixed 在視窗上方置中；false 改為 absolute，交給父層定位 */
  fixed?: boolean;
  closeButton?: boolean;
  labels?: { region?: string; close?: string };
  className?: string;
}

const ease = [0.25, 0.1, 0.25, 1] as const; // CSS 的 ease，sonner 的 transition 沒指定緩動

export function UndoToaster({ toaster, fixed = true, closeButton = true, labels, className }: UndoToasterProps) {
  const reduce = useReducedMotion() ?? false;
  const { toasts, dismiss } = toaster;
  const [expanded, setExpanded] = useState(false);
  const [heights, setHeights] = useState<Record<number, number>>({});
  const listRef = useRef<HTMLOListElement>(null);

  // alt+T 把焦點移到通知區（sonner 的熱鍵）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.code === "KeyT") {
        e.preventDefault();
        setExpanded(true);
        listRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // 只剩一張或全部關掉時收合
  useEffect(() => {
    if (toasts.length <= 1) setExpanded(false);
  }, [toasts.length]);

  const setHeight = useCallback((id: number, h: number) => {
    setHeights((m) => (m[id] === h ? m : { ...m, [id]: h }));
  }, []);

  const frontHeight = toasts[0] ? heights[toasts[0].id] : undefined;
  const label = labels?.region ?? "Notifications alt+T";

  return (
    <section
      aria-label={label}
      tabIndex={-1}
      aria-live="polite"
      aria-relevant="additions text"
      aria-atomic="false"
      className={cn("pointer-events-none inset-x-0 top-4 z-[999] flex justify-center px-4 sm:top-6", fixed ? "fixed" : "absolute", className)}
    >
      {toasts.length > 0 && (
        <ol
          ref={listRef}
          tabIndex={-1}
          className="pointer-events-auto relative w-full max-w-[356px] outline-none"
          style={{ height: frontHeight ?? 0 }}
          onPointerEnter={() => setExpanded(true)}
          onPointerLeave={() => setExpanded(false)}
          onFocus={() => setExpanded(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setExpanded(false);
          }}
        >
          <AnimatePresence initial={false}>
            {toasts.map((t, index) => {
              let offset = 0;
              for (let i = 0; i < index; i++) offset += (heights[toasts[i].id] ?? 0) + GAP;
              return (
                <ToastCard
                  key={t.id}
                  toast={t}
                  index={index}
                  expanded={expanded}
                  offset={offset}
                  frontHeight={frontHeight}
                  reduce={reduce}
                  closeButton={closeButton}
                  closeLabel={labels?.close ?? "Close toast"}
                  paused={expanded}
                  onHeight={setHeight}
                  onDismiss={() => dismiss(t.id)}
                />
              );
            })}
          </AnimatePresence>
        </ol>
      )}
    </section>
  );
}

function ToastCard({
  toast,
  index,
  expanded,
  offset,
  frontHeight,
  reduce,
  closeButton,
  closeLabel,
  paused,
  onHeight,
  onDismiss,
}: {
  toast: ToastItem;
  index: number;
  expanded: boolean;
  offset: number;
  frontHeight?: number;
  reduce: boolean;
  closeButton: boolean;
  closeLabel: string;
  paused: boolean;
  onHeight: (id: number, h: number) => void;
  onDismiss: () => void;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  const front = index === 0;
  const [hidden, setHidden] = useState(false);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const measure = () => onHeight(toast.id, el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [toast.id, onHeight]);

  useEffect(() => {
    const sync = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  // 有時限的 toast 才計時；滑鼠移上去或分頁隱藏時暫停，剩餘時間保留
  const remaining = useRef(toast.duration);
  useEffect(() => {
    if (!Number.isFinite(toast.duration) || paused || hidden) return;
    const start = Date.now();
    const timer = window.setTimeout(() => dismissRef.current(), remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current -= Date.now() - start;
    };
  }, [toast.duration, paused, hidden]);

  const collapsed = !expanded && !front;
  const visible = index < VISIBLE;
  const y = expanded ? offset : index * GAP;
  const scale = expanded ? 1 : 1 - index * 0.05;
  const t = reduce ? { duration: 0 } : { duration: 0.4, ease };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y < -SWIPE || info.velocity.y < -110) onDismiss();
  };

  return (
    <motion.li
      role="status"
      aria-live="polite"
      aria-atomic="true"
      tabIndex={0}
      data-front={front}
      className="absolute inset-x-0 top-0 flex touch-none rounded-lg border border-border bg-card text-[13px] text-foreground shadow-[0_4px_12px_rgba(0,0,0,0.1)] outline-none select-none focus-visible:ring-3 focus-visible:ring-[#71717A]/50"
      style={{ zIndex: VISIBLE + 10 - index, transformOrigin: "top center" }}
      initial={reduce ? { opacity: 0 } : { y: "-100%", opacity: 0 }}
      animate={{
        y,
        scale,
        opacity: visible ? 1 : 0,
        height: collapsed && frontHeight ? frontHeight : "auto",
      }}
      exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { y: "-100%", opacity: 0, transition: { duration: 0.4, ease } }}
      transition={t}
      drag={reduce ? false : "y"}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.6, bottom: 0.05 }}
      dragSnapToOrigin
      onDragEnd={onDragEnd}
      onKeyDown={(e) => {
        if (e.key === "Delete" || e.key === "Backspace") onDismiss();
      }}
    >
      <div
        ref={innerRef}
        className={cn(
          "flex w-full items-center gap-1.5 self-start p-4 transition-opacity duration-400",
          collapsed && "opacity-0",
        )}
      >
        {toast.kind === "success" && (
          <span className="flex size-4 shrink-0 items-center justify-center text-[#15803D] dark:text-[#4ADE80]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4">
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </span>
        )}
        <p className="min-w-0 flex-1 leading-normal font-medium">{toast.message}</p>
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick();
              onDismiss();
            }}
            className="ml-auto h-6 shrink-0 cursor-pointer rounded-[4px] bg-foreground px-2 text-xs font-medium text-background transition-opacity outline-none focus-visible:ring-3 focus-visible:ring-[#71717A]/50"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      {closeButton && (
        <button
          type="button"
          aria-label={closeLabel}
          onClick={onDismiss}
          className={cn(
            "absolute top-0 left-0 flex size-5 -translate-x-[35%] -translate-y-[35%] cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground transition-[opacity,background-color] outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-[#71717A]/50",
            collapsed && "pointer-events-none opacity-0",
          )}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-3">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      )}
    </motion.li>
  );
}
