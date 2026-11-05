import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import type { Locale } from "@/lib/i18n";
import type { RegistryItem } from "@/lib/registry";

/** content/registry-i18n/<name>.json：英文以外三種語言的標題、描述與使用建議。 */
export type ItemTranslation = {
  title?: string;
  description?: string;
  whenToUse?: string[];
  watchOut?: string[];
};

type TranslationFile = Partial<Record<Exclude<Locale, "en">, ItemTranslation>>;

const dir = path.join(process.cwd(), "content", "registry-i18n");
const cache = new Map<string, TranslationFile | null>();

function load(name: string): TranslationFile | null {
  if (!cache.has(name)) {
    const file = path.join(dir, `${name}.json`);
    cache.set(name, existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as TranslationFile) : null);
  }
  return cache.get(name) ?? null;
}

/** 回傳換成指定語言的 item；缺翻譯的欄位保留英文。aliases 不翻，供搜尋用。 */
export function localizeItem<T extends RegistryItem>(item: T, locale: Locale): T {
  if (locale === "en") return item;
  const t = load(item.name)?.[locale];
  if (!t) return item;
  return {
    ...item,
    title: t.title ?? item.title,
    description: t.description ?? item.description,
    meta: {
      ...item.meta,
      usage: item.meta.usage && {
        ...item.meta.usage,
        whenToUse: t.whenToUse ?? item.meta.usage.whenToUse,
        watchOut: t.watchOut ?? item.meta.usage.watchOut,
      },
    },
  };
}
