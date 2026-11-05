"use client";

import { memo, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * VolumeBar：音量條。直接訂閱音量並改 DOM 寬度，不經過 React re-render。
 * level 以 0 到 100 計，乘上 gain（0 到 1 以上）後封頂 100%。
 */
export interface VolumeBarProps {
  gain: number;
  enabled: boolean;
  /** 系統聲音用 AutoLens 金，麥克風用 #d4d4d4 */
  color?: string;
  subscribe: (cb: (level: number) => void) => () => void;
  /** 無障礙名稱；不給時用 labels.label */
  label?: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<VolumeBarLabels>;
  className?: string;
}

export interface VolumeBarLabels {
  label: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, VolumeBarLabels> = {
  en: { label: "Volume level" },
  "zh-TW": { label: "音量" },
  "zh-CN": { label: "音量" },
  ja: { label: "音量レベル" },
};

export const VolumeBar = memo(function VolumeBar({ gain, enabled, color = "#eab308", subscribe, label, locale = "en", labels, className }: VolumeBarProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const barRef = useRef<HTMLDivElement>(null);
  const gainRef = useRef(gain);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    gainRef.current = gain;
  }, [gain]);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    return subscribe((level) => {
      if (!barRef.current) return;
      const width = enabledRef.current ? Math.min(100, level * gainRef.current) : 0;
      barRef.current.style.width = `${width}%`;
      barRef.current.parentElement?.setAttribute("aria-valuenow", String(Math.round(width)));
    });
  }, [subscribe]);

  return (
    <div role="meter" aria-label={label ?? t.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} className={cn("relative h-2 w-32 overflow-hidden rounded-md bg-slate-700/50", className)}>
      <div ref={barRef} className="motion-reduce:!transition-none" style={{ height: "100%", width: "0%", backgroundColor: color, transition: "width 80ms linear" }} />
    </div>
  );
});

/** 與 VolumeBar 相同，以 block 名稱匯出 */
export const VolumeMeter = VolumeBar;
