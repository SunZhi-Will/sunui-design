import Link from "next/link";
import type { ReactNode } from "react";

/**
 * 首頁開場：上面是置中的標題、一句話、兩顆按鈕；下面是鋪滿螢幕寬度的即時元件牆（live-wall.tsx）。
 * 規則見 SITE-MOTION.md §6，視覺比較見 reports/元件庫首頁設計深度分析-2026-11-19.md。
 */
export function HomeHero({
  chip,
  title,
  sub,
  primary,
  secondary,
  wall,
}: {
  chip?: { text: string; href: string };
  title: string;
  sub: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  wall: ReactNode;
}) {
  return (
    <section className="pt-14 sm:pt-20">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
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
        <h1 className="text-[44px] leading-[1.06] font-semibold tracking-[-0.035em] text-balance [word-break:auto-phrase] sm:text-6xl lg:text-[72px]">
          <Title text={title} />
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-pretty text-subtle">{sub}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href={primary.href} className="inline-flex h-11 items-center gap-2 rounded-lg px-5 text-[15px] font-semibold btn-primary">
            {primary.label}
            <Arrow className="size-4" />
          </Link>
          <Link href={secondary.href} className="inline-flex h-11 items-center rounded-lg px-5 text-[15px] font-medium btn-secondary">
            {secondary.label}
          </Link>
        </div>
      </div>
      <div className="mt-14 sm:mt-16">{wall}</div>
    </section>
  );
}

// 中日文只在全形標點後換行（同 PhraseText）
function Title({ text }: { text: string }) {
  const phrases = text.split(/(?<=[、，。！？：；])/u).filter(Boolean);
  if (phrases.length < 2) return <>{text}</>;
  return (
    <>
      {phrases.map((phrase, i) => (
        <span key={i} className="inline-block">
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
