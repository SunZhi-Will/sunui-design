"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

export const gradientPresets = {
  aurora: ["#22d3ee", "#6366f1", "#a855f7", "#10b981"],
  sunset: ["#f97316", "#f43f5e", "#a855f7", "#facc15"],
  ocean: ["#0ea5e9", "#2563eb", "#14b8a6", "#1e3a8a"],
  forest: ["#10b981", "#84cc16", "#0f766e", "#22c55e"],
} as const;

export type GradientPreset = keyof typeof gradientPresets;

export interface GradientBackgroundProps {
  children?: ReactNode;
  /** 預設色組名稱，或自訂 2 到 5 個顏色 */
  colors?: GradientPreset | readonly string[];
  /** 一個完整循環的秒數，越大越慢 */
  duration?: number;
  /** 光斑不透明度，0 到 1 */
  intensity?: number;
  /** 光斑模糊程度（px） */
  blur?: number;
  /** 疊加的紋理 */
  pattern?: "grid" | "dots" | "none";
  /** 暫停動畫 */
  paused?: boolean;
  /** 底色，預設跟隨主題 bg-background */
  baseClassName?: string;
  /** 內容區的 className */
  contentClassName?: string;
  className?: string;
}

// 固定的光斑起點與漂移路徑，避免 SSR 與客戶端不一致
const BLOBS = [
  { left: "-10%", top: "-15%", size: "60%", path: { x: ["0%", "18%", "6%", "0%"], y: ["0%", "12%", "24%", "0%"] } },
  { left: "45%", top: "-20%", size: "55%", path: { x: ["0%", "-14%", "-4%", "0%"], y: ["0%", "16%", "6%", "0%"] } },
  { left: "-5%", top: "45%", size: "50%", path: { x: ["0%", "16%", "26%", "0%"], y: ["0%", "-10%", "4%", "0%"] } },
  { left: "50%", top: "40%", size: "58%", path: { x: ["0%", "-20%", "-8%", "0%"], y: ["0%", "-14%", "-22%", "0%"] } },
  { left: "25%", top: "15%", size: "45%", path: { x: ["0%", "10%", "-12%", "0%"], y: ["0%", "-8%", "10%", "0%"] } },
];

const blobVariants: Variants = {
  still: { x: "0%", y: "0%", scale: 1 },
  drift: (c: { i: number; duration: number }) => ({
    x: BLOBS[c.i].path.x,
    y: BLOBS[c.i].path.y,
    scale: [1, 1.12, 0.94, 1],
    transition: {
      duration: c.duration * (1 + c.i * 0.15),
      repeat: Infinity,
      ease: "easeInOut",
    },
  }),
};

export function GradientBackground({
  children,
  colors = "aurora",
  duration = 18,
  intensity = 0.55,
  blur = 72,
  pattern = "grid",
  paused = false,
  baseClassName,
  contentClassName,
  className,
}: GradientBackgroundProps) {
  const reduce = useReducedMotion();
  const palette = (typeof colors === "string" ? gradientPresets[colors as GradientPreset] : colors).slice(0, BLOBS.length);
  const animate = !reduce && !paused;

  const patternStyle: CSSProperties | undefined =
    pattern === "grid"
      ? {
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklab, currentColor 9%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, currentColor 9%, transparent) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 85%)",
        }
      : pattern === "dots"
        ? {
            backgroundImage: "radial-gradient(color-mix(in oklab, currentColor 16%, transparent) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
            maskImage: "radial-gradient(ellipse at center, black 40%, transparent 85%)",
          }
        : undefined;

  return (
    <div className={cn("relative isolate overflow-hidden text-foreground", className)}>
      <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 -z-10 bg-background", baseClassName)}>
        <div className="absolute inset-0" style={{ filter: `blur(${blur}px)`, opacity: intensity }}>
          {palette.map((color, i) => (
            <motion.div
              key={i}
              custom={{ i, duration }}
              variants={blobVariants}
              initial="still"
              animate={animate ? "drift" : "still"}
              className="absolute rounded-full will-change-transform"
              style={{
                left: BLOBS[i].left,
                top: BLOBS[i].top,
                width: BLOBS[i].size,
                aspectRatio: "1",
                background: `radial-gradient(circle at center, ${color} 0%, transparent 68%)`,
              }}
            />
          ))}
        </div>
        {patternStyle && <div className="absolute inset-0 text-foreground" style={patternStyle} />}
        {/* 底部淡出，讓內容與頁面銜接 */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/60 to-transparent" />
      </div>
      <div className={cn("relative", contentClassName)}>{children}</div>
    </div>
  );
}
