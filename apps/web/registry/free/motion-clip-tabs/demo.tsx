"use client";

import { MotionClipTabs, type MotionClip } from "./motion-clip-tabs";

// 以 CSS 畫面代替實機錄影：山影、燈火與雨夜的色調，與原作的墨色和燈火色一致
function Poster({ sky, light, hills }: { sky: string; light: string; hills: string }) {
  return (
    <div
      className="h-full w-full"
      style={{
        background: [
          `radial-gradient(circle at 30% 64%, ${light} 0 1.2%, transparent 1.6%)`,
          `radial-gradient(ellipse 30% 22% at 30% 64%, ${light}55, transparent 70%)`,
          `linear-gradient(160deg, transparent 58%, ${hills} 58.5%)`,
          `linear-gradient(200deg, transparent 50%, ${hills}cc 50.5%)`,
          `linear-gradient(180deg, ${sky}, #070a10)`,
        ].join(", "),
      }}
    />
  );
}

const clips: MotionClip[] = [
  {
    id: "explore",
    no: "壹",
    title: "雨夜入山",
    en: "Explore",
    caption: "山腳客棧重逢故人，再踏入雨中的棲雲門前庭。場景裡的每樣舊物，都可能藏著線索。",
    fallback: <Poster sky="#1a2433" light="#edc186" hills="#0c1119" />,
  },
  {
    id: "deduce",
    no: "貳",
    title: "山河錄推論",
    en: "Deduce",
    caption: "翻開山河錄，在地圖與案卷之間往返，把零散的線索排成你願意相信的結論。",
    fallback: <Poster sky="#2a2219" light="#d9a05b" hills="#15110c" />,
  },
  {
    id: "fate",
    no: "參",
    title: "命運骰",
    en: "Fate Dice",
    caption: "關鍵時刻交給命運骰裁決：逆、變、成、奇。事前準備得越充分，勝面就越大。",
    fallback: <Poster sky="#241a22" light="#d9624f" hills="#100b0f" />,
  },
];

export default function MotionClipTabsDemo() {
  return (
    <section className="w-full max-w-5xl min-w-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_60%,rgba(217,160,91,0.06),transparent_70%),#070a10] px-3 py-6 sm:px-8">
      <MotionClipTabs clips={clips} />
    </section>
  );
}
