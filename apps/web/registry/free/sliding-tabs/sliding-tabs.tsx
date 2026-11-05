"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  gentle: { type: "spring", stiffness: 240, damping: 30 },
} as const;

export interface SlidingTabItem {
  value: string;
  label: ReactNode;
  /** 跟在標籤後的小數字，例如篩選結果數 */
  count?: number;
  disabled?: boolean;
  /** 給了就成為分頁內容；只做選擇器時不用給 */
  content?: ReactNode;
}

type Single = { multiple?: false; value?: string; defaultValue?: string; onValueChange?: (value: string) => void };
type Multi = { multiple: true; value?: string[]; defaultValue?: string[]; onValueChange?: (value: string[]) => void };

export type SlidingTabsProps = (Single | Multi) & {
  items: SlidingTabItem[];
  /** underline：分頁底線；segment：分段控制；chips：篩選籤（可配 multiple） */
  variant?: "underline" | "segment" | "chips";
  /** 分段控制撐滿寬度 */
  fullWidth?: boolean;
  size?: "sm" | "md";
  "aria-label"?: string;
  className?: string;
  /** 套在內容面板上的 class */
  contentClassName?: string;
};

export function SlidingTabs(props: SlidingTabsProps) {
  const { items, variant = "underline", fullWidth = false, size = "md", className, contentClassName } = props;
  const reduce = useReducedMotion();
  const group = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const multiple = props.multiple === true;
  const first = items.find((i) => !i.disabled)?.value ?? "";
  const [innerSingle, setInnerSingle] = useState<string>(!multiple ? (props.defaultValue as string | undefined) ?? first : "");
  const [innerMulti, setInnerMulti] = useState<string[]>(multiple ? (props.defaultValue as string[] | undefined) ?? [] : []);
  const selected: string[] = multiple ? ((props.value as string[] | undefined) ?? innerMulti) : [(props.value as string | undefined) ?? innerSingle];
  const [dir, setDir] = useState(1);
  const hasContent = !multiple && items.some((i) => i.content !== undefined);
  const role = multiple ? "group" : hasContent ? "tablist" : "radiogroup";
  const t = reduce ? { duration: 0 } : springs.snappy;

  const choose = (value: string) => {
    if (multiple) {
      const next = selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value];
      if (props.value === undefined) setInnerMulti(next);
      (props.onValueChange as ((v: string[]) => void) | undefined)?.(next);
      return;
    }
    const from = items.findIndex((i) => i.value === selected[0]);
    const to = items.findIndex((i) => i.value === value);
    setDir(to >= from ? 1 : -1);
    if (props.value === undefined) setInnerSingle(value);
    (props.onValueChange as ((v: string) => void) | undefined)?.(value);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(e.key in keys) && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const enabled = items.map((it, i) => (it.disabled ? -1 : i)).filter((i) => i >= 0);
    let pos = enabled.indexOf(index);
    if (e.key === "Home") pos = 0;
    else if (e.key === "End") pos = enabled.length - 1;
    else pos = (pos + keys[e.key] + enabled.length) % enabled.length;
    const next = enabled[pos];
    listRef.current?.querySelectorAll<HTMLButtonElement>("[data-tab]")[next]?.focus();
    if (!multiple) choose(items[next].value);
  };

  const active = items.find((i) => i.value === selected[0]);
  const pad = size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm";

  return (
    <div className={className}>
      <LayoutGroup id={group}>
        <div
          ref={listRef}
          role={role}
          aria-label={props["aria-label"]}
          className={cn(
            "relative flex max-w-full",
            variant === "underline" && "gap-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] border-b border-[#e7e0d0] dark:border-[#38332b]",
            variant === "segment" && cn("rounded-md border border-[#e7e0d0] bg-[#faf7f0] p-1 dark:border-[#38332b] dark:bg-[#1f1c18]", fullWidth ? "w-full" : "w-fit"),
            variant === "chips" && "flex-wrap gap-2",
          )}
        >
          {items.map((item, index) => {
            const on = selected.includes(item.value);
            const focusable = multiple || on || (!items.some((i) => selected.includes(i.value)) && item.value === first);
            return (
              <button
                key={item.value}
                type="button"
                data-tab=""
                role={multiple ? undefined : hasContent ? "tab" : "radio"}
                aria-selected={hasContent ? on : undefined}
                aria-checked={!multiple && !hasContent ? on : undefined}
                aria-pressed={multiple ? on : undefined}
                aria-controls={hasContent ? `${group}-panel` : undefined}
                tabIndex={focusable ? 0 : -1}
                disabled={item.disabled}
                onClick={() => choose(item.value)}
                onKeyDown={(e) => onKeyDown(e, index)}
                className={cn(
                  "relative inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap font-medium outline-offset-2 transition-colors focus-visible:outline-2 disabled:pointer-events-none disabled:opacity-40",
                  pad,
                  variant === "segment" && fullWidth && "flex-1",
                  variant === "chips" ? "rounded-full border" : "rounded-md",
                  variant === "chips" && (on ? "border-[#1c1917] dark:border-[#ece7dc]" : "border-[#e7e0d0] hover:border-[#1c1917]/40 dark:border-[#38332b]"),
                  on ? (variant === "chips" ? "text-[#faf7f0] dark:text-[#1f1c18]" : "text-[#1c1917] dark:text-[#ece7dc]") : "text-[#1c1917]/55 hover:text-[#1c1917] dark:text-[#ece7dc]/55 dark:hover:text-[#ece7dc]",
                )}
              >
                {on && variant === "underline" && (
                  <motion.span layoutId="ind" transition={t} className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#1c1917] dark:bg-[#ece7dc]" />
                )}
                {on && variant === "segment" && (
                  <motion.span
                    layoutId="ind"
                    transition={t}
                    className="absolute inset-0 rounded-[5px] border border-[#e7e0d0] bg-background shadow-[0_1px_0_rgb(0_0_0/0.04)] dark:border-[#38332b]"
                  />
                )}
                {variant === "chips" && (
                  <motion.span
                    initial={false}
                    animate={{ opacity: on ? 1 : 0 }}
                    transition={{ duration: reduce ? 0 : 0.15 }}
                    className="absolute inset-0 rounded-full bg-[#1c1917] dark:bg-[#ece7dc]"
                  />
                )}
                <AnimatePresence initial={false}>
                  {variant === "chips" && multiple && on && (
                    <motion.svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="relative size-3.5"
                      aria-hidden="true"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 14, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={reduce ? { duration: 0 } : springs.snappy}
                    >
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </motion.svg>
                  )}
                </AnimatePresence>
                <span className="relative">{item.label}</span>
                {item.count !== undefined && <span className="relative tabular-nums opacity-60">{item.count}</span>}
              </button>
            );
          })}
        </div>
      </LayoutGroup>
      {hasContent && (
        <div id={`${group}-panel`} role="tabpanel" tabIndex={0} className={cn("relative overflow-hidden outline-none", contentClassName)}>
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.div
              key={active?.value}
              custom={dir}
              variants={{
                enter: (d: number) => (reduce ? { opacity: 1 } : { opacity: 0, x: 16 * d }),
                center: { opacity: 1, x: 0 },
                exit: (d: number) => (reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, x: -16 * d }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={reduce ? { duration: 0 } : springs.gentle}
            >
              {active?.content}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
