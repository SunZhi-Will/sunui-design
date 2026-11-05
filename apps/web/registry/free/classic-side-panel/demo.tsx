"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { SidePanel, SidePanelProvider, type DateRangeOption } from "./classic-side-panel";

// 依區間切換的流量數字
const visits: Record<DateRangeOption, string> = { day: "1,284", week: "9,410", "half-year": "212k", year: "438k" };

const copy = {
  en: {
    overview: "Workspace overview",
    visits: { day: "visits this day", week: "visits this week", "half-year": "visits this half year", year: "visits this year" },
    open: "Open filters",
    title: "Filters",
    channels: "Channels",
    channelList: ["Organic search", "Referral", "Social", "Email"],
  },
  "zh-TW": {
    overview: "工作區概況",
    visits: { day: "今日造訪", week: "本週造訪", "half-year": "近半年造訪", year: "今年造訪" },
    open: "開啟篩選",
    title: "篩選",
    channels: "流量來源",
    channelList: ["自然搜尋", "推薦連結", "社群", "電子郵件"],
  },
  "zh-CN": {
    overview: "工作区概况",
    visits: { day: "今日访问", week: "本周访问", "half-year": "近半年访问", year: "今年访问" },
    open: "打开筛选",
    title: "筛选",
    channels: "流量来源",
    channelList: ["自然搜索", "外部引荐", "社交媒体", "电子邮件"],
  },
  ja: {
    overview: "ワークスペースの概要",
    visits: { day: "今日の訪問数", week: "今週の訪問数", "half-year": "直近半年の訪問数", year: "今年の訪問数" },
    open: "フィルターを開く",
    title: "フィルター",
    channels: "チャネル",
    channelList: ["自然検索", "参照元サイト", "ソーシャル", "メール"],
  },
} satisfies Record<string, { visits: Record<DateRangeOption, string> } & Record<string, unknown>>;

export default function ClassicSidePanelDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRangeOption>("week");

  return (
    <SidePanelProvider>
      <div className="relative isolate h-[480px] w-full max-w-3xl min-w-0 overflow-hidden rounded-xl border border-border bg-muted/40 text-foreground">
        <div className="flex h-full flex-col items-center justify-center gap-5 px-4 text-center">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{t.overview}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">{visits[range]}</p>
            <p className="text-sm text-muted-foreground">{t.visits[range]}</p>
          </div>
          <button
            type="button"
            onClick={() => setTimeout(() => setOpen(true), 0)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
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
          showOverlay
          closeOnEscape
          closeOnOutsideClick
          showDateRangeSelector
          selectedDateRange={range}
          onDateRangeChange={setRange}
        >
          <fieldset className="space-y-2 text-sm">
            <legend className="mb-1 font-medium text-foreground">{t.channels}</legend>
            {t.channelList.map((c, i) => (
              <label key={c} className="flex items-center gap-2">
                <input type="checkbox" defaultChecked={i < 3} className="size-4 accent-foreground" />
                {c}
              </label>
            ))}
          </fieldset>
        </SidePanel>
      </div>
    </SidePanelProvider>
  );
}
