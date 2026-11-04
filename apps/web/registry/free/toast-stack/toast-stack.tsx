"use client";

import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export type ToastTone = "default" | "success" | "error" | "info";

export interface ToastInput {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  tone?: ToastTone;
  /** 毫秒；Infinity 表示不自動關閉 */
  duration?: number;
  action?: { label: string; onClick: () => void };
}

export interface ToastItem extends ToastInput {
  id: string;
}

/** 管理 toast 佇列；最新的排在最前面 */
export function useToasts({ max = 5 }: { max?: number } = {}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const push = useCallback(
    (input: ToastInput) => {
      counter.current += 1;
      const id = input.id ?? `toast-${counter.current}`;
      setToasts((prev) => [{ ...input, id }, ...prev.filter((t) => t.id !== id)].slice(0, max));
      return id;
    },
    [max],
  );
  const dismiss = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);
  const clear = useCallback(() => setToasts([]), []);

  return { toasts, push, dismiss, clear };
}

export interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  /** 預設自動關閉時間（毫秒） */
  duration?: number;
  /** 收合時可見的層數 */
  visibleCount?: number;
  placement?: "top" | "bottom";
  /** 預設 fixed 於視窗右下；設 false 時改為 absolute，交給父層定位 */
  fixed?: boolean;
  /** 收合狀態下每層露出的距離 */
  peek?: number;
  gap?: number;
  labels?: {
    region?: string;
    dismiss?: string;
  };
  className?: string;
}

const defaultLabels = {
  region: "Notifications",
  dismiss: "Dismiss notification",
};

const toneStyles: Record<ToastTone, { dot: string; bar: string }> = {
  default: { dot: "bg-foreground", bar: "bg-foreground/40" },
  success: { dot: "bg-emerald-500", bar: "bg-emerald-500" },
  error: { dot: "bg-red-500", bar: "bg-red-500" },
  info: { dot: "bg-sky-500", bar: "bg-sky-500" },
};

export function ToastStack({
  toasts,
  onDismiss,
  duration = 4500,
  visibleCount = 3,
  placement = "bottom",
  fixed = true,
  peek = 12,
  gap = 10,
  labels,
  className,
}: ToastStackProps) {
  const reduceMotion = useReducedMotion();
  const text = { ...defaultLabels, ...labels };
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const expanded = hovered || focused;
  const paused = expanded;
  const [heights, setHeights] = useState<Record<string, number>>({});
  const dir = placement === "bottom" ? -1 : 1;

  const dismissRef = useRef(onDismiss);
  useLayoutEffect(() => {
    dismissRef.current = onDismiss;
  });

  // 自動關閉計時；暫停時記下剩餘時間
  const remaining = useRef(new Map<string, number>());
  useEffect(() => {
    const ids = new Set(toasts.map((t) => t.id));
    for (const id of remaining.current.keys()) if (!ids.has(id)) remaining.current.delete(id);
    if (paused) return;
    const start = Date.now();
    const timers: number[] = [];
    for (const t of toasts) {
      const d = t.duration ?? duration;
      if (!Number.isFinite(d) || d <= 0) continue;
      const left = remaining.current.get(t.id) ?? d;
      remaining.current.set(t.id, left);
      timers.push(window.setTimeout(() => dismissRef.current(t.id), left));
    }
    return () => {
      const elapsed = Date.now() - start;
      for (const t of toasts) {
        const left = remaining.current.get(t.id);
        if (left !== undefined) remaining.current.set(t.id, Math.max(0, left - elapsed));
      }
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [toasts, paused, duration]);

  const measure = useCallback((id: string, h: number) => {
    setHeights((prev) => (prev[id] === h ? prev : { ...prev, [id]: h }));
  }, []);

  const heightOf = (id: string) => heights[id] ?? 64;
  const frontHeight = toasts[0] ? heightOf(toasts[0].id) : 0;
  const shown = Math.min(toasts.length, visibleCount);
  const stackHeight = expanded
    ? toasts.reduce((sum, t, i) => sum + heightOf(t.id) + (i > 0 ? gap : 0), 0)
    : frontHeight + Math.max(0, shown - 1) * peek;

  const offsetOf = (index: number) => {
    if (!expanded) return index * peek * dir;
    let sum = 0;
    for (let i = 0; i < index; i++) sum += heightOf(toasts[i].id) + gap;
    return sum * dir;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape" && toasts[0]) {
      e.stopPropagation();
      onDismiss(toasts[0].id);
    }
  };

  const spring = reduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 380, damping: 32 };

  return (
    <section
      aria-label={text.region}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      onKeyDown={onKeyDown}
      className={cn(
        fixed ? "fixed z-50" : "absolute z-10",
        placement === "bottom" ? "bottom-4" : "top-4",
        "right-4 w-[min(22rem,calc(100%-2rem))]",
        className,
      )}
    >
      <ol
        aria-live="polite"
        aria-relevant="additions"
        className="relative transition-[height] duration-300 ease-out motion-reduce:transition-none"
        style={{ height: stackHeight }}
      >
        <AnimatePresence initial={false}>
          {toasts.map((t, index) => {
            const hidden = !expanded && index >= visibleCount;
            const tone = toneStyles[t.tone ?? "default"];
            const d = t.duration ?? duration;
            return (
              <motion.li
                key={t.id}
                layout={false}
                className={cn(
                  "absolute inset-x-0 overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-lg",
                  placement === "bottom" ? "bottom-0 origin-bottom" : "top-0 origin-top",
                )}
                style={{ zIndex: toasts.length - index }}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 40 * -dir, scale: 0.96 }}
                animate={{
                  opacity: hidden ? 0 : 1,
                  y: offsetOf(index),
                  scale: expanded ? 1 : 1 - index * 0.05,
                  height: !expanded && index > 0 ? frontHeight : "auto",
                }}
                exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0.94, transition: { duration: 0.18 } }}
                transition={spring}
                drag={index === 0 || expanded ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={(_, info: PanInfo) => {
                  if (Math.abs(info.offset.x) > 90 || Math.abs(info.velocity.x) > 600) onDismiss(t.id);
                }}
                aria-hidden={hidden || undefined}
              >
                <ToastBody
                  item={t}
                  dotClass={tone.dot}
                  dismissLabel={text.dismiss}
                  onDismiss={() => onDismiss(t.id)}
                  onMeasure={(h) => measure(t.id, h)}
                  inert={hidden}
                />
                {!reduceMotion && Number.isFinite(d) && d > 0 && (
                  <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-muted">
                    <span
                      className={cn("block h-full origin-left", tone.bar)}
                      style={{
                        animation: `sunui-toast-timer ${d}ms linear forwards`,
                        animationPlayState: paused ? "paused" : "running",
                      }}
                    />
                  </span>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
      <style>{`@keyframes sunui-toast-timer { from { transform: scaleX(1) } to { transform: scaleX(0) } }`}</style>
    </section>
  );
}

function ToastBody({
  item,
  dotClass,
  dismissLabel,
  onDismiss,
  onMeasure,
  inert,
}: {
  item: ToastItem;
  dotClass: string;
  dismissLabel: string;
  onDismiss: () => void;
  onMeasure: (h: number) => void;
  inert: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const measureRef = useRef(onMeasure);
  useLayoutEffect(() => {
    measureRef.current = onMeasure;
  });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    measureRef.current(el.offsetHeight);
    const ro = new ResizeObserver(() => measureRef.current(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex items-start gap-3 p-4 pr-3" {...(inert ? { inert: true } : {})}>
      <span aria-hidden="true" className={cn("mt-1.5 size-2 shrink-0 rounded-full", dotClass)} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{item.title}</p>
        {item.description && <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>}
        {item.action && (
          <button
            type="button"
            onClick={() => {
              item.action?.onClick();
              onDismiss();
            }}
            className="mt-2 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {item.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={dismissLabel}
        className="-mt-0.5 rounded-md p-1 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}
