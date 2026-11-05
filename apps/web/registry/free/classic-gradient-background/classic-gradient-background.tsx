"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface GradientBackgroundProps {
  // 底色色調（任何 CSS 顏色；不給時用 shadcn token，跟隨網站明暗）
  fromColor?: string;
  viaColor?: string;
  toColor?: string;
  // 淡色調層：同色相、極低透明度的一層暈染（不給時用朱紅 accent）
  glowFromColor?: string;
  glowViaColor?: string;
  // 網格效果（不給時用 border token）
  gridColor?: string;
  gridSize?: { width: number; height: number };
  // 動畫設定：只有 animated 為 true 時才會套用，預設是靜止的背景
  animationDuration?: number;
  animationScale?: [number, number, number];
  animationOpacity?: [number, number, number];
  /** 讓淡色調層依 animationScale / animationOpacity 緩慢變化；預設 false，背景保持安靜 */
  animated?: boolean;
  /** 預設填滿父層（父層需 relative）；true 時改為固定在整個視窗底層，與原版相同 */
  fullScreen?: boolean;
  className?: string;
  style?: CSSProperties;
  /** 疊在背景上的內容 */
  children?: ReactNode;
}

/**
 * 內建色調：只換淡色調層與網格，底色仍跟隨網站明暗。
 * 每組都是單一色相、極低彩度，像紙或石材上的一層薄色。
 */
export const gradientBackgroundPresets = {
  stone: {
    glowFromColor: "#a8a29e",
    glowViaColor: "#a8a29e",
    gridSize: { width: 24, height: 24 },
  },
  vermilion: {
    glowFromColor: "#c8361d",
    glowViaColor: "#c8361d",
    gridSize: { width: 24, height: 24 },
  },
  slate: {
    glowFromColor: "#64748b",
    glowViaColor: "#64748b",
    gridColor: "#64748b",
    gridSize: { width: 20, height: 20 },
  },
  forest: {
    glowFromColor: "#4d7c63",
    glowViaColor: "#4d7c63",
    gridColor: "#4d7c63",
    gridSize: { width: 28, height: 28 },
  },
  sand: {
    glowFromColor: "#a16207",
    glowViaColor: "#a16207",
    gridColor: "#a16207",
    gridSize: { width: 32, height: 32 },
  },
} satisfies Record<string, GradientBackgroundProps>;

/** 依透明度百分比把任意 CSS 顏色混成半透明，hex、rgb、var() 都適用 */
const tint = (color: string, percent: number) => `color-mix(in srgb, ${color} ${percent}%, transparent)`;

export function GradientBackground({
  fromColor,
  viaColor,
  toColor,
  glowFromColor,
  glowViaColor,
  gridColor,
  gridSize = { width: 24, height: 24 },
  animationDuration = 12,
  animationScale = [1, 1.04, 1],
  animationOpacity = [1, 0.7, 1],
  animated = false,
  fullScreen = false,
  className,
  style,
  children,
}: GradientBackgroundProps) {
  const reduce = useReducedMotion() ?? false;
  const moving = animated && !reduce;

  const top = fromColor ?? "var(--muted)";
  const mid = viaColor ?? "var(--background)";
  const bottom = toColor ?? "var(--background)";
  // 淡色調層的顏色：預設朱紅，暗色時改用亮一階的朱紅（見 .cg-wash 的 CSS 變數）
  const washFrom = glowFromColor ?? "var(--cg-accent)";
  const washVia = glowViaColor ?? glowFromColor ?? "var(--cg-accent)";
  const line = gridColor ? tint(gridColor, 18) : "var(--border)";

  return (
    <>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none overflow-hidden [--cg-accent:#c8361d] dark:[--cg-accent:#ec6a4f]",
          fullScreen ? "fixed inset-0 -z-10" : "absolute inset-0",
          className,
        )}
        style={style}
      >
        {/* 底色：同一組中性色由上往下的淡變化 */}
        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${top}, ${mid} 60%, ${bottom})` }} />

        {/* 淡色調層：從上緣往下暈開，透明度很低，只是讓底色有一點溫度 */}
        <motion.div
          initial={false}
          animate={moving ? { scale: animationScale, opacity: animationOpacity } : { scale: 1, opacity: 1 }}
          transition={moving ? { duration: animationDuration, repeat: Infinity, ease: "easeInOut" } : { duration: 0 }}
          className="absolute inset-0 origin-top"
          style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${tint(washFrom, 7)}, ${tint(washVia, 3)} 50%, transparent 80%)` }}
        />

        {/* 網格：1px 細線，往下方淡出，避免整片格子搶走內容 */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, ${line} 1px, transparent 1px), linear-gradient(to bottom, ${line} 1px, transparent 1px)`,
            backgroundSize: `${gridSize.width}px ${gridSize.height}px`,
            maskImage: "linear-gradient(to bottom, black, transparent 85%)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent 85%)",
          }}
        />
      </div>
      {children != null && <div className="relative">{children}</div>}
    </>
  );
}
