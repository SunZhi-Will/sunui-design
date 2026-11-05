"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { LivePreview } from "@/components/live-preview";
import { format, type Locale } from "@/lib/i18n";
import type { Tier } from "@/lib/registry";

export type BlockCardLabels = { livePreview: string; expand: string; pro: string };

/**
 * 型錄卡片：元件以原尺寸即時跑、可以直接操作；點空白處或右上角展開成面板。
 * 首頁型錄與區塊頁的相似區塊共用，面板靠同一個 layoutId 從卡片長出來。
 */
export function BlockCard({
  name,
  variant,
  title,
  note,
  tier,
  locale,
  labels,
}: {
  name: string;
  /** 效果庫拆開後的單一樣式：卡片只跑這一種，展開時面板也帶著它 */
  variant?: string;
  title: string;
  /** 標題旁的小字，例如效果庫收合時的樣式數 */
  note?: string;
  tier: Tier;
  locale: Locale;
  labels: BlockCardLabels;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const path = `/blocks/${name}`;
  const href = variant ? `${path}?style=${encodeURIComponent(variant)}` : path;
  // 展開中的卡片先藏起來，面板會從它的位置長出來、關閉時再縮回去
  const expanded = pathname === path && (searchParams.get("style") ?? undefined) === variant;

  return (
    <li className="group">
      <motion.div
        layoutId={`block-card-${variant ? `${name}~${variant}` : name}`}
        transition={{ type: "spring", stiffness: 240, damping: 30 }}
        style={{ borderRadius: 20, opacity: expanded ? 0 : 1 }}
        className="relative aspect-[5/4] overflow-hidden bg-card ring-1 ring-line/70 transition-shadow group-hover:ring-line"
      >
        <LivePreview
          name={name}
          variant={variant}
          title={format(labels.livePreview, { title })}
          locale={locale}
          onExpand={() => router.push(href, { scroll: false })}
        />
        {tier === "pro" && (
          <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-fg px-2 py-0.5 text-[11px] font-medium text-bg">
            {labels.pro}
          </span>
        )}
        <Link
          href={href}
          scroll={false}
          aria-hidden="true"
          tabIndex={-1}
          title={labels.expand}
          className="absolute top-3 right-3 grid size-8 place-items-center rounded-full bg-fg/90 text-bg opacity-0 shadow-sm transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
          </svg>
        </Link>
      </motion.div>
      <h3 className="mt-3 px-1 text-sm font-medium tracking-tight">
        <Link
          href={href}
          scroll={false}
          className="rounded-sm text-subtle transition-colors outline-none group-hover:text-fg hover:text-fg focus-visible:text-fg focus-visible:ring-2 focus-visible:ring-accent"
        >
          {title}
        </Link>
        {note && <span className="ml-2 text-xs font-normal text-subtle">{note}</span>}
      </h3>
    </li>
  );
}
