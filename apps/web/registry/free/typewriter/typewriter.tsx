"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type ElementType, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface TypewriterProps {
  /** 要輪播的句子 */
  phrases: string[];
  /** 固定在前面的文字，例如「我們打造」 */
  prefix?: ReactNode;
  as?: ElementType;
  /** 每個字元的打字毫秒數 */
  typeSpeed?: number;
  /** 每個字元的刪除毫秒數 */
  deleteSpeed?: number;
  /** 打完後停留的毫秒數 */
  pause?: number;
  /** 中日韓字元的速度倍率；一個漢字資訊量較大，預設打得慢一些 */
  cjkFactor?: number;
  loop?: boolean;
  caret?: "bar" | "block" | "underscore" | "none";
  /** 進入畫面才開始打字 */
  startOnView?: boolean;
  /** 給螢幕閱讀器的完整文字；預設把所有句子串起來 */
  srText?: string;
  phraseClassName?: string;
  lang?: string;
  className?: string;
}

const CJK_RE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
const PUNCT_RE = /[.,!?;:，。！？；：、…]/u;

function graphemes(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return Array.from(seg.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

export function Typewriter({
  phrases,
  prefix,
  as: Tag = "p",
  typeSpeed = 70,
  deleteSpeed = 35,
  pause = 1600,
  cjkFactor = 1.6,
  loop = true,
  caret = "bar",
  startOnView = true,
  srText,
  phraseClassName,
  lang,
  className,
}: TypewriterProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  // 以內容當 key，父層每次傳新陣列也不會重置打字進度
  const phraseKey = phrases.join("\u0000");
  const split = useMemo(() => phraseKey.split("\u0000").map(graphemes), [phraseKey]);
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [active, setActive] = useState(!startOnView);

  useEffect(() => {
    if (!startOnView || active) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setActive(true);
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [startOnView, active]);

  const current = split[index] ?? [];
  const isLast = index === split.length - 1;

  // 減少動態：整句直接切換，不逐字打
  useEffect(() => {
    if (!reduceMotion || !active || split.length < 2) return;
    if (!loop && isLast) return;
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % split.length), pause + 1200);
    return () => window.clearTimeout(t);
  }, [reduceMotion, active, split.length, loop, isLast, pause, index]);

  useEffect(() => {
    if (reduceMotion || !active || current.length === 0) return;
    let delay: number;
    let step: () => void;

    if (!deleting && count < current.length) {
      const ch = current[count];
      const base = typeSpeed * (CJK_RE.test(ch) ? cjkFactor : 1);
      // 以位置產生固定的節奏變化，避免 render 中使用亂數
      const jitter = ((count * 37) % 5) * 0.08 * typeSpeed;
      const prev = current[count - 1];
      delay = base + jitter + (prev && PUNCT_RE.test(prev) ? typeSpeed * 3 : 0);
      step = () => setCount((c) => c + 1);
    } else if (!deleting) {
      if (split.length < 2 || (!loop && isLast)) return;
      delay = pause;
      step = () => setDeleting(true);
    } else if (count > 0) {
      delay = deleteSpeed;
      step = () => setCount((c) => c - 1);
    } else {
      delay = typeSpeed * 4;
      step = () => {
        setDeleting(false);
        setIndex((i) => (i + 1) % split.length);
      };
    }
    const t = window.setTimeout(step, delay);
    return () => window.clearTimeout(t);
  }, [reduceMotion, active, current, count, deleting, typeSpeed, deleteSpeed, pause, cjkFactor, loop, isLast, split.length]);

  const shown = reduceMotion ? current.join("") : current.slice(0, count).join("");
  const fullText = srText ?? [typeof prefix === "string" ? prefix : "", phrases.join(", ")].filter(Boolean).join(" ");

  return (
    <Tag ref={ref} lang={lang} aria-live="off" className={cn("text-3xl font-semibold tracking-tight text-foreground", className)}>
      <span className="sr-only">{fullText}</span>
      <span aria-hidden="true">
        {prefix != null && <>{prefix} </>}
        <span className={cn("whitespace-pre-wrap", phraseClassName)}>{shown}</span>
        {caret !== "none" && (
          <span
            className={cn(
              "ml-0.5 inline-block bg-current align-baseline",
              caret === "bar" && "h-[1em] w-[0.08em] translate-y-[0.12em]",
              caret === "block" && "h-[1em] w-[0.55em] translate-y-[0.12em] opacity-70",
              caret === "underscore" && "h-[0.08em] w-[0.6em]",
              !reduceMotion && "animate-[sunui-caret_1s_steps(1,end)_infinite]",
            )}
          />
        )}
      </span>
      <style href="sunui-caret" precedence="default">{`@keyframes sunui-caret { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }`}</style>
    </Tag>
  );
}
