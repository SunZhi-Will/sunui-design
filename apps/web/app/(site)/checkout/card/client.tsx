"use client";

import { ShoplineCardForm } from "@/components/shopline-card-form";

import { payWithCard } from "../actions";

export function CardCheckout({
  orderId,
  config,
  amountMinor,
  language,
  labels,
}: {
  orderId: string;
  config: { clientKey: string; merchantId: string; sandbox: boolean };
  amountMinor: number;
  language: string;
  labels: { loading: string; loadError: string; submit: string; pending: string; failed: string };
}) {
  return (
    <ShoplineCardForm
      config={config}
      amountMinor={amountMinor}
      language={language}
      doneUrl={`/checkout/done?o=${orderId}`}
      labels={labels}
      onPaySession={(paySession) => payWithCard(orderId, paySession)}
    />
  );
}
