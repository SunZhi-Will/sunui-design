"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState, type CSSProperties, type RefObject } from "react";

import { cn } from "@/lib/utils";

type StoryVars = Record<`--story-${string}`, string>;

const vars = (panel: string, line: string, text: string, accent: string, shadow: string): StoryVars => ({
  "--story-panel": panel,
  "--story-line": line,
  "--story-text": text,
  "--story-accent": accent,
  "--story-shadow": shadow,
});

// ink 是原作 render-deck 的字幕板：slate-950/92 底、白字、金色 #a9781a
export const storyThemes = {
  ink: vars("rgb(2 6 23 / 0.92)", "rgb(255 255 255 / 0.1)", "#ffffff", "#a9781a", "0 24px 60px rgba(15,23,42,0.45)"),
  rice: vars("rgb(250 246 236 / 0.94)", "rgb(60 48 32 / 0.18)", "#2a2219", "#9a6b2a", "0 24px 60px rgba(60,48,32,0.18)"),
  moon: vars("rgb(10 13 20 / 0.92)", "rgb(220 228 240 / 0.12)", "#e4e8ef", "#a3b8d9", "0 24px 60px rgba(0,0,0,0.45)"),
};

export type StoryTheme = keyof typeof storyThemes | StoryVars;

export interface SubtitleItem {
  text: string;
  /** 秒，相對於這一段（投影片或對話輪）的開頭 */
  start: number;
  end: number;
}

export interface KaraokeCaptionProps {
  subtitles: SubtitleItem[];
  /** 目前時間（秒），相對於這一段的開頭 */
  time: number;
  /** 正在念的字的顏色；不給就用主題的 --story-accent（ink 為 #a9781a） */
  accent?: string;
  theme?: StoryTheme;
  /** 落在兩句之間的空檔時，顯示開始時間最接近的一句（原作行為） */
  holdNearest?: boolean;
  labels?: { region?: string };
  className?: string;
}

/** 中文逐字、英數逐詞、標點各自一個 token（與原作同一條規則） */
export function tokenize(text: string): string[] {
  return text.match(/[一-鿿]|[a-zA-Z0-9]+|[^\s\w一-鿿]/g) || [text];
}

/** 依字數算字級：980 / 字數，夾在 40 到 58px（原作在 940px 寬的字幕區） */
export function captionFontSize(length: number) {
  return Math.max(40, Math.min(58, Math.floor(980 / Math.max(length, 1))));
}

export function findSubtitle(subtitles: SubtitleItem[], time: number, holdNearest = true) {
  let active = subtitles.find((sub) => time >= sub.start && time <= sub.end);
  if (!active && holdNearest && subtitles.length > 0) {
    active = subtitles.reduce(
      (prev, curr) => (Math.abs(curr.start - time) < Math.abs(prev.start - time) ? curr : prev),
      subtitles[0],
    );
  }
  return active;
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

const BASE_WIDTH = 940;

export function KaraokeCaption({
  subtitles,
  time,
  accent,
  theme = "ink",
  holdNearest = true,
  labels,
  className,
}: KaraokeCaptionProps) {
  const reduce = useReducedMotion() ?? false;
  const active = findSubtitle(subtitles, time, holdNearest);

  const themeVars = { ...(typeof theme === "string" ? storyThemes[theme] : theme) } as StoryVars;
  if (accent) themeVars["--story-accent"] = accent;

  const tokens = active ? tokenize(active.text) : [];
  const duration = active ? active.end - active.start : 0;
  const progress = active && duration > 0 ? (time - active.start) / duration : 0;
  const activeIndex = Math.floor(Math.max(0, Math.min(1, progress)) * tokens.length);

  // 原作字級以 940px 寬為準；容器較窄時用 cqi 等比縮小，內距與圓角用 em 跟著縮
  const px = active ? captionFontSize(active.text.length) : 48;

  return (
    <div
      role="region"
      aria-label={labels?.region ?? "Captions"}
      className={cn("pointer-events-none flex w-full justify-center font-sans [container-type:inline-size]", className)}
      style={themeVars as CSSProperties}
    >
      {/* 螢幕閱讀器每句只念一次，不逐字播報 */}
      <span className="sr-only" role="status" aria-live="polite">
        {active?.text ?? ""}
      </span>
      {active && (
        <div className="flex max-w-full items-center justify-center px-4 text-center" style={{ width: BASE_WIDTH }}>
          <p
            aria-hidden="true"
            className="mx-auto inline-block border text-center leading-tight font-extrabold tracking-wide backdrop-blur"
            style={{
              fontSize: `max(14px, min(${px}px, ${(px / BASE_WIDTH) * 100}cqi))`,
              padding: `${20 / px}em ${36 / px}em`,
              borderRadius: `${26 / px}em`,
              background: "var(--story-panel)",
              borderColor: "var(--story-line)",
              color: "var(--story-text)",
              boxShadow:
                "var(--story-shadow), inset 0 0 0 1px color-mix(in srgb, var(--story-text) 5%, transparent)",
            }}
          >
            {tokens.map((token, index) => {
              const latin = /[A-Za-z0-9]$/.test(token);
              const isActive = index === activeIndex;
              const isSpoken = index < activeIndex;
              return (
                <span
                  key={index}
                  className={cn("inline-block", !reduce && "transition-colors duration-150")}
                  style={{
                    color: isActive
                      ? "var(--story-accent)"
                      : isSpoken
                        ? "var(--story-text)"
                        : "color-mix(in srgb, var(--story-text) 45%, transparent)",
                    marginRight: latin ? "0.26em" : undefined,
                  }}
                >
                  {token}
                </span>
              );
            })}
          </p>
        </div>
      )}
    </div>
  );
}
