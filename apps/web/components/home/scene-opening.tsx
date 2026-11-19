import Link from "next/link";

import { LivePreview } from "@/components/live-preview";

/**
 * 首頁開場（2026-11-20）：一個完整的區塊（新品發表主視覺）以原尺寸跑在第一個畫面裡，就是開場本身。
 * 上面只留一條窄的介紹列：標題、一句話、兩顆按鈕。讓第一眼看到的是做好的整個畫面，不是自製的小卡。
 * 規則見 SITE-MOTION.md §6。
 */
export function SceneOpening({
  chip,
  title,
  sub,
  primary,
  secondary,
  scene,
  locale,
}: {
  chip?: { text: string; href: string };
  title: string;
  sub: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  scene: { name: string; title: string; href: string; previewLabel: string };
  locale: Parameters<typeof LivePreview>[0]["locale"];
}) {
  return (
    <section aria-labelledby="home-title" className="mx-[calc(50%-50vw)] px-4 pt-8 sm:px-5 sm:pt-10">
      <div className="mx-auto max-w-[2400px]">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
          <div>
            {chip && (
              <Link
                href={chip.href}
                className="mb-4 inline-flex h-7 items-center gap-2 rounded-full px-3 text-[13px] text-subtle shadow-hair transition-colors hover:text-fg"
              >
                <span aria-hidden="true" className="size-1.5 rounded-full bg-fg" />
                {chip.text}
              </Link>
            )}
            <h1
              id="home-title"
              className="text-[clamp(32px,3.4vw,56px)] leading-[1.08] font-semibold tracking-[-0.03em] text-balance [word-break:auto-phrase]"
            >
              {title}
            </h1>
            <p className="mt-3 text-pretty text-subtle sm:text-lg">{sub}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={primary.href} className="inline-flex h-11 items-center gap-2 rounded-lg px-5 text-[15px] font-semibold btn-primary">
              {primary.label}
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <Link href={secondary.href} className="inline-flex h-11 items-center rounded-lg px-5 text-[15px] font-medium btn-secondary">
              {secondary.label}
            </Link>
          </div>
        </div>

        {/* 開場的主角：完整的區塊，可以直接操作。高度補滿第一個畫面剩下的空間 */}
        <div className="relative mt-8 h-[max(560px,calc(100svh-15rem))] overflow-hidden rounded-2xl bg-card shadow-e1 sm:mt-10 dark:bg-[#151515]">
          <LivePreview name={scene.name} mode="sheet" title={scene.previewLabel} locale={locale} />
        </div>
        <p className="mt-4 flex items-center justify-between gap-4 text-[15px] font-medium">
          {scene.title}
          <Link href={scene.href} className="text-sm text-subtle underline-offset-4 transition-colors hover:text-fg hover:underline">
            /blocks/{scene.name}
          </Link>
        </p>
      </div>
    </section>
  );
}
