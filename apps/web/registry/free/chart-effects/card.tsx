"use client";

import { useDemoText } from "@/lib/demo-locale";

import { ChartEffect, type ChartDatum } from "./chart-effects";

const copy = {
  en: { days: ["M", "T", "W", "T", "F", "S", "S"], goal: "Goal", signups: "Sign-ups" },
  "zh-TW": { days: ["一", "二", "三", "四", "五", "六", "日"], goal: "目標", signups: "註冊數" },
  "zh-CN": { days: ["一", "二", "三", "四", "五", "六", "日"], goal: "目标", signups: "注册数" },
  ja: { days: ["月", "火", "水", "木", "金", "土", "日"], goal: "目標", signups: "登録数" },
};

const weekly = [32, 48, 41, 66, 58, 79, 72];

/** 型錄卡片：長條長高、迷你折線與數字計數。 */
export default function ChartEffectsCard() {
  const t = useDemoText(copy);
  const data: ChartDatum[] = weekly.map((value, i) => ({ label: t.days[i] ?? "", value }));
  return (
    <div className="mx-auto grid w-72 gap-4 rounded-md border border-border bg-card p-4 text-card-foreground">
      <ChartEffect variant="bar-grow" trigger="loop" data={data} />
      <ChartEffect variant="sparkline" trigger="loop" data={data} label={t.signups} />
      <ChartEffect variant="number-counter" trigger="loop" value={72} max={100} label={t.goal} format={(n) => `${Math.round(n)}%`} />
    </div>
  );
}
