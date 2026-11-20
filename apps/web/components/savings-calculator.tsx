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
    <section
      aria-labelledby={`${id}-title`}
      className="mx-auto mt-24 grid max-w-5xl overflow-hidden rounded-2xl bg-card shadow-e2 md:grid-cols-[1.15fr_1fr]"
    >
      <div className="p-6 sm:p-10">
        <h2 id={`${id}-title`} className="text-2xl font-semibold tracking-tight">
          {t.title}
        </h2>
        <p className="mt-2 text-sm text-pretty text-subtle">{t.lead}</p>

        <div className="mt-8 grid gap-6">
          <Slider id={`${id}-campaigns`} label={t.campaigns} value={campaigns} min={1} max={24} step={1} display={String(campaigns)} onChange={setCampaigns} />
          <Slider id={`${id}-days`} label={t.days} value={days} min={0.5} max={5} step={0.5} display={dayCount(days)} onChange={setDays} />
          <div className="grid gap-2">
            <label htmlFor={`${id}-rate`} className="text-sm font-medium">
              {t.rate}
            </label>
            <div className="flex items-center rounded-lg bg-bg px-3 shadow-e1 transition-shadow focus-within:shadow-[0_0_0_1px_var(--fg)]">
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
      </div>

      <div className="flex flex-col justify-between gap-8 border-t border-line bg-accent-soft/60 p-6 sm:p-10 md:border-t-0 md:border-l">
        <dl aria-live="polite" className="grid gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs text-subtle">{t.timeSaved}</dt>
              <dd className="mt-1 text-xl font-semibold tracking-tight tabular-nums">{dayCount(savedDays)}</dd>
            </div>
            <div>
              <dt className="text-xs text-subtle">{t.worth}</dt>
              <dd className="mt-1 text-xl font-semibold tracking-tight tabular-nums">{money.format(worth)}</dd>
            </div>
          </div>
          <div className="border-t border-line pt-6">
            <dt className="text-sm text-subtle">{format(t.net, { price })}</dt>
            <dd className="mt-2 text-5xl font-semibold tracking-[-0.03em] text-[var(--save,inherit)] tabular-nums">{money.format(net)}</dd>
          </div>
        </dl>
        <p className="text-xs text-pretty text-subtle">{t.note}</p>
      </div>
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
