"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { LOCALE_COOKIE, localeLabels, locales, type Locale } from "@/lib/i18n";

const localeShort: Record<Locale, string> = { en: "EN", "zh-TW": "繁", "zh-CN": "简", ja: "日" };

export function LocaleSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(next: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <label className="relative flex h-8 items-center rounded-md border border-line text-xs text-subtle hover:text-fg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent">
      <span className="sr-only">{label}</span>
      <svg viewBox="0 0 24 24" aria-hidden="true" className="pointer-events-none absolute left-2 size-3.5 text-subtle">
        <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </g>
      </svg>
      {/* 手機上只顯示縮寫，選單本身透明覆蓋在上面，點擊仍開啟原生選單 */}
      <span aria-hidden="true" className={pending ? "pr-2 pl-7 opacity-60" : "pr-2 pl-7"}>
        <span className="sm:hidden">{localeShort[locale]}</span>
        <span className="hidden sm:inline">{localeLabels[locale]}</span>
      </span>
      <select
        value={locale}
        onChange={(e) => change(e.target.value as Locale)}
        disabled={pending}
        className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {localeLabels[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
