"use client";

import { CheckoutSteps, NumberedSteps } from "./checkout-steps";

// 結帳頁右側卡片（Card surface="solid" padding="lg"）的底色，跟著系統明暗
const card =
  "flex min-w-0 flex-col gap-2 rounded-[12px] border border-[#F0E4D8] bg-[#FFFDF9] p-6 dark:border-[rgba(246,235,227,0.07)] dark:bg-[#271E1B]";
const title = "text-[22px] font-semibold tracking-[0.02em] text-[#3B2A26] dark:text-[#F6EBE3]";

export default function CheckoutStepsDemo() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
      <section aria-labelledby="pay-heading" className={card}>
        <CheckoutSteps steps={["Review order", "Accept terms", "Payment", "Delivery"]} current={2} />
        <div className="flex flex-col gap-5">
          <h2 id="pay-heading" className={title}>
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
          <button
            type="button"
            className="h-12 w-full rounded-full bg-[#B4586C] text-[15px] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B4586C] dark:bg-[#E896A6] dark:text-[#2A1418]"
          >
            Go to payment NT$1,280
          </button>
        </div>
      </section>

      <section aria-labelledby="terms-heading" className={card}>
        <CheckoutSteps steps={["Review order", "Accept terms"]} current={1} />
        <h2 id="terms-heading" className={title}>
          Confirm and accept the terms
        </h2>
        <p className="text-[13px] text-[#6F574F] dark:text-[#C9B5AA]">
          This is a digital item. Take a minute to check the two items below; both must be ticked before you can continue.
        </p>
      </section>
    </div>
  );
}
