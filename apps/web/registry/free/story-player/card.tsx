"use client";

import { useState } from "react";

import { StoryPlayer, storyIcons } from "./story-player";

function Slide({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center">
      <span className="text-3xl font-bold text-white tabular-nums">{value}</span>
      <span className="text-[11px] text-white/80">{label}</span>
    </div>
  );
}

/** 型錄卡片：限時動態播放器，點卡片右側或左側換頁，長按暫停。 */
export default function StoryPlayerCard() {
  const [index, setIndex] = useState(0);
  const slides = [
    <Slide key="hi" value="2026" label="Your year on Threads" />,
    <Slide key="views" value="48.2K" label="total views" />,
    <Slide key="streak" value="21" label="days in a row" />,
  ];

  return (
    <div className="mx-auto w-72">
      <StoryPlayer
        slides={slides}
        index={index}
        onIndexChange={setIndex}
        duration={2500}
        cardWidth={112}
        className="rounded-2xl"
        labels={{ region: "Your 2026 recap" }}
        actions={[{ key: "replay", label: "Watch again", icon: storyIcons.replay, onClick: () => setIndex(0) }]}
      />
    </div>
  );
}
