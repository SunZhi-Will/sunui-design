"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { ImageEffect, Lightbox, SliceSlideshow, imageEffects, imageGroupEffects, type ImageEffectName, type ImageItem } from "./image-effects";
import { copy, demoArt, harborArt, kinds } from "./demo";

export const variants = [...imageEffects, ...imageGroupEffects];

// The home page shows only this one as the representative; pick one that animates by itself so the card shows its effect without a hover
export const featured = "ken-burns";

/** Home catalog: one card per image effect, with the same settings as the same-named tile in the demo; entrance effects get a replay button. */
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
        src={effect === "hover-zoom" ? harborArt : image.src}
        alt={effect === "hover-zoom" ? t.caption : image.alt}
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
