"use client";

import type { ReactNode } from "react";

import { useDemoText } from "@/lib/demo-locale";

import {
  BentoExpand,
  EffectCard,
  ExpandingPanels,
  FocusGrid,
  SpotlightGrid,
  StackFan,
  cardEffects,
  type CardEffect,
  type EffectCardItem,
} from "./card-effects";

// 示範照片（AI 生成），和 image-effects 共用 public/blocks/image-effects；順序對應 copy.cards
const photos = ["lagoon", "desert", "harbor", "valley", "canyon", "peaks"];

export function demoArt(i: number) {
  return `/blocks/image-effects/${photos[i % photos.length]}.webp`;
}

export const copy = {
  en: {
    hover: "Hover",
    click: "Click",
    cards: [
      { title: "Coastal trail", body: "12 km loop with tide pools." },
      { title: "Desert dunes", body: "Sunrise walk, sand boards included." },
      { title: "Harbor lights", body: "Evening ferry and night market." },
      { title: "Valley farms", body: "Orchard picnic and cider tasting." },
      { title: "Canyon edge", body: "Rim path with three lookouts." },
      { title: "Mountain hut", body: "Overnight stay above the clouds." },
    ],
    backTitle: "Back side",
    backBody: "Flip cards can hide specs, a price or a short note.",
  },
  "zh-TW": {
    hover: "滑過",
    click: "點擊",
    cards: [
      { title: "海岸步道", body: "12 公里環線，沿途有潮池。" },
      { title: "沙漠沙丘", body: "日出健行，附滑沙板。" },
      { title: "港口燈火", body: "傍晚渡輪與夜市。" },
      { title: "山谷農場", body: "果園野餐與蘋果酒品飲。" },
      { title: "峽谷邊緣", body: "崖邊小徑，三座觀景台。" },
      { title: "高山小屋", body: "在雲海之上住一晚。" },
    ],
    backTitle: "背面",
    backBody: "翻面卡片可以藏規格、價格或一段短說明。",
  },
  "zh-CN": {
    hover: "悬停",
    click: "点击",
    cards: [
      { title: "海岸步道", body: "12 公里环线，沿途有潮池。" },
      { title: "沙漠沙丘", body: "日出徒步，附滑沙板。" },
      { title: "港口灯火", body: "傍晚渡轮与夜市。" },
      { title: "山谷农场", body: "果园野餐与苹果酒品鉴。" },
      { title: "峡谷边缘", body: "崖边小径，三座观景台。" },
      { title: "高山小屋", body: "在云海之上住一晚。" },
    ],
    backTitle: "背面",
    backBody: "翻转卡片可以藏规格、价格或一段短说明。",
  },
  ja: {
    hover: "ホバー",
    click: "クリック",
    cards: [
      { title: "海岸トレイル", body: "潮だまりを巡る 12 km の周回路。" },
      { title: "砂丘", body: "日の出ウォーク、サンドボード付き。" },
      { title: "港の灯り", body: "夕方のフェリーとナイトマーケット。" },
      { title: "谷の農園", body: "果樹園ピクニックとシードル試飲。" },
      { title: "渓谷の縁", body: "展望台が 3 つある縁の道。" },
      { title: "山小屋", body: "雲の上で一泊。" },
    ],
    backTitle: "裏面",
    backBody: "フリップカードには仕様や価格、短いメモを隠せます。",
  },
};

function Tile({ name, hint, wide, children }: { name: string; hint: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={wide ? "col-span-full flex flex-col gap-3" : "flex flex-col gap-3"}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-xs font-medium">{name}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>
      {children}
    </div>
  );
}

export default function CardEffectsDemo() {
  const t = useDemoText(copy);
  const items: EffectCardItem[] = t.cards.map((c, i) => ({
    id: `c${i}`,
    title: c.title,
    description: c.body,
    media: <img src={demoArt(i)} alt="" />,
  }));
  const single = (effect: CardEffect, i: number) => {
    const c = t.cards[i % t.cards.length];
    return (
      <EffectCard
        effect={effect}
        media={<img src={demoArt(i)} alt="" />}
        title={c.title}
        flipOn={effect === "flip" ? "click" : undefined}
        back={
          <div className="flex h-full flex-col justify-center gap-2 bg-muted p-5">
            <p className="font-semibold tracking-tight">{t.backTitle}</p>
            <p className="text-sm text-muted-foreground">{t.backBody}</p>
          </div>
        }
      >
        {c.body}
      </EffectCard>
    );
  };

  return (
    <div className="grid w-full max-w-5xl grid-cols-1 gap-x-6 gap-y-10 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {cardEffects.map((effect, i) => (
        <Tile key={effect} name={effect} hint={effect === "flip" ? t.click : t.hover}>
          {single(effect, i)}
        </Tile>
      ))}
      <Tile name="stack-fan" hint={t.hover}>
        <StackFan items={items.slice(0, 4)} cardWidth={110} />
      </Tile>
      <Tile name="focus-dim" hint={t.hover} wide>
        <FocusGrid items={items.slice(0, 3)} className="sm:grid-cols-3" />
      </Tile>
      <Tile name="border-spotlight-grid" hint={t.hover} wide>
        <SpotlightGrid items={items.slice(3, 6).map((it) => ({ ...it, media: undefined }))} className="sm:grid-cols-3" />
      </Tile>
      <Tile name="expanding-panels" hint={t.hover} wide>
        <ExpandingPanels items={items.slice(0, 5)} />
      </Tile>
      <Tile name="bento-expand" hint={t.hover} wide>
        <BentoExpand items={items} />
      </Tile>
    </div>
  );
}
