"use client";

import { Fragment, useMemo, type ElementType, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface CjkHeadingProps {
  /** 標題文字，可中英混排；用 \n 指定斷行位置 */
  text: string;
  as?: ElementType;
  /** 直排（writing-mode: vertical-rl） */
  vertical?: boolean;
  /**
   * 標點擠壓：auto 優先使用 text-spacing-trim（行首與相鄰標點擠壓），不支援時退回 halt；
   * palt 為比例字寬，halt 只壓縮標點，none 不處理
   */
  compress?: "auto" | "palt" | "halt" | "none";
  /** 在中日文與英數之間自動插入細空格 */
  autoSpace?: boolean;
  /** 直排時把一到兩位數字橫向置中（縱中橫） */
  tateChuYoko?: boolean;
  /** 以朱紅印章樣式標出的關鍵字；一個標題建議只標一處 */
  highlight?: string[];
  highlightClassName?: string;
  /** 介面語言：zh-TW、zh-CN、ja 時預設 lang 為 zh-Hant、zh-Hans、ja；en 或未給時沿用 zh-Hant */
  locale?: string;
  /** 明確指定 lang，優先於 locale */
  lang?: string;
  className?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

// 本元件沒有內建字串，locale 只決定 lang（字形與標點規則）；英文介面裡的標題內容仍是中日文
const LANG: Record<SunLocale, string> = { en: "zh-Hant", "zh-TW": "zh-Hant", "zh-CN": "zh-Hans", ja: "ja" };

const CJK_CLASS = "\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}\\p{Script=Hangul}";
// 中日文後接英數、或英數後接中日文之處插入細空格
const SPACE_A = new RegExp(`([${CJK_CLASS}])([A-Za-z0-9\\u00C0-\\u024F])`, "gu");
const SPACE_B = new RegExp(`([A-Za-z0-9\\u00C0-\\u024F%])([${CJK_CLASS}])`, "gu");
const THIN = " ";
// 前後不接其他英數的一到兩位數字，直排時做縱中橫
const TCY_RE = /(?<![\dA-Za-z])\d{1,2}(?![\dA-Za-z])/g;

export function addCjkSpacing(text: string) {
  return text.replace(SPACE_A, `$1${THIN}$2`).replace(SPACE_B, `$1${THIN}$2`);
}

// 設計語言（DESIGN.md）：朱紅只用在印章關鍵字
const seal =
  "whitespace-nowrap rounded-[2px] bg-[#c8361d] [margin-inline:0.04em] [padding-inline:0.14em] text-[#faf7f0] [box-decoration-break:clone] [-webkit-box-decoration-break:clone] dark:bg-[#ec6a4f] dark:text-[#1f1c18]";

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
    // 依關鍵字切段；關鍵字內不插細空格的版本也要比對得到
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

  // 換行符號 \n 視為設計好的斷行點，標題斷在詞與詞之間
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
      // 數字前後的細空格在直排裡多餘，一併去掉
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
        "sunui-cjk-heading text-[length:clamp(2rem,1.2rem+3vw,3rem)] font-bold tracking-[0.04em] text-[#1c1917] dark:text-[#ece7dc]",
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
