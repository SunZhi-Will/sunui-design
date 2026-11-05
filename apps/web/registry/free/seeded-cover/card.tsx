"use client";

import { useState, type CSSProperties } from "react";

import { SeededCover, storyThemes } from "./seeded-cover";

/** 型錄卡片：輸入書名，封面的色相、紋理與直排字就由書名決定，同名永遠同一張。 */
export default function SeededCoverCard() {
  const [title, setTitle] = useState("渡口守夜：燈下之約");

  return (
    <div
      className="mx-auto flex w-72 items-center gap-4 rounded-[8px] border p-3"
      style={{ ...(storyThemes.ink as CSSProperties), background: "var(--story-bg)", color: "var(--story-text)", borderColor: "var(--story-line)" }}
    >
      <SeededCover seed={title} title={title} className="w-[120px]" />
      <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-xs" style={{ color: "var(--story-muted)" }}>
        書名
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-[6px] border bg-transparent px-2 py-1.5 font-serif text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ borderColor: "var(--story-line)", color: "var(--story-text)" }}
        />
      </label>
    </div>
  );
}
