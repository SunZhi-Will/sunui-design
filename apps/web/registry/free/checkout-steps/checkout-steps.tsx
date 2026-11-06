"use client";

import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

export type CheckoutStepsTheme = "light" | "dark" | "system";

// V窩品牌 token：亮色「午後」為預設、暗色「夜間配信」。可用同名 CSS 變數覆寫。
const LIGHT = {
  "--vw-text-primary": "#3B2A26",
  "--vw-text-secondary": "#6F574F",
  "--vw-text-muted": "#7E655C",
  "--vw-border": "#EADBCD",
  "--vw-border-subtle": "#F0E4D8",
  "--vw-accent": "#B4586C",
  "--vw-accent-contrast": "#FFFFFF",
  "--vw-accent-text": "#A64D61",
  "--vw-info-bg": "#E3EEF4",
  "--vw-info-text": "#3D6A86",
};
const DARK: typeof LIGHT = {
  "--vw-text-primary": "#F6EBE3",
  "--vw-text-secondary": "#C9B5AA",
  "--vw-text-muted": "#A99288",
  "--vw-border": "#3C2F2A",
  "--vw-border-subtle": "rgba(246, 235, 227, 0.07)",
  "--vw-accent": "#E896A6",
  "--vw-accent-contrast": "#2A1418",
  "--vw-accent-text": "#EFA3B2",
  "--vw-info-bg": "rgba(159, 195, 217, 0.12)",
  "--vw-info-text": "#9FC3D9",
};

const rule = (sel: string, vars: Record<string, string>) =>
  `${sel}{${Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";")}}`;
// "system" follows the OS, unless the page forces a theme with .light or .dark on <html> (next-themes, shadcn)
const SYSTEM_CSS = `${rule(".sunui-vw-steps", LIGHT)}@media (prefers-color-scheme: dark){${rule(":root:not(.light) .sunui-vw-steps", DARK)}}${rule(".dark .sunui-vw-steps", DARK)}${rule(".light .sunui-vw-steps", LIGHT)}`;

function themeStyle(theme: CheckoutStepsTheme) {
  return theme === "system" ? undefined : ((theme === "dark" ? DARK : LIGHT) as CSSProperties);
}

function ThemeStyle({ theme }: { theme: CheckoutStepsTheme }) {
  if (theme !== "system") return null;
  return (
    <style href="sunui-vw-steps" precedence="default">
      {SYSTEM_CSS}
    </style>
  );
}

// lucide Check（strokeWidth 3）
function CheckIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export interface CheckoutStepsProps {
  /** 步驟名稱，例如 ["確認訂單", "同意條款", "付款", "交付"] */
  steps: string[];
  /** 目前步驟的 index（從 0 起算），之前的步驟顯示為已完成 */
  current: number;
  /** ol 的無障礙名稱，優先於 labels.label */
  label?: string;
  /** 已完成步驟附加給螢幕閱讀器的字，優先於 labels.done */
  doneLabel?: string;
  theme?: CheckoutStepsTheme;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<CheckoutStepsLabels>;
  className?: string;
  style?: CSSProperties;
}

export interface CheckoutStepsLabels {
  label: string;
  done: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, CheckoutStepsLabels> = {
  en: { label: "Checkout steps", done: "completed" },
  "zh-TW": { label: "結帳步驟", done: "已完成" },
  "zh-CN": { label: "结账步骤", done: "已完成" },
  ja: { label: "購入手続きのステップ", done: "完了" },
};

/** 結帳步驟：一行可換行的小圓點加名稱，完成的步驟用主色加勾。 */
export function CheckoutSteps({
  steps,
  current,
  label: labelProp,
  doneLabel: doneLabelProp,
  theme = "system",
  locale = "en",
  labels,
  className,
  style,
}: CheckoutStepsProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const label = labelProp ?? t.label;
  const doneLabel = doneLabelProp ?? t.done;
  return (
    <>
      <ThemeStyle theme={theme} />
      <ol
        aria-label={label}
        className={cn("sunui-vw-steps mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]", className)}
        style={{ ...themeStyle(theme), ...style }}
      >
        {steps.map((s, i) => (
          <li
            key={s}
            aria-current={i === current ? "step" : undefined}
            className="flex items-center gap-1.5"
            style={{
              color: i === current ? "var(--vw-text-primary)" : "var(--vw-text-muted)",
              fontWeight: i === current ? 700 : 500,
            }}
          >
            <span
              className="grid size-5 place-items-center text-[11px]"
              style={{
                borderRadius: 999,
                background: i < current ? "var(--vw-accent)" : "var(--vw-border-subtle)",
                color: i < current ? "var(--vw-accent-contrast)" : "var(--vw-text-secondary)",
              }}
            >
              {i < current ? <CheckIcon /> : i + 1}
            </span>
            {s}
            {i < current && <span className="sr-only">{resolveLocale(locale) === "en" ? ", " : "，"}{doneLabel}</span>}
          </li>
        ))}
      </ol>
    </>
  );
}
