"use client";

import { useEffect, useState } from "react";

import { SkeletonCircle, SkeletonLine, SkeletonSet, type ShimmerStyle } from "./skeleton-set";

export default function SkeletonSetDemo() {
  const [loaded, setLoaded] = useState(false);
  const [shimmer, setShimmer] = useState<ShimmerStyle>("wave");

  // 進場後模擬一次載入
  useEffect(() => {
    const t = window.setTimeout(() => setLoaded(true), 1800);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="w-full max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setLoaded((v) => !v)}
          className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
        >
          {loaded ? "Show skeletons" : "Load content"}
        </button>
        <div role="radiogroup" aria-label="Shimmer style" className="flex rounded-full border border-border p-0.5 text-sm">
          {(["wave", "pulse", "none"] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={shimmer === s}
              onClick={() => setShimmer(s)}
              className={
                shimmer === s
                  ? "rounded-full bg-muted px-3 py-1 text-foreground"
                  : "rounded-full px-3 py-1 text-muted-foreground hover:text-foreground"
              }
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SkeletonSet loaded={loaded} skeleton="card" shimmer={shimmer}>
          <article className="rounded-2xl border border-border bg-card p-5 text-card-foreground">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                AL
              </div>
              <div>
                <p className="text-sm font-medium">Ada Lin</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Shipped the new checkout flow. Conversion is up 4% in the first week and support tickets went down.
            </p>
          </article>
        </SkeletonSet>

        <SkeletonSet loaded={loaded} skeleton="product" shimmer={shimmer}>
          <article className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground">
            <div className="aspect-[4/3] bg-gradient-to-br from-amber-200 via-rose-200 to-sky-200 dark:from-amber-500/30 dark:via-rose-500/30 dark:to-sky-500/30" />
            <div className="p-4">
              <p className="font-medium">Ceramic pour-over set</p>
              <p className="text-sm text-muted-foreground">Stoneware, 600 ml</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-semibold">$48</span>
                <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">Add</span>
              </div>
            </div>
          </article>
        </SkeletonSet>

        <SkeletonSet loaded={loaded} skeleton="list" count={3} shimmer={shimmer} className="sm:col-span-2">
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card text-card-foreground">
            {["Design review", "Sprint planning", "Customer call"].map((item, i) => (
              <li key={item} className="flex items-center gap-3 p-4">
                <span className="grid size-9 place-items-center rounded-full bg-muted text-sm">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item}</p>
                  <p className="text-xs text-muted-foreground">Today</p>
                </div>
                <span className="text-xs text-muted-foreground">{10 + i * 2}:00</span>
              </li>
            ))}
          </ul>
        </SkeletonSet>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border p-4">
        <SkeletonCircle size={28} />
        <SkeletonLine width="40%" />
        <span className="text-xs text-muted-foreground">Primitives compose freely</span>
      </div>
    </div>
  );
}
