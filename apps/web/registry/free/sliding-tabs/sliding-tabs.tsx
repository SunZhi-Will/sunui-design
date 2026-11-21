"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  gentle: { type: "spring", stiffness: 240, damping: 30 },
} as const;

/** Brand spot colour: defaults to the theme's --primary; set --sunui-spot to use your own brand colour. Only for selected, offers and current progress */
const spotBg = "bg-[color:var(--sunui-spot,var(--primary))]";
const spotBorder = "border-[color:var(--sunui-spot,var(--primary))]";
const spotOn = "text-[color:var(--sunui-spot-foreground,var(--primary-foreground))]";

/* folder: the selected tab is a raised surface joined to the panel below in one shape.
   The outline is only the 1px e1 edge (--tab-edge); the selected tab covers the panel's top edge, and inverted corners join it to the panel on both sides */
const edge = "[--tab-edge:rgb(0_0_0/0.06)] dark:[--tab-edge:rgb(255_255_255/0.08)]";
const folderPanel = "rounded-xl bg-card text-card-foreground shadow-[0_0_0_1px_var(--tab-edge),0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[0_0_0_1px_var(--tab-edge)]";
// Inverted corner: circle centred at the top corner of the corner square, outside filled with panel colour, edge line drawn on the circumference
const flare = (at: string) =>
  `radial-gradient(circle at ${at}, transparent 7.5px, var(--tab-edge) 7.5px, var(--tab-edge) 8.5px, var(--card) 8.5px)`;

/** Badge style matches notify-badge: rounded pill, tabular-nums, 99+ above 99 */
const badgeTones = {
  muted: "bg-foreground/[0.07] text-muted-foreground",
  spot: cn(spotBg, spotOn),
  // Already on brand colour (selected filter chip): one step lighter background, text follows the chip
  onSpot: "bg-background/25",
};

function CountBadge({ count, tone }: { count: number; tone: keyof typeof badgeTones }) {
  return (
    <span
      className={cn(
        "relative flex h-[1.15rem] min-w-[1.15rem] items-center justify-center rounded-full px-1 text-[0.68rem] font-semibold leading-none tabular-nums transition-colors",
        badgeTones[tone],
      )}
    >
      <span className="sr-only">(</span>
      {count > 99 ? "99+" : count}
      <span className="sr-only">)</span>
    </span>
  );
}

export interface SlidingTabItem {
  value: string;
  label: ReactNode;
  /** Small number after the label, e.g. a filter result count */
  count?: number;
  disabled?: boolean;
  /** When given, becomes the tab content; omit when used only as a selector */
  content?: ReactNode;
  /** Icon before the label. Required for dock, where only the selected tab shows its label */
  icon?: ReactNode;
}

type Single = { multiple?: false; value?: string; defaultValue?: string; onValueChange?: (value: string) => void };
type Multi = { multiple: true; value?: string[]; defaultValue?: string[]; onValueChange?: (value: string[]) => void };

export type SlidingTabsProps = (Single | Multi) & {
  items: SlidingTabItem[];
  /** underline: underlined tabs; segment: segmented control; chips: filter chips (works with multiple); folder: browser-style folder tabs, the selected tab joins the content panel; dock: icon-only pill bar where the selected tab grows to show its label, for app tab bars and toolbars */
  variant?: "underline" | "segment" | "chips" | "folder" | "dock";
  /** Style of count: inline is a muted number beside the label; badge is a small pill, brand spot colour when selected. folder defaults to badge, others to inline */
  countStyle?: "inline" | "badge";
  /** Segmented control fills the width */
  fullWidth?: boolean;
  size?: "sm" | "md";
  "aria-label"?: string;
  className?: string;
  /** Class applied to the content panel */
  contentClassName?: string;
};

export function SlidingTabs(props: SlidingTabsProps) {
  const { items, variant = "underline", fullWidth = false, size = "md", className, contentClassName } = props;
  const folder = variant === "folder";
  const dock = variant === "dock";
  const countStyle = props.countStyle ?? (folder ? "badge" : "inline");
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
  const pad = dock ? (size === "sm" ? "h-8 px-2 text-xs" : "h-10 px-3 text-sm") : size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm";

  return (
    <div className={cn(folder && edge, className)}>
      <LayoutGroup id={group}>
        <div
          ref={listRef}
          role={role}
          aria-label={props["aria-label"]}
          className={cn(
            "relative flex max-w-full",
            variant === "underline" && "gap-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] border-b border-foreground/10",
            variant === "segment" && cn("rounded-xl border border-foreground/10 bg-card p-1 shadow-[0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]", fullWidth ? "w-full" : "w-fit"),
            variant === "chips" && "flex-wrap gap-2",
            folder && "z-10 items-end gap-1 overflow-x-auto overflow-y-hidden px-3 pt-1 [scrollbar-width:none]",
            dock && "w-fit gap-0.5 rounded-full border border-foreground/10 bg-card p-1 shadow-[0_1px_2px_rgb(0_0_0/0.05),0_8px_24px_-12px_rgb(0_0_0/0.12)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]",
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
                  "relative inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap font-medium outline-offset-2 transition-[color,background-color,border-color,opacity,scale] focus-visible:outline-2 disabled:pointer-events-none disabled:opacity-40 motion-safe:active:scale-[0.97]",
                  pad,
                  variant === "segment" && fullWidth && "flex-1",
                  variant === "chips" || dock ? cn("rounded-full", variant === "chips" && "border") : folder ? "rounded-t-lg" : "rounded-md",
                  dock && "gap-0",
                  folder && !on && "hover:bg-foreground/[0.04]",
                  variant === "chips" && (on ? spotBorder : "border-foreground/10 hover:border-foreground/40"),
                  on ? (variant === "chips" ? spotOn : "text-foreground") : "text-muted-foreground hover:text-foreground",
                )}
              >
                {on && variant === "underline" && (
                  <motion.span layoutId="ind" transition={t} className={cn("absolute inset-x-2 bottom-0 h-0.5 rounded-full", spotBg)} />
                )}
                {on && variant === "segment" && (
                  <motion.span
                    layoutId="ind"
                    transition={t}
                    className="absolute inset-0 rounded-[5px] border border-foreground/10 bg-background shadow-[0_1px_2px_rgb(0_0_0/0.05),0_4px_12px_-6px_rgb(0_0_0/0.06)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
                  />
                )}
                {on && folder && (
                  // Raised surface: rounded top, bottom edge line cut so it joins the panel, an inverted corner on each side
                  <motion.span
                    layoutId="ind"
                    transition={t}
                    aria-hidden="true"
                    className="absolute inset-0 rounded-t-lg bg-card shadow-[0_0_0_1px_var(--tab-edge)] [clip-path:inset(-2px_-12px_0_-12px)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_var(--tab-edge)]"
                  >
                    <motion.span layout className="absolute -left-2 bottom-0 size-2" style={{ background: flare("0 0") }} />
                    <motion.span layout className="absolute -right-2 bottom-0 size-2" style={{ background: flare("100% 0") }} />
                  </motion.span>
                )}
                {on && dock && (
                  <motion.span layoutId="ind" transition={t} aria-hidden="true" className="absolute inset-0 rounded-full bg-foreground/[0.07] dark:bg-foreground/[0.1]" />
                )}
                {variant === "chips" && (
                  <motion.span
                    initial={false}
                    animate={{ opacity: on ? 1 : 0 }}
                    transition={{ duration: reduce ? 0 : 0.15 }}
                    className={cn("absolute inset-0 rounded-full", spotBg)}
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
                {item.icon && (
                  <span aria-hidden="true" className="relative inline-flex size-5 shrink-0 items-center justify-center [&_svg]:size-[18px]">
                    {item.icon}
                  </span>
                )}
                {dock ? (
                  // Only the selected tab shows its label; the others keep it for screen readers. The width animates so the pill grows instead of jumping
                  <>
                    <AnimatePresence initial={false}>
                      {on && (
                        <motion.span
                          key="label"
                          aria-hidden="true"
                          initial={reduce ? false : { width: 0, opacity: 0 }}
                          animate={{ width: "auto", opacity: 1 }}
                          exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { width: 0, opacity: 0 }}
                          transition={t}
                          className="relative overflow-hidden"
                        >
                          <span className="block pl-1.5 pr-1">{item.label}</span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <span className="sr-only">{item.label}</span>
                  </>
                ) : (
                  <span className="relative">{item.label}</span>
                )}
                {item.count !== undefined &&
                  (countStyle === "badge" ? (
                    <CountBadge count={item.count} tone={!on ? "muted" : variant === "chips" ? "onSpot" : "spot"} />
                  ) : (
                    <span className="relative tabular-nums opacity-60">{item.count}</span>
                  ))}
              </button>
            );
          })}
        </div>
      </LayoutGroup>
      {hasContent && (
        <div id={`${group}-panel`} role="tabpanel" tabIndex={0} className={cn("relative overflow-hidden outline-none", folder && folderPanel, contentClassName)}>
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
