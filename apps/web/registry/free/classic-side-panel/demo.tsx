"use client";

import { useState } from "react";

import { SidePanel, SidePanelProvider, type DateRangeOption } from "./classic-side-panel";

// 依區間切換的流量數字
const visits: Record<DateRangeOption, string> = { day: "1,284", week: "9,410", "half-year": "212k", year: "438k" };

export default function ClassicSidePanelDemo() {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRangeOption>("week");

  return (
    <SidePanelProvider>
      <div className="relative isolate h-[480px] w-full max-w-3xl min-w-0 overflow-hidden rounded-xl bg-gray-100 text-gray-800">
        <div className="flex h-full flex-col items-center justify-center gap-5 px-4 text-center">
          <div className="min-w-0">
            <p className="text-sm text-gray-500">Workspace overview</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-gray-900">{visits[range]}</p>
            <p className="text-sm text-gray-500">visits this {range.replace("-", " ")}</p>
          </div>
          <button
            type="button"
            onClick={() => setTimeout(() => setOpen(true), 0)}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Open filters
          </button>
        </div>

        <SidePanel
          fixed={false}
          isOpen={open}
          onToggle={() => setOpen((o) => !o)}
          title="Filters"
          position="left"
          theme="primary"
          showOverlay
          closeOnEscape
          closeOnOutsideClick
          showDateRangeSelector
          selectedDateRange={range}
          onDateRangeChange={setRange}
        >
          <fieldset className="space-y-2 text-sm">
            <legend className="mb-1 font-medium text-gray-900">Channels</legend>
            {["Organic search", "Referral", "Social", "Email"].map((c, i) => (
              <label key={c} className="flex items-center gap-2">
                <input type="checkbox" defaultChecked={i < 3} className="size-4 accent-blue-600" />
                {c}
              </label>
            ))}
          </fieldset>
        </SidePanel>
      </div>
    </SidePanelProvider>
  );
}
