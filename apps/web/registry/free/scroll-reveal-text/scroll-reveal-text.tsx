"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useMemo, useRef, type ElementType, type RefObject } from "react";

import { cn } from "@/lib/utils";

type ScrollOffset = NonNullable<Parameters<typeof useScroll>[0]>["offset"];

export interface ScrollRevealTextProps {
  /** 段落文字；中文、日文會逐字點亮，英文逐詞點亮 */
  text: string;
  /** 捲動容器；省略時追蹤 window */
  container?: RefObject<HTMLElement | null>;
  as?: ElementType;
  /** 強制切分方式；auto 依文字自動判斷 */
  splitBy?: "auto" | "word" | "char";
  /** 尚未點亮時的不透明度 */
  dimOpacity?: number;
  /** 需要強調的詞，點亮後套用 accentClassName */
  accentWords?: string[];
  accentClassName?: string;
  /** framer-motion useScroll offset，決定何時開始與結束點亮 */
  offset?: ScrollOffset;
  /** 語言標記，例如 zh-Hant、ja；影響字型與斷行 */
  lang?: string;
  className?: string;
}

// 中日韓文字與全形標點各自成為一個 token
const CJK = "\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}\\p{Script=Hangul}\\u3000-\\u303F\\uFF00-\\uFFEF\\u2018-\\u201F\\u2026";
const AUTO_RE = new RegExp(`[${CJK}]|\\s+|[^\\s${CJK}]+`, "gu");
const WORD_RE = /\s+|\S+/gu;
const NO_WORDS: string[] = [];

export function splitReveal(text: string, mode: "auto" | "word" | "char" = "auto"): string[] {
  if (mode === "char") {
    const seg = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
    return seg ? Array.from(seg.segment(text), (s) => s.segment) : Array.from(text);
  }
  return text.match(mode === "word" ? WORD_RE : AUTO_RE) ?? [];
}

export function ScrollRevealText({
  text,
  container,
  as: Tag = "p",
  splitBy = "auto",
  dimOpacity = 0.18,
  accentWords = NO_WORDS,
  accentClassName = "text-primary",
  offset = ["start 0.85", "end 0.45"],
  lang,
  className,
}: ScrollRevealTextProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, container, offset });
  const tokens = useMemo(() => splitReveal(text, splitBy), [text, splitBy]);
  const accent = useMemo(() => new Set(accentWords), [accentWords]);

  // 只有非空白 token 參與進度分配
  const visibleCount = tokens.filter((t) => t.trim()).length || 1;
  let cursor = 0;

  return (
    <Tag ref={ref} lang={lang} className={cn("relative text-2xl font-semibold leading-relaxed text-foreground sm:text-3xl", className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {tokens.map((token, i) => {
          if (!token.trim()) return <span key={i}>{token}</span>;
          const start = cursor / visibleCount;
          cursor += 1;
          const end = cursor / visibleCount;
          const isAccent = accent.has(token.replace(/[.,!?;:，。！？；：、]+$/u, ""));
          return reduceMotion ? (
            <span key={i} className={cn(isAccent && accentClassName)}>
              {token}
            </span>
          ) : (
            <Token
              key={i}
              progress={scrollYProgress}
              range={[start, end]}
              dim={dimOpacity}
              className={cn(isAccent && accentClassName)}
            >
              {token}
            </Token>
          );
        })}
      </span>
    </Tag>
  );
}

function Token({
  progress,
  range,
  dim,
  className,
  children,
}: {
  progress: MotionValue<number>;
  range: [number, number];
  dim: number;
  className?: string;
  children: string;
}) {
  const opacity = useTransform(progress, range, [dim, 1]);
  return (
    <motion.span className={className} style={{ opacity }}>
      {children}
    </motion.span>
  );
}
