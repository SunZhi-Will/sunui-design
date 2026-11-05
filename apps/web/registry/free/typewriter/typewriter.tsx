"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type ElementType, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface TypewriterProps {
  /** 依序打出的句子；預設打完一輪後停在最後一句 */
  phrases: string[];
  /** 固定在前面的文字，例如「我們打造」 */
  prefix?: ReactNode;
  as?: ElementType;
  /** 每個字元的打字毫秒數 */
  typeSpeed?: number;
  /** 每個字元的刪除毫秒數 */
  deleteSpeed?: number;
  /** 每句打完後停留的毫秒數 */
  pause?: number;
  /** 中日韓字元的速度倍率；一個漢字資訊量較大，預設打得慢一些 */
  cjkFactor?: number;
  /** 打完最後一句後回到第一句重來；預設關閉 */
  loop?: boolean;
  /** 墨色細游標；停在最後一句時自動收起 */
  caret?: boolean;
  /** 進入畫面才開始打字 */
  startOnView?: boolean;
  /** 給螢幕閱讀器的完整文字；預設把所有句子串起來 */
  srText?: string;
  phraseClassName?: string;
  lang?: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤；影響字素切分與預設朗讀文字的分隔 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<TypewriterLabels>;
  className?: string;
}

export interface TypewriterLabels {
  /** 預設 srText 串接各句時的分隔 */
  separator: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, TypewriterLabels> = {
  en: { separator: ", " },
  "zh-TW": { separator: "、" },
  "zh-CN": { separator: "、" },
  ja: { separator: "、" },
};

const CJK_RE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
const PUNCT_RE = /[.,!?;:，。！？；：、…]/u;

function graphemes(text: string, locale?: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter(locale, { granularity: "grapheme" });
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
  loop = false,
  caret = true,
  startOnView = true,
  srText,
  phraseClassName,
  lang,
  locale = "en",
  labels,
  className,
}: TypewriterProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  // 以內容當 key，父層每次傳新陣列也不會重置打字進度
  const phraseKey = phrases.join("\u0000");
  const split = useMemo(() => phraseKey.split("\u0000").map((p) => graphemes(p, locale)), [phraseKey, locale]);
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

  const last = split.length - 1;
  const current = split[index] ?? [];
  const isLast = index === last;

  // 減少動態：不逐字打。不循環時直接顯示最後一句，循環時整句切換
  useEffect(() => {
    if (!reduceMotion || !loop || !active || split.length < 2) return;
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % split.length), pause + 1200);
    return () => window.clearTimeout(t);
  }, [reduceMotion, loop, active, split.length, pause, index]);

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

  const longest = useMemo(() => split.reduce((a, b) => (b.length > a.length ? b : a), []).join(""), [split]);
  const shown = reduceMotion
    ? (loop ? current : (split[last] ?? [])).join("")
    : current.slice(0, count).join("");
  // 停在最後一句：游標收起，畫面安靜下來
  const resting = !loop && (reduceMotion || (isLast && count >= current.length && active));
  const fullText = srText ?? [typeof prefix === "string" ? prefix : "", phrases.join(t.separator)].filter(Boolean).join(" ");

  return (
    <Tag
      ref={ref}
      lang={lang}
      aria-live="off"
      className={cn("grid text-3xl font-semibold tracking-tight text-[#171717] dark:text-[#ededed]", className)}
    >
      <span className="sr-only">{fullText}</span>
      {/* 以最長的句子先撐出高度，打字時下方版面不會跳動 */}
      <span aria-hidden="true" className="invisible [grid-area:1/1]">
        {prefix != null && <>{prefix} </>}
        <span className={cn("whitespace-pre-wrap", phraseClassName)}>{longest}</span>
      </span>
      <span aria-hidden="true" className="[grid-area:1/1]">
        {prefix != null && <>{prefix} </>}
        <span className={cn("whitespace-pre-wrap", phraseClassName)}>{shown}</span>
        {caret && (
          <span
            className={cn(
              "ml-[0.06em] inline-block h-[0.95em] w-[1.5px] translate-y-[0.14em] bg-current transition-opacity duration-300",
              resting && "opacity-0",
            )}
          />
        )}
      </span>
    </Tag>
  );
}
