"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { FloatingField, suggestEmail } from "./floating-field";

const copy = {
  en: { heading: "Shipping details", name: "Full name", email: "Email", emailBad: "Missing something, like name@example.com", emailOk: "We will send tracking here" },
  "zh-TW": { heading: "收件資料", name: "收件人姓名", email: "Email", emailBad: "格式不完整，例如 name@example.com", emailOk: "物流通知會寄到這裡" },
  "zh-CN": { heading: "收货信息", name: "收货人姓名", email: "Email", emailBad: "格式不完整，例如 name@example.com", emailOk: "物流通知会发到这里" },
  ja: { heading: "お届け先", name: "お名前", email: "メールアドレス", emailBad: "name@example.com の形式で入力してください", emailOk: "配送状況をこちらにお送りします" },
};

/** 型錄卡片：Email 網域打錯，欄位下方直接建議修正，點一下只換掉錯的字母。 */
export default function FloatingFieldCard() {
  const t = useDemoText(copy);
  const locale = useDemoLocale();
  return (
    <form className="mx-auto w-80 rounded-lg border bg-background p-5" onSubmit={(e) => e.preventDefault()} noValidate>
      <p className="mb-3 text-base font-semibold tracking-tight">{t.heading}</p>
      <div className="grid gap-2">
        <FloatingField label={t.name} name="name" autoComplete="name" required />
        <FloatingField
          label={t.email}
          name="email"
          type="email"
          autoComplete="email"
          defaultValue="lin@gmial.com"
          locale={locale}
          suggest={suggestEmail}
          validate={(v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? true : t.emailBad)}
          successMessage={t.emailOk}
          required
        />
      </div>
    </form>
  );
}
