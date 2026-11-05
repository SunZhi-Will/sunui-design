"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { SidePanel, SidePanelProvider, type DateRangeOption } from "./classic-side-panel";

// 依區間切換的流量數字
const visits: Record<DateRangeOption, string> = { day: "1,284", week: "9,410", "half-year": "212k", year: "438k" };

const copy = {
  en: {
    visits: { day: "visits this day", week: "visits this week", "half-year": "visits this half year", year: "visits this year" },
    open: "Open filters",
    title: "Filters",
    channelList: ["Organic search", "Referral", "Social"],
  },
  "zh-TW": {
    visits: { day: "今日造訪", week: "本週造訪", "half-year": "近半年造訪", year: "今年造訪" },
    open: "開啟篩選",
    title: "篩選",
    channelList: ["自然搜尋", "推薦連結", "社群"],
  },
  "zh-CN": {
    visits: { day: "今日访问", week: "本周访问", "half-year": "近半年访问", year: "今年访问" },
    open: "打开筛选",
    title: "筛选",
    channelList: ["自然搜索", "外部引荐", "社交媒体"],
  },
  ja: {
    visits: { day: "今日の訪問数", week: "今週の訪問数", "half-year": "直近半年の訪問数", year: "今年の訪問数" },
    open: "フィルターを開く",
    title: "フィルター",
    channelList: ["自然検索", "参照元サイト", "ソーシャル"],
  },
} satisfies Record<string, { visits: Record<DateRangeOption, string> } & Record<string, unknown>>;

/** 型錄卡片：點按鈕或側邊把手，篩選側欄從左滑出，切換區間數字跟著變。 */
export default function ClassicSidePanelCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRangeOption>("week");

  return (
    <SidePanelProvider>
      <div className="relative isolate mx-auto h-56 w-72 overflow-hidden rounded-xl bg-gray-100 text-gray-800">
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
          <div>
            <p className="text-3xl font-semibold tabular-nums text-gray-900">{visits[range]}</p>
            <p className="text-sm text-gray-500">{t.visits[range]}</p>
          </div>
          <button
            type="button"
            onClick={() => setTimeout(() => setOpen(true), 0)}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
          >
            {t.open}
          </button>
        </div>

        <SidePanel
          fixed={false}
          locale={locale}
          isOpen={open}
          onToggle={() => setOpen((o) => !o)}
          title={t.title}
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
            {t.channelList.map((c, i) => (
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
