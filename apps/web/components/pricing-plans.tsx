"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

import { DURATION, EASE_SITE } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type Plan = {
  name: string;
  price: string;
  /** 價格後的週期，例如「/ 月」。買斷方案不填 */
  per?: string;
  secondary?: string;
  note: string;
  /** 綠色小標，例如年訂省多少 */
  badge?: string;
  features: readonly string[];
  cta: { label: string; href: string };
  highlight?: boolean;
  guard?: string;
};

type Mode = "subscription" | "oneTime";

/**
 * 價格頁的方案切換：訂閱 / 買斷兩組卡片共用同一個位置，預設先顯示訂閱。
 * 網址帶 #lifetime 時直接打開買斷（給外部連結用）；續訂信件連到 #subscribe，預設就是訂閱，不用特別處理。
 */
export function PricingPlans({
  subscription,
  oneTime,
  labels,
  subscriptionNote,
}: {
  subscription: Plan[];
  oneTime: Plan[];
  labels: { group: string; subscription: string; oneTime: string; recommended: string; plans: string };
  /** 只在訂閱模式顯示：不會自動扣款的說明 */
  subscriptionNote: string;
}) {
  const [mode, setMode] = useState<Mode>("subscription");
  const reduce = useReducedMotion();

  useEffect(() => {
    if (window.location.hash === "#lifetime") setMode("oneTime");
  }, []);

  const plans = mode === "subscription" ? subscription : oneTime;
  const options: { value: Mode; label: string }[] = [
    { value: "subscription", label: labels.subscription },
    { value: "oneTime", label: labels.oneTime },
  ];

  return (
    <section id="subscribe" aria-label={labels.plans} className="mx-auto mt-14 max-w-6xl scroll-mt-24">
      <div className="flex justify-center">
        <div role="radiogroup" aria-label={labels.group} className="relative inline-grid grid-cols-2 rounded-full bg-accent-soft p-1">
          {/* 滑動的底塊：寬度固定是一半，切換時橫移，不重排文字 */}
          <span
            aria-hidden="true"
            className={cn(
              "absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-card shadow-e1 transition-transform duration-200 ease-site motion-reduce:transition-none",
              mode === "oneTime" && "translate-x-full",
            )}
          />
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={mode === option.value}
              onClick={() => setMode(option.value)}
              className={cn(
                "relative min-w-28 rounded-full px-5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent",
                mode === option.value ? "text-fg" : "text-subtle hover:text-fg",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={mode}
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.base, ease: EASE_SITE }}
        className="mt-8 grid gap-x-4 gap-y-0 md:grid-cols-3 lg:gap-x-6"
      >
        {plans.map((plan) => (
          <PlanCard key={plan.name} plan={plan} recommended={labels.recommended} />
        ))}
      </motion.div>

      {mode === "subscription" && (
        <p className="mx-auto mt-6 max-w-xl text-center text-sm text-pretty text-subtle">{subscriptionNote}</p>
      )}
    </section>
  );
}

function PlanCard({ plan, recommended }: { plan: Plan; recommended: string }) {
  const ctaClass = cn(
    "relative mt-8 block self-start rounded-lg px-4 py-3 text-center text-sm font-medium",
    plan.highlight ? "btn-primary" : "btn-secondary",
  );
  return (
    <div
      className={cn(
        // subgrid：卡片佔父格線的 5 列（標題、價格、說明、按鈕、功能），三張卡的同一列等高，按鈕才會對齊
        "relative row-span-5 grid grid-rows-subgrid rounded-2xl bg-card p-6 max-md:mb-5 sm:p-7",
        // 手機上單欄堆疊時推薦方案排第一，付費的人不用先滑過免費方案
        plan.highlight
          ? "shadow-e3 ring-1 ring-[color-mix(in_oklab,var(--tone)_50%,transparent)] max-md:order-first"
          : "shadow-e1",
      )}
    >
      {plan.highlight && (
        <>
          {/* 頂邊一條亮線，模擬光從正上方打下來 */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[var(--tone)] to-transparent"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(120%_60%_at_50%_0%,var(--tone-glow),transparent_70%)]"
          />
        </>
      )}
      <div className="relative flex items-center justify-between gap-3">
        <h2 className="font-medium">{plan.name}</h2>
        {plan.highlight && (
          <span className="rounded-full bg-[linear-gradient(var(--price-angle),var(--price-a),var(--price-b))] px-2.5 py-0.5 text-xs font-medium text-[var(--tone-fg)]">
            {recommended}
          </span>
        )}
      </div>
      {/* 價格獨立一行：說明放在旁邊時，三欄的寬度會把它擠成一欄兩個字的直排 */}
      <p className="relative mt-6 flex items-baseline gap-1.5">
        <Price value={plan.price} className="text-5xl" />
        {plan.per && <span className="text-sm text-subtle">{plan.per}</span>}
      </p>
      <div className="relative flex flex-col items-start">
        <p className="mt-2 text-sm text-pretty text-subtle tabular-nums">
          {plan.secondary && <>≈ {plan.secondary} · </>}
          {plan.note}
        </p>
        {plan.badge && (
          <span className="mt-2 rounded-full bg-[color-mix(in_oklab,var(--save)_14%,transparent)] px-2 py-0.5 text-xs font-medium text-[var(--save)]">
            {plan.badge}
          </span>
        )}
        {plan.guard && <p className="mt-2 text-xs text-pretty text-subtle">{plan.guard}</p>}
      </div>

      {/* 結帳走 /go/checkout 計數後轉到結帳頁：用一般連結，Link 的預先載入會把瀏覽也算成點擊 */}
      {plan.cta.href.startsWith("/go/") || plan.cta.href.startsWith("#") ? (
        <a href={plan.cta.href} className={ctaClass}>
          {plan.cta.label}
        </a>
      ) : (
        <Link href={plan.cta.href} className={ctaClass}>
          {plan.cta.label}
        </Link>
      )}

      <ul className="relative mt-8 grid content-start gap-3 border-t border-line pt-6 text-sm">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-3">
            <Check className="mt-0.5" />
            <span className="text-pretty">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 幣別前綴縮小、數字放大：NT$4,090 → 小字 NT$ + 大字 4,090 */
function Price({ value, className }: { value: string; className?: string }) {
  const match = value.match(/^([^\d]*)(.*)$/);
  const [, prefix = "", amount = value] = match ?? [];
  return (
    <span className={cn("inline-flex items-baseline font-semibold tracking-[-0.03em] tabular-nums", className)}>
      {prefix && (
        <span className="mr-0.5 text-[max(0.45em,0.8rem)] font-medium tracking-normal text-[var(--tone)]">{prefix}</span>
      )}
      <span className="bg-[linear-gradient(var(--price-angle),var(--price-a),var(--price-b))] bg-clip-text text-transparent">
        {amount}
      </span>
    </span>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("flex size-4 shrink-0 items-center justify-center rounded-full bg-accent-soft text-fg", className)}
    >
      <svg viewBox="0 0 12 12" fill="none" className="size-2.5">
        <path d="M2.5 6.2 4.9 8.5 9.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
