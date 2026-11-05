"use client";

import { CgGallery, type CgGalleryEntry } from "./cg-gallery";

// 以 CSS 漸層代替 CG：夜色、月光、窗景，與原作的冷色調一致
function Scene({ sky, glow, ground }: { sky: string; glow: string; ground: string }) {
  return (
    <div
      className="h-full w-full"
      style={{
        background: `radial-gradient(circle at 72% 28%, ${glow} 0 6%, transparent 7%), radial-gradient(ellipse 80% 60% at 72% 28%, ${glow}33, transparent 70%), linear-gradient(180deg, transparent 62%, ${ground} 62%), linear-gradient(180deg, ${sky}, #05070c)`,
      }}
    />
  );
}

const entries: CgGalleryEntry[] = [
  {
    id: "night",
    title: "第一夜",
    description: "晚風拂過她的長髮，沉默的月光落在她的側臉上。",
    unlocked: true,
    art: <Scene sky="#1b2640" glow="#e8eefb" ground="#0b0f18" />,
  },
  {
    id: "feather",
    title: "遺落的殘羽",
    description: "他遺落的幾片殘羽飄落，溶入絕望的黑夜之中。",
    unlocked: true,
    art: <Scene sky="#241a2e" glow="#e6a4b8" ground="#120c16" />,
  },
  { id: "window", title: "要再來看看我", description: "", unlocked: false },
  {
    id: "door",
    title: "敲門的前一刻",
    description: "有好幾次她鼓起勇氣，卻又在敲門的前一刻把手縮回。",
    unlocked: true,
    art: <Scene sky="#2a2118" glow="#f1c98a" ground="#140f0b" />,
  },
  { id: "river", title: "渡河", description: "", unlocked: false },
  { id: "thread", title: "紅線", description: "", unlocked: false },
  {
    id: "rain",
    title: "雨停之後",
    description: "屋簷還在滴水，她把傘收起來，抬頭看見雲縫裡的星。",
    unlocked: true,
    art: <Scene sky="#16222c" glow="#a9c6dd" ground="#0a1016" />,
  },
  { id: "end", title: "終", description: "", unlocked: false },
];

export default function CgGalleryDemo() {
  return (
    <div className="relative w-full max-w-3xl min-w-0 bg-[radial-gradient(ellipse_at_50%_34%,#18223a_0%,#0a0e18_74%)] p-3 sm:p-6">
      <CgGallery entries={entries} fixed={false} className="min-h-[16rem]" />
    </div>
  );
}
