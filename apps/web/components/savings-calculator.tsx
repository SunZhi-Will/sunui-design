"use client";

import { useId, useState } from "react";

import { intlLocale, type Messages } from "@/lib/messages";
import { format, type Locale } from "@/lib/i18n";

/**
 * 價格頁的省時計算機：用 agency 的語言（一年幾檔活動 × 每檔省幾天 × 日薪）把 Pro 的價格換算成省下的錢。
 * 參考 reports/Planes 參考分析-2026-11-08.md 第 6 節。數字即時更新，不做滾動動畫。
 */
export function SavingsCalculator({ price, locale, t }: { price: number; locale: Locale; t: Messages["pricing"]["calculator"] }) {
  const id = useId();
  const [campaigns, setCampaigns] = useState(6);
  const [days, setDays] = useState(2);
  const [rate, setRate] = useState("400");

  const dayRate = Math.max(0, Number(rate) || 0);
  const savedDays = campaigns * days;
  const worth = savedDays * dayRate;
  const net = worth - price;
  const money = new Intl.NumberFormat(intlLocale(locale), { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const dayCount = (n: number) =>
    format(n === 1 ? t.dayValue : t.daysValue, { n: new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 1 }).format(n) });

  return (
    <section aria-labelledby={`${id}-title`} className="mx-auto mt-16 max-w-xl rounded-lg border border-line bg-card p-6 sm:p-8">
      <h2 id={`${id}-title`} className="text-xl font-semibold tracking-tight">
        {t.title}
      </h2>
      <p className="mt-2 text-sm text-pretty text-subtle">{t.lead}</p>

      <div className="mt-6 grid gap-5">
        <Slider id={`${id}-campaigns`} label={t.campaigns} value={campaigns} min={1} max={24} step={1} display={String(campaigns)} onChange={setCampaigns} />
        <Slider id={`${id}-days`} label={t.days} value={days} min={0.5} max={5} step={0.5} display={dayCount(days)} onChange={setDays} />
        <div className="grid gap-2">
          <label htmlFor={`${id}-rate`} className="text-sm font-medium">
            {t.rate}
          </label>
          <div className="flex items-center rounded-md border border-line bg-bg px-3 focus-within:border-fg">
            <span aria-hidden="true" className="text-sm text-subtle">
              $
            </span>
            <input
              id={`${id}-rate`}
              inputMode="numeric"
              value={rate}
              onChange={(e) => setRate(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
              className="w-full bg-transparent px-2 py-2.5 text-sm tabular-nums outline-none"
            />
          </div>
        </div>
      </div>

      <dl aria-live="polite" className="mt-6 grid gap-2 border-t border-line pt-5 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-subtle">{t.timeSaved}</dt>
          <dd className="font-medium tabular-nums">{dayCount(savedDays)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-subtle">{t.worth}</dt>
          <dd className="font-medium tabular-nums">{money.format(worth)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-subtle">{format(t.net, { price })}</dt>
          <dd className="text-2xl font-semibold tracking-tight tabular-nums">{money.format(net)}</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs text-pretty text-subtle">{t.note}</p>
    </section>
  );
}

function Slider({
  id,
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (n: number) => void;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <span className="text-sm text-subtle tabular-nums">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={display}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-fg"
      />
    </div>
  );
}
