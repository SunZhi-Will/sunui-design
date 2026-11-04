"use client";

import { useState, type CSSProperties } from "react";

import { CharacterGlyph, SeededCover, assignGlyphs, glyphPacks, storyThemes } from "./seeded-cover";

type Work = { id: string; title: string; author: string; minutes: number };

const works: Work[] = [
  { id: "ferry-night-watch", title: "渡口守夜：燈下之約", author: "沈青禾", minutes: 40 },
  { id: "rain-lane-courier", title: "雨巷信差", author: "林照", minutes: 25 },
  { id: "the-lantern-hour", title: "The Lantern Hour", author: "Ada Wren", minutes: 30 },
  { id: "mist-city", title: "霧城", author: "陸遠", minutes: 55 },
  { id: "northern-letters", title: "北境書簡", author: "許南枝", minutes: 35 },
  { id: "tide-almanac", title: "潮汐曆：第一卷", author: "周未", minutes: 20 },
];

const cast = assignGlyphs(
  [
    { id: "shen-heng", displayName: "沈衡", tier: "major" },
    { id: "shen-yao", displayName: "沈瑤", tier: "major" },
    { id: "lu-qiu", displayName: "陸秋", tier: "supporting" },
    { id: "ferryman", displayName: "老船夫", tier: "minor" },
  ],
  glyphPacks.inkWuxia,
);
const castNames: Record<string, string> = { "shen-heng": "沈衡", "shen-yao": "沈瑤", "lu-qiu": "陸秋", ferryman: "老船夫" };

const themes = [
  { key: "ink", label: "夜" },
  { key: "day", label: "日" },
  { key: "rice", label: "宣紙" },
] as const;

export default function SeededCoverDemo() {
  const [theme, setTheme] = useState<(typeof themes)[number]["key"]>("ink");

  return (
    // 外層設定 --story-* 後，封面與字符都會跟著主題混色
    <section
      aria-labelledby="browse-heading"
      className="w-full max-w-3xl rounded-[8px] border p-4 sm:p-6"
      style={{
        ...(storyThemes[theme] as CSSProperties),
        background: "var(--story-bg)",
        color: "var(--story-text)",
        borderColor: "var(--story-line)",
      }}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id="browse-heading" className="font-serif text-xl font-semibold tracking-[0.08em]">
            書架
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--story-muted)" }}>
            沒有美術的作品也有自己的封面。
          </p>
        </div>
        <div role="radiogroup" aria-label="閱讀主題" className="flex shrink-0 rounded-[4px] border p-0.5" style={{ borderColor: "var(--story-line)" }}>
          {themes.map((t) => (
            <button
              key={t.key}
              type="button"
              role="radio"
              aria-checked={theme === t.key}
              onClick={() => setTheme(t.key)}
              className="rounded-[3px] px-3 py-1 text-xs transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none motion-reduce:transition-none"
              style={theme === t.key ? { background: "var(--story-surface)", color: "var(--story-text)" } : { color: "var(--story-muted)" }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
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

      <div className="mt-6 border-t pt-4" style={{ borderColor: "var(--story-line)" }}>
        <h3 className="text-xs tracking-[0.18em]" style={{ color: "var(--story-muted)" }}>
          《渡口守夜》登場人物
        </h3>
        <ul className="mt-3 flex flex-wrap gap-4">
          {[...cast.entries()].map(([id, spec]) => (
            <li key={id} className="flex items-center gap-2">
              <CharacterGlyph spec={spec} size={48} />
              <span className="font-serif text-sm">{castNames[id]}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
