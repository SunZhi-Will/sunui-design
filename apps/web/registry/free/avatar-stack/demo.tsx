"use client";

import { ProductArt, productNames, type ProductKind } from "@/registry/_demo/product-art";

import { AvatarStack, type AvatarStackPerson } from "./avatar-stack";

const buyers: AvatarStackPerson[] = [
  { id: "1", name: "Mina P.", note: "Taipei, 2 hours ago" },
  { id: "2", name: "Leo C.", note: "Osaka, 5 hours ago" },
  { id: "3", name: "Ava L.", note: "Seoul, yesterday" },
  { id: "4", name: "Noah W.", note: "Taichung, yesterday" },
  { id: "5", name: "Sara K.", note: "Singapore, 2 days ago" },
];

const related: { kind: ProductKind; price: string; buyers: number }[] = [
  { kind: "mug", price: "$24", buyers: 412 },
  { kind: "tote", price: "$36", buyers: 96 },
];

export default function AvatarStackDemo() {
  return (
    <div className="grid w-full max-w-3xl gap-6 text-foreground md:grid-cols-[1.4fr_1fr]">
      <article className="grid gap-5 rounded-md border border-border bg-card p-4 sm:grid-cols-[9rem_1fr] sm:p-5">
        <ProductArt kind="bottle" className="rounded-[3px] max-sm:aspect-[16/9]" />
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold tracking-tight">{productNames.bottle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Double-wall steel, keeps drinks cold for 24 hours.</p>
          <p className="mt-3 text-xl font-semibold tracking-tight tabular-nums">$32</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-dashed border-border pt-4">
            <AvatarStack people={buyers} total={1284} max={4} label="Recent buyers" />
            <p className="min-w-[9rem] flex-1 text-xs leading-snug text-muted-foreground">
              <span className="font-medium text-foreground tabular-nums">1,284</span> bought in the last 30 days
            </p>
          </div>
          <button
            type="button"
            className="mt-5 h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none sm:w-fit"
          >
            Add to cart
          </button>
        </div>
      </article>

      <section aria-labelledby="related-heading" className="space-y-3">
        <h3 id="related-heading" className="text-sm font-semibold">
          Often bought together
        </h3>
        <ul className="space-y-3">
          {related.map((r) => (
            <li key={r.kind} className="flex items-center gap-3 rounded-md border border-border bg-card p-3">
              <ProductArt kind={r.kind} className="size-14 shrink-0 rounded-[3px]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{productNames[r.kind]}</p>
                <p className="text-sm tracking-tight tabular-nums">{r.price}</p>
              </div>
              <AvatarStack people={buyers.slice(r.kind === "mug" ? 1 : 3, r.kind === "mug" ? 4 : 5)} total={r.buyers} max={2} size="sm" label={`Buyers of ${productNames[r.kind]}`} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
