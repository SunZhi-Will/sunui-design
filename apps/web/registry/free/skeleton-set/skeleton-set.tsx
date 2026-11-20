"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createContext, useContext, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** pulse: a slow opacity breathing (only while loading); none: static surface blocks */
export type ShimmerStyle = "pulse" | "none";

const ShimmerContext = createContext<ShimmerStyle>("pulse");

// Design language (DESIGN.md): surface and hairline. Blocks are one step darker than the surface, marking slots that have not loaded yet
const sheet = "bg-card shadow-[0_1px_2px_rgb(0_0_0/0.05),0_4px_12px_-6px_rgb(0_0_0/0.06)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]";
const edge = "border-foreground/10";
const block = "bg-[#e7e7e7] dark:bg-[#292929]";

export interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
  /** Overrides the settings of the outer SkeletonSet */
  shimmer?: ShimmerStyle;
}

/** Basic skeleton block; every other component is built from it */
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
        // React 19 dedupes by href and hoists it to the head
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

/** Produces stable line widths from the index, avoiding SSR mismatch */
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

/** Image slot in a wireframe: a box crossed with thin lines */
export function SkeletonImage({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("relative w-full bg-muted text-foreground/10", className)}>
      <svg className="absolute inset-0 size-full" preserveAspectRatio="none" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M0 0 100 100M100 0 0 100" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

const surface = cn("rounded-xl border", sheet, edge);

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
    <ul className={cn(surface, "divide-y divide-foreground/10", className)}>
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

/** Generic full-row slot: when you do not know what the content looks like, a few equal-width surface blocks stand for "there are this many items here" */
export function SkeletonRows({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-11 w-full rounded-md" />
      ))}
    </div>
  );
}

export type SkeletonPreset = "text" | "card" | "product" | "list" | "rows";

export interface SkeletonSetProps {
  /** When true, shows the real content */
  loaded: boolean;
  children?: ReactNode;
  /** Skeleton to show while loading; pass a preset name or a custom node */
  skeleton?: SkeletonPreset | ReactNode;
  shimmer?: ShimmerStyle;
  /** Number of lines or rows in the preset */
  count?: number;
  /** Name read by screen readers while loading, for example "Loading past invoices"; when omitted, uses the built-in string for the locale */
  label?: string;
  /** Language of the screen reader text: en, zh-TW, zh-CN, ja. Tags like zh-Hant-HK and ja-JP are also accepted */
  locale?: string;
  /** Overrides built-in strings, takes precedence over locale */
  labels?: Partial<SkeletonSetLabels>;
  className?: string;
}

export interface SkeletonSetLabels {
  loading: string;
  loaded: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Maps any language tag to one of the four built-in languages, falling back to English */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, SkeletonSetLabels> = {
  en: { loading: "Loading content", loaded: "Content loaded" },
  "zh-TW": { loading: "內容載入中", loaded: "內容已載入" },
  "zh-CN": { loading: "内容加载中", loaded: "内容已加载" },
  ja: { loading: "コンテンツを読み込み中", loaded: "コンテンツを読み込みました" },
};
const presets: SkeletonPreset[] = ["text", "card", "product", "list", "rows"];

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
    case "rows":
      return <SkeletonRows rows={count ?? 4} />;
  }
}

/** Wraps the real content: shows the skeleton until loaded, then briefly cross-fades */
export function SkeletonSet({ loaded, children, skeleton = "card", shimmer = "pulse", count, label, locale = "en", labels, className }: SkeletonSetProps) {
  const reduceMotion = useReducedMotion();
  const text = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const placeholder = typeof skeleton === "string" && presets.includes(skeleton as SkeletonPreset) ? renderPreset(skeleton as SkeletonPreset, count) : skeleton;
  const fade = { duration: reduceMotion ? 0 : 0.2, ease: "easeOut" as const };

  return (
    <ShimmerContext.Provider value={shimmer}>
      <div className={cn("relative", className)}>
        <span className="sr-only" role="status">
          {loaded ? text.loaded : (label ?? text.loading)}
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
