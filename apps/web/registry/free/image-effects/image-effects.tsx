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

/** Single-image effects, switched with the effect prop of ImageEffect */
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

/** Effects that need several images, each its own component (they take an images array) */
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
  /** For image-swap: every image to cycle through (the first may equal src) */
  images?: ImageItem[];
  /** Caption that floats up on hover-zoom */
  caption?: ReactNode;
  /** Wipe direction of clip-reveal */
  direction?: ClipDirection;
  /** How entrance effects (clip-reveal, soft-mask) are triggered */
  trigger?: "mount" | "inView";
  /** Seconds: length of an entrance effect, or of one ken-burns cycle */
  duration?: number;
  delay?: number;
  /** zoom-lens magnification */
  zoom?: number;
  /** zoom-lens lens diameter (px) */
  lensSize?: number;
  /** Outer frame className, defaults to aspect-[4/3] */
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

/* ken-burns: slow, continuous zoom and drift; pauses when off screen */
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

/* clip-reveal: clip-path wipes the image open while it scales from 1.15 back to 1 */
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

/* soft-mask: a soft-edged gradient mask sweeps left to right and reveals the image */
function SoftMask({ src, alt, trigger, duration = 1.4, delay = 0, reduce, className }: P) {
  const [ref, show] = useReveal(trigger);
  // Mask edge position (%), from -30 to 100
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

/* hover-zoom: the image scales inside a fixed frame and the caption floats up from below */
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

/* zoom-lens: a magnifier follows the pointer and shows a 2x crop */
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

/* image-swap: on hover, swaps to the second image; moving the pointer left and right cycles through more; small dots mark the current one */
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

/* glitch: on hover, splits into offset color channels with flickering horizontal slices */
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
      {/* Keep only the red and cyan (green + blue) channels; screen-blended together they restore the original image */}
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

/* saturate: desaturated and dimmed at rest; on hover returns to full color and scales up slightly */
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

/* parallax-frame: the image moves slower than its frame while scrolling */
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

/* ───────── Multi-image effects ───────── */

export interface SliceSlideshowProps {
  images: ImageItem[];
  /** Number of vertical strips */
  slices?: number;
  /** How long each image stays (ms) */
  interval?: number;
  className?: string;
}

/** slice-transition: the image is cut into vertical strips that slide up and down in alternation to reveal the next one */
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

  // Autoplay: stops when off screen, hovered, or with reduced motion
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
  /** Thumbnail grid className */
  className?: string;
  /** Accessible label for the close button */
  closeLabel?: string;
}

/** lightbox-zoom: a thumbnail grows from its place to the center of the screen and dims the background; click or Esc closes it */
export function Lightbox({ images, className, closeLabel = "Close" }: LightboxProps) {
  const reduce = useReducedMotion() ?? false;
  const group = useId();
  const [open, setOpen] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const transition = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 260, damping: 30 };

  useEffect(() => {
    if (open === null) return;
    // On open, move focus to the close button; Esc closes
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
