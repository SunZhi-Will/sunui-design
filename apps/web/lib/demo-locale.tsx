"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";

import { defaultLocale, isLocale, LOCALE_COOKIE, pick, resolveLocale, type Locale } from "@/lib/i18n";

const DemoLocaleContext = createContext<Locale>(defaultLocale);

/**
 * 預覽頁把網站目前的語言傳給 demo.tsx / card.tsx。
 * 預覽頁是靜態檔，伺服器端不知道語言：由 iframe 網址的 ?l= 帶入，
 * 直接開預覽網址時退回網站的語言 cookie，再退回瀏覽器語言。
 */
export function DemoLocaleProvider({ children }: { children: ReactNode }) {
  // 伺服器端（與 hydration 那一次）拿到 null，先不渲染 demo；demo 本來就只在瀏覽器端載入（ssr: false）
  const locale = useSyncExternalStore(subscribe, readLocale, () => null);

  useEffect(() => {
    if (locale) document.documentElement.lang = locale;
  }, [locale]);

  if (!locale) return null;
  return <DemoLocaleContext.Provider value={locale}>{children}</DemoLocaleContext.Provider>;
}

// 網址在 iframe 的生命週期內不會變（換語言時外層會重掛 iframe），不需要訂閱
const subscribe = () => () => {};

function readLocale(): Locale {
  const fromUrl = new URLSearchParams(window.location.search).get("l");
  if (isLocale(fromUrl)) return fromUrl;
  const fromCookie = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`))?.[1];
  if (isLocale(fromCookie)) return fromCookie;
  return resolveLocale(navigator.language);
}

export function useDemoLocale(): Locale {
  return useContext(DemoLocaleContext);
}

/** demo 用：依目前語言挑範例資料，例如 useDemoText({ en: "Hi", "zh-TW": "嗨" })。 */
export function useDemoText<T>(values: { en: T } & Partial<Record<Locale, T>>): T {
  return pick(useDemoLocale(), values);
}

/** 預覽頁上的固定文字（例如 404）：伺服器端先放英文，瀏覽器端換成網址指定的語言。 */
export function PreviewText({ values }: { values: { en: string } & Partial<Record<Locale, string>> }) {
  const locale = useSyncExternalStore(subscribe, readLocale, () => defaultLocale);
  return <>{pick(locale, values)}</>;
}

/** 預覽 iframe 的網址加上語言參數 */
export function previewUrl(path: string, locale: Locale) {
  return `${path}${path.includes("?") ? "&" : "?"}l=${locale}`;
}

export type { Locale };
