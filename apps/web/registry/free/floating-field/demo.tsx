"use client";

import { useRef, useState } from "react";

import { useDemoAutoplay } from "@/lib/demo-autoplay";
import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { FloatingField, suggestEmail } from "./floating-field";

const copy = {
  en: { heading: "Shipping details", name: "Full name", email: "Email", emailBad: "That email is missing something, like name@example.com", emailOk: "We will send tracking here", zip: "ZIP code", zipBad: "ZIP codes are 5 digits", zipTyped: "94107", note: "Delivery note", noteHint: "Optional", noteTyped: "Leave it at the front desk, please", show: "Show", hide: "Hide", pw: "Create a password", pwBad: "Use at least 8 characters" },
  "zh-TW": { heading: "收件資料", name: "收件人姓名", email: "Email", emailBad: "Email 格式不完整，例如 name@example.com", emailOk: "物流通知會寄到這裡", zip: "郵遞區號", zipBad: "郵遞區號是 6 碼數字", zipTyped: "106001", note: "配送備註", noteHint: "選填", noteTyped: "請放管理室，謝謝", show: "顯示", hide: "隱藏", pw: "設定密碼", pwBad: "至少 8 個字元" },
  "zh-CN": { heading: "收货信息", name: "收货人姓名", email: "Email", emailBad: "Email 格式不完整，例如 name@example.com", emailOk: "物流通知会发到这里", zip: "邮政编码", zipBad: "邮政编码是 6 位数字", zipTyped: "200030", note: "配送备注", noteHint: "选填", noteTyped: "请放快递柜，谢谢", show: "显示", hide: "隐藏", pw: "设置密码", pwBad: "至少 8 个字符" },
  ja: { heading: "お届け先", name: "お名前", email: "メールアドレス", emailBad: "name@example.com のような形式で入力してください", emailOk: "配送状況をこちらにお送りします", zip: "郵便番号", zipBad: "郵便番号は 7 桁の数字です", zipTyped: "1500001", note: "配達メモ", noteHint: "任意", noteTyped: "宅配ボックスへお願いします", show: "表示", hide: "隠す", pw: "パスワードを作成", pwBad: "8 文字以上にしてください" },
};

// 各地郵遞區號的格式範本：台灣 3+3、日本 3+4
const zipMask = { en: "99999", "zh-TW": "999-999", "zh-CN": "999999", ja: "999-9999" };

const email = (bad: string) => (v: string) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? true : bad);

export default function FloatingFieldDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const mask = useDemoText(zipMask);
  const [showPw, setShowPw] = useState(false);
  const ref = useRef<HTMLFormElement>(null);

  // 預覽自己演：Email 打錯網域被建議修正、點一下只換掉錯的字母；郵遞區號逐字填滿灰格；備註打字看字數
  const cursor = useDemoAutoplay(ref, async (d) => {
    const field = (name: string) => () => d.find(`[name=${name}]`);
    await d.click(field("email"));
    await d.type(field("email"), "lin@gmial.com");
    await d.click(field("zip"));
    await d.wait(500);
    await d.click(() => d.find("button", "gmail.com"));
    await d.wait(700);
    await d.click(field("zip"));
    await d.type(field("zip"), t.zipTyped, { cps: 9 });
    await d.wait(300);
    await d.click(field("note"));
    await d.type(field("note"), t.noteTyped, { cps: 14 });
    ref.current?.querySelector<HTMLElement>("[name=note]")?.blur();
  });

  return (
    <form ref={ref} className="relative w-full max-w-md rounded-lg border bg-background p-6" onSubmit={(e) => e.preventDefault()} noValidate>
      <p className="mb-4 text-base font-semibold tracking-tight">{t.heading}</p>
      <div className="grid gap-2">
        <FloatingField label={t.name} name="name" autoComplete="name" defaultValue={locale === "en" ? "Lin Wei" : locale === "ja" ? "林 偉" : "林偉"} required />
        <FloatingField
          label={t.email}
          name="email"
          type="email"
          autoComplete="email"
          locale={locale}
          validate={email(t.emailBad)}
          suggest={suggestEmail}
          successMessage={t.emailOk}
          required
        />
        <div className="grid grid-cols-[8.5rem_1fr] gap-2">
          <FloatingField label={t.zip} name="zip" inputMode="numeric" mask={mask} validate={(v) => (v.length === mask.length ? true : t.zipBad)} validateOn="blur" />
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
        <FloatingField label={t.note} name="note" multiline maxLength={40} hint={t.noteHint} />
      </div>
      {cursor}
    </form>
  );
}
