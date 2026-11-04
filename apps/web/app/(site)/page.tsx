import Link from "next/link";

import { Catalog } from "@/components/catalog";
import { Command } from "@/components/command";
import { WaitlistForm } from "@/components/waitlist-form";
import { getItems, installCommand } from "@/lib/registry";

export default function HomePage() {
  const all = getItems();
  const items = all
    .map(({ name, title, description, meta, categories }) => ({ name, title, description, meta, categories }))
    .sort((a, b) => b.meta.addedAt.localeCompare(a.meta.addedAt) || a.title.localeCompare(b.title));
  const freeCount = all.filter((item) => item.meta.tier === "free").length;
  const proCount = all.length - freeCount;
  const firstFree = all.find((item) => item.meta.tier === "free");

  return (
    <>
      <section className="py-16 sm:py-24">
        <p className="mb-4 text-sm font-medium text-accent">React · Tailwind · Motion · shadcn registry</p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          Animated blocks for campaigns that convert.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-pretty text-subtle">
          Countdowns, coupons, carts, checkout and pricing sections, ready for your next sale. Accessible by default,
          installed with one command, owned by you.
        </p>
        {firstFree && (
          <div className="mt-8 max-w-2xl">
            <Command value={installCommand(firstFree)} />
          </div>
        )}
        <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4 text-sm">
          <Stat label="blocks" value={all.length} />
          <Stat label="free, MIT" value={freeCount} />
          <Stat label="Pro sections" value={proCount} />
        </dl>
      </section>

      <Catalog items={items} />

      <section aria-labelledby="why-title" className="mt-24">
        <h2 id="why-title" className="text-2xl font-semibold tracking-tight">
          Why SunUI
        </h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {reasons.map((reason) => (
            <div key={reason.title} className="rounded-2xl border border-line bg-card p-6">
              <h3 className="font-medium">{reason.title}</h3>
              <p className="mt-2 text-sm text-pretty text-subtle">{reason.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="pro-title"
        className="mt-24 grid gap-8 rounded-3xl border border-accent/40 bg-accent-soft/40 p-8 md:grid-cols-[1.2fr_1fr] md:items-center sm:p-10"
      >
        <div>
          <p className="text-sm font-medium text-accent">SunUI Pro</p>
          <h2 id="pro-title" className="mt-2 text-3xl font-semibold tracking-tight text-balance">
            Every campaign section, one payment, yours forever.
          </h2>
          <p className="mt-3 text-pretty text-subtle">
            {proCount} Pro sections today, new ones every week. Founding members get lifetime access for $79.
          </p>
          <Link
            href="/pricing"
            className="mt-6 inline-flex rounded-xl bg-fg px-5 py-2.5 text-sm font-medium text-bg hover:opacity-90"
          >
            See pricing
          </Link>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium">Get launch updates</p>
          <WaitlistForm source="home" />
        </div>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="sr-only">{label}</dt>
      <dd className="text-3xl font-semibold tabular-nums tracking-tight">{value}</dd>
      <span className="text-subtle" aria-hidden="true">
        {label}
      </span>
    </div>
  );
}

const reasons = [
  {
    title: "Built for sales moments",
    body: "Flash sales, coupons, free shipping goals, carts, checkout and loyalty. Sections you can ship for Double 11 or Black Friday this week, not demos.",
  },
  {
    title: "Accessible by default",
    body: "Every block respects reduced motion, works with a keyboard and announces changes to screen readers. CJK text is a first-class citizen.",
  },
  {
    title: "Works where you work",
    body: "Install with the shadcn CLI or let your AI agent do it through the shadcn MCP server. The source lands in your repo, so you own every line.",
  },
];
