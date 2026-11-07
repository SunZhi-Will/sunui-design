import { getI18n } from "@/lib/i18n-server";

/** 預覽是嵌在 block 頁 iframe 裡的，找不到時只在舞台上留一行字，不再套整個網站的頁首頁尾。 */
export default async function PreviewNotFound() {
  const { m } = await getI18n();
  return (
    <div data-preview-stage className="stage-dots flex min-h-dvh items-center justify-center p-4 sm:p-8">
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line bg-card/80 px-6 py-5 text-center">
        <span className="font-mono text-xs text-subtle">404</span>
        <p className="text-sm text-subtle">{m.notFound.preview}</p>
      </div>
    </div>
  );
}
