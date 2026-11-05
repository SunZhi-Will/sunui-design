"use client";

import { useEffect, useState } from "react";

import { useDemoLocale } from "@/lib/demo-locale";

import { UpdateBanner, type UpdaterEvent } from "./update-banner";

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default function UpdateBannerDemo() {
  const [event, setEvent] = useState<UpdaterEvent>({ type: "idle" });
  const locale = useDemoLocale();

  // updater 啟動後發現新版本
  useEffect(() => {
    const id = setTimeout(() => setEvent({ type: "available", version: "2.4.0" }), 900);
    return () => clearTimeout(id);
  }, []);

  // 模擬 updater：下載後持續推 progress，最後 downloaded
  const download = async () => {
    for (let pct = 8; pct <= 100; pct += 12) {
      await wait(350);
      setEvent({ type: "progress", percent: Math.min(100, pct) });
    }
    await wait(300);
    setEvent({ type: "downloaded" });
    return { success: true };
  };

  return (
    <div className="relative h-64 w-full max-w-3xl overflow-hidden rounded-[14px] border border-white/5 bg-[#111111]">
      <UpdateBanner fixed={false} locale={locale} event={event} onDownload={download} onInstall={() => wait(60_000)} />
      <div className="flex h-full min-w-0 flex-col gap-3 p-4 pt-20">
        <div className="h-4 w-40 rounded bg-white/10" />
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="min-w-0 rounded-[14px] bg-[#1c1c1c]" />
          ))}
        </div>
      </div>
    </div>
  );
}
