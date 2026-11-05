"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { TermsConsent, type ConsentItem } from "./terms-consent";

const copy: { en: Demo } & Record<"zh-TW" | "zh-CN" | "ja", Demo> = {
  en: {
    pay: "Pay $86.40",
    items: [
      { id: "terms", label: "I agree to the Terms of Sale", description: "Including the 14 day return window and shipping policy.", required: true },
      { id: "privacy", label: "I have read the Privacy Notice", description: "We use your address and phone number only to deliver this order.", required: true },
      { id: "news", label: "Email me restock alerts and member offers", description: "Unsubscribe any time. Not needed to complete your order." },
    ],
  },
  "zh-TW": {
    pay: "付款 $86.40",
    items: [
      { id: "terms", label: "我同意銷售條款", description: "包含 14 天退貨期限與運送政策。", required: true },
      { id: "privacy", label: "我已閱讀隱私權聲明", description: "你的地址與電話只會用來寄送這筆訂單。", required: true },
      { id: "news", label: "以電子郵件通知我補貨與會員優惠", description: "隨時可以取消訂閱，不影響完成訂單。" },
    ],
  },
  "zh-CN": {
    pay: "支付 $86.40",
    items: [
      { id: "terms", label: "我同意销售条款", description: "包括 14 天退货期限和配送政策。", required: true },
      { id: "privacy", label: "我已阅读隐私声明", description: "你的地址和电话仅用于配送本订单。", required: true },
      { id: "news", label: "通过邮件接收补货提醒和会员优惠", description: "可随时退订，不影响完成订单。" },
    ],
  },
  ja: {
    pay: "$86.40 を支払う",
    items: [
      { id: "terms", label: "販売条件に同意します", description: "14 日間の返品期間と配送ポリシーを含みます。", required: true },
      { id: "privacy", label: "プライバシーに関するお知らせを読みました", description: "住所と電話番号は、このご注文の配送にのみ使用します。", required: true },
      { id: "news", label: "再入荷のお知らせと会員特典をメールで受け取る", description: "いつでも配信停止できます。ご注文には必要ありません。" },
    ],
  },
};

interface Demo {
  pay: string;
  items: ConsentItem[];
}

export default function TermsConsentDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
      <TermsConsent locale={locale} items={t.items} />
      <TermsConsent locale={locale} items={t.items} defaultValue={["terms", "privacy"]} submitLabel={t.pay} />
    </div>
  );
}
