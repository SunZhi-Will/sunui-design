"use client";

import { useEffect, useState } from "react";

import { useDemoLocale } from "@/lib/demo-locale";

import { CardFlowLoader } from "./cardflow-loader";

/** 型錄卡片：進度圈跑到 100%，停一下再重播。 */
export default function CardFlowLoaderCard() {
  const locale = useDemoLocale();
  const [run, setRun] = useState(0);
  const [done, setDone] = useState(false);

  // 完成後停兩秒再重新播放
  useEffect(() => {
    if (!done) return;
    const id = window.setTimeout(() => {
      setDone(false);
      setRun((r) => r + 1);
    }, 2000);
    return () => clearTimeout(id);
  }, [done]);

  return (
    <div className="relative mx-auto h-[230px] w-72 overflow-hidden rounded-xl border border-border bg-background">
      <CardFlowLoader key={run} locale={locale} hideOnComplete={false} messageInterval={2500} onComplete={() => setDone(true)} />
    </div>
  );
}
