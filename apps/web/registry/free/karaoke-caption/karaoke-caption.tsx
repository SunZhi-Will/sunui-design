"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState, type CSSProperties, type RefObject } from "react";

import { cn } from "@/lib/utils";

type StoryVars = Record<`--story-${string}`, string>;

const vars = (panel: string, line: string, text: string, accent: string): StoryVars => ({
  "--story-panel": panel,
  "--story-line": line,
  "--story-text": text,
  "--story-accent": accent,
});

// 設計語言（DESIGN-story.md）：顏色只走 --story-* 變數；字幕板需要壓在影片上，所以三個主題的底都偏不透明
export const storyThemes = {
  ink: vars("rgb(10 12 18 / 0.82)", "rgb(234 228 214 / 0.14)", "#eae4d6", "#c9a063"),
  rice: vars("rgb(250 246 236 / 0.94)", "rgb(60 48 32 / 0.18)", "#2a2219", "#9a6b2a"),
  moon: vars("rgb(10 13 20 / 0.82)", "rgb(220 228 240 / 0.14)", "#e4e8ef", "#a3b8d9"),
};

export type StoryTheme = keyof typeof storyThemes | StoryVars;

export interface CaptionCue {
  text: string;
  /** 秒 */
  start: number;
  end: number;
}

export interface KaraokeCaptionProps {
  cues: CaptionCue[];
  /** 目前播放時間（秒），可搭配 useMediaTime */
  time: number;
  theme?: StoryTheme;
  maxWidth?: string;
  labels?: { region?: string };
  className?: string;
}

type Token = { text: string; weight: number };

const CJK = /[぀-ヿ㐀-鿿豈-﫿가-힯]/;
const CJK_PUNCT = /[　-〿＀-￯]/;

/** CJK 逐字、拉丁逐詞；標點與空白不佔時間 */
export function tokenize(text: string): Token[] {
  const out: Token[] = [];
  let word = "";
  const flush = () => {
    if (word) out.push({ text: word, weight: 1 + word.length / 6 });
    word = "";
  };
  for (const ch of text) {
    if (/\s/.test(ch)) {
      flush();
      out.push({ text: ch, weight: 0 });
    } else if (CJK.test(ch)) {
      flush();
      out.push({ text: ch, weight: 1 });
    } else if (CJK_PUNCT.test(ch)) {
      flush();
      // 全形標點黏在前一個字上，避免單獨換行
      if (out.length) out[out.length - 1] = { ...out[out.length - 1], text: out[out.length - 1].text + ch };
      else out.push({ text: ch, weight: 0 });
    } else word += ch;
  }
  flush();
  return out;
}

/** 從 audio / video 讀取播放時間，播放中用 rAF 更新 */
export function useMediaTime(ref: RefObject<HTMLMediaElement | null>) {
  const [time, setTime] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const tick = () => {
      setTime(el.currentTime);
      if (!el.paused && !el.ended) raf = requestAnimationFrame(tick);
    };
    const onPlay = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    const sync = () => setTime(el.currentTime);
    el.addEventListener("play", onPlay);
    el.addEventListener("seeked", sync);
    el.addEventListener("pause", sync);
    if (!el.paused) onPlay();
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("seeked", sync);
      el.removeEventListener("pause", sync);
    };
  }, [ref]);
  return time;
}

function fontSize(length: number) {
  if (length <= 24) return "clamp(1.05rem, 4.2vw, 1.5rem)";
  if (length <= 48) return "clamp(0.95rem, 3.6vw, 1.25rem)";
  return "clamp(0.875rem, 3vw, 1.05rem)";
}

export function KaraokeCaption({ cues, time, theme = "ink", maxWidth = "36rem", labels, className }: KaraokeCaptionProps) {
  const reduce = useReducedMotion() ?? false;
  const index = cues.findIndex((c) => time >= c.start && time < c.end);
  const cue = index >= 0 ? cues[index] : null;

  // 依權重把這句的時間分給每個 token
  const timed = useMemo(() => {
    if (!cue) return [];
    const tokens = tokenize(cue.text);
    const total = tokens.reduce((s, t) => s + t.weight, 0) || 1;
    const span = cue.end - cue.start;
    let at = cue.start;
    return tokens.map((t) => {
      const start = at;
      at += (t.weight / total) * span;
      return { ...t, start, end: at };
    });
  }, [cue]);

  const themeVars = (typeof theme === "string" ? storyThemes[theme] : theme) as CSSProperties;

  return (
    <div
      role="region"
      aria-label={labels?.region ?? "Captions"}
      className={cn("pointer-events-none flex justify-center px-3 font-sans", className)}
      style={themeVars}
    >
      {/* 螢幕閱讀器每句只念一次，不逐字播報 */}
      <span className="sr-only" role="status" aria-live="polite">
        {cue?.text ?? ""}
      </span>
      <AnimatePresence mode="wait" initial={false}>
        {cue && (
          <motion.p
            key={index}
            aria-hidden="true"
            // 字幕板例外：圓角放寬到 14px，像影片上的字幕條
            className="rounded-[14px] border px-4 py-2 text-center leading-snug font-medium tracking-[0.02em]"
            style={{
              maxWidth,
              fontSize: fontSize(cue.text.length),
              background: "var(--story-panel)",
              borderColor: "var(--story-line)",
              color: "var(--story-text)",
            }}
            initial={reduce ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -4 }}
            transition={{ duration: reduce ? 0 : 0.2, ease: [0.22, 0.72, 0.2, 1] }}
          >
            {timed.map((tk, i) => {
              const state = time >= tk.end ? "spoken" : time >= tk.start && tk.weight > 0 ? "active" : "upcoming";
              return (
                <span
                  key={i}
                  style={{
                    color: state === "active" ? "var(--story-accent)" : "var(--story-text)",
                    opacity: state === "upcoming" ? 0.45 : 1,
                    transition: reduce ? "none" : "color 120ms, opacity 120ms",
                  }}
                >
                  {tk.text}
                </span>
              );
            })}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
