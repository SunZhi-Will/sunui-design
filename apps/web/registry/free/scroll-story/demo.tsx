"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { ScrollStory, type ScrollStoryStep } from "./scroll-story";

const ease = [0.23, 1, 0.32, 1] as const;

function Panel({ children }: { children: ReactNode }) {
  return <div className="flex h-full flex-col justify-center gap-2 p-6 text-sm">{children}</div>;
}

const orders = [
  ["#1042", "$84.00"],
  ["#1043", "$36.50"],
  ["#1044", "$120.00"],
  ["#1045", "$18.20"],
];

const steps: ScrollStoryStep[] = [
  {
    id: "collect",
    title: "Orders come in",
    body: "Every paid order lands in your balance the moment the card clears. Refunds are netted out automatically.",
    visual: (active) => (
      <Panel>
        {orders.map(([id, amt], i) => (
          <motion.div
            key={id}
            className="flex items-center justify-between rounded-md border border-border px-3 py-2"
            initial={active ? { opacity: 0, x: -12 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12, duration: 0.36, ease }}
          >
            <span className="font-mono text-xs text-muted-foreground">{id}</span>
            <span className="tabular-nums">{amt}</span>
          </motion.div>
        ))}
      </Panel>
    ),
  },
  {
    id: "hold",
    title: "A short hold protects you",
    body: "New balances wait 2 days in case a buyer disputes the charge. You can see exactly when each one is released.",
    visual: (active) => (
      <Panel>
        <div className="flex items-baseline justify-between">
          <span className="text-muted-foreground">Available on Nov 8</span>
          <span className="text-lg font-semibold tabular-nums">$258.70</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full origin-left rounded-full bg-primary"
            initial={active ? { scaleX: 0 } : false}
            animate={{ scaleX: 0.6 }}
            transition={{ duration: 0.56, ease }}
          />
        </div>
        <span className="text-xs text-muted-foreground">1 of 2 days</span>
      </Panel>
    ),
  },
  {
    id: "check",
    title: "We check the details",
    body: "Bank details and tax info are verified once. If something is missing, we tell you what and why before payday.",
    visual: (active) => (
      <Panel>
        {["Bank account verified", "Tax form on file", "No open disputes"].map((label, i) => (
          <motion.div
            key={label}
            className="flex items-center gap-2"
            initial={active ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 + i * 0.2, duration: 0.24 }}
          >
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            {label}
          </motion.div>
        ))}
      </Panel>
    ),
  },
  {
    id: "paid",
    title: "Money hits your bank",
    body: "Payouts go out every Friday. You get a receipt with every order that made it up.",
    visual: (active) => (
      <Panel>
        <motion.div
          className="rounded-lg border border-border p-4"
          initial={active ? { opacity: 0, y: 12 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, ease }}
        >
          <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">Payout</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">$258.70</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">PO-2026-1108 to Bank ****4021</p>
        </motion.div>
      </Panel>
    ),
  },
];

export default function ScrollStoryDemo() {
  return (
    <section className="w-full max-w-4xl space-y-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">How payouts work</h2>
        <p className="mt-1 text-sm text-muted-foreground">From a paid order to money in your account.</p>
      </div>
      <ScrollStory steps={steps} />
    </section>
  );
}
