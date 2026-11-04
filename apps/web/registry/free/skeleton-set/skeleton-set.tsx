"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createContext, useContext, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** pulse：緩慢的透明度呼吸（只在載入中）；none：靜止的紙面色塊 */
export type ShimmerStyle = "pulse" | "none";

const ShimmerContext = createContext<ShimmerStyle>("pulse");

// 設計語言（DESIGN.md）：紙、紙邊。色塊比紙面深一階，像還沒印上去的版位
const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const block = "bg-[#eee7d8] dark:bg-[#2c2822]";

export interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
  /** 覆寫外層 SkeletonSet 的設定 */
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
      className={cn("rounded-[3px]", block, mode === "pulse" && "animate-[sunui-skeleton-pulse_2.4s_ease-in-out_infinite]", className)}
    >
      {mode === "pulse" && (
        // React 19 會依 href 去重並提升到 head
        <style href="sunui-skeleton-pulse" precedence="default">{`@keyframes sunui-skeleton-pulse { 0%, 100% { opacity: 1 } 50% { opacity: .55 } }`}</style>
      )}
    </div>
  );
}

export function SkeletonLine({ width = "100%", className }: { width?: string | number; className?: string }) {
  return <Skeleton className={cn("h-3", className)} style={{ width }} />;
}

export function SkeletonCircle({ size = 40, className }: { size?: number; className?: string }) {
  return <Skeleton className={cn("shrink-0 rounded-full", className)} style={{ width: size, height: size }} />;
}

/** 依 index 產生穩定的行寬，避免 SSR 不一致 */
const LINE_WIDTHS = ["92%", "84%", "96%", "70%", "88%", "62%"];

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonLine key={i} width={i === lines - 1 && lines > 1 ? "55%" : LINE_WIDTHS[i % LINE_WIDTHS.length]} />
      ))}
    </div>
  );
}

/** 排版稿上的圖片版位：細線打叉的方框 */
export function SkeletonImage({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("relative w-full bg-[#f3eee3] text-[#e7e0d0] dark:bg-[#26221d] dark:text-[#38332b]", className)}>
      <svg className="absolute inset-0 size-full" preserveAspectRatio="none" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M0 0 100 100M100 0 0 100" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

const surface = cn("rounded-md border", paper, edge);

export function SkeletonCard({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn(surface, "p-5", className)}>
      <div className="flex items-center gap-3">
        <SkeletonCircle size={36} />
        <div className="flex-1 space-y-2">
          <SkeletonLine width="40%" />
          <SkeletonLine width="24%" className="h-2.5" />
        </div>
      </div>
      <SkeletonText lines={lines} className="mt-5" />
    </div>
  );
}

export function SkeletonProductCard({ className }: { className?: string }) {
  return (
    <div className={cn(surface, "overflow-hidden", className)}>
      <SkeletonImage className="aspect-square" />
      <div className="space-y-2.5 p-4">
        <SkeletonLine width="70%" className="h-3.5" />
        <SkeletonLine width="40%" className="h-2.5" />
        <div className="flex items-center justify-between pt-2">
          <SkeletonLine width={40} className="h-4" />
          <Skeleton className="h-8 w-14 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <ul className={cn(surface, "divide-y divide-dashed divide-[#e7e0d0] dark:divide-[#38332b]", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-3.5">
          <Skeleton className="size-10 shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonLine width={LINE_WIDTHS[(i + 2) % LINE_WIDTHS.length]} className="max-w-56" />
            <SkeletonLine width="30%" className="h-2.5 max-w-24" />
          </div>
          <SkeletonLine width={44} />
        </li>
      ))}
    </ul>
  );
}

export type SkeletonPreset = "text" | "card" | "product" | "list";

export interface SkeletonSetProps {
  /** true 時換成真實內容 */
  loaded: boolean;
  children?: ReactNode;
  /** 載入中要顯示的骨架；可傳 preset 名稱或自訂節點 */
  skeleton?: SkeletonPreset | ReactNode;
  shimmer?: ShimmerStyle;
  /** preset 的行數或列數 */
  count?: number;
  labels?: { loading?: string; loaded?: string };
  className?: string;
}

const defaultLabels = { loading: "Loading content", loaded: "Content loaded" };
const presets: SkeletonPreset[] = ["text", "card", "product", "list"];

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

/** 包住真實內容：未載入時顯示骨架，載入後短暫交叉淡入 */
export function SkeletonSet({ loaded, children, skeleton = "card", shimmer = "pulse", count, labels, className }: SkeletonSetProps) {
  const reduceMotion = useReducedMotion();
  const text = { ...defaultLabels, ...labels };
  const placeholder = typeof skeleton === "string" && presets.includes(skeleton as SkeletonPreset) ? renderPreset(skeleton as SkeletonPreset, count) : skeleton;
  const fade = { duration: reduceMotion ? 0 : 0.2, ease: "easeOut" as const };

  return (
    <ShimmerContext.Provider value={shimmer}>
      <div className={cn("relative", className)}>
        <span className="sr-only" role="status">
          {loaded ? text.loaded : text.loading}
        </span>
        <div aria-busy={!loaded} className="grid grid-cols-[minmax(0,1fr)]">
          <AnimatePresence initial={false}>
            <motion.div
              key={loaded ? "content" : "skeleton"}
              className="[grid-area:1/1]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fade}
            >
              {loaded ? children : placeholder}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </ShimmerContext.Provider>
  );
}
