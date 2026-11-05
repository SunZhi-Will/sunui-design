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

export type CoverPattern = "lines" | "dots" | "arcs" | "weave";
export const COVER_PATTERNS: readonly CoverPattern[] = ["lines", "dots", "arcs", "weave"];

/** 傳統書封色系：磚紅、赭石、琥珀、麥稈、苔綠、青瓷、碧、霧藍、天青、夜藍、藤紫、絳 */
const HUES: readonly number[] = [8, 24, 38, 52, 96, 152, 176, 196, 214, 246, 268, 328];

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

export interface SeededCoverLabels {
  /** 標題取不到字時直排的字 */
  untitled: string;
}

const MESSAGES: Record<SunLocale, SeededCoverLabels> = {
  en: { untitled: "NT" },
  "zh-TW": { untitled: "無題" },
  "zh-CN": { untitled: "无题" },
  ja: { untitled: "無題" },
};

const FALLBACK_GLYPHS = MESSAGES.en.untitled;
const MAX_GLYPHS = 4;

/** FNV-1a 32 bit，同一字串永遠得到同一個無號整數 */
export function coverSeed(id: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

const isWordChar = (char: string) => /[\p{L}\p{N}]/u.test(char);
const isLatinTitle = (text: string) => /^[A-Za-z0-9]+$/.test(text);

/** 標題轉成直排的 1 到 4 個字：中文取主標前四字，英文取首字母 */
export function pickGlyphs(title: string, fallback = FALLBACK_GLYPHS): string {
  const segments = title
    .split(/[：:｜|／/\\\u2014–\-·・,，。、;；!！?？"'「」『』()（）[\]【】\s]+/u)
    .map((segment) => Array.from(segment).filter(isWordChar).join(""))
    .filter((segment) => segment.length > 0);

  if (segments.length === 0) return fallback;

  const latinWords = segments.filter(isLatinTitle);
  if (latinWords.length === segments.length) {
    if (latinWords.length >= 2) {
      return latinWords
        .slice(0, 3)
        .map((word) => word[0].toUpperCase())
        .join("");
    }
    return latinWords[0].slice(0, 3).toUpperCase();
  }

  const main = segments.find((segment) => Array.from(segment).length >= 2) ?? segments[0];
  return Array.from(main).slice(0, MAX_GLYPHS).join("");
}

/** 低位決定色相、高位決定紋理，兩者不會綁在一起 */
export function coverStyle(seed: string, title: string, fallback = FALLBACK_GLYPHS) {
  const n = coverSeed(seed || title);
  return {
    hue: HUES[n % HUES.length],
    pattern: COVER_PATTERNS[(n >>> 11) % COVER_PATTERNS.length],
    glyphs: pickGlyphs(title, fallback) || fallback,
  };
}

/* -------------------------------------------------------------- 封面 */

const W = 300;
const H = 400;
const GLYPH_SIZE: Record<number, number> = { 1: 130, 2: 104, 3: 84, 4: 66 };
const ARC_CENTER_Y = 470;
const ARC_RADII = [100, 152, 204, 256, 308, 360, 412, 464, 516];

const stroke = { fill: "none", stroke: "var(--u-cover-line)", strokeWidth: 1 };

function patternTile(pattern: CoverPattern, id: string) {
  switch (pattern) {
    // 細線：等距直紋，像手工紙的簾紋
    case "lines":
      return (
        <pattern id={id} width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M6 0 V12" style={stroke} />
        </pattern>
      );
    // 點陣：交錯的圓點
    case "dots":
      return (
        <pattern id={id} width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="4.5" cy="4.5" r="1.9" style={{ fill: "var(--u-cover-line)" }} />
          <circle cx="13.5" cy="13.5" r="1.9" style={{ fill: "var(--u-cover-line)" }} />
        </pattern>
      );
    // 斜紋：交叉的織紋
    case "weave":
      return (
        <pattern id={id} width="14" height="14" patternUnits="userSpaceOnUse">
          <path d="M0 0 L14 14" style={stroke} />
          <path d="M14 0 L0 14" style={stroke} />
        </pattern>
      );
    default:
      return null;
  }
}

const rule = { fill: "none", stroke: "var(--u-cover-frame)", strokeWidth: 2, strokeLinecap: "round" } as const;

/** 直排標題：一個字一個 <text>，自己算位置，不依賴瀏覽器的直排實作 */
function glyphColumn(glyphs: string) {
  const chars = Array.from(glyphs).slice(0, MAX_GLYPHS);
  const count = Math.max(1, chars.length);
  const fontSize = GLYPH_SIZE[count] ?? GLYPH_SIZE[4];
  const step = fontSize * 1.14;
  const blockHeight = (count - 1) * step + fontSize;
  const top = H / 2 - blockHeight / 2;

  return (
    <g className="pointer-events-none">
      <path d={`M${W / 2 - 20} ${top - 22} H${W / 2 + 20}`} style={rule} />
      {chars.map((char, index) => (
        <text
          key={`${char}-${index}`}
          x={W / 2}
          y={top + fontSize / 2 + index * step}
          fontSize={fontSize}
          textAnchor="middle"
          dominantBaseline="central"
          style={{ fill: "var(--u-cover-ink)", fontFamily: PROSE, fontWeight: 600, letterSpacing: ".04em" }}
        >
          {char}
        </text>
      ))}
      <path d={`M${W / 2 - 20} ${top + blockHeight + 22} H${W / 2 + 20}`} style={rule} />
    </g>
  );
}

export type CoverSize = "sm" | "md" | "lg" | "fill";
const coverWidth: Record<CoverSize, string> = { sm: "w-16", md: "w-[148px]", lg: "w-[232px]", fill: "w-full" };

export interface SeededCoverProps {
  /** 決定色相與紋理，通常是作品 id；同一個 seed 永遠得到同一張封面 */
  seed: string;
  /** 作品標題，取前四字直排 */
  title: string;
  /** 直接指定直排的字，蓋過從標題取字 */
  glyphs?: string;
  size?: CoverSize;
  /** 有實際封面圖時放圖，文字封面退場 */
  src?: string;
  alt?: string;
  /** 給輔助技術的說明；不給就是純裝飾（旁邊通常已有標題文字） */
  label?: string;
  /** 不給就繼承外層的 --story-* 變數，外層也沒有時用 ink */
  theme?: StoryTheme;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<SeededCoverLabels>;
  className?: string;
}

export function SeededCover({ seed, title, glyphs, size = "md", src, alt, label, theme, locale = "en", labels, className }: SeededCoverProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const base = cn(
    "relative flex-none overflow-hidden rounded-[8px] border border-[var(--story-line,rgba(230,225,213,.12))] aspect-[3/4]",
    coverWidth[size],
    className,
  );
  const themed = theme ? themeStyle(theme) : undefined;

  if (src) {
    return (
      <div className={base} style={{ ...themed, boxShadow: "var(--story-shadow, 0 1px 2px rgba(0,0,0,.4))" }}>
        <img src={src} alt={alt ?? label ?? ""} className="size-full object-cover" loading="lazy" decoding="async" />
      </div>
    );
  }

  const style = coverStyle(seed, title, t.untitled);
  const patternId = `sc-cover-${style.pattern}-${coverSeed(seed || title).toString(36)}`;
  const tile = patternTile(style.pattern, patternId);

  // 只交出色相，顏色由主題的表面色與文字色混出來，三個主題都落在對的明度
  const coverVars = {
    ...themed,
    "--u-cover-hue": String(style.hue),
    "--u-cover-tint": "hsl(var(--u-cover-hue) 55% 48%)",
    "--u-cover-ground": "color-mix(in oklab, var(--story-surface, #1e2327) 84%, var(--u-cover-tint))",
    "--u-cover-ink": "color-mix(in oklab, var(--story-text, #e6e1d5) 86%, var(--u-cover-tint))",
    "--u-cover-line": "color-mix(in oklab, var(--u-cover-tint) 52%, transparent)",
    "--u-cover-frame": "color-mix(in oklab, var(--story-text, #e6e1d5) 22%, transparent)",
    backgroundColor: "var(--u-cover-ground)",
    backgroundImage: "linear-gradient(158deg, color-mix(in oklab, var(--u-cover-tint) 26%, transparent), transparent 64%)",
    boxShadow: "var(--story-shadow, 0 1px 2px rgba(0,0,0,.4))",
  } as CSSProperties;

  return (
    <div className={base} style={coverVars}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block size-full"
        role={label ? "img" : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        focusable="false"
      >
        {tile ? (
          <>
            <defs>{tile}</defs>
            <rect width={W} height={H} fill={`url(#${patternId})`} />
          </>
        ) : (
          <g style={{ fill: "none", stroke: "var(--u-cover-line)", strokeWidth: 1.2 }}>
            {ARC_RADII.map((radius) => (
              <circle key={radius} cx={W / 2} cy={ARC_CENTER_Y} r={radius} />
            ))}
          </g>
        )}
        <rect x="10" y="10" width={W - 20} height={H - 20} style={{ fill: "none", stroke: "var(--u-cover-frame)", strokeWidth: 1 }} />
        {glyphColumn(glyphs || style.glyphs)}
      </svg>
    </div>
  );
}
