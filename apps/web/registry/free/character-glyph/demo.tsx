"use client";

import type { CSSProperties } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { CharacterGlyph, assignGlyphs, glyphPacks, storyThemes, type CharacterTier } from "./character-glyph";

type Cast = { story: string; characters: { id: string; displayName: string; tier: CharacterTier; shown?: string }[] };

// 字符一律取漢字名；英文版另外顯示拼音名字
const copy: Record<"en" | "zh-TW" | "zh-CN" | "ja", Cast> = {
  en: {
    story: "Cast of The Ferry Night Watch",
    characters: [
      { id: "shen-heng", displayName: "沈衡", shown: "Shen Heng", tier: "major" },
      { id: "shen-yao", displayName: "沈瑤", shown: "Shen Yao", tier: "major" },
      { id: "lu-qiu", displayName: "陸秋", shown: "Lu Qiu", tier: "supporting" },
      { id: "ferryman", displayName: "老船夫", shown: "Old ferryman", tier: "minor" },
    ],
  },
  "zh-TW": {
    story: "《渡口守夜》登場人物",
    characters: [
      { id: "shen-heng", displayName: "沈衡", tier: "major" },
      { id: "shen-yao", displayName: "沈瑤", tier: "major" },
      { id: "lu-qiu", displayName: "陸秋", tier: "supporting" },
      { id: "ferryman", displayName: "老船夫", tier: "minor" },
    ],
  },
  "zh-CN": {
    story: "《渡口守夜》登场人物",
    characters: [
      { id: "shen-heng", displayName: "沈衡", tier: "major" },
      { id: "shen-yao", displayName: "沈瑶", tier: "major" },
      { id: "lu-qiu", displayName: "陆秋", tier: "supporting" },
      { id: "ferryman", displayName: "老船夫", tier: "minor" },
    ],
  },
  ja: {
    story: "『渡し場の夜番』登場人物",
    characters: [
      { id: "shen-heng", displayName: "沈衡", tier: "major" },
      { id: "shen-yao", displayName: "沈瑤", tier: "major" },
      { id: "lu-qiu", displayName: "陸秋", tier: "supporting" },
      { id: "ferryman", displayName: "老船頭", tier: "minor" },
    ],
  },
};

export default function CharacterGlyphDemo() {
  const t = useDemoText(copy);
  // 排在前面的角色優先拿到首字，沈瑤因此改用「瑤」
  const cast = assignGlyphs(t.characters, glyphPacks.inkWuxia);

  return (
    <ul
      aria-label={t.story}
      className="flex w-full max-w-xl flex-wrap gap-4 rounded-[8px] border p-4 sm:p-5"
      style={{
        ...(storyThemes.ink as CSSProperties),
        background: "var(--story-bg)",
        color: "var(--story-text)",
        borderColor: "var(--story-line)",
      }}
    >
      {t.characters.map((c) => (
        <li key={c.id} className="flex min-w-0 items-center gap-2">
          <CharacterGlyph spec={cast.get(c.id)!} size={48} />
          <span className="font-serif text-sm">{c.shown ?? c.displayName}</span>
        </li>
      ))}
    </ul>
  );
}
