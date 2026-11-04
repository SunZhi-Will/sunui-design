"use client";

import { useState } from "react";

import { SidePanel, SidePanelProvider, type DateRangeOption } from "./classic-side-panel";

// 依區間切換的流量資料
const stats: Record<DateRangeOption, { visits: string; signups: string; bars: number[] }> = {
  day: { visits: "1,284", signups: "36", bars: [30, 55, 42, 70, 64, 88, 52] },
  week: { visits: "9,410", signups: "248", bars: [48, 62, 58, 74, 81, 69, 90] },
  "half-year": { visits: "212k", signups: "5.1k", bars: [40, 46, 61, 58, 72, 84, 79] },
  year: { visits: "438k", signups: "11.8k", bars: [35, 44, 50, 63, 70, 77, 92] },
};

const activity = [
  { who: "Mia Chen", what: "published Pricing v3", when: "2m" },
  { who: "Leo Park", what: "invited 3 teammates", when: "18m" },
  { who: "Ava Lin", what: "closed ticket #482", when: "1h" },
  { who: "Noah Wu", what: "updated billing plan", when: "3h" },
];

export default function ClassicSidePanelDemo() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [range, setRange] = useState<DateRangeOption>("week");
  const data = stats[range];

  return (
    <SidePanelProvider>
      <div className="relative isolate h-[520px] w-full max-w-3xl overflow-hidden rounded-xl bg-gray-100 text-gray-800">
        <div className="flex h-full flex-col items-center justify-center gap-5 px-4 text-center">
          <div className="min-w-0">
            <p className="text-sm text-gray-500">Workspace overview</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-gray-900">{data.visits}</p>
            <p className="text-sm text-gray-500">visits, {data.signups} sign-ups</p>
          </div>
          <div className="flex h-24 w-full max-w-xs items-end gap-2" aria-hidden="true">
            {data.bars.map((h, i) => (
              <div key={i} className="min-w-0 flex-1 rounded-t bg-blue-500/80" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="flex w-full max-w-xs flex-col gap-3">
            <button
              type="button"
              onClick={() => setTimeout(() => setFiltersOpen(true), 0)}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Open filters
            </button>
            <button
              type="button"
              onClick={() => setTimeout(() => setActivityOpen(true), 0)}
              className="rounded bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-4 py-2 text-white hover:from-blue-600 hover:via-purple-600 hover:to-pink-600"
            >
              Recent activity
            </button>
          </div>
        </div>

        <SidePanel
          fixed={false}
          isOpen={filtersOpen}
          onToggle={() => setFiltersOpen((o) => !o)}
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
          <div className="space-y-4 text-sm">
            <p>Showing traffic for the selected range. The chart updates as you switch.</p>
            <fieldset className="space-y-2">
              <legend className="mb-1 font-medium text-gray-900">Channels</legend>
              {["Organic search", "Referral", "Social", "Email"].map((c, i) => (
                <label key={c} className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked={i < 3} className="size-4 accent-blue-600" />
                  {c}
                </label>
              ))}
            </fieldset>
          </div>
        </SidePanel>

        <SidePanel
          fixed={false}
          isOpen={activityOpen}
          onToggle={() => setActivityOpen((o) => !o)}
          title="Recent activity"
          position="right"
          theme="gradient"
          mode="dark"
          showOverlay
          closeOnEscape
          closeOnOutsideClick
        >
          <ul className="space-y-4 text-sm">
            {activity.map((a) => (
              <li key={a.who} className="flex items-start justify-between gap-3">
                <p className="min-w-0">
                  <span className="font-medium text-white">{a.who}</span> {a.what}
                </p>
                <span className="shrink-0 text-xs text-gray-400">{a.when}</span>
              </li>
            ))}
          </ul>
        </SidePanel>
      </div>
    </SidePanelProvider>
  );
}
