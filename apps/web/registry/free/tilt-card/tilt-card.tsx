"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef, useState, type PointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface TiltCardProps {
  /** 商品圖或任何視覺；會放在最深的圖層 */
  media: ReactNode;
  title: ReactNode;
  price?: ReactNode;
  /** 價格旁的原價或副標 */
  subtitle?: ReactNode;
  /** 右上角的小標，例如 "New" */
  badge?: ReactNode;
  /** 有 href 時整張卡片是連結 */
  href?: string;
  /** 卡片底部的動作按鈕（與 href 互斥時優先使用 href） */
  action?: { label: ReactNode; onClick: () => void };
  /** 最大傾斜角度（deg） */
  maxTilt?: number;
  /** 指標跟隨的光澤 */
  glare?: boolean;
  /** 圖層之間的深度（px） */
  depth?: number;
  className?: string;
}

const springConfig = { stiffness: 180, damping: 18, mass: 0.4 };

export function TiltCard({
  media,
  title,
  price,
  subtitle,
  badge,
  href,
  action,
  maxTilt = 10,
  glare = true,
  depth = 30,
  className,
}: TiltCardProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const [hovering, setHovering] = useState(false);

  // px、py 為指標在卡片內的位置，0 到 1
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(py, [0, 1], [maxTilt, -maxTilt]), springConfig);
  const rotateY = useSpring(useTransform(px, [0, 1], [-maxTilt, maxTilt]), springConfig);
  const glareX = useTransform(px, (v) => `${v * 100}%`);
  const glareY = useTransform(py, (v) => `${v * 100}%`);
  const glareBg = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgb(255 255 255 / 0.35), transparent 55%)`;

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (reduceMotion || e.pointerType !== "mouse") return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  }

  function reset() {
    px.set(0.5);
    py.set(0.5);
    setHovering(false);
  }

  const lifted = focused || hovering;
  const layer = (n: number) => (reduceMotion ? undefined : { transform: `translateZ(${n}px)` });

  const content = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted" style={layer(depth * 0.5)}>
        <div className="size-full [&>img]:size-full [&>img]:object-cover">{media}</div>
        {badge && (
          <span className="absolute top-3 left-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur">
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-3 px-1 pt-4" style={layer(depth)}>
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold tracking-tight">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {price && (
          <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground tabular-nums" style={layer(depth * 0.5)}>
            {price}
          </span>
        )}
      </div>
    </>
  );

  return (
    <div className={cn("[perspective:900px]", className)}>
      <motion.div
        ref={ref}
        onPointerEnter={(e) => e.pointerType === "mouse" && setHovering(true)}
        onPointerMove={onPointerMove}
        onPointerLeave={reset}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
        }}
        style={reduceMotion ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}
        animate={{
          y: lifted && !reduceMotion ? -4 : 0,
          boxShadow: lifted
            ? "0 24px 48px -16px rgb(0 0 0 / 0.28)"
            : "0 4px 12px -6px rgb(0 0 0 / 0.12)",
        }}
        transition={{ duration: reduceMotion ? 0 : 0.25 }}
        className={cn(
          "relative rounded-2xl border border-border bg-card p-3 text-card-foreground",
          // 鍵盤聚焦到內部連結或按鈕時，整張卡片顯示焦點框
          "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background",
        )}
      >
        {href ? (
          <a href={href} className="block rounded-xl focus:outline-none" style={{ transformStyle: "preserve-3d" }}>
            {content}
          </a>
        ) : (
          <div style={{ transformStyle: "preserve-3d" }}>{content}</div>
        )}

        {action && !href && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-3 w-full rounded-xl border border-border bg-background py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus:outline-none"
            style={layer(depth * 0.75)}
          >
            {action.label}
          </button>
        )}

        {glare && !reduceMotion && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={layer(depth * 1.2)}>
            <motion.div
              className="size-full rounded-2xl mix-blend-soft-light transition-opacity duration-300"
              style={{ background: glareBg, opacity: hovering ? 1 : 0 }}
            />
          </div>
        )}
      </motion.div>
    </div>
  );
}
