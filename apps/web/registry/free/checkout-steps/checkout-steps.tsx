"use client";

import type { CSSProperties, ReactNode } from "react";

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
const SYSTEM_CSS = `${rule(".sunui-vw-steps", LIGHT)}@media (prefers-color-scheme: dark){${rule(".sunui-vw-steps", DARK)}}`;

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
  /** ol 的無障礙名稱 */
  label?: string;
  /** 已完成步驟附加給螢幕閱讀器的字 */
  doneLabel?: string;
  theme?: CheckoutStepsTheme;
  className?: string;
  style?: CSSProperties;
}

/** 結帳步驟：一行可換行的小圓點加名稱，完成的步驟用主色加勾。 */
export function CheckoutSteps({ steps, current, label = "Checkout steps", doneLabel = "completed", theme = "system", className, style }: CheckoutStepsProps) {
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
            {i < current && <span className="sr-only">, {doneLabel}</span>}
          </li>
        ))}
      </ol>
    </>
  );
}

export interface NumberedStepsProps {
  items: ReactNode[];
  /** 每一步前面給螢幕閱讀器的前綴，預設「Step 1: 」 */
  stepPrefix?: (n: number) => string;
  theme?: CheckoutStepsTheme;
  className?: string;
  style?: CSSProperties;
}

/** 編號步驟清單。保留有序清單語意，編號圓點僅作視覺。 */
export function NumberedSteps({ items, stepPrefix = (n) => `Step ${n}: `, theme = "system", className, style }: NumberedStepsProps) {
  return (
    <>
      <ThemeStyle theme={theme} />
      <ol role="list" className={cn("sunui-vw-steps space-y-3", className)} style={{ ...themeStyle(theme), ...style }}>
        {items.map((it, i) => (
          <li key={i} className="flex gap-3">
            <span
              aria-hidden
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
              style={{ background: "var(--vw-info-bg)", color: "var(--vw-info-text)", border: "1px solid var(--vw-border)" }}
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1 text-[15px] leading-[1.8]" style={{ color: "var(--vw-text-secondary)" }}>
              <span className="sr-only">{stepPrefix(i + 1)}</span>
              <div className="space-y-2 [&_a]:text-[color:var(--vw-accent-text)] [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-bold [&_strong]:text-[color:var(--vw-text-primary)]">
                {it}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
