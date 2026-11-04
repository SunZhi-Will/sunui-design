"use client";

import { LoadingState } from "./loading-state";

export default function LoadingStateDemo() {
  return (
    <section aria-labelledby="ls-history" className="w-full max-w-md min-w-0 space-y-3">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <h2 id="ls-history" className="text-sm font-semibold">
          Past bills
        </h2>
        <span className="shrink-0 text-xs text-muted-foreground">Syncing</span>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <LoadingState rows={3} label="Loading past bills" />
      </div>
    </section>
  );
}
