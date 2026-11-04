"use client";

import { useRef } from "react";

import { PaymentStatusBanner, type PaymentCheckResult } from "./payment-status-banner";

export default function PaymentStatusBannerDemo() {
  // 模擬金流：第三次查詢時確認付款
  const calls = useRef(0);
  const check = async (): Promise<PaymentCheckResult> => {
    calls.current += 1;
    return calls.current >= 3 ? "paid" : "pending";
  };

  return (
    <section aria-labelledby="orders-heading" className="w-full max-w-[52rem] space-y-5">
      <div>
        <h2 id="orders-heading" className="text-xl font-semibold tracking-tight">
          Your recent orders
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Back from checkout. Here's where each payment stands.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <PaymentStatusBanner
          check={check}
          interval={1500}
          orderId="SU-48213"
          amount={128}
          email="mia@example.com"
          successAction={{ label: "View order", href: "#" }}
        />
        <PaymentStatusBanner
          defaultStatus="paid"
          orderId="SU-48190"
          amount={64.5}
          successAction={{ label: "Track shipment", href: "#" }}
        />
        <PaymentStatusBanner
          defaultStatus="failed"
          orderId="SU-48177"
          amount={42}
          reason="Your card was declined by the bank. You haven't been charged."
          onRetry={() => {}}
        />
        <PaymentStatusBanner
          check={async () => "pending"}
          interval={1500}
          maxAttempts={2}
          orderId="SU-48166"
          amount={219}
          email="mia@example.com"
        />
      </div>
    </section>
  );
}
