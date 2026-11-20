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

// The home page shows only this one as the representative, one that moves on its own so the card needs no hover to show the effect
export const featured = "tilt-3d";

/** Home catalog: one card per card effect, matching the same-named cell in the demo, with how to trigger it noted below. */
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
          price={effect === "tilt-3d" ? t.price : undefined}
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
        // Three columns at 560px wide shrink to under half inside the card: with two side by side you can still see "hover one, the neighbor dims"
        <div className="w-[26rem]">
          <FocusGrid items={items.slice(0, 2)} className="grid-cols-2 sm:grid-cols-2 lg:grid-cols-2" />
        </div>
      ) : group === "border-spotlight-grid" ? (
        // 2×2 is narrower than a row of three, and the glow crossing adjacent borders is easier to see as the cursor passes
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
