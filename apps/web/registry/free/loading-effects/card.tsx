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

/** Catalog thumbnail: the four most eye-catching loading effects */
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
        <Loader variant="bouncing-dots" size="lg" palette="sunset" label={t.loading} />
      </div>
      <div className={tile}>
        <Loader variant="liquid" size="lg" palette="lagoon" value={VALUES[i]} label={t.loading} />
      </div>
      <div className={tile}>
        <Loader variant="equalizer" size="lg" palette="aurora" label={t.loading} />
      </div>
      <div className={`${tile} px-4`}>
        <Skeleton lines={1} label={t.loading} />
      </div>
    </div>
  );
}
