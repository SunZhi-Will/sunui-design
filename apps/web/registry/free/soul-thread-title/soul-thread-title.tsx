"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** 座標都在字標的像素空間，動畫才會跟著片名一起縮放與移動。 */
const WORDMARK_WIDTH = 2038;
const WORDMARK_HEIGHT = 531;
const THREAD_POINTS: [number, number][] = [
  [-20, 443],
  [130, 475],
  [360, 423],
  [620, 463],
  [860, 513],
  [1110, 463],
  [1360, 483],
  [1620, 453],
  [1860, 333],
  [2030, 293],
];
const SAMPLES_PER_SPAN = 14;
/** 從這裡開始絲線浮到字上，看起來是穿過最後一個字。 */
const FRONT_FROM_X = 1640;

const SCYTHE_SIZE = 430;
/** 刀尖在鐮刀圖裡的位置，絲線從這裡拉出來。 */
const SCYTHE_TIP = { x: 0.036 * SCYTHE_SIZE, y: 0.44 * SCYTHE_SIZE };

/** 動畫時間軸（毫秒）。 */
const APPEAR_END = 900;
const WINDUP_END = 1300;
const SWING_END = 1550;
const FLIGHT_START = 1400;
const FLIGHT_END = 3000;
const LEAVE_END = 3500;
const SETTLE_END = 4000;

function catmull(points: [number, number][]): [number, number][] {
  const pts = [points[0], ...points, points[points.length - 1]];
  const out: [number, number][] = [];
  for (let i = 1; i < pts.length - 2; i += 1) {
    const [p0, p1, p2, p3] = [pts[i - 1], pts[i], pts[i + 1], pts[i + 2]];
    for (let k = 0; k < SAMPLES_PER_SPAN; k += 1) {
      const t = k / SAMPLES_PER_SPAN;
      const at = (c: 0 | 1) =>
        0.5 *
        (2 * p1[c] +
          (p2[c] - p0[c]) * t +
          (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t * t +
          (3 * p1[c] - p0[c] - 3 * p2[c] + p3[c]) * t * t * t);
      out.push([at(0), at(1)]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

const SPINE = catmull(THREAD_POINTS);
const NORMALS = SPINE.map((_, i) => {
  const a = SPINE[Math.max(i - 1, 0)];
  const b = SPINE[Math.min(i + 1, SPINE.length - 1)];
  const size = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [-(b[1] - a[1]) / size, (b[0] - a[0]) / size];
});

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const progress = (time: number, from: number, to: number) => clamp01((time - from) / (to - from));
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** 頭尾收細，和字標裡的靜態絲線粗細一樣。 */
function threadWidth(u: number): number {
  const fade = u < 0.05 ? u / 0.05 : u > 0.75 ? 1 - ((u - 0.75) / 0.25) * 0.9 : 1;
  return (3.4 + 1.6 * Math.sin(Math.PI * 5 * u)) * fade;
}

function ribbonPath(head: number, excited: number, seconds: number): string {
  const last = Math.floor(head * (SPINE.length - 1));
  if (last < 1) return "";
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= last; i += 1) {
    const u = i / (SPINE.length - 1);
    const pinned = Math.sqrt(Math.sin(Math.PI * clamp01(u * 0.96 + 0.02)));
    const ambient = 5 * Math.sin(u * 10 - seconds * 1.3) + 2.5 * Math.sin(u * 23 + seconds * 0.9);
    const whip = excited * 26 * Math.exp(-(((head - u) * 5) ** 2)) * Math.sin(u * 30 - seconds * 14);
    const offset = pinned * (ambient + whip);
    const half = threadWidth(u) / 2;
    const [x, y] = SPINE[i];
    const [nx, ny] = NORMALS[i];
    left.push(`${(x + nx * (offset + half)).toFixed(1)} ${(y + ny * (offset + half)).toFixed(1)}`);
    right.push(`${(x + nx * (offset - half)).toFixed(1)} ${(y + ny * (offset - half)).toFixed(1)}`);
  }
  return `M${left.join("L")}L${right.reverse().join("L")}Z`;
}

function pointOnSpine(head: number): [number, number] {
  return SPINE[Math.round(head * (SPINE.length - 1))];
}

/** 預設鐮刀：畫在 430 x 430 的空間，刀尖在 SCYTHE_TIP。 */
function DefaultScythe({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#f2f5fb" />
          <stop offset="1" stopColor="#aebde0" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${id})`}
        d="M15 189C30 120 70 50 140 22C190 4 230 12 260 15L340 389L336 416L321 393L252 75C215 68 170 62 126 80C90 95 50 130 15 189Z"
      />
    </>
  );
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

/** 預設字標的襯線字體，依語言挑對應字形；英文沿用原本的繁中襯線。 */
const SERIF_STACKS: Record<SunLocale, string> = {
  en: '"Noto Serif TC", "Songti TC", "Source Han Serif", serif',
  "zh-TW": '"Noto Serif TC", "Songti TC", "Source Han Serif", serif',
  "zh-CN": '"Noto Serif SC", "Songti SC", "Source Han Serif SC", "Source Han Serif", serif',
  ja: '"Noto Serif JP", "Hiragino Mincho ProN", "Yu Mincho", "Source Han Serif", serif',
};

/** 預設字標：把片名畫進字標座標空間，絲線才對得上字。 */
function DefaultWordmark({ title, gradientId, fontFamily }: { title: string; gradientId: string; fontFamily: string }) {
  return (
    <svg viewBox={`0 0 ${WORDMARK_WIDTH} ${WORDMARK_HEIGHT}`} className="block size-full" role="img" aria-label={title}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4f6fb" />
          <stop offset="1" stopColor="#b6c4e2" />
        </linearGradient>
      </defs>
      <text
        x={60}
        y={215}
        dominantBaseline="central"
        textLength={WORDMARK_WIDTH - 120}
        lengthAdjust="spacingAndGlyphs"
        fill={`url(#${gradientId})`}
        fontSize={400}
        fontWeight={700}
        style={{ fontFamily }}
      >
        {title}
      </text>
    </svg>
  );
}

export interface SoulThreadTitleProps {
  /** 片名文字，也是預設字標的無障礙名稱。 */
  title: string;
  /** 自訂字標（例如 <img>），會撐滿 2038:531 的框；絲線座標以這個比例為準。 */
  wordmark?: ReactNode;
  /** 自訂鐮刀，SVG 內容，畫在 430 x 430 空間，刀尖約在 (15.5, 189)。 */
  scythe?: ReactNode;
  /** 播開頭動畫：鐮刀揮下，拖著絲線劃過片名。false 時絲線一開始就在定位。 */
  intro?: boolean;
  /** 開頭動畫被跳過時設為 true，直接跳到絲線就定位。 */
  skipped?: boolean;
  /** 絲線顏色。 */
  threadColor?: string;
  /** 預設字標的字形語言：en、zh-TW、zh-CN、ja，也接受 ja-JP 這類標籤。片名本身不翻譯。 */
  locale?: string;
  className?: string;
}

/**
 * 片名上的靈魂之絲。絲線每一格重畫，平常也會輕輕飄動；
 * 開頭動畫時片名跟著刀尖由左往右顯現。減少動態時絲線靜止在定位、不出現鐮刀。
 */
export function SoulThreadTitle({
  title,
  wordmark,
  scythe,
  intro = true,
  skipped = false,
  threadColor = "#e6a4b8",
  locale = "en",
  className,
}: SoulThreadTitleProps) {
  const reduce = useReducedMotion() ?? false;
  const uid = useId().replace(/:/g, "");
  const rootRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<SVGPathElement>(null);
  const backHaloRef = useRef<SVGPathElement>(null);
  const frontRef = useRef<SVGPathElement>(null);
  const scytheRef = useRef<SVGGElement>(null);
  const skippedRef = useRef(skipped);
  skippedRef.current = skipped;

  const playsIntro = intro && !reduce;

  useEffect(() => {
    const root = rootRef.current;
    const paint = (time: number, seconds: number) => {
      const head = easeInOut(progress(time, FLIGHT_START, FLIGHT_END));
      const excited = 1 - progress(time, FLIGHT_END - 200, SETTLE_END);
      const d = ribbonPath(head, excited, seconds);
      backRef.current?.setAttribute("d", d);
      backHaloRef.current?.setAttribute("d", d);
      frontRef.current?.setAttribute("d", d);

      // 跟著刀尖的實際 x 走；多加的 8 是讓漸層邊緣在結尾完全離開字標。
      const reveal = (pointOnSpine(head)[0] / WORDMARK_WIDTH) * 100 + head * 8;
      root?.style.setProperty("--reveal", reveal.toFixed(1));

      const blade = scytheRef.current;
      if (blade) {
        const leaving = progress(time, FLIGHT_END, LEAVE_END);
        const appear = easeOut(progress(time, 0, APPEAR_END));
        const angle =
          8 * (1 - appear) -
          20 * easeOut(progress(time, APPEAR_END, WINDUP_END)) +
          34 * easeOut(progress(time, WINDUP_END, SWING_END)) -
          10 * progress(time, SWING_END, FLIGHT_END) -
          26 * leaving;
        const [x, y] = pointOnSpine(head);
        const scale = (0.85 + 0.15 * appear) * (1 - 0.15 * leaving);
        blade.setAttribute("opacity", (appear * (1 - leaving)).toFixed(3));
        blade.setAttribute(
          "transform",
          `translate(${(x + leaving * 90).toFixed(1)} ${(y - leaving * 150).toFixed(1)}) rotate(${angle.toFixed(2)}) scale(${scale.toFixed(3)}) translate(${-SCYTHE_TIP.x} ${-SCYTHE_TIP.y})`
        );
      }
    };

    // 減少動態：畫一次就定位的靜止絲線。
    if (reduce) {
      paint(SETTLE_END, 0);
      return;
    }

    const startedAt = performance.now();
    let frame = 0;
    let visible = true;
    const tick = (now: number) => {
      const time = !playsIntro || skippedRef.current ? SETTLE_END : now - startedAt;
      paint(time, now / 1000);
      frame = visible ? requestAnimationFrame(tick) : 0;
    };
    frame = requestAnimationFrame(tick);

    // 離開畫面時暫停重畫。
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame) frame = requestAnimationFrame(tick);
    });
    if (root) io.observe(root);
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
    };
  }, [playsIntro, reduce]);

  // 片名跟著鐮刀顯現；漸層邊緣落在 --reveal 之前，0 時整張字都看不到。
  const mask = "linear-gradient(90deg, #000 calc(var(--reveal, 0) * 1% - 7%), transparent calc(var(--reveal, 0) * 1%))";
  const wordmarkStyle: CSSProperties | undefined =
    playsIntro && !skipped ? { WebkitMaskImage: mask, maskImage: mask } : undefined;

  const viewBox = `0 0 ${WORDMARK_WIDTH} ${WORDMARK_HEIGHT}`;
  const layer = "pointer-events-none absolute inset-0 size-full overflow-visible";

  return (
    <div
      ref={rootRef}
      className={cn("relative w-full", className)}
      style={{ aspectRatio: `${WORDMARK_WIDTH} / ${WORDMARK_HEIGHT}` }}
    >
      <svg className={layer} viewBox={viewBox} aria-hidden="true">
        <path ref={backHaloRef} fill="none" stroke={threadColor} strokeWidth={12} strokeOpacity={0.16} strokeLinejoin="round" />
        <path ref={backRef} fill={threadColor} />
      </svg>
      <div className="relative z-[1] size-full [&>img]:block [&>img]:size-full" style={wordmarkStyle}>
        {wordmark ?? <DefaultWordmark title={title} gradientId={`${uid}-wm`} fontFamily={SERIF_STACKS[resolveLocale(locale)]} />}
      </div>
      <svg className={cn(layer, "z-[2]")} viewBox={viewBox} aria-hidden="true">
        <defs>
          <clipPath id={`${uid}-front`}>
            <rect x={FRONT_FROM_X} y={-WORDMARK_HEIGHT} width={WORDMARK_WIDTH} height={WORDMARK_HEIGHT * 3} />
          </clipPath>
        </defs>
        <path ref={frontRef} fill={threadColor} clipPath={`url(#${uid}-front)`} />
        {playsIntro && (
          <g ref={scytheRef} opacity={0}>
            {scythe ?? <DefaultScythe id={`${uid}-scythe`} />}
          </g>
        )}
      </svg>
    </div>
  );
}
