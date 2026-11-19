import Link from "next/link";

import { LivePreview } from "@/components/live-preview";
import { format, type Locale } from "@/lib/i18n";

type Scene = { name: string; title: string; tier: "free" | "pro" };

/**
 * 首頁的完整場景：每個區塊以完整 demo、原尺寸、鋪滿寬度一個接一個排下來，不縮成小卡。
 * 讓人在首頁就看到一整個做好的畫面（例如新品發表主視覺），而不是一格一格的縮圖。
 * iframe 只在接近畫面時掛載、離開就卸載（LivePreview），所以疊好幾個也不會同時跑。
 * 規則見 SITE-MOTION.md §6。
 */
export function FullScenes({
  scenes,
  locale,
  labels,
}: {
  scenes: Scene[];
  locale: Locale;
  labels: { livePreview: string; pro: string; open: string };
}) {
  return (
    <ol className="mt-8 space-y-16 sm:space-y-24">
      {scenes.map((scene) => (
        <li key={scene.name}>
          <div className="relative h-[clamp(560px,86svh,980px)] overflow-hidden rounded-2xl bg-card shadow-e1 dark:bg-[#151515]">
            <LivePreview name={scene.name} mode="sheet" title={format(labels.livePreview, { title: scene.title })} locale={locale} />
          </div>
          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="flex items-center gap-2.5 text-[15px] font-medium">
              {scene.title}
              {scene.tier === "pro" && <span className="rounded-md bg-fg px-2 py-0.5 text-[11px] font-medium text-bg">{labels.pro}</span>}
            </p>
            <Link
              href={`/blocks/${scene.name}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-sm font-medium btn-secondary"
            >
              {labels.open}
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </li>
      ))}
    </ol>
  );
}
