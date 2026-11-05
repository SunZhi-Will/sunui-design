"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type FocusEvent, type ReactNode, type RefObject } from "react";

import { cn } from "@/lib/utils";

export const cursorEffects = ["follower", "trail", "spotlight", "blend-circle", "crosshair", "image-hover", "magnetic-area"] as const;
export type CursorEffectName = (typeof cursorEffects)[number];

export interface CursorPreviewItem {
  id?: string;
  title: string;
  meta?: string;
  href?: string;
  /** 預覽圖片網址 */
  src?: string;
  alt?: string;
  /** 不用圖片時，可直接給一段預覽內容（例如 inline SVG） */
  preview?: ReactNode;
}

export interface CursorEffectProps {
  effect?: CursorEffectName;
  children?: ReactNode;
  className?: string;
  /** 套用到整個頁面，而不是只在這個容器內 */
  global?: boolean;
  /** follower、blend-circle、crosshair 時隱藏系統游標 */
  hideCursor?: boolean;
  /** 指標不在範圍內時，效果停在這個位置（0 到 1 的比例）；不給就隱藏 */
  idle?: { x: number; y: number };
  /** image-hover 的清單項目 */
  items?: CursorPreviewItem[];
  /** 主要圓形或光圈的尺寸（px） */
  size?: number;
  /** magnetic-area 的吸力（0 到 1），元素也可用 data-magnetic="0.5" 個別設定 */
  strength?: number;
}

/* ---------- 共用：觸控偵測與指標追蹤 ---------- */

const HOVER_QUERY = "(hover: hover) and (pointer: fine)";
const subscribeHover = (cb: () => void) => {
  const mq = window.matchMedia(HOVER_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/** 只有滑鼠或觸控板這類可懸停的裝置才顯示效果 */
function useCanHover() {
  return useSyncExternalStore(
    subscribeHover,
    () => window.matchMedia(HOVER_QUERY).matches,
    () => false,
  );
}

const INTERACTIVE = "a, button, [role='button'], input, select, textarea, label, [data-cursor-grow]";

type MoveListener = (x: number, y: number) => void;

interface Pointer {
  x: MotionValue<number>;
  y: MotionValue<number>;
  inside: boolean;
  hovering: boolean;
  subscribe: (fn: MoveListener) => () => void;
}

/** 追蹤指標：區域模式回傳相對容器的座標，global 模式回傳視窗座標 */
function usePointer(container: RefObject<HTMLDivElement | null>, global: boolean, enabled: boolean, idle?: { x: number; y: number }): Pointer {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [inside, setInside] = useState(false);
  const [hovering, setHovering] = useState(false);
  const listeners = useRef(new Set<MoveListener>());

  const subscribe = useCallback((fn: MoveListener) => {
    listeners.current.add(fn);
    return () => {
      listeners.current.delete(fn);
    };
  }, []);

  useEffect(() => {
    const el = container.current;
    if (!enabled || !el) return;
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      let px = e.clientX;
      let py = e.clientY;
      if (!global) {
        const r = el.getBoundingClientRect();
        px -= r.left;
        py -= r.top;
      }
      x.set(px);
      y.set(py);
      setInside(true);
      setHovering(e.target instanceof Element && e.target.closest(INTERACTIVE) !== null);
      listeners.current.forEach((fn) => fn(px, py));
    };
    const leave = () => {
      setInside(false);
      setHovering(false);
    };
    const leaveDocument = (e: PointerEvent) => {
      if (!e.relatedTarget) leave();
    };
    if (global) {
      window.addEventListener("pointermove", move);
      document.addEventListener("pointerout", leaveDocument);
      return () => {
        window.removeEventListener("pointermove", move);
        document.removeEventListener("pointerout", leaveDocument);
      };
    }
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [container, global, enabled, x, y]);

  // 指標離開後回到 idle 位置
  const idleX = idle?.x;
  const idleY = idle?.y;
  useEffect(() => {
    const el = container.current;
    if (inside || idleX === undefined || idleY === undefined || !el) return;
    const w = global ? window.innerWidth : el.offsetWidth;
    const h = global ? window.innerHeight : el.offsetHeight;
    x.set(w * idleX);
    y.set(h * idleY);
  }, [container, global, inside, idleX, idleY, x, y]);

  return { x, y, inside, hovering, subscribe };
}

interface EffectProps {
  pointer: Pointer;
  visible: boolean;
  reduce: boolean;
  global: boolean;
  size?: number;
}

/** 效果的圖層：區域模式貼齊容器並裁切，global 模式固定在視窗上 */
function Layer({ global, children }: { global: boolean; children: ReactNode }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none inset-0", global ? "fixed z-[100]" : "absolute overflow-hidden")}>
      {children}
    </div>
  );
}

const follow = { stiffness: 170, damping: 18, mass: 0.6 };

/* ---------- 各效果 ---------- */

function Follower({ pointer, visible, reduce, global, size = 32 }: EffectProps) {
  const rx = useSpring(pointer.x, follow);
  const ry = useSpring(pointer.y, follow);
  return (
    <Layer global={global}>
      <motion.span
        className="absolute left-0 top-0 rounded-full border-2 border-foreground/50"
        style={{
          x: reduce ? pointer.x : rx,
          y: reduce ? pointer.y : ry,
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
        }}
        initial={false}
        animate={{ opacity: visible ? 1 : 0, scale: pointer.hovering && !reduce ? 1.6 : 1 }}
        transition={{ duration: 0.2 }}
      />
      <motion.span
        className="absolute left-0 top-0 -ml-1 -mt-1 size-2 rounded-full bg-foreground transition-opacity duration-200"
        style={{ x: pointer.x, y: pointer.y, opacity: visible ? 1 : 0 }}
      />
    </Layer>
  );
}

function Trail({ pointer, visible, reduce, global, size = 6 }: EffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { subscribe } = pointer;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (reduce || !canvas || !ctx) return;
    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const life = 600;
    const points: { x: number; y: number; t: number }[] = [];
    let raf = 0;
    let color = "currentColor";

    const draw = (now: number) => {
      while (points.length && now - points[0].t > life) points.shift();
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color;
      for (const p of points) {
        const k = 1 - (now - p.t) / life;
        ctx.globalAlpha = k * 0.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1 + size * k, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // 點都消失就停掉 rAF，閒置時不耗電
      raf = points.length ? requestAnimationFrame(draw) : 0;
    };

    const unsubscribe = subscribe((px, py) => {
      const now = performance.now();
      const last = points[points.length - 1];
      if (last) {
        // 移動很快時在兩點間補點，尾巴才連續
        const steps = Math.min(10, Math.floor(Math.hypot(px - last.x, py - last.y) / 8));
        for (let i = 1; i < steps; i++) {
          points.push({ x: last.x + ((px - last.x) * i) / steps, y: last.y + ((py - last.y) * i) / steps, t: now });
        }
      }
      points.push({ x: px, y: py, t: now });
      if (!raf) {
        color = getComputedStyle(canvas).color;
        raf = requestAnimationFrame(draw);
      }
    });

    return () => {
      unsubscribe();
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [reduce, subscribe, size]);

  return (
    <Layer global={global}>
      {reduce ? (
        // 減少動態：不畫拖尾，只留一個跟隨的點
        <motion.span
          className="absolute left-0 top-0 -ml-1 -mt-1 size-2 rounded-full bg-primary transition-opacity"
          style={{ x: pointer.x, y: pointer.y, opacity: visible ? 1 : 0 }}
        />
      ) : (
        <canvas ref={canvasRef} className="absolute inset-0 size-full text-primary" />
      )}
    </Layer>
  );
}

function Spotlight({ pointer, visible, reduce, global, size = 220 }: EffectProps) {
  const sx = useSpring(pointer.x, { stiffness: 300, damping: 30 });
  const sy = useSpring(pointer.y, { stiffness: 300, damping: 30 });
  const x = reduce ? pointer.x : sx;
  const y = reduce ? pointer.y : sy;
  const background = useMotionTemplate`radial-gradient(${size}px circle at ${x}px ${y}px, color-mix(in oklab, var(--primary) 14%, transparent) 0%, transparent 55%, color-mix(in oklab, var(--background) 82%, transparent) 100%)`;
  return (
    <Layer global={global}>
      <motion.div className="absolute inset-0 transition-opacity duration-300" style={{ background, opacity: visible ? 1 : 0 }} />
    </Layer>
  );
}

function BlendCircle({ pointer, visible, reduce, global, size = 80 }: EffectProps) {
  const rx = useSpring(pointer.x, follow);
  const ry = useSpring(pointer.y, follow);
  const circle = (
    <motion.span
      aria-hidden="true"
      className={cn(
        "pointer-events-none left-0 top-0 rounded-full bg-white mix-blend-difference",
        global ? "fixed z-[100]" : "absolute",
      )}
      style={{
        x: reduce ? pointer.x : rx,
        y: reduce ? pointer.y : ry,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
      }}
      initial={false}
      animate={{ opacity: visible ? 1 : 0, scale: pointer.hovering && !reduce ? 1.6 : 1 }}
      transition={{ duration: 0.25 }}
    />
  );
  // fixed 會自成堆疊環境，混合模式就失效，所以 global 時圓形直接 fixed，不包圖層
  if (global) return circle;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {circle}
    </div>
  );
}

function Crosshair({ pointer, visible, global }: EffectProps) {
  const label = useTransform([pointer.x, pointer.y], ([a, b]) => `${Math.round(a as number)}, ${Math.round(b as number)}`);
  const lx = useTransform(pointer.x, (v) => v + 10);
  const ly = useTransform(pointer.y, (v) => v + 10);
  const show = visible ? 1 : 0;
  return (
    <Layer global={global}>
      <motion.span className="absolute inset-x-0 top-0 h-px bg-foreground/40 transition-opacity" style={{ y: pointer.y, opacity: show }} />
      <motion.span className="absolute inset-y-0 left-0 w-px bg-foreground/40 transition-opacity" style={{ x: pointer.x, opacity: show }} />
      <motion.span
        className="absolute left-0 top-0 rounded-sm bg-foreground px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-background transition-opacity"
        style={{ x: lx, y: ly, opacity: show }}
      >
        {label}
      </motion.span>
    </Layer>
  );
}

function PreviewArt({ item }: { item: CursorPreviewItem }) {
  if (item.src) {
    return <img src={item.src} alt={item.alt ?? ""} className="size-full object-cover" />;
  }
  if (item.preview) return <>{item.preview}</>;
  return (
    <div
      className="grid size-full place-items-center text-3xl font-semibold text-primary-foreground"
      style={{ background: "linear-gradient(135deg, var(--primary), color-mix(in oklab, var(--primary) 35%, var(--muted)))" }}
    >
      {item.title.slice(0, 1)}
    </div>
  );
}

function ImageHover({
  pointer,
  reduce,
  global,
  enabled,
  items,
  container,
  children,
}: EffectProps & { enabled: boolean; items: CursorPreviewItem[]; container: RefObject<HTMLDivElement | null>; children?: ReactNode }) {
  const [active, setActive] = useState<number | null>(null);
  const [shown, setShown] = useState(0);
  // 記住最後一個項目，卡片淡出時內容不會跳掉（render 期間的衍生狀態）
  if (active !== null && active !== shown) setShown(active);

  const sx = useSpring(pointer.x, { stiffness: 260, damping: 26 });
  const sy = useSpring(pointer.y, { stiffness: 260, damping: 26 });
  const velocity = useVelocity(sx);
  const tilt = useTransform(velocity, [-1500, 1500], [-10, 10], { clamp: true });
  const item = items[shown];

  const focusRow = (i: number, el: HTMLElement) => {
    setActive(i);
    const box = container.current;
    if (!box) return;
    // 鍵盤聚焦時，卡片放在該列右側
    const r = el.getBoundingClientRect();
    const origin = global ? { left: 0, top: 0 } : box.getBoundingClientRect();
    pointer.x.set(r.left - origin.left + r.width * 0.6);
    pointer.y.set(r.top - origin.top + r.height / 2);
  };

  return (
    <>
      {children}
      <ul className="divide-y divide-border border-y border-border">
        {items.map((it, i) => {
          const row = (
            <>
              <span className="font-medium">{it.title}</span>
              {it.meta && <span className="text-sm text-muted-foreground">{it.meta}</span>}
            </>
          );
          const rowClass = cn(
            "flex items-center justify-between gap-4 px-1 py-3 outline-none transition-[opacity,color]",
            "focus-visible:ring-2 focus-visible:ring-ring",
            active !== null && active !== i && "opacity-50",
          );
          const handlers = {
            onPointerEnter: () => setActive(i),
            onPointerLeave: () => setActive(null),
            onFocus: (e: FocusEvent<HTMLElement>) => focusRow(i, e.currentTarget),
            onBlur: () => setActive(null),
          };
          return (
            <li key={it.id ?? i}>
              {it.href ? (
                <a href={it.href} className={rowClass} {...handlers}>
                  {row}
                </a>
              ) : (
                <div className={rowClass} {...handlers}>
                  {row}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {enabled && (
        <Layer global={global}>
          <AnimatePresence>
            {active !== null && item && (
              <motion.div
                key="card"
                className="absolute left-0 top-0 -mt-16 ml-5 w-44 overflow-hidden rounded-md border border-border bg-card shadow-lg"
                style={{ x: reduce ? pointer.x : sx, y: reduce ? pointer.y : sy, rotate: reduce ? 0 : tilt }}
                initial={{ opacity: 0, scale: reduce ? 1 : 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: reduce ? 1 : 0.85 }}
                transition={{ duration: 0.2 }}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <AnimatePresence initial={false}>
                    <motion.div
                      key={shown}
                      className="absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      <PreviewArt item={item} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Layer>
      )}
    </>
  );
}

function useMagneticArea(container: RefObject<HTMLDivElement | null>, global: boolean, enabled: boolean, strength: number) {
  useEffect(() => {
    const box = container.current;
    if (!enabled || !box) return;
    const root: ParentNode = global ? document : box;
    const offsets = new Map<HTMLElement, { x: number; y: number }>();
    const spring = { type: "spring", stiffness: 220, damping: 16, mass: 0.5 } as const;

    const release = (el: HTMLElement) => {
      offsets.delete(el);
      animate(el, { x: 0, y: 0 }, spring);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      root.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
        const r = el.getBoundingClientRect();
        const cur = offsets.get(el) ?? { x: 0, y: 0 };
        // 用未位移前的中心計算距離
        const dx = e.clientX - (r.left + r.width / 2 - cur.x);
        const dy = e.clientY - (r.top + r.height / 2 - cur.y);
        const reach = Math.max(r.width, r.height) / 2 + 60;
        const s = Number(el.dataset.magnetic) || strength;
        if (Math.hypot(dx, dy) < reach) {
          const next = { x: dx * s, y: dy * s };
          offsets.set(el, next);
          animate(el, next, spring);
        } else if (offsets.has(el)) {
          release(el);
        }
      });
    };
    const leave = () => offsets.forEach((_, el) => release(el));
    const target: HTMLElement | Window = global ? window : box;
    target.addEventListener("pointermove", move as EventListener);
    if (!global) box.addEventListener("pointerleave", leave);
    return () => {
      target.removeEventListener("pointermove", move as EventListener);
      if (!global) box.removeEventListener("pointerleave", leave);
      offsets.forEach((_, el) => animate(el, { x: 0, y: 0 }, { duration: 0 }));
    };
  }, [container, global, enabled, strength]);
}

/* ---------- 主元件 ---------- */

export function CursorEffect({
  effect = "follower",
  children,
  className,
  global = false,
  hideCursor = false,
  idle,
  items = [],
  size,
  strength = 0.35,
}: CursorEffectProps) {
  const container = useRef<HTMLDivElement>(null);
  const canHover = useCanHover();
  const reduce = useReducedMotion() ?? false;
  const pointer = usePointer(container, global, canHover, idle);
  useMagneticArea(container, global, canHover && !reduce && effect === "magnetic-area", strength);

  const visible = pointer.inside || idle !== undefined;
  const hides = hideCursor && canHover && (effect === "follower" || effect === "blend-circle" || effect === "crosshair");

  // global 模式隱藏游標要掛在根元素上
  useEffect(() => {
    if (!hides || !global) return;
    const root = document.documentElement;
    const prev = root.style.cursor;
    root.style.cursor = "none";
    return () => {
      root.style.cursor = prev;
    };
  }, [hides, global]);

  const props: EffectProps = { pointer, visible, reduce, global, size };

  return (
    <div ref={container} className={cn("relative isolate", hides && !global && "cursor-none [&_*]:cursor-none", className)}>
      {effect === "image-hover" ? (
        <ImageHover {...props} enabled={canHover} items={items} container={container}>
          {children}
        </ImageHover>
      ) : (
        children
      )}
      {canHover && effect === "follower" && <Follower {...props} />}
      {canHover && effect === "trail" && <Trail {...props} />}
      {canHover && effect === "spotlight" && <Spotlight {...props} />}
      {canHover && effect === "blend-circle" && <BlendCircle {...props} />}
      {canHover && effect === "crosshair" && <Crosshair {...props} />}
    </div>
  );
}
