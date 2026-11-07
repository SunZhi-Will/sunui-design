"use client";

import { useDemoText } from "@/lib/demo-locale";

import {
  BentoExpand,
  EffectCard,
  ExpandingPanels,
  FocusGrid,
  SpotlightGrid,
  StackFan,
  cardEffects,
  cardGroupEffects,
  type CardEffect,
  type CardGroupEffect,
  type EffectCardItem,
} from "./card-effects";
import { copy, demoArt } from "./demo";

export const variants = [...cardEffects, ...cardGroupEffects];

// 首頁預設只放這一種當代表，挑會自己動的，卡片不用先懸停才看得出效果
export const featured = "tilt-3d";

/** 首頁型錄：一種卡片效果一張卡，設定與 demo 的同名格子一致，下方標出怎麼觸發。 */
export default function CardEffectsVariant({ variant }: { variant: string }) {
  const t = useDemoText(copy);
  const items: EffectCardItem[] = t.cards.map((c, i) => ({
    id: `c${i}`,
    title: c.title,
    description: c.body,
    media: <img src={demoArt(i)} alt="" />,
  }));

  let body;
  const single = cardEffects.indexOf(variant as CardEffect);
  if (single >= 0) {
    const effect = variant as CardEffect;
    const c = t.cards[single % t.cards.length];
    body = (
      <div className="w-64">
        <EffectCard
          effect={effect}
          media={<img src={demoArt(single)} alt="" />}
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
      </div>
    );
  } else {
    const group = variant as CardGroupEffect;
    body =
      group === "stack-fan" ? (
        <div className="w-80">
          <StackFan items={items.slice(0, 4)} cardWidth={110} />
        </div>
      ) : group === "focus-dim" ? (
        // 三欄排成 560px 寬會在卡片裡縮到一半以下：兩張並排就看得出「滑過一張、旁邊變暗」
        <div className="w-[26rem]">
          <FocusGrid items={items.slice(0, 2)} className="grid-cols-2 sm:grid-cols-2 lg:grid-cols-2" />
        </div>
      ) : group === "border-spotlight-grid" ? (
        // 2×2 比一排三張窄，游標經過時光暈跨越相鄰邊框的效果也看得更清楚
        <div className="w-[22rem]">
          <SpotlightGrid items={items.slice(2, 6).map((it) => ({ ...it, media: undefined }))} className="grid-cols-2 sm:grid-cols-2" />
        </div>
      ) : group === "expanding-panels" ? (
        <div className="w-[480px]">
          <ExpandingPanels items={items.slice(0, 5)} />
        </div>
      ) : (
        <div className="w-[480px]">
          <BentoExpand items={items} />
        </div>
      );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {body}
      <span className="text-xs text-muted-foreground">{variant === "flip" ? t.click : t.hover}</span>
    </div>
  );
}
