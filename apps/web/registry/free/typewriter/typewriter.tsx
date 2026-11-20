"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type ElementType, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface TypewriterProps {
  /** Phrases typed out in order; by default stops on the last one after one pass */
  phrases: string[];
  /** Text fixed in front, e.g. "We build" */
  prefix?: ReactNode;
  as?: ElementType;
  /** Milliseconds per character when typing */
  typeSpeed?: number;
  /** Milliseconds per character when deleting */
  deleteSpeed?: number;
  /** Milliseconds to hold after each phrase is typed */
  pause?: number;
  /** Speed multiplier for CJK characters; a single Han character carries more information, so by default they type slower */
  cjkFactor?: number;
  /** After the last phrase, return to the first and start again; off by default */
  loop?: boolean;
  /** Thin cursor in the text colour; hides automatically when resting on the last phrase */
  caret?: boolean;
  /** Start typing only once it enters the viewport */
  startOnView?: boolean;
  /** Full text for screen readers; by default all phrases joined together */
  srText?: string;
  phraseClassName?: string;
  lang?: string;
  /** UI language: en, zh-TW, zh-CN, ja. Tags such as zh-Hant-HK and ja-JP are also accepted; affects grapheme splitting and the separator in the default spoken text */
  locale?: string;
  /** Overrides the built-in strings. Takes priority over locale */
  labels?: Partial<TypewriterLabels>;
  className?: string;
}

export interface TypewriterLabels {
  /** Separator used when the default srText joins the phrases */
  separator: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Maps any language tag to one of the four built-in languages, falling back to English */
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
  // Keyed on content, so a new array from the parent on every render does not reset typing progress
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

  // Reduced motion: no per-character typing. Without looping it shows the last phrase directly; with looping it switches whole phrases
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
  // Derive a fixed rhythm variation from position, avoiding random numbers during render
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
  // Resting on the last phrase: the cursor hides and the screen goes quiet
  const resting = !loop && (reduceMotion || (isLast && count >= current.length && active));
  const fullText = srText ?? [typeof prefix === "string" ? prefix : "", phrases.join(t.separator)].filter(Boolean).join(" ");

  return (
    <Tag
      ref={ref}
      lang={lang}
      aria-live="off"
      className={cn("grid text-3xl font-semibold tracking-tight text-foreground", className)}
    >
      <span className="sr-only">{fullText}</span>
      {/* The longest phrase reserves the height first, so the layout below does not jump while typing */}
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
