"use client";

import type { ReactNode } from "react";

import { useDemoLocale, type Locale } from "@/lib/demo-locale";

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

// 依語言的標題與說明；zh-TW 為原作文字
const text: Record<Locale, Record<string, [string, string]>> = {
  "zh-TW": {
    night: ["第一夜", "晚風拂過她的長髮，沉默的月光落在她的側臉上。"],
    feather: ["遺落的殘羽", "他遺落的幾片殘羽飄落，溶入絕望的黑夜之中。"],
    window: ["要再來看看我", ""],
    door: ["敲門的前一刻", "有好幾次她鼓起勇氣，卻又在敲門的前一刻把手縮回。"],
    river: ["渡河", ""],
    thread: ["紅線", ""],
    rain: ["雨停之後", "屋簷還在滴水，她把傘收起來，抬頭看見雲縫裡的星。"],
    end: ["終", ""],
  },
  "zh-CN": {
    night: ["第一夜", "晚风拂过她的长发，沉默的月光落在她的侧脸上。"],
    feather: ["遗落的残羽", "他遗落的几片残羽飘落，融入绝望的黑夜之中。"],
    window: ["要再来看看我", ""],
    door: ["敲门的前一刻", "有好几次她鼓起勇气，却又在敲门的前一刻把手缩回。"],
    river: ["渡河", ""],
    thread: ["红线", ""],
    rain: ["雨停之后", "屋檐还在滴水，她把伞收起来，抬头看见云缝里的星。"],
    end: ["终", ""],
  },
  en: {
    night: ["The First Night", "The night wind stirred her long hair, and the silent moonlight settled on her cheek."],
    feather: ["Fallen Feathers", "A few stray feathers he left behind drifted down and dissolved into the hopeless night."],
    window: ["Come See Me Again", ""],
    door: ["Before the Knock", "Again and again she gathered her courage, only to pull her hand back the moment before she knocked."],
    river: ["The Crossing", ""],
    thread: ["The Red Thread", ""],
    rain: ["After the Rain", "The eaves were still dripping. She folded her umbrella and looked up to see stars through a gap in the clouds."],
    end: ["The End", ""],
  },
  ja: {
    night: ["最初の夜", "夜風が彼女の長い髪を撫で、静かな月明かりがその横顔に落ちる。"],
    feather: ["遺された羽", "彼が遺した幾枚かの羽が舞い落ち、絶望の夜に溶けていく。"],
    window: ["また会いに来て", ""],
    door: ["ノックの直前", "何度も勇気を振り絞っては、ノックする直前に手を引っ込めてしまう。"],
    river: ["川を渡る", ""],
    thread: ["赤い糸", ""],
    rain: ["雨上がり", "軒先からはまだ雫が落ちる。彼女は傘をたたみ、雲の切れ間に星を見上げた。"],
    end: ["終", ""],
  },
};

const scenes: { id: string; art?: ReactNode }[] = [
  { id: "night", art: <Scene sky="#1b2640" glow="#e8eefb" ground="#0b0f18" /> },
  { id: "feather", art: <Scene sky="#241a2e" glow="#e6a4b8" ground="#120c16" /> },
  { id: "window" },
  { id: "door", art: <Scene sky="#2a2118" glow="#f1c98a" ground="#140f0b" /> },
  { id: "river" },
  { id: "thread" },
  { id: "rain", art: <Scene sky="#16222c" glow="#a9c6dd" ground="#0a1016" /> },
  { id: "end" },
];

export default function CgGalleryDemo() {
  const locale = useDemoLocale();
  const entries: CgGalleryEntry[] = scenes.map(({ id, art }) => {
    const [title, description] = (text[locale] ?? text.en)[id];
    return { id, title, description, unlocked: !!art, art };
  });
  return (
    <div className="relative w-full max-w-3xl min-w-0 bg-[radial-gradient(ellipse_at_50%_34%,#18223a_0%,#0a0e18_74%)] p-3 sm:p-6">
      <CgGallery entries={entries} locale={locale} fixed={false} className="min-h-[16rem]" />
    </div>
  );
}
