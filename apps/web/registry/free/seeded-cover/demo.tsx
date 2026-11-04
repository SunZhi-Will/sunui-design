"use client";

import type { CSSProperties } from "react";

import { SeededCover, storyThemes } from "./seeded-cover";

const works = [
  { id: "ferry-night-watch", title: "渡口守夜：燈下之約", author: "沈青禾", minutes: 40 },
  { id: "rain-lane-courier", title: "雨巷信差", author: "林照", minutes: 25 },
  { id: "the-lantern-hour", title: "The Lantern Hour", author: "Ada Wren", minutes: 30 },
  { id: "mist-city", title: "霧城", author: "陸遠", minutes: 55 },
];

export default function SeededCoverDemo() {
  return (
    // 外層設定 --story-* 後，封面跟著主題混色
    <ul
      aria-label="書架"
      className="grid w-full max-w-2xl grid-cols-2 gap-x-4 gap-y-5 rounded-[8px] border p-4 sm:grid-cols-4 sm:p-6"
      style={{
        ...(storyThemes.ink as CSSProperties),
        background: "var(--story-bg)",
        color: "var(--story-text)",
        borderColor: "var(--story-line)",
      }}
    >
      {works.map((w) => (
        <li key={w.id} className="flex min-w-0 flex-col gap-2">
          <SeededCover seed={w.id} title={w.title} size="fill" />
          <div className="min-w-0">
            <p className="truncate font-serif text-sm font-semibold">{w.title}</p>
            <p className="flex justify-between gap-2 text-xs" style={{ color: "var(--story-muted)" }}>
              <span className="truncate">{w.author}</span>
              <span className="shrink-0 tabular-nums">{w.minutes} 分鐘</span>
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
