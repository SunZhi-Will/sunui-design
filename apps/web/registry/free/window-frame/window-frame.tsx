import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type WindowFrameVariant = "mac" | "browser" | "phone";
export type WindowFrameTone = "neutral" | "success" | "danger" | "brand";

export interface WindowFrameProps {
  variant?: WindowFrameVariant;
  /** mac 視窗置中的標題 */
  title?: ReactNode;
  /** browser 網址列文字 */
  url?: string;
  /** 標題列右側插槽 */
  right?: ReactNode;
  /** 只用 1px 邊框顏色表示示範狀態 */
  tone?: WindowFrameTone;
  caption?: ReactNode;
  /** 內容區高度（超出時在框內捲動），例如 320 或 "20rem" */
  height?: number | string;
  children?: ReactNode;
  className?: string;
}

// 設計語言（DESIGN.md）：紙、紙邊、墨
const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const inkMuted = "text-[#1c1917]/60 dark:text-[#ece7dc]/60";

const toneBorder: Record<WindowFrameTone, string> = {
  neutral: edge,
  success: "border-emerald-600/70 dark:border-emerald-400/60",
  danger: "border-destructive/70",
  brand: "border-primary",
};

const toneIcon: Partial<Record<WindowFrameTone, ReactNode>> = {
  success: <path d="m3.5 8.5 3 3 6-7" className="text-emerald-700 dark:text-emerald-400" />,
  danger: <path d="M8 4.5v4.5M8 11.5v.01M8 1.75 14.5 13.5h-13Z" className="text-destructive" />,
};

/** 中性灰的三個點，不用紅黃綠，避免多出強調色 */
function Dots() {
  return (
    <span aria-hidden="true" className={cn("flex shrink-0 gap-1.5", inkMuted)}>
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-2.5 rounded-full border border-current opacity-60" />
      ))}
    </span>
  );
}

export function WindowFrame({
  variant = "browser",
  title,
  url,
  right,
  tone = "neutral",
  caption,
  height,
  children,
  className,
}: WindowFrameProps) {
  const bodyStyle: CSSProperties | undefined = height === undefined ? undefined : { height };
  const border = toneBorder[tone];

  let frame: ReactNode;

  if (variant === "phone") {
    frame = (
      <div className={cn("mx-auto w-[16rem] max-w-full rounded-[2rem] border p-2", paper, border)}>
        <div aria-hidden="true" className="flex justify-center pt-1 pb-2">
          <span className="h-1.5 w-16 rounded-full bg-current opacity-20" />
        </div>
        <div
          className={cn("overflow-auto rounded-[1.4rem] border bg-card text-card-foreground", edge)}
          style={bodyStyle ?? { aspectRatio: "9 / 17" }}
        >
          {children}
        </div>
        <div aria-hidden="true" className="flex justify-center pt-2 pb-1">
          <span className="h-1 w-20 rounded-full bg-current opacity-25" />
        </div>
      </div>
    );
  } else {
    frame = (
      <div className={cn("w-full overflow-hidden rounded-md border", border)}>
        <div className={cn("flex h-9 items-center gap-3 border-b px-3", paper, edge)}>
          <Dots />
          {variant === "browser" ? (
            <span className={cn("flex h-6 min-w-0 flex-1 items-center gap-1.5 rounded-[4px] border px-2", edge, "bg-white/60 dark:bg-black/20")}>
              <svg viewBox="0 0 16 16" aria-hidden="true" className={cn("size-3 shrink-0", inkMuted)} fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3.5" y="7" width="9" height="6.5" rx="1" />
                <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
              </svg>
              <span className="truncate font-mono text-[11px] tracking-[0.04em]">{url}</span>
            </span>
          ) : (
            <span className="min-w-0 flex-1 truncate text-center font-mono text-xs tracking-[0.06em]">{title}</span>
          )}
          {/* mac 標題置中：右側沒內容時補一個與點同寬的空位 */}
          {right ? <span className="flex shrink-0 items-center">{right}</span> : variant === "mac" && <span aria-hidden="true" className="w-[2.625rem] shrink-0" />}
        </div>
        <div className="overflow-auto bg-card text-card-foreground" style={bodyStyle}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <figure className={cn("w-full", ink, className)}>
      {frame}
      {caption && (
        <figcaption className={cn("mt-2 flex items-center gap-1.5 text-xs", variant === "phone" && "justify-center", inkMuted)}>
          {toneIcon[tone] && (
            <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {toneIcon[tone]}
            </svg>
          )}
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
