import { motion } from "framer-motion";
import React from "react";

export interface GradientBackgroundProps {
    // 主要背景色系
    fromColor?: string;
    viaColor?: string;
    toColor?: string;
    // 動態光暈效果
    glowFromColor?: string;
    glowViaColor?: string;
    // 網格效果
    gridColor?: string;
    gridSize?: {
        width: number;
        height: number;
    };
    // 動畫設定
    animationDuration?: number;
    animationScale?: [number, number, number];
    animationOpacity?: [number, number, number];
}

export default function GradientBackground({
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
}: GradientBackgroundProps) {
    return (
        <div className="fixed inset-0 -z-10">
            {/* 主要背景 - 可自訂色系漸層 */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(ellipse at top, ${fromColor}, ${viaColor}, ${toColor})`
                }}
            ></div>

            {/* 主要動態光暈效果 */}
            <motion.div
                animate={{
                    scale: animationScale,
                    opacity: animationOpacity,
                }}
                transition={{
                    duration: animationDuration,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(circle at center, ${glowFromColor}40, ${glowViaColor}20, transparent 70%)`
                }}
            />

            {/* 第二層動態光暈 - 較大範圍 */}
            <motion.div
                animate={{
                    scale: animationScale.map(s => s * 1.1),
                    opacity: animationOpacity.map(o => o * 0.5),
                }}
                transition={{
                    duration: animationDuration * 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: animationDuration * 0.2,
                }}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(circle at center, ${glowFromColor}30, ${glowViaColor}10, transparent 70%)`
                }}
            />

            {/* 網格效果 - 可自訂顏色和大小 */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `linear-gradient(to right,${gridColor}20 1px,transparent 1px),linear-gradient(to bottom,${gridColor}20 1px,transparent 1px)`,
                    backgroundSize: `${gridSize.width}px ${gridSize.height}px`,
                }}
            ></div>
        </div>
    );
} 