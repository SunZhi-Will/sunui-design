"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { TermsConsent } from "./terms-consent";

const copy = {
  en: { terms: "Terms of Sale", privacy: "Privacy Notice", pay: "Pay $86.40", ready: "All set.", blocked: (n: number) => <>Tick {n} more to continue.</> },
  "zh-TW": { terms: "銷售條款", privacy: "隱私權聲明", pay: "付款 $86.40", ready: "已完成。", blocked: (n: number) => <>再勾 {n} 項即可繼續。</> },
  "zh-CN": { terms: "销售条款", privacy: "隐私声明", pay: "支付 $86.40", ready: "已完成。", blocked: (n: number) => <>再勾选 {n} 项即可继续。</> },
  ja: { terms: "販売条件", privacy: "プライバシーに関するお知らせ", pay: "$86.40 を支払う", ready: "準備完了です。", blocked: (n: number) => <>あと {n} 件チェックで続行できます。</> },
};

/** 型錄卡片：兩項必填條款，勾完計數到 2 / 2 才啟用結帳按鈕。 */
export default function TermsConsentCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <div className="mx-auto w-72">
      <TermsConsent
        locale={locale}
        items={[
          { id: "terms", label: t.terms, required: true },
          { id: "privacy", label: t.privacy, required: true },
        ]}
        submitLabel={t.pay}
        labels={{ ready: t.ready, blocked: t.blocked }}
      />
    </div>
  );
}
