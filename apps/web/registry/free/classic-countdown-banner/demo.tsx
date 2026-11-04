"use client";

import { useState, type ReactNode } from "react";

import { ClassicCountdownBanner } from "./classic-countdown-banner";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function Caption({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">{children}</p>;
}

export default function ClassicCountdownBannerDemo() {
  // 結束時間在初始化時算一次
  const [ends] = useState(() => ({
    week: new Date(Date.now() + 7 * DAY),
    tenDays: new Date(Date.now() + 10 * DAY),
    hours: new Date(Date.now() + 3 * HOUR),
    fiveDays: new Date(Date.now() + 5 * DAY),
  }));

  return (
    <div className="flex w-full min-w-0 max-w-4xl flex-col gap-10">
      <section className="min-w-0">
        <Caption>Modern card, gradient, dark</Caption>
        <ClassicCountdownBanner
          language="en"
          title="Limited Time Offer"
          subtitle="Hurry, offer ends soon!"
          discount="40% OFF"
          originalPrice="$1,199"
          discountedPrice="$719"
          ctaText="Shop Now"
          endDate={ends.week}
        />
      </section>

      <section className="min-w-0">
        <Caption>Light mode, violet</Caption>
        <ClassicCountdownBanner
          language="en"
          mode="light"
          theme="violet"
          title="Spring Studio Sale"
          subtitle="Members get early access until Friday"
          discount="35% OFF"
          originalPrice="$999"
          discountedPrice="$649"
          ctaText="View Deal"
          endDate={ends.tenDays}
        />
      </section>

      <section className="min-w-0">
        <Caption>Classic layout, orange, Chinese</Caption>
        <ClassicCountdownBanner
          layout="default"
          theme="orange"
          title="雙十一限時優惠"
          subtitle="倒數結束，錯過不再"
          discount="40% OFF"
          originalPrice="42,000 NTD"
          discountedPrice="25,200 NTD"
          ctaText="立即查看優惠"
          endDate={ends.hours}
        />
      </section>

      <section className="min-w-0">
        <Caption>Banner variant, spacious, cyan</Caption>
        <ClassicCountdownBanner
          language="en"
          variant="banner"
          layout="spacious"
          theme="cyan"
          title="Ending Soon"
          subtitle="Only a few hours left!"
          discount="25% OFF"
          originalPrice="$480"
          discountedPrice="$360"
          ctaText="Grab It"
          showParticles={false}
          endDate={ends.hours}
        />
      </section>

      <section className="min-w-0">
        <Caption>Floating variant, sticky inside a scrolling page</Caption>
        <div className="relative h-[34rem] overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-950 p-4 sm:p-6">
          <div className="space-y-4 pb-6">
            <div className="h-40 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900" />
            <div className="h-4 w-2/3 rounded bg-neutral-800" />
            <div className="h-4 w-1/2 rounded bg-neutral-800" />
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-16 rounded-lg bg-neutral-900" />
            ))}
          </div>
          <ClassicCountdownBanner
            language="en"
            variant="floating"
            layout="default"
            theme="dark"
            title="Members Only Deal"
            subtitle="Exclusive offer for members, limited quantity"
            discount="50% OFF"
            originalPrice="$1,499"
            discountedPrice="$749"
            ctaText="Join Now"
            endDate={ends.fiveDays}
          />
        </div>
      </section>
    </div>
  );
}
