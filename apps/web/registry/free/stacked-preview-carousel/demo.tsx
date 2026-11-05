"use client";

import { useDemoText } from "@/lib/demo-locale";

import { StackedPreviewCarousel, type StackedPreviewItem } from "./stacked-preview-carousel";

// 示意封面：中性色塊與線條排成書封版面，代替實際封面照片；每本一種構圖
type CoverKind = "orchard" | "workshop" | "grid" | "trains";

function BookCover({ kind }: { kind: CoverKind }) {
  const ink = "#e7e5e4";
  return (
    <svg viewBox="0 0 160 90" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="160" height="90" fill={kind === "grid" ? "#1c1a17" : kind === "trains" ? "#201d1a" : kind === "workshop" ? "#23201c" : "#262320"} />
      {/* 書本身：直立的一本，放在右側 */}
      <rect x="98" y="10" width="44" height="70" fill="#0c0a09" stroke={ink} strokeOpacity="0.18" strokeWidth="0.5" />
      <rect x="104" y="18" width="24" height="2.4" fill={ink} opacity="0.75" />
      <rect x="104" y="23" width="16" height="2.4" fill={ink} opacity="0.75" />
      {kind === "orchard" && <circle cx="120" cy="52" r="11" fill="none" stroke={ink} strokeOpacity="0.45" strokeWidth="0.6" />}
      {kind === "workshop" && (
        <g stroke={ink} strokeOpacity="0.45" strokeWidth="0.6">
          <path d="M106 66 L134 40" />
          <path d="M106 58 L126 40" />
        </g>
      )}
      {kind === "grid" && (
        <g stroke={ink} strokeOpacity="0.3" strokeWidth="0.4">
          {[0, 1, 2, 3].map((i) => (
            <path key={`v${i}`} d={`M${106 + i * 9} 36 V70`} />
          ))}
          {[0, 1, 2, 3].map((i) => (
            <path key={`h${i}`} d={`M104 ${38 + i * 10} H136`} />
          ))}
        </g>
      )}
      {kind === "trains" && (
        <g stroke={ink} strokeOpacity="0.45" strokeWidth="0.6">
          <path d="M100 60 H140" />
          <path d="M100 64 H140" />
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M${104 + i * 8} 58 V66`} />
          ))}
        </g>
      )}
      {/* 左側的書名列示意 */}
      <rect x="14" y="58" width="56" height="2" fill={ink} opacity="0.25" />
      <rect x="14" y="64" width="38" height="2" fill={ink} opacity="0.25" />
    </svg>
  );
}

const covers = {
  orchard: <BookCover kind="orchard" />,
  workshop: <BookCover kind="workshop" />,
  grid: <BookCover kind="grid" />,
  trains: <BookCover kind="trains" />,
};

type Key = keyof typeof covers;

const copy: Record<"en" | "zh-TW" | "zh-CN" | "ja", { store: string; heading: string; lead: string; items: Record<Key, [string, string]> }> = {
  en: {
    store: "Paperlane Books",
    heading: "This season's staff picks, one stack at a time.",
    lead: "Chosen by the people who shelve them. Hover to pause the stack.",
    items: {
      orchard: ["Fiction", "The Salt Orchard"],
      workshop: ["Essays", "Notes from a Small Workshop"],
      grid: ["Design", "Grids and the Printed Page"],
      trains: ["Travel", "Night Trains of the North"],
    },
  },
  "zh-TW": {
    store: "紙巷書店",
    heading: "這一季的店員推薦，一次翻一本。",
    lead: "由每天上架的店員親手挑選。滑鼠移上去可以暫停。",
    items: {
      orchard: ["小說", "鹽之果園"],
      workshop: ["散文", "小工坊筆記"],
      grid: ["設計", "網格與印刷頁面"],
      trains: ["旅行", "北方的夜行列車"],
    },
  },
  "zh-CN": {
    store: "纸巷书店",
    heading: "这一季的店员推荐，一次翻一本。",
    lead: "由每天上架的店员亲手挑选。鼠标悬停可以暂停。",
    items: {
      orchard: ["小说", "盐之果园"],
      workshop: ["散文", "小工坊笔记"],
      grid: ["设计", "网格与印刷页面"],
      trains: ["旅行", "北方的夜行列车"],
    },
  },
  ja: {
    store: "ペーパーレーン書店",
    heading: "今季のスタッフおすすめを、一冊ずつ。",
    lead: "毎日棚に並べるスタッフが選びました。ホバーで一時停止します。",
    items: {
      orchard: ["小説", "塩の果樹園"],
      workshop: ["エッセイ", "小さな工房のノート"],
      grid: ["デザイン", "グリッドと印刷のページ"],
      trains: ["旅", "北の夜行列車"],
    },
  },
};

export default function StackedPreviewCarouselDemo() {
  const t = useDemoText(copy);
  const items: StackedPreviewItem[] = (Object.keys(covers) as Key[]).map((key) => ({ key, subtitle: t.items[key][0], title: t.items[key][1], cover: covers[key] }));
  return (
    <section className="grid w-full grid-cols-1 items-center gap-10 overflow-hidden rounded-2xl bg-[#0c0a09] px-6 py-10 text-[#f5f5f4] md:grid-cols-2 md:px-10">
      <div className="min-w-0">
        <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#d4a24c]">{t.store}</p>
        <h1 className="mt-3 font-serif text-3xl font-normal leading-tight tracking-[-0.01em] md:text-4xl">{t.heading}</h1>
        <p className="mt-3 text-sm text-[#a8a29e]">{t.lead}</p>
      </div>
      <div className="min-w-0 pb-6 pr-4">
        <StackedPreviewCarousel items={items} />
      </div>
    </section>
  );
}
