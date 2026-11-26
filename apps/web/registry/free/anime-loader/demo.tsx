"use client";

import { useDemoText } from "@/lib/demo-locale";

import { AnimeLoader } from "./anime-loader";

const copy = {
  en: { label: "Matching you with players" },
  "zh-TW": { label: "正在為你配對玩家" },
  "zh-CN": { label: "正在为你匹配玩家" },
  ja: { label: "対戦相手を探しています" },
};

export default function AnimeLoaderDemo() {
  const t = useDemoText(copy);
  return (
    <div className="w-full max-w-xs px-2 py-16">
      <AnimeLoader label={t.label} />
    </div>
  );
}
