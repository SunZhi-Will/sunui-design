"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { cn } from "@/lib/utils";

import { ChartEffect, chartEffects, type ChartDatum, type ChartEffectVariant } from "./chart-effects";

const copy = {
  en: {
    replay: "Replay",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    channels: ["Direct", "Search", "Social", "Email"],
    regions: ["North", "South", "East", "West", "Central"],
    weekly: "Orders this week",
    traffic: "Visits",
    revenue: "Revenue",
    raised: "Raised so far",
    race: "Sales by region",
    goal: "Monthly goal",
    signups: "Sign-ups",
  },
  "zh-TW": {
    replay: "重播",
    days: ["一", "二", "三", "四", "五", "六", "日"],
    channels: ["直接", "搜尋", "社群", "電子報"],
    regions: ["北區", "南區", "東區", "西區", "中區"],
    weekly: "本週訂單",
    traffic: "造訪",
    revenue: "營收",
    raised: "目前募得",
    race: "各區銷售",
    goal: "本月目標",
    signups: "註冊數",
  },
  "zh-CN": {
    replay: "重播",
    days: ["一", "二", "三", "四", "五", "六", "日"],
    channels: ["直接", "搜索", "社交", "邮件"],
    regions: ["北区", "南区", "东区", "西区", "中区"],
    weekly: "本周订单",
    traffic: "访问",
    revenue: "营收",
    raised: "目前筹得",
    race: "各区销售",
    goal: "本月目标",
    signups: "注册数",
  },
  ja: {
    replay: "もう一度",
    days: ["月", "火", "水", "木", "金", "土", "日"],
    channels: ["直接", "検索", "SNS", "メール"],
    regions: ["北", "南", "東", "西", "中央"],
    weekly: "今週の注文",
    traffic: "訪問",
    revenue: "売上",
    raised: "これまでの調達額",
    race: "地域別売上",
    goal: "今月の目標",
    signups: "登録数",
  },
};

type Copy = (typeof copy)["en"];

const weekly = [32, 48, 41, 66, 58, 79, 72];
const revenue = [18, 24, 21, 35, 31, 44, 52];
const signups = [12, 15, 13, 18, 17, 22, 21, 26, 25, 31];
const raceValues = [
  [42, 35, 28, 22, 15],
  [50, 58, 34, 40, 21],
  [61, 64, 70, 47, 30],
  [66, 71, 79, 83, 44],
];

const zip = (labels: string[], values: number[]): ChartDatum[] => values.map((value, i) => ({ label: labels[i] ?? String(i + 1), value }));

function Tile({ variant, t, locale }: { variant: ChartEffectVariant; t: Copy; locale: string }) {
  const [key, setKey] = useState(0);
  const money = (n: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const chart = (() => {
    switch (variant) {
      case "bar-grow":
        return <ChartEffect variant="bar-grow" data={zip(t.days, weekly)} label={t.weekly} />;
      case "donut-segments":
        return <ChartEffect variant="donut-segments" data={zip(t.channels, [420, 310, 180, 90])} label={t.traffic} />;
      case "line-draw":
        return <ChartEffect variant="line-draw" data={zip(t.days, revenue)} label={t.revenue} />;
      case "number-counter":
        return <ChartEffect variant="number-counter" value={12840} max={15000} label={t.raised} format={money} />;
      case "bar-race":
        return <ChartEffect variant="bar-race" frames={raceValues.map((v) => zip(t.regions, v))} label={t.race} />;
      case "radial-progress":
        return <ChartEffect variant="radial-progress" value={72} label={t.goal} />;
      case "sparkline":
        return <ChartEffect variant="sparkline" data={signups.map((value, i) => ({ label: String(i + 1), value }))} label={t.signups} />;
    }
  })();

  return (
    <div className="relative flex min-h-64 flex-col rounded-md border border-border bg-card p-4 text-card-foreground">
      {variant !== "bar-race" && (
        <button
          type="button"
          onClick={() => setKey((k) => k + 1)}
          className="absolute right-2 top-2 z-10 inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M2.5 8a5.5 5.5 0 1 0 1.7-4M2.5 2.5V5h2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t.replay}
        </button>
      )}
      <div key={key} className={cn("flex flex-1 items-center pb-3", variant === "sparkline" ? "pt-8" : "pt-9")}>
        {chart}
      </div>
      <p className="font-mono text-xs text-muted-foreground">{variant}</p>
    </div>
  );
}

export default function ChartEffectsDemo() {
  const t = useDemoText(copy);
  const locale = useDemoLocale();
  return (
    <div className="grid w-full max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {chartEffects.map((variant) => (
        <Tile key={variant} variant={variant} t={t} locale={locale} />
      ))}
    </div>
  );
}
