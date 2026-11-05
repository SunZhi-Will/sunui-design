"use client";

import { createContext, useContext, type ReactNode } from "react";

import { defaultLocale, pick, type Locale } from "@/lib/i18n";

const DemoLocaleContext = createContext<Locale>(defaultLocale);

/** 預覽頁把網站目前的語言傳給 demo.tsx / card.tsx。 */
export function DemoLocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <DemoLocaleContext.Provider value={locale}>{children}</DemoLocaleContext.Provider>;
}

export function useDemoLocale(): Locale {
  return useContext(DemoLocaleContext);
}

/** demo 用：依目前語言挑範例資料，例如 useDemoText({ en: "Hi", "zh-TW": "嗨" })。 */
export function useDemoText<T>(values: { en: T } & Partial<Record<Locale, T>>): T {
  return pick(useDemoLocale(), values);
}

export type { Locale };
