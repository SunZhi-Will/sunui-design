"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { DialScrubber } from "./dial-scrubber";

const copy = {
  en: {
    historyTitle: "Our story",
    historyLabel: "Year",
    milestones: [
      { year: 2014, short: "First stall", text: "Two of us sold hand-thrown cups at a Sunday market." },
      { year: 2017, short: "Studio", text: "We moved into a small studio and opened the online shop." },
      { year: 2020, short: "Refills", text: "The refill program started, so cups come back instead of going to waste." },
      { year: 2023, short: "Flagship", text: "Our first store opened, with a kiln you can watch from the street." },
      { year: 2026, short: "Today", text: "Forty makers, one kiln still running every morning." },
    ],
    giftTitle: "Gift card",
    giftLabel: "Gift card amount",
    giftNote: "Delivered by email, never expires.",
    buy: "Add gift card",
    currency: { prefix: "$", min: 10, max: 300, step: 5, major: 4, start: 50 },
  },
  "zh-TW": {
    historyTitle: "品牌故事",
    historyLabel: "年份",
    milestones: [
      { year: 2014, short: "第一個攤位", text: "兩個人在週日市集賣手拉坯杯子。" },
      { year: 2017, short: "工作室", text: "搬進小工作室，同時開了網路商店。" },
      { year: 2020, short: "回收計畫", text: "開始杯子回收計畫，舊杯子回來重燒，不再丟掉。" },
      { year: 2023, short: "旗艦店", text: "第一家門市開幕，在街上就看得到窯爐。" },
      { year: 2026, short: "現在", text: "四十位職人，窯爐每天早上照常點火。" },
    ],
    giftTitle: "禮物卡",
    giftLabel: "禮物卡金額",
    giftNote: "以 Email 寄送，永久有效。",
    buy: "加入禮物卡",
    currency: { prefix: "NT$", min: 300, max: 10000, step: 100, major: 10, start: 1500 },
  },
  "zh-CN": {
    historyTitle: "品牌故事",
    historyLabel: "年份",
    milestones: [
      { year: 2014, short: "第一个摊位", text: "两个人在周日市集卖手拉坯杯子。" },
      { year: 2017, short: "工作室", text: "搬进小工作室，同时开了网店。" },
      { year: 2020, short: "回收计划", text: "开始杯子回收计划，旧杯子回来重烧，不再丢掉。" },
      { year: 2023, short: "旗舰店", text: "第一家门店开业，在街上就看得到窑炉。" },
      { year: 2026, short: "现在", text: "四十位匠人，窑炉每天早上照常点火。" },
    ],
    giftTitle: "礼品卡",
    giftLabel: "礼品卡金额",
    giftNote: "通过邮件发送，永久有效。",
    buy: "加入礼品卡",
    currency: { prefix: "¥", min: 50, max: 2000, step: 50, major: 4, start: 300 },
  },
  ja: {
    historyTitle: "私たちの歩み",
    historyLabel: "年",
    milestones: [
      { year: 2014, short: "最初の屋台", text: "日曜マーケットで、ふたりで手びねりのカップを売りました。" },
      { year: 2017, short: "工房", text: "小さな工房に移り、オンラインショップを開きました。" },
      { year: 2020, short: "リフィル", text: "カップを回収して焼き直すリフィルの仕組みを始めました。" },
      { year: 2023, short: "旗艦店", text: "通りから窯が見える最初のお店を開きました。" },
      { year: 2026, short: "いま", text: "作り手は四十人。窯は今も毎朝火を入れています。" },
    ],
    giftTitle: "ギフトカード",
    giftLabel: "ギフトカードの金額",
    giftNote: "メールでお届け、有効期限はありません。",
    buy: "ギフトカードを追加",
    currency: { prefix: "¥", min: 1000, max: 30000, step: 500, major: 4, start: 5000 },
  },
};

export default function DialScrubberDemo() {
  const t = useDemoText(copy);
  const [year, setYear] = useState(2020);
  const c = t.currency;
  const [amount, setAmount] = useState(c.start);
  const shown = Math.min(c.max, Math.max(c.min, amount));
  const story = [...t.milestones].reverse().find((m) => m.year <= year) ?? t.milestones[0];

  return (
    <div className="grid w-full max-w-4xl gap-6 p-4 md:grid-cols-2">
      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-medium text-muted-foreground">{t.historyTitle}</h3>
        <DialScrubber
          className="mt-3"
          label={t.historyLabel}
          min={2012}
          max={2026}
          value={year}
          onChange={setYear}
          spacing={56}
          majorEvery={1}
          subdivisions={3}
          marks={t.milestones.map((m) => ({ value: m.year, label: m.short, text: m.short }))}
        />
        <p className="mt-4 min-h-[3rem] text-sm leading-relaxed" aria-live="polite">
          <span className="font-medium tabular-nums">{story.year}</span> {story.text}
        </p>
      </section>

      <section key={c.prefix} className="flex flex-col rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-medium text-muted-foreground">{t.giftTitle}</h3>
        <DialScrubber
          className="mt-3"
          label={t.giftLabel}
          min={c.min}
          max={c.max}
          step={c.step}
          majorEvery={c.major}
          spacing={14}
          defaultValue={c.start}
          onChange={setAmount}
          formatValue={(v) => `${c.prefix}${v.toLocaleString()}`}
        />
        <p className="mt-4 text-sm text-muted-foreground">{t.giftNote}</p>
        <button
          type="button"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98]"
        >
          {t.buy} · <span className="ml-1 tabular-nums">{`${c.prefix}${shown.toLocaleString()}`}</span>
        </button>
      </section>
    </div>
  );
}
