"use client";

import { HoverCard } from "./hover-card";

function Sketch({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 120 90" className="size-full bg-[#f1ece1] text-[#1c1917]/45 dark:bg-[#2a2620] dark:text-[#ece7dc]/40" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HoverCardDemo() {
  return (
    <div className="w-full max-w-md rounded-md border border-border bg-card p-4 text-sm text-card-foreground sm:p-5">
      <p className="text-sm font-semibold tracking-tight">Frequently bought together</p>
      <ul className="mt-3 divide-y divide-border">
        <li className="flex items-baseline justify-between gap-3 py-2.5">
          <HoverCard
            href="#linen-tote"
            onAddToCart={() => {}}
            product={{
              name: "Washed linen tote",
              meta: "Natural, 38 x 42 cm",
              price: 32,
              compareAt: 40,
              image: <Sketch d="M30 35h60l-6 40H36zM45 35c0-12 30-12 30 0" />,
            }}
          >
            Washed linen tote
          </HoverCard>
          <span className="text-muted-foreground tabular-nums">$32.00</span>
        </li>
        <li className="flex items-baseline justify-between gap-3 py-2.5">
          <HoverCard
            href="#mug"
            onAddToCart={() => {}}
            product={{
              name: "Stoneware mug",
              meta: "Ash glaze, 350 ml",
              price: 18,
              image: <Sketch d="M38 30h36v40a6 6 0 0 1-6 6H44a6 6 0 0 1-6-6zM74 40h8a8 8 0 0 1 0 16h-8" />,
            }}
          >
            Stoneware mug
          </HoverCard>
          <span className="text-muted-foreground tabular-nums">$18.00</span>
        </li>
        <li className="flex items-baseline justify-between gap-3 py-2.5">
          <HoverCard
            href="#notebook"
            onAddToCart={() => {}}
            product={{ name: "Dot grid notebook", meta: "A5, 160 pages", price: 14 }}
          >
            Dot grid notebook
          </HoverCard>
          <span className="text-muted-foreground tabular-nums">$14.00</span>
        </li>
      </ul>
    </div>
  );
}
