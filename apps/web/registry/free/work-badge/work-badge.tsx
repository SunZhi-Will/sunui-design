"use client";

import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────
 * WorkBadge（Synvize StatusBadge）：黑金品牌，預設暗色
 * ────────────────────────────────────────────────────────────── */

export type WorkTone = "success" | "warning" | "brand" | "neutral";

// Synvize tokens.css 的暗色（品牌預設）與保留給反轉區塊的亮色
const SYNVIZE = {
  dark: {
    "--sv-text-2": "#a8a296",
    "--sv-line-1": "rgba(212, 175, 55, 0.14)",
    "--sv-gold": "#d4af37",
    "--sv-success": "#7fc4a0",
    "--sv-warning": "#e8d4a0",
    "--sv-brand-2": "#e8c874",
    "--sv-tint-success": "rgba(127, 196, 160, 0.12)",
    "--sv-tint-warning": "rgba(212, 175, 55, 0.12)",
    "--sv-tint-brand": "rgba(212, 175, 55, 0.1)",
    "--sv-tint-neutral": "rgba(247, 245, 240, 0.06)",
  },
  light: {
    "--sv-text-2": "#3d3730",
    "--sv-line-1": "rgba(94, 78, 18, 0.18)",
    "--sv-gold": "#5e4e12",
    "--sv-success": "#1f7a4d",
    "--sv-warning": "#5e4e12",
    "--sv-brand-2": "#6b5a1f",
    "--sv-tint-success": "color-mix(in srgb, #1f7a4d 12%, transparent)",
    "--sv-tint-warning": "rgba(212, 175, 55, 0.12)",
    "--sv-tint-brand": "color-mix(in srgb, #5e4e12 10%, transparent)",
    "--sv-tint-neutral": "color-mix(in srgb, #08080a 6%, transparent)",
  },
} as const;

// 每個 tone 是完整自成一體的一組值，不跟基底疊加同一個屬性
const TONE_CLASSES: Record<WorkTone, string> = {
  success: "bg-(--sv-tint-success) text-(--sv-success)",
  warning: "bg-(--sv-tint-warning) text-(--sv-warning)",
  brand: "bg-(--sv-tint-brand) text-(--sv-brand-2)",
  neutral: "bg-(--sv-tint-neutral) text-(--sv-text-2)",
};

// 有限次數的呼吸：WCAG 2.2.2 不允許無限期自動動態，脈動 3 次即停；減少動態時不播
const BREATHE_CSS = `@keyframes sv-dot-breathe{0%,100%{opacity:1;box-shadow:0 0 0 0 color-mix(in srgb,var(--sv-gold) 45%,transparent)}50%{opacity:.6;box-shadow:0 0 0 4px transparent}}@media (prefers-reduced-motion:no-preference){.sv-badge__dot--live{animation:sv-dot-breathe 2.4s cubic-bezier(0.65,0,0.35,1) 3 both}}`;

/**
 * 狀態徽章：圓點與文字同時存在，狀態不只靠顏色。
 * 圓點對螢幕閱讀器隱藏，文字才是資訊來源。
 */
export function WorkBadge({
  tone,
  label,
  live = false,
  hint,
  theme = "dark",
  className,
}: {
  tone: WorkTone;
  label: string;
  /** 圓點呼吸，代表「正在進行」 */
  live?: boolean;
  /** 額外的螢幕閱讀器說明，視覺上隱藏 */
  hint?: string;
  /** Synvize 品牌強制暗色，light 是保留給反轉區塊的配色 */
  theme?: "dark" | "light";
  className?: string;
}) {
  return (
    <span
      style={SYNVIZE[theme] as CSSProperties}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-(--sv-line-1) px-3 py-1 font-mono text-[0.6875rem] tracking-[0.04em] whitespace-nowrap",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {live ? <style>{BREATHE_CSS}</style> : null}
      <span aria-hidden className={cn("relative size-1.5 flex-none rounded-full bg-current", live && "sv-badge__dot--live")} />
      {label}
      {hint ? <span className="sr-only">. {hint}</span> : null}
    </span>
  );
}

/** Synvize 作品狀態到 tone 的對應 */
export type WorkStatus = "available" | "public-beta" | "private-beta" | "prototype" | "paused" | "archived";

export const WORK_STATUS_TONE: Record<WorkStatus, WorkTone> = {
  available: "success",
  "public-beta": "warning",
  "private-beta": "warning",
  prototype: "brand",
  paused: "neutral",
  archived: "neutral",
};

export type WorkStatusLabels = Record<WorkStatus, string>;

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, WorkStatusLabels> = {
  en: { available: "Available", "public-beta": "Public beta", "private-beta": "Private beta", prototype: "Prototype", paused: "Paused", archived: "Archived" },
  "zh-TW": { available: "已上線", "public-beta": "公開測試", "private-beta": "封閉測試", prototype: "原型", paused: "暫停", archived: "已封存" },
  "zh-CN": { available: "已上线", "public-beta": "公开测试", "private-beta": "封闭测试", prototype: "原型", paused: "暂停", archived: "已归档" },
  ja: { available: "公開中", "public-beta": "パブリックベータ", "private-beta": "クローズドベータ", prototype: "プロトタイプ", paused: "休止中", archived: "アーカイブ" },
};

export function StatusBadge({
  status,
  label,
  help,
  theme,
  locale = "en",
  labels,
}: {
  status: WorkStatus;
  label?: string;
  /** 螢幕閱讀器的補充說明 */
  help?: string;
  theme?: "dark" | "light";
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建的狀態文字，優先於 locale */
  labels?: Partial<WorkStatusLabels>;
}) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  return <WorkBadge tone={WORK_STATUS_TONE[status]} label={label ?? t[status]} hint={help} theme={theme} />;
}
