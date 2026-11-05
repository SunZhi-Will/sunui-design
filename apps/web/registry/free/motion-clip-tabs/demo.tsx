"use client";

import { useMemo } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

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

type ClipText = Pick<MotionClip, "no" | "title" | "en" | "caption">;

const posters = [
  { id: "explore", fallback: <Poster sky="#1a2433" light="#edc186" hills="#0c1119" /> },
  { id: "deduce", fallback: <Poster sky="#2a2219" light="#d9a05b" hills="#15110c" /> },
  { id: "fate", fallback: <Poster sky="#241a22" light="#d9624f" hills="#100b0f" /> },
];

const text: { en: ClipText[]; "zh-TW": ClipText[]; "zh-CN": ClipText[]; ja: ClipText[] } = {
  en: [
    {
      no: "1",
      title: "Into the Rain",
      en: "Explore",
      caption: "Meet an old friend again at the inn below the mountain, then step into the rain-soaked forecourt of the Qiyun Sect. Every old object in the scene may hide a clue.",
    },
    {
      no: "2",
      title: "Read the Ledger",
      en: "Deduce",
      caption: "Open the Ledger of Mountains and Rivers, move back and forth between the map and the case files, and arrange scattered clues into a conclusion you are willing to believe.",
    },
    {
      no: "3",
      title: "Fate Dice",
      en: "Gamble",
      caption: "At the crucial moment, let the Fate Dice decide: Setback, Shift, Success, Wonder. The better you prepare, the better your odds.",
    },
  ],
  "zh-TW": [
    {
      no: "壹",
      title: "雨夜入山",
      en: "Explore",
      caption: "山腳客棧重逢故人，再踏入雨中的棲雲門前庭。場景裡的每樣舊物，都可能藏著線索。",
    },
    {
      no: "貳",
      title: "山河錄推論",
      en: "Deduce",
      caption: "翻開山河錄，在地圖與案卷之間往返，把零散的線索排成你願意相信的結論。",
    },
    {
      no: "參",
      title: "命運骰",
      en: "Fate Dice",
      caption: "關鍵時刻交給命運骰裁決：逆、變、成、奇。事前準備得越充分，勝面就越大。",
    },
  ],
  "zh-CN": [
    {
      no: "壹",
      title: "雨夜入山",
      en: "Explore",
      caption: "在山脚客栈与故人重逢，再踏入雨中的栖云门前庭。场景里的每样旧物，都可能藏着线索。",
    },
    {
      no: "贰",
      title: "山河录推论",
      en: "Deduce",
      caption: "翻开山河录，在地图与案卷之间来回比对，把零散的线索拼成你愿意相信的结论。",
    },
    {
      no: "叁",
      title: "命运骰",
      en: "Fate Dice",
      caption: "关键时刻交给命运骰裁决：逆、变、成、奇。事前准备得越充分，胜算就越大。",
    },
  ],
  ja: [
    {
      no: "壱",
      title: "雨夜の入山",
      en: "Explore",
      caption: "山麓の宿で旧友と再会し、雨に濡れた棲雲門の前庭へ。場面に残る古い品のひとつひとつに、手がかりが潜んでいるかもしれない。",
    },
    {
      no: "弐",
      title: "山河録で推理",
      en: "Deduce",
      caption: "山河録を開き、地図と調書を行き来しながら、散らばった手がかりを自分が信じられる結論へと並べていく。",
    },
    {
      no: "参",
      title: "運命のダイス",
      en: "Fate Dice",
      caption: "肝心な場面は運命のダイスに委ねる。逆、変、成、奇。事前の備えが万全なほど、勝ち目は大きくなる。",
    },
  ],
};

export default function MotionClipTabsDemo() {
  const locale = useDemoLocale();
  const items = useDemoText(text);
  const clips: MotionClip[] = useMemo(() => posters.map((p, i) => ({ ...p, ...items[i] })), [items]);
  return (
    <section className="w-full max-w-5xl min-w-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_60%,rgba(217,160,91,0.06),transparent_70%),#070a10] px-3 py-6 sm:px-8">
      <MotionClipTabs clips={clips} locale={locale} />
    </section>
  );
}
