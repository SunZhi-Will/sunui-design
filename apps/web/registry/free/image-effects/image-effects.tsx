"use client";

import {
  AnimatePresence,
  LayoutGroup,
  animate,
  motion,
  useAnimationControls,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import { useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** 單張圖片效果，用 ImageEffect 的 effect prop 切換 */
export const imageEffects = [
  "ken-burns",
  "clip-reveal",
  "soft-mask",
  "hover-zoom",
  "zoom-lens",
  "image-swap",
  "glitch",
  "saturate",
  "parallax-frame",
] as const;
export type ImageEffectName = (typeof imageEffects)[number];

/** 需要多張圖的效果，各自是獨立元件（吃 images 陣列） */
export const imageGroupEffects = ["slice-transition", "lightbox-zoom"] as const;
export type ImageGroupEffect = (typeof imageGroupEffects)[number];

export type ClipDirection = "up" | "down" | "left" | "right" | "circle";

export interface ImageItem {
  src: string;
  alt: string;
}

export interface ImageEffectProps {
  effect?: ImageEffectName;
  src: string;
  alt: string;
  /** image-swap 用：所有要切換的圖（第一張可與 src 相同） */
  images?: ImageItem[];
  /** hover-zoom 浮起的說明文字 */
  caption?: ReactNode;
  /** clip-reveal 的擦除方向 */
  direction?: ClipDirection;
  /** 進場類效果（clip-reveal、soft-mask）的觸發方式 */
  trigger?: "mount" | "inView";
  /** 秒；進場效果的長度，或 ken-burns 一輪的長度 */
  duration?: number;
  delay?: number;
  /** zoom-lens 放大倍率 */
  zoom?: number;
  /** zoom-lens 鏡片直徑（px） */
  lensSize?: number;
  /** 外框 className，預設 aspect-[4/3] */
  className?: string;
}

const frame = "relative overflow-hidden rounded-xl bg-muted";
const img = "absolute inset-0 size-full object-cover select-none";
const ease = [0.22, 1, 0.36, 1] as const;

export function ImageEffect(props: ImageEffectProps) {
  const reduce = useReducedMotion() ?? false;
  const p = { ...props, className: cn(frame, "aspect-[4/3]", props.className) };
  switch (props.effect ?? "hover-zoom") {
    case "ken-burns":
      return <KenBurns {...p} reduce={reduce} />;
    case "clip-reveal":
      return <ClipReveal {...p} reduce={reduce} />;
    case "soft-mask":
      return <SoftMask {...p} reduce={reduce} />;
    case "hover-zoom":
      return <HoverZoom {...p} reduce={reduce} />;
    case "zoom-lens":
      return <ZoomLens {...p} reduce={reduce} />;
    case "image-swap":
      return <ImageSwap {...p} reduce={reduce} />;
    case "glitch":
      return <Glitch {...p} reduce={reduce} />;
    case "saturate":
      return <Saturate {...p} reduce={reduce} />;
    case "parallax-frame":
      return <ParallaxFrame {...p} reduce={reduce} />;
  }
}

type P = ImageEffectProps & { reduce: boolean; className: string };

/* ken-burns：緩慢而持續的放大與漂移，離開畫面時暫停 */
function KenBurns({ src, alt, duration = 14, reduce, className }: P) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const controls = useAnimationControls();
  useEffect(() => {
    if (reduce || !inView) {
      controls.stop();
      return;
    }
    controls.start({
      scale: [1, 1.18],
      x: ["0%", "-4%"],
      y: ["0%", "-3%"],
      transition: { duration, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" },
    });
  }, [inView, reduce, duration, controls]);
  return (
    <div ref={ref} className={className}>
      <motion.img src={src} alt={alt} animate={controls} className={img} draggable={false} />
    </div>
  );
}

function useReveal(trigger: "mount" | "inView" = "mount") {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  return [ref, trigger === "mount" || inView] as const;
}

const clipFrom: Record<ClipDirection, string> = {
  up: "inset(100% 0% 0% 0%)",
  down: "inset(0% 0% 100% 0%)",
  left: "inset(0% 0% 0% 100%)",
  right: "inset(0% 100% 0% 0%)",
  circle: "circle(0% at 50% 50%)",
};
const clipTo: Record<ClipDirection, string> = {
  up: "inset(0% 0% 0% 0%)",
  down: "inset(0% 0% 0% 0%)",
  left: "inset(0% 0% 0% 0%)",
  right: "inset(0% 0% 0% 0%)",
  circle: "circle(75% at 50% 50%)",
};

/* clip-reveal：clip-path 擦開圖片，同時從 1.15 縮回 1 */
function ClipReveal({ src, alt, direction = "up", trigger, duration = 1.1, delay = 0, reduce, className }: P) {
  const [ref, show] = useReveal(trigger);
  const variants: Variants = {
    hidden: { clipPath: clipFrom[direction] },
    shown: { clipPath: clipTo[direction], transition: { duration, delay, ease } },
  };
  const inner: Variants = {
    hidden: { scale: 1.15 },
    shown: { scale: 1, transition: { duration: duration * 1.3, delay, ease } },
  };
  return (
    <div ref={ref} className={className}>
      <motion.div
        className="absolute inset-0 overflow-hidden"
        variants={variants}
        initial={reduce ? "shown" : "hidden"}
        animate={show || reduce ? "shown" : "hidden"}
      >
        <motion.img src={src} alt={alt} variants={inner} className={img} draggable={false} />
      </motion.div>
    </div>
  );
}

/* soft-mask：柔邊漸層遮罩由左往右掃過，把圖片顯露出來 */
function SoftMask({ src, alt, trigger, duration = 1.4, delay = 0, reduce, className }: P) {
  const [ref, show] = useReveal(trigger);
  // 遮罩邊緣位置（%），從 -30 走到 100
  const edge = useMotionValue(reduce ? 100 : -30);
  const soft = useTransform(edge, (v) => v + 30);
  const mask = useMotionTemplate`linear-gradient(to right, #000 ${edge}%, transparent ${soft}%)`;
  useEffect(() => {
    if (reduce) {
      edge.set(100);
      return;
    }
    if (!show) return;
    const controls = animate(edge, 100, { duration, delay, ease });
    return () => controls.stop();
  }, [show, reduce, duration, delay, edge]);
  return (
    <div ref={ref} className={className}>
      <motion.img src={src} alt={alt} className={img} draggable={false} style={{ maskImage: mask, WebkitMaskImage: mask }} />
    </div>
  );
}

/* hover-zoom：圖片在固定框內放大，說明文字由下浮起 */
const zoomImg: Variants = { rest: { scale: 1 }, hover: { scale: 1.1 } };
const zoomCaption: Variants = { rest: { y: "100%", opacity: 0 }, hover: { y: 0, opacity: 1 } };

function HoverZoom({ src, alt, caption, reduce, className }: P) {
  return (
    <motion.div initial="rest" animate="rest" whileHover="hover" whileFocus="hover" tabIndex={0} className={cn(className, "outline-none focus-visible:ring-2 focus-visible:ring-ring")}>
      <motion.img
        src={src}
        alt={alt}
        variants={reduce ? undefined : zoomImg}
        transition={{ duration: 0.6, ease }}
        className={img}
        draggable={false}
      />
      {caption && (
        <motion.div
          variants={zoomCaption}
          transition={reduce ? { duration: 0 } : { duration: 0.35, ease }}
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10 text-sm font-medium text-white"
        >
          {caption}
        </motion.div>
      )}
    </motion.div>
  );
}

/* zoom-lens：放大鏡跟著指標，顯示 2 倍的局部 */
function ZoomLens({ src, alt, zoom = 2, lensSize = 140, reduce, className }: P) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const bgX = useMotionValue(0);
  const bgY = useMotionValue(0);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [on, setOn] = useState(false);
  const bgPos = useMotionTemplate`${bgX}px ${bgY}px`;
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    if (r.width !== size.w || r.height !== size.h) setSize({ w: r.width, h: r.height });
    x.set(px - lensSize / 2);
    y.set(py - lensSize / 2);
    bgX.set(-(px * zoom - lensSize / 2));
    bgY.set(-(py * zoom - lensSize / 2));
  };
  return (
    <div
      onPointerMove={onMove}
      onPointerEnter={(e) => {
        onMove(e);
        setOn(true);
      }}
      onPointerLeave={() => setOn(false)}
      className={cn(className, "cursor-crosshair touch-none")}
    >
      <img src={src} alt={alt} className={img} draggable={false} />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 rounded-full border-2 border-background shadow-xl ring-1 ring-border"
        style={{
          x,
          y,
          width: lensSize,
          height: lensSize,
          backgroundImage: `url("${src}")`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${size.w * zoom}px ${size.h * zoom}px`,
          backgroundPosition: bgPos,
        }}
        initial={false}
        animate={{ opacity: on ? 1 : 0, scale: on || reduce ? 1 : 0.6 }}
        transition={reduce ? { duration: 0 } : { duration: 0.2 }}
      />
    </div>
  );
}

/* image-swap：滑過時換成第二張，指標左右移動可切換更多張，小圓點標示目前是哪張 */
function ImageSwap({ src, alt, images, reduce, className }: P) {
  const list = images && images.length > 0 ? images : [{ src, alt }];
  const [index, setIndex] = useState(0);
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (list.length <= 2) return;
    const r = e.currentTarget.getBoundingClientRect();
    const k = Math.min(list.length - 2, Math.floor(((e.clientX - r.left) / r.width) * (list.length - 1)));
    setIndex(k + 1);
  };
  const current = list[Math.min(index, list.length - 1)];
  return (
    <div
      onPointerEnter={() => setIndex(Math.min(1, list.length - 1))}
      onPointerMove={onMove}
      onPointerLeave={() => setIndex(0)}
      className={cn(className)}
    >
      <AnimatePresence initial={false}>
        <motion.img
          key={current.src}
          src={current.src}
          alt={current.alt}
          className={img}
          draggable={false}
          initial={{ opacity: 0, scale: reduce ? 1 : 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.35, ease }}
        />
      </AnimatePresence>
      {list.length > 1 && (
        <div aria-hidden className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {list.map((item, i) => (
            <motion.span
              key={item.src}
              className="h-1.5 rounded-full bg-white shadow"
              initial={false}
              animate={{ width: i === index ? 16 : 6, opacity: i === index ? 1 : 0.55 }}
              transition={reduce ? { duration: 0 } : { duration: 0.25 }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* glitch：滑過時拆成錯位的色版，加上閃爍的橫向切片 */
const slices = [
  { top: 12, h: 9, dx: [0, -14, 8, -4, 0] },
  { top: 41, h: 6, dx: [0, 18, -10, 6, 0] },
  { top: 68, h: 11, dx: [0, -8, 14, -12, 0] },
];

function Glitch({ src, alt, reduce, className }: P) {
  const id = useId().replace(/:/g, "");
  const [on, setOn] = useState(false);
  const active = on && !reduce;
  return (
    <div
      onPointerEnter={() => setOn(true)}
      onPointerLeave={() => setOn(false)}
      className={cn(className, "isolate bg-black")}
    >
      {/* 只保留紅色版與青色版（綠＋藍），兩者 screen 疊合時還原成原圖 */}
      <svg aria-hidden className="absolute size-0">
        <filter id={`${id}-r`} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
        </filter>
        <filter id={`${id}-c`} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
        </filter>
      </svg>
      {!active && <img src={src} alt={alt} className={img} draggable={false} />}
      {active && (
        <>
          <span className="sr-only">{alt}</span>
          <motion.img
            aria-hidden
            src={src}
            alt=""
            className={cn(img, "mix-blend-screen")}
            style={{ filter: `url(#${id}-r)` }}
            animate={{ x: [0, -6, 3, -4, 0], y: [0, 1, -1, 0, 0] }}
            transition={{ duration: 0.45, repeat: Infinity, ease: "linear" }}
          />
          <motion.img
            aria-hidden
            src={src}
            alt=""
            className={cn(img, "mix-blend-screen")}
            style={{ filter: `url(#${id}-c)` }}
            animate={{ x: [0, 6, -3, 4, 0], y: [0, -1, 1, 0, 0] }}
            transition={{ duration: 0.45, repeat: Infinity, ease: "linear" }}
          />
          {slices.map((s, i) => (
            <motion.img
              key={i}
              aria-hidden
              src={src}
              alt=""
              className={img}
              style={{ clipPath: `inset(${s.top}% 0 ${100 - s.top - s.h}% 0)` }}
              animate={{ x: s.dx, opacity: [0, 1, 1, 0, 0] }}
              transition={{ duration: 0.6 + i * 0.17, repeat: Infinity, ease: "linear", times: [0, 0.15, 0.4, 0.55, 1] }}
            />
          ))}
        </>
      )}
    </div>
  );
}

/* saturate：平時去色變暗，滑過時恢復全彩並輕微放大 */
function Saturate({ src, alt, reduce, className }: P) {
  const [on, setOn] = useState(false);
  return (
    <div
      onPointerEnter={() => setOn(true)}
      onPointerLeave={() => setOn(false)}
      className={cn(className)}
    >
      <motion.img
        src={src}
        alt={alt}
        className={img}
        draggable={false}
        initial={false}
        animate={{
          filter: on ? "grayscale(0) brightness(1)" : "grayscale(1) brightness(0.78)",
          scale: on && !reduce ? 1.05 : 1,
        }}
        transition={{ duration: 0.6, ease }}
      />
    </div>
  );
}

/* parallax-frame：捲動時圖片移動得比外框慢 */
function ParallaxFrame({ src, alt, reduce, className }: P) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const raw = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);
  const y = useSpring(raw, { stiffness: 120, damping: 24, mass: 0.4 });
  return (
    <div ref={ref} className={className}>
      <motion.img
        src={src}
        alt={alt}
        draggable={false}
        style={reduce ? undefined : { y }}
        className={cn("absolute inset-x-0 size-full select-none object-cover", reduce ? "inset-y-0" : "-top-[15%] h-[130%]")}
      />
    </div>
  );
}

/* ───────── 多張圖效果 ───────── */

export interface SliceSlideshowProps {
  images: ImageItem[];
  /** 切成幾條直條 */
  slices?: number;
  /** 每張停留多久（ms） */
  interval?: number;
  className?: string;
}

/** slice-transition：圖片切成直條，交錯上下滑走，露出下一張 */
export function SliceSlideshow({ images, slices: count = 6, interval = 3200, className }: SliceSlideshowProps) {
  const reduce = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const [index, setIndex] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [hover, setHover] = useState(false);
  const n = images.length;

  const go = (next: number) => {
    setPrev(index);
    setIndex(((next % n) + n) % n);
  };

  // 自動播放：離開畫面、滑過或 reduced motion 時停止
  useEffect(() => {
    if (reduce || !inView || hover || n < 2) return;
    const t = setTimeout(() => {
      setPrev(index);
      setIndex((index + 1) % n);
    }, interval);
    return () => clearTimeout(t);
  }, [index, inView, hover, reduce, interval, n]);

  if (n === 0) return null;
  const current = images[index];
  const leaving = prev !== null && !reduce ? images[prev] : null;

  return (
    <div
      ref={ref}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      className={cn(frame, "aspect-[4/3]", className)}
      aria-roledescription="carousel"
    >
      <img src={current.src} alt={current.alt} className={img} draggable={false} />
      {leaving && (
        <div key={`${prev}-${index}`} aria-hidden className="absolute inset-0 flex">
          {Array.from({ length: count }, (_, i) => (
            <motion.div
              key={i}
              className="relative h-full overflow-hidden"
              style={{ width: `${100 / count}%` }}
              initial={{ y: 0 }}
              animate={{ y: i % 2 === 0 ? "-102%" : "102%" }}
              transition={{ duration: 0.8, delay: i * 0.06, ease: [0.65, 0, 0.35, 1] }}
            >
              <img
                src={leaving.src}
                alt=""
                draggable={false}
                className="absolute top-0 h-full max-w-none select-none object-cover"
                style={{ width: `${count * 100}%`, left: `${-i * 100}%` }}
              />
            </motion.div>
          ))}
        </div>
      )}
      {n > 1 && (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {images.map((item, i) => (
            <button
              key={item.src}
              type="button"
              aria-label={`${i + 1} / ${n}`}
              aria-current={i === index}
              onClick={() => i !== index && go(i)}
              className={cn("h-1.5 rounded-full bg-white shadow transition-all", i === index ? "w-4" : "w-1.5 opacity-60")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export interface LightboxProps {
  images: ImageItem[];
  /** 縮圖網格的 className */
  className?: string;
  /** 關閉按鈕的無障礙標籤 */
  closeLabel?: string;
}

/** lightbox-zoom：縮圖從原位長大到畫面中央並暗下背景，點擊或 Esc 關閉 */
export function Lightbox({ images, className, closeLabel = "Close" }: LightboxProps) {
  const reduce = useReducedMotion() ?? false;
  const group = useId();
  const [open, setOpen] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const transition = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 260, damping: 30 };

  useEffect(() => {
    if (open === null) return;
    // 開啟時把焦點移到關閉按鈕，Esc 可關閉
    closeRef.current?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <LayoutGroup id={group}>
      <div className={cn("grid grid-cols-3 gap-2", className)}>
        {images.map((item, i) => (
          <button
            key={item.src}
            type="button"
            onClick={() => setOpen(i)}
            className="relative aspect-square overflow-hidden rounded-lg bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {open !== i && (
              <motion.img
                layoutId={`lb-${i}`}
                transition={transition}
                src={item.src}
                alt={item.alt}
                draggable={false}
                className="absolute inset-0 size-full object-cover"
              />
            )}
          </button>
        ))}
      </div>
      <AnimatePresence>
        {open !== null && (
          <motion.div
            key="lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={images[open].alt}
            className="fixed inset-0 z-50 grid place-items-center p-6"
            onClick={() => setOpen(null)}
          >
            <motion.div
              aria-hidden
              className="absolute inset-0 bg-black/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.25 }}
            />
            <motion.img
              layoutId={`lb-${open}`}
              transition={transition}
              src={images[open].src}
              alt={images[open].alt}
              draggable={false}
              className="relative max-h-[80vh] w-auto max-w-[min(90vw,48rem)] cursor-zoom-out rounded-xl object-contain shadow-2xl"
            />
            <button
              type="button"
              aria-label={closeLabel}
              ref={closeRef}
              onClick={() => setOpen(null)}
              className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-black/50 text-white"
            >
              <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}
