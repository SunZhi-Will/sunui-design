"use client";

import { useState } from "react";

import {
  FlipProfileCard,
  LightEffectPicker,
  ThemePicker,
  cardThemes,
  type CardTheme,
  type CardThemeKey,
  type LightEffect,
  type ProfileCardData,
} from "./flip-profile-card";

const profile: ProfileCardData = {
  name: "Mia Chen",
  title: "Product Designer",
  email: "mia.chen@example.com",
  phone: "+886 912 345 678",
  location: "Taipei, Taiwan",
  bio: "I design calm, tactile interfaces and the systems behind them. Currently shaping a card-based canvas for small teams.",
  skills: ["Figma", "Design systems", "Prototyping", "React", "Motion"],
  socialLinks: {
    github: "https://github.com",
    linkedin: "https://www.linkedin.com",
    website: "https://example.com",
  },
};

export default function FlipProfileCardDemo() {
  const [themeKey, setThemeKey] = useState<CardThemeKey>("classic");
  const [theme, setTheme] = useState<CardTheme>(cardThemes.classic);
  const [effect, setEffect] = useState<LightEffect>("dynamic");

  return (
    // 同 CardFlow 首頁：白底加三顆模糊光斑
    <div className="relative w-full max-w-4xl overflow-hidden rounded-xl bg-white p-4 sm:p-8">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-300/10 blur-3xl" />
      </div>

      <div className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="flex min-w-0 justify-center py-4">
          <FlipProfileCard data={profile} theme={theme} lightEffect={effect} />
        </div>

        <div className="max-h-[36rem] min-w-0 space-y-6 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 shadow-lg sm:p-6">
          <ThemePicker
            value={themeKey}
            onValueChange={(key, next) => {
              setThemeKey(key);
              setTheme(next);
            }}
          />
          <LightEffectPicker value={effect} onValueChange={setEffect} />
        </div>
      </div>
    </div>
  );
}
