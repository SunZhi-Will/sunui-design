"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { LivePreview } from "@/components/live-preview";
import { format, type Locale } from "@/lib/i18n";
import type { Tier } from "@/lib/registry";
import { cn } from "@/lib/utils";

export type StageBlock = { name: string; title: string; tier: Tier };

/**
 * 首頁開場：上面一句標題和安裝指令（children），下面一座展示台，裡面是真的區塊在跑，可以直接操作。
 * 展示台上方的分段控制切換精選區塊；不自動輪播（沒按的東西不自己動，SITE-MOTION.md）。
 * 材質照 SITE-MOTION.md §5：外框 shadow-e3、圓角 16，內距 6，舞台圓角 10（同心）。
 */
export function HeroStage({
  blocks,
  locale,
  labels,
  children,
}: {
  blocks: StageBlock[];
  locale: Locale;
  labels: { label: string; live: string; open: string; livePreview: string; pro: string };
  children: ReactNode;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = blocks[index];

  // 方向鍵在分頁之間移動（WAI-ARIA tabs）
  const onKeyDown = (e: KeyboardEvent) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (index + step + blocks.length) % blocks.length;
    setIndex(next);
    tabs.current[next]?.focus();
  };

  return (
    <section className="pt-14 sm:pt-24">
      <div className="mx-auto max-w-3xl">{children}</div>

      {current && (
        <div className="mt-14 sm:mt-20">
          <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
            <div
              role="tablist"
              aria-label={labels.label}
              onKeyDown={onKeyDown}
              className="mx-auto flex w-max gap-0.5 rounded-md bg-accent-soft p-0.5"
            >
              {blocks.map((block, i) => (
                <button
                  key={block.name}
                  ref={(el) => {
                    tabs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`hero-tab-${block.name}`}
                  aria-selected={i === index}
                  aria-controls="hero-stage"
                  tabIndex={i === index ? 0 : -1}
                  onClick={() => setIndex(i)}
                  className={cn(
                    "rounded-[4px] px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors",
                    i === index ? "bg-card text-fg shadow-e1" : "text-subtle hover:text-fg",
                  )}
                >
                  {block.title}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-card p-1.5 shadow-e3">
            <div className="flex h-10 items-center justify-between gap-3 pr-1 pl-3">
              <p className="flex min-w-0 items-center gap-2 text-[13px]">
                <span className="flex shrink-0 items-center gap-1.5 font-medium text-subtle">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-fg motion-safe:animate-[sunui-live_2.4s_ease-in-out_infinite]" />
                  {labels.live}
                </span>
                <span aria-hidden="true" className="text-line-strong">/</span>
                <span className="truncate font-medium">{current.title}</span>
                {current.tier === "pro" && (
                  <span className="shrink-0 rounded-[4px] bg-fg px-1.5 py-px text-[10px] font-medium text-bg shadow-btn">{labels.pro}</span>
                )}
              </p>
              <Link
                href={`/blocks/${current.name}`}
                className="group inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-[13px] font-medium btn-secondary"
              >
                {labels.open}
                <svg viewBox="0 0 24 24" className="size-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
            <div
              id="hero-stage"
              role="tabpanel"
              aria-labelledby={`hero-tab-${current.name}`}
              className="relative h-[min(560px,75svh)] overflow-hidden rounded-[10px] bg-stage shadow-hair sm:h-[min(600px,68svh)]"
            >
              <LivePreview
                key={current.name}
                name={current.name}
                poster={`/og/blocks/${current.name}.jpg`}
                title={format(labels.livePreview, { title: current.title })}
                locale={locale}
                mode="sheet"
                onExpand={() => router.push(`/blocks/${current.name}`)}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes sunui-live { 0%, 100% { opacity: 1 } 50% { opacity: 0.3 } }`}</style>
    </section>
  );
}
