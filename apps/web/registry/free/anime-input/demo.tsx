"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { AnimeInput } from "./anime-input";

const copy = {
  en: { label: "Player name", hint: "3 to 12 characters, shown on the leaderboard.", short: "Use at least 3 characters.", placeholder: "e.g. Nightfox" },
  "zh-TW": { label: "玩家名稱", hint: "3 到 12 個字，會顯示在排行榜上。", short: "至少要 3 個字。", placeholder: "例如：夜狐" },
  "zh-CN": { label: "玩家名称", hint: "3 到 12 个字，会显示在排行榜上。", short: "至少要 3 个字。", placeholder: "例如：夜狐" },
  ja: { label: "プレイヤー名", hint: "3〜12 文字。ランキングに表示されます。", short: "3 文字以上で入力してください。", placeholder: "例：ナイトフォックス" },
};

export default function AnimeInputDemo() {
  const t = useDemoText(copy);
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  return (
    <div className="w-full max-w-xs px-2 py-16">
      <AnimeInput label={t.label} value={name} maxLength={12} placeholder={t.placeholder} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} hint={t.hint} error={touched && name.length > 0 && [...name].length < 3 ? t.short : undefined} />
    </div>
  );
}
