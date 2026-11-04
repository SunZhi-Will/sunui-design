"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface Announcement {
  id: string;
  content: ReactNode;
  /** 選填連結，例如活動頁 */
  href?: string;
  linkLabel?: ReactNode;
}

export interface AnnouncementStripLabels {
  region?: string;
  eyebrow?: ReactNode;
  previous?: string;
  next?: string;
  dismiss?: string;
  more?: ReactNode;
  position?: (current: number, total: number) => string;
}

export interface AnnouncementStripProps {
  messages: Announcement[];
  /** 有值時把「已關閉」記在 localStorage；換內容時改 key（例如加上 -v2）就會再出現 */
  storageKey?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  labels?: AnnouncementStripLabels;
  className?: string;
}

const defaultLabels: Required<AnnouncementStripLabels> = {
  region: "Store announcements",
  eyebrow: "Notice",
  previous: "Previous announcement",
  next: "Next announcement",
  dismiss: "Dismiss announcements",
  more: "Learn more",
  position: (current, total) => `${current} of ${total}`,
};

// 設計語言（DESIGN.md）：紙、紙邊、墨、朱紅
const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const inkMuted = "text-[#1c1917]/60 dark:text-[#ece7dc]/60";
const vermilion = "text-[#c8361d] dark:text-[#ec6a4f]";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  gentle: { type: "spring", stiffness: 240, damping: 30 },
} as const;

/** 紙條左右兩端各挖一個半圓缺口，像撕下來的票根 */
const NOTCH = 7;
const notches: CSSProperties = (() => {
  const mask = `radial-gradient(circle ${NOTCH}px at 0 50%, #0000 97%, #000), radial-gradient(circle ${NOTCH}px at 100% 50%, #0000 97%, #000)`;
  return { maskImage: mask, WebkitMaskImage: mask, maskComposite: "intersect", WebkitMaskComposite: "source-in" };
})();

function readDismissed(key: string) {
  try {
    return window.localStorage.getItem(key) === "dismissed";
  } catch {
    return false;
  }
}

export function AnnouncementStrip({ messages, storageKey, dismissible = true, onDismiss, labels, className }: AnnouncementStripProps) {
  const t = { ...defaultLabels, ...labels };
  const reduce = useReducedMotion() ?? false;
  // 有 storageKey 時，掛載後才知道是否已關閉；先不渲染，避免已關閉的人看到一閃
  const [visible, setVisible] = useState(!storageKey);
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);

  useEffect(() => {
    if (storageKey) setVisible(!readDismissed(storageKey));
  }, [storageKey]);

  const total = messages.length;
  const current = messages[Math.min(index, total - 1)];

  function go(step: number) {
    setDir(step);
    setIndex((i) => (i + step + total) % total);
  }

  function dismiss() {
    setVisible(false);
    if (storageKey) {
      try {
        window.localStorage.setItem(storageKey, "dismissed");
      } catch {
        // 隱私模式或停用儲存時，只在這次瀏覽關閉
      }
    }
    onDismiss?.();
  }

  const iconButton =
    "grid size-8 shrink-0 place-items-center rounded-md hover:bg-current/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

  return (
    <AnimatePresence initial={false}>
      {visible && current && (
        <motion.section
          key="strip"
          aria-label={t.region}
          initial={false}
          animate={{ height: "auto" }}
          exit={reduce ? { height: 0, transition: { duration: 0 } } : { height: 0 }}
          transition={springs.gentle}
          className={cn("w-full overflow-hidden font-sans", ink, className)}
        >
          <div style={notches} className={cn("flex min-h-11 items-center gap-2 border-y px-3 py-1.5 text-sm sm:px-5", paper, edge)}>
            <span className={cn("hidden shrink-0 text-[11px] font-semibold tracking-[0.14em] uppercase sm:inline", vermilion)}>{t.eyebrow}</span>
            <span aria-hidden="true" className={cn("hidden h-4 shrink-0 border-l border-dashed sm:block", edge)} />

            {total > 1 && (
              <motion.button type="button" aria-label={t.previous} onClick={() => go(-1)} whileTap={reduce ? undefined : { x: -2 }} transition={springs.snappy} className={iconButton}>
                <Chevron dir="left" />
              </motion.button>
            )}

            <div className="relative min-w-0 flex-1 overflow-hidden" aria-live="polite" aria-atomic="true">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.p
                  key={current.id}
                  initial={reduce ? false : { x: dir * 16, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { x: dir * -16, opacity: 0, transition: { duration: 0.12 } }}
                  transition={springs.snappy}
                  className="text-center leading-5 text-pretty"
                >
                  <span className="sr-only">{total > 1 ? `${t.position(index + 1, total)}: ` : ""}</span>
                  {current.content}
                  {current.href && (
                    <a href={current.href} className="ml-2 font-medium whitespace-nowrap underline decoration-1 underline-offset-4 hover:decoration-2 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                      {current.linkLabel ?? t.more}
                    </a>
                  )}
                </motion.p>
              </AnimatePresence>
            </div>

            {total > 1 && (
              <>
                <span aria-hidden="true" className={cn("hidden shrink-0 font-mono text-[11px] tracking-[0.12em] tabular-nums sm:inline", inkMuted)}>
                  {index + 1}/{total}
                </span>
                <motion.button type="button" aria-label={t.next} onClick={() => go(1)} whileTap={reduce ? undefined : { x: 2 }} transition={springs.snappy} className={iconButton}>
                  <Chevron dir="right" />
                </motion.button>
              </>
            )}

            {dismissible && (
              <button type="button" aria-label={t.dismiss} onClick={dismiss} className={cn(iconButton, "-mr-1")}>
                <CloseIcon />
              </button>
            )}
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d={dir === "left" ? "M10 3.5 5.5 8l4.5 4.5" : "M6 3.5 10.5 8 6 12.5"} />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <path d="m4 4 8 8M12 4l-8 8" />
    </svg>
  );
}
