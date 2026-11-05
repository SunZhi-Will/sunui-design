"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { FloatingField } from "./floating-field";

const copy = {
  en: { heading: "Shipping details", name: "Full name", email: "Email", emailBad: "That email is missing something, like name@example.com", emailOk: "We will send tracking here", zip: "Postcode", zipHint: "5 digits", zipBad: "Postcodes are 5 digits", note: "Delivery note", noteHint: "Optional, for example: leave at reception", show: "Show", hide: "Hide", pw: "Create a password", pwBad: "Use at least 8 characters" },
  "zh-TW": { heading: "收件資料", name: "收件人姓名", email: "Email", emailBad: "Email 格式不完整，例如 name@example.com", emailOk: "物流通知會寄到這裡", zip: "郵遞區號", zipHint: "3 或 5 碼數字", zipBad: "郵遞區號是 3 或 5 碼數字", note: "配送備註", noteHint: "選填，例如：放管理室", show: "顯示", hide: "隱藏", pw: "設定密碼", pwBad: "至少 8 個字元" },
  "zh-CN": { heading: "收货信息", name: "收货人姓名", email: "Email", emailBad: "Email 格式不完整，例如 name@example.com", emailOk: "物流通知会发到这里", zip: "邮政编码", zipHint: "6 位数字", zipBad: "邮政编码是 6 位数字", note: "配送备注", noteHint: "选填，例如：放快递柜", show: "显示", hide: "隐藏", pw: "设置密码", pwBad: "至少 8 个字符" },
  ja: { heading: "お届け先", name: "お名前", email: "メールアドレス", emailBad: "name@example.com のような形式で入力してください", emailOk: "配送状況をこちらにお送りします", zip: "郵便番号", zipHint: "7 桁の数字", zipBad: "郵便番号は 7 桁の数字です", note: "配達メモ", noteHint: "任意。例：宅配ボックスへ", show: "表示", hide: "隠す", pw: "パスワードを作成", pwBad: "8 文字以上にしてください" },
};

const zipPattern = { en: /^\d{5}$/, "zh-TW": /^\d{3}(\d{2})?$/, "zh-CN": /^\d{6}$/, ja: /^\d{3}-?\d{4}$/ };

export default function FloatingFieldDemo() {
  const t = useDemoText(copy);
  const zip = useDemoText(zipPattern);
  const [showPw, setShowPw] = useState(false);
  return (
    <form className="w-full max-w-md rounded-lg border bg-background p-6" onSubmit={(e) => e.preventDefault()} noValidate>
      <p className="mb-4 text-base font-semibold tracking-tight">{t.heading}</p>
      <div className="grid gap-2">
        <FloatingField label={t.name} name="name" autoComplete="name" required />
        <FloatingField
          label={t.email}
          name="email"
          type="email"
          autoComplete="email"
          defaultValue="lin@exam"
          validate={(v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? true : t.emailBad)}
          successMessage={t.emailOk}
          required
        />
        <div className="grid grid-cols-[8rem_1fr] gap-2">
          <FloatingField label={t.zip} name="zip" inputMode="numeric" hint={t.zipHint} validate={(v) => (zip.test(v) ? true : t.zipBad)} validateOn="blur" />
          <FloatingField
            label={t.pw}
            name="password"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            validate={(v) => (v.length >= 8 ? true : t.pwBad)}
            trailing={
              <button type="button" onClick={() => setShowPw((s) => !s)} className="rounded px-1.5 text-xs text-muted-foreground hover:text-foreground">
                {showPw ? t.hide : t.show}
              </button>
            }
          />
        </div>
        <FloatingField label={t.note} name="note" multiline hint={t.noteHint} />
      </div>
    </form>
  );
}
