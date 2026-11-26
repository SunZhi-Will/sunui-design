import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getItems } from "@/lib/registry";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

/*
 * 首頁「帶狀型錄」原型（2026-11-22，只在開發環境）。
 * 用來和 Scrolltide 首頁的前兩段並排比較，見 reports/Scrolltide競品深度分析與完整規劃-2026-11-22.md 第七節階段 1。
 * 文案先寫死繁中，方向確定後才搬進 messages.ts 的四種語言。卡片暫用分享圖，之後換成錄好的循環影片。
 */

export const metadata: Metadata = { title: "Lab: home bands", robots: { index: false } };

type Card = { name: string; title: string; kind: string };

// 名稱旁的分類寫在這裡，原型不去動 registry
const PRO: Card[] = [
  { name: "launch-stage-hero", title: "Launch Stage", kind: "Hero" },
  { name: "day-night-hero", title: "Day Night", kind: "Hero" },
  { name: "glass-cube-hero", title: "Glass Cube", kind: "3D Hero" },
  { name: "lookbook-expand-hero", title: "Lookbook Expand", kind: "商店" },
  { name: "campaign-landing", title: "Campaign Landing", kind: "檔期頁" },
  { name: "shoppable-lookbook", title: "Shoppable Lookbook", kind: "商店" },
  { name: "holiday-calendar", title: "Holiday Calendar", kind: "檔期" },
  { name: "specimen-scan", title: "Specimen Scan", kind: "商品" },
  { name: "catalog-flipbook", title: "Catalog Flipbook", kind: "商店" },
];

// ?picks=bright：淺色截圖裡又亮、又有照片或插畫或大塊顏色的那幾個（2026-11-22 從 209 張淺色截圖挑的）
const PRO_BRIGHT: Card[] = [
  { name: "lamp-dimmer-scene", title: "Lamp Dimmer", kind: "商品" },
  { name: "day-night-hero", title: "Day Night", kind: "Hero" },
  { name: "black-friday-weekend", title: "Black Friday Weekend", kind: "檔期頁" },
  { name: "shoppable-lookbook", title: "Shoppable Lookbook", kind: "商店" },
  { name: "lookbook-expand-hero", title: "Lookbook Expand", kind: "商店" },
  { name: "catalog-flipbook", title: "Catalog Flipbook", kind: "商店" },
  { name: "drop-release-hero", title: "Drop Release", kind: "Hero" },
  { name: "lunar-new-year", title: "Lunar New Year", kind: "檔期" },
  { name: "tear-pack-reveal", title: "Tear Pack", kind: "會員" },
];

const FREE_BRIGHT: Card[] = [
  { name: "depth-hero", title: "Depth Hero", kind: "Hero" },
  { name: "compare-slider", title: "Compare Slider", kind: "媒體" },
  { name: "cloth-curtain", title: "Cloth Curtain", kind: "轉場" },
  { name: "orbit-gallery", title: "Orbit Gallery", kind: "Hero" },
  { name: "photo-looks", title: "Photo Looks", kind: "媒體" },
  { name: "hotspots", title: "Hotspots", kind: "商品" },
  { name: "variant-picker", title: "Variant Picker", kind: "商品" },
  { name: "spine-shelf", title: "Spine Shelf", kind: "商品" },
  { name: "phone-frame", title: "Phone Frame", kind: "媒體" },
];

const FREE: Card[] = [
  { name: "depth-hero", title: "Depth Hero", kind: "Hero" },
  { name: "compare-slider", title: "Compare Slider", kind: "媒體" },
  { name: "book-3d", title: "3D Book", kind: "3D" },
  { name: "orbit-gallery", title: "Orbit Gallery", kind: "Hero" },
  { name: "cloth-curtain", title: "Cloth Curtain", kind: "轉場" },
  { name: "hero-billboard-carousel", title: "Billboard Carousel", kind: "Hero" },
  { name: "spine-shelf", title: "Spine Shelf", kind: "商品" },
  { name: "photo-looks", title: "Photo Looks", kind: "媒體" },
  { name: "card-effects", title: "Card Effects", kind: "卡片" },
];

// 漸層字：一個畫面一處、兩個相鄰色相（青到藍），沒有 bg-clip 支援時退回實色。規則見 DESIGN.md 第 2 節
const GRADIENT_WORD =
  "text-[#0369a1] dark:text-[#38bdf8] supports-[background-clip:text]:bg-[linear-gradient(100deg,#0891b2,#2563eb)] dark:supports-[background-clip:text]:bg-[linear-gradient(100deg,#67e8f9,#3b82f6)] supports-[background-clip:text]:bg-clip-text supports-[background-clip:text]:text-transparent";

function Arrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[11px] tracking-[0.18em] text-subtle uppercase">{children}</p>;
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((label, i) => (
        <span
          key={label}
          className={cn(
            "inline-flex h-8 items-center rounded-full px-3.5 text-[13px]",
            i === 0 ? "bg-fg font-medium text-bg" : "text-subtle shadow-[0_0_0_1px_var(--line)] transition-colors hover:text-fg",
          )}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function BlockCard({ card, pro, dir }: { card: Card; pro: boolean; dir: string }) {
  return (
    <Link href={`/blocks/${card.name}`} className="group/card block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
      <span className="relative block aspect-[16/10] overflow-hidden rounded-xl bg-[#0e0e0e] shadow-e1 transition-shadow duration-200 group-hover/card:shadow-e2">
        <Image
          src={mediaUrl(`/og/${dir}/${card.name}.jpg`)}
          alt=""
          fill
          sizes="(min-width: 1024px) 370px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 ease-site group-hover/card:scale-[1.04] motion-reduce:transition-none"
        />
        <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />
        <span className="absolute bottom-3 left-3 inline-flex h-8 translate-y-1 items-center gap-1.5 rounded-full bg-black/70 px-3 text-[13px] font-medium text-white opacity-0 backdrop-blur-sm transition-[opacity,translate] duration-300 ease-site group-hover/card:translate-y-0 group-hover/card:opacity-100">
          預覽
          <Arrow className="size-3.5" />
        </span>
      </span>
      <span className="mt-3 flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-medium text-fg">{card.title}</span>
          <span className="mt-0.5 block text-[13px] text-subtle">{card.kind}</span>
        </span>
        <span
          className={cn(
            "mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
            pro ? "text-[#0369a1] shadow-[0_0_0_1px_rgb(8_145_178/0.45)] dark:text-[#67e8f9]" : "text-subtle shadow-[0_0_0_1px_var(--line)]",
          )}
        >
          {pro ? "Pro" : "免費"}
        </span>
      </span>
    </Link>
  );
}

function FoundingCard() {
  return (
    <Link
      href="/pricing"
      className="group/card flex aspect-[16/10] flex-col justify-between rounded-xl bg-card p-6 shadow-e1 transition-shadow duration-200 hover:shadow-e2"
    >
      <Eyebrow>創始會員 · 11 月 27 日開賣</Eyebrow>
      <span>
        <span className="block text-xl font-semibold tracking-[-0.02em] text-fg">一次付清，之後每個 Pro 場景都是你的。</span>
        <span className="mt-2 block text-sm text-subtle">名額用完就恢復原價。</span>
      </span>
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-fg">
        看方案
        <Arrow className="size-3.5 transition-transform duration-300 ease-site group-hover/card:translate-x-0.5" />
      </span>
    </Link>
  );
}

function Band({
  eyebrow,
  title,
  sub,
  chips,
  sort,
  children,
  more,
}: {
  eyebrow: string;
  title: React.ReactNode;
  sub: string;
  chips: string[];
  sort?: boolean;
  children: React.ReactNode;
  more: { href: string; label: string };
}) {
  return (
    <section className="mt-28 first:mt-20 sm:mt-36">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-[40px] sm:leading-[1.1]">{title}</h2>
        </div>
        <p className="max-w-sm text-[15px] leading-relaxed text-subtle lg:text-right">{sub}</p>
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <Chips items={chips} />
        {sort && (
          <div className="flex gap-1 rounded-full p-1 text-[13px] shadow-[0_0_0_1px_var(--line)]">
            <span className="rounded-full bg-fg px-3 py-1 font-medium text-bg">精選</span>
            <span className="px-3 py-1 text-subtle">熱門</span>
            <span className="px-3 py-1 text-subtle">最新</span>
          </div>
        )}
      </div>
      <div className="mt-8 grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
      <div className="mt-12 flex justify-center">
        <Link href={more.href} className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-[15px] font-medium btn-secondary">
          {more.label}
          <Arrow className="size-4" />
        </Link>
      </div>
    </section>
  );
}

// ?posters=light 改讀淺色主題截的分享圖（scripts/capture-og.mjs --theme light --out public/og/blocks-light）
export default async function HomeBandsLab({ searchParams }: { searchParams: Promise<{ posters?: string; picks?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const query = await searchParams;
  // ?posters=crop：淺色截圖再逐張取景裁成 16:10（public/og/blocks-crop，只有 picks=bright 那 18 張）
  const dir = query.posters === "crop" ? "blocks-crop" : query.posters === "light" ? "blocks-light" : "blocks";
  const bright = query.picks === "bright";
  const all = getItems();
  const have = new Set(all.map((item) => item.name));
  const proCount = all.filter((item) => item.meta.tier === "pro").length;
  const freeCount = all.length - proCount;
  const pro = (bright ? PRO_BRIGHT : PRO).filter((card) => have.has(card.name));
  const free = (bright ? FREE_BRIGHT : FREE).filter((card) => have.has(card.name));

  return (
    <div className="pb-32">
      {pro.length > 0 && (
        <Band
          eyebrow={`${proCount} 個 Pro 場景 · 每週新增`}
          title={
            <>
              整頁的場景，<span className={GRADIENT_WORD}>裝了就會動</span>
            </>
          }
          sub="不是 prompt，是寫好的程式碼。一行指令裝進專案，看到的就是你拿到的。"
          chips={["全部", "Hero", "商店", "檔期", "商品", "3D"]}
          sort
          more={{ href: "/blocks?tier=pro", label: `看全部 ${proCount} 個 Pro 場景` }}
        >
          {pro.slice(0, 5).map((card) => (
            <BlockCard key={card.name} card={card} pro dir={dir} />
          ))}
          <FoundingCard />
          {pro.slice(5).map((card) => (
            <BlockCard key={card.name} card={card} pro dir={dir} />
          ))}
        </Band>
      )}

      <Band
        eyebrow={`${freeCount} 個免費區塊 · MIT`}
        title="一次一塊，放進你已經在做的頁面"
        sub="不是每次都要整頁。一個會回應的按鈕、一個拖得動的畫廊，一行指令就好。"
        chips={["全部", "Hero", "媒體", "商品", "3D", "轉場", "卡片"]}
        more={{ href: "/blocks?tier=free", label: `看全部 ${freeCount} 個免費區塊` }}
      >
        {free.map((card) => (
          <BlockCard key={card.name} card={card} pro={false} dir={dir} />
        ))}
      </Band>
    </div>
  );
}
