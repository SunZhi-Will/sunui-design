"use client";

import { useDemoText } from "@/lib/demo-locale";

import { Animate, emphasisPresets, entrancePresets, exitPresets, presetFamily, type AnimatePreset } from "./animate-presets";
import { copy, Subject } from "./demo";

export const variants = [...entrancePresets, ...exitPresets, ...emphasisPresets] as const;

/** 首頁型錄：一個預設一張卡。全部用 loop 觸發，進場與退場會來回播放，強調類照示範頁的節奏循環 */
export default function AnimatePresetsVariant({ variant }: { variant: string }) {
  const t = useDemoText(copy);
  const preset = variant as AnimatePreset;
  const family = presetFamily(preset);
  const repeatDelay = family === "emphasis" ? (preset === "spin" || preset === "float" ? 0.2 : 1.2) : 0.8;
  return (
    <div className="grid h-36 w-64 place-items-center overflow-hidden">
      <Animate preset={preset} trigger="loop" repeatDelay={repeatDelay}>
        <Subject label={t.sample} />
      </Animate>
    </div>
  );
}
