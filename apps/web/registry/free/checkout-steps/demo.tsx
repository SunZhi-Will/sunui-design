"use client";

import { CheckoutSteps } from "./checkout-steps";

// 結帳頁右側卡片（Card surface="solid" padding="lg"）的底色，跟著系統明暗
const card =
  "flex w-full max-w-md min-w-0 flex-col gap-2 rounded-[12px] border border-[#F0E4D8] bg-[#FFFDF9] p-6 dark:border-[rgba(246,235,227,0.07)] dark:bg-[#271E1B]";

export default function CheckoutStepsDemo() {
  return (
    <section aria-labelledby="pay-heading" className={card}>
      <CheckoutSteps steps={["Review order", "Accept terms", "Payment", "Delivery"]} current={2} />
      <h2 id="pay-heading" className="text-[22px] font-semibold tracking-[0.02em] text-[#3B2A26] dark:text-[#F6EBE3]">
        Payment
      </h2>
      <p className="text-[13px] text-[#6F574F] dark:text-[#C9B5AA]">You will be sent to the secure SHOPLINE Payments page, then straight back here.</p>
      <button
        type="button"
        className="mt-3 h-12 w-full rounded-full bg-[#B4586C] text-[15px] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B4586C] dark:bg-[#E896A6] dark:text-[#2A1418]"
      >
        Go to payment NT$1,280
      </button>
    </section>
  );
}
