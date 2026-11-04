"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type Variants,
} from "framer-motion";
import { useRef, useState, type HTMLAttributes, type PointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SpotlightCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"> {
  children?: ReactNode;
  /** solid：實心卡片；glass：半透明毛玻璃；outline：只有邊框 */
  variant?: "solid" | "glass" | "outline";
  /** 光暈顏色，任何 CSS 顏色 */
  glowColor?: string;
  /** 光暈半徑（px） */
  radius?: number;
  /** 邊框是否也跟著發光 */
  borderGlow?: boolean;
  /** 輕微 3D 傾斜，減少動態效果時停用 */
  tilt?: boolean;
  /** 內容區的 className */
  contentClassName?: string;
}

const glowVariants: Variants = {
  off: { opacity: 0 },
  on: { opacity: 1 },
};

export function SpotlightCard({
  children,
  variant = "solid",
  glowColor = "#8b5cf6",
  radius = 320,
  borderGlow = true,
  tilt = false,
  className,
  contentClassName,
  onPointerMove,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ...rest
}: SpotlightCardProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const x = useMotionValue(-radius);
  const y = useMotionValue(-radius);
  const rotateX = useSpring(0, { stiffness: 200, damping: 20 });
  const rotateY = useSpring(0, { stiffness: 200, damping: 20 });
  const canTilt = tilt && !reduce;

  const surface = useMotionTemplate`radial-gradient(${radius}px circle at ${x}px ${y}px, color-mix(in oklab, ${glowColor} 22%, transparent), transparent 70%)`;
  const edge = useMotionTemplate`radial-gradient(${radius * 0.75}px circle at ${x}px ${y}px, color-mix(in oklab, ${glowColor} 85%, transparent), transparent 70%)`;

  const track = (e: PointerEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    x.set(px);
    y.set(py);
    if (canTilt) {
      rotateY.set(((px / rect.width) - 0.5) * 8);
      rotateX.set(-((py / rect.height) - 0.5) * 8);
    }
  };

  const centre = () => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set(rect.width / 2);
    y.set(rect.height / 3);
  };

  const fade = reduce ? { duration: 0 } : { duration: 0.3 };

  return (
    <motion.div
      ref={ref}
      {...rest}
      onPointerMove={(e) => {
        track(e);
        onPointerMove?.(e);
      }}
      onPointerEnter={(e) => {
        track(e);
        setActive(true);
        onPointerEnter?.(e);
      }}
      onPointerLeave={(e) => {
        setActive(false);
        rotateX.set(0);
        rotateY.set(0);
        onPointerLeave?.(e);
      }}
      // 鍵盤使用者聚焦卡片內元素時，光暈置中顯示
      onFocus={(e) => {
        centre();
        setActive(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setActive(false);
        onBlur?.(e);
      }}
      style={canTilt ? { rotateX, rotateY, transformPerspective: 900 } : undefined}
      className={cn(
        "group relative rounded-2xl p-px",
        variant === "outline" ? "bg-border/70" : "bg-border",
        className,
      )}
    >
      {borderGlow && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{ background: edge }}
          variants={glowVariants}
          initial="off"
          animate={active ? "on" : "off"}
          transition={fade}
        />
      )}
      <div
        className={cn(
          "relative h-full overflow-hidden rounded-[calc(1rem-1px)] text-card-foreground",
          variant === "solid" && "bg-card",
          variant === "glass" && "bg-card/70 backdrop-blur-xl",
          variant === "outline" && "bg-background",
        )}
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: surface }}
          variants={glowVariants}
          initial="off"
          animate={active ? "on" : "off"}
          transition={fade}
        />
        <div className={cn("relative p-6", contentClassName)}>{children}</div>
      </div>
    </motion.div>
  );
}
