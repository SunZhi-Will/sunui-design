export const locales = ["en", "zh-TW", "zh-CN", "ja"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
export const LOCALE_COOKIE = "sunui-lang";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  "zh-TW": "繁體中文",
  "zh-CN": "简体中文",
  ja: "日本語",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/** 把任意 BCP 47 標籤（zh-Hant-HK、ja-JP、en-US）歸到支援的四種語言之一。 */
export function resolveLocale(tag: string | null | undefined): Locale {
  if (!tag) return defaultLocale;
  if (isLocale(tag)) return tag;
  const t = tag.toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return defaultLocale;
}

/** 從 Accept-Language 挑第一個支援的語言。 */
export function negotiateLocale(header: string | null | undefined): Locale {
  if (!header) return defaultLocale;
  for (const part of header.split(",")) {
    const tag = part.split(";")[0]?.trim();
    if (!tag) continue;
    const t = tag.toLowerCase();
    if (t.startsWith("zh") || t.startsWith("ja") || t.startsWith("en")) return resolveLocale(tag);
  }
  return defaultLocale;
}

/** 依語言挑一個值，缺的語言退回英文。 */
export function pick<T>(locale: Locale, values: { en: T } & Partial<Record<Locale, T>>): T {
  return values[locale] ?? values.en;
}

/** 把 "{n} blocks" 這類樣板換成實際值；字典要傳進 client 元件，所以不放函式。 */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}
