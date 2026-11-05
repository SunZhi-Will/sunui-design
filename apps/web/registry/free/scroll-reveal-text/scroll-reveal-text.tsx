"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useMemo, useRef, type ElementType, type RefObject } from "react";

import { cn } from "@/lib/utils";

type ScrollOffset = NonNullable<Parameters<typeof useScroll>[0]>["offset"];

export interface ScrollRevealTextProps {
  /** 段落文字；中文、日文逐字由淡墨轉為實墨，英文逐詞 */
  text: string;
  /** 捲動容器；省略時追蹤 window。容器需為定位元素（relative），位置才量得準 */
  container?: RefObject<HTMLElement | null>;
  as?: ElementType;
  /** 強制切分方式；auto 依文字自動判斷 */
  splitBy?: "auto" | "word" | "char";
  /** 尚未讀到時的墨色濃度（0 到 1） */
  dimOpacity?: number;
  /** 需要強調的字詞（可多字），讀到時以朱紅印出 */
  accentWords?: string[];
  accentClassName?: string;
  /** framer-motion useScroll offset，決定何時開始與結束 */
  offset?: ScrollOffset;
  /** 語言標記，例如 zh-Hant、ja；影響字型與斷行 */
  lang?: string;
  /** 介面語言（en、zh-TW、zh-CN、ja 等）；沒給 lang 時當作語言標記。元件本身沒有內建字串 */
  locale?: string;
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
  dimOpacity = 0.2,
  accentWords = NO_WORDS,
  accentClassName = "text-[#c8361d] dark:text-[#ec6a4f]",
  offset = ["start 0.85", "end 0.45"],
  lang,
  locale,
  className,
}: ScrollRevealTextProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  // layoutEffect: false，等父層的 container ref 掛上後才綁定，否則會退回追蹤 window
  const { scrollYProgress } = useScroll({ target: ref, container, offset, layoutEffect: false });
  const accentKey = accentWords.join("\u0000");

  const tokens = useMemo(() => {
    // 先在原文標出強調字詞的位置，多字的中文詞也能整詞上色
    const marked = new Set<number>();
    for (const w of accentKey.split("\u0000")) {
      if (!w) continue;
      for (let at = text.indexOf(w); at !== -1; at = text.indexOf(w, at + w.length)) {
        for (let i = at; i < at + w.length; i++) marked.add(i);
      }
    }
    let pos = 0;
    return splitReveal(text, splitBy).map((t) => {
      const start = pos;
      pos += t.length;
      // 以 token 起點判斷，英文詞後接標點（例如 "ready,"）也能命中
      return { text: t, accent: t.trim() !== "" && marked.has(start) };
    });
  }, [text, splitBy, accentKey]);

  // 只有非空白 token 參與進度分配
  const visibleCount = tokens.filter((t) => t.text.trim()).length || 1;
  let cursor = 0;

  return (
    <Tag
      ref={ref}
      lang={lang ?? locale}
      className={cn("text-2xl leading-relaxed font-semibold text-[#1c1917] sm:text-3xl dark:text-[#ece7dc]", className)}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {tokens.map((token, i) => {
          if (!token.text.trim()) return <span key={i}>{token.text}</span>;
          const start = cursor / visibleCount;
          cursor += 1;
          const end = cursor / visibleCount;
          const tone = cn(token.accent && accentClassName);
          return reduceMotion ? (
            <span key={i} className={tone}>
              {token.text}
            </span>
          ) : (
            <Token key={i} progress={scrollYProgress} range={[start, end]} dim={dimOpacity} className={tone}>
              {token.text}
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
  // 墨色由淡轉濃：只調濃度，不掃色、不模糊
  const opacity = useTransform(progress, range, [dim, 1]);
  return (
    <motion.span className={className} style={{ opacity }}>
      {children}
    </motion.span>
  );
}
