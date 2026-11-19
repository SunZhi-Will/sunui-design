import Link from "next/link";
import type { ReactNode } from "react";

import { SunDimmer } from "@/components/home/sun-dimmer";

/**
 * 首頁開場：一個畫面高的舞台。左邊是標題、一句話、兩顆按鈕；右邊三分之二是被太陽照著的即時卡片（hero-scene.tsx），
 * 太陽（sun-dimmer.tsx）可以拖著走，按一下整頁天亮。即時元件牆（live-wall.tsx）接在下面。
 * 規則見 SITE-MOTION.md §6，由來見 reports/首頁為何普通無趣深度分析-2026-11-20.md。
 */
export function HomeHero({
  chip,
  title,
  sub,
  primary,
  secondary,
  sun,
  scene,
  wall,
}: {
  chip?: { text: string; href: string };
  title: string;
  sub: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  sun: { label: string; toDay: string; toNight: string };
  scene: ReactNode;
  wall: ReactNode;
}) {
  return (
    <>
      {/* 這一段不能有 transform、opacity、z-index：太陽的光圈要和整個頁面做差值混合，中間不能隔一層 stacking context。
          --sun-x / --sun-y 是太陽的起始位置（這一段的座標），之後由 sun-dimmer 改寫 */}
      <section className="relative mx-[calc(50%-50vw)] px-4 pb-10 [--sun-d:96px] [--sun-x:50%] [--sun-y:230px] sm:px-5 sm:[--sun-x:75%] md:[--sun-x:50%] xl:flex xl:min-h-[max(calc(88svh-3.5rem),680px)] xl:items-center xl:pb-0 xl:[--sun-d:112px] xl:[--sun-x:68%] xl:[--sun-y:280px]">
        {/* 太陽周圍的光暈：照在桌面上，所以排在卡片前面（DOM 順序在前，畫在卡片下面）。只有深色有 */}
        <span
          aria-hidden="true"
          style={{ left: "calc(var(--sun-x) - 380px)", top: "calc(var(--sun-y) - 380px)" }}
          className="pointer-events-none absolute hidden size-[760px] rounded-full bg-[radial-gradient(closest-side,rgb(255_255_255/0.13),rgb(255_255_255/0.04)_45%,transparent)] dark:block"
        />
        {scene}
        <SunDimmer copy={sun} />
        <div className="relative z-20 pt-8 xl:w-[36%] xl:pt-0 xl:pr-10">
          {chip && (
            <Link
              href={chip.href}
              className="group mb-6 inline-flex items-center gap-2 rounded-full bg-card py-1 pr-3 pl-2 text-[13px] font-medium text-subtle shadow-e1 transition-colors hover:text-fg"
            >
              <span aria-hidden="true" className="size-1.5 rounded-full bg-fg" />
              {chip.text}
              <Arrow className="size-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
          <h1 className="text-[clamp(40px,4.6vw,80px)] leading-[1.06] font-semibold tracking-[-0.035em] [word-break:auto-phrase]">
            <Title text={title} />
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-pretty text-subtle">{sub}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={primary.href} className="inline-flex h-11 items-center gap-2 rounded-lg px-5 text-[15px] font-semibold btn-primary">
              {primary.label}
              <Arrow className="size-4" />
            </Link>
            <Link href={secondary.href} className="inline-flex h-11 items-center rounded-lg px-5 text-[15px] font-medium btn-secondary">
              {secondary.label}
            </Link>
          </div>
        </div>
      </section>
      <div className="mt-6 sm:mt-8">{wall}</div>
    </>
  );
}

// 中日文只在全形標點後換行（同 PhraseText）
function Title({ text }: { text: string }) {
  const phrases = text.split(/(?<=[、，。！？：；])/u).filter(Boolean);
  if (phrases.length < 2) return <>{text}</>;
  return (
    <>
      {phrases.map((phrase, i) => (
        <span key={i} className="block">
          {phrase}
        </span>
      ))}
    </>
  );
}

function Arrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
