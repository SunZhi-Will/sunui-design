"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { CardVideo } from "@/components/card-video";
import { LivePreview } from "@/components/live-preview";
import cardsMedia from "@/content/cards-media.json";
import { format, type Locale } from "@/lib/i18n";
import type { Tier } from "@/lib/registry";
import { useSaved } from "@/lib/saved";
import type { SpotKey } from "@/lib/spot";
import { cn } from "@/lib/utils";

/** save 有給才顯示書籤，例如「收藏 {title}」 */
export type BlockCardLabels = { livePreview: string; expand: string; pro: string; save?: string };

const media = cardsMedia as Record<string, { av1?: boolean }>;

/**
 * 型錄卡片：/blocks 型錄與區塊頁的相似區塊共用。
 * 錄好預覽影片的（content/cards-media.json 有，scripts/record-cards.mjs --catalog 錄的）放靜態圖加影片，點整張卡展開成面板，
 * 和首頁的卡片一樣（2026-11-22 起）；效果庫拆開的單一樣式沒有影片，仍是即時跑的 iframe，可以直接操作。
 */
export function BlockCard({
  name,
  variant,
  preview,
  spot,
  poster,
  title,
  note,
  tier,
  locale,
  labels,
  className,
}: {
  name: string;
  /** 效果庫拆開後的單一樣式：卡片只跑這一種，展開時面板也帶著它 */
  variant?: string;
  /** 只換預覽、不換連結：收合的效果庫卡片跑代表樣式，點開仍是整個庫 */
  preview?: string;
  /** 卡片預覽套用的示範品牌色，省略時是出廠墨色 */
  spot?: SpotKey;
  /** 有分享圖時，iframe 載入前先顯示 /og/blocks/<name>.jpg */
  poster?: boolean;
  title: string;
  /** 標題旁的小字，例如效果庫收合時的樣式數 */
  note?: string;
  tier: Tier;
  locale: Locale;
  labels: BlockCardLabels;
  /** 加在最外層 <li> 上，例如依欄數隱藏多出來的卡 */
  className?: string;
}) {
  const router = useRouter();
  const path = `/blocks/${name}`;
  const href = variant ? `${path}?style=${encodeURIComponent(variant)}` : path;
  const video = variant ? undefined : media[name];

  return (
    <li className={cn("group", className)}>
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-card shadow-e1 transition-shadow duration-200 group-hover:shadow-e2">
        {video ? (
          // 影片只是畫面，鍵盤使用者用下面標題的連結：這裡不重複進 tab 順序
          <Link href={href} scroll={false} aria-hidden="true" tabIndex={-1} className="absolute inset-0 block">
            <Image
              src={`/cards/${name}.jpg`}
              alt=""
              fill
              sizes="(min-width: 1024px) 370px, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 ease-site group-hover:scale-[1.04] motion-reduce:transition-none"
            />
            <CardVideo name={name} av1={video.av1} className="group-hover:scale-[1.04]" />
          </Link>
        ) : (
          <LivePreview
            name={name}
            variant={variant ?? preview}
            spot={spot}
            poster={poster ? `/og/blocks/${name}.jpg` : undefined}
            title={format(labels.livePreview, { title })}
            locale={locale}
            onExpand={() => router.push(href, { scroll: false })}
          />
        )}
        {tier === "pro" && (
          <span className="pointer-events-none absolute top-3 left-3 rounded-md bg-fg px-2 py-0.5 text-[11px] font-medium text-bg shadow-btn">
            {labels.pro}
          </span>
        )}
        <Link
          href={href}
          scroll={false}
          aria-hidden="true"
          tabIndex={-1}
          title={labels.expand}
          className="absolute top-3 right-3 grid size-8 place-items-center rounded-md bg-fg/90 text-bg opacity-0 shadow-btn transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
          </svg>
        </Link>
      </div>
      <div className="mt-3 flex items-start justify-between gap-2 px-1">
        <h3 className="min-w-0 text-sm font-medium tracking-tight">
          <Link
            href={href}
            scroll={false}
            className="rounded-sm text-subtle transition-colors outline-none group-hover:text-fg hover:text-fg focus-visible:text-fg focus-visible:ring-2 focus-visible:ring-accent"
          >
            {title}
          </Link>
          {note && <span className="ml-2 text-xs font-normal text-subtle">{note}</span>}
        </h3>
        {labels.save && <SaveButton name={name} title={title} label={labels.save} />}
      </div>
    </li>
  );
}

/** 書籤：存在這個瀏覽器，不需要帳號。效果庫的單一樣式也存整個庫的名稱。 */
function SaveButton({ name, title, label }: { name: string; title: string; label: string }) {
  const { saved, toggle } = useSaved();
  const on = saved.includes(name);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={format(label, { title })}
      title={format(label, { title })}
      onClick={() => toggle(name)}
      className={cn(
        "-mt-1 -mr-1 grid size-7 shrink-0 place-items-center rounded-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent",
        on ? "text-fg" : "text-subtle/60 hover:text-fg",
      )}
    >
      <svg viewBox="0 0 24 24" className="size-4" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 3.5h12v17l-6-4.25-6 4.25z" />
      </svg>
    </button>
  );
}
