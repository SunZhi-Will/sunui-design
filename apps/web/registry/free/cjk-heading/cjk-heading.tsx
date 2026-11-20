"use client";

import { Fragment, useMemo, type ElementType, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface CjkHeadingProps {
  /** Heading text, may mix Chinese and English; use \n to set the line break position */
  text: string;
  as?: ElementType;
  /** Vertical writing (writing-mode: vertical-rl) */
  vertical?: boolean;
  /**
   * Punctuation squeezing: auto prefers text-spacing-trim (squeezes at line start and between adjacent punctuation) and falls back to halt when unsupported;
   * palt uses proportional widths, halt only compresses punctuation, none does nothing
   */
  compress?: "auto" | "palt" | "halt" | "none";
  /** Automatically insert thin spaces between CJK text and Latin letters or digits */
  autoSpace?: boolean;
  /** In vertical writing, center one- or two-digit numbers horizontally (tate-chu-yoko) */
  tateChuYoko?: boolean;
  /** Keyword marked in a vermilion seal style; one per heading is recommended */
  highlight?: string[];
  highlightClassName?: string;
  /** UI language: with zh-TW, zh-CN, ja the default lang is zh-Hant, zh-Hans, ja; with en or when not given it stays zh-Hant */
  locale?: string;
  /** Set lang explicitly, takes priority over locale */
  lang?: string;
  className?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Map any language tag to one of the four built-in languages; everything else falls back to English */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

// This component has no built-in strings: locale only decides lang (glyph shapes and punctuation rules); heading content in the English UI is still Chinese or Japanese
const LANG: Record<SunLocale, string> = { en: "zh-Hant", "zh-TW": "zh-Hant", "zh-CN": "zh-Hans", ja: "ja" };

const CJK_CLASS = "\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}\\p{Script=Hangul}";
// Insert a thin space where CJK is followed by Latin or digits, or Latin or digits are followed by CJK
const SPACE_A = new RegExp(`([${CJK_CLASS}])([A-Za-z0-9\\u00C0-\\u024F])`, "gu");
const SPACE_B = new RegExp(`([A-Za-z0-9\\u00C0-\\u024F%])([${CJK_CLASS}])`, "gu");
const THIN = " ";
// One- or two-digit numbers not adjacent to other Latin or digits get tate-chu-yoko in vertical writing
const TCY_RE = /(?<![\dA-Za-z])\d{1,2}(?![\dA-Za-z])/g;

export function addCjkSpacing(text: string) {
  return text.replace(SPACE_A, `$1${THIN}$2`).replace(SPACE_B, `$1${THIN}$2`);
}

// Design language (DESIGN.md): vermilion is used only for the seal keyword
const seal =
  "whitespace-nowrap rounded-[2px] bg-foreground [margin-inline:0.04em] [padding-inline:0.14em] text-background [box-decoration-break:clone] [-webkit-box-decoration-break:clone]";

const NO_WORDS: string[] = [];

export function CjkHeading({
  text,
  as: Tag = "h2",
  vertical = false,
  compress = "auto",
  autoSpace = true,
  tateChuYoko = true,
  highlight = NO_WORDS,
  highlightClassName,
  locale,
  lang: langProp,
  className,
}: CjkHeadingProps) {
  const lang = langProp ?? LANG[resolveLocale(locale)];
  const highlightKey = highlight.join("\u0000");

  const parts = useMemo(() => {
    const display = autoSpace ? addCjkSpacing(text) : text;
    const words = highlightKey.split("\u0000").filter(Boolean);
    // Split by keyword; the version of the text without thin spaces inside the keyword must also match
    const out: { text: string; sealed: boolean }[] = [];
    let rest = display;
    while (rest) {
      let hit: { at: number; len: number } | null = null;
      for (const w of words) {
        for (const form of [w, autoSpace ? addCjkSpacing(w) : w]) {
          const at = rest.indexOf(form);
          if (at !== -1 && (!hit || at < hit.at)) hit = { at, len: form.length };
        }
      }
      if (!hit) {
        out.push({ text: rest, sealed: false });
        break;
      }
      if (hit.at > 0) out.push({ text: rest.slice(0, hit.at), sealed: false });
      out.push({ text: rest.slice(hit.at, hit.at + hit.len), sealed: true });
      rest = rest.slice(hit.at + hit.len);
    }
    return out;
  }, [text, autoSpace, highlightKey]);

  // The \n line break is treated as a designed break point, so the heading breaks between words
  const renderRun = (run: string): ReactNode =>
    run.split("\n").map((line, i) => (
      <Fragment key={i}>
        {i > 0 && <br />}
        {renderLine(line)}
      </Fragment>
    ));

  const renderLine = (run: string): ReactNode => {
    if (!vertical || !tateChuYoko) return run;
    const nodes: ReactNode[] = [];
    let last = 0;
    for (const m of run.matchAll(TCY_RE)) {
      const at = m.index ?? 0;
      // Thin spaces around digits are redundant in vertical writing, so remove them too
      nodes.push(run.slice(last, at).replace(/ $/, ""));
      nodes.push(
        <span key={at} className="[text-combine-upright:all]">
          {m[0]}
        </span>,
      );
      last = at + m[0].length;
      if (run[last] === THIN) last += 1;
    }
    nodes.push(run.slice(last));
    return nodes;
  };

  return (
    <Tag
      lang={lang}
      data-compress={compress}
      data-vertical={vertical || undefined}
      className={cn(
        "sunui-cjk-heading text-[length:clamp(2rem,1.2rem+3vw,3rem)] font-bold tracking-[0.04em] text-foreground",
        vertical ? "leading-[1.5] [writing-mode:vertical-rl]" : "leading-[1.3] [text-wrap:balance]",
        className,
      )}
    >
      {parts.map((p, i) =>
        p.sealed ? (
          <span key={i} className={cn(seal, highlightClassName)}>
            {renderRun(p.text)}
          </span>
        ) : (
          <span key={i}>{renderRun(p.text)}</span>
        ),
      )}
      <style href="sunui-cjk-heading" precedence="default">{`
.sunui-cjk-heading { font-kerning: normal; line-break: strict; word-break: normal; hanging-punctuation: allow-end; }
.sunui-cjk-heading[data-compress="auto"] { font-feature-settings: "halt"; }
.sunui-cjk-heading[data-compress="auto"][data-vertical] { font-feature-settings: "vhal"; }
@supports (text-spacing-trim: trim-start) {
  .sunui-cjk-heading[data-compress="auto"], .sunui-cjk-heading[data-compress="auto"][data-vertical] { font-feature-settings: normal; text-spacing-trim: trim-start; }
}
.sunui-cjk-heading[data-compress="halt"] { font-feature-settings: "halt"; }
.sunui-cjk-heading[data-compress="halt"][data-vertical] { font-feature-settings: "vhal"; }
.sunui-cjk-heading[data-compress="palt"] { font-feature-settings: "palt"; }
.sunui-cjk-heading[data-compress="palt"][data-vertical] { font-feature-settings: "vpal"; }
.sunui-cjk-heading[data-compress="none"] { font-feature-settings: normal; text-spacing-trim: space-all; }
`}</style>
    </Tag>
  );
}
