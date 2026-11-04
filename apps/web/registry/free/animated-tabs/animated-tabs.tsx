"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion, type Variants } from "framer-motion";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface AnimatedTab<T extends string = string> {
  value: T;
  label: ReactNode;
  /** 顯示在文字前的圖示 */
  icon?: ReactNode;
  /** 數量徽章，例如篩選結果筆數；undefined 時不顯示 */
  count?: number;
  /** 分頁內容 */
  content?: ReactNode;
  disabled?: boolean;
}

export interface AnimatedTabsProps<T extends string = string> {
  tabs: AnimatedTab<T>[];
  /** 受控值 */
  value?: T;
  /** 非受控時的初始值，預設為第一個可用分頁 */
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  /** underline：底線指示器；pill：膠囊背景；folder：瀏覽器式資料夾分頁 */
  variant?: "underline" | "pill" | "folder";
  /** 分頁列的無障礙名稱 */
  "aria-label"?: string;
  /** 徽章數字上限，超過顯示 99+ */
  maxCount?: number;
  /** 分頁列的 className */
  listClassName?: string;
  /** 內容區的 className */
  panelClassName?: string;
  className?: string;
}

const panelVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

export function AnimatedTabs<T extends string = string>({
  tabs,
  value,
  defaultValue,
  onValueChange,
  variant = "underline",
  "aria-label": ariaLabel = "Tabs",
  maxCount = 99,
  listClassName,
  panelClassName,
  className,
}: AnimatedTabsProps<T>) {
  const reduceMotion = useReducedMotion();
  const baseId = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const firstEnabled = tabs.find((t) => !t.disabled)?.value;
  const [inner, setInner] = useState<T | undefined>(defaultValue ?? firstEnabled);
  const selected = value ?? inner;
  const activeTab = tabs.find((t) => t.value === selected);

  const select = (next: T) => {
    if (value === undefined) setInner(next);
    if (next !== selected) onValueChange?.(next);
  };

  // 自動啟用模式：焦點移到哪個分頁就切換到哪個
  const move = (from: number, dir: 1 | -1 | "first" | "last") => {
    const n = tabs.length;
    let i = dir === "first" ? -1 : dir === "last" ? n : from;
    const step = dir === "first" ? 1 : dir === "last" ? -1 : dir;
    for (let k = 0; k < n; k++) {
      i = (i + step + n) % n;
      if (!tabs[i].disabled) {
        refs.current[i]?.focus();
        select(tabs[i].value);
        return;
      }
    }
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLButtonElement>) => {
    const map: Record<string, 1 | -1 | "first" | "last"> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      Home: "first",
      End: "last",
    };
    const dir = map[e.key];
    if (dir === undefined) return;
    e.preventDefault();
    move(i, dir);
  };

  const spring = reduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 480, damping: 38 };
  const tabId = (v: string) => `${baseId}-tab-${v}`;
  const panelId = (v: string) => `${baseId}-panel-${v}`;

  return (
    <div className={cn("w-full", className)}>
      <LayoutGroup id={baseId}>
        <div
          role="tablist"
          aria-label={ariaLabel}
          aria-orientation="horizontal"
          className={cn(
            "relative flex items-end",
            variant === "underline" && "gap-1 overflow-x-auto border-b border-border",
            variant === "pill" && "inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-muted p-1",
            // 資料夾不能裁切，指示器要往下蓋住內容區邊框
            variant === "folder" && "z-10 gap-0.5 px-2",
            listClassName,
          )}
        >
          {tabs.map((t, i) => {
            const active = t.value === selected;
            const shown = t.count !== undefined ? (t.count > maxCount ? `${maxCount}+` : String(t.count)) : null;
            return (
              <button
                key={t.value}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                id={tabId(t.value)}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={active ? panelId(t.value) : undefined}
                disabled={t.disabled}
                tabIndex={active || (!activeTab && t.value === firstEnabled) ? 0 : -1}
                onClick={() => select(t.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={cn(
                  "relative isolate inline-flex shrink-0 items-center gap-2 text-sm font-medium whitespace-nowrap transition-colors outline-none select-none",
                  "focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  variant === "underline" && "rounded-t-md px-3 pt-2 pb-2.5",
                  variant === "pill" && "rounded-full px-4 py-1.5",
                  variant === "folder" && "rounded-t-xl px-4 pt-2 pb-2.5",
                )}
              >
                {active && variant === "underline" && (
                  <motion.span
                    layoutId="tab-indicator"
                    aria-hidden="true"
                    className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-primary"
                    transition={spring}
                  />
                )}
                {active && variant === "pill" && (
                  <motion.span
                    layoutId="tab-indicator"
                    aria-hidden="true"
                    className="absolute inset-0 -z-10 rounded-full bg-background shadow-sm ring-1 ring-border/60"
                    transition={spring}
                  />
                )}
                {active && variant === "folder" && (
                  // 資料夾外形：上方圓角，下方延伸 1px 蓋住內容區的上邊框
                  <motion.span
                    layoutId="tab-indicator"
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 -bottom-px -z-10 rounded-t-xl border border-b-0 border-border bg-card"
                    transition={spring}
                  />
                )}
                {!active && variant === "folder" && (
                  <span aria-hidden="true" className="absolute inset-x-0 top-1 bottom-0 -z-20 rounded-t-xl bg-muted/60" />
                )}
                {t.icon && <span aria-hidden="true" className="inline-flex">{t.icon}</span>}
                <span>{t.label}</span>
                {shown !== null && (
                  <span
                    className={cn(
                      "grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] leading-none font-semibold tabular-nums transition-colors",
                      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                      variant === "pill" && !active && "bg-background/70",
                    )}
                  >
                    <span className="sr-only">(</span>
                    {shown}
                    <span className="sr-only">)</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      <div
        className={cn(
          "relative",
          variant === "folder" ? "rounded-xl border border-border bg-card p-5 text-card-foreground" : "pt-4",
          panelClassName,
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {activeTab && (
            <motion.div
              key={activeTab.value}
              id={panelId(activeTab.value)}
              role="tabpanel"
              aria-labelledby={tabId(activeTab.value)}
              tabIndex={0}
              variants={panelVariants}
              initial={reduceMotion ? false : "initial"}
              animate="animate"
              exit={reduceMotion ? undefined : "exit"}
              transition={{ duration: reduceMotion ? 0 : 0.16 }}
              className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {activeTab.content}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
