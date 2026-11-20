import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export type MarqueeItem = { name: string; title: string; pro: boolean };

/**
 * 首頁的區塊跑馬燈：一排真的區塊預覽圖（/og/blocks/<name>.jpg），等大、等間距，慢慢橫移，兩側淡出。
 * 滑鼠移上去或鍵盤焦點進來就停；每一張連到區塊頁。reduced motion 時不動，改成可以橫向捲。
 * 清單要挑過：只放縮到卡片大小還好看的（有照片、插畫或大塊明暗的），見 reports/首頁從零重做深度分析-2026-11-20.md。
 */
export function SceneMarquee({ items, reverse, proLabel, className }: { items: MarqueeItem[]; reverse?: boolean; proLabel: string; className?: string }) {
  if (items.length === 0) return null;
  const track = cn(
    "flex shrink-0 gap-4 pr-4 animate-[marquee_150s_linear_infinite] group-hover/marquee:[animation-play-state:paused] group-focus-within/marquee:[animation-play-state:paused] motion-reduce:animate-none",
    reverse && "[animation-direction:reverse]",
  );
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className={cn(track, hidden && "motion-reduce:hidden")}>
      {items.map((item) => (
        <li key={item.name} className="w-[280px] shrink-0 sm:w-[380px]">
          <Link href={`/blocks/${item.name}`} tabIndex={hidden ? -1 : undefined} className="group/card block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
            <span className="relative block aspect-[5/4] overflow-hidden rounded-xl bg-[#0e0e0e] shadow-e1 transition-shadow duration-200 group-hover/card:shadow-e2">
              <Image
                src={`/og/blocks/${item.name}.jpg`}
                alt=""
                fill
                sizes="(min-width: 640px) 380px, 280px"
                className="object-cover transition-transform duration-500 ease-site group-hover/card:scale-[1.03]"
              />
              {item.pro && (
                <span className="absolute top-3 left-3 rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-black">{proLabel}</span>
              )}
            </span>
            <span className="mt-3 block truncate text-sm font-medium text-subtle transition-colors group-hover/card:text-fg">{item.title}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
  return (
    <div
      className={cn(
        "group/marquee flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_7%,#000_93%,transparent)] motion-reduce:overflow-x-auto",
        className,
      )}
    >
      {row(false)}
      {row(true)}
    </div>
  );
}
