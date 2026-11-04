"use client";

import { NumberedSteps } from "./numbered-steps";

// 結帳頁右側卡片（Card surface="solid" padding="lg"）的底色，跟著系統明暗
const card =
  "flex w-full max-w-md min-w-0 flex-col gap-5 rounded-[12px] border border-[#F0E4D8] bg-[#FFFDF9] p-6 dark:border-[rgba(246,235,227,0.07)] dark:bg-[#271E1B]";

export default function NumberedStepsDemo() {
  return (
    <section aria-labelledby="pay-heading" className={card}>
      <h2 id="pay-heading" className="text-[22px] font-semibold tracking-[0.02em] text-[#3B2A26] dark:text-[#F6EBE3]">
        Payment
      </h2>
      <NumberedSteps
        items={[
          <>
            Press <strong>Go to payment</strong> to open the secure SHOPLINE Payments page.
          </>,
          <>When payment is done you come straight back here, and the avatar goes into your library.</>,
        ]}
      />
    </section>
  );
}
