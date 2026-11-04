"use client";

import type { CSSProperties } from "react";

import { CharacterGlyph, assignGlyphs, glyphPacks, storyThemes } from "./character-glyph";

const characters = [
  { id: "shen-heng", displayName: "沈衡", tier: "major" },
  { id: "shen-yao", displayName: "沈瑤", tier: "major" },
  { id: "lu-qiu", displayName: "陸秋", tier: "supporting" },
  { id: "ferryman", displayName: "老船夫", tier: "minor" },
] as const;

// 排在前面的角色優先拿到首字，沈瑤因此改用「瑤」
const cast = assignGlyphs(characters, glyphPacks.inkWuxia);

export default function CharacterGlyphDemo() {
  return (
    <ul
      aria-label="《渡口守夜》登場人物"
      className="flex w-full max-w-xl flex-wrap gap-4 rounded-[8px] border p-4 sm:p-5"
      style={{
        ...(storyThemes.ink as CSSProperties),
        background: "var(--story-bg)",
        color: "var(--story-text)",
        borderColor: "var(--story-line)",
      }}
    >
      {characters.map((c) => (
        <li key={c.id} className="flex min-w-0 items-center gap-2">
          <CharacterGlyph spec={cast.get(c.id)!} size={48} />
          <span className="font-serif text-sm">{c.displayName}</span>
        </li>
      ))}
    </ul>
  );
}
