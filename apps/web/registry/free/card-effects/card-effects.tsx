"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
  type Variants,
} from "framer-motion";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Single-card effects, switched with EffectCard's effect prop */
export const cardEffects = ["hover-lift", "spotlight", "tilt-3d", "glare", "flip", "info-slide-up", "wobble", "curl", "border-beam"] as const;
export type CardEffect = (typeof cardEffects)[number];

/** Card group effects, each its own component (takes an items array) */
export const cardGroupEffects = ["focus-dim", "stack-fan", "border-spotlight-grid", "expanding-panels", "bento-expand"] as const;
export type CardGroupEffect = (typeof cardGroupEffects)[number];

export interface EffectCardProps {
  effect?: CardEffect;
  /** Image area at the top of the card, usually one <img>; it fills automatically */
  media?: ReactNode;
  title?: ReactNode;
  /** Price or number right of the title, tabular-nums; floats on the top layer with tilt-3d */
  price?: ReactNode;
  /** Body text; with info-slide-up it is the panel that slides up */
  children?: ReactNode;
  /** Back face content for flip */
  back?: ReactNode;
  /** How flip is triggered */
  flipOn?: "hover" | "click";
  /** Glow and foil colour, defaults to var(--primary) */
  colors?: string[];
  /** Maximum tilt angle for tilt / glare */
  intensity?: number;
  /** Size of the curl corner (px) */
  curlSize?: number;
  /** Layer depth for tilt-3d (px): image, title and price lift in turn; larger values spread them further */
  depth?: number;
  /** border-beam: when true (processing, selected) the thin line keeps circling in the brand spot colour; otherwise it circles once on hover or focus */
  active?: boolean;
  className?: string;
}

const shell = "relative rounded-xl border border-border bg-card text-card-foreground";
const soft = { type: "spring", stiffness: 260, damping: 26 } as const;
const tiltSpring = { stiffness: 220, damping: 20, mass: 0.6 };

// Pointer position inside the element (0 to 1), read from the static outer element so the moving card does not cause feedback jitter
function usePointer() {
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const reset = () => {
    px.set(0.5);
    py.set(0.5);
  };
  return { px, py, onPointerMove, reset };
}

function usePercent(v: MotionValue<number>) {
  return useTransform(v, (n) => `${n * 100}%`);
}

function Media({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative aspect-[16/10] overflow-hidden bg-muted [&_img]:size-full [&_img]:object-cover", className)}>{children}</div>
  );
}

interface BodyProps {
  title?: ReactNode;
  price?: ReactNode;
  children?: ReactNode;
  /** Extra lift of the price above the body (px), tilt-3d only */
  lift?: number;
  className?: string;
}

function Body({ title, price, children, lift, className }: BodyProps) {
  if (!title && !price && !children) return null;
  const heading = title && <h3 className="min-w-0 font-semibold tracking-tight">{title}</h3>;
  const layered = lift ? { transformStyle: "preserve-3d" as const } : undefined;
  return (
    <div className={cn("p-4", className)} style={layered}>
      {price ? (
        <div className="flex items-baseline justify-between gap-3" style={layered}>
          {heading}
          <span className="shrink-0 text-sm font-semibold tabular-nums" style={lift ? { transform: `translateZ(${lift}px)` } : undefined}>
            {price}
          </span>
        </div>
      ) : (
        heading
      )}
      {children && <div className="mt-1 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

function Front({ media, title, price, children }: Pick<EffectCardProps, "media" | "title" | "price" | "children">) {
  return (
    <>
      {media && <Media>{media}</Media>}
      <Body title={title} price={price}>{children}</Body>
    </>
  );
}

export function EffectCard(props: EffectCardProps) {
  const reduce = useReducedMotion() ?? false;
  if (reduce) return <ReducedCard {...props} />;
  switch (props.effect ?? "hover-lift") {
    case "hover-lift":
      return <HoverLift {...props} />;
    case "spotlight":
      return <Spotlight {...props} />;
    case "tilt-3d":
      return <Tilt3d {...props} />;
    case "glare":
      return <Glare {...props} />;
    case "flip":
      return <Flip {...props} />;
    case "info-slide-up":
      return <InfoSlideUp {...props} />;
    case "wobble":
      return <Wobble {...props} />;
    case "curl":
      return <Curl {...props} />;
    case "border-beam":
      return <BorderBeam {...props} />;
  }
}

// Reduced motion: no translate or rotate, only the border colour changes; flip back and info panel show directly so no content is lost
function ReducedCard({ effect = "hover-lift", media, title, price, children, back, flipOn = "hover", active, className }: EffectCardProps) {
  const [flipped, setFlipped] = useState(false);
  if (effect === "flip") {
    const hover = flipOn === "hover";
    return (
      <div
        role={hover ? undefined : "button"}
        tabIndex={0}
        aria-pressed={hover ? undefined : flipped}
        onPointerEnter={hover ? () => setFlipped(true) : undefined}
        onPointerLeave={hover ? () => setFlipped(false) : undefined}
        onFocus={hover ? () => setFlipped(true) : undefined}
        onBlur={hover ? () => setFlipped(false) : undefined}
        onClick={hover ? undefined : () => setFlipped((f) => !f)}
        onKeyDown={hover ? undefined : (e) => toggleKey(e, () => setFlipped((f) => !f))}
        className={cn(shell, "overflow-hidden transition-colors hover:border-primary", className)}
      >
        {flipped ? back : <Front media={media} title={title} price={price}>{children}</Front>}
      </div>
    );
  }
  if (effect === "info-slide-up") {
    return (
      <div className={cn(shell, "flex flex-col overflow-hidden transition-colors hover:border-primary", className)}>
        {media && <Media>{media}</Media>}
        <Body title={title} price={price}>{children}</Body>
      </div>
    );
  }
  // Active border-beam with reduced motion: no circling, a full brand-colour border instead, so the state is kept
  const on = effect === "border-beam" && active;
  return (
    <div
      aria-busy={on || undefined}
      className={cn(shell, "overflow-hidden transition-colors hover:border-primary", on && "border-[var(--sunui-spot,var(--primary))]", className)}
    >
      <Front media={media} title={title} price={price}>{children}</Front>
    </div>
  );
}

function toggleKey(e: KeyboardEvent<HTMLElement>, fn: () => void) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fn();
  }
}

/* hover-lift: card rises, shadow deepens, thumbnail zooms inside its frame */
const liftCard: Variants = {
  rest: { y: 0, boxShadow: "0 1px 2px rgb(0 0 0 / 0.06)" },
  hover: { y: -6, boxShadow: "0 18px 40px -12px rgb(0 0 0 / 0.28)" },
};
const liftMedia: Variants = { rest: { scale: 1 }, hover: { scale: 1.08 } };

function HoverLift({ media, title, price, children, className }: EffectCardProps) {
  return (
    <motion.div
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileFocus="hover"
      tabIndex={0}
      variants={liftCard}
      transition={soft}
      className={cn(shell, "overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
    >
      {media && (
        <Media>
          <motion.div variants={liftMedia} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="size-full">
            {media}
          </motion.div>
        </Media>
      )}
      <Body title={title} price={price}>{children}</Body>
    </motion.div>
  );
}

/* spotlight: a beam of light follows the pointer inside the card and lights the nearby border */
function Spotlight({ media, title, price, children, colors, className }: EffectCardProps) {
  const glow = colors?.[0] ?? "var(--primary)";
  const { px, py, onPointerMove } = usePointer();
  const x = usePercent(px);
  const y = usePercent(py);
  const [on, setOn] = useState(false);
  const edge = useMotionTemplate`radial-gradient(220px circle at ${x} ${y}, ${glow}, transparent 70%)`;
  const fill = useMotionTemplate`radial-gradient(320px circle at ${x} ${y}, color-mix(in oklch, ${glow} 14%, transparent), transparent 70%)`;
  return (
    <div
      onPointerMove={onPointerMove}
      onPointerEnter={() => setOn(true)}
      onPointerLeave={() => setOn(false)}
      className={cn("relative rounded-xl bg-border p-px", className)}
    >
      <motion.div aria-hidden className="absolute inset-0 rounded-xl" style={{ background: edge }} animate={{ opacity: on ? 1 : 0 }} />
      <div className="relative h-full overflow-hidden rounded-[11px] bg-card text-card-foreground">
        <Front media={media} title={title} price={price}>{children}</Front>
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: fill }}
          animate={{ opacity: on ? 1 : 0 }}
        />
      </div>
    </div>
  );
}

/* tilt-3d: card tilts toward the pointer in 3D, image, title and price lift in layers */
function Tilt3d({ media, title, price, children, intensity = 12, depth = 48, className }: EffectCardProps) {
  const { px, py, onPointerMove, reset } = usePointer();
  const rotateX = useSpring(useTransform(py, [0, 1], [intensity, -intensity]), tiltSpring);
  const rotateY = useSpring(useTransform(px, [0, 1], [-intensity, intensity]), tiltSpring);
  return (
    <div onPointerMove={onPointerMove} onPointerLeave={reset} className={cn("[perspective:900px]", className)}>
      <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }} className={cn(shell, "h-full")}>
        {media && (
          <div style={{ transform: `translateZ(${Math.round(depth * 0.58)}px)` }} className="p-3 pb-0">
            <Media className="rounded-lg shadow-lg">{media}</Media>
          </div>
        )}
        <div style={{ transform: `translateZ(${depth}px)`, transformStyle: "preserve-3d" }}>
          <Body title={title} price={price} lift={Math.round(depth / 3)}>
            {children}
          </Body>
        </div>
      </motion.div>
    </div>
  );
}

/* glare: holographic foil and reflection flow with the pointer angle while the card tilts slightly */
function Glare({ media, title, price, children, colors, intensity = 10, className }: EffectCardProps) {
  const { px, py, onPointerMove, reset } = usePointer();
  const [on, setOn] = useState(false);
  const rotateX = useSpring(useTransform(py, [0, 1], [intensity, -intensity]), tiltSpring);
  const rotateY = useSpring(useTransform(px, [0, 1], [-intensity, intensity]), tiltSpring);
  const angle = useTransform([px, py], ([a, b]: number[]) => (Math.atan2(b - 0.5, a - 0.5) * 180) / Math.PI + 90);
  const x = usePercent(px);
  const y = usePercent(py);
  // Default foil colours are four hues derived from --primary, so the foil follows the theme
  const foilStops = (
    colors ?? [0, 70, 140, 210].map((h) => `oklch(from var(--primary) 0.82 max(c, 0.14) calc(h + ${h}))`)
  ).join(", ");
  const foil = useMotionTemplate`repeating-linear-gradient(${angle}deg, ${foilStops}, ${colors?.[0] ?? "oklch(from var(--primary) 0.82 max(c, 0.14) h)"} 40%)`;
  const shine = useMotionTemplate`radial-gradient(260px circle at ${x} ${y}, rgb(255 255 255 / 0.55), transparent 60%)`;
  return (
    <div
      onPointerMove={onPointerMove}
      onPointerEnter={() => setOn(true)}
      onPointerLeave={() => {
        reset();
        setOn(false);
      }}
      className={cn("[perspective:900px]", className)}
    >
      <motion.div style={{ rotateX, rotateY }} className={cn(shell, "h-full overflow-hidden")}>
        <Front media={media} title={title} price={price}>{children}</Front>
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-overlay"
          style={{ background: foil }}
          animate={{ opacity: on ? 0.7 : 0 }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-soft-light"
          style={{ background: shine }}
          animate={{ opacity: on ? 1 : 0 }}
        />
      </motion.div>
    </div>
  );
}

/* flip: flips to the back in 3D on hover or click */
function Flip({ media, title, price, children, back, flipOn = "hover", className }: EffectCardProps) {
  const [flipped, setFlipped] = useState(false);
  const hover = flipOn === "hover";
  const face = cn(shell, "overflow-hidden [backface-visibility:hidden] [grid-area:1/1]");
  return (
    <div
      role={hover ? undefined : "button"}
      tabIndex={0}
      aria-pressed={hover ? undefined : flipped}
      onPointerEnter={hover ? () => setFlipped(true) : undefined}
      onPointerLeave={hover ? () => setFlipped(false) : undefined}
      onFocus={hover ? () => setFlipped(true) : undefined}
      onBlur={hover ? () => setFlipped(false) : undefined}
      onClick={hover ? undefined : () => setFlipped((f) => !f)}
      onKeyDown={hover ? undefined : (e) => toggleKey(e, () => setFlipped((f) => !f))}
      className={cn("rounded-xl outline-none [perspective:1000px] focus-visible:ring-2 focus-visible:ring-ring", !hover && "cursor-pointer", className)}
    >
      <motion.div
        className="grid h-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 22 }}
      >
        <div className={face} aria-hidden={flipped}>
          <Front media={media} title={title} price={price}>{children}</Front>
        </div>
        <div className={cn(face, "[transform:rotateY(180deg)]")} aria-hidden={!flipped}>
          {back}
        </div>
      </motion.div>
    </div>
  );
}

/* info-slide-up: the card shows only the title at rest; the info panel slides up on hover */
const slideTitle: Variants = { rest: { opacity: 1, y: 0 }, open: { opacity: 0, y: -10 } };
const slidePanel: Variants = { rest: { y: "101%" }, open: { y: 0 } };

function InfoSlideUp({ media, title, children, className }: EffectCardProps) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      tabIndex={0}
      initial={false}
      animate={open ? "open" : "rest"}
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      className={cn(
        shell,
        "aspect-[4/5] overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-ring [&_img]:size-full [&_img]:object-cover",
        className,
      )}
    >
      <div className="absolute inset-0 bg-muted">{media}</div>
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
      <motion.h3 variants={slideTitle} transition={soft} className="absolute inset-x-0 bottom-0 p-4 font-semibold tracking-tight text-white">
        {title}
      </motion.h3>
      <motion.div
        variants={slidePanel}
        transition={soft}
        className="absolute inset-x-0 bottom-0 border-t border-border bg-card/95 p-4 text-card-foreground backdrop-blur"
      >
        {title && <p className="font-semibold tracking-tight">{title}</p>}
        <div className="mt-1 text-sm text-muted-foreground">{children}</div>
      </motion.div>
    </motion.div>
  );
}

/* wobble: card sways slightly with the pointer and springs back like jelly on leave */
function Wobble({ media, title, price, children, className }: EffectCardProps) {
  const { px, py, onPointerMove, reset } = usePointer();
  const jelly = { stiffness: 170, damping: 7, mass: 0.7 };
  const x = useSpring(useTransform(px, [0, 1], [-6, 6]), jelly);
  const y = useSpring(useTransform(py, [0, 1], [-4, 4]), jelly);
  const rotate = useSpring(useTransform(px, [0, 1], [-3, 3]), jelly);
  const skewX = useSpring(useTransform(py, [0, 1], [-1.5, 1.5]), jelly);
  return (
    <div onPointerMove={onPointerMove} onPointerLeave={reset} className={className}>
      <motion.div style={{ x, y, rotate, skewX }} className={cn(shell, "h-full overflow-hidden")}>
        <Front media={media} title={title} price={price}>{children}</Front>
      </motion.div>
    </div>
  );
}

/* curl: bottom-right corner curls up like paper on hover */
function Curl({ media, title, price, children, curlSize = 56, className }: EffectCardProps) {
  const c = useSpring(0, { stiffness: 260, damping: 22 });
  const clip = useMotionTemplate`polygon(0 0, 100% 0, 100% calc(100% - ${c}px), calc(100% - ${c}px) 100%, 0 100%)`;
  return (
    <div
      onPointerEnter={() => c.set(curlSize)}
      onPointerLeave={() => c.set(0)}
      className={cn("relative rounded-xl", className)}
    >
      <motion.div style={{ clipPath: clip }} className={cn(shell, "h-full overflow-hidden")}>
        <Front media={media} title={title} price={price}>{children}</Front>
      </motion.div>
      {/* Back of the curl: top-left triangle of the corner square, brightest near the fold */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 [filter:drop-shadow(-3px_-3px_4px_rgb(0_0_0/0.18))]"
        style={{
          width: c,
          height: c,
          background:
            "linear-gradient(135deg, color-mix(in oklch, var(--foreground) 10%, var(--muted)) 0%, var(--muted) 30%, var(--card) 48%, transparent 50%)",
        }}
      />
    </div>
  );
}

/* border-beam: on hover or focus a thin line circles the border once and stops. It is a response, not a decorative loop.
   When active is true (processing, selected) it keeps circling in the brand spot colour, the loading exception. No glow, no multi-colour gradient. */
const e1 =
  "shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(255_255_255/0.08)]";
// Dash length plus gap equals 1, so the loop joins end to start without a jump
const beamPath = { pathLength: 0.22, pathSpacing: 0.78 };

function BorderBeam({ media, title, price, children, active = false, className }: EffectCardProps) {
  const [lap, setLap] = useState(0);
  const run = () => {
    if (!active) setLap((n) => n + 1);
  };
  const rect = { rx: 12.25, fill: "none", strokeWidth: 1.5, style: { width: "calc(100% - 1.5px)", height: "calc(100% - 1.5px)" } };
  return (
    <div
      tabIndex={0}
      aria-busy={active || undefined}
      onPointerEnter={run}
      onFocus={run}
      className={cn(
        "relative rounded-xl bg-card text-card-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        e1,
        className,
      )}
    >
      <div className="h-full overflow-hidden rounded-[inherit]">
        <Front media={media} title={title} price={price}>{children}</Front>
      </div>
      {/* Line sits on the 1px border: the SVG extends 1px outward and the stroke centre moves in by half a stroke width */}
      <svg aria-hidden className="pointer-events-none absolute -left-px -top-px size-[calc(100%+2px)] overflow-visible">
        <g transform="translate(0.75 0.75)">
          {active ? (
            <motion.rect
              key="loop"
              {...rect}
              className="stroke-[var(--sunui-spot,var(--primary))]"
              initial={{ ...beamPath, pathOffset: 0 }}
              animate={{ ...beamPath, pathOffset: 1 }}
              transition={{ duration: 1.6, ease: "linear", repeat: Infinity }}
            />
          ) : lap > 0 ? (
            <motion.rect
              key={lap}
              {...rect}
              className="stroke-foreground"
              initial={{ ...beamPath, pathOffset: 0, opacity: 1 }}
              animate={{ ...beamPath, pathOffset: 1, opacity: 0 }}
              transition={{ pathOffset: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }, opacity: { duration: 0.12, delay: 0.3 } }}
            />
          ) : null}
        </g>
      </svg>
    </div>
  );
}

/* ───────── Group effects ───────── */

export interface EffectCardItem {
  id: string;
  title: ReactNode;
  media?: ReactNode;
  description?: ReactNode;
}

export interface CardGroupProps {
  items: EffectCardItem[];
  className?: string;
}

function ItemCard({ item, className }: { item: EffectCardItem; className?: string }) {
  return (
    <div className={cn(shell, "h-full overflow-hidden", className)}>
      {item.media && <Media>{item.media}</Media>}
      <Body title={item.title}>{item.description}</Body>
    </div>
  );
}

/** focus-dim: the hovered card rises, the others dim and shrink slightly */
export function FocusGrid({ items, className }: CardGroupProps) {
  const reduce = useReducedMotion() ?? false;
  const [active, setActive] = useState<number | null>(null);
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)} onPointerLeave={() => setActive(null)}>
      {items.map((item, i) => {
        const state = active === null ? "rest" : active === i ? "focus" : "dim";
        return (
          <motion.div
            key={item.id}
            tabIndex={0}
            onPointerEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            initial={false}
            animate={
              reduce
                ? { opacity: state === "dim" ? 0.55 : 1 }
                : state === "focus"
                  ? { y: -6, scale: 1.02, opacity: 1 }
                  : state === "dim"
                    ? { y: 0, scale: 0.97, opacity: 0.5 }
                    : { y: 0, scale: 1, opacity: 1 }
            }
            transition={soft}
            className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ItemCard item={item} className={state === "focus" ? "shadow-xl" : undefined} />
          </motion.div>
        );
      })}
    </div>
  );
}

// Measure container width for groups that lay out by width
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

export interface StackFanProps extends CardGroupProps {
  /** Width of each card (px) */
  cardWidth?: number;
  gap?: number;
}

/** stack-fan: a slightly offset, rotated stack of cards that fans out into a row on hover */
export function StackFan({ items, cardWidth = 150, gap = 12, className }: StackFanProps) {
  const reduce = useReducedMotion() ?? false;
  const [ref, width] = useWidth<HTMLDivElement>();
  const [open, setOpen] = useState(false);
  const n = items.length;
  const mid = (n - 1) / 2;
  // When the container is too narrow the cards overlap instead of overflowing
  const step = n > 1 ? Math.min(cardWidth + gap, Math.max(0, (width - cardWidth) / (n - 1))) : 0;
  return (
    <div
      ref={ref}
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      className={cn("relative w-full rounded-xl", className)}
      style={{ height: cardWidth * 1.45 + 24 }}
    >
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          className="absolute left-1/2 top-3"
          style={{ width: cardWidth, marginLeft: -cardWidth / 2, zIndex: i }}
          initial={false}
          animate={
            open || reduce
              ? { x: (i - mid) * step, rotate: 0, y: 0 }
              : { x: (i - mid) * 8, rotate: (i - mid) * 6, y: Math.abs(i - mid) * 4 }
          }
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 220, damping: 22, delay: open ? i * 0.03 : 0 }}
        >
          <div className={cn(shell, "overflow-hidden shadow-md")}>
            {item.media && <Media className="aspect-[4/5]">{item.media}</Media>}
            <p className="truncate px-3 py-2 text-xs font-medium">{item.title}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export interface SpotlightGridProps extends CardGroupProps {
  colors?: string[];
  /** Spotlight radius (px) */
  radius?: number;
}

/** border-spotlight-grid: one pointer light lights the borders of all nearby cards */
export function SpotlightGrid({ items, colors, radius = 240, className }: SpotlightGridProps) {
  const glow = colors?.[0] ?? "var(--primary)";
  const root = useRef<HTMLDivElement>(null);
  const cells = useRef<(HTMLDivElement | null)[]>([]);
  // Write CSS variables directly, no re-render
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    for (const el of cells.current) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--sx", `${e.clientX - r.left}px`);
      el.style.setProperty("--sy", `${e.clientY - r.top}px`);
    }
    root.current?.style.setProperty("--so", "1");
  };
  return (
    <div
      ref={root}
      onPointerMove={onPointerMove}
      onPointerLeave={() => root.current?.style.setProperty("--so", "0")}
      className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}
    >
      {items.map((item, i) => (
        <div
          key={item.id}
          ref={(el) => {
            cells.current[i] = el;
          }}
          className="relative rounded-xl bg-border p-px"
        >
          <div
            aria-hidden
            className="absolute inset-0 rounded-xl transition-opacity duration-300"
            style={{
              opacity: "var(--so, 0)",
              background: `radial-gradient(${radius}px circle at var(--sx, -999px) var(--sy, -999px), ${glow}, transparent 70%)`,
            }}
          />
          <div className="relative h-full overflow-hidden rounded-[11px] bg-card text-card-foreground">
            {item.media && <Media>{item.media}</Media>}
            <Body title={item.title}>{item.description}</Body>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 transition-opacity duration-300"
              style={{
                opacity: "var(--so, 0)",
                background: `radial-gradient(${radius * 1.4}px circle at var(--sx, -999px) var(--sy, -999px), color-mix(in oklch, ${glow} 10%, transparent), transparent 70%)`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** expanding-panels: a row of narrow panels; the hovered one widens and shows its title */
export function ExpandingPanels({ items, className }: CardGroupProps) {
  const reduce = useReducedMotion() ?? false;
  const [active, setActive] = useState(0);
  return (
    <div className={cn("flex h-72 w-full gap-2", className)}>
      {items.map((item, i) => {
        const on = active === i;
        return (
          <motion.div
            key={item.id}
            tabIndex={0}
            aria-expanded={on}
            onPointerEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            initial={false}
            animate={{ flexGrow: on ? 5 : 1 }}
            transition={reduce ? { duration: 0 } : soft}
            style={{ flexBasis: 0 }}
            className="relative min-w-0 overflow-hidden rounded-xl border border-border bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring [&_img]:absolute [&_img]:inset-0 [&_img]:size-full [&_img]:object-cover"
          >
            {item.media}
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/65 to-transparent" />
            <motion.div
              initial={false}
              animate={{ opacity: on ? 1 : 0, y: on ? 0 : 12 }}
              transition={reduce ? { duration: 0 } : { ...soft, delay: on ? 0.08 : 0 }}
              className="absolute inset-x-0 bottom-0 min-w-48 p-4 text-white"
            >
              <h3 className="font-semibold tracking-tight">{item.title}</h3>
              {item.description && <p className="mt-1 text-sm text-white/80">{item.description}</p>}
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}

export interface BentoExpandProps extends CardGroupProps {
  columns?: number;
}

/** bento-expand: bento grid; the hovered cell grows and the others make room */
export function BentoExpand({ items, columns = 3, className }: BentoExpandProps) {
  const reduce = useReducedMotion() ?? false;
  const [active, setActive] = useState<number | null>(null);
  const rows = Math.ceil(items.length / columns);
  const track = (count: number, hit: number | null) =>
    Array.from({ length: count }, (_, k) => (hit === k ? "2.2fr" : "1fr")).join(" ");
  const colHit = active === null ? null : active % columns;
  const rowHit = active === null ? null : Math.floor(active / columns);
  return (
    <motion.div
      initial={false}
      animate={{ gridTemplateColumns: track(columns, colHit), gridTemplateRows: track(rows, rowHit) }}
      transition={reduce ? { duration: 0 } : soft}
      onPointerLeave={() => setActive(null)}
      className={cn("grid h-80 w-full gap-2", className)}
    >
      {items.map((item, i) => (
        <div
          key={item.id}
          onPointerEnter={() => setActive(i)}
          className={cn(
            "relative min-h-0 min-w-0 overflow-hidden rounded-xl border border-border bg-muted outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring [&_img]:absolute [&_img]:inset-0 [&_img]:size-full [&_img]:object-cover",
            active === i && "border-primary",
          )}
        >
          {item.media}
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/60 to-transparent" />
          <h3 className="absolute inset-x-0 bottom-0 truncate p-3 text-sm font-semibold tracking-tight text-white">{item.title}</h3>
        </div>
      ))}
    </motion.div>
  );
}
