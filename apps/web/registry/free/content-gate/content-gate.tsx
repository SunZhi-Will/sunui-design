"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Children, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ContentGateState = "anon" | "no-access";

export interface ContentGateAction {
  label: ReactNode;
  onClick?: () => void;
  href?: string;
}

export interface ContentGateLabels {
  eyebrow?: ReactNode;
  title?: (state: ContentGateState) => ReactNode;
  body?: (state: ContentGateState) => ReactNode;
  lockedCount?: (count: number) => ReactNode;
  later?: ReactNode;
  reminder?: (state: ContentGateState) => ReactNode;
  unlockedAnnouncement?: string;
}

export interface ContentGateProps {
  children: ReactNode;
  /** 依子元素數量切：前 freeCount 個公開，其餘鎖住 */
  freeCount?: number;
  /** 沒有 freeCount 時，整段內容只露出這個高度（px），解鎖前整段 inert；免費摘要請放在 gate 外 */
  previewHeight?: number;
  /** freeCount 模式下鎖住內容露出的高度（px） */
  peek?: number;
  state?: ContentGateState;
  unlocked?: boolean;
  /** 例如「$49」，以朱紅印出 */
  price?: ReactNode;
  priceNote?: ReactNode;
  primaryAction: ContentGateAction;
  secondaryAction?: ContentGateAction;
  /** 按「Later」後收成提醒條時呼叫 */
  onDismiss?: () => void;
  labels?: ContentGateLabels;
  className?: string;
}

const defaultLabels: Required<ContentGateLabels> = {
  eyebrow: "Preview",
  title: (state) => (state === "anon" ? "Sign in or buy to keep reading" : "This part is for members"),
  body: (state) =>
    state === "anon"
      ? "You've reached the end of the free part. Pick up right where you left off after you unlock it."
      : "Your account doesn't include this yet. Upgrade once and everything below opens up.",
  lockedCount: (count) => <>{count} more locked</>,
  later: "Later",
  reminder: (state) => (state === "anon" ? "Sign in or buy to read the rest" : "The rest is for members"),
  unlockedAnnouncement: "Unlocked. All content is now available.",
};

// 設計語言（DESIGN.md）：紙、紙邊、墨、朱紅
const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const inkMuted = "text-[#1c1917]/60 dark:text-[#ece7dc]/60";
const vermilion = "text-[#c8361d] dark:text-[#ec6a4f]";

const springs = {
  gentle: { type: "spring", stiffness: 240, damping: 30 },
} as const;

const NOTCH = 8;

/** 打孔線兩端的半圓缺口，像票根可以從這裡撕開 */
const topNotches: CSSProperties = (() => {
  const mask = `radial-gradient(circle ${NOTCH}px at 0 0, #0000 97%, #000), radial-gradient(circle ${NOTCH}px at 100% 0, #0000 97%, #000)`;
  return { maskImage: mask, WebkitMaskImage: mask, maskComposite: "intersect", WebkitMaskComposite: "source-in" };
})();

const primaryClass =
  "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none";
const linkClass =
  "text-sm font-medium underline decoration-current/30 underline-offset-4 hover:decoration-current focus-visible:decoration-current focus-visible:outline-none";

function ActionControl({ action, className }: { action: ContentGateAction; className: string }) {
  if (action.href) {
    return (
      <a href={action.href} onClick={action.onClick} className={className}>
        {action.label}
      </a>
    );
  }
  return (
    <button type="button" onClick={action.onClick} className={className}>
      {action.label}
    </button>
  );
}

export function ContentGate({
  children,
  freeCount,
  previewHeight = 120,
  peek = 56,
  state = "anon",
  unlocked = false,
  price,
  priceNote,
  primaryAction,
  secondaryAction,
  onDismiss,
  labels,
  className,
}: ContentGateProps) {
  const t = { ...defaultLabels, ...labels };
  const reduce = useReducedMotion() ?? false;
  const [dismissed, setDismissed] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const byCount = freeCount !== undefined;
  const items = Children.toArray(children);
  const free = byCount ? items.slice(0, freeCount) : [];
  const locked = byCount ? items.slice(freeCount) : items;
  const isLocked = !unlocked && locked.length > 0;
  const clipHeight = byCount ? peek : previewHeight;

  // 只在從鎖住變成解鎖的那一刻宣告
  const wasLocked = useRef(isLocked);
  useEffect(() => {
    if (wasLocked.current && !isLocked) setAnnouncement(t.unlockedAnnouncement);
    wasLocked.current = isLocked;
  }, [isLocked, t.unlockedAnnouncement]);

  return (
    <div className={cn("relative", className)}>
      {free}

      <motion.div
        aria-hidden={isLocked || undefined}
        inert={isLocked}
        initial={false}
        animate={{ height: isLocked ? clipHeight : "auto" }}
        transition={reduce ? { duration: 0 } : springs.gentle}
        className="overflow-hidden"
      >
        {locked}
      </motion.div>

      <AnimatePresence initial={false}>
        {isLocked && (
          <motion.div
            key="gate"
            exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: 12, transition: { duration: 0.2 } }}
            className={cn(
              // 往上蓋住露出內容的下半段，紙面不透明，不用模糊或漸層
              "relative z-10 -mt-8 rounded-b-md border border-t-0 font-sans",
              dismissed ? "px-4 pt-4 pb-3" : "px-5 pt-6 pb-5",
              paper,
              edge,
              ink,
            )}
            style={topNotches}
          >
            <span aria-hidden="true" className={cn("absolute inset-x-3 top-0 border-t-2 border-dashed", edge)} />

            {dismissed ? (
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 text-sm">
                  <LockIcon />
                  <span className="truncate">{t.reminder(state)}</span>
                </span>
                <ActionControl action={primaryAction} className={cn(primaryClass, "shrink-0 px-3 py-1.5")} />
              </div>
            ) : (
              <section aria-label={typeof t.eyebrow === "string" ? t.eyebrow : undefined}>
                <div className="flex items-center justify-between gap-3">
                  <p className={cn("flex items-center gap-1.5 text-[11px] font-medium tracking-[0.14em] uppercase", inkMuted)}>
                    <LockIcon />
                    {t.eyebrow}
                  </p>
                  {byCount && <p className={cn("text-xs tabular-nums", inkMuted)}>{t.lockedCount(locked.length)}</p>}
                </div>
                <h3 className="mt-2 text-lg font-semibold tracking-tight text-balance">{t.title(state)}</h3>
                <p className={cn("mt-1 max-w-prose text-sm text-pretty", inkMuted)}>{t.body(state)}</p>

                {price !== undefined && (
                  <p className="mt-3 flex flex-wrap items-baseline gap-x-2">
                    <span className={cn("text-2xl leading-none font-semibold tracking-tight tabular-nums", vermilion)}>{price}</span>
                    {priceNote && <span className={cn("text-sm", inkMuted)}>{priceNote}</span>}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
                  <ActionControl action={primaryAction} className={primaryClass} />
                  {secondaryAction && <ActionControl action={secondaryAction} className={linkClass} />}
                  <button
                    type="button"
                    onClick={() => {
                      setDismissed(true);
                      onDismiss?.();
                    }}
                    className={cn("ml-auto text-sm hover:underline focus-visible:underline focus-visible:outline-none", inkMuted)}
                  >
                    {t.later}
                  </button>
                </div>
              </section>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" strokeLinecap="round" />
    </svg>
  );
}
