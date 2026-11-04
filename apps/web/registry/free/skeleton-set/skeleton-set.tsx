"use client";

import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { createContext, useContext, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ShimmerStyle = "wave" | "pulse" | "none";

const ShimmerContext = createContext<ShimmerStyle>("wave");

export interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
  /** 覆寫外層 SkeletonSet 的動畫樣式 */
  shimmer?: ShimmerStyle;
}

/** 基本骨架方塊，其餘元件都由它組成 */
export function Skeleton({ className, style, shimmer }: SkeletonProps) {
  const fromSet = useContext(ShimmerContext);
  const reduceMotion = useReducedMotion();
  const mode = reduceMotion ? "none" : (shimmer ?? fromSet);
  return (
    <div
      aria-hidden="true"
      style={style}
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        mode === "pulse" && "animate-pulse",
        className,
      )}
    >
      {mode === "wave" && (
        <>
          <span className="absolute inset-0 -translate-x-full animate-[sunui-skeleton-wave_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-foreground/[0.07] to-transparent" />
          {/* React 19 會依 href 去重並提升到 head */}
          <style href="sunui-skeleton-wave" precedence="default">{`@keyframes sunui-skeleton-wave { from { transform: translateX(-100%) } to { transform: translateX(100%) } }`}</style>
        </>
      )}
    </div>
  );
}

export function SkeletonLine({ width = "100%", className }: { width?: string | number; className?: string }) {
  return <Skeleton className={cn("h-3.5", className)} style={{ width }} />;
}

export function SkeletonCircle({ size = 40, className }: { size?: number; className?: string }) {
  return <Skeleton className={cn("shrink-0 rounded-full", className)} style={{ width: size, height: size }} />;
}

/** 依 index 產生穩定的行寬，避免 SSR 不一致 */
const LINE_WIDTHS = ["92%", "84%", "96%", "70%", "88%", "62%"];

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonLine key={i} width={i === lines - 1 && lines > 1 ? "55%" : LINE_WIDTHS[i % LINE_WIDTHS.length]} />
      ))}
    </div>
  );
}

export function SkeletonCard({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5", className)}>
      <div className="flex items-center gap-3">
        <SkeletonCircle size={40} />
        <div className="flex-1 space-y-2">
          <SkeletonLine width="45%" />
          <SkeletonLine width="28%" className="h-3" />
        </div>
      </div>
      <SkeletonText lines={lines} className="mt-5" />
    </div>
  );
}

export function SkeletonProductCard({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}>
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-2.5 p-4">
        <SkeletonLine width="70%" className="h-4" />
        <SkeletonLine width="40%" />
        <div className="flex items-center justify-between pt-2">
          <SkeletonLine width={64} className="h-5" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <ul className={cn("divide-y divide-border rounded-2xl border border-border bg-card", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center gap-3 p-4">
          <SkeletonCircle size={36} />
          <div className="flex-1 space-y-2">
            <SkeletonLine width={LINE_WIDTHS[(i + 2) % LINE_WIDTHS.length]} />
            <SkeletonLine width="35%" className="h-3" />
          </div>
          <SkeletonLine width={48} className="h-3" />
        </li>
      ))}
    </ul>
  );
}

export type SkeletonPreset = "text" | "card" | "product" | "list";

export interface SkeletonSetProps {
  /** true 時淡入真實內容 */
  loaded: boolean;
  children?: ReactNode;
  /** 載入中要顯示的骨架；可傳 preset 名稱或自訂節點 */
  skeleton?: SkeletonPreset | ReactNode;
  shimmer?: ShimmerStyle;
  /** preset 的行數或列數 */
  count?: number;
  /** 交叉淡入秒數 */
  fadeDuration?: number;
  labels?: { loading?: string; loaded?: string };
  className?: string;
}

const defaultLabels = { loading: "Loading content", loaded: "Content loaded" };

const fade: Variants = {
  hidden: { opacity: 0, filter: "blur(4px)" },
  visible: { opacity: 1, filter: "blur(0px)" },
};

function renderPreset(preset: SkeletonPreset, count?: number) {
  switch (preset) {
    case "text":
      return <SkeletonText lines={count ?? 4} />;
    case "card":
      return <SkeletonCard lines={count ?? 3} />;
    case "product":
      return <SkeletonProductCard />;
    case "list":
      return <SkeletonList rows={count ?? 4} />;
  }
}

/** 包住真實內容：未載入時顯示骨架，載入後交叉淡入 */
export function SkeletonSet({
  loaded,
  children,
  skeleton = "card",
  shimmer = "wave",
  count,
  fadeDuration = 0.35,
  labels,
  className,
}: SkeletonSetProps) {
  const reduceMotion = useReducedMotion();
  const text = { ...defaultLabels, ...labels };
  const placeholder =
    typeof skeleton === "string" && ["text", "card", "product", "list"].includes(skeleton)
      ? renderPreset(skeleton as SkeletonPreset, count)
      : skeleton;
  const transition = { duration: reduceMotion ? 0 : fadeDuration, ease: "easeOut" as const };

  return (
    <ShimmerContext.Provider value={shimmer}>
      <div className={cn("relative", className)}>
        <span className="sr-only" role="status">
          {loaded ? text.loaded : text.loading}
        </span>
        <div aria-busy={!loaded} className="grid">
        <AnimatePresence initial={false}>
          {loaded ? (
            <motion.div
              key="content"
              className="[grid-area:1/1]"
              variants={reduceMotion ? undefined : fade}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={transition}
            >
              {children}
            </motion.div>
          ) : (
            <motion.div
              key="skeleton"
              className="[grid-area:1/1]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transition}
            >
              {placeholder}
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </ShimmerContext.Provider>
  );
}
