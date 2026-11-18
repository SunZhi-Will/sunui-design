import Link from "next/link";
import type { ReactNode } from "react";

/**
 * 首頁開場（規劃見 reports/首頁全面重製完整規劃-2026-11-19.md）。
 * 左邊：開賣小標籤、兩行標題、一句說明、兩個按鈕，安裝指令放第三層。
 * 右邊：標本桌（specimen-table.tsx），七個會自己動、也可以自己玩的小元件。
 */
export function HomeHero({
  chip,
  title,
  sub,
  primary,
  secondary,
  command,
  table,
}: {
  chip?: { text: string; href: string };
  title: string;
  sub: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  command?: ReactNode;
  /** 右邊的標本桌（components/home/specimen-table.tsx） */
  table: ReactNode;
}) {
  return (
    <section className="grid items-center gap-12 pt-12 pb-8 sm:pt-16 lg:min-h-[640px] lg:grid-cols-12 lg:gap-10 lg:py-20">
      <div className="lg:col-span-5">
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
        <h1 className="text-[44px] leading-[1.06] font-semibold tracking-[-0.035em] text-balance [word-break:auto-phrase] sm:text-6xl lg:text-[64px]">
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
        {command && <div className="mt-8 max-w-md">{command}</div>}
      </div>

      <div className="lg:col-span-7">{table}</div>
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
