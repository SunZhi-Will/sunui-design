"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { CheckoutSteps } from "./checkout-steps";

// 結帳頁右側卡片（Card surface="solid" padding="lg"）的底色，跟著系統明暗
const card =
  "flex w-full max-w-md min-w-0 flex-col gap-2 rounded-[12px] border border-[#F0E4D8] bg-[#FFFDF9] p-6 dark:border-[rgba(246,235,227,0.07)] dark:bg-[#271E1B]";

const copy = {
  en: {
    steps: ["Review order", "Accept terms", "Payment", "Delivery"],
    heading: "Payment",
    note: "You will be sent to the secure SHOPLINE Payments page, then straight back here.",
    pay: "Go to payment NT$1,280",
  },
  "zh-TW": {
    steps: ["確認訂單", "同意條款", "付款", "交付"],
    heading: "付款",
    note: "將前往安全的 SHOPLINE Payments 付款頁，完成後直接回到這裡。",
    pay: "前往付款 NT$1,280",
  },
  "zh-CN": {
    steps: ["确认订单", "同意条款", "付款", "交付"],
    heading: "付款",
    note: "将跳转到安全的 SHOPLINE Payments 支付页面，完成后直接返回这里。",
    pay: "前往支付 NT$1,280",
  },
  ja: {
    steps: ["注文の確認", "規約に同意", "お支払い", "お届け"],
    heading: "お支払い",
    note: "安全な SHOPLINE Payments のページに移動し、完了後すぐにこちらへ戻ります。",
    pay: "お支払いへ進む NT$1,280",
  },
};

export default function CheckoutStepsDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <section aria-labelledby="pay-heading" className={card}>
      <CheckoutSteps locale={locale} steps={t.steps} current={2} />
      <h2 id="pay-heading" className="text-[22px] font-semibold tracking-[0.02em] text-[#3B2A26] dark:text-[#F6EBE3]">
        {t.heading}
      </h2>
      <p className="text-[13px] text-[#6F574F] dark:text-[#C9B5AA]">{t.note}</p>
      <button
        type="button"
        className="mt-3 h-12 w-full rounded-full bg-[#B4586C] text-[15px] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B4586C] dark:bg-[#E896A6] dark:text-[#2A1418]"
      >
        {t.pay}
      </button>
    </section>
  );
}
