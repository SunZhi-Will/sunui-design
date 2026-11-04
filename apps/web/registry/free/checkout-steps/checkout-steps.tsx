"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface CheckoutStep {
  id: string;
  label: ReactNode;
  /** 步驟下方的小字說明 */
  hint?: ReactNode;
}

export interface CheckoutStepsLabels {
  /** 窄螢幕的 eyebrow，例如「Step 2 of 4」 */
  stepOf?: (n: number, total: number) => ReactNode;
  /** 已完成步驟按鈕的無障礙名稱 */
  goTo?: (label: string) => string;
  completed?: string;
  nav?: string;
}

export interface CheckoutStepsProps {
  steps: CheckoutStep[];
  /** 目前步驟的 index 或 id；大於最後一步（或設為 steps.length）代表全部完成 */
  current: number | string;
  /** 提供時，已完成的步驟變成可點的按鈕，用來返回修改 */
  onStepClick?: (index: number, step: CheckoutStep) => void;
  labels?: CheckoutStepsLabels;
  className?: string;
}

const defaultLabels: Required<CheckoutStepsLabels> = {
  stepOf: (n, total) => <>Step {n} of {total}</>,
  goTo: (label) => `Go back to ${label}`,
  completed: "completed",
  nav: "Checkout progress",
};

const springs = {
  gentle: { type: "spring", stiffness: 240, damping: 30 },
} as const;

export function CheckoutSteps({ steps, current, onStepClick, labels, className }: CheckoutStepsProps) {
  const t = { ...defaultLabels, ...labels };
  const reduce = useReducedMotion() ?? false;
  const transition = reduce ? { duration: 0 } : springs.gentle;

  const found = typeof current === "number" ? current : steps.findIndex((s) => s.id === current);
  const index = Math.max(0, found === -1 ? 0 : Math.min(found, steps.length));
  const allDone = index >= steps.length;
  const active = steps[Math.min(index, steps.length - 1)];

  return (
    <nav aria-label={t.nav} className={cn("w-full text-foreground", className)}>
      {/* 窄螢幕：單行摘要 + 分段進度條 */}
      <div className="sm:hidden">
        <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase tabular-nums">
          {t.stepOf(Math.min(index + 1, steps.length), steps.length)}
        </p>
        <p className="mt-0.5 text-sm font-medium">{active?.label}</p>
        <div aria-hidden="true" className="mt-2 flex gap-1">
          {steps.map((s, i) => (
            <span key={s.id} className="relative h-1 flex-1 overflow-hidden rounded-full bg-border">
              <motion.span
                className="absolute inset-0 origin-left bg-primary"
                initial={false}
                animate={{ scaleX: i < index || (i === index && !allDone) ? 1 : 0, opacity: i === index && !allDone ? 0.5 : 1 }}
                transition={transition}
              />
            </span>
          ))}
        </div>
      </div>

      <ol className="hidden items-start sm:flex">
        {steps.map((s, i) => {
          const done = i < index;
          const isCurrent = i === index;
          const clickable = done && !!onStepClick;
          const plain = typeof s.label === "string" ? s.label : s.id;

          const marker = (
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium tabular-nums transition-colors",
                done && "border-primary bg-primary text-primary-foreground",
                isCurrent && "border-primary text-foreground ring-2 ring-primary/20",
                !done && !isCurrent && "border-border text-muted-foreground",
              )}
            >
              {done ? (
                <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <motion.path
                    d="m3.5 8.5 3 3 6-7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={reduce ? false : { pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={transition}
                  />
                </svg>
              ) : (
                i + 1
              )}
            </span>
          );

          const text = (
            <span className="min-w-0 text-left">
              <span
                className={cn(
                  "block truncate text-sm",
                  isCurrent ? "font-semibold" : done ? "font-medium" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
              {s.hint && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{s.hint}</span>}
            </span>
          );

          return (
            <li
              key={s.id}
              aria-current={isCurrent ? "step" : undefined}
              className={cn("flex min-w-0 items-start", i < steps.length - 1 && "flex-1")}
            >
              {clickable ? (
                <button
                  type="button"
                  onClick={() => onStepClick?.(i, s)}
                  aria-label={t.goTo(plain)}
                  className="group flex min-w-0 items-start gap-2.5 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {marker}
                  <span className="min-w-0 pt-1 group-hover:underline group-hover:underline-offset-4">{text}</span>
                </button>
              ) : (
                <span className="flex min-w-0 items-start gap-2.5">
                  {marker}
                  <span className="min-w-0 pt-1">
                    {text}
                    {done && <span className="sr-only">, {t.completed}</span>}
                  </span>
                </span>
              )}

              {i < steps.length - 1 && (
                <span aria-hidden="true" className="relative mx-3 mt-3.5 h-px min-w-6 flex-1 bg-border">
                  <motion.span
                    className="absolute inset-0 origin-left bg-primary"
                    initial={false}
                    animate={{ scaleX: done ? 1 : 0 }}
                    transition={transition}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
