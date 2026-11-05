"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { ImageEffect, Lightbox, SliceSlideshow, imageEffects, imageGroupEffects, type ImageEffectName, type ImageItem } from "./image-effects";
import { copy, demoArt, kinds } from "./demo";

export const variants = [...imageEffects, ...imageGroupEffects];

/** 首頁型錄：一種圖片效果一張卡，設定與 demo 的同名格子一致；進場類附重播鈕。 */
export default function ImageEffectsVariant({ variant }: { variant: string }) {
  const t = useDemoText(copy);
  const [run, setRun] = useState(0);
  const images: ImageItem[] = t.alts.map((alt, i) => ({ src: demoArt(i), alt }));

  let body;
  let hint: string;
  let replay = false;
  const i = imageEffects.indexOf(variant as ImageEffectName);
  if (i >= 0) {
    const effect = variant as ImageEffectName;
    const kind = kinds[effect];
    const image = images[i % images.length];
    hint = t[kind];
    replay = kind === "entrance";
    body = (
      <ImageEffect
        key={run}
        effect={effect}
        src={image.src}
        alt={image.alt}
        images={effect === "image-swap" ? images.slice(0, 3) : undefined}
        caption={effect === "hover-zoom" ? t.caption : undefined}
        direction={effect === "clip-reveal" ? "circle" : undefined}
        trigger="inView"
      />
    );
  } else if (variant === "slice-transition") {
    hint = t.loop;
    body = <SliceSlideshow images={images} />;
  } else {
    hint = t.click;
    body = <Lightbox images={images} closeLabel={t.close} />;
  }

  return (
    <div className="flex w-72 flex-col items-center gap-3">
      <div className="w-full">{body}</div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{hint}</span>
        {replay && (
          <button
            type="button"
            onClick={() => setRun((r) => r + 1)}
            className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {t.replay}
          </button>
        )}
      </div>
    </div>
  );
}
