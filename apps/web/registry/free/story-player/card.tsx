"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { recapPalette } from "./recap-slides";
import { StoryPlayer, storyIcons } from "./story-player";

const copy = {
  en: { year: "Your year on Threads", month: "posts in October", days: "day streak", rank: "top creators", region: "Your 2026 recap", replay: "Watch again" },
  "zh-TW": { year: "你在 Threads 的一年", month: "則貼文在十月", days: "天連續發文", rank: "頂尖創作者", region: "你的 2026 回顧", replay: "再看一次" },
  "zh-CN": { year: "你在 Threads 的一年", month: "条动态在十月", days: "天连续发帖", rank: "顶尖创作者", region: "你的 2026 年度回顾", replay: "再看一遍" },
  ja: { year: "Threads での1年", month: "件の投稿（10月）", days: "日連続投稿", rank: "上位クリエイター", region: "あなたの2026年まとめ", replay: "もう一度見る" },
};

// 縮小版的回顧投影片：同一套暗色色票，大號襯線數字加一道強調色短線
function Slide({ value, label }: { value: string; label: string }) {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-1.5 p-2 text-center"
      style={{ background: recapPalette.base, color: recapPalette.text }}
    >
      <span className="font-serif text-3xl leading-none tabular-nums lining-nums">{value}</span>
      <span aria-hidden className="h-px w-5" style={{ background: recapPalette.accent }} />
      <span className="text-[10px] leading-tight" style={{ color: recapPalette.muted }}>
        {label}
      </span>
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
    <Slide key="month" value="38" label={t.month} />,
    <Slide key="streak" value="21" label={t.days} />,
    <Slide key="rank" value="3.4%" label={t.rank} />,
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
