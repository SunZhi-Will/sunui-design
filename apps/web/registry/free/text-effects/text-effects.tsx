"use client";

import {
  AnimatePresence,
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type Variants,
} from "framer-motion";
import { Fragment, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** 全部效果 id；demo 與文件都從這裡讀 */
export const textEffects = [
  "wave",
  "letter-bounce",
  "blur-in",
  "tracking-in",
  "mask-reveal",
  "scramble",
  "split-flap",
  "word-rotate",
  "flip-3d",
  "gradient-flow",
  "shimmer",
  "glitch",
  "neon-flicker",
  "highlighter",
  "underline-draw",
  "letter-assemble",
  "explode-out",
  "stamp-in",
  "jitter-settle",
  "kinetic-stack",
  "circle-text",
] as const;

export type TextEffectName = (typeof textEffects)[number];
export type TextEffectTrigger = "mount" | "inView" | "hover" | "click" | "loop";

/** 常駐循環的效果；其餘是進場效果（可重播） */
export const loopingTextEffects: readonly TextEffectName[] = [
  "wave",
  "word-rotate",
  "gradient-flow",
  "shimmer",
  "glitch",
  "explode-out",
  "circle-text",
];

export function isLoopingTextEffect(effect: TextEffectName) {
  return loopingTextEffects.includes(effect);
}

// 每個效果的預設時長（秒）與逐字間隔
const base: Record<TextEffectName, { duration: number; stagger: number }> = {
  wave: { duration: 1.4, stagger: 0.07 },
  "letter-bounce": { duration: 0.6, stagger: 0.05 },
  "blur-in": { duration: 0.9, stagger: 0.08 },
  "tracking-in": { duration: 0.9, stagger: 0 },
  "mask-reveal": { duration: 0.8, stagger: 0.12 },
  scramble: { duration: 1.2, stagger: 0 },
  "split-flap": { duration: 1.2, stagger: 0.05 },
  "word-rotate": { duration: 2.2, stagger: 0 },
  "flip-3d": { duration: 0.6, stagger: 0.05 },
  "gradient-flow": { duration: 4, stagger: 0 },
  shimmer: { duration: 2.2, stagger: 0 },
  glitch: { duration: 2.4, stagger: 0 },
  "neon-flicker": { duration: 1.6, stagger: 0 },
  highlighter: { duration: 0.7, stagger: 0 },
  "underline-draw": { duration: 0.8, stagger: 0 },
  "letter-assemble": { duration: 0.9, stagger: 0.03 },
  "explode-out": { duration: 2.2, stagger: 0 },
  "stamp-in": { duration: 0.35, stagger: 0.09 },
  "jitter-settle": { duration: 0.9, stagger: 0.02 },
  "kinetic-stack": { duration: 0.6, stagger: 0.18 },
  "circle-text": { duration: 14, stagger: 0 },
};

const defaultColors = ["var(--chart-1, var(--primary))", "var(--chart-2, var(--ring))", "var(--chart-3, var(--muted-foreground))"];

export interface TextEffectProps {
  text: string;
  effect?: TextEffectName;
  /** 進場效果：何時播放；循環效果：hover / click 時才跑 */
  trigger?: TextEffectTrigger;
  /** 單次動畫（或一個循環週期）的秒數，省略用效果預設 */
  duration?: number;
  /** 開始前延遲（秒） */
  delay?: number;
  /** 逐字（逐詞）間隔秒數，省略用效果預設 */
  stagger?: number;
  /** 漸層、光暈、螢光筆等用色，省略跟隨主題 token */
  colors?: string[];
  /** word-rotate 輪播的詞 */
  words?: string[];
  className?: string;
}

interface InnerProps {
  text: string;
  play: boolean;
  running: boolean;
  reduce: boolean;
  d: number;
  delay: number;
  stagger: number;
  colors: string[];
  words: string[];
}

export function TextEffect({
  text,
  effect = "blur-in",
  trigger = "mount",
  duration,
  delay = 0,
  stagger,
  colors = defaultColors,
  words = ["faster", "simpler", "together"],
  className,
}: TextEffectProps) {
  const reduce = useReducedMotion() ?? false;
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.3 });
  const visible = useInView(ref, { amount: 0 });
  const [hovered, setHovered] = useState(false);
  const [toggled, setToggled] = useState(false);
  const [cycle, setCycle] = useState(0);

  const looping = isLoopingTextEffect(effect);
  const d = duration ?? base[effect].duration;
  const st = stagger ?? base[effect].stagger;
  const count = Array.from(text).length;

  // 進場效果是否顯示；hover / click 一開始就顯示，觸發時重播
  const play = trigger === "inView" ? seen : true;
  // 循環效果是否在跑：離開畫面一律暫停
  const running =
    !reduce && visible && (trigger === "hover" ? hovered : trigger === "click" ? toggled : trigger === "inView" ? seen : true);

  // trigger="loop" 的進場效果：在畫面內定期重播
  useEffect(() => {
    if (looping || trigger !== "loop" || reduce || !visible) return;
    const ms = (delay + d + st * count + 1.8) * 1000;
    const id = setInterval(() => setCycle((c) => c + 1), ms);
    return () => clearInterval(id);
  }, [looping, trigger, reduce, visible, delay, d, st, count]);

  // click 觸發：循環效果切換開關，進場效果重播
  const fire = () => {
    setToggled((v) => !v);
    if (!looping && !reduce) setCycle((c) => c + 1);
  };

  const inner: InnerProps = { text, play, running, reduce, d, delay, stagger: st, colors, words };
  const Effect = renderers[effect];
  const srText = effect === "word-rotate" ? `${text} ${words.join(", ")}` : text;

  return (
    <span
      ref={ref}
      className={cn("relative inline-block", (trigger === "hover" || trigger === "click") && "cursor-pointer", className)}
      onMouseEnter={
        trigger === "hover"
          ? () => {
              setHovered(true);
              if (!looping && !reduce) setCycle((c) => c + 1);
            }
          : undefined
      }
      onMouseLeave={trigger === "hover" ? () => setHovered(false) : undefined}
      role={trigger === "click" ? "button" : undefined}
      tabIndex={trigger === "click" ? 0 : undefined}
      onClick={trigger === "click" ? fire : undefined}
      onKeyDown={
        trigger === "click"
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fire();
              }
            }
          : undefined
      }
    >
      <span className="sr-only">{srText}</span>
      <span aria-hidden="true" className="inline-block">
        <Effect key={cycle} {...inner} />
      </span>
    </span>
  );
}

/* ---------- 共用小工具 ---------- */

/** 以索引產生穩定的偽亂數（0 到 1），SSR 與 client 一致 */
function rand(i: number, salt = 1) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** 進場效果的 initial / animate；reduced motion 直接停在最終狀態 */
function enter(play: boolean, reduce: boolean) {
  return { initial: reduce ? (false as const) : "hidden", animate: reduce || play ? "show" : "hidden" };
}

/** 依空白切成不換行的詞組，逐字呼叫 render，保留自然換行 */
function Split({ text, render }: { text: string; render: (ch: string, i: number) => ReactNode }) {
  const groups = useMemo(() => {
    let start = 0;
    return text.split(" ").map((w) => {
      const chars = Array.from(w);
      const g = { chars, start };
      start += chars.length + 1;
      return g;
    });
  }, [text]);
  return (
    <>
      {groups.map((g, wi) => (
        <Fragment key={wi}>
          {wi > 0 && " "}
          {/* 中日文沒有空白，逐字可換行；拉丁字以詞為單位不拆開 */}
          {CJK.test(g.chars.join("")) ? (
            g.chars.map((c, ci) => render(c, g.start + ci))
          ) : (
            <span className="inline-block whitespace-nowrap">{g.chars.map((c, ci) => render(c, g.start + ci))}</span>
          )}
        </Fragment>
      ))}
    </>
  );
}

const CJK = /[\u3000-\u9fff\uac00-\ud7af\uff00-\uffef]/;
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=?";

/* ---------- 各效果 ---------- */

function Wave({ text, running, d, stagger }: InnerProps) {
  return (
    <Split
      text={text}
      render={(c, i) => (
        <motion.span
          key={i}
          className="inline-block"
          animate={running ? { y: ["0em", "-0.28em", "0em"] } : { y: "0em" }}
          transition={running ? { duration: d, repeat: Infinity, ease: "easeInOut", delay: i * stagger } : { duration: 0.3 }}
        >
          {c}
        </motion.span>
      )}
    />
  );
}

const bounceVariants: Variants = {
  hidden: { opacity: 0, y: "0.5em" },
  show: (c: { i: number; d: number; s: number; delay: number }) => ({
    opacity: 1,
    y: ["0.5em", "-0.4em", "0em"],
    transition: { duration: c.d, times: [0, 0.55, 1], ease: "easeOut", delay: c.delay + c.i * c.s },
  }),
};

function LetterBounce({ text, play, reduce, d, delay, stagger }: InnerProps) {
  return (
    <Split
      text={text}
      render={(c, i) => (
        <motion.span key={i} className="inline-block" variants={bounceVariants} custom={{ i, d, s: stagger, delay }} {...enter(play, reduce)}>
          {c}
        </motion.span>
      )}
    />
  );
}

const blurVariants: Variants = {
  hidden: { opacity: 0, filter: "blur(12px)", scale: 1.06 },
  show: (c: { i: number; d: number; s: number; delay: number }) => ({
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    transition: { duration: c.d, ease: [0.2, 0.65, 0.3, 1], delay: c.delay + c.i * c.s },
  }),
};

function BlurIn({ text, play, reduce, d, delay, stagger }: InnerProps) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          <motion.span className="inline-block" variants={blurVariants} custom={{ i, d, s: stagger, delay }} {...enter(play, reduce)}>
            {w}
          </motion.span>
        </Fragment>
      ))}
    </>
  );
}

function TrackingIn({ text, play, reduce, d, delay }: InnerProps) {
  const variants: Variants = {
    hidden: { letterSpacing: "0.6em", opacity: 0 },
    show: { letterSpacing: "0em", opacity: 1, transition: { duration: d, delay, ease: [0.2, 0.7, 0.2, 1] } },
  };
  return (
    <motion.span className="inline-block" variants={variants} {...enter(play, reduce)}>
      {text}
    </motion.span>
  );
}

const maskVariants: Variants = {
  hidden: { y: "110%" },
  show: (c: { i: number; d: number; s: number; delay: number }) => ({
    y: "0%",
    transition: { duration: c.d, ease: [0.2, 0.8, 0.2, 1], delay: c.delay + c.i * c.s },
  }),
};

/** 用 \n 分行，每行從遮罩線下方滑上來 */
function MaskReveal({ text, play, reduce, d, delay, stagger }: InnerProps) {
  return (
    <span className="inline-flex flex-col">
      {text.split("\n").map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em]">
          <motion.span className="block" variants={maskVariants} custom={{ i, d, s: stagger, delay }} {...enter(play, reduce)}>
            {line}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

function Scramble({ text, play, reduce, d, delay }: InnerProps) {
  const chars = useMemo(() => Array.from(text), [text]);
  const [raw, setProgress] = useState(0);
  const progress = reduce ? chars.length : raw;
  const [seed, setSeed] = useState(0);

  useEffect(() => {
    if (reduce || !play) return;
    let raf = 0;
    let startAt = 0;
    let last = 0;
    const step = (t: number) => {
      if (!startAt) startAt = t + delay * 1000;
      const p = Math.max(0, (t - startAt) / (d * 1000));
      // 約每 45ms 換一次亂碼，避免閃得太兇
      if (t - last > 45) {
        last = t;
        setSeed((s) => s + 1);
      }
      setProgress(Math.min(chars.length, p * chars.length));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [play, reduce, d, delay, chars.length]);

  return (
    <span className="inline-block tabular-nums">
      {chars.map((c, i) =>
        c === " " || i < progress ? (
          <Fragment key={i}>{c}</Fragment>
        ) : (
          <span key={i} className="opacity-60">
            {GLYPHS[Math.floor(rand(i, seed) * GLYPHS.length)]}
          </span>
        ),
      )}
    </span>
  );
}

function SplitFlap({ text, play, reduce, d, delay, stagger }: InnerProps) {
  const chars = useMemo(() => Array.from(text.toUpperCase()), [text]);
  const tickMs = 60;
  const landAt = (i: number) => Math.round((d * 1000 * 0.6 + i * stagger * 1000) / tickMs);
  const last = landAt(chars.length - 1);
  const [rawTick, setTick] = useState(-1);
  const tick = reduce ? Number.MAX_SAFE_INTEGER : rawTick;

  useEffect(() => {
    if (reduce || !play) return;
    let id: ReturnType<typeof setInterval> | undefined;
    const t = setTimeout(() => {
      id = setInterval(() => setTick((k) => (k >= last ? k : k + 1)), tickMs);
    }, delay * 1000);
    return () => {
      clearTimeout(t);
      if (id) clearInterval(id);
    };
  }, [play, reduce, delay, last]);

  return (
    <span className="inline-flex flex-wrap gap-[0.08em]" style={{ perspective: 400 }}>
      {chars.map((c, i) => {
        const landed = tick >= landAt(i);
        const shown = c === " " ? " " : landed ? c : tick < 0 ? " " : GLYPHS[Math.floor(rand(i, tick) * GLYPHS.length)];
        if (c === " ") return <span key={i} className="inline-block w-[0.4em]" />;
        return (
          <span
            key={i}
            className="relative inline-grid min-w-[0.9em] place-items-center px-[0.04em] overflow-hidden rounded-[0.12em] border border-border bg-muted font-mono leading-[1.3]"
          >
            <motion.span
              key={landed ? "final" : tick}
              className="inline-block"
              initial={reduce ? false : { rotateX: -90 }}
              animate={{ rotateX: 0 }}
              transition={{ duration: 0.05 }}
            >
              {shown}
            </motion.span>
            {/* 翻牌中線 */}
            <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-border" />
          </span>
        );
      })}
    </span>
  );
}

function WordRotate({ text, running, d, words }: InnerProps) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!running || words.length < 2) return;
    const id = setInterval(() => setIndex((n) => (n + 1) % words.length), d * 1000);
    return () => clearInterval(id);
  }, [running, d, words.length]);

  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-[0.25em]">
      {text && <span>{text}</span>}
      <span className="relative inline-grid overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={index}
            className="inline-block whitespace-nowrap text-primary"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {words[index] ?? ""}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}

const flipVariants: Variants = {
  hidden: { rotateX: -100, opacity: 0 },
  show: (c: { i: number; d: number; s: number; delay: number }) => ({
    rotateX: 0,
    opacity: 1,
    transition: { duration: c.d, ease: [0.2, 0.8, 0.2, 1], delay: c.delay + c.i * c.s },
  }),
};

function Flip3D({ text, play, reduce, d, delay, stagger }: InnerProps) {
  return (
    <span className="inline-block" style={{ perspective: 600 }}>
      <Split
        text={text}
        render={(c, i) => (
          <motion.span
            key={i}
            className="inline-block origin-bottom"
            variants={flipVariants}
            custom={{ i, d, s: stagger, delay }}
            {...enter(play, reduce)}
          >
            {c}
          </motion.span>
        )}
      />
    </span>
  );
}

const clipText: CSSProperties = { backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" };

function GradientFlow({ text, running, d, colors }: InnerProps) {
  const stops = [...colors, colors[0]].join(", ");
  return (
    <motion.span
      className="inline-block"
      style={{ ...clipText, backgroundImage: `linear-gradient(90deg, ${stops})`, backgroundSize: "200% 100%" }}
      animate={running ? { backgroundPosition: ["0% 50%", "-200% 50%"] } : { backgroundPosition: "0% 50%" }}
      transition={running ? { duration: d, repeat: Infinity, ease: "linear" } : { duration: 0 }}
    >
      {text}
    </motion.span>
  );
}

/** 底色是 currentColor（預設 muted），亮帶用 foreground */
function Shimmer({ text, running, d }: InnerProps) {
  return (
    <motion.span
      className="inline-block text-muted-foreground"
      style={{
        ...clipText,
        backgroundColor: "currentColor",
        backgroundImage: "linear-gradient(110deg, transparent 35%, var(--foreground) 50%, transparent 65%)",
        backgroundSize: "250% 100%",
        backgroundRepeat: "no-repeat",
      }}
      animate={running ? { backgroundPosition: ["150% 0%", "-50% 0%"] } : { backgroundPosition: "150% 0%" }}
      transition={running ? { duration: d * 0.6, repeat: Infinity, repeatDelay: d * 0.4, ease: "easeInOut" } : { duration: 0 }}
    >
      {text}
    </motion.span>
  );
}

function Glitch({ text, running, d, colors }: InnerProps) {
  // 紅藍分色是 RGB 錯位的慣例色，可由 colors[3]、colors[4] 覆寫
  const red = colors[3] ?? "#ff3344";
  const cyan = colors[4] ?? "#22d3ee";
  const t = { duration: d * 0.25, repeat: Infinity, repeatDelay: d * 0.75, ease: "linear" as const };
  const slices = ["inset(0 0 100% 0)", "inset(15% 0 60% 0)", "inset(55% 0 20% 0)", "inset(35% 0 45% 0)", "inset(70% 0 5% 0)", "inset(0 0 100% 0)"];
  return (
    <span className="relative inline-block">
      <motion.span
        className="relative inline-block"
        animate={running ? { x: [0, -2, 2, -1, 0], skewX: [0, 6, -4, 0, 0] } : { x: 0, skewX: 0 }}
        transition={running ? t : { duration: 0 }}
      >
        {text}
      </motion.span>
      {running && (
        <>
          <motion.span
            className="pointer-events-none absolute inset-0 inline-block mix-blend-multiply dark:mix-blend-screen"
            style={{ color: red }}
            animate={{ x: [0, -4, 3, -5, 2, 0], clipPath: slices }}
            transition={t}
          >
            {text}
          </motion.span>
          <motion.span
            className="pointer-events-none absolute inset-0 inline-block mix-blend-multiply dark:mix-blend-screen"
            style={{ color: cyan }}
            animate={{ x: [0, 4, -3, 5, -2, 0], clipPath: [...slices].reverse() }}
            transition={t}
          >
            {text}
          </motion.span>
        </>
      )}
    </span>
  );
}

function NeonFlicker({ text, play, reduce, d, delay, colors }: InnerProps) {
  const c = colors[0];
  const glow = `0 0 2px ${c}, 0 0 8px color-mix(in oklch, ${c} 70%, transparent), 0 0 22px color-mix(in oklch, ${c} 50%, transparent)`;
  const variants: Variants = {
    hidden: { opacity: 0.15, textShadow: "0 0 0px transparent" },
    show: {
      opacity: [0.15, 1, 0.2, 1, 0.1, 0.9, 0.35, 1],
      textShadow: [
        "0 0 0px transparent",
        glow,
        "0 0 0px transparent",
        glow,
        "0 0 0px transparent",
        glow,
        "0 0 0px transparent",
        glow,
      ],
      transition: { duration: d, delay, times: [0, 0.1, 0.18, 0.3, 0.42, 0.55, 0.7, 1], ease: "linear" },
    },
  };
  return (
    <motion.span className="inline-block" style={{ color: c }} variants={variants} {...enter(play, reduce)}>
      {text}
    </motion.span>
  );
}

function Highlighter({ text, play, reduce, d, delay, colors }: InnerProps) {
  const band = colors[1] ? `color-mix(in oklch, ${colors[1]} 35%, transparent)` : "var(--muted)";
  const variants: Variants = {
    hidden: { scaleX: 0 },
    show: { scaleX: 1, transition: { duration: d, delay, ease: [0.6, 0, 0.3, 1] } },
  };
  return (
    <span className="relative inline-block px-[0.15em]">
      <motion.span
        className="absolute inset-x-0 bottom-[0.08em] top-[0.35em] origin-left -skew-x-6 rounded-[0.15em]"
        style={{ backgroundColor: band }}
        variants={variants}
        {...enter(play, reduce)}
      />
      <span className="relative">{text}</span>
    </span>
  );
}

function UnderlineDraw({ text, play, reduce, d, delay, colors }: InnerProps) {
  const variants: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    show: { pathLength: 1, opacity: 1, transition: { duration: d, delay, ease: "easeInOut" } },
  };
  return (
    <span className="relative inline-block pb-[0.18em]">
      {text}
      <svg className="absolute inset-x-0 bottom-0 h-[0.3em] w-full overflow-visible" viewBox="0 0 100 10" preserveAspectRatio="none">
        <motion.path
          d="M2 6 C 25 2, 50 9, 75 4 S 98 5, 98 5"
          fill="none"
          stroke={colors[1] ?? "currentColor"}
          strokeWidth="2.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          variants={variants}
          {...enter(play, reduce)}
        />
      </svg>
    </span>
  );
}

const assembleVariants: Variants = {
  hidden: (c: { i: number }) => ({
    opacity: 0,
    x: `${(rand(c.i, 1) - 0.5) * 6}em`,
    y: `${(rand(c.i, 2) - 0.5) * 4}em`,
    rotate: (rand(c.i, 3) - 0.5) * 180,
    scale: 0.6,
  }),
  show: (c: { i: number; d: number; s: number; delay: number }) => ({
    opacity: 1,
    x: "0em",
    y: "0em",
    rotate: 0,
    scale: 1,
    transition: { type: "spring", duration: c.d, bounce: 0.25, delay: c.delay + c.i * c.s },
  }),
};

function LetterAssemble({ text, play, reduce, d, delay, stagger }: InnerProps) {
  return (
    <Split
      text={text}
      render={(c, i) => (
        <motion.span key={i} className="inline-block" variants={assembleVariants} custom={{ i, d, s: stagger, delay }} {...enter(play, reduce)}>
          {c}
        </motion.span>
      )}
    />
  );
}

function ExplodeOut({ text, running, d }: InnerProps) {
  return (
    <Split
      text={text}
      render={(c, i) => {
        const dx = `${(rand(i, 4) - 0.5) * 5}em`;
        const dy = `${(rand(i, 5) - 0.5) * 4}em`;
        const r = (rand(i, 6) - 0.5) * 240;
        return (
          <motion.span
            key={i}
            className="inline-block"
            animate={
              running
                ? { x: ["0em", dx, "0em"], y: ["0em", dy, "0em"], rotate: [0, r, 0], opacity: [1, 0.25, 1] }
                : { x: "0em", y: "0em", rotate: 0, opacity: 1 }
            }
            transition={
              running
                ? { duration: d * 0.6, times: [0, 0.35, 1], ease: ["easeOut", [0.3, 1.4, 0.5, 1]], repeat: Infinity, repeatDelay: d * 0.4 }
                : { duration: 0.3 }
            }
          >
            {c}
          </motion.span>
        );
      }}
    />
  );
}

const stampVariants: Variants = {
  hidden: { opacity: 0, scale: 2 },
  show: (c: { i: number; d: number; s: number; delay: number }) => ({
    opacity: 1,
    scale: [2, 0.88, 1],
    transition: { duration: c.d, times: [0, 0.7, 1], ease: ["easeIn", "easeOut"], delay: c.delay + c.i * c.s },
  }),
};

function StampIn({ text, play, reduce, d, delay, stagger }: InnerProps) {
  return (
    <Split
      text={text}
      render={(c, i) => (
        <motion.span key={i} className="inline-block" variants={stampVariants} custom={{ i, d, s: stagger, delay }} {...enter(play, reduce)}>
          {c}
        </motion.span>
      )}
    />
  );
}

const jitterVariants: Variants = {
  hidden: { opacity: 0 },
  show: (c: { i: number; d: number; s: number; delay: number }) => {
    const a = 0.12 + rand(c.i, 7) * 0.1;
    const sx = rand(c.i, 8) > 0.5 ? 1 : -1;
    return {
      opacity: 1,
      x: [0, -a, a, -a * 0.7, a * 0.5, -a * 0.25, 0].map((v) => `${v * sx}em`),
      y: [0, a * 0.6, -a * 0.6, a * 0.4, -a * 0.2, 0, 0].map((v) => `${v}em`),
      rotate: [0, -8, 7, -5, 3, -1, 0].map((v) => v * sx),
      transition: { duration: c.d, ease: "linear", delay: c.delay + c.i * c.s, opacity: { duration: 0.1, delay: c.delay + c.i * c.s } },
    };
  },
};

function JitterSettle({ text, play, reduce, d, delay, stagger }: InnerProps) {
  return (
    <Split
      text={text}
      render={(c, i) => (
        <motion.span key={i} className="inline-block" variants={jitterVariants} custom={{ i, d, s: stagger, delay }} {...enter(play, reduce)}>
          {c}
        </motion.span>
      )}
    />
  );
}

const stackVariants: Variants = {
  hidden: (c: { i: number }) => ({ opacity: 0, x: c.i % 2 ? "60%" : "-60%", scale: 1.3 }),
  show: (c: { i: number; d: number; s: number; delay: number }) => ({
    opacity: 1,
    x: "0%",
    scale: 1,
    transition: { type: "spring", duration: c.d, bounce: 0.3, delay: c.delay + c.i * c.s },
  }),
};

function KineticStack({ text, play, reduce, d, delay, stagger }: InnerProps) {
  return (
    <span className="inline-flex flex-col items-start leading-[0.95]">
      {text.split(/\s+/).map((w, i) => (
        <motion.span key={i} className="block" variants={stackVariants} custom={{ i, d, s: stagger, delay }} {...enter(play, reduce)}>
          {w}
        </motion.span>
      ))}
    </span>
  );
}

/** 文字排在圓環上慢慢轉；暫停時保留目前角度 */
function CircleText({ text, running, d }: InnerProps) {
  const rotate = useMotionValue(0);
  const transform = useTransform(rotate, (r) => `rotate(${r}deg)`);
  useAnimationFrame((_, delta) => {
    if (running) rotate.set((rotate.get() + (delta / 1000) * (360 / d)) % 360);
  });
  const id = `sunui-circle-${useId().replace(/:/g, "")}`;
  const r = 38;
  const circumference = 2 * Math.PI * r;
  const label = text.endsWith(" ") ? text : `${text} · `;
  return (
    <motion.svg viewBox="0 0 100 100" className="block size-[6em]" style={{ transform }}>
      <defs>
        <path id={id} d={`M50 ${50 - r} a${r} ${r} 0 1 1 0 ${2 * r} a${r} ${r} 0 1 1 0 ${-2 * r}`} />
      </defs>
      <text fill="currentColor" fontSize="11" fontWeight="600" letterSpacing="0.5">
        <textPath href={`#${id}`} textLength={circumference - 2} lengthAdjust="spacing">
          {label}
        </textPath>
      </text>
    </motion.svg>
  );
}

const renderers: Record<TextEffectName, (p: InnerProps) => ReactNode> = {
  wave: Wave,
  "letter-bounce": LetterBounce,
  "blur-in": BlurIn,
  "tracking-in": TrackingIn,
  "mask-reveal": MaskReveal,
  scramble: Scramble,
  "split-flap": SplitFlap,
  "word-rotate": WordRotate,
  "flip-3d": Flip3D,
  "gradient-flow": GradientFlow,
  shimmer: Shimmer,
  glitch: Glitch,
  "neon-flicker": NeonFlicker,
  highlighter: Highlighter,
  "underline-draw": UnderlineDraw,
  "letter-assemble": LetterAssemble,
  "explode-out": ExplodeOut,
  "stamp-in": StampIn,
  "jitter-settle": JitterSettle,
  "kinetic-stack": KineticStack,
  "circle-text": CircleText,
};
