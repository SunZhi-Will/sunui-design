"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "framer-motion";
import { Children, useEffect, useRef, type ReactNode, type RefObject } from "react";

import { cn } from "@/lib/utils";

/** 九種捲動效果，每種一個具名元件 */
export const scrollEffects = [
  "parallax",
  "horizontal-scroll",
  "zoom-on-scroll",
  "velocity-skew",
  "scroll-marquee",
  "circle-reveal",
  "split-doors",
  "stacking-cards",
  "scroll-draw-path",
] as const;
export type ScrollEffectId = (typeof scrollEffects)[number];

type ScrollOffset = NonNullable<Parameters<typeof useScroll>[0]>["offset"];

export interface ScrollEffectBaseProps {
  /** 在可捲動容器裡使用時傳入（容器需要 position: relative）；預設跟著整個視窗捲動 */
  container?: RefObject<HTMLElement | null>;
  /** 外部提供的 0 到 1 進度，給了就不讀捲動，釘住的區段也不再拉長（適合縮圖或自動播放） */
  progress?: MotionValue<number>;
  /** 一個「畫面」的高度，釘住的區段以它為單位；在容器裡使用時傳容器高度，例如 "480px" */
  stageHeight?: string;
  className?: string;
}

const DEFAULT_STAGE = "100dvh";

/** 讀取 target 相對於捲動容器的進度；layoutEffect: false 讓父層的 container ref 先掛上 */
function useSectionProgress(
  target: RefObject<HTMLElement | null>,
  container: RefObject<HTMLElement | null> | undefined,
  offset: ScrollOffset,
  external?: MotionValue<number>,
) {
  const { scrollYProgress } = useScroll({ target, container, offset, layoutEffect: false });
  return external ?? scrollYProgress;
}

/** 釘住區段的總長度：外部進度時只佔一個畫面 */
function trackHeight(stage: string, screens: number, external: boolean) {
  return external ? stage : `calc(${stage} * ${screens})`;
}

const tint = (n: number) => `color-mix(in oklab, var(--primary) ${n}%, var(--background))`;

/* ------------------------------------------------------------------ */
/* 1. parallax：遠、中、近三層以不同速度移動                              */
/* ------------------------------------------------------------------ */

export interface ParallaxLayersProps extends ScrollEffectBaseProps {
  /** 中央的前景內容，跟著頁面正常移動 */
  children?: ReactNode;
  far?: ReactNode;
  mid?: ReactNode;
  near?: ReactNode;
  /** 近景最大位移（px），遠景與中景按比例縮小 */
  distance?: number;
}

export function ParallaxLayers({
  children,
  far,
  mid,
  near,
  distance = 120,
  container,
  progress,
  stageHeight = DEFAULT_STAGE,
  className,
}: ParallaxLayersProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion() ?? false;
  const p = useSectionProgress(ref, container, ["start end", "end start"], progress);
  // 遠景往反方向補償（看起來慢），近景加速（看起來快）
  const yFar = useTransform(p, [0, 1], [-distance * 0.6, distance * 0.6]);
  const yMid = useTransform(p, [0, 1], [-distance * 0.25, distance * 0.25]);
  const yNear = useTransform(p, [0, 1], [distance * 0.5, -distance * 0.5]);

  return (
    <section
      ref={ref}
      className={cn("relative overflow-hidden bg-background text-foreground", className)}
      style={{ height: stageHeight }}
    >
      <motion.div aria-hidden className="absolute inset-0" style={reduce ? undefined : { y: yFar }}>
        {far ?? (
          <svg viewBox="0 0 400 200" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-[20%] h-[85%] w-full">
            <circle cx="290" cy="60" r="26" fill={tint(45)} />
            <path d="M0 120 L60 80 L120 110 L190 60 L260 105 L330 70 L400 100 V200 H0Z" fill={tint(18)} />
          </svg>
        )}
      </motion.div>
      <motion.div aria-hidden className="absolute inset-0" style={reduce ? undefined : { y: yMid }}>
        {mid ?? (
          <svg viewBox="0 0 400 200" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-[20%] h-[70%] w-full">
            <path d="M0 130 C70 90 120 140 200 110 S330 80 400 120 V200 H0Z" fill={tint(38)} />
          </svg>
        )}
      </motion.div>
      <motion.div aria-hidden className="absolute inset-0" style={reduce ? undefined : { y: yNear }}>
        {near ?? (
          <svg viewBox="0 0 400 200" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-[25%] h-[55%] w-full">
            <path d="M0 120 C90 70 160 150 250 110 S360 90 400 100 V200 H0Z" fill={tint(70)} />
          </svg>
        )}
      </motion.div>
      <div className="relative z-10 flex h-full items-center justify-center p-6 text-center">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 2. horizontal-scroll：區段釘住，一排面板隨往下捲而橫移                 */
/* ------------------------------------------------------------------ */

export interface HorizontalScrollProps extends ScrollEffectBaseProps {
  /** 每個子元素是一個面板 */
  children: ReactNode;
  /** 每個面板的 class，預設寬度約為畫面的八成 */
  panelClassName?: string;
}

export function HorizontalScroll({
  children,
  panelClassName,
  container,
  progress,
  stageHeight = DEFAULT_STAGE,
  className,
}: HorizontalScrollProps) {
  const ref = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;
  const panels = Children.toArray(children);
  const p = useSectionProgress(ref, container, ["start start", "end end"], progress);
  // 可橫移的距離 = 整排寬度 減 舞台寬度，尺寸變動時重新量
  const shift = useMotionValue(0);
  const x = useTransform(() => -p.get() * shift.get());

  useEffect(() => {
    const s = stage.current;
    const r = row.current;
    if (!s || !r) return;
    const measure = () => shift.set(Math.max(0, r.scrollWidth - s.clientWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(s);
    ro.observe(r);
    return () => ro.disconnect();
  }, [shift, reduce]);

  const panelCls = cn("w-[min(80%,28rem)] shrink-0 snap-center", panelClassName);

  if (reduce) {
    // 減少動態：一般的橫向捲動列表
    return (
      <section ref={ref} className={cn("relative", className)}>
        <div ref={stage} className="overflow-x-auto">
          <div ref={row} className="flex snap-x gap-4 p-6">
            {panels.map((panel, i) => (
              <div key={i} className={panelCls}>
                {panel}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className={cn("relative", className)} style={{ height: trackHeight(stageHeight, Math.max(2, panels.length), !!progress) }}>
      <div ref={stage} className="sticky top-0 flex items-center overflow-hidden" style={{ height: stageHeight }}>
        <motion.div ref={row} className="flex w-max gap-4 px-6" style={{ x }}>
          {panels.map((panel, i) => (
            <div key={i} className={panelCls}>
              {panel}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 3. zoom-on-scroll：小圖放大到填滿畫面，接著標題淡入                     */
/* ------------------------------------------------------------------ */

export interface ZoomOnScrollProps extends ScrollEffectBaseProps {
  src?: string;
  alt?: string;
  /** 沒有圖片時放自訂的畫面（例如 SVG 或漸層） */
  art?: ReactNode;
  /** 放大完成後淡入的標題 */
  title?: ReactNode;
  children?: ReactNode;
}

export function ZoomOnScroll({
  src,
  alt = "",
  art,
  title,
  children,
  container,
  progress,
  stageHeight = DEFAULT_STAGE,
  className,
}: ZoomOnScrollProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion() ?? false;
  const p = useSectionProgress(ref, container, ["start start", "end end"], progress);
  const inset = useTransform(p, [0, 0.6], [32, 0]);
  const clipPath = useTransform(inset, (v) => `inset(${v}% ${v * 1.1}% round ${v > 0.5 ? 16 : 0}px)`);
  const scale = useTransform(p, [0, 0.6], [1.25, 1]);
  const textOpacity = useTransform(p, [0.6, 0.85], [0, 1]);
  const textY = useTransform(p, [0.6, 0.85], [24, 0]);

  const media = src ? (
    <img src={src} alt={alt} className="size-full object-cover" />
  ) : (
    (art ?? <div aria-hidden className="size-full" style={{ background: `linear-gradient(135deg, ${tint(80)}, ${tint(25)})` }} />)
  );

  return (
    <section
      ref={ref}
      className={cn("relative text-foreground", className)}
      style={{ height: reduce ? stageHeight : trackHeight(stageHeight, 2.2, !!progress) }}
    >
      <div className="sticky top-0 overflow-hidden" style={{ height: stageHeight }}>
        <motion.div className="absolute inset-0" style={reduce ? undefined : { clipPath }}>
          <motion.div className="size-full" style={reduce ? undefined : { scale }}>
            {media}
          </motion.div>
        </motion.div>
        {(title || children) && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/55 p-6 text-center"
            style={reduce ? undefined : { opacity: textOpacity }}
          >
            <motion.div style={reduce ? undefined : { y: textY }}>
              {title && <div className="text-3xl font-semibold tracking-tight sm:text-5xl">{title}</div>}
              {children}
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 4. velocity-skew：依捲動速度傾斜，停下後彈回                            */
/* ------------------------------------------------------------------ */

export interface VelocitySkewProps extends ScrollEffectBaseProps {
  /** 每個子元素各自傾斜 */
  children: ReactNode;
  /** 最大傾斜角度（deg） */
  maxSkew?: number;
}

export function VelocitySkew({ children, maxSkew = 10, container, progress, className }: VelocitySkewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;
  const { scrollY } = useScroll({ target: ref, container, layoutEffect: false });
  // 外部進度換算成假想的像素，讓縮圖也能看到傾斜
  const zero = useMotionValue(0);
  const fakeY = useTransform(progress ?? zero, (v) => v * 2400);
  const velocity = useVelocity(progress ? fakeY : scrollY);
  const target = useTransform(velocity, [-2500, 2500], [-maxSkew, maxSkew]);
  const skewY = useSpring(target, { stiffness: 320, damping: 40 });

  return (
    <div ref={ref} className={cn("flex flex-col gap-4", className)}>
      {Children.map(children, (child) => (
        <motion.div style={reduce ? undefined : { skewY }}>{child}</motion.div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. scroll-marquee：大字列隨捲動往相反方向橫移                           */
/* ------------------------------------------------------------------ */

export interface ScrollMarqueeProps extends ScrollEffectBaseProps {
  rows: string[];
  /** 橫移距離，佔一列總寬的百分比 */
  distance?: number;
  /** 偶數列改成描邊字 */
  outlineAlternate?: boolean;
  rowClassName?: string;
}

export function ScrollMarquee({
  rows,
  distance = 25,
  outlineAlternate = true,
  rowClassName,
  container,
  progress,
  className,
}: ScrollMarqueeProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion() ?? false;
  const p = useSectionProgress(ref, container, ["start end", "end start"], progress);

  return (
    <section ref={ref} className={cn("relative overflow-hidden py-8 text-foreground", className)}>
      <ul className="sr-only">
        {rows.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
      <div aria-hidden className="flex flex-col gap-2">
        {rows.map((r, i) => (
          <MarqueeRow
            key={i}
            text={r}
            progress={p}
            reverse={i % 2 === 1}
            distance={distance}
            reduce={reduce}
            outline={outlineAlternate && i % 2 === 1}
            className={rowClassName}
          />
        ))}
      </div>
    </section>
  );
}

function MarqueeRow({
  text,
  progress,
  reverse,
  distance,
  reduce,
  outline,
  className,
}: {
  text: string;
  progress: MotionValue<number>;
  reverse: boolean;
  distance: number;
  reduce: boolean;
  outline: boolean;
  className?: string;
}) {
  const x = useTransform(progress, [0, 1], reverse ? [`-${distance}%`, "0%"] : ["0%", `-${distance}%`]);
  return (
    <motion.div
      className={cn(
        "flex w-max gap-[0.4em] whitespace-nowrap text-5xl font-black leading-none tracking-tight sm:text-7xl",
        outline && "text-transparent [-webkit-text-stroke:1.5px_var(--foreground)]",
        className,
      )}
      style={reduce ? undefined : { x }}
    >
      {Array.from({ length: 6 }, (_, k) => (
        <span key={k}>
          {text}
          <span className="px-[0.2em] text-primary [-webkit-text-stroke:0]">·</span>
        </span>
      ))}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* 6. circle-reveal：圓形遮罩從中心擴大，揭開下一段                        */
/* ------------------------------------------------------------------ */

export interface CircleRevealProps extends ScrollEffectBaseProps {
  /** 一開始看到的畫面 */
  front: ReactNode;
  /** 被圓形揭開的下一段 */
  children: ReactNode;
}

export function CircleReveal({ front, children, container, progress, stageHeight = DEFAULT_STAGE, className }: CircleRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion() ?? false;
  const p = useSectionProgress(ref, container, ["start start", "end end"], progress);
  // 半徑 75% 足以蓋過四個角
  const clipPath = useTransform(p, [0.1, 0.9], ["circle(0% at 50% 50%)", "circle(75% at 50% 50%)"]);

  if (reduce) {
    return (
      <section ref={ref} className={cn("relative", className)}>
        <div style={{ minHeight: stageHeight }}>{front}</div>
        <div style={{ minHeight: stageHeight }}>{children}</div>
      </section>
    );
  }

  return (
    <section ref={ref} className={cn("relative", className)} style={{ height: trackHeight(stageHeight, 2, !!progress) }}>
      <div className="sticky top-0 overflow-hidden" style={{ height: stageHeight }}>
        <div className="absolute inset-0">{front}</div>
        <motion.div className="absolute inset-0" style={{ clipPath }}>
          {children}
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 7. split-doors：畫面從中間分成兩扇門，隨捲動往兩側滑開                  */
/* ------------------------------------------------------------------ */

export interface SplitDoorsProps extends ScrollEffectBaseProps {
  /** 門板上的畫面，會從正中間切成左右兩半 */
  cover: ReactNode;
  /** 門後的內容 */
  children: ReactNode;
  /** 門板的 class，預設 bg-foreground text-background */
  doorClassName?: string;
}

export function SplitDoors({ cover, children, doorClassName, container, progress, stageHeight = DEFAULT_STAGE, className }: SplitDoorsProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion() ?? false;
  const p = useSectionProgress(ref, container, ["start start", "end end"], progress);
  const leftX = useTransform(p, [0.1, 0.8], ["0%", "-100%"]);
  const rightX = useTransform(p, [0.1, 0.8], ["0%", "100%"]);
  const contentScale = useTransform(p, [0.1, 0.8], [0.9, 1]);
  const contentOpacity = useTransform(p, [0.1, 0.6], [0.3, 1]);

  const door = cn("absolute inset-y-0 w-1/2 overflow-hidden bg-foreground text-background", doorClassName);

  if (reduce) {
    return (
      <section ref={ref} className={cn("relative", className)}>
        <div className={cn("relative overflow-hidden bg-foreground text-background", doorClassName)} style={{ minHeight: stageHeight }}>
          {cover}
        </div>
        <div style={{ minHeight: stageHeight }}>{children}</div>
      </section>
    );
  }

  return (
    <section ref={ref} className={cn("relative", className)} style={{ height: trackHeight(stageHeight, 2, !!progress) }}>
      <div className="sticky top-0 overflow-hidden" style={{ height: stageHeight }}>
        <motion.div className="absolute inset-0" style={{ scale: contentScale, opacity: contentOpacity }}>
          {children}
        </motion.div>
        <motion.div aria-hidden className={cn(door, "left-0 shadow-[8px_0_24px_-12px_rgba(0,0,0,0.5)]")} style={{ x: leftX }}>
          <div className="absolute inset-y-0 left-0 w-[200%]">{cover}</div>
        </motion.div>
        <motion.div className={cn(door, "right-0 shadow-[-8px_0_24px_-12px_rgba(0,0,0,0.5)]")} style={{ x: rightX }}>
          {/* 右半扇承載可讀文字給讀屏，左半扇 aria-hidden */}
          <div className="absolute inset-y-0 right-0 w-[200%]">{cover}</div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 8. stacking-cards：卡片黏在頂端疊起來，前面的縮小變暗                   */
/* ------------------------------------------------------------------ */

export interface StackingCardsProps extends ScrollEffectBaseProps {
  /** 每個子元素是一張卡 */
  children: ReactNode;
  cardClassName?: string;
  /** 每張卡往下錯開的距離（px），讓後面的卡露出邊 */
  peek?: number;
}

export function StackingCards({
  children,
  cardClassName,
  peek = 14,
  container,
  progress,
  stageHeight = DEFAULT_STAGE,
  className,
}: StackingCardsProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion() ?? false;
  const cards = Children.toArray(children);
  const p = useSectionProgress(ref, container, ["start start", "end end"], progress);
  const cardCls = cn("h-[70%] w-full max-w-md overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-lg", cardClassName);

  if (reduce) {
    return (
      <section ref={ref} className={cn("flex flex-col items-center gap-4 p-6", className)}>
        {cards.map((card, i) => (
          <div key={i} className={cardCls} style={{ height: `calc(${stageHeight} * 0.7)` }}>
            {card}
          </div>
        ))}
      </section>
    );
  }

  // 外部進度：所有卡疊在同一個畫面裡，依進度逐張滑入
  if (progress) {
    return (
      <section ref={ref} className={cn("relative overflow-hidden", className)} style={{ height: stageHeight }}>
        {cards.map((card, i) => (
          <StackCard key={i} index={i} total={cards.length} progress={p} peek={peek} className={cardCls} overlay>
            {card}
          </StackCard>
        ))}
      </section>
    );
  }

  return (
    <section ref={ref} className={cn("relative", className)}>
      {cards.map((card, i) => (
        <div key={i} className="sticky top-0 flex items-center justify-center px-6" style={{ height: stageHeight, paddingTop: i * peek }}>
          <StackCard index={i} total={cards.length} progress={p} peek={peek} className={cardCls}>
            {card}
          </StackCard>
        </div>
      ))}
    </section>
  );
}

function StackCard({
  index,
  total,
  progress,
  peek,
  className,
  overlay = false,
  children,
}: {
  index: number;
  total: number;
  progress: MotionValue<number>;
  peek: number;
  className: string;
  overlay?: boolean;
  children: ReactNode;
}) {
  const depth = total - 1 - index;
  const start = index / total;
  const scale = useTransform(progress, [start, 1], [1, 1 - depth * 0.06]);
  const filter = useTransform(progress, [start, 1], ["brightness(1)", `brightness(${1 - depth * 0.15})`]);
  // 只在 overlay 模式使用：卡片從下方滑進來
  const enter = useTransform(progress, [Math.max(0, (index - 1) / total), start], index === 0 ? ["0%", "0%"] : ["120%", "0%"]);

  if (overlay) {
    return (
      <div className="absolute inset-0 flex items-center justify-center px-6" style={{ paddingTop: index * peek }}>
        <motion.div className={cn(className, "origin-top")} style={{ y: enter, scale, filter }}>
          {children}
        </motion.div>
      </div>
    );
  }
  return (
    <motion.div className={cn(className, "origin-top")} style={{ scale, filter }}>
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* 9. scroll-draw-path：一條曲線隨捲動畫出來，串起各段                     */
/* ------------------------------------------------------------------ */

export interface ScrollDrawPathProps extends ScrollEffectBaseProps {
  /** 沿著曲線排列的段落 */
  children: ReactNode;
  /** SVG path，座標系為 0 到 100（寬）乘 0 到 100（高），會拉伸到整個區段 */
  d?: string;
  strokeWidth?: number;
  /** 線條顏色，預設 var(--primary) */
  color?: string;
}

const DEFAULT_PATH = "M50 0 C 92 10, 92 24, 50 33 S 8 56, 50 66 S 92 90, 50 100";

export function ScrollDrawPath({
  children,
  d = DEFAULT_PATH,
  strokeWidth = 3,
  color = "var(--primary)",
  container,
  progress,
  className,
}: ScrollDrawPathProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion() ?? false;
  const p = useSectionProgress(ref, container, ["start center", "end center"], progress);
  const smooth = useSpring(p, { stiffness: 200, damping: 40, restDelta: 0.001 });
  const pathLength = progress ? p : smooth;

  return (
    <section ref={ref} className={cn("relative", className)}>
      <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full" fill="none">
        <path d={d} stroke="var(--border)" strokeWidth={strokeWidth} strokeDasharray="2 6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <motion.path
          d={d}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          style={{ pathLength: reduce ? 1 : pathLength }}
        />
      </svg>
      <div className="relative z-10">{children}</div>
    </section>
  );
}
