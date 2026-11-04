"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// 設計語言（DESIGN-story.md）：所有顏色走 --story-* 變數，換 theme 即整套換皮
export const storyThemes = {
  ink: {
    "--story-bg": "#0b0e14",
    "--story-panel": "rgb(14 18 28 / 0.86)",
    "--story-line": "rgb(234 228 214 / 0.14)",
    "--story-text": "#eae4d6",
    "--story-muted": "rgb(234 228 214 / 0.6)",
    "--story-accent": "#c9a063",
    "--story-danger": "#c4553f",
  },
  rice: {
    "--story-bg": "#f4efe3",
    "--story-panel": "rgb(250 246 236 / 0.94)",
    "--story-line": "rgb(60 48 32 / 0.18)",
    "--story-text": "#2a2219",
    "--story-muted": "rgb(42 34 25 / 0.6)",
    "--story-accent": "#9a6b2a",
    "--story-danger": "#a33a26",
  },
  moon: {
    "--story-bg": "#0a0d16",
    "--story-panel": "rgb(13 17 30 / 0.86)",
    "--story-line": "rgb(214 224 240 / 0.14)",
    "--story-text": "#e4e8f0",
    "--story-muted": "rgb(228 232 240 / 0.6)",
    "--story-accent": "#a3b8d9",
    "--story-danger": "#c4553f",
  },
} as const;

export type StoryTheme = keyof typeof storyThemes;

export interface DialogueChoice {
  id: string;
  label: ReactNode;
  /** 未達成條件時顯示，例如「Lantern」 */
  requirement?: ReactNode;
  locked?: boolean;
}

export interface DialogueBoxLabels {
  advance?: string;
  choices?: string;
  needs?: (requirement: ReactNode) => ReactNode;
}

export interface DialogueBoxProps {
  speaker?: ReactNode;
  /** 預設：有 speaker 時為 dialogue，否則為 narration */
  variant?: "narration" | "dialogue";
  text: string;
  /** 每秒顯示幾個字 */
  cps?: number;
  autoPlay?: boolean;
  autoDelayMs?: number;
  onAdvance?: () => void;
  choices?: DialogueChoice[];
  onChoose?: (id: string) => void;
  /** 右下角的控制列，例如紀錄、自動、略過 */
  controls?: ReactNode;
  theme?: StoryTheme;
  labels?: DialogueBoxLabels;
  className?: string;
}

const serif = '"Noto Serif TC", "Songti TC", serif';

function isEditable(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
}

export function DialogueBox({
  speaker,
  variant,
  text,
  cps = 40,
  autoPlay = false,
  autoDelayMs = 2200,
  onAdvance,
  choices,
  onChoose,
  controls,
  theme = "ink",
  labels,
  className,
}: DialogueBoxProps) {
  const reduce = useReducedMotion() ?? false;
  const kind = variant ?? (speaker ? "dialogue" : "narration");
  const needs = labels?.needs ?? ((r: ReactNode) => <>【Needs: {r}】</>);
  const chars = useMemo(() => Array.from(text), [text]);
  const [count, setCount] = useState(0);
  const done = count >= chars.length;
  const hasChoices = done && !!choices?.length;

  // 打字機：只往前推進，手動補完後計時器不會倒退
  useEffect(() => {
    if (reduce) {
      setCount(chars.length);
      return;
    }
    setCount(0);
    const start = performance.now();
    const timer = setInterval(() => {
      const n = Math.min(chars.length, Math.floor(((performance.now() - start) / 1000) * cps));
      setCount((c) => Math.max(c, n));
      if (n >= chars.length) clearInterval(timer);
    }, 1000 / cps);
    return () => clearInterval(timer);
  }, [chars, cps, reduce]);

  // 自動播放：整句顯示完畢、沒有選項時才倒數
  useEffect(() => {
    if (!autoPlay || !done || choices?.length) return;
    const timer = setTimeout(() => onAdvance?.(), autoDelayMs);
    return () => clearTimeout(timer);
  }, [autoPlay, done, choices, autoDelayMs, onAdvance, text]);

  // 數字鍵選擇選項
  useEffect(() => {
    if (!hasChoices) return;
    const onKey = (e: KeyboardEvent) => {
      if (isEditable(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const choice = choices![Number(e.key) - 1];
      if (!choice || choice.locked) return;
      e.preventDefault();
      onChoose?.(choice.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasChoices, choices, onChoose]);

  function activate() {
    if (!done) setCount(chars.length);
    else if (!choices?.length) onAdvance?.();
  }

  const nextGlyph = (
    <motion.svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="ml-1 inline-block size-3 align-baseline"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      style={{ color: "var(--story-accent)" }}
      animate={reduce ? { opacity: 1 } : { opacity: [0.35, 1, 0.35] }}
      transition={reduce ? { duration: 0 } : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
    >
      <path d="M8 2.5 12 8l-4 5.5L4 8Z" />
    </motion.svg>
  );

  // 完成時把最後一個字和提示符號綁在一起，避免提示符號單獨換行
  const visible = done ? (
    <>
      {chars.slice(0, -1).join("")}
      <span className="whitespace-nowrap">
        {chars.at(-1)}
        {!hasChoices && nextGlyph}
      </span>
    </>
  ) : (
    <>
      {chars.slice(0, count).join("")}
      <span className="invisible">{chars.slice(count).join("")}</span>
    </>
  );

  const showRing = autoPlay && done && !choices?.length;

  return (
    <div className={cn("relative w-full", className)} style={{ ...(storyThemes[theme] as unknown as CSSProperties), color: "var(--story-text)" }}>
      <div
        className={cn("relative", kind === "dialogue" && "rounded-[3px] border px-5 pt-6 pb-4")}
        style={
          kind === "dialogue"
            ? { background: "var(--story-panel)", borderColor: "var(--story-line)", boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.06)" }
            : undefined
        }
      >
        {kind === "dialogue" && speaker && (
          <span
            className="absolute -top-3 left-4 rounded-[2px] border px-2.5 py-0.5 text-xs tracking-[0.18em]"
            style={{ borderColor: "var(--story-accent)", color: "var(--story-accent)", background: "var(--story-bg)", fontFamily: serif }}
          >
            {speaker}
          </span>
        )}

        <button
          type="button"
          onClick={activate}
          aria-label={labels?.advance ?? "Continue"}
          className="block w-full cursor-pointer text-left outline-none focus-visible:ring-1 focus-visible:ring-[var(--story-accent)] focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
        >
          <p
            aria-hidden="true"
            className={cn("max-w-[34em] text-[15px] leading-[1.8]", kind === "narration" && "italic")}
            style={{ fontFamily: serif, color: kind === "narration" ? "var(--story-muted)" : undefined }}
          >
            {visible}
          </p>
        </button>

        {/* 螢幕閱讀器一次收到整句，不逐字播報 */}
        <p key={text} className="sr-only" aria-live="polite">
          {speaker ? <>{speaker}: </> : null}
          {text}
        </p>

        {hasChoices && (
          <div role="group" aria-label={labels?.choices ?? "Choices"} className="mt-4 flex flex-col gap-2">
            {choices!.map((c, i) => (
              <button
                key={c.id}
                type="button"
                disabled={c.locked}
                onClick={() => onChoose?.(c.id)}
                className="flex items-baseline gap-3 rounded-[3px] border px-3 py-2 text-left text-sm transition-colors duration-[120ms] outline-none hover:border-[var(--story-accent)] focus-visible:border-[var(--story-accent)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[var(--story-line)]"
                style={{ borderColor: "var(--story-line)", fontFamily: serif }}
              >
                <span className="text-xs tabular-nums" style={{ color: "var(--story-accent)" }}>
                  {i + 1}
                </span>
                <span className="flex-1">{c.label}</span>
                {c.locked && c.requirement && (
                  <span className="shrink-0 text-xs" style={{ color: "var(--story-muted)" }}>
                    {needs(c.requirement)}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {(controls || showRing) && (
          <div className="mt-3 flex items-center justify-end gap-3 text-xs" style={{ color: "var(--story-muted)" }}>
            {controls}
            {showRing && (
              <svg key={text} viewBox="0 0 20 20" className="size-4 -rotate-90" aria-hidden="true">
                <circle cx="10" cy="10" r="8" fill="none" stroke="var(--story-line)" strokeWidth="1.5" />
                <motion.circle
                  cx="10"
                  cy="10"
                  r="8"
                  fill="none"
                  stroke="var(--story-accent)"
                  strokeWidth="1.5"
                  initial={{ pathLength: 1 }}
                  animate={{ pathLength: reduce ? 1 : 0 }}
                  transition={{ duration: reduce ? 0 : autoDelayMs / 1000, ease: "linear" }}
                />
              </svg>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
