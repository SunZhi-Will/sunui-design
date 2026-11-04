import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

type StoryVars = Record<`--story-${string}`, string>;

const vars = (bg: string, surface: string, text: string, muted: string, line: string, shadow: string): StoryVars => ({
  "--story-bg": bg,
  "--story-surface": surface,
  "--story-text": text,
  "--story-muted": muted,
  "--story-line": line,
  "--story-shadow": shadow,
});

// 原作三個主題（夜／日／宣紙）的表面色、文字色與線色；封面只帶色相，實際顏色從這裡混出來
export const storyThemes = {
  ink: vars("#0e1113", "#1e2327", "#e6e1d5", "#a3a498", "rgba(230, 225, 213, .12)", "0 1px 2px rgba(0, 0, 0, .4)"),
  day: vars("#f7f6f3", "#eeece7", "#1a1c1a", "#565a52", "rgba(26, 28, 26, .14)", "0 1px 2px rgba(26, 28, 26, .07)"),
  rice: vars("#efe9dc", "#e6dfd0", "#231f18", "#5d5648", "rgba(35, 31, 24, .15)", "0 1px 2px rgba(35, 31, 24, .07)"),
  moon: vars("#0b0f16", "#1a2130", "#e4e8ef", "#9aa6b8", "rgba(220, 228, 240, .12)", "0 1px 2px rgba(0, 0, 0, .4)"),
};

export type StoryTheme = keyof typeof storyThemes | StoryVars;

export const themeStyle = (theme: StoryTheme) =>
  (typeof theme === "string" ? storyThemes[theme] : theme) as CSSProperties;

const PROSE = '"Noto Serif TC", "Source Han Serif TC", "Songti TC", serif';

/* -------------------------------------------------------------- 種子 */

/** FNV-1a 32 bit，同一字串永遠得到同一個無號整數 */
export function glyphSeed(id: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/* -------------------------------------------------------------- 角色字符 */

export type GlyphShape = "seal" | "circle" | "square" | "hex" | "none";
export type CharacterTier = "major" | "supporting" | "minor";

export interface GlyphPack {
  shape: GlyphShape;
  /** 飽和度與明度範圍（0 到 1），可帶一個暖色點 */
  hueRange: { saturation: [number, number]; lightness: [number, number]; warmAccentHue?: number };
}

/** 原作六個風格包的頭像形狀與色域 */
export const glyphPacks = {
  inkWuxia: { shape: "seal", hueRange: { saturation: [0.15, 0.35], lightness: [0.35, 0.6], warmAccentHue: 38 } },
  urbanNoir: { shape: "circle", hueRange: { saturation: [0.3, 0.5], lightness: [0.3, 0.55], warmAccentHue: 28 } },
  campusLight: { shape: "square", hueRange: { saturation: [0.4, 0.6], lightness: [0.55, 0.75], warmAccentHue: 32 } },
  courtGilt: { shape: "hex", hueRange: { saturation: [0.45, 0.65], lightness: [0.25, 0.45], warmAccentHue: 42 } },
  fantasyMist: { shape: "circle", hueRange: { saturation: [0.35, 0.55], lightness: [0.4, 0.6], warmAccentHue: 300 } },
  plainPaper: { shape: "none", hueRange: { saturation: [0, 0.08], lightness: [0.4, 0.6] } },
} satisfies Record<string, GlyphPack>;

export interface GlyphSpec {
  char: string;
  color: string;
  shape: GlyphShape;
  tier: CharacterTier;
}

/** 約七分之一的角色落在風格包的暖色點附近，其餘直接取雜湊色相 */
export function characterHue(id: string, pack: GlyphPack): number {
  const seed = glyphSeed(id);
  const warm = pack.hueRange.warmAccentHue;
  if (warm !== undefined && seed % 7 === 0) return (warm + ((seed >>> 4) % 21) - 10 + 360) % 360;
  return seed % 360;
}

/** 取名字首字；首字已被同作品角色用掉時改取第二字 */
export function glyphChar(displayName: string, taken?: Set<string>): string {
  const chars = Array.from((displayName ?? "").trim());
  if (chars.length === 0) return "？";
  if (!taken || !taken.has(chars[0])) return chars[0];
  if (chars[1] && !taken.has(chars[1])) return chars[1];
  return chars[0];
}

export function glyphSpec(
  character: { id: string; displayName: string; tier?: CharacterTier },
  pack: GlyphPack,
  taken?: Set<string>,
): GlyphSpec {
  const seed = glyphSeed(character.id);
  const [sMin, sMax] = pack.hueRange.saturation;
  const [lMin, lMax] = pack.hueRange.lightness;
  const s = Math.round((sMin + (((seed >>> 8) & 0xff) / 0xff) * (sMax - sMin)) * 100);
  const l = Math.round((lMin + (((seed >>> 16) & 0xff) / 0xff) * (lMax - lMin)) * 100);
  return {
    char: glyphChar(character.displayName, taken),
    color: `hsl(${characterHue(character.id, pack)} ${s}% ${l}%)`,
    shape: pack.shape,
    tier: character.tier ?? "supporting",
  };
}

/** 依序分配，排在前面的角色優先拿到首字 */
export function assignGlyphs(characters: ReadonlyArray<{ id: string; displayName: string; tier?: CharacterTier }>, pack: GlyphPack) {
  const taken = new Set<string>();
  const result = new Map<string, GlyphSpec>();
  for (const character of characters) {
    const spec = glyphSpec(character, pack, taken);
    taken.add(spec.char);
    result.set(character.id, spec);
  }
  return result;
}

function hexPoints(): string {
  const r = 42;
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

export interface CharacterGlyphProps {
  spec: GlyphSpec;
  size?: 24 | 48 | 96 | 160;
  /** 給輔助技術的說明，通常是角色名字；不給就是純裝飾 */
  title?: string;
  theme?: StoryTheme;
  className?: string;
}

export function CharacterGlyph({ spec, size = 48, title, theme, className }: CharacterGlyphProps) {
  // minor 角色不帶專屬色，統一用次要文字色
  const tint = spec.tier === "minor" ? "var(--story-muted, #a3a498)" : spec.color;
  const shapeStyle = {
    fill: "var(--u-glyph-ground)",
    stroke: "var(--u-glyph-line)",
    strokeWidth: 3,
  };
  const style = {
    ...(theme ? themeStyle(theme) : undefined),
    "--u-glyph-tint": tint,
    "--u-glyph-ground": "color-mix(in oklab, var(--story-surface, #1e2327) 88%, var(--u-glyph-tint))",
    "--u-glyph-ink": "color-mix(in oklab, var(--story-text, #e6e1d5) 78%, var(--u-glyph-tint))",
    "--u-glyph-line": "color-mix(in oklab, var(--u-glyph-tint) 58%, transparent)",
    width: size,
    height: size,
  } as CSSProperties;

  return (
    <div className={cn("inline-flex flex-none items-center justify-center rounded-[8px]", className)} style={style}>
      <svg
        viewBox="0 0 100 100"
        className="block size-full"
        role={title ? "img" : undefined}
        aria-label={title}
        aria-hidden={title ? undefined : true}
        focusable="false"
      >
        {spec.shape === "seal" && <rect x="8" y="8" width="84" height="84" style={shapeStyle} />}
        {spec.shape === "circle" && <circle cx="50" cy="50" r="42" style={shapeStyle} />}
        {spec.shape === "square" && <rect x="8" y="8" width="84" height="84" rx="18" style={shapeStyle} />}
        {spec.shape === "hex" && <polygon points={hexPoints()} style={shapeStyle} />}
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          style={{ fill: "var(--u-glyph-ink)", fontFamily: PROSE, fontWeight: 600, fontSize: 46 }}
        >
          {spec.char}
        </text>
      </svg>
    </div>
  );
}
