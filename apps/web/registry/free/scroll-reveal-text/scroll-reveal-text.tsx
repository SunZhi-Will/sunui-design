"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useMemo, useRef, type ElementType, type RefObject } from "react";

import { cn } from "@/lib/utils";

type ScrollOffset = NonNullable<Parameters<typeof useScroll>[0]>["offset"];

export interface ScrollRevealTextProps {
  /** Paragraph text. Chinese and Japanese reveal one character at a time, English one word at a time */
  text: string;
  /** Scroll container. When omitted, tracks window. The container must be a positioned element (relative) for positions to be measured accurately */
  container?: RefObject<HTMLElement | null>;
  as?: ElementType;
  /** Force how the text is split. auto decides from the text */
  splitBy?: "auto" | "word" | "char";
  /** Text color strength before it has been read (0 to 1) */
  dimOpacity?: number;
  /** Words to emphasize (may be multi-character), printed in vermilion once read */
  accentWords?: string[];
  accentClassName?: string;
  /** framer-motion useScroll offset, decides when the reveal starts and ends */
  offset?: ScrollOffset;
  /** Language tag, for example zh-Hant or ja. Affects fonts and line breaking */
  lang?: string;
  /** UI language (en, zh-TW, zh-CN, ja and so on). Used as the language tag when lang is not given. The component has no built-in strings */
  locale?: string;
  className?: string;
}

// CJK characters and full-width punctuation each become one token
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
  accentClassName = "text-foreground",
  offset = ["start 0.85", "end 0.45"],
  lang,
  locale,
  className,
}: ScrollRevealTextProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  // layoutEffect: false, so it binds only after the parent's container ref is attached, otherwise it falls back to tracking window
  const { scrollYProgress } = useScroll({ target: ref, container, offset, layoutEffect: false });
  const accentKey = accentWords.join("\u0000");

  const tokens = useMemo(() => {
    // First mark where the emphasized words sit in the source text, so multi-character Chinese words are colored as a whole
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
      // Judged by token start, so an English word followed by punctuation (for example "ready,") still matches
      return { text: t, accent: t.trim() !== "" && marked.has(start) };
    });
  }, [text, splitBy, accentKey]);

  // Only non-whitespace tokens take part in the progress distribution
  const visibleCount = tokens.filter((t) => t.text.trim()).length || 1;
  let cursor = 0;

  return (
    <Tag
      ref={ref}
      lang={lang ?? locale}
      className={cn("text-2xl leading-relaxed font-semibold text-foreground sm:text-3xl", className)}
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
  // Text color goes from pale to strong: only the strength changes, with no hue sweep and no blur
  const opacity = useTransform(progress, range, [dim, 1]);
  return (
    <motion.span className={className} style={{ opacity }}>
      {children}
    </motion.span>
  );
}
