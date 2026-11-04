"use client";

import { TermsConsent, type ConsentItem } from "./terms-consent";

const items: ConsentItem[] = [
  {
    id: "terms",
    label: "I agree to the Terms of Sale",
    description: "Including the 14 day return window and shipping policy.",
    required: true,
  },
  {
    id: "privacy",
    label: "I have read the Privacy Notice",
    description: "We use your address and phone number only to deliver this order.",
    required: true,
  },
  {
    id: "news",
    label: "Email me restock alerts and member offers",
    description: "Unsubscribe any time. Not needed to complete your order.",
  },
];

export default function TermsConsentDemo() {
  return (
    <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
      <TermsConsent items={items} />
      <TermsConsent items={items} defaultValue={["terms", "privacy"]} submitLabel="Pay $86.40" />
    </div>
  );
}
