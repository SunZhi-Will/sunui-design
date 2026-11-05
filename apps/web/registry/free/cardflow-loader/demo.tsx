"use client";

import { useEffect, useState } from "react";

import { useDemoLocale } from "@/lib/demo-locale";

import { CardFlowLoader } from "./cardflow-loader";

export default function CardFlowLoaderDemo() {
  const locale = useDemoLocale();
  const [run, setRun] = useState(0);
  const [done, setDone] = useState(false);

  // 載入完成後停在 100% 一下，再重新播放
  useEffect(() => {
    if (!done) return;
    const id = window.setTimeout(() => {
      setDone(false);
      setRun((r) => r + 1);
    }, 2000);
    return () => clearTimeout(id);
  }, [done]);

  return (
    <div className="relative h-[420px] w-full min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white">
      <CardFlowLoader key={run} locale={locale} hideOnComplete={false} messageInterval={2500} onComplete={() => setDone(true)} />
    </div>
  );
}
