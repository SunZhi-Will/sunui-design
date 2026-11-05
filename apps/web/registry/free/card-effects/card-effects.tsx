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

/** 單張卡片效果，用 EffectCard 的 effect prop 切換 */
export const cardEffects = ["hover-lift", "spotlight", "tilt-3d", "glare", "flip", "info-slide-up", "wobble", "curl"] as const;
export type CardEffect = (typeof cardEffects)[number];

/** 卡片群組效果，各自是獨立元件（吃 items 陣列） */
export const cardGroupEffects = ["focus-dim", "stack-fan", "border-spotlight-grid", "expanding-panels", "bento-expand"] as const;
export type CardGroupEffect = (typeof cardGroupEffects)[number];

export interface EffectCardProps {
  effect?: CardEffect;
  /** 卡片上方的圖片區，通常放一個 <img>，會自動填滿 */
  media?: ReactNode;
  title?: ReactNode;
  /** 內文；info-slide-up 時是滑上來的資訊面板 */
  children?: ReactNode;
  /** flip 的背面內容 */
  back?: ReactNode;
  /** flip 的觸發方式 */
  flipOn?: "hover" | "click";
  /** 光暈與箔光顏色，預設跟隨 var(--primary) */
  colors?: string[];
  /** tilt / glare 的最大傾斜角度 */
  intensity?: number;
  /** curl 捲角的大小（px） */
  curlSize?: number;
  className?: string;
}

const shell = "relative rounded-xl border border-border bg-card text-card-foreground";
const soft = { type: "spring", stiffness: 260, damping: 26 } as const;
const tiltSpring = { stiffness: 220, damping: 20, mass: 0.6 };

// 指標在元素內的相對位置（0 到 1），掛在外層不動的元素上，避免卡片自己移動造成回授抖動
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

function Body({ title, children, className }: { title?: ReactNode; children?: ReactNode; className?: string }) {
  if (!title && !children) return null;
  return (
    <div className={cn("p-4", className)}>
      {title && <h3 className="font-semibold tracking-tight">{title}</h3>}
      {children && <div className="mt-1 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

function Front({ media, title, children }: Pick<EffectCardProps, "media" | "title" | "children">) {
  return (
    <>
      {media && <Media>{media}</Media>}
      <Body title={title}>{children}</Body>
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
  }
}

// reduced motion：不位移不旋轉，只保留邊框顏色變化；翻面與資訊面板直接顯示，不遺失內容
function ReducedCard({ effect = "hover-lift", media, title, children, back, flipOn = "hover", className }: EffectCardProps) {
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
        {flipped ? back : <Front media={media} title={title}>{children}</Front>}
      </div>
    );
  }
  if (effect === "info-slide-up") {
    return (
      <div className={cn(shell, "flex flex-col overflow-hidden transition-colors hover:border-primary", className)}>
        {media && <Media>{media}</Media>}
        <Body title={title}>{children}</Body>
      </div>
    );
  }
  return (
    <div className={cn(shell, "overflow-hidden transition-colors hover:border-primary", className)}>
      <Front media={media} title={title}>{children}</Front>
    </div>
  );
}

function toggleKey(e: KeyboardEvent<HTMLElement>, fn: () => void) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fn();
  }
}

/* hover-lift：卡片上浮、陰影加深，縮圖在框內放大 */
const liftCard: Variants = {
  rest: { y: 0, boxShadow: "0 1px 2px rgb(0 0 0 / 0.06)" },
  hover: { y: -6, boxShadow: "0 18px 40px -12px rgb(0 0 0 / 0.28)" },
};
const liftMedia: Variants = { rest: { scale: 1 }, hover: { scale: 1.08 } };

function HoverLift({ media, title, children, className }: EffectCardProps) {
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
      <Body title={title}>{children}</Body>
    </motion.div>
  );
}

/* spotlight：一束光跟著指標在卡片內移動，並把附近的邊框點亮 */
function Spotlight({ media, title, children, colors, className }: EffectCardProps) {
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
        <Front media={media} title={title}>{children}</Front>
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

/* tilt-3d：卡片朝指標方向立體傾斜，圖片與標題分層浮出 */
function Tilt3d({ media, title, children, intensity = 12, className }: EffectCardProps) {
  const { px, py, onPointerMove, reset } = usePointer();
  const rotateX = useSpring(useTransform(py, [0, 1], [intensity, -intensity]), tiltSpring);
  const rotateY = useSpring(useTransform(px, [0, 1], [-intensity, intensity]), tiltSpring);
  return (
    <div onPointerMove={onPointerMove} onPointerLeave={reset} className={cn("[perspective:900px]", className)}>
      <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }} className={cn(shell, "h-full")}>
        {media && (
          <div style={{ transform: "translateZ(28px)" }} className="p-3 pb-0">
            <Media className="rounded-lg shadow-lg">{media}</Media>
          </div>
        )}
        <div style={{ transform: "translateZ(48px)" }}>
          <Body title={title}>{children}</Body>
        </div>
      </motion.div>
    </div>
  );
}

/* glare：全像箔光與反光隨指標角度流動，卡片同時輕微傾斜 */
function Glare({ media, title, children, colors, intensity = 10, className }: EffectCardProps) {
  const { px, py, onPointerMove, reset } = usePointer();
  const [on, setOn] = useState(false);
  const rotateX = useSpring(useTransform(py, [0, 1], [intensity, -intensity]), tiltSpring);
  const rotateY = useSpring(useTransform(px, [0, 1], [-intensity, intensity]), tiltSpring);
  const angle = useTransform([px, py], ([a, b]: number[]) => (Math.atan2(b - 0.5, a - 0.5) * 180) / Math.PI + 90);
  const x = usePercent(px);
  const y = usePercent(py);
  // 預設箔色由 --primary 的色相轉出四段，主題換了箔光也跟著換
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
        <Front media={media} title={title}>{children}</Front>
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

/* flip：滑過或點擊時 3D 翻到背面 */
function Flip({ media, title, children, back, flipOn = "hover", className }: EffectCardProps) {
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
          <Front media={media} title={title}>{children}</Front>
        </div>
        <div className={cn(face, "[transform:rotateY(180deg)]")} aria-hidden={!flipped}>
          {back}
        </div>
      </motion.div>
    </div>
  );
}

/* info-slide-up：圖卡平時只有標題，滑過時資訊面板由下滑上 */
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

/* wobble：卡片跟著指標輕微晃動，離開時像果凍般彈回 */
function Wobble({ media, title, children, className }: EffectCardProps) {
  const { px, py, onPointerMove, reset } = usePointer();
  const jelly = { stiffness: 170, damping: 7, mass: 0.7 };
  const x = useSpring(useTransform(px, [0, 1], [-6, 6]), jelly);
  const y = useSpring(useTransform(py, [0, 1], [-4, 4]), jelly);
  const rotate = useSpring(useTransform(px, [0, 1], [-3, 3]), jelly);
  const skewX = useSpring(useTransform(py, [0, 1], [-1.5, 1.5]), jelly);
  return (
    <div onPointerMove={onPointerMove} onPointerLeave={reset} className={className}>
      <motion.div style={{ x, y, rotate, skewX }} className={cn(shell, "h-full overflow-hidden")}>
        <Front media={media} title={title}>{children}</Front>
      </motion.div>
    </div>
  );
}

/* curl：滑過時右下角像紙一樣捲起 */
function Curl({ media, title, children, curlSize = 56, className }: EffectCardProps) {
  const c = useSpring(0, { stiffness: 260, damping: 22 });
  const clip = useMotionTemplate`polygon(0 0, 100% 0, 100% calc(100% - ${c}px), calc(100% - ${c}px) 100%, 0 100%)`;
  return (
    <div
      onPointerEnter={() => c.set(curlSize)}
      onPointerLeave={() => c.set(0)}
      className={cn("relative rounded-xl", className)}
    >
      <motion.div style={{ clipPath: clip }} className={cn(shell, "h-full overflow-hidden")}>
        <Front media={media} title={title}>{children}</Front>
      </motion.div>
      {/* 捲起的紙背：角落方塊的左上半三角，靠近摺線處最亮 */}
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

/* ───────── 群組效果 ───────── */

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

/** focus-dim：滑過的卡片上浮，其他卡片變暗並略縮小 */
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

// 量測容器寬度，給需要依寬度排版的群組用
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
  /** 每張卡片的寬度（px） */
  cardWidth?: number;
  gap?: number;
}

/** stack-fan：微微錯開旋轉的一疊卡片，滑過時展開成一排 */
export function StackFan({ items, cardWidth = 150, gap = 12, className }: StackFanProps) {
  const reduce = useReducedMotion() ?? false;
  const [ref, width] = useWidth<HTMLDivElement>();
  const [open, setOpen] = useState(false);
  const n = items.length;
  const mid = (n - 1) / 2;
  // 容器太窄時讓卡片互相重疊，不超出邊界
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
  /** 光圈半徑（px） */
  radius?: number;
}

/** border-spotlight-grid：一道指標光同時照亮附近所有卡片的邊框 */
export function SpotlightGrid({ items, colors, radius = 240, className }: SpotlightGridProps) {
  const glow = colors?.[0] ?? "var(--primary)";
  const root = useRef<HTMLDivElement>(null);
  const cells = useRef<(HTMLDivElement | null)[]>([]);
  // 直接寫 CSS 變數，不觸發 re-render
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

/** expanding-panels：一排窄面板，滑過的那片變寬並顯示標題 */
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

/** bento-expand：便當格，滑過的格子長大，其他格子讓出空間 */
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
