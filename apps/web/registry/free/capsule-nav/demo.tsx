"use client";

import { useRef } from "react";

import { CapsuleNav, type CapsuleNavItem } from "./capsule-nav";

const items: CapsuleNavItem[] = [
  { id: "capsule-features", label: "Features" },
  { id: "capsule-pricing", label: "Pricing" },
  { id: "capsule-reviews", label: "Reviews" },
  { id: "capsule-faq", label: "FAQ" },
];

const sections = [
  {
    id: "capsule-features",
    title: "Everything a small studio needs",
    body: "Bookings, invoices and client notes in one place. Reminders go out on their own, so you stop chasing deposits.",
    rows: ["Online booking with deposits", "Invoices that match your calendar", "Client notes shared with your team"],
  },
  {
    id: "capsule-pricing",
    title: "One plan, priced per seat",
    body: "$12 per seat each month, billed yearly. The first seat is free forever, with no card needed to start.",
    rows: ["Unlimited bookings", "Card and bank transfer payments", "Cancel any time from settings"],
  },
  {
    id: "capsule-reviews",
    title: "Studios that switched",
    body: "“We stopped double booking the week we moved over.” Mia, Northlight Ceramics",
    rows: ["4.8 average from 320 reviews", "Most used for classes and workshops", "Support replies within a day"],
  },
  {
    id: "capsule-faq",
    title: "Questions",
    body: "Can I import my calendar? Yes, from Google and Outlook. Do clients need an account? No, they book with an email.",
    rows: ["Data export as CSV any time", "Hosted in the EU", "Works on phones and tablets"],
  },
];

export default function CapsuleNavDemo() {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-background text-foreground">
      <div ref={scrollRef} className="relative h-[420px] overflow-y-auto overscroll-contain">
        <CapsuleNav
          fixed={false}
          hideOnScroll
          scrollContainer={scrollRef}
          items={items}
          logo={<span className="text-sm font-semibold tracking-tight">Larkspur</span>}
          cta={
            <a
              href="#capsule-pricing"
              className="block rounded-full bg-primary px-3.5 py-1.5 text-center text-sm font-medium text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Start free
            </a>
          }
        />

        <header className="px-6 pt-10 pb-12 text-center">
          <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">Studio software</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Run your studio from one calm screen</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Book classes, send invoices and keep client notes without switching tabs.
          </p>
        </header>

        {sections.map((s) => (
          <section key={s.id} id={s.id} className="border-t border-border px-6 py-10">
            <h3 className="text-lg font-semibold tracking-tight">{s.title}</h3>
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">{s.body}</p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-3">
              {s.rows.map((r) => (
                <li key={r} className="rounded-xl border border-border bg-card px-3 py-3 text-sm text-card-foreground">
                  {r}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
