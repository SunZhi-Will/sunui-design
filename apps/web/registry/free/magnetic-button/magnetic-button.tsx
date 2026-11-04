"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface MagneticButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children: ReactNode;
  /** 磁力感應半徑（px，從按鈕邊緣往外算） */
  radius?: number;
  /** 按鈕跟隨指標的比例，0 到 1 */
  strength?: number;
  /** 文字額外位移的比例，製造前後景的視差 */
  labelParallax?: number;
  variant?: "primary" | "outline";
  size?: "md" | "lg";
  /** 放在外層的 class，例如定位 */
  wrapperClassName?: string;
}

const variants = {
  primary: "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90",
  outline: "border border-border bg-background text-foreground hover:bg-muted",
};

const sizes = {
  md: "h-11 px-6 text-sm",
  lg: "h-14 px-8 text-base",
};

const springConfig = { stiffness: 220, damping: 18, mass: 0.5 };

export function MagneticButton({
  children,
  radius = 80,
  strength = 0.35,
  labelParallax = 0.25,
  variant = "primary",
  size = "md",
  className,
  wrapperClassName,
  type = "button",
  disabled,
  ...props
}: MagneticButtonProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLButtonElement>(null);
  // 觸控裝置沒有懸停，直接停用磁力效果
  const [finePointer, setFinePointer] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, springConfig);
  const sy = useSpring(y, springConfig);
  const lx = useMotionValue(0);
  const ly = useMotionValue(0);
  const slx = useSpring(lx, springConfig);
  const sly = useSpring(ly, springConfig);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFinePointer(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const active = finePointer && !reduceMotion && !disabled;

  useEffect(() => {
    if (!active) {
      x.set(0);
      y.set(0);
      lx.set(0);
      ly.set(0);
      return;
    }
    let frame = 0;
    function onMove(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        // 用未位移前的位置計算，避免按鈕追著自己跑
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2 - sx.get();
        const cy = r.top + r.height / 2 - sy.get();
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const nearX = Math.abs(dx) <= r.width / 2 + radius;
        const nearY = Math.abs(dy) <= r.height / 2 + radius;
        if (nearX && nearY) {
          x.set(dx * strength);
          y.set(dy * strength);
          lx.set(dx * strength * labelParallax);
          ly.set(dy * strength * labelParallax);
        } else {
          x.set(0);
          y.set(0);
          lx.set(0);
          ly.set(0);
        }
      });
    }
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, [active, radius, strength, labelParallax, x, y, lx, ly, sx, sy]);

  return (
    <motion.span className={cn("inline-block", wrapperClassName)} style={{ x: sx, y: sy }}>
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
          "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        <motion.span className="inline-flex items-center gap-2" style={{ x: slx, y: sly }}>
          {children}
        </motion.span>
      </button>
    </motion.span>
  );
}
