import type { Metadata } from "next";
import Link from "next/link";

import { WaitlistForm } from "@/components/waitlist-form";
import { getItems } from "@/lib/registry";
import { checkoutUrls, foundingState, foundingWindow } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free MIT blocks, plus a one-time Pro license for production-ready commerce and campaign sections.",
};

// Founding member 的開賣狀態依日期變化，每小時重新產生
export const revalidate = 3600;

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "Asia/Taipei" });

export default function PricingPage() {
  const state = foundingState();
  const proCount = getItems("pro").length;
  const freeCount = getItems("free").length;

  const plans = [
    {
      name: "Free",
      price: "$0",
      note: "MIT license",
      features: [`${freeCount} free ${freeCount === 1 ? "block" : "blocks"} and counting`, "Install with the shadcn CLI", "Use anywhere, commercial included"],
      cta: { label: "Browse blocks", href: "/" },
    },
    {
      name: "Pro",
      price: "$129",
      note: "one-time, 1 developer",
      highlight: true,
      features: [
        "Every Pro block and template",
        "All future blocks, no subscription",
        "Private @sunui-pro registry for the CLI and AI agents",
        "Unlimited personal and client projects",
      ],
      cta: checkoutUrls.pro ? { label: "Get Pro", href: checkoutUrls.pro } : { label: "Join the waitlist", href: "#waitlist" },
    },
    {
      name: "Team",
      price: "$349",
      note: "one-time, up to 5 developers",
      features: ["Everything in Pro", "5 seats on one license", "Priority email support"],
      cta: checkoutUrls.team ? { label: "Get Team", href: checkoutUrls.team } : { label: "Join the waitlist", href: "#waitlist" },
    },
  ];

  return (
    <div className="py-16 sm:py-20">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">Pay once. Ship forever.</h1>
        <p className="mt-4 text-lg text-pretty text-subtle">
          Free blocks stay free. Pro unlocks production-ready commerce and campaign sections, with every future block
          included.
        </p>
      </header>

      {state !== "closed" && (
        <section
          aria-labelledby="founding-title"
          className="mx-auto mt-12 max-w-3xl rounded-2xl border border-accent/40 bg-accent-soft/40 p-6 sm:p-8"
        >
          <p className="text-sm font-medium text-accent">Founding member</p>
          <h2 id="founding-title" className="mt-1 text-2xl font-semibold tracking-tight">
            $79 for lifetime Pro, {foundingWindow.seats} seats only
          </h2>
          <p className="mt-2 text-sm text-subtle">
            {state === "upcoming"
              ? `Opens ${dateFormat.format(foundingWindow.opensAt)} and closes ${dateFormat.format(new Date(foundingWindow.closesAt.getTime() - 1))}, or when seats run out. Join the waitlist to get first access.`
              : `On sale until ${dateFormat.format(new Date(foundingWindow.closesAt.getTime() - 1))}, or until seats run out. Same as Pro, at the founding price.`}
          </p>
          <div className="mt-5 max-w-md">
            {state === "open" && checkoutUrls.founding ? (
              <a
                href={checkoutUrls.founding}
                className="inline-flex rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg hover:opacity-90"
              >
                Become a founding member
              </a>
            ) : (
              <WaitlistForm source="pricing-founding" />
            )}
          </div>
        </section>
      )}

      <section aria-label="Plans" className="mt-12 grid gap-5 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              "flex flex-col rounded-2xl border bg-card p-6",
              plan.highlight ? "border-fg" : "border-line",
            )}
          >
            <h2 className="font-medium">{plan.name}</h2>
            <p className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
              <span className="text-sm text-subtle">{plan.note}</span>
            </p>
            <ul className="mt-6 grid flex-1 content-start gap-2.5 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span aria-hidden="true" className="text-accent">
                    ✓
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href={plan.cta.href}
              className={cn(
                "mt-8 rounded-xl px-4 py-2.5 text-center text-sm font-medium transition-opacity hover:opacity-90",
                plan.highlight ? "bg-fg text-bg" : "border border-line",
              )}
            >
              {plan.cta.label}
            </Link>
          </div>
        ))}
      </section>

      <p className="mt-6 text-center text-sm text-subtle">
        {proCount} Pro {proCount === 1 ? "block" : "blocks"} today, new ones every week. Prices in USD, taxes handled at
        checkout.
      </p>

      <section id="waitlist" aria-labelledby="waitlist-title" className="mx-auto mt-20 max-w-md scroll-mt-24 text-center">
        <h2 id="waitlist-title" className="text-xl font-semibold tracking-tight">
          Get launch updates
        </h2>
        <p className="mt-2 mb-5 text-sm text-subtle">One email when Pro opens. No spam.</p>
        <WaitlistForm source="pricing" />
      </section>

      <section aria-labelledby="faq-title" className="mx-auto mt-20 max-w-2xl">
        <h2 id="faq-title" className="mb-6 text-xl font-semibold tracking-tight">
          Questions
        </h2>
        <dl className="grid gap-6 text-sm">
          {faqs.map((faq) => (
            <div key={faq.q}>
              <dt className="font-medium">{faq.q}</dt>
              <dd className="mt-1.5 text-pretty text-subtle">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

const faqs = [
  {
    q: "Is this a subscription?",
    a: "No. You pay once and keep access to every current and future Pro block.",
  },
  {
    q: "How do I install Pro blocks?",
    a: "Add the @sunui-pro registry to components.json, put your license key in .env.local, then run npx shadcn@latest add @sunui-pro/<block>. It works the same from AI agents that use the shadcn CLI or MCP server.",
  },
  {
    q: "Can I use Pro blocks in client work?",
    a: "Yes. Build unlimited sites and apps for yourself or your clients. You cannot resell or publish the source, or turn it into a competing UI kit. See the license for details.",
  },
  {
    q: "Do blocks work with reduced motion and screen readers?",
    a: "Every block respects prefers-reduced-motion and ships with keyboard and screen reader support.",
  },
];
