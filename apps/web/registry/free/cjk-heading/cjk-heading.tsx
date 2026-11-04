"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useMemo, type ElementType } from "react";

import { cn } from "@/lib/utils";

export interface CjkHeadingProps {
  /** 標題文字，可中英混排 */
  text: string;
  as?: ElementType;
  /** 直排（writing-mode: vertical-rl） */
  vertical?: boolean;
  /**
   * 標點擠壓：auto 優先使用 text-spacing-trim，不支援時退回 halt；
   * palt 為比例字寬，halt 只壓縮標點，none 不處理
   */
  compress?: "auto" | "palt" | "halt" | "none";
  /** 在中日文與英數之間自動插入細空格 */
  autoSpace?: boolean;
  /** 直排時把一到兩位數字橫向置中（縱中橫） */
  tateChuYoko?: boolean;
  /** 進場動畫時機 */
  animate?: "mount" | "view" | "none";
  /** 每個字的間隔秒數 */
  stagger?: number;
  /** 需要上色的字詞 */
  highlight?: string[];
  highlightClassName?: string;
  lang?: string;
  className?: string;
}

const CJK_CLASS = "\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}\\p{Script=Hangul}";
const CJK_RE = new RegExp(`[${CJK_CLASS}]`, "u");
const LATIN_RE = /[A-Za-z0-9\u00C0-\u024F]/;
// 中日文後接英數、或英數後接中日文之處插入細空格
const SPACE_A = new RegExp(`([${CJK_CLASS}])([A-Za-z0-9\\u00C0-\\u024F])`, "gu");
const SPACE_B = new RegExp(`([A-Za-z0-9\\u00C0-\\u024F%])([${CJK_CLASS}])`, "gu");
const THIN = "\u2009";

export function addCjkSpacing(text: string) {
  return text.replace(SPACE_A, `$1${THIN}$2`).replace(SPACE_B, `$1${THIN}$2`);
}

type Token = { text: string; kind: "cjk" | "latin" | "digits" | "space" | "other" };

function tokenize(text: string): Token[] {
  const out: Token[] = [];
  const re = /\d{1,2}(?![\dA-Za-z])|[A-Za-z0-9\u00C0-\u024F'%.-]+|\s+|./gsu;
  for (const m of text.matchAll(re)) {
    const t = m[0];
    if (/^\s+$/u.test(t)) out.push({ text: t, kind: "space" });
    else if (/^\d{1,2}$/.test(t)) out.push({ text: t, kind: "digits" });
    else if (LATIN_RE.test(t)) out.push({ text: t, kind: "latin" });
    else if (CJK_RE.test(t)) out.push({ text: t, kind: "cjk" });
    else out.push({ text: t, kind: "other" });
  }
  return out;
}

const NO_WORDS: string[] = [];

export function CjkHeading({
  text,
  as: Tag = "h2",
  vertical = false,
  compress = "auto",
  autoSpace = true,
  tateChuYoko = true,
  animate = "view",
  stagger = 0.045,
  highlight = NO_WORDS,
  highlightClassName = "text-primary",
  lang = "zh-Hant",
  className,
}: CjkHeadingProps) {
  const reduceMotion = useReducedMotion();
  const display = useMemo(() => (autoSpace ? addCjkSpacing(text) : text), [text, autoSpace]);
  const tokens = useMemo(() => tokenize(display), [display]);

  // 標出要上色的字元位置
  const marked = useMemo(() => {
    const set = new Set<number>();
    for (const word of highlight) {
      if (!word) continue;
      let from = display.indexOf(word);
      while (from !== -1) {
        for (let i = from; i < from + word.length; i++) set.add(i);
        from = display.indexOf(word, from + word.length);
      }
    }
    return set;
  }, [display, highlight]);

  // 只動 opacity 與 blur：inline 元素不能 transform，但保留 inline 才不會破壞避頭尾斷行
  const charVariants: Variants = {
    hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, filter: "blur(10px)" },
    visible: (i: number) => ({
      opacity: 1,
      filter: "blur(0px)",
      transition: reduceMotion ? { duration: 0 } : { delay: i * stagger, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  const motionProps =
    animate === "none"
      ? {}
      : animate === "mount"
        ? { initial: "hidden", animate: "visible" }
        : { initial: "hidden", whileInView: "visible", viewport: { once: true, amount: 0.4 } };

  let offset = 0;
  let step = 0;

  return (
    <Tag
      lang={lang}
      data-compress={compress}
      data-vertical={vertical || undefined}
      className={cn(
        "sunui-cjk-heading text-4xl font-bold leading-[1.35] tracking-[0.02em] text-foreground sm:text-5xl",
        vertical ? "[writing-mode:vertical-rl] leading-[1.6]" : "[text-wrap:balance]",
        className,
      )}
    >
      <span className="sr-only">{text}</span>
      <motion.span aria-hidden="true" {...motionProps}>
        {tokens.map((t, i) => {
          const start = offset;
          offset += t.text.length;
          if (t.kind === "space") return <span key={i}>{t.text}</span>;
          const isMarked = marked.has(start);
          const tcy = vertical && tateChuYoko && t.kind === "digits";
          return (
            <motion.span
              key={i}
              custom={step++}
              variants={animate === "none" ? undefined : charVariants}
              className={cn(isMarked && highlightClassName, tcy && "[text-combine-upright:all]")}
            >
              {t.text}
            </motion.span>
          );
        })}
      </motion.span>
      <style href="sunui-cjk-heading" precedence="default">{`
.sunui-cjk-heading { font-kerning: normal; line-break: strict; word-break: normal; }
.sunui-cjk-heading[data-compress="auto"] { font-feature-settings: "halt"; }
.sunui-cjk-heading[data-compress="auto"][data-vertical] { font-feature-settings: "vhal"; }
@supports (text-spacing-trim: trim-start) {
  .sunui-cjk-heading[data-compress="auto"], .sunui-cjk-heading[data-compress="auto"][data-vertical] { font-feature-settings: normal; text-spacing-trim: trim-both; }
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
