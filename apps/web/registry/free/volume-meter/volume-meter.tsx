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
  label?: string;
  className?: string;
}

export const VolumeBar = memo(function VolumeBar({ gain, enabled, color = "#eab308", subscribe, label, className }: VolumeBarProps) {
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
    <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} className={cn("relative h-2 w-32 overflow-hidden rounded-md bg-slate-700/50", className)}>
      <div ref={barRef} className="motion-reduce:!transition-none" style={{ height: "100%", width: "0%", backgroundColor: color, transition: "width 80ms linear" }} />
    </div>
  );
});

/** 與 VolumeBar 相同，以 block 名稱匯出 */
export const VolumeMeter = VolumeBar;
