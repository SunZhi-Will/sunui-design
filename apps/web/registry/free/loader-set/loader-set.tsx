"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

/** 所有 loader 共用的 props；顏色一律跟隨 currentColor，用 text-* 調整 */
export interface LoaderProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children" | "role"> {
  /** 尺寸（px），預設 24 */
  size?: number;
  /** 給螢幕閱讀器的文字，畫面上不顯示 */
  label?: string;
  /** 速度倍率，2 代表兩倍快 */
  speed?: number;
}

/** 全部 keyframes 以 sunui-ld- 為前綴；減少動態效果時改為緩慢透明度呼吸 */
const KEYFRAMES = `
@keyframes sunui-ld-spin { to { transform: rotate(360deg) } }
@keyframes sunui-ld-bounce { 0%, 80%, 100% { transform: translateY(0); opacity: .45 } 40% { transform: translateY(-70%); opacity: 1 } }
@keyframes sunui-ld-eq { 0%, 100% { transform: scaleY(.3) } 50% { transform: scaleY(1) } }
@keyframes sunui-ld-ring { 0% { transform: scale(.25); opacity: .9 } 100% { transform: scale(1); opacity: 0 } }
@keyframes sunui-ld-dash { to { stroke-dashoffset: -100 } }
@keyframes sunui-ld-fade { 0%, 100% { opacity: 1 } 50% { opacity: .4 } }
@media (prefers-reduced-motion: reduce) {
  .sunui-ld-root .sunui-ld-a { animation: none !important }
  .sunui-ld-root.sunui-ld-pulse { animation: sunui-ld-fade 2.4s ease-in-out infinite }
}
`;

function Keyframes() {
  // React 19 會依 href 去重並提升到 head
  return (
    <style href="sunui-loader-set" precedence="default">
      {KEYFRAMES}
    </style>
  );
}

/** 共用外層：role="status" + sr-only 文字，視覺部分對輔助科技隱藏 */
function LoaderRoot({
  size,
  label,
  className,
  style,
  pulse = true,
  children,
  ...rest
}: Omit<LoaderProps, "speed"> & { size: number; pulse?: boolean; children: ReactNode }) {
  return (
    <span
      role="status"
      {...rest}
      className={cn("sunui-ld-root relative inline-flex shrink-0 items-center justify-center align-middle", pulse && "sunui-ld-pulse", className)}
      style={{ width: size, height: size, ...style }}
    >
      <Keyframes />
      <span aria-hidden="true" className="relative inline-flex size-full items-center justify-center">
        {children}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

const anim = (name: string, seconds: number, speed: number, extra = "", delay = 0): CSSProperties => ({
  animation: `${name} ${seconds / speed}s ${extra || "linear"} ${delay / speed}s infinite`,
});

/** 兩顆小球以不同速度繞軌道旋轉 */
export function OrbitLoader({ size = 24, label = "Loading", speed = 1, ...rest }: LoaderProps) {
  const dot = Math.max(3, size * 0.2);
  return (
    <LoaderRoot size={size} label={label} {...rest}>
      <span className="absolute inset-0 rounded-full border border-current opacity-20" />
      <span className="sunui-ld-a absolute inset-0" style={anim("sunui-ld-spin", 1.1, speed)}>
        <span className="absolute left-1/2 rounded-full bg-current" style={{ width: dot, height: dot, top: -dot / 2, marginLeft: -dot / 2 }} />
      </span>
      <span className="sunui-ld-a absolute inset-[22%]" style={anim("sunui-ld-spin", 0.75, speed)}>
        <span
          className="absolute left-1/2 rounded-full bg-current opacity-60"
          style={{ width: dot * 0.7, height: dot * 0.7, top: (-dot * 0.7) / 2, marginLeft: (-dot * 0.7) / 2 }}
        />
      </span>
    </LoaderRoot>
  );
}

/** 三顆依序彈跳的圓點 */
export function BouncingDots({ size = 24, label = "Loading", speed = 1, ...rest }: LoaderProps) {
  const dot = size * 0.22;
  return (
    <LoaderRoot size={size} label={label} {...rest}>
      <span className="flex items-center" style={{ gap: dot * 0.45 }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="sunui-ld-a rounded-full bg-current opacity-70"
            style={{ width: dot, height: dot, ...anim("sunui-ld-bounce", 1.2, speed, "ease-in-out", i * 0.16) }}
          />
        ))}
      </span>
    </LoaderRoot>
  );
}

/** 等化器長條，高度交錯起伏 */
export function EqualizerBars({ size = 24, label = "Loading", speed = 1, ...rest }: LoaderProps) {
  const bar = size * 0.14;
  const delays = [0, 0.3, 0.15, 0.45];
  return (
    <LoaderRoot size={size} label={label} {...rest}>
      <span className="flex h-[80%] items-center" style={{ gap: bar * 0.6 }}>
        {delays.map((d, i) => (
          <span
            key={i}
            className="sunui-ld-a h-full rounded-full bg-current"
            // 靜態狀態（減少動態效果）時維持不同高度
            style={{ width: bar, transform: `scaleY(${[0.5, 0.9, 0.65, 0.4][i]})`, ...anim("sunui-ld-eq", 0.9, speed, "ease-in-out", d) }}
          />
        ))}
      </span>
    </LoaderRoot>
  );
}

/** 經典環形 spinner：淡色軌道加旋轉弧線 */
export function RingSpinner({ size = 24, label = "Loading", speed = 1, ...rest }: LoaderProps) {
  return (
    <LoaderRoot size={size} label={label} {...rest}>
      <span className="sunui-ld-a absolute inset-0" style={anim("sunui-ld-spin", 0.8, speed)}>
        <svg viewBox="0 0 24 24" className="size-full" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="9.5" opacity="0.2" />
          <path d="M12 2.5a9.5 9.5 0 0 1 9.5 9.5" />
        </svg>
      </span>
    </LoaderRoot>
  );
}

/** 從中心向外擴散的脈衝環 */
export function PulseRings({ size = 24, label = "Loading", speed = 1, ...rest }: LoaderProps) {
  return (
    <LoaderRoot size={size} label={label} {...rest}>
      {[0, 0.6].map((d, i) => (
        <span
          key={i}
          className="sunui-ld-a absolute inset-0 rounded-full border-2 border-current"
          style={{ transform: `scale(${i ? 0.95 : 0.65})`, opacity: i ? 0.2 : 0.4, ...anim("sunui-ld-ring", 1.2, speed, "ease-out", d) }}
        />
      ))}
      <span className="rounded-full bg-current" style={{ width: size * 0.28, height: size * 0.28 }} />
    </LoaderRoot>
  );
}

const INFINITY_PATH = "M12 12c2-3.2 4-4.8 6-4.8a4.8 4.8 0 0 1 0 9.6c-2 0-4-1.6-6-4.8s-4-4.8-6-4.8a4.8 4.8 0 0 0 0 9.6c2 0 4-1.6 6-4.8z";

/** 沿著無限符號移動的光段 */
export function InfinityLoader({ size = 24, label = "Loading", speed = 1, ...rest }: LoaderProps) {
  return (
    <LoaderRoot size={size} label={label} {...rest}>
      <svg viewBox="0 0 24 24" className="size-full" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d={INFINITY_PATH} opacity="0.2" />
        <path
          d={INFINITY_PATH}
          pathLength={100}
          strokeDasharray="28 72"
          className="sunui-ld-a"
          style={anim("sunui-ld-dash", 1.6, speed)}
        />
      </svg>
    </LoaderRoot>
  );
}

export interface SpinnerToCheckProps extends LoaderProps {
  /** 為 true 時 spinner 收合並畫出打勾 */
  done?: boolean;
  /** 完成後給螢幕閱讀器的文字 */
  doneLabel?: string;
}

/** 載入中旋轉，完成時弧線補滿成圓並畫出打勾 */
export function SpinnerToCheck({
  size = 24,
  label = "Loading",
  doneLabel = "Done",
  done = false,
  speed = 1,
  ...rest
}: SpinnerToCheckProps) {
  const reduce = useReducedMotion();
  const t = (duration: number, delay = 0) => (reduce ? { duration: 0 } : { duration, delay, ease: "easeOut" as const });
  return (
    <LoaderRoot size={size} label={done ? doneLabel : label} pulse={!done} {...rest}>
      <span
        className={cn("absolute inset-0", !done && "sunui-ld-a")}
        style={done ? undefined : anim("sunui-ld-spin", 0.8, speed)}
      >
        <svg viewBox="0 0 24 24" className="size-full -rotate-90" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="9.5" opacity="0.2" />
          <motion.circle
            cx="12"
            cy="12"
            r="9.5"
            initial={false}
            animate={{ pathLength: done ? 1 : 0.25 }}
            transition={t(0.35)}
          />
        </svg>
      </span>
      <svg viewBox="0 0 24 24" className="absolute inset-0 size-full" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <motion.path
          d="M7.5 12.5l3 3 6-6.5"
          initial={false}
          animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }}
          transition={done ? t(0.3, 0.25) : t(0.15)}
        />
      </svg>
    </LoaderRoot>
  );
}
