"use client";

import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/* ---------- 按鈕（同 shadcn Button 的 default 與 outline） ---------- */

const buttonBase =
  "inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";
const buttonVariant = {
  default: "bg-primary text-primary-foreground hover:bg-primary/80",
  outline: "border-border bg-background hover:bg-muted hover:text-foreground",
};
const buttonSize = {
  default: "h-8 gap-1.5 px-2.5",
  sm: "h-7 gap-1 rounded-md px-2.5 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
};

interface StateButtonProps extends Omit<ComponentProps<"button">, "type"> {
  variant?: keyof typeof buttonVariant;
  size?: keyof typeof buttonSize;
  /** 給了就輸出成連結 */
  href?: string;
}

function StateButton({ variant = "default", size = "default", href, className, children, ...props }: StateButtonProps) {
  const cls = cn(buttonBase, buttonVariant[variant], buttonSize[size], className);
  if (href) {
    return (
      <a href={href} className={cls} onClick={props.onClick as ComponentProps<"a">["onClick"]}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={cls} {...props}>
      {children}
    </button>
  );
}

/* ---------- Error ---------- */

export interface ErrorStateProps {
  title?: ReactNode;
  /** 給使用者看的友善訊息；不要傳原始例外或技術訊息 */
  message?: ReactNode;
  onRetry?: () => void;
  labels?: { retry?: ReactNode };
  className?: string;
}

export function ErrorState({ title = "Couldn't load data", message = "Something went wrong. Please try again.", onRetry, labels, className }: ErrorStateProps) {
  return (
    <div role="alert" className={cn("flex flex-col overflow-hidden rounded-xl border border-border bg-card text-sm text-card-foreground", className)}>
      <div className="flex flex-col items-center gap-4 px-5 py-12 text-center">
        <span className="text-destructive [&_svg]:size-6">
          <AlertTriangleIcon />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        </div>
        {onRetry ? (
          <StateButton variant="outline" size="sm" onClick={onRetry}>
            {labels?.retry ?? "Retry"}
          </StateButton>
        ) : null}
      </div>
    </div>
  );
}

/* ---------- 圖示（lucide 形狀，線寬 1.5） ---------- */

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function AlertTriangleIcon() {
  return (
    <svg {...iconProps}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
