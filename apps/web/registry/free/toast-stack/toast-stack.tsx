"use client";

import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type KeyboardEvent,
  type ReactNode,
  type SetStateAction,
} from "react";

import { cn } from "@/lib/utils";

export type ToastTone = "default" | "success" | "error" | "info";

export interface ToastInput {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  tone?: ToastTone;
  /** 左側小圖，例如加入購物車的商品縮圖 */
  media?: ReactNode;
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

export interface UndoableOptions<T> {
  /** 原狀態是空的就不給復原，只跳一般的成功提示 */
  isEmpty?: (value: T) => boolean;
  /** 不給時依 locale 用內建文字 */
  undoLabel?: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
}

/**
 * 刪東西、換掉整份資料：變更立刻生效，不跳確認視窗，改給一張帶「復原」的通知。
 * 帶復原的通知不自動消失；按復原就把變更前的整份狀態放回去。
 */
export function useUndoable<T>(
  value: T,
  setValue: Dispatch<SetStateAction<T>>,
  toasts: Pick<ReturnType<typeof useToasts>, "push">,
  { isEmpty, undoLabel, locale = "en" }: UndoableOptions<T> = {},
) {
  // 同一輪 render 內連續變更時，以最新的值當作「變更前」
  const latest = useRef(value);
  useLayoutEffect(() => {
    latest.current = value;
  }, [value]);
  const { push } = toasts;

  return useCallback(
    (change: (prev: T) => T, title: ReactNode, toast: Omit<ToastInput, "title" | "action" | "duration"> = {}) => {
      const before = latest.current;
      const next = change(before);
      latest.current = next;
      setValue(next);
      if (isEmpty?.(before)) {
        push({ tone: "success", ...toast, title });
        return;
      }
      const restore = () => {
        latest.current = before;
        setValue(before);
      };
      push({ ...toast, title, duration: Infinity, action: { label: undoLabel ?? MESSAGES[resolveLocale(locale)].undo, onClick: restore } });
    },
    [setValue, push, isEmpty, undoLabel, locale],
  );
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
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<ToastStackLabels>;
  className?: string;
}

export interface ToastStackLabels {
  region: string;
  dismiss: string;
  /** useUndoable 的復原按鈕 */
  undo: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, ToastStackLabels> = {
  en: { region: "Notifications", dismiss: "Dismiss notification", undo: "Undo" },
  "zh-TW": { region: "通知", dismiss: "關閉通知", undo: "復原" },
  "zh-CN": { region: "通知", dismiss: "关闭通知", undo: "撤销" },
  ja: { region: "通知", dismiss: "通知を閉じる", undo: "元に戻す" },
};

// 設計語言（DESIGN.md）：紙、紙邊、墨
const paper = "bg-[#f7f7f7] dark:bg-[#1c1c1c]";
const edge = "border-[#e2e2e2] dark:border-[#333333]";
const ink = "text-[#171717] dark:text-[#ededed]";
const inkMuted = "text-[#171717]/60 dark:text-[#ededed]/60";
/** 品牌專色：預設跟著主題的 --primary，買家設 --sunui-spot 就換成自己的品牌色。只用在選中、優惠、目前進度 */
const spot = "text-[color:var(--sunui-spot,var(--primary))]";

const springs = {
  gentle: { type: "spring", stiffness: 240, damping: 30 },
} as const;

/** 狀態只用小圖示表達，不鋪底色 */
const toneIcons: Record<ToastTone, ReactNode> = {
  default: null,
  success: <path d="M5 12.5l4.5 4.5L19 7.5" className="text-emerald-700 dark:text-emerald-400" />,
  error: (
    <g className="text-[#171717] dark:text-[#ededed]">
      <path d="M10.3 4.6L3.4 17a2 2 0 0 0 1.7 3h13.8a2 2 0 0 0 1.7-3L13.7 4.6a2 2 0 0 0-3.4 0z" />
      <path d="M12 9.5v4" />
      <circle cx="12" cy="16.6" r="1" fill="currentColor" stroke="none" />
    </g>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5" />
      <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />
    </>
  ),
};

export function ToastStack({
  toasts,
  onDismiss,
  duration = 4500,
  visibleCount = 3,
  placement = "bottom",
  fixed = true,
  peek = 10,
  gap = 8,
  locale = "en",
  labels,
  className,
}: ToastStackProps) {
  const reduceMotion = useReducedMotion();
  const text = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const expanded = hovered || focused;
  const [heights, setHeights] = useState<Record<string, number>>({});
  const dir = placement === "bottom" ? -1 : 1;

  // 分頁隱藏時暫停倒數，回來再接著算
  const [pageHidden, setPageHidden] = useState(false);
  useEffect(() => {
    const sync = () => setPageHidden(document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);
  const paused = expanded || pageHidden;

  const dismissRef = useRef(onDismiss);
  useLayoutEffect(() => {
    dismissRef.current = onDismiss;
  });

  // 自動關閉計時；展開時暫停並記下剩餘時間
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

  const transition = reduceMotion ? { duration: 0 } : springs.gentle;

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
            const d = t.duration ?? duration;
            return (
              <motion.li
                key={t.id}
                className={cn(
                  "absolute inset-x-0 overflow-hidden rounded-md border shadow-[0_1px_0_rgb(0_0_0/0.04)] outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  paper,
                  edge,
                  ink,
                  placement === "bottom" ? "bottom-0 origin-bottom" : "top-0 origin-top",
                )}
                style={{ zIndex: toasts.length - index }}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 28 * -dir }}
                animate={{
                  opacity: hidden ? 0 : 1,
                  y: offsetOf(index),
                  scale: expanded ? 1 : 1 - index * 0.04,
                  height: !expanded && index > 0 ? frontHeight : "auto",
                }}
                exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: 12 * -dir, transition: { duration: 0.16 } }}
                transition={transition}
                drag={index === 0 || expanded ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={(_, info: PanInfo) => {
                  if (Math.abs(info.offset.x) > 90 || Math.abs(info.velocity.x) > 600) onDismiss(t.id);
                }}
                aria-hidden={hidden || undefined}
                aria-atomic="true"
                tabIndex={hidden ? -1 : 0}
                onKeyDown={(e) => {
                  // 聚焦在某張通知上時，Delete 或 Backspace 關掉那一張
                  if ((e.key === "Delete" || e.key === "Backspace") && e.target === e.currentTarget) {
                    e.stopPropagation();
                    onDismiss(t.id);
                  }
                }}
              >
                <ToastBody item={t} dismissLabel={text.dismiss} onDismiss={() => onDismiss(t.id)} onMeasure={(h) => measure(t.id, h)} inert={hidden} />
                {/* 剩餘時間：底部一條墨線慢慢縮短 */}
                {!reduceMotion && Number.isFinite(d) && d > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-px origin-left bg-current opacity-25"
                    style={{ animation: `sunui-toast-timer ${d}ms linear forwards`, animationPlayState: paused ? "paused" : "running" }}
                  />
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
  dismissLabel,
  onDismiss,
  onMeasure,
  inert,
}: {
  item: ToastItem;
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

  const icon = toneIcons[item.tone ?? "default"];

  return (
    <div ref={ref} className="flex items-start gap-3 p-3 pr-2" {...(inert ? { inert: true } : {})}>
      {item.media ? (
        <span aria-hidden="true" className={cn("size-11 shrink-0 overflow-hidden rounded-[3px] border", edge)}>
          {item.media}
        </span>
      ) : (
        icon && (
          <svg viewBox="0 0 24 24" className="mt-0.5 size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {icon}
          </svg>
        )
      )}
      <div className="min-w-0 flex-1 py-0.5">
        <p className="text-sm font-medium">{item.title}</p>
        {item.description && <p className={cn("mt-0.5 text-[13px] leading-snug", inkMuted)}>{item.description}</p>}
      </div>
      {item.action && (
        <button
          type="button"
          onClick={() => {
            item.action?.onClick();
            onDismiss();
          }}
          className={cn("mt-0.5 shrink-0 rounded-[3px] px-1.5 py-0.5 text-sm font-medium underline decoration-current/30 underline-offset-4 outline-none hover:decoration-current focus-visible:ring-2 focus-visible:ring-ring", spot)}
        >
          {item.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={onDismiss}
        aria-label={dismissLabel}
        className={cn("shrink-0 rounded-[3px] p-1 outline-none transition-colors hover:text-[#171717] dark:hover:text-[#ededed] focus-visible:ring-2 focus-visible:ring-ring", inkMuted)}
      >
        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" strokeLinejoin="round">
          <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
        </svg>
      </button>
    </div>
  );
}
