"use client";

import { useState } from "react";

import { SegmentedControl, type SegmentedControlProps } from "./segmented-control";

type Size = NonNullable<SegmentedControlProps["size"]>;
type Range = "daily" | "weekly" | "monthly";
type View = "list" | "grid";

const totals: Record<Range, string> = { daily: "1,284", weekly: "8,930", monthly: "36,512" };

const ListIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
  </svg>
);

const GridIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </svg>
);

export default function SegmentedControlDemo() {
  const [size, setSize] = useState<Size>("md");
  const [range, setRange] = useState<Range>("weekly");
  const [view, setView] = useState<View>("grid");

  return (
    <div className="w-full max-w-md space-y-4">
      <div role="group" aria-label="Size" className="flex gap-1 text-sm">
        {(["sm", "md", "lg"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={size === v}
            onClick={() => setSize(v)}
            className="rounded-full border border-border px-3 py-1.5 text-foreground transition-colors hover:bg-muted aria-pressed:bg-primary aria-pressed:text-primary-foreground"
          >
            {v}
          </button>
        ))}
      </div>

      <div className="space-y-5 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Active users</p>
            <p className="text-2xl font-semibold tabular-nums">{totals[range]}</p>
          </div>
          <SegmentedControl<Range>
            aria-label="Time range"
            size={size}
            value={range}
            onValueChange={setRange}
            options={[
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
              { value: "monthly", label: "Monthly" },
            ]}
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
          <p className="text-sm text-muted-foreground">
            Showing as <span className="font-medium text-foreground">{view}</span>
          </p>
          <SegmentedControl<View>
            aria-label="View"
            size={size}
            iconOnly
            value={view}
            onValueChange={setView}
            options={[
              { value: "list", label: "List view", icon: ListIcon },
              { value: "grid", label: "Grid view", icon: GridIcon },
            ]}
          />
        </div>

        <SegmentedControl
          aria-label="Plan"
          size={size}
          fullWidth
          defaultValue="pro"
          options={[
            { value: "free", label: "Free" },
            { value: "pro", label: "Pro" },
            { value: "team", label: "Team", disabled: true },
          ]}
        />
      </div>
    </div>
  );
}
