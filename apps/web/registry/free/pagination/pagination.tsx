"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type PageRangeItem = number | "start-ellipsis" | "end-ellipsis";

/**
 * 產生頁碼序列：永遠包含首頁、末頁、目前頁與前後 siblings 頁，其餘以省略號代替。
 * 輸出長度固定（頁數夠多時為 siblings * 2 + 5），切頁時版面不會跳動。
 * @example getPageRange(6, 12) // [1, "start-ellipsis", 5, 6, 7, "end-ellipsis", 12]
 */
export function getPageRange(current: number, total: number, siblings = 1): PageRangeItem[] {
  const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  if (total <= 0) return [];
  const slots = siblings * 2 + 5;
  if (total <= slots) return range(1, total);
  const page = Math.min(Math.max(current, 1), total);
  const left = Math.max(page - siblings, 1);
  const right = Math.min(page + siblings, total);
  const showLeft = left > 3;
  const showRight = right < total - 2;
  const edgeCount = slots - 2;
  if (!showLeft) return [...range(1, edgeCount), "end-ellipsis", total];
  if (!showRight) return [1, "start-ellipsis", ...range(total - edgeCount + 1, total)];
  return [1, "start-ellipsis", ...range(left, right), "end-ellipsis", total];
}

export interface PaginationLabels {
  nav?: string;
  previous?: ReactNode;
  next?: ReactNode;
  /** 頁碼的無障礙名稱 */
  page?: (n: number) => string;
  /** 緊湊模式的文字，例如「3 / 12」 */
  compact?: (page: number, total: number) => ReactNode;
}

export interface PaginationProps {
  total: number;
  /** 受控：目前頁（從 1 開始） */
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  /** 提供時每頁渲染成 <a href>，讓搜尋引擎能爬到每一頁 */
  getHref?: (page: number) => string;
  /** 目前頁左右各顯示幾頁 */
  siblings?: number;
  /** 只顯示「上一頁 3 / 12 下一頁」，適合窄欄 */
  compact?: boolean;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: PaginationLabels;
  className?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const compactText = (page: number, total: number) => <>{page} / {total}</>;

const MESSAGES: Record<SunLocale, Required<PaginationLabels>> = {
  en: { nav: "Pagination", previous: "Previous", next: "Next", page: (n) => `Page ${n}`, compact: compactText },
  "zh-TW": { nav: "分頁", previous: "上一頁", next: "下一頁", page: (n) => `第 ${n} 頁`, compact: compactText },
  "zh-CN": { nav: "分页", previous: "上一页", next: "下一页", page: (n) => `第 ${n} 页`, compact: compactText },
  ja: { nav: "ページ送り", previous: "前へ", next: "次へ", page: (n) => `${n} ページ目`, compact: compactText },
};

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
} as const;

const cell =
  "relative inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === "left" ? "M14.5 6l-6 6 6 6" : "M9.5 6l6 6-6 6"} />
    </svg>
  );
}

/**
 * 分頁：自動省略號、上一頁與下一頁、aria-current="page"。
 * 目前頁下方的小橫線用 snappy 彈簧滑到新頁；reduced motion 時直接跳過去。
 */
export function Pagination({
  total,
  page: pageProp,
  defaultPage = 1,
  onPageChange,
  getHref,
  siblings = 1,
  compact = false,
  locale = "en",
  labels,
  className,
}: PaginationProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const reduce = useReducedMotion() ?? false;
  const layoutId = `${useId()}-indicator`;
  const [inner, setInner] = useState(defaultPage);
  const page = Math.min(Math.max(pageProp ?? inner, 1), Math.max(total, 1));

  const go = (n: number) => {
    if (n < 1 || n > total || n === page) return;
    if (pageProp === undefined) setInner(n);
    onPageChange?.(n);
  };

  // 依 getHref 決定是連結還是按鈕；用函式而非元件，避免每次 render 重新掛載而丟失焦點
  const item = ({ to, disabled, current, label, children, extra }: {
    to: number;
    disabled?: boolean;
    current?: boolean;
    label?: string;
    children: ReactNode;
    extra?: string;
  }) => {
    const cls = cn(
      cell,
      extra,
      current ? "font-semibold text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      disabled && "pointer-events-none opacity-40",
    );
    const common = { "aria-label": label, "aria-current": current ? ("page" as const) : undefined, className: cls };
    if (getHref) {
      return disabled ? (
        <span {...common} aria-disabled="true">{children}</span>
      ) : (
        <a {...common} href={getHref(to)} onClick={() => go(to)}>{children}</a>
      );
    }
    return (
      <button type="button" {...common} disabled={disabled} onClick={() => go(to)}>
        {children}
      </button>
    );
  };

  const prev = item({
    to: page - 1,
    disabled: page <= 1,
    extra: "gap-1 px-2.5",
    children: (
      <>
        <Chevron dir="left" />
        <span className="max-sm:sr-only">{t.previous}</span>
      </>
    ),
  });
  const next = item({
    to: page + 1,
    disabled: page >= total,
    extra: "gap-1 px-2.5",
    children: (
      <>
        <span className="max-sm:sr-only">{t.next}</span>
        <Chevron dir="right" />
      </>
    ),
  });

  if (total <= 0) return null;

  return (
    <nav aria-label={t.nav} className={cn("w-full", className)}>
      <ul className="flex items-center justify-center gap-1">
        <li>{prev}</li>
        {compact ? (
          <li className="px-3 text-sm font-medium tabular-nums" aria-live="polite">
            {t.compact(page, total)}
          </li>
        ) : (
          getPageRange(page, total, siblings).map((n) =>
            typeof n === "number" ? (
              <li key={n}>
                {item({
                  to: n,
                  current: n === page,
                  label: t.page(n),
                  children: (
                    <>
                      {n}
                      {n === page && (
                        <motion.span
                          layoutId={layoutId}
                          aria-hidden="true"
                          className="absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-foreground"
                          transition={reduce ? { duration: 0 } : springs.snappy}
                        />
                      )}
                    </>
                  ),
                })}
              </li>
            ) : (
              <li key={n} aria-hidden="true" className="inline-flex h-9 min-w-7 items-center justify-center text-sm text-muted-foreground">
                …
              </li>
            ),
          )
        )}
        <li>{next}</li>
      </ul>
    </nav>
  );
}
