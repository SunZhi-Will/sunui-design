import Link from "next/link";
import type { ReactNode } from "react";

import { SunDimmer } from "@/components/home/sun-dimmer";

/**
 * 首頁開場：一整個畫面高的舞台。左下是很大的標題、一句話、兩顆按鈕；右邊是可以拖的太陽（sun-dimmer.tsx），
 * 往上拖整個頁面會從黑夜亮到白天。即時元件牆（live-wall.tsx）接在下面，上緣從畫面底部露出來。
 * 規則見 SITE-MOTION.md §6，由來見 reports/首頁為何普通無趣深度分析-2026-11-20.md。
 */
export function HomeHero({
  chip,
  title,
  sub,
  primary,
  secondary,
  sun,
  wall,
}: {
  chip?: { text: string; href: string };
  title: string;
  sub: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  sun: { label: string; toDay: string; toNight: string };
  wall: ReactNode;
}) {
  return (
    <>
      {/* 這一段不能有 transform、opacity、z-index：太陽的光圈要和整個頁面做差值混合，中間不能隔一層 stacking context */}
      <section className="relative mx-[calc(50%-50vw)] flex min-h-[calc(88svh-3.5rem)] flex-col justify-end px-4 pt-[calc(var(--sun-y)+var(--sun-d)/2+64px)] pb-8 [--sun-d:clamp(132px,38vw,180px)] [--sun-x:72%] [--sun-y:130px] sm:px-5 sm:pt-16 sm:pb-10 sm:[--sun-d:clamp(180px,23vw,380px)] sm:[--sun-x:76%] sm:[--sun-y:38%]">
        {/* 太陽後面的同心圓：光會擴出去的範圍。裁在這一段裡面 */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {[1.7, 2.6, 3.8, 5.4].map((k) => (
            <span
              key={k}
              style={{
                left: `calc(var(--sun-x) - var(--sun-d) * ${k / 2})`,
                top: `calc(var(--sun-y) - var(--sun-d) * ${k / 2})`,
                width: `calc(var(--sun-d) * ${k})`,
                height: `calc(var(--sun-d) * ${k})`,
              }}
              className="absolute rounded-full border border-line"
            />
          ))}
        </div>
        <SunDimmer copy={sun} />
        <div className="relative mx-auto w-full max-w-[2400px]">
          {chip && (
            <Link
              href={chip.href}
              className="group mb-6 inline-flex items-center gap-2 rounded-full bg-card py-1 pr-3 pl-2 text-[13px] font-medium text-subtle shadow-e1 transition-colors hover:text-fg sm:mb-8"
            >
              <span aria-hidden="true" className="size-1.5 rounded-full bg-fg" />
              {chip.text}
              <Arrow className="size-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
          <h1 className="text-[clamp(48px,11.2vw,208px)] leading-[0.98] font-semibold tracking-[-0.045em] [word-break:auto-phrase]">
            <Title text={title} />
          </h1>
          <div className="mt-7 flex flex-wrap items-end justify-between gap-x-10 gap-y-6 sm:mt-10">
            <p className="max-w-md text-lg leading-relaxed text-pretty text-subtle sm:text-xl">{sub}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href={primary.href} className="inline-flex h-12 items-center gap-2 rounded-lg px-6 text-base font-semibold btn-primary">
                {primary.label}
                <Arrow className="size-4" />
              </Link>
              <Link href={secondary.href} className="inline-flex h-12 items-center rounded-lg px-6 text-base font-medium btn-secondary">
                {secondary.label}
              </Link>
            </div>
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
