"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { NumberedSteps } from "./numbered-steps";

// 結帳頁右側卡片（Card surface="solid" padding="lg"）的底色，跟著系統明暗
const card =
  "flex w-full max-w-md min-w-0 flex-col gap-5 rounded-[12px] border border-[#F0E4D8] bg-[#FFFDF9] p-6 dark:border-[rgba(246,235,227,0.07)] dark:bg-[#271E1B]";

const copy = {
  en: {
    heading: "Payment",
    step1: (
      <>
        Press <strong>Go to payment</strong> to open the secure SHOPLINE Payments page.
      </>
    ),
    step2: <>When payment is done you come straight back here, and the avatar goes into your library.</>,
  },
  "zh-TW": {
    heading: "付款",
    step1: (
      <>
        按下<strong>前往付款</strong>，開啟安全的 SHOPLINE Payments 付款頁。
      </>
    ),
    step2: <>付款完成後會直接回到這裡，頭像也會加入你的收藏庫。</>,
  },
  "zh-CN": {
    heading: "付款",
    step1: (
      <>
        点击<strong>前往付款</strong>，打开安全的 SHOPLINE Payments 支付页面。
      </>
    ),
    step2: <>支付完成后会直接回到这里，头像也会加入你的收藏库。</>,
  },
  ja: {
    heading: "お支払い",
    step1: (
      <>
        <strong>お支払いへ進む</strong>を押すと、安全な SHOPLINE Payments のページが開きます。
      </>
    ),
    step2: <>お支払いが完了するとこの画面に戻り、アバターがライブラリに追加されます。</>,
  },
};

export default function NumberedStepsDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <section aria-labelledby="pay-heading" className={card}>
      <h2 id="pay-heading" className="text-[22px] font-semibold tracking-[0.02em] text-[#3B2A26] dark:text-[#F6EBE3]">
        {t.heading}
      </h2>
      <NumberedSteps locale={locale} items={[t.step1, t.step2]} />
    </section>
  );
}
