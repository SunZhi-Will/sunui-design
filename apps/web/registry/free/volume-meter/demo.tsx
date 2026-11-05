"use client";

import { useCallback } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

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

const copy = {
  en: { title: "Microphone", device: "MacBook Pro Microphone", level: "Microphone level" },
  "zh-TW": { title: "麥克風", device: "MacBook Pro 麥克風", level: "麥克風音量" },
  "zh-CN": { title: "麦克风", device: "MacBook Pro 麦克风", level: "麦克风音量" },
  ja: { title: "マイク", device: "MacBook Pro のマイク", level: "マイクの入力レベル" },
};

export default function VolumeMeterDemo() {
  const subscribe = useCallback(subscribeMic, []);
  const locale = useDemoLocale();
  const t = useDemoText(copy);

  return (
    <div className="w-full max-w-sm rounded-[14px] border border-white/5 bg-[#0F0F0F] px-6 py-4 text-[#e5e5e5]">
      <div className="flex min-w-0 items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-medium text-slate-400">{t.title}</span>
          <span className="truncate text-sm">{t.device}</span>
        </div>
        <VolumeBar gain={1} enabled color="#d4d4d4" subscribe={subscribe} locale={locale} label={t.level} className="w-24 shrink-0" />
      </div>
    </div>
  );
}
