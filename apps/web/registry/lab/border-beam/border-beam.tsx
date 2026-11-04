"use client";

import { useReducedMotion } from "framer-motion";
import { useId, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type BorderBeamVariant = "beam" | "rotating" | "marching-ants" | "neon";

export interface BorderBeamProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  /** beam：沿邊緣跑動的光束；rotating：旋轉漸層；marching-ants：虛線行進；neon：霓虹閃爍 */
  variant?: BorderBeamVariant;
  /** 漸層顏色，任何 CSS 顏色；neon 只使用第一個 */
  colors?: string[];
  /** 一圈動畫的秒數 */
  duration?: number;
  /** 邊框粗細（px） */
  borderWidth?: number;
  /** 外框圓角（px），內容區會自動扣掉邊框寬度 */
  radius?: number;
  /** 暫停動畫，保留靜態邊框 */
  paused?: boolean;
  /** 內容區的 className */
  contentClassName?: string;
}

/** 所有 keyframes 以 sunui-bb- 為前綴；@property 讓角度變數可以被補間 */
const KEYFRAMES = `
@property --sunui-bb-angle { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
@keyframes sunui-bb-turn { to { --sunui-bb-angle: 360deg } }
@keyframes sunui-bb-march { to { stroke-dashoffset: var(--sunui-bb-cycle) } }
@keyframes sunui-bb-flicker {
  0%, 18%, 22%, 25%, 53%, 57%, 100% { opacity: 1 }
  20%, 24%, 55% { opacity: .35 }
}
@media (prefers-reduced-motion: reduce) {
  .sunui-bb-a { animation: none !important }
}
`;

/** 只露出 padding 區域（也就是邊框）的遮罩 */
const ringMask = (borderWidth: number): CSSProperties => ({
  padding: borderWidth,
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
});

export function BorderBeam({
  children,
  variant = "beam",
  colors = ["#8b5cf6", "#ec4899", "#f59e0b"],
  duration = 4,
  borderWidth = 2,
  radius = 16,
  paused = false,
  className,
  contentClassName,
  style,
  ...rest
}: BorderBeamProps) {
  const reduce = useReducedMotion();
  const gradientId = useId();
  const still = paused || !!reduce;
  const palette = colors.length ? colors : ["currentColor"];
  const loop = (name: string, timing = "linear"): CSSProperties =>
    still ? { animation: "none" } : { animation: `${name} ${duration}s ${timing} infinite` };

  const fullConic = `conic-gradient(from var(--sunui-bb-angle), ${[...palette, palette[0]].join(", ")})`;
  // 光束：大部分透明，只有尾端一小段亮色
  const beamStops = palette.map((c, i) => `${c} ${75 + ((i + 1) / palette.length) * 22}%`).join(", ");
  const beamConic = `conic-gradient(from var(--sunui-bb-angle), transparent 0%, transparent 72%, ${beamStops}, transparent 100%)`;
  const dash = Math.max(4, borderWidth * 3);
  const gap = Math.max(3, borderWidth * 2);

  return (
    <div
      {...rest}
      className={cn("relative isolate", className)}
      style={{ borderRadius: radius, padding: borderWidth, ...style }}
    >
      {/* React 19 會依 href 去重並提升到 head */}
      <style href="sunui-border-beam" precedence="default">
        {KEYFRAMES}
      </style>

      {variant === "beam" && (
        <>
          {/* 靜態底框，光束在上面跑 */}
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] bg-border" style={ringMask(borderWidth)} />
          <span
            aria-hidden="true"
            className="sunui-bb-a pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{
              ...ringMask(borderWidth),
              // 減少動態效果時改為靜態漸層邊框
              background: still ? `linear-gradient(135deg, ${palette.join(", ")})` : beamConic,
              ...loop("sunui-bb-turn"),
            }}
          />
        </>
      )}

      {variant === "rotating" && (
        <span
          aria-hidden="true"
          className="sunui-bb-a pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{ ...ringMask(borderWidth), background: fullConic, ...loop("sunui-bb-turn") }}
        />
      )}

      {variant === "marching-ants" && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full overflow-hidden rounded-[inherit]"
          style={ringMask(borderWidth)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              {palette.map((c, i) => (
                <stop key={i} offset={palette.length > 1 ? i / (palette.length - 1) : 0} stopColor={c} />
              ))}
            </linearGradient>
          </defs>
          {/* 描邊置中於外緣，外側一半被裁掉，剩下的寬度剛好等於 borderWidth */}
          <rect
            width="100%"
            height="100%"
            rx={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={borderWidth * 2}
            strokeDasharray={`${dash} ${gap}`}
            className="sunui-bb-a"
            style={{ ["--sunui-bb-cycle" as string]: `${-(dash + gap)}px`, ...loop("sunui-bb-march") } as CSSProperties}
          />
        </svg>
      )}

      {variant === "neon" && (
        <span
          aria-hidden="true"
          className="sunui-bb-a pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            border: `${borderWidth}px solid ${palette[0]}`,
            boxShadow: `0 0 ${borderWidth * 3}px ${palette[0]}, 0 0 ${borderWidth * 10}px color-mix(in oklab, ${palette[0]} 60%, transparent), inset 0 0 ${borderWidth * 4}px color-mix(in oklab, ${palette[0]} 50%, transparent)`,
            ...loop("sunui-bb-flicker", "steps(1, end)"),
          }}
        />
      )}

      <div
        className={cn("relative h-full", contentClassName)}
        style={{ borderRadius: Math.max(0, radius - borderWidth) }}
      >
        {children}
      </div>
    </div>
  );
}
