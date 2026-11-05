"use client";

import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type NumberedStepsTheme = "light" | "dark" | "system";

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

function themeStyle(theme: NumberedStepsTheme) {
  return theme === "system" ? undefined : ((theme === "dark" ? DARK : LIGHT) as CSSProperties);
}

function ThemeStyle({ theme }: { theme: NumberedStepsTheme }) {
  if (theme !== "system") return null;
  return (
    <style href="sunui-vw-steps" precedence="default">
      {SYSTEM_CSS}
    </style>
  );
}

export interface NumberedStepsLabels {
  /** 每一步前面給螢幕閱讀器的前綴，例如「Step 1: 」 */
  stepPrefix: (n: number) => string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, NumberedStepsLabels> = {
  en: { stepPrefix: (n) => `Step ${n}: ` },
  "zh-TW": { stepPrefix: (n) => `第 ${n} 步：` },
  "zh-CN": { stepPrefix: (n) => `第 ${n} 步：` },
  ja: { stepPrefix: (n) => `ステップ ${n}：` },
};

export interface NumberedStepsProps {
  items: ReactNode[];
  /** 每一步前面給螢幕閱讀器的前綴；優先於 locale 與 labels */
  stepPrefix?: (n: number) => string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<NumberedStepsLabels>;
  theme?: NumberedStepsTheme;
  className?: string;
  style?: CSSProperties;
}

/** 編號步驟清單。保留有序清單語意，編號圓點僅作視覺。 */
export function NumberedSteps({ items, stepPrefix, locale = "en", labels, theme = "system", className, style }: NumberedStepsProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const prefix = stepPrefix ?? t.stepPrefix;
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
              <span className="sr-only">{prefix(i + 1)}</span>
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
