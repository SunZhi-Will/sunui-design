"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

// 移植自 死神的祝福 src/presentation/fate/fate-dial.tsx、fate-odds.ts 的擲骰時間軸，
// 與 main.css 的 wm-fate- 樣式：墨色命盤。純 SVG，指針先轉數圈停在裸骰，
// 修正以金弧一段一段推到最終命數，經過哪一區那一區先亮淡光，落定時一滴金墨停在結果區。

export interface InkFateSegment {
  id: string;
  /** 寫在扇區內側的字 */
  label: string;
  /** 在命數尺上的區間 [from, to) */
  from: number;
  to: number;
  fill?: string;
  activeFill?: string;
  text?: string;
}

export interface InkFateModifier {
  label: string;
  value: number;
  /** 修正總和超過上限時補上的那一步 */
  isCap?: boolean;
}

export type InkFatePhase = "spin" | "modifiers" | "land" | "done";

export interface InkFateFrame {
  phase: InkFatePhase;
  displayRaw: number;
  displayScore: number;
  needleAngle: number;
  revealedSteps: number;
  currentSegment: string;
  landed: boolean;
  /** 目前正在揭示的修正（spin 階段為 undefined） */
  currentStep?: InkFateModifier;
}

/** DESIGN-story.md 的 token；本元件原作是月光藍，所以預設 moon */
export const storyThemes = {
  ink: {
    "--story-bg": "#0b0e14",
    "--story-text": "#eae4d6",
    "--story-muted": "rgb(234 228 214 / 0.6)",
    "--story-accent": "#c9a063",
    "--story-danger": "#c4553f",
  },
  rice: {
    "--story-bg": "#f4efe3",
    "--story-text": "#2a2219",
    "--story-muted": "rgb(42 34 25 / 0.6)",
    "--story-accent": "#9a6b2a",
    "--story-danger": "#a33a26",
  },
  moon: {
    "--story-bg": "#070a12",
    "--story-text": "#e9edf5",
    "--story-muted": "rgb(233 237 245 / 0.6)",
    "--story-accent": "#a3b8d9",
    "--story-danger": "#af637a",
  },
} as const;

export type StoryTheme = keyof typeof storyThemes;

export interface InkFateDialProps {
  /** 1 到 100 的裸骰；省略時盤面中央顯示 centreLabel，不畫指針 */
  rawRoll?: number;
  /** 依序揭示的修正 */
  modifiers?: readonly InkFateModifier[];
  /** 修正總和上限（正負），預設 20；超過時補一步把分數拉回 */
  modifierCap?: number;
  /** 覆寫要點亮的結果區 id；預設由最終命數落在哪一區決定 */
  outcome?: string;
  /** 重擲時另一顆骰的最終命數，畫成淡墨殘影 */
  ghostScore?: number;
  /** 盤面分區，預設逆、變、成、奇 */
  segments?: readonly InkFateSegment[];
  /** 命數尺上限，預設 120（100 加上修正上限 20） */
  scaleMax?: number;
  /** true 時跑擲骰時間軸；換一次 rollKey 就重擲一次 */
  rolling?: boolean;
  rollKey?: string | number;
  /** 擲骰中按 Esc 或點盤面可跳過，預設 true */
  skippable?: boolean;
  onFrame?: (frame: InkFateFrame) => void;
  onSettle?: (result: { segment: string; finalScore: number }) => void;
  /** 繪製尺寸（px），viewBox 不變所以等比縮放 */
  size?: number;
  /** 月光色，覆寫主題的 --story-accent */
  moon?: string;
  moonBright?: string;
  /** 配色主題，預設 moon（原作的月光藍） */
  theme?: StoryTheme;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<InkFateDialLabels>;
  className?: string;
  style?: CSSProperties;
}

export interface InkFateDialLabels {
  /** 還沒擲骰時盤面中央的字 */
  noRoll: string;
  /** 跳過動畫按鈕的無障礙名稱 */
  skip: string;
  /** 有給才把盤面當成圖片並用這段文字描述 */
  dial?: string;
  /** 修正總和超過上限時補上那一步的名稱 */
  cap: (cap: number) => string;
  /** 預設分區的字，依分區 id */
  segments: Record<string, string>;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, InkFateDialLabels> = {
  en: {
    noRoll: "Fate",
    skip: "Skip the roll animation",
    cap: (cap) => `Modifier cap ±${cap}`,
    segments: { adverse: "Woe", mixed: "Twist", success: "Pass", wonder: "Boon" },
  },
  "zh-TW": {
    noRoll: "定",
    skip: "跳過擲骰動畫",
    cap: (cap) => `修正上限 ±${cap}`,
    segments: { adverse: "逆", mixed: "變", success: "成", wonder: "奇" },
  },
  "zh-CN": {
    noRoll: "定",
    skip: "跳过掷骰动画",
    cap: (cap) => `修正上限 ±${cap}`,
    segments: { adverse: "逆", mixed: "变", success: "成", wonder: "奇" },
  },
  ja: {
    noRoll: "定",
    skip: "ダイスのアニメーションを飛ばす",
    cap: (cap) => `補正上限 ±${cap}`,
    segments: { adverse: "逆", mixed: "変", success: "成", wonder: "奇" },
  },
};

const SIZE = 260;
const CENTER = SIZE / 2;
const RING_OUTER = 116;
const RING_INNER = 100;
const DISC_OUTER = 92;
const DISC_INNER = 38;
const LABEL_RADIUS = 58;
const DROP_RADIUS = 82;

/** 預設分區（英文字）；沒給 segments 時元件會依 locale 換成對應語言的字 */
export const INK_FATE_SEGMENTS: InkFateSegment[] = [
  // 顏色全部由 --story-* 混出：代價用 danger，其餘是 accent 的深淺
  { id: "adverse", label: "Woe", from: 0, to: 29.5, fill: "color-mix(in srgb, var(--story-danger) 24%, transparent)", activeFill: "color-mix(in srgb, var(--story-danger) 50%, transparent)", text: "color-mix(in srgb, var(--story-danger) 60%, var(--story-text))" },
  { id: "mixed", label: "Twist", from: 29.5, to: 59.5, fill: "color-mix(in srgb, var(--story-text) 8%, transparent)", activeFill: "color-mix(in srgb, var(--story-text) 20%, transparent)", text: "var(--story-muted)" },
  { id: "success", label: "Pass", from: 59.5, to: 99.5, fill: "color-mix(in srgb, var(--story-accent) 20%, transparent)", activeFill: "color-mix(in srgb, var(--story-accent) 44%, transparent)", text: "color-mix(in srgb, var(--story-accent) 80%, var(--story-text))" },
  { id: "wonder", label: "Boon", from: 99.5, to: 120, fill: "color-mix(in srgb, var(--story-accent) 34%, transparent)", activeFill: "color-mix(in srgb, var(--story-accent) 62%, transparent)", text: "color-mix(in srgb, var(--story-accent) 50%, var(--story-text))" },
];

// 時間軸常數照原本 fate-odds.ts
const SPIN_MS = 1800;
const STEP_MS = 440;
const TWEEN_MS = 260;
const LAND_MS = 600;
const HOLD_MS = 250;
const TICK_MS = 33;
const NONE = Symbol("none");
const NO_MODIFIERS: readonly InkFateModifier[] = [];

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const easeOutQuart = (t: number) => 1 - (1 - t) ** 4;

/** 轉動中的假骰面：決定性雜湊，同一個時間點永遠顯示同一個數字。 */
function flickerValue(rawRoll: number, tick: number): number {
  const hashed = Math.imul(tick + 1, 2654435761) ^ Math.imul(rawRoll + 7, 40503);
  return (Math.abs(hashed) % 100) + 1;
}

function resolveSegment(segments: readonly InkFateSegment[], score: number): string {
  const rounded = Math.round(score);
  if (rounded < segments[0].from) return segments[0].id;
  for (const segment of segments) if (rounded >= segment.from && rounded < segment.to) return segment.id;
  return segments[segments.length - 1].id;
}

function buildSteps(modifiers: readonly InkFateModifier[], cap: number, capLabel: (cap: number) => string) {
  const steps = modifiers.map((modifier) => ({ ...modifier }));
  const sum = steps.reduce((total, step) => total + step.value, 0);
  const total = Math.max(-cap, Math.min(cap, sum));
  if (sum !== total) steps.push({ label: capLabel(cap), value: total - sum, isCap: true });
  return { steps, total };
}

const css = `
.ifd{--moon:var(--story-accent);--moon-bright:color-mix(in srgb,var(--moon) 50%,var(--story-text));--moon-dim:color-mix(in srgb,var(--moon) 38%,transparent);--moon-faint:color-mix(in srgb,var(--moon) 14%,transparent);--text-muted:var(--story-muted);position:relative;display:inline-block;line-height:0;animation:ifd-settle 600ms cubic-bezier(.2,.8,.24,1) both}
@keyframes ifd-settle{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
.ifd .wm-fate-needle{transform-box:view-box;transform-origin:130px 130px;transform:rotate(var(--wm-fate-needle-angle,0deg))}
.ifd .wm-fate-drop-rolling{transform-box:fill-box;transform-origin:50% 50%;animation:ifd-drop-fall 520ms cubic-bezier(.22,1.3,.36,1) both}
@keyframes ifd-drop-fall{from{opacity:0;transform:scale(.2)}65%{opacity:1;transform:scale(1.15)}to{opacity:1;transform:scale(1)}}
.ifd .wm-fate-centre-pop{transform-box:fill-box;transform-origin:50% 50%;animation:ifd-centre-pop 480ms cubic-bezier(.2,1.4,.4,1) both}
@keyframes ifd-centre-pop{from{transform:scale(1.12)}to{transform:scale(1)}}
.ifd .wm-fate-wonder-ring{stroke-dasharray:760;stroke-dashoffset:0}
.ifd .wm-fate-wonder-ring-rolling{animation:ifd-wonder-sweep 800ms ease-out both}
@keyframes ifd-wonder-sweep{from{stroke-dashoffset:760;opacity:.95}to{stroke-dashoffset:0;opacity:.55}}
.ifd-skip{position:absolute;inset:0;margin:0;padding:0;border:0;border-radius:50%;background:transparent;cursor:pointer}
.ifd-skip:focus-visible{outline:2px solid var(--moon-dim);outline-offset:2px}
@keyframes ifd-fade{from{opacity:.35}to{opacity:1}}
@media (prefers-reduced-motion:reduce){
.ifd,.ifd .wm-fate-drop-rolling,.ifd .wm-fate-wonder-ring-rolling{animation-name:ifd-fade;animation-duration:200ms;animation-delay:0ms}
.ifd .wm-fate-centre-pop{animation:none}
}
`;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

/**
 * 墨色命盤。rolling 為 true 時以 33ms interval 推進時間軸（分頁在背景時 rAF 會停擺，
 * interval 只會被節流，終點一定到得了）；Reduced Motion 下直接跳過時間軸。
 */
export function InkFateDial({
  rawRoll,
  modifiers = NO_MODIFIERS,
  modifierCap = 20,
  outcome: outcomeProp,
  ghostScore,
  segments: segmentsProp,
  scaleMax = 120,
  rolling = false,
  rollKey,
  skippable = true,
  onFrame,
  onSettle,
  size = SIZE,
  moon,
  moonBright,
  theme = "moon",
  locale = "en",
  labels: labelsProp,
  className,
  style,
}: InkFateDialProps) {
  const lang = resolveLocale(locale);
  const labels = { ...MESSAGES[lang], ...labelsProp };
  const segmentLabels = labels.segments;
  const segments = useMemo(
    () => segmentsProp ?? INK_FATE_SEGMENTS.map((segment) => ({ ...segment, label: segmentLabels[segment.id] ?? segment.label })),
    [segmentsProp, segmentLabels],
  );
  const capLabel = labels.cap;
  const reduced = usePrefersReducedMotion();
  // 時鐘與完成狀態都綁著 rollKey，換一次 key 立刻視為新的一擲，不會閃出上一擲的畫面
  const [clock, setClock] = useState<{ key: unknown; ms: number }>({ key: NONE, ms: 0 });
  const [finishedKey, setFinishedKey] = useState<unknown>(NONE);
  const elapsed = clock.key === rollKey ? clock.ms : 0;
  const finished = finishedKey === rollKey;

  const { steps, total } = useMemo(() => buildSteps(modifiers, modifierCap, capLabel), [modifiers, modifierCap, capLabel]);
  const hasRoll = rawRoll !== undefined;
  const finalScore = (rawRoll ?? 0) + total;
  const outcome = outcomeProp ?? resolveSegment(segments, finalScore);

  const spinMs = SPIN_MS;
  const stepsEnd = spinMs + steps.length * STEP_MS;
  const totalMs = stepsEnd + LAND_MS + HOLD_MS;
  const animating = rolling && hasRoll && !finished && !reduced;

  const clamp = (score: number) => Math.max(0, Math.min(scaleMax, score));
  const toAngle = (score: number) => (clamp(score) / scaleMax) * 360;
  const pointOn = (score: number, radius: number) => {
    const radians = ((toAngle(score) - 90) * Math.PI) / 180;
    return { x: CENTER + radius * Math.cos(radians), y: CENTER + radius * Math.sin(radians) };
  };
  const sectorPath = (from: number, to: number, inner: number, outer: number) => {
    const largeArc = toAngle(to) - toAngle(from) > 180 ? 1 : 0;
    const os = pointOn(from, outer);
    const oe = pointOn(to, outer);
    const ie = pointOn(to, inner);
    const is = pointOn(from, inner);
    return `M ${os.x} ${os.y} A ${outer} ${outer} 0 ${largeArc} 1 ${oe.x} ${oe.y} L ${ie.x} ${ie.y} A ${inner} ${inner} 0 ${largeArc} 0 ${is.x} ${is.y} Z`;
  };
  const arcPath = (from: number, to: number, radius: number) => {
    const start = pointOn(from, radius);
    const end = pointOn(to, radius);
    const largeArc = Math.abs(toAngle(to) - toAngle(from)) > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const settleRef = useRef(onSettle);
  settleRef.current = onSettle;

  useEffect(() => {
    if (!rolling || !hasRoll || finished) return;
    if (reduced) {
      setFinishedKey(rollKey);
      settleRef.current?.({ segment: outcome, finalScore });
      return;
    }
    const start = Date.now();
    const timer = window.setInterval(() => {
      const now = Date.now() - start;
      if (now >= totalMs) {
        window.clearInterval(timer);
        setFinishedKey(rollKey);
        settleRef.current?.({ segment: outcome, finalScore });
        return;
      }
      setClock({ key: rollKey, ms: now });
    }, TICK_MS);
    return () => window.clearInterval(timer);
    // outcome 與 finalScore 由 rollKey 對應的輸入決定
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolling, hasRoll, finished, reduced, totalMs, rollKey]);

  const skip = () => {
    if (!animating) return;
    setFinishedKey(rollKey);
    settleRef.current?.({ segment: outcome, finalScore });
  };

  // Esc 跳過動畫
  useEffect(() => {
    if (!animating || !skippable) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") skip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const frame: InkFateFrame | undefined = useMemo(() => {
    if (!hasRoll) return undefined;
    const raw = rawRoll;
    const rawAngle = toAngle(raw);
    if (!animating) {
      return { phase: "done", displayRaw: raw, displayScore: finalScore, needleAngle: rawAngle, revealedSteps: steps.length, currentSegment: resolveSegment(segments, finalScore), landed: true };
    }
    const t = Math.max(0, elapsed);
    if (t < spinMs) {
      const progress = t / spinMs;
      // 數字跳動越來越慢：用減速曲線決定已經跳過幾次
      const tick = Math.floor(easeOutCubic(progress) * 26);
      const displayRaw = progress > 0.9 ? raw : flickerValue(raw, tick);
      return { phase: "spin", displayRaw, displayScore: displayRaw, needleAngle: easeOutQuart(progress) * (1080 + rawAngle), revealedSteps: 0, currentSegment: resolveSegment(segments, raw), landed: false };
    }
    let score = raw;
    let revealed = steps.length;
    let currentStep: InkFateModifier | undefined;
    if (t < stepsEnd) {
      const stepElapsed = t - spinMs;
      const index = Math.floor(stepElapsed / STEP_MS);
      const fraction = Math.min(1, (stepElapsed - index * STEP_MS) / TWEEN_MS);
      revealed = index + 1;
      for (let i = 0; i < index; i += 1) score += steps[i].value;
      score += steps[index].value * easeOutCubic(fraction);
      currentStep = steps[index];
    } else {
      score = finalScore;
    }
    const rounded = Math.round(score);
    const landed = t >= stepsEnd;
    return { phase: landed ? "land" : "modifiers", displayRaw: raw, displayScore: rounded, needleAngle: rawAngle, revealedSteps: revealed, currentSegment: resolveSegment(segments, rounded), landed, currentStep };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRoll, rawRoll, animating, elapsed, finalScore, steps, segments, scaleMax, stepsEnd]);

  const frameRef = useRef(onFrame);
  frameRef.current = onFrame;
  // 只在畫面真的變了才回報，避免父層 setState 造成重繪迴圈
  const frameKey = frame ? `${frame.phase}|${frame.displayRaw}|${frame.displayScore}|${frame.revealedSteps}|${frame.landed}` : "";
  useEffect(() => {
    if (frame) frameRef.current?.(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameKey]);

  const landed = frame ? frame.landed : true;
  const spinning = frame?.phase === "spin";
  const liveScore = frame ? frame.displayScore : finalScore;
  const needleAngle = frame ? frame.needleAngle : 0;
  const passing = frame && !landed && !spinning ? frame.currentSegment : undefined;
  const drop = pointOn(liveScore, DROP_RADIUS);
  const ghost = ghostScore === undefined ? undefined : pointOn(ghostScore, DROP_RADIUS);
  const showArc = hasRoll && !spinning && liveScore !== rawRoll;
  const centre = !hasRoll ? labels.noRoll : spinning ? String(frame?.displayRaw ?? rawRoll) : String(liveScore);
  // 原本只有擲骰的那一次才播落定點綴，靜止盤面不播
  const playing = animating;

  const ticks = 24;
  const thresholds = segments.slice(1).map((segment) => segment.from);

  return (
    <div
      className={cn("ifd", className)}
      style={{ ...storyThemes[theme], ...(moon ? { "--moon": moon } : {}), ...(moonBright ? { "--moon-bright": moonBright } : {}), ...style } as CSSProperties}
    >
      <style>{css}</style>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={size}
        height={size}
        role={labels.dial ? "img" : undefined}
        aria-label={labels.dial}
        aria-hidden={labels.dial ? undefined : true}
        focusable="false"
        style={{ display: "block", overflow: "visible", maxWidth: "100%", height: "auto" }}
      >

        {/* 盤面底紙 */}
        <circle cx={CENTER} cy={CENTER} r={RING_OUTER} fill="var(--story-bg)" />
        <circle cx={CENTER} cy={CENTER} r={RING_OUTER} fill="none" stroke="var(--moon-dim)" strokeWidth="1" />
        <circle cx={CENTER} cy={CENTER} r={RING_INNER} fill="none" stroke="var(--moon-faint)" strokeWidth="1" />

        {/* 外圈刻度：整十分處加長 */}
        {Array.from({ length: ticks }, (_, index) => {
          const score = (index / ticks) * scaleMax;
          const major = index % 2 === 0;
          const from = pointOn(score, RING_INNER + 2);
          const to = pointOn(score, RING_INNER + (major ? 9 : 5));
          return (
            <line
              key={index}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={major ? "var(--moon-dim)" : "var(--moon-faint)"}
              strokeWidth={major ? 1.1 : 0.7}
            />
          );
        })}

        {/* 門檻線 */}
        {thresholds.map((score) => {
          const inner = pointOn(score, DISC_INNER);
          const outer = pointOn(score, RING_OUTER);
          return <line key={score} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="var(--moon)" strokeWidth="1" opacity="0.5" />;
        })}

        {/* 分區：扇形大小就是該級在命數尺上的寬度 */}
        {segments.map((segment) => {
          const isActive = landed && segment.id === outcome;
          const isPassing = segment.id === passing;
          const labelPoint = pointOn((segment.from + segment.to) / 2, LABEL_RADIUS);
          return (
            <g key={segment.id}>
              <path
                d={sectorPath(segment.from, segment.to, DISC_INNER, DISC_OUTER)}
                fill={isActive || isPassing ? (segment.activeFill ?? "color-mix(in srgb, var(--story-accent) 44%, transparent)") : (segment.fill ?? "color-mix(in srgb, var(--story-accent) 20%, transparent)")}
                fillOpacity={isPassing ? 0.55 : 1}
                stroke={isActive ? "var(--moon-bright)" : "var(--moon-faint)"}
                strokeWidth={isActive ? 1.8 : 0.7}
              />
              <text
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isActive ? "var(--story-text)" : (segment.text ?? "var(--story-muted)")}
                fontSize={isActive ? 21 : 15}
                letterSpacing="0.1em"
                opacity={isActive || isPassing ? 1 : 0.6}
              >
                {segment.label}
              </text>
            </g>
          );
        })}

        {/* 內圈留白 */}
        <circle cx={CENTER} cy={CENTER} r={DISC_INNER} fill="var(--story-bg)" stroke="var(--moon-faint)" strokeWidth="1" />

        {/* 重擲殘影 */}
        {ghost && (
          <circle cx={ghost.x} cy={ghost.y} r="6" fill="var(--moon-faint)" stroke="var(--moon-dim)" strokeWidth="0.8" strokeDasharray="2 2" />
        )}

        {hasRoll && (
          <>
            {/* 裸骰指針：轉數圈後停在裸骰 */}
            <g className="wm-fate-needle" style={{ ["--wm-fate-needle-angle" as string]: `${needleAngle}deg` }}>
              <line
                x1={CENTER}
                y1={CENTER - DISC_INNER - 2}
                x2={CENTER}
                y2={CENTER - RING_INNER - 10}
                stroke="var(--moon)"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <circle cx={CENTER} cy={CENTER - RING_INNER - 10} r="3" fill="var(--moon-bright)" />
            </g>

            {/* 修正金弧：從裸骰一段一段推到目前命數 */}
            {showArc && (
              <path
                className="wm-fate-modifier-arc"
                d={arcPath(Math.min(rawRoll, liveScore), Math.max(rawRoll, liveScore), RING_INNER + 6)}
                fill="none"
                stroke={liveScore < rawRoll ? "var(--story-danger)" : "var(--moon-bright)"}
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.9"
              />
            )}
          </>
        )}

        {/* 一滴金墨：落定之後才停在結果區 */}
        {hasRoll && landed && (
          <g className={playing ? "wm-fate-drop wm-fate-drop-rolling" : "wm-fate-drop"} >
            <circle cx={drop.x} cy={drop.y} r="7.5" fill="var(--moon-bright)" />
            <circle cx={drop.x} cy={drop.y} r="7.5" fill="none" stroke="var(--story-bg)" strokeWidth="0.8" />
          </g>
        )}

        {/* 最高一級的短促金線，不做全屏爆光 */}
        {hasRoll && landed && outcome === segments[segments.length - 1].id && (
          <circle
            className={playing ? "wm-fate-wonder-ring wm-fate-wonder-ring-rolling" : "wm-fate-wonder-ring"}
            cx={CENTER}
            cy={CENTER}
            r={RING_OUTER}
            fill="none"
            stroke="var(--moon-bright)"
            strokeWidth="1.6"
            opacity="0.55"
          />
        )}

        <text
          x={CENTER}
          y={CENTER}
          textAnchor="middle"
          dominantBaseline="central"
          fill={spinning ? "var(--text-muted)" : "var(--moon-bright)"}
          fontSize={hasRoll ? 26 : 22}
          fontWeight={500}
          className={landed && playing ? "wm-fate-centre-pop" : undefined}
        >
          {centre}
        </text>
      </svg>
      {animating && skippable && (
        <button type="button" className="ifd-skip" onClick={skip} aria-label={labels.skip} />
      )}
    </div>
  );
}
