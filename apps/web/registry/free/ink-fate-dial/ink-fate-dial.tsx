"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";

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
  /** 月光色，預設原本的 #a3b8d9 系列 */
  moon?: string;
  moonBright?: string;
  labels?: { noRoll?: string; skip?: string; dial?: string };
  className?: string;
  style?: CSSProperties;
}

const SIZE = 260;
const CENTER = SIZE / 2;
const RING_OUTER = 116;
const RING_INNER = 100;
const DISC_OUTER = 92;
const DISC_INNER = 38;
const LABEL_RADIUS = 58;
const DROP_RADIUS = 82;

export const INK_FATE_SEGMENTS: InkFateSegment[] = [
  { id: "adverse", label: "逆", from: 0, to: 29.5, fill: "rgba(96, 58, 58, 0.34)", activeFill: "rgba(143, 89, 105, 0.62)", text: "#b99696" },
  { id: "mixed", label: "變", from: 29.5, to: 59.5, fill: "rgba(62, 75, 98, 0.32)", activeFill: "rgba(95, 116, 153, 0.58)", text: "#92a1bb" },
  { id: "success", label: "成", from: 59.5, to: 99.5, fill: "rgba(67, 85, 117, 0.36)", activeFill: "rgba(99, 127, 175, 0.62)", text: "#8ca1c6" },
  { id: "wonder", label: "奇", from: 99.5, to: 120, fill: "rgba(99, 125, 169, 0.44)", activeFill: "rgba(137, 162, 205, 0.72)", text: "#b9c8e2" },
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

function buildSteps(modifiers: readonly InkFateModifier[], cap: number) {
  const steps = modifiers.map((modifier) => ({ ...modifier }));
  const sum = steps.reduce((total, step) => total + step.value, 0);
  const total = Math.max(-cap, Math.min(cap, sum));
  if (sum !== total) steps.push({ label: `修正上限 ±${cap}`, value: total - sum, isCap: true });
  return { steps, total };
}

const css = `
.ifd{--moon:#a3b8d9;--moon-bright:#d5e1f5;--moon-dim:rgba(163,184,217,.38);--moon-faint:rgba(163,184,217,.14);--text-muted:#808ba1;position:relative;display:inline-block;line-height:0;animation:ifd-settle 600ms cubic-bezier(.2,.8,.24,1) both}
@keyframes ifd-settle{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
.ifd .wm-fate-needle{transform-box:view-box;transform-origin:130px 130px;transform:rotate(var(--wm-fate-needle-angle,0deg))}
.ifd .wm-fate-modifier-arc{filter:drop-shadow(0 0 3px rgba(156,177,214,.55))}
.ifd .wm-fate-drop-rolling{transform-box:fill-box;transform-origin:50% 50%;animation:ifd-drop-fall 520ms cubic-bezier(.22,1.3,.36,1) both}
@keyframes ifd-drop-fall{from{opacity:0;transform:scale(.2)}65%{opacity:1;transform:scale(1.5)}to{opacity:1;transform:scale(1)}}
.ifd .wm-fate-centre-pop{transform-box:fill-box;transform-origin:50% 50%;animation:ifd-centre-pop 480ms cubic-bezier(.2,1.4,.4,1) both}
@keyframes ifd-centre-pop{from{transform:scale(1.45)}to{transform:scale(1)}}
.ifd .wm-fate-wonder-ring{stroke-dasharray:760;stroke-dashoffset:0}
.ifd .wm-fate-wonder-ring-rolling{animation:ifd-wonder-sweep 800ms ease-out both}
@keyframes ifd-wonder-sweep{from{stroke-dashoffset:760;opacity:.95}to{stroke-dashoffset:0;opacity:.55}}
.ifd .wm-fate-band-active{animation:ifd-band-breathe 2.8s ease-in-out infinite}
@keyframes ifd-band-breathe{0%,100%{opacity:1}50%{opacity:.78}}
.ifd-skip{position:absolute;inset:0;margin:0;padding:0;border:0;border-radius:50%;background:transparent;cursor:pointer}
.ifd-skip:focus-visible{outline:2px solid var(--moon-dim);outline-offset:2px}
@keyframes ifd-fade{from{opacity:.35}to{opacity:1}}
@media (prefers-reduced-motion:reduce){
.ifd,.ifd .wm-fate-drop-rolling,.ifd .wm-fate-wonder-ring-rolling{animation-name:ifd-fade;animation-duration:200ms;animation-delay:0ms}
.ifd .wm-fate-band-active,.ifd .wm-fate-centre-pop{animation:none}
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
  segments = INK_FATE_SEGMENTS,
  scaleMax = 120,
  rolling = false,
  rollKey,
  skippable = true,
  onFrame,
  onSettle,
  size = SIZE,
  moon,
  moonBright,
  labels,
  className,
  style,
}: InkFateDialProps) {
  const uid = useId().replace(/:/g, "");
  const reduced = usePrefersReducedMotion();
  // 時鐘與完成狀態都綁著 rollKey，換一次 key 立刻視為新的一擲，不會閃出上一擲的畫面
  const [clock, setClock] = useState<{ key: unknown; ms: number }>({ key: NONE, ms: 0 });
  const [finishedKey, setFinishedKey] = useState<unknown>(NONE);
  const elapsed = clock.key === rollKey ? clock.ms : 0;
  const finished = finishedKey === rollKey;

  const { steps, total } = useMemo(() => buildSteps(modifiers, modifierCap), [modifiers, modifierCap]);
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
  const centre = !hasRoll ? (labels?.noRoll ?? "定") : spinning ? String(frame?.displayRaw ?? rawRoll) : String(liveScore);
  // 原本只有擲骰的那一次才播落定點綴，靜止盤面不播
  const playing = animating;

  const ticks = 24;
  const thresholds = segments.slice(1).map((segment) => segment.from);

  return (
    <div
      className={cn("ifd", className)}
      style={{ ...(moon ? { "--moon": moon } : {}), ...(moonBright ? { "--moon-bright": moonBright } : {}), ...style } as CSSProperties}
    >
      <style>{css}</style>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={size}
        height={size}
        role={labels?.dial ? "img" : undefined}
        aria-label={labels?.dial}
        aria-hidden={labels?.dial ? undefined : true}
        focusable="false"
        style={{ display: "block", overflow: "visible", maxWidth: "100%", height: "auto" }}
      >
        <defs>
          <radialGradient id={`${uid}-paper`} cx="50%" cy="45%" r="62%">
            <stop offset="0%" stopColor="rgba(23,26,31,0.94)" />
            <stop offset="70%" stopColor="rgba(16,15,15,0.92)" />
            <stop offset="100%" stopColor="rgba(8,8,9,0.96)" />
          </radialGradient>
          <radialGradient id={`${uid}-drop`} cx="38%" cy="34%" r="70%">
            <stop offset="0%" stopColor="#c8d4e8" />
            <stop offset="55%" stopColor="#7e97c1" />
            <stop offset="100%" stopColor="#465f8a" />
          </radialGradient>
          <filter id={`${uid}-glow`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 盤面底紙 */}
        <circle cx={CENTER} cy={CENTER} r={RING_OUTER} fill={`url(#${uid}-paper)`} />
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
                fill={isActive || isPassing ? (segment.activeFill ?? "rgba(99, 127, 175, 0.62)") : (segment.fill ?? "rgba(67, 85, 117, 0.36)")}
                fillOpacity={isPassing ? 0.55 : 1}
                stroke={isActive ? "var(--moon-bright)" : "var(--moon-faint)"}
                strokeWidth={isActive ? 1.8 : 0.7}
                className={isActive ? "wm-fate-band-active" : undefined}
              />
              <text
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isActive ? "#e5eaf4" : (segment.text ?? "#8ca1c6")}
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
        <circle cx={CENTER} cy={CENTER} r={DISC_INNER} fill="rgba(10,10,11,0.92)" stroke="var(--moon-faint)" strokeWidth="1" />

        {/* 重擲殘影 */}
        {ghost && (
          <circle cx={ghost.x} cy={ghost.y} r="6" fill="rgba(117,141,183,0.22)" stroke="rgba(117,141,183,0.4)" strokeWidth="0.8" strokeDasharray="2 2" />
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
                stroke={liveScore < rawRoll ? "#c3909f" : "var(--moon-bright)"}
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.9"
              />
            )}
          </>
        )}

        {/* 一滴金墨：落定之後才停在結果區 */}
        {hasRoll && landed && (
          <g className={playing ? "wm-fate-drop wm-fate-drop-rolling" : "wm-fate-drop"} filter={`url(#${uid}-glow)`}>
            <circle cx={drop.x} cy={drop.y} r="7.5" fill={`url(#${uid}-drop)`} />
            <circle cx={drop.x} cy={drop.y} r="7.5" fill="none" stroke="rgba(200,212,232,0.55)" strokeWidth="0.8" />
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
        <button type="button" className="ifd-skip" onClick={skip} aria-label={labels?.skip ?? "跳過擲骰動畫"} />
      )}
    </div>
  );
}
