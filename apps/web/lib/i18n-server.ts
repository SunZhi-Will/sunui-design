
import { cookies, headers } from "next/headers";

import { isLocale, LOCALE_COOKIE, negotiateLocale, type Locale } from "@/lib/i18n";
import { getMessages } from "@/lib/messages";

/** 先看使用者選過的 cookie，沒有就照瀏覽器的 Accept-Language。 */
export async function getLocale(): Promise<Locale> {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  return negotiateLocale((await headers()).get("accept-language"));
}

/** 伺服器元件用：一次取得語言與對應的網站文字。 */
export async function getI18n() {
  const locale = await getLocale();
  return { locale, m: getMessages(locale) };
}
