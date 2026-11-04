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

export interface StateButtonProps extends Omit<ComponentProps<"button">, "type"> {
  variant?: keyof typeof buttonVariant;
  size?: keyof typeof buttonSize;
  /** 給了就輸出成連結 */
  href?: string;
}

export function StateButton({ variant = "default", size = "default", href, className, children, ...props }: StateButtonProps) {
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

/* ---------- Empty ---------- */

export interface StateLink {
  label: ReactNode;
  href?: string;
  onClick?: () => void;
}

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  /** 1.5 線寬的圖示，預設是收件匣 */
  icon?: ReactNode;
  /** 自訂動作；給了就不輸出內建的雙按鈕 */
  action?: ReactNode;
  /** 「載入範例」主按鈕，讓使用者先看到填好的樣子 */
  onLoadExample?: () => void;
  /** 旁邊的 outline 按鈕，例如「去加成員」 */
  secondary?: StateLink;
  /** start：靠左的版本（標題、說明、按鈕列靠左） */
  align?: "center" | "start";
  labels?: { loadExample?: ReactNode };
  className?: string;
}

export function EmptyState({ title, description, icon, action, onLoadExample, secondary, align = "center", labels, className }: EmptyStateProps) {
  const start = align === "start";
  const builtIn =
    onLoadExample || secondary ? (
      <div className={cn("flex flex-wrap gap-2", start ? "justify-start" : "justify-center")}>
        {onLoadExample && (
          <StateButton onClick={onLoadExample}>
            <SparklesIcon />
            {labels?.loadExample ?? "Load example"}
          </StateButton>
        )}
        {secondary && (
          <StateButton variant="outline" href={secondary.href} onClick={secondary.onClick}>
            {secondary.label}
          </StateButton>
        )}
      </div>
    ) : null;

  return (
    <div className={cn("flex flex-col overflow-hidden rounded-xl border border-dashed border-border bg-transparent text-sm text-card-foreground", className)}>
      <div className={cn("flex flex-col gap-4 px-5 py-16", start ? "items-start text-left" : "items-center text-center")}>
        <span className="text-muted-foreground [&_svg]:size-6">{icon ?? <InboxIcon />}</span>
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          {description ? <p className={cn("mt-1 max-w-sm text-sm text-muted-foreground", !start && "mx-auto")}>{description}</p> : null}
        </div>
        {action ?? builtIn}
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

export function InboxIcon() {
  return (
    <svg {...iconProps}>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

export function UsersIcon() {
  return (
    <svg {...iconProps}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

// 按鈕裡的圖示維持 lucide 預設線寬 2
function SparklesIcon() {
  return (
    <svg {...iconProps} strokeWidth={2}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
      <path d="M4 17v2" />
      <path d="M5 18H3" />
    </svg>
  );
}
