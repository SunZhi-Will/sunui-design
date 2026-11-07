import { locales } from "@/lib/i18n";
import { PreviewText } from "@/lib/demo-locale";
import { getMessages } from "@/lib/messages";

/**
 * 預覽是嵌在 block 頁 iframe 裡的，找不到時只在舞台上留一行字，不再套整個網站的頁首頁尾。
 * 預覽頁不讀 cookie（才能靜態產生），四種語言的字都帶著，由瀏覽器端依 ?l= 挑。
 */
export default function PreviewNotFound() {
  const values = Object.fromEntries(locales.map((locale) => [locale, getMessages(locale).notFound.preview])) as Record<
    (typeof locales)[number],
    string
  >;
  return (
    <div data-preview-stage className="stage-dots flex min-h-dvh items-center justify-center p-4 sm:p-8">
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line bg-card/80 px-6 py-5 text-center">
        <span className="font-mono text-xs text-subtle">404</span>
        <p className="text-sm text-subtle">
          <PreviewText values={values} />
        </p>
      </div>
    </div>
  );
}
