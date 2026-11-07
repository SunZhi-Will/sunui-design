"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { DialScrubber } from "./dial-scrubber";

const copy = {
  en: { title: "Gift card", label: "Gift card amount", buy: "Add gift card", currency: { prefix: "$", min: 10, max: 300, step: 5, major: 4, start: 50 } },
  "zh-TW": { title: "禮物卡", label: "禮物卡金額", buy: "加入禮物卡", currency: { prefix: "NT$", min: 300, max: 10000, step: 100, major: 10, start: 1500 } },
  "zh-CN": { title: "礼品卡", label: "礼品卡金额", buy: "加入礼品卡", currency: { prefix: "¥", min: 50, max: 2000, step: 50, major: 4, start: 300 } },
  ja: { title: "ギフトカード", label: "ギフトカードの金額", buy: "ギフトカードを追加", currency: { prefix: "¥", min: 1000, max: 30000, step: 500, major: 4, start: 5000 } },
};

/** 型錄卡片：禮物卡金額轉盤，左右拖曳或滾輪撥動刻度，下方按鈕的金額跟著變。 */
export default function DialScrubberCard() {
  const t = useDemoText(copy);
  const c = t.currency;
  const [amount, setAmount] = useState(c.start);
  const shown = Math.min(c.max, Math.max(c.min, amount));

  return (
    <section key={c.prefix} className="flex w-80 flex-col rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-medium text-muted-foreground">{t.title}</h3>
      <DialScrubber
        className="mt-3"
        label={t.label}
        min={c.min}
        max={c.max}
        step={c.step}
        majorEvery={c.major}
        spacing={14}
        defaultValue={c.start}
        onChange={setAmount}
        formatValue={(v) => `${c.prefix}${v.toLocaleString()}`}
      />
      <button
        type="button"
        className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98]"
      >
        {t.buy} · <span className="ml-1 tabular-nums">{`${c.prefix}${shown.toLocaleString()}`}</span>
      </button>
    </section>
  );
}
