"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// 設計語言（DESIGN-story.md）：所有顏色走 --story-* 變數，換 theme 即整套換皮
export const storyThemes = {
  ink: {
    "--story-bg": "#0b0e14",
    "--story-panel": "rgb(14 18 28 / 0.86)",
    "--story-line": "rgb(234 228 214 / 0.14)",
    "--story-text": "#eae4d6",
    "--story-muted": "rgb(234 228 214 / 0.6)",
    "--story-accent": "#c9a063",
    "--story-danger": "#c4553f",
  },
  rice: {
    "--story-bg": "#f4efe3",
    "--story-panel": "rgb(250 246 236 / 0.94)",
    "--story-line": "rgb(60 48 32 / 0.18)",
    "--story-text": "#2a2219",
    "--story-muted": "rgb(42 34 25 / 0.6)",
    "--story-accent": "#9a6b2a",
    "--story-danger": "#a33a26",
  },
  moon: {
    "--story-bg": "#0a0d16",
    "--story-panel": "rgb(13 17 30 / 0.86)",
    "--story-line": "rgb(214 224 240 / 0.14)",
    "--story-text": "#e4e8f0",
    "--story-muted": "rgb(228 232 240 / 0.6)",
    "--story-accent": "#a3b8d9",
    "--story-danger": "#c4553f",
  },
} as const;

export type StoryTheme = keyof typeof storyThemes;
export type NoticeVariant = "clue" | "item" | "bond" | "stat";

export interface NoticeInput {
  id?: string;
  variant?: NoticeVariant;
  title: ReactNode;
}

export interface Notice extends NoticeInput {
  id: string;
  variant: NoticeVariant;
}

/** 先進先出的通知佇列；畫面上一次只顯示最前面那一則 */
export function useNoticeQueue() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const counter = useRef(0);

  const push = useCallback((input: NoticeInput) => {
    counter.current += 1;
    const id = input.id ?? `notice-${counter.current}`;
    setNotices((prev) => [...prev.filter((n) => n.id !== id), { variant: "clue", ...input, id }]);
    return id;
  }, []);
  const dismiss = useCallback((id: string) => setNotices((prev) => prev.filter((n) => n.id !== id)), []);

  return { notices, push, dismiss };
}

export interface NoticeQueueLabels {
  region?: string;
  variants?: Partial<Record<NoticeVariant, string>>;
  more?: (n: number) => ReactNode;
}

export interface NoticeQueueProps {
  notices: Notice[];
  onDismiss: (id: string) => void;
  /** 點擊通知時呼叫，例如打開線索詳情 */
  onOpen?: (notice: Notice) => void;
  /** 毫秒；Infinity 表示不自動消失 */
  duration?: number;
  theme?: StoryTheme;
  /** 預設 absolute 疊在容器右上角；true 時改為一般排版 */
  inline?: boolean;
  labels?: NoticeQueueLabels;
  className?: string;
}

const defaultVariants: Record<NoticeVariant, string> = { clue: "Clue", item: "Item", bond: "Bond", stat: "Stat" };
const serif = '"Noto Serif TC", "Songti TC", serif';
const ease = [0.22, 0.72, 0.2, 1] as const;

const glyphs: Record<NoticeVariant, ReactNode> = {
  clue: <path d="M8 1.5 9.4 6.6 14.5 8 9.4 9.4 8 14.5 6.6 9.4 1.5 8 6.6 6.6Z" />,
  item: <path d="M2.5 5.5 8 2.5l5.5 3v5L8 13.5l-5.5-3ZM2.5 5.5 8 8.5l5.5-3M8 8.5v5" />,
  bond: <path d="M6 10.5a2.75 2.75 0 1 1 0-5.5M10 5a2.75 2.75 0 1 1 0 5.5M5.5 8h5" />,
  stat: <path d="m3.5 10 4.5-4.5 4.5 4.5M8 5.5v8" />,
};

function isEditable(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
}

export function NoticeQueue({
  notices,
  onDismiss,
  onOpen,
  duration = 4200,
  theme = "ink",
  inline = false,
  labels,
  className,
}: NoticeQueueProps) {
  const reduce = useReducedMotion() ?? false;
  const variantLabels = { ...defaultVariants, ...labels?.variants };
  const more = labels?.more ?? ((n: number) => `+${n}`);
  const current = notices[0];

  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const paused = hovered || focused || hidden;

  const remaining = useRef(duration);
  const lastId = useRef<string | null>(null);

  useEffect(() => {
    const sync = () => setHidden(document.visibilityState === "hidden");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  // 換到新通知時重設剩餘時間；暫停時保留已經過的時間
  useEffect(() => {
    if (!current) return;
    if (lastId.current !== current.id) {
      lastId.current = current.id;
      remaining.current = duration;
    }
    if (paused || !Number.isFinite(duration)) return;
    const start = Date.now();
    const timer = setTimeout(() => onDismiss(current.id), Math.max(0, remaining.current));
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - start;
    };
  }, [current, paused, duration, onDismiss]);

  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || isEditable(e.target)) return;
      onDismiss(current.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, onDismiss]);

  const vars = storyThemes[theme] as unknown as CSSProperties;

  const body = current && (
    <>
      <span aria-hidden="true" className="shrink-0" style={{ color: "var(--story-accent)" }}>
        <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
          {glyphs[current.variant]}
        </svg>
      </span>
      <span className="shrink-0 text-[11px] tracking-[0.18em] uppercase" style={{ color: "var(--story-muted)" }}>
        {variantLabels[current.variant]}
      </span>
      <span aria-hidden="true" style={{ color: "var(--story-muted)" }}>
        ·
      </span>
      <span className="min-w-0 truncate" style={{ fontFamily: serif }}>
        {current.title}
      </span>
      {notices.length > 1 && (
        <span className="shrink-0 text-[11px] tabular-nums" style={{ color: "var(--story-muted)" }}>
          {more(notices.length - 1)}
        </span>
      )}
    </>
  );

  const itemClass =
    "flex w-full max-w-[22rem] items-center gap-2 rounded-[3px] border px-3 py-2 text-left text-sm outline-none focus-visible:ring-1 focus-visible:ring-[var(--story-accent)]";
  const itemStyle: CSSProperties = {
    background: "var(--story-panel)",
    borderColor: "var(--story-line)",
    color: "var(--story-text)",
    boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.06)",
  };
  const pauseHandlers = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  };

  return (
    <section
      aria-label={labels?.region ?? "Story notices"}
      className={cn(inline ? "relative" : "pointer-events-none absolute top-3 right-3 z-20", "flex justify-end", className)}
      style={vars}
    >
      <AnimatePresence mode="wait" initial={false}>
        {current && (
          <motion.div
            key={current.id}
            className="pointer-events-auto w-full max-w-[22rem]"
            // 墨跡從右側擦入，離開時往左收回
            initial={reduce ? { opacity: 0 } : { clipPath: "inset(0 0 0 100%)" }}
            animate={reduce ? { opacity: 1 } : { clipPath: "inset(0 0 0 0%)" }}
            exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { clipPath: "inset(0 100% 0 0)", transition: { duration: 0.28, ease } }}
            transition={{ duration: reduce ? 0 : 0.24, ease }}
          >
            {onOpen ? (
              <button type="button" onClick={() => onOpen(current)} className={cn(itemClass, "cursor-pointer")} style={itemStyle} {...pauseHandlers}>
                {body}
              </button>
            ) : (
              <div className={itemClass} style={itemStyle} {...pauseHandlers}>
                {body}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <span className="sr-only" role="status" aria-live="polite">
        {current && (
          <span key={current.id}>
            {variantLabels[current.variant]}: {current.title}
          </span>
        )}
      </span>
    </section>
  );
}
