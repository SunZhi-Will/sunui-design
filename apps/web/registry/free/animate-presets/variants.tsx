"use client";

import { useDemoText } from "@/lib/demo-locale";

import { Animate, emphasisPresets, entrancePresets, exitPresets, presetFamily, type AnimatePreset } from "./animate-presets";
import { copy, Subject } from "./demo";

export const variants = [...entrancePresets, ...exitPresets, ...emphasisPresets] as const;

// The home page shows only this one as the representative, picking one that moves on its own so the card shows the effect without hovering first
export const featured = "jackInTheBox";

/** Home catalog: one card per preset. All use the loop trigger, entrances and exits play back and forth, and emphasis presets loop at the demo page's pace */
export default function AnimatePresetsVariant({ variant }: { variant: string }) {
  const t = useDemoText(copy);
  const preset = variant as AnimatePreset;
  const family = presetFamily(preset);
  const repeatDelay = family === "emphasis" ? (preset === "spin" || preset === "float" ? 0.2 : 1.2) : 0.8;
  return (
    // The frame should be close to the card size: the backIn presets start 120 to 160px outside, and in a small frame the start point is clipped away entirely,
    // IntersectionObserver then reports it as off screen, and the loop would never start
    <div className="grid h-72 w-80 place-items-center overflow-hidden">
      <Animate preset={preset} trigger="loop" repeatDelay={repeatDelay}>
        {/* The chip alone is tiny in a card-sized frame: show it larger so the motion reads */}
        <div className="scale-[1.7]">
          <Subject label={t.sample} />
        </div>
      </Animate>
    </div>
  );
}
