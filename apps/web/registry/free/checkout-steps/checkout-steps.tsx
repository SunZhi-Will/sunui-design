"use client";

import { LayoutGroup, motion, useReducedMotion, type Transition } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

/*
 * Checkout steps: the steps remember their answers.
 * - A completed step collapses into a one-line answer ("7-Eleven pickup", "Visa ·· 4242") with a small check; pass onStepClick to make it clickable for editing
 * - The current step expands into a labelled pill (the only accent colour, primary)
 * - Future steps are reduced to quiet numbered ticks
 * On a step change the same track morphs (layout, gentle spring) and the ink line below advances with it; the left end is an anchor and does not move.
 * When the container is narrower than 420px it switches to "2/4 Payment" plus a segmented bar; completed answers stay clickable. Requires Tailwind v4 container queries.
 * All colours use shadcn tokens, so they follow the site's light and dark themes.
 */

export type CheckoutStepsTheme = "light" | "dark" | "system";

const gentle: Transition = { type: "spring", stiffness: 240, damping: 30 };
const instant: Transition = { duration: 0 };

export interface CheckoutStepsProps {
  /** Step names, for example ["Review order", "Delivery", "Payment", "Done"] */
  steps: string[];
  /** Index of the current step (zero-based); earlier steps show as completed */
  current: number;
  /** Answer for each completed step, for example ["2 items · NT$1,280", "7-Eleven pickup"]; falls back to the step name when missing */
  summaries?: (ReactNode | null | undefined)[];
  /** When given, completed steps become buttons that jump back to that step */
  onStepClick?: (index: number) => void;
  /** Accessible name of the ol; takes precedence over labels.label */
  label?: string;
  /** Extra text for screen readers on completed steps; takes precedence over labels.done */
  doneLabel?: string;
  /**
   * system (default) and light follow the site's tokens; dark adds a `dark` class
   * on the outer element so shadcn's .dark tokens apply inside the component. The component itself has no background.
   */
  theme?: CheckoutStepsTheme;
  /** UI language: en, zh-TW, zh-CN, ja. Tags such as zh-Hant-HK or ja-JP are also accepted */
  locale?: string;
  /** Override built-in strings; takes precedence over locale */
  labels?: Partial<CheckoutStepsLabels>;
  className?: string;
  style?: CSSProperties;
}

export interface CheckoutStepsLabels {
  label: string;
  done: string;
  /** Action prefix for completed-step buttons, for example "Edit" */
  edit?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Map any language tag to one of the four built-in languages; everything else falls back to English */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, Required<CheckoutStepsLabels>> = {
  en: { label: "Checkout steps", done: "completed", edit: "Edit" },
  "zh-TW": { label: "結帳步驟", done: "已完成", edit: "修改" },
  "zh-CN": { label: "结账步骤", done: "已完成", edit: "修改" },
  ja: { label: "購入手続きのステップ", done: "完了", edit: "変更" },
};

// Check mark with a 1.5 stroke width
function CheckIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

interface DoneProps {
  index: number;
  name: string;
  summary: ReactNode;
  onStepClick?: (index: number) => void;
  sep: { comma: string; colon: string };
  doneLabel: string;
  editLabel: string;
  className?: string;
}

/** A completed step: a small check plus the answer; a button when onStepClick is set */
function DoneStep({ index, name, summary, onStepClick, sep, doneLabel, editLabel, className }: DoneProps) {
  const hasSummary = summary != null && summary !== false && summary !== "";
  const body = (
    <>
      <CheckIcon />
      <span className="min-w-0 truncate">
        {hasSummary && (
          <span className="sr-only">
            {onStepClick ? `${editLabel} ` : ""}
            {name}
            {sep.colon}
          </span>
        )}
        {!hasSummary && onStepClick && <span className="sr-only">{editLabel} </span>}
        {hasSummary ? summary : name}
        <span className="sr-only">
          {sep.comma}
          {doneLabel}
        </span>
      </span>
    </>
  );
  const base = "flex min-w-0 items-center gap-1 text-muted-foreground";
  if (!onStepClick) {
    return (
      <span className={cn(base, className)} title={name}>
        {body}
      </span>
    );
  }
  return (
    <button
      type="button"
      title={name}
      onClick={() => onStepClick(index)}
      className={cn(
        base,
        "cursor-pointer rounded-md outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {body}
    </button>
  );
}

/** Checkout steps: completed steps keep their answer, the current step is a pill, future steps are ticks. */
export function CheckoutSteps({
  steps,
  current,
  summaries,
  onStepClick,
  label: labelProp,
  doneLabel: doneLabelProp,
  theme = "system",
  locale = "en",
  labels,
  className,
  style,
}: CheckoutStepsProps) {
  const reduce = useReducedMotion();
  const loc = resolveLocale(locale);
  const t = { ...MESSAGES[loc], ...labels };
  const label = labelProp ?? t.label;
  const doneLabel = doneLabelProp ?? t.done;
  const editLabel = t.edit ?? MESSAGES[loc].edit;
  const sep = loc === "en" ? { comma: ", ", colon: ": " } : { comma: "，", colon: "：" };
  const total = steps.length;
  const at = Math.min(Math.max(current, 0), Math.max(total - 1, 0));
  const spring = reduce ? instant : gentle;

  const done = (i: number, cls?: string) => (
    <DoneStep
      index={i}
      name={steps[i]}
      summary={summaries?.[i]}
      onStepClick={onStepClick}
      sep={sep}
      doneLabel={doneLabel}
      editLabel={editLabel}
      className={cls}
    />
  );

  return (
    <div className={cn("@container w-full min-w-0 text-[13px]", theme === "dark" && "dark", className)} style={style}>
      {/* Wide layout: one morphing track */}
      <LayoutGroup>
        <ol aria-label={label} className="relative hidden min-w-0 items-center border-b border-border @min-[420px]:flex">
          {steps.map((s, i) => {
            const state = i < at ? "done" : i === at ? "current" : "next";
            return (
              <motion.li
                key={i}
                layout={!reduce}
                transition={spring}
                aria-current={state === "current" ? "step" : undefined}
                className={cn(
                  "relative flex h-10 items-center px-1.5",
                  state === "done" ? "min-w-0 shrink" : "shrink-0",
                )}
              >
                <motion.span layout={reduce ? false : "position"} transition={spring} className="flex min-w-0 items-center">
                  {state === "done" && done(i, "max-w-[9rem]")}
                  {state === "current" && (
                    <span
                      className="inline-flex h-7 items-center gap-1.5 rounded-full bg-primary pr-3 pl-2 font-medium text-primary-foreground"
                    >
                      <span className="tabular-nums opacity-70">{i + 1}</span>
                      <span className="whitespace-nowrap">{s}</span>
                    </span>
                  )}
                  {state === "next" && (
                    <span className="grid size-5 place-items-center rounded-full border border-border text-[11px] text-muted-foreground tabular-nums">
                      <span aria-hidden>{i + 1}</span>
                      <span className="sr-only">{s}</span>
                    </span>
                  )}
                </motion.span>
                {/* Ink line: filled under completed and current steps, advancing left to right */}
                <motion.span
                  aria-hidden
                  initial={false}
                  animate={{ scaleX: state === "next" ? 0 : 1 }}
                  transition={spring}
                  className="absolute inset-x-0 -bottom-px h-px origin-left bg-foreground"
                />
              </motion.li>
            );
          })}
        </ol>
      </LayoutGroup>

      {/* Narrow layout: "2/4 Payment" plus a segmented bar, completed answers listed below */}
      <div className="@min-[420px]:hidden">
        <p aria-hidden className="flex min-w-0 items-baseline gap-2">
          <span className="text-muted-foreground tabular-nums">
            {at + 1}/{total}
          </span>
          <span className="truncate font-medium text-foreground">{steps[at]}</span>
        </p>
        <div aria-hidden className="mt-2 flex gap-1">
          {steps.map((_, i) => (
            <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-border">
              <motion.span
                initial={false}
                animate={{ scaleX: i <= at ? 1 : 0 }}
                transition={spring}
                className={cn("block h-full origin-left", i === at ? "bg-primary" : "bg-foreground")}
              />
            </span>
          ))}
        </div>
        <ol aria-label={label} className="mt-2 flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-[12px]">
          {steps.map((s, i) =>
            i < at ? (
              <li key={i} className="flex min-w-0 max-w-full">
                {done(i, "max-w-full")}
              </li>
            ) : (
              <li key={i} aria-current={i === at ? "step" : undefined} className="sr-only">
                {s}
              </li>
            ),
          )}
        </ol>
      </div>
    </div>
  );
}
