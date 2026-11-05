"use client";

import { TermsConsent, type ConsentItem } from "./terms-consent";

const items: ConsentItem[] = [
  { id: "terms", label: "Terms of Sale", required: true },
  { id: "privacy", label: "Privacy Notice", required: true },
];

/** 型錄卡片：兩項必填條款，勾完計數到 2 / 2 才啟用結帳按鈕。 */
export default function TermsConsentCard() {
  return (
    <div className="mx-auto w-72">
      <TermsConsent items={items} submitLabel="Pay $86.40" labels={{ ready: "All set.", blocked: (n) => <>Tick {n} more to continue.</> }} />
    </div>
  );
}
