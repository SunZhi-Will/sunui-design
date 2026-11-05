"use client";

import type { CSSProperties } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { SeededCover, storyThemes } from "./seeded-cover";

const ids = ["ferry-night-watch", "rain-lane-courier", "the-lantern-hour", "mist-city"];
const minutes = [40, 25, 30, 55];

const copy = {
  en: {
    shelf: "Bookshelf",
    minutes: (n: number) => `${n} min`,
    works: [
      { title: "Ferry Night Watch: A Promise by Lamplight", author: "Shen Qinghe" },
      { title: "The Rain Lane Courier", author: "Lin Zhao" },
      { title: "The Lantern Hour", author: "Ada Wren" },
      { title: "Mist City", author: "Lu Yuan" },
    ],
  },
  "zh-TW": {
    shelf: "書架",
    minutes: (n: number) => `${n} 分鐘`,
    works: [
      { title: "渡口守夜：燈下之約", author: "沈青禾" },
      { title: "雨巷信差", author: "林照" },
      { title: "The Lantern Hour", author: "Ada Wren" },
      { title: "霧城", author: "陸遠" },
    ],
  },
  "zh-CN": {
    shelf: "书架",
    minutes: (n: number) => `${n} 分钟`,
    works: [
      { title: "渡口守夜：灯下之约", author: "沈青禾" },
      { title: "雨巷信差", author: "林照" },
      { title: "The Lantern Hour", author: "Ada Wren" },
      { title: "雾城", author: "陆远" },
    ],
  },
  ja: {
    shelf: "本棚",
    minutes: (n: number) => `${n}分`,
    works: [
      { title: "渡し場の夜番：灯の下の約束", author: "沈青禾" },
      { title: "雨の路地の配達人", author: "林照" },
      { title: "The Lantern Hour", author: "Ada Wren" },
      { title: "霧の街", author: "陸遠" },
    ],
  },
};

export default function SeededCoverDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    // 外層設定 --story-* 後，封面跟著主題混色
    <ul
      aria-label={t.shelf}
      className="grid w-full max-w-2xl grid-cols-2 gap-x-4 gap-y-5 rounded-[8px] border p-4 sm:grid-cols-4 sm:p-6"
      style={{
        ...(storyThemes.ink as CSSProperties),
        background: "var(--story-bg)",
        color: "var(--story-text)",
        borderColor: "var(--story-line)",
      }}
    >
      {t.works.map((w, i) => (
        <li key={ids[i]} className="flex min-w-0 flex-col gap-2">
          <SeededCover seed={ids[i]} title={w.title} size="fill" locale={locale} />
          <div className="min-w-0">
            <p className="truncate font-serif text-sm font-semibold">{w.title}</p>
            <p className="flex justify-between gap-2 text-xs" style={{ color: "var(--story-muted)" }}>
              <span className="truncate">{w.author}</span>
              <span className="shrink-0 tabular-nums">{t.minutes(minutes[i])}</span>
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
