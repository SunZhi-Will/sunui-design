"use client";

import { useDemoText } from "@/lib/demo-locale";

import { AnimeSlider } from "./anime-slider";

const copy = {
  en: { title: "Audio", music: "Music", voice: "Voices" },
  "zh-TW": { title: "音效", music: "背景音樂", voice: "角色語音" },
  "zh-CN": { title: "音效", music: "背景音乐", voice: "角色语音" },
  ja: { title: "サウンド", music: "BGM", voice: "ボイス" },
};

export default function AnimeSliderDemo() {
  const t = useDemoText(copy);
  return (
    <div className="w-full max-w-xs px-2 py-14">
      <h2 className="mb-6 text-lg font-semibold tracking-tight">{t.title}</h2>
      <div className="flex flex-col gap-7">
        <AnimeSlider label={t.music} name="music" defaultValue={60} format={(v) => `${v}%`} />
        <AnimeSlider label={t.voice} name="voice" defaultValue={80} format={(v) => `${v}%`} />
      </div>
    </div>
  );
}
