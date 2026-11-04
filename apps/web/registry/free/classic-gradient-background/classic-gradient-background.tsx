"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface GradientBackgroundProps {
  // 主要背景色系（請用 6 碼 hex，光暈與網格會在後面接透明度）
  fromColor?: string;
  viaColor?: string;
  toColor?: string;
  // 動態光暈效果
  glowFromColor?: string;
  glowViaColor?: string;
  // 網格效果
  gridColor?: string;
  gridSize?: { width: number; height: number };
  // 動畫設定
  animationDuration?: number;
  animationScale?: [number, number, number];
  animationOpacity?: [number, number, number];
  /** 預設填滿父層（父層需 relative）；true 時改為固定在整個視窗底層，與原版相同 */
  fullScreen?: boolean;
  className?: string;
  style?: CSSProperties;
  /** 疊在背景上的內容 */
  children?: ReactNode;
}

/** README 與 Storybook 裡的配色組合，可直接展開成 props */
export const gradientBackgroundPresets = {
  blue: {
    fromColor: "#172554",
    viaColor: "#1e3a8a",
    toColor: "#0f172a",
    glowFromColor: "#60a5fa",
    glowViaColor: "#2563eb",
    gridColor: "#3b82f6",
    gridSize: { width: 14, height: 24 },
    animationDuration: 12,
  },
  ocean: {
    fromColor: "#0c4a6e",
    viaColor: "#0369a1",
    toColor: "#082f49",
    glowFromColor: "#38bdf8",
    glowViaColor: "#0ea5e9",
    gridColor: "#0284c7",
    gridSize: { width: 16, height: 28 },
    animationDuration: 8,
    animationScale: [1, 1.2, 1],
    animationOpacity: [0.3, 0.1, 0.3],
  },
  sunset: {
    fromColor: "#7c2d12",
    viaColor: "#9a3412",
    toColor: "#431407",
    glowFromColor: "#fb923c",
    glowViaColor: "#f97316",
    gridColor: "#ea580c",
    gridSize: { width: 20, height: 30 },
    animationDuration: 6,
    animationScale: [1, 1.4, 1],
    animationOpacity: [0.4, 0.15, 0.4],
  },
  forest: {
    fromColor: "#064e3b",
    viaColor: "#047857",
    toColor: "#022c22",
    glowFromColor: "#34d399",
    glowViaColor: "#10b981",
    gridColor: "#059669",
    gridSize: { width: 18, height: 26 },
    animationDuration: 10,
    animationScale: [1, 1.3, 1],
    animationOpacity: [0.35, 0.12, 0.35],
  },
  purple: {
    fromColor: "#4c1d95",
    viaColor: "#6d28d9",
    toColor: "#2e1065",
    glowFromColor: "#c084fc",
    glowViaColor: "#a855f7",
    gridColor: "#8b5cf6",
    gridSize: { width: 14, height: 24 },
    animationDuration: 4,
    animationScale: [1, 1.5, 1],
    animationOpacity: [0.4, 0.1, 0.4],
  },
} satisfies Record<string, GradientBackgroundProps>;

export function GradientBackground({
  fromColor = "#172554",
  viaColor = "#1e3a8a",
  toColor = "#0f172a",
  glowFromColor = "#60a5fa",
  glowViaColor = "#2563eb",
  gridColor = "#3b82f6",
  gridSize = { width: 14, height: 24 },
  animationDuration = 12,
  animationScale = [1, 1.3, 1],
  animationOpacity = [0.3, 0.1, 0.3],
  fullScreen = false,
  className,
  style,
  children,
}: GradientBackgroundProps) {
  const reduce = useReducedMotion() ?? false;

  return (
    <>
      <div
        aria-hidden
        className={cn("pointer-events-none overflow-hidden", fullScreen ? "fixed inset-0 -z-10" : "absolute inset-0", className)}
        style={style}
      >
        {/* 主要背景，可自訂色系漸層 */}
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at top, ${fromColor}, ${viaColor}, ${toColor})` }} />

        {/* 主要動態光暈效果；減少動態時停在第一格 */}
        <motion.div
          animate={reduce ? { scale: animationScale[0], opacity: animationOpacity[0] } : { scale: animationScale, opacity: animationOpacity }}
          transition={reduce ? { duration: 0 } : { duration: animationDuration, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0"
          style={{ background: `radial-gradient(circle at center, ${glowFromColor}40, ${glowViaColor}20, transparent 70%)` }}
        />

        {/* 第二層動態光暈，範圍較大 */}
        <motion.div
          animate={
            reduce
              ? { scale: animationScale[0] * 1.1, opacity: animationOpacity[0] * 0.5 }
              : { scale: animationScale.map((s) => s * 1.1), opacity: animationOpacity.map((o) => o * 0.5) }
          }
          transition={
            reduce
              ? { duration: 0 }
              : { duration: animationDuration * 1.2, repeat: Infinity, ease: "easeInOut", delay: animationDuration * 0.2 }
          }
          className="absolute inset-0"
          style={{ background: `radial-gradient(circle at center, ${glowFromColor}30, ${glowViaColor}10, transparent 70%)` }}
        />

        {/* 網格效果，可自訂顏色和大小 */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right,${gridColor}20 1px,transparent 1px),linear-gradient(to bottom,${gridColor}20 1px,transparent 1px)`,
            backgroundSize: `${gridSize.width}px ${gridSize.height}px`,
          }}
        />
      </div>
      {children != null && <div className="relative">{children}</div>}
    </>
  );
}
