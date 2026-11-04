"use client";

import { useState } from "react";

import { StarRating, type StarRatingSize } from "./star-rating";

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-full">
      <path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 4 4.5 7.3 4.5c2 0 3.6 1.1 4.7 2.7 1.1-1.6 2.7-2.7 4.7-2.7 3.3 0 5.7 3.1 4.5 6.6-1.7 4.8-9.2 9.4-9.2 9.4z" />
    </svg>
  );
}

export default function StarRatingDemo() {
  const [value, setValue] = useState(3.5);
  const [mood, setMood] = useState(0);
  const [half, setHalf] = useState(true);
  const [size, setSize] = useState<StarRatingSize>("md");
  const [hearts, setHearts] = useState(false);

  return (
    <div className="w-full max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <div role="group" aria-label="Size" className="flex gap-1">
          {(["sm", "md", "lg"] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={size === s}
              onClick={() => setSize(s)}
              className="rounded-full border border-border px-3 py-1.5 uppercase text-foreground transition-colors hover:bg-muted aria-pressed:bg-primary aria-pressed:text-primary-foreground"
            >
              {s}
            </button>
          ))}
        </div>
        <label className="ml-2 flex items-center gap-2 text-muted-foreground">
          <input type="checkbox" checked={half} onChange={(e) => setHalf(e.target.checked)} className="size-4 accent-current" />
          Half stars
        </label>
        <label className="ml-2 flex items-center gap-2 text-muted-foreground">
          <input type="checkbox" checked={hearts} onChange={(e) => setHearts(e.target.checked)} className="size-4 accent-current" />
          Heart icon
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 text-card-foreground">
          <h3 className="mb-3 text-sm font-medium">Rate this product</h3>
          <StarRating
            value={value}
            onValueChange={setValue}
            precision={half ? 0.5 : 1}
            size={size}
            icon={hearts ? <HeartIcon /> : undefined}
            activeClassName={hearts ? "text-rose-500" : undefined}
            aria-label="Product rating"
          />
          <p className="mt-3 text-xs text-muted-foreground">Arrow keys adjust, Delete clears.</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 text-card-foreground">
          <h3 className="mb-3 text-sm font-medium">Customer reviews</h3>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold tabular-nums">4.3</span>
            <StarRating readOnly value={4.3} size={size} icon={hearts ? <HeartIcon /> : undefined} activeClassName={hearts ? "text-rose-500" : undefined} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Based on 1,284 reviews</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 text-card-foreground">
          <h3 className="mb-3 text-sm font-medium">How was your order?</h3>
          <StarRating variant="emoji" value={mood} onValueChange={setMood} size={size} aria-label="Order satisfaction" />
        </div>
      </div>
    </div>
  );
}
