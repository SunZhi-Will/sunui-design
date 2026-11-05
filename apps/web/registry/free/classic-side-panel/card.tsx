"use client";

import { useState } from "react";

import { SidePanel, SidePanelProvider, type DateRangeOption } from "./classic-side-panel";

// 依區間切換的流量數字
const visits: Record<DateRangeOption, string> = { day: "1,284", week: "9,410", "half-year": "212k", year: "438k" };

/** 型錄卡片：點按鈕或側邊把手，篩選側欄從左滑出，切換區間數字跟著變。 */
export default function ClassicSidePanelCard() {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRangeOption>("week");

  return (
    <SidePanelProvider>
      <div className="relative isolate mx-auto h-56 w-72 overflow-hidden rounded-xl bg-gray-100 text-gray-800">
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
          <div>
            <p className="text-3xl font-semibold tabular-nums text-gray-900">{visits[range]}</p>
            <p className="text-sm text-gray-500">visits this {range}</p>
          </div>
          <button
            type="button"
            onClick={() => setTimeout(() => setOpen(true), 0)}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
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
          width="220px"
          buttonTopPosition="1rem"
          contentClassName="p-3"
          showOverlay
          closeOnEscape
          closeOnOutsideClick
          showDateRangeSelector
          dateRangeOptions={["day", "week", "year"]}
          selectedDateRange={range}
          onDateRangeChange={setRange}
        >
          <div className="space-y-1.5 text-sm">
            {["Organic search", "Referral", "Social"].map((c, i) => (
              <label key={c} className="flex items-center gap-2">
                <input type="checkbox" defaultChecked={i < 2} className="size-4 accent-blue-600" />
                {c}
              </label>
            ))}
          </div>
        </SidePanel>
      </div>
    </SidePanelProvider>
  );
}
