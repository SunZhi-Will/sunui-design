"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { StoryPlayer, storyIcons } from "./story-player";

const copy = {
  en: { year: "Your year on Threads", views: "total views", days: "days in a row", region: "Your 2026 recap", replay: "Watch again" },
  "zh-TW": { year: "你在 Threads 的一年", views: "總瀏覽次數", days: "天連續發文", region: "你的 2026 回顧", replay: "再看一次" },
  "zh-CN": { year: "你在 Threads 的一年", views: "总浏览量", days: "天连续发帖", region: "你的 2026 年度回顾", replay: "再看一遍" },
  ja: { year: "Threads での1年", views: "総閲覧数", days: "日連続", region: "あなたの2026年まとめ", replay: "もう一度見る" },
};

function Slide({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center">
      <span className="text-3xl font-semibold text-white tabular-nums">{value}</span>
      <span className="text-[11px] text-white/80">{label}</span>
    </div>
  );
}

/** 型錄卡片：限時動態播放器，點卡片右側或左側換頁，長按暫停。 */
export default function StoryPlayerCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [index, setIndex] = useState(0);
  const slides = [
    <Slide key="hi" value="2026" label={t.year} />,
    <Slide key="views" value="48.2K" label={t.views} />,
    <Slide key="streak" value="21" label={t.days} />,
  ];

  return (
    <div className="mx-auto w-72">
      <StoryPlayer
        slides={slides}
        index={index}
        onIndexChange={setIndex}
        duration={2500}
        cardWidth={112}
        className="rounded-xl"
        locale={locale}
        labels={{ region: t.region }}
        actions={[{ key: "replay", label: t.replay, icon: storyIcons.replay, onClick: () => setIndex(0) }]}
      />
    </div>
  );
}
