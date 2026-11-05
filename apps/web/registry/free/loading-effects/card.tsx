"use client";

import { useEffect, useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { Loader, Skeleton } from "./loading-effects";

const copy = {
  en: { loading: "Loading" },
  "zh-TW": { loading: "載入中" },
  "zh-CN": { loading: "加载中" },
  ja: { loading: "読み込み中" },
};

const VALUES = [25, 60, 90];

/** 型錄縮圖：四種最醒目的載入效果 */
export default function LoadingEffectsCard() {
  const t = useDemoText(copy);
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % VALUES.length), 1600);
    return () => clearInterval(id);
  }, []);

  const tile = "grid h-24 place-items-center rounded-lg border border-border bg-card";

  return (
    <div className="grid w-full max-w-sm grid-cols-2 gap-2">
      <div className={tile}>
        <Loader variant="bouncing-dots" size="lg" label={t.loading} />
      </div>
      <div className={tile}>
        <Loader variant="liquid" size="lg" value={VALUES[i]} label={t.loading} />
      </div>
      <div className={tile}>
        <Loader variant="equalizer" size="lg" label={t.loading} />
      </div>
      <div className={`${tile} px-4`}>
        <Skeleton lines={1} label={t.loading} />
      </div>
    </div>
  );
}
