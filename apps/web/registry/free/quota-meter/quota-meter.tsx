"use client";

import { useEffect, useState, type CSSProperties, type MouseEventHandler, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// 額度用量：百分比加上預計還能產生幾張。今天還沒簽到時，第二行改成簽到提醒。
// 只顯示張數與百分比，不使用「點數」字眼。

/** 預設的全域事件名稱，checkin-streak 簽到成功時會送出 */
export const REWARDS_EVENT = "sunui:rewards";

export type QuotaUsage = ({ unlimited: true } | { unlimited: false; pct: number; left: number }) & {
  /** 今天還沒簽到時，可以領的張數 */
  checkin?: number;
};

/** 免費額度與方案額度合在一起算：剩下的張數除以全部的張數 */
export function toQuotaUsage(a: { enforced: boolean; total: number; left: number; checkin?: number }): QuotaUsage {
  if (!a.enforced) return { unlimited: true, checkin: a.checkin };
  const pct = a.total > 0 ? Math.max(0, Math.min(100, Math.round((a.left * 100) / a.total))) : 0;
  return { unlimited: false, left: a.left, pct, checkin: a.checkin };
}

/**
 * 讀取額度：進站、refreshKey 改變（換頁、進行中的任務數變少）、
 * 簽到事件與回到分頁（focus）時重新讀取。
 */
export function useQuotaUsage(
  load: () => Promise<QuotaUsage>,
  { refreshKey, event = REWARDS_EVENT }: { refreshKey?: unknown; event?: string | null } = {},
) {
  const [usage, setUsage] = useState<QuotaUsage | null>(null);
  useEffect(() => {
    let alive = true;
    const run = () =>
      load()
        .then((u) => alive && setUsage(u))
        .catch(() => undefined);
    run();
    window.addEventListener("focus", run);
    if (event) window.addEventListener(event, run);
    return () => {
      alive = false;
      window.removeEventListener("focus", run);
      if (event) window.removeEventListener(event, run);
    };
    // load 通常是行內函式，只跟著 refreshKey 與事件名稱重新綁定
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, event]);
  return usage;
}

export interface QuotaMeterLabels {
  /** card 版的預設標題 */
  title?: string;
  unlimitedHead?: string;
  unlimitedSub?: string;
  /** card 版不限量時的說明 */
  unlimitedBody?: string;
  head?: (pct: number) => string;
  sub?: (left: string) => string;
  checkin?: (n: number) => string;
  /** card 版：底部的簽到提醒條 */
  nudge?: (n: number) => ReactNode;
  separator?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, Required<QuotaMeterLabels>> = {
  en: {
    title: "Today's free quota",
    unlimitedHead: "Unlimited for now",
    unlimitedSub: "Remaining percent shows once quotas start",
    unlimitedBody: "Generation has no image limit right now.",
    head: (pct) => `${pct}% of quota left`,
    sub: (left) => `About ${left} images left`,
    checkin: (n) => `Check in today for ${n} images`,
    nudge: (n) => <>You haven&apos;t checked in today. Check in for {n} more images</>,
    separator: " · ",
  },
  "zh-TW": {
    title: "今日免費額度",
    unlimitedHead: "目前不限量",
    unlimitedSub: "開始計算額度後會顯示剩餘百分比",
    unlimitedBody: "目前生成圖片沒有張數限制。",
    head: (pct) => `額度剩餘 ${pct}%`,
    sub: (left) => `約可再生成 ${left} 張`,
    checkin: (n) => `今天簽到可領 ${n} 張`,
    nudge: (n) => <>今天還沒簽到，簽到可再領 {n} 張</>,
    separator: "・",
  },
  "zh-CN": {
    title: "今日免费额度",
    unlimitedHead: "目前不限量",
    unlimitedSub: "开始计算额度后会显示剩余百分比",
    unlimitedBody: "目前生成图片没有张数限制。",
    head: (pct) => `额度剩余 ${pct}%`,
    sub: (left) => `约可再生成 ${left} 张`,
    checkin: (n) => `今天签到可领 ${n} 张`,
    nudge: (n) => <>今天还没签到，签到可再领 {n} 张</>,
    separator: "・",
  },
  ja: {
    title: "本日の無料枠",
    unlimitedHead: "いまは無制限",
    unlimitedSub: "上限が始まると残りの割合を表示します",
    unlimitedBody: "現在、画像の生成枚数に上限はありません。",
    head: (pct) => `残り ${pct}%`,
    sub: (left) => `あと約 ${left} 枚生成できます`,
    checkin: (n) => `チェックインで +${n} 枚`,
    nudge: (n) => <>今日はまだチェックインしていません。チェックインであと {n} 枚もらえます</>,
    separator: "・",
  },
};

export interface QuotaMeterProps {
  usage: QuotaUsage | null;
  /** sidebar：側邊欄底部的圓環；sheet：手機面板裡的長條；card：方案頁的額度卡 */
  variant?: "sidebar" | "sheet" | "card";
  /** sidebar 版收合時只剩圓環，滑過或聚焦顯示說明 */
  collapsed?: boolean;
  /** 點下去前往的方案頁 */
  href?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  /** 目前就在方案頁 */
  current?: boolean;
  /** card 版的標題與附註；不給時用 labels.title */
  title?: ReactNode;
  hint?: ReactNode;
  /** card 版簽到提醒條的連結 */
  nudgeHref?: string;
  /** 低於或等於這個百分比轉成警示色 */
  lowAt?: number;
  /** 品牌色（簽到提醒），預設為原本的靛藍 */
  accent?: string;
  /** 介面語言與數字格式：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: QuotaMeterLabels;
  className?: string;
}

// 原專案（Yumecanvas）的 zinc 色票，亮暗兩套
const tokens =
  "[--yc-card:#FFFFFF] [--yc-fg:#18181B] [--yc-muted:#F4F4F5] [--yc-muted-fg:#6B6B73] [--yc-border:#E4E4E7] [--yc-sidebar:#FAFAFA] [--yc-ring:#71717A] [--yc-brand-default:#4F46E5] [--yc-destructive:#DC2626] [--yc-success:#15803D] " +
  "dark:[--yc-card:#111113] dark:[--yc-fg:#FAFAFA] dark:[--yc-muted:#27272A] dark:[--yc-muted-fg:#A1A1AA] dark:[--yc-border:rgba(255,255,255,0.08)] dark:[--yc-sidebar:#09090B] dark:[--yc-ring:#A1A1AA] dark:[--yc-brand-default:#818CF8] dark:[--yc-destructive:#F87171] dark:[--yc-success:#4ADE80]";
const brand = "[--yc-brand-c:var(--yc-brand,var(--yc-brand-default))]";
const focus = "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--yc-ring)]";

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn("shrink-0", className)}>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn("shrink-0", className)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function texts(usage: QuotaUsage, lowAt: number, t: Required<QuotaMeterLabels>, locale?: string) {
  const base = usage.unlimited
    ? { pct: 100, low: false, head: t.unlimitedHead, sub: t.unlimitedSub }
    : { pct: usage.pct, low: usage.pct <= lowAt, head: t.head(usage.pct), sub: t.sub(usage.left.toLocaleString(locale)) };
  // 還沒簽到時，第二行改成提醒，點進方案頁就能簽到
  return usage.checkin ? { ...base, sub: t.checkin(usage.checkin), gift: true } : { ...base, gift: false };
}

function Bar({ pct, low, label }: { pct: number; low: boolean; label?: string }) {
  return (
    <span
      className="block h-1.5 overflow-hidden rounded-full bg-[var(--yc-muted)]"
      role="progressbar"
      aria-label={label}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span
        className={cn(
          "block h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
          low ? "bg-[var(--yc-destructive)]" : "bg-[var(--yc-fg)]",
        )}
        style={{ width: `${pct}%` }}
      />
    </span>
  );
}

export function QuotaMeter({
  usage,
  variant = "sidebar",
  collapsed = false,
  href = "/plans/",
  onClick,
  current = false,
  title: titleProp,
  hint,
  nudgeHref = "#rewards",
  lowAt = 10,
  accent,
  locale,
  labels,
  className,
}: QuotaMeterProps) {
  const [tip, setTip] = useState(false);
  if (!usage) return null;
  const l = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const title = titleProp ?? l.title;
  const t = texts(usage, lowAt, l, locale);
  const style = accent ? ({ "--yc-brand": accent } as CSSProperties) : undefined;
  const root = cn(tokens, brand, "text-[var(--yc-fg)]");

  if (variant === "sheet") {
    return (
      <a
        href={href}
        onClick={onClick}
        style={style}
        className={cn(root, focus, "flex flex-col gap-2 rounded-[0.7rem] border border-[var(--yc-border)] px-3 py-3 hover:bg-[var(--yc-muted)]", className)}
      >
        <span className="flex items-baseline justify-between gap-2 text-sm">
          <span className="font-medium">{t.head}</span>
          <span className={cn("flex min-w-0 items-center gap-1 text-xs tabular-nums", t.gift ? "text-[var(--yc-brand-c)]" : "text-[var(--yc-muted-fg)]")}>
            {t.gift ? <GiftIcon className="size-3" /> : null}
            <span className="truncate">{t.sub}</span>
          </span>
        </span>
        <Bar pct={t.pct} low={t.low} />
      </a>
    );
  }

  if (variant === "card") {
    const label = typeof title === "string" ? title : undefined;
    return (
      <section style={style} className={cn(root, "overflow-hidden rounded-[0.9rem] border border-[var(--yc-border)] bg-[var(--yc-card)]", className)}>
        <div className="p-5">
          {usage.unlimited ? (
            <div className="flex flex-col gap-2">
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[color-mix(in_oklab,var(--yc-success)_15%,transparent)] px-2 py-0.5 text-xs font-medium text-[var(--yc-success)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="size-3.5 shrink-0">
                  <path d="M6 16c5 0 7-8 12-8a4 4 0 0 1 0 8c-5 0-7-8-12-8a4 4 0 1 0 0 8" />
                </svg>
                {l.unlimitedHead}
              </span>
              <p className="text-sm text-[var(--yc-muted-fg)]">{l.unlimitedBody}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 rounded-[0.7rem] bg-[color-mix(in_oklab,var(--yc-muted)_40%,transparent)] px-4 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm">{title}</span>
                <span className={cn("text-lg font-semibold tabular-nums", t.low && "text-[var(--yc-destructive)]")}>{t.pct}%</span>
              </div>
              <Bar pct={t.pct} low={t.low} label={label} />
              <div className="flex justify-between gap-2 text-xs text-[var(--yc-muted-fg)]">
                <span className="tabular-nums">{l.sub(usage.left.toLocaleString(locale))}</span>
                {hint ? <span className="max-sm:hidden">{hint}</span> : null}
              </div>
            </div>
          )}
        </div>
        {usage.checkin ? (
          <a
            href={nudgeHref}
            className={cn(
              focus,
              "flex items-center gap-2 border-t border-[var(--yc-border)] bg-[color-mix(in_oklab,var(--yc-brand-c)_10%,transparent)] px-5 py-2.5 text-sm transition-colors hover:bg-[color-mix(in_oklab,var(--yc-brand-c)_15%,transparent)] focus-visible:-outline-offset-2",
            )}
          >
            <GiftIcon className="size-4 text-[var(--yc-brand-c)]" />
            <span className="min-w-0 flex-1">{l.nudge(usage.checkin)}</span>
            <ChevronDownIcon className="size-4 text-[var(--yc-muted-fg)]" />
          </a>
        ) : null}
      </section>
    );
  }

  // 側邊欄版本：收合時只剩一個小圓環，滑過顯示說明
  const ring = 2 * Math.PI * 9;
  return (
    <span style={style} className={cn(root, "relative block", className)} onMouseEnter={() => setTip(true)} onMouseLeave={() => setTip(false)}>
      <a
        href={href}
        onClick={onClick}
        aria-label={`${t.head}${l.separator}${t.sub}`}
        aria-current={current ? "page" : undefined}
        onFocus={() => setTip(true)}
        onBlur={() => setTip(false)}
        onKeyDown={(e) => e.key === "Escape" && setTip(false)}
        className={cn(focus, "flex items-center gap-2.5 rounded-[0.4rem] px-0.5 py-1.5 hover:bg-[var(--yc-muted)]", current && "bg-[var(--yc-muted)]")}
      >
        <span className="relative shrink-0">
          <svg viewBox="0 0 24 24" className="size-7 -rotate-90" aria-hidden>
            <circle cx="12" cy="12" r="9" fill="none" strokeWidth="3" className="stroke-[var(--yc-muted)]" />
            <circle
              cx="12"
              cy="12"
              r="9"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              className={cn("transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none", t.low ? "stroke-[var(--yc-destructive)]" : "stroke-[var(--yc-fg)]")}
              strokeDasharray={ring}
              strokeDashoffset={ring * (1 - t.pct / 100)}
            />
          </svg>
          {t.gift ? (
            <span aria-hidden className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-[var(--yc-brand-c)] ring-2 ring-[var(--yc-sidebar)]" />
          ) : null}
        </span>
        <span
          className={cn(
            "flex min-w-0 flex-1 flex-col gap-1 whitespace-nowrap transition-opacity duration-200 motion-reduce:transition-none",
            collapsed && "pointer-events-none opacity-0",
          )}
          aria-hidden
        >
          <span className="text-xs font-medium">{t.head}</span>
          <span className={cn("flex items-center gap-1 truncate text-[11px] tabular-nums", t.gift ? "text-[var(--yc-brand-c)]" : "text-[var(--yc-muted-fg)]")}>
            {t.gift ? <GiftIcon className="size-3" /> : null}
            {t.sub}
          </span>
        </span>
      </a>
      {collapsed && tip ? (
        <span
          role="tooltip"
          className="absolute top-1/2 left-[calc(1.75rem+0.75rem)] z-50 -translate-y-1/2 rounded-[0.4rem] bg-[var(--yc-fg)] px-3 py-1.5 text-xs whitespace-nowrap text-[var(--yc-card)]"
        >
          {t.head}・{t.sub}
        </span>
      ) : null}
    </span>
  );
}
