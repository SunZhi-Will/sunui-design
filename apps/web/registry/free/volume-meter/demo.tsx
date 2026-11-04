"use client";

import { useCallback } from "react";

import { VolumeBar } from "./volume-meter";

// 模擬麥克風：每 80ms 推一次音量（0 到 100），不經過 React state
function subscribeMic(cb: (level: number) => void) {
  let level = 20;
  const id = setInterval(() => {
    level = Math.random() < 0.3 ? Math.random() * 80 : level * 0.6;
    cb(level);
  }, 80);
  return () => clearInterval(id);
}

export default function VolumeMeterDemo() {
  const subscribe = useCallback(subscribeMic, []);

  return (
    <div className="w-full max-w-sm rounded-[14px] border border-white/5 bg-[#0F0F0F] px-6 py-4 text-[#e5e5e5]">
      <div className="flex min-w-0 items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-medium text-slate-400">Microphone</span>
          <span className="truncate text-sm">MacBook Pro Microphone</span>
        </div>
        <VolumeBar gain={1} enabled color="#d4d4d4" subscribe={subscribe} label="Microphone level" className="w-24 shrink-0" />
      </div>
    </div>
  );
}
