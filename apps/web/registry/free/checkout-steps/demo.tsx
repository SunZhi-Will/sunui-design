"use client";

import { useRef, useState } from "react";

import { useDemoAutoplay } from "@/lib/demo-autoplay";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { CheckoutSteps } from "./checkout-steps";

type StepCopy = { heading: string; note: string; cta: string };

const copy = {
  en: {
    steps: ["Review order", "Delivery", "Payment", "Confirmation"],
    summaries: ["2 items · NT$1,280", "7-Eleven 信義店 pickup"],
    body: [
      { heading: "Review order", note: "Linen tote ×1, canvas pouch ×1. Total NT$1,280 including tax.", cta: "Continue to delivery" },
      { heading: "Delivery", note: "Pick up at 7-Eleven 信義店. We will text you when the parcel arrives.", cta: "Continue to payment" },
      { heading: "Payment", note: "You will be sent to the secure SHOPLINE Payments page, then straight back here.", cta: "Pay NT$1,280" },
    ] as StepCopy[],
  },
  "zh-TW": {
    steps: ["確認訂單", "配送", "付款", "完成"],
    summaries: ["2 件 · NT$1,280", "7-11 信義店取貨"],
    body: [
      { heading: "確認訂單", note: "亞麻托特包 ×1、帆布收納包 ×1，含稅共 NT$1,280。", cta: "下一步：配送" },
      { heading: "配送", note: "到 7-11 信義店取貨，包裹到店時會傳簡訊通知你。", cta: "下一步：付款" },
      { heading: "付款", note: "將前往安全的 SHOPLINE Payments 付款頁，完成後直接回到這裡。", cta: "付款 NT$1,280" },
    ] as StepCopy[],
  },
  "zh-CN": {
    steps: ["确认订单", "配送", "付款", "完成"],
    summaries: ["2 件 · NT$1,280", "7-11 信义店自提"],
    body: [
      { heading: "确认订单", note: "亚麻托特包 ×1、帆布收纳包 ×1，含税共 NT$1,280。", cta: "下一步：配送" },
      { heading: "配送", note: "到 7-11 信义店自提，包裹到店后会发短信通知你。", cta: "下一步：付款" },
      { heading: "付款", note: "将跳转到安全的 SHOPLINE Payments 支付页面，完成后直接返回这里。", cta: "支付 NT$1,280" },
    ] as StepCopy[],
  },
  ja: {
    steps: ["注文の確認", "お届け", "お支払い", "完了"],
    summaries: ["2点 · NT$1,280", "セブン 信義店で受取"],
    body: [
      { heading: "注文の確認", note: "リネントート ×1、キャンバスポーチ ×1。税込 NT$1,280。", cta: "お届け方法へ進む" },
      { heading: "お届け", note: "セブン‐イレブン 信義店で受け取り。到着したら SMS でお知らせします。", cta: "お支払いへ進む" },
      { heading: "お支払い", note: "安全な SHOPLINE Payments のページに移動し、完了後すぐにこちらへ戻ります。", cta: "NT$1,280 を支払う" },
    ] as StepCopy[],
  },
};

export default function CheckoutStepsDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const ref = useRef<HTMLElement>(null);
  const [current, setCurrent] = useState(0);

  // 預覽自己演：按主按鈕走到付款，點已完成的取貨門市回去改，再前進
  const cursor = useDemoAutoplay(ref, async (d) => {
    const next = () => d.find(":scope > button");
    await d.click(next);
    await d.wait(1100);
    await d.click(next);
    await d.wait(1300);
    await d.click(() => d.find("ol button", t.summaries[1]));
    await d.wait(1100);
    await d.click(next);
  });

  const body = t.body[current];
  return (
    <section
      ref={ref}
      aria-labelledby="checkout-heading"
      className="relative flex w-full max-w-lg min-w-0 flex-col gap-2 rounded-xl border border-border bg-card p-5 sm:p-6"
    >
      <CheckoutSteps
        locale={locale}
        steps={t.steps}
        current={current}
        summaries={t.summaries}
        onStepClick={setCurrent}
        className="mb-3"
      />
      <h2 id="checkout-heading" className="text-[20px] font-semibold text-foreground">
        {body.heading}
      </h2>
      <p className="text-[13px] text-muted-foreground">{body.note}</p>
      <button
        type="button"
        onClick={() => setCurrent((c) => Math.min(c + 1, 2))}
        className="mt-3 h-11 w-full rounded-md bg-primary text-[15px] font-medium text-primary-foreground tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {body.cta}
      </button>
      {cursor}
    </section>
  );
}
