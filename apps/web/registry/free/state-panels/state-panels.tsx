"use client";

import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface StateAction {
  label: ReactNode;
  onClick?: () => void;
  href?: string;
}

// 設計語言（DESIGN.md）：紙邊、墨；狀態色只上在小圖示
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const inkMuted = "text-[#1c1917]/60 dark:text-[#ece7dc]/60";
const bone = "bg-[#e7e0d0]/70 dark:bg-[#38332b]/80";

const primaryClass =
  "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none aria-disabled:cursor-progress aria-disabled:opacity-70";
const linkClass =
  "text-sm font-medium underline decoration-current/30 underline-offset-4 hover:decoration-current focus-visible:decoration-current focus-visible:outline-none";

function ActionControl({ action, className }: { action: StateAction; className: string }) {
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

/* ---------- Empty ---------- */

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  /** 1.5 線寬的圖示，預設是空箱子 */
  icon?: ReactNode;
  action?: StateAction;
  /** 「載入範例」：讓使用者先看到填滿後的樣子 */
  onLoadExample?: () => void;
  labels?: { loadExample?: ReactNode };
  className?: string;
}

export function EmptyState({ title, description, icon, action, onLoadExample, labels, className }: EmptyStateProps) {
  return (
    <div className={cn("rounded-md border border-dashed px-6 py-10 text-center font-sans", edge, ink, className)}>
      <span className={cn("mx-auto flex size-10 items-center justify-center [&_svg]:size-6", inkMuted)}>{icon ?? <BoxIcon />}</span>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      {description && <p className={cn("mx-auto mt-1 max-w-xs text-sm text-pretty", inkMuted)}>{description}</p>}
      {(action || onLoadExample) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-3">
          {action && <ActionControl action={action} className={primaryClass} />}
          {onLoadExample && (
            <button type="button" onClick={onLoadExample} className={linkClass}>
              {labels?.loadExample ?? "Load an example"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Error ---------- */

export interface ErrorStateProps {
  title?: ReactNode;
  description?: ReactNode;
  /** 給客服看的技術細節，收在「Technical details」裡，不直接秀出例外 */
  detail?: string;
  /** 可回傳 Promise；拋錯代表重試仍失敗 */
  onRetry?: () => void | Promise<void>;
  support?: StateAction;
  labels?: {
    retry?: ReactNode;
    retrying?: ReactNode;
    details?: ReactNode;
    stillFailing?: string;
  };
  className?: string;
}

const errorLabels = {
  retry: "Try again",
  retrying: "Trying again",
  details: "Technical details",
  stillFailing: "Still couldn't load. Try again in a moment.",
};

export function ErrorState({
  title = "We couldn't load this",
  description = "Your data is safe. This is usually a brief connection problem.",
  detail,
  onRetry,
  support,
  labels,
  className,
}: ErrorStateProps) {
  const t = { ...errorLabels, ...labels };
  const [retrying, setRetrying] = useState(false);
  const [failedAgain, setFailedAgain] = useState(false);

  async function retry() {
    if (retrying || !onRetry) return;
    setRetrying(true);
    setFailedAgain(false);
    try {
      await onRetry();
    } catch {
      setFailedAgain(true);
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div role="alert" className={cn("rounded-md border px-6 py-8 text-center font-sans", edge, ink, className)}>
      <span className="mx-auto flex size-10 items-center justify-center text-destructive [&_svg]:size-6">
        <AlertIcon />
      </span>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className={cn("mx-auto mt-1 max-w-xs text-sm text-pretty", inkMuted)}>{failedAgain ? t.stillFailing : description}</p>
      {(onRetry || support) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-3">
          {onRetry && (
            <button type="button" onClick={retry} aria-disabled={retrying || undefined} className={primaryClass}>
              {retrying ? t.retrying : t.retry}
            </button>
          )}
          {support && <ActionControl action={support} className={linkClass} />}
        </div>
      )}
      {detail && (
        <details className={cn("mx-auto mt-5 max-w-sm text-left text-xs", inkMuted)}>
          <summary className="cursor-pointer text-center select-none hover:underline">{t.details}</summary>
          <pre className={cn("mt-2 overflow-x-auto rounded-md border p-3 font-mono text-[11px] leading-relaxed break-all whitespace-pre-wrap", edge)}>
            {detail}
          </pre>
        </details>
      )}
    </div>
  );
}

/* ---------- Loading ---------- */

export interface LoadingStateProps {
  /** 要模擬的列數，讓骨架和真正內容同高，載入後不跳版 */
  rows?: number;
  /** 每列左側是否有縮圖 */
  media?: boolean;
  /** 超過這個毫秒數才顯示「還在載入」 */
  slowAfter?: number;
  labels?: { loading?: string; slow?: ReactNode };
  className?: string;
}

// 固定的寬度序列，伺服器與瀏覽器渲染一致
const widths = ["w-3/5", "w-2/5", "w-1/2", "w-2/3", "w-1/3"];

export function LoadingState({ rows = 3, media = true, slowAfter = 4000, labels, className }: LoadingStateProps) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setSlow(true), slowAfter);
    return () => clearTimeout(id);
  }, [slowAfter]);

  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn("rounded-md border px-4 py-2 font-sans", edge, ink, className)}
    >
      <span className="sr-only">{labels?.loading ?? "Loading"}</span>
      <ul aria-hidden="true" className={cn("divide-y", "divide-[#e7e0d0] dark:divide-[#38332b]")}>
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="flex items-center gap-3 py-3">
            {media && <span className={cn("size-10 shrink-0 rounded-md", bone)} />}
            <span className="flex min-w-0 flex-1 flex-col gap-2">
              <span className={cn("h-3 rounded-sm", bone, widths[i % widths.length])} />
              <span className={cn("h-2.5 rounded-sm opacity-70", bone, widths[(i + 2) % widths.length])} />
            </span>
            <span className={cn("h-3 w-12 shrink-0 rounded-sm", bone)} />
          </li>
        ))}
      </ul>
      {slow && <p className={cn("py-2 text-center text-xs", inkMuted)}>{labels?.slow ?? "Still loading, thanks for waiting"}</p>}
    </div>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5Z" />
      <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5.5M12 16.25v.01" />
    </svg>
  );
}
