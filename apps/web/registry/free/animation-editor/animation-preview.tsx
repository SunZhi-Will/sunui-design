"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

import {
  accentVars,
  getCanvasStyle,
  getKeyframeIndexAt,
  glassPanelStyle,
  interpolateKeyframes,
  sortKeyframes,
  type AnimationKeyframe,
  type InterpolatedElement,
} from "./animation-editor";

export interface AnimationPreviewLabels {
  close: string;
  keyframeCounter: (current: number, total: number) => string;
  keyframeDot: (n: number) => string;
  scrollRegion: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, AnimationPreviewLabels> = {
  en: {
    close: "Close preview",
    keyframeCounter: (current, total) => `Keyframe ${current} / ${total}`,
    keyframeDot: (n) => `Keyframe ${n}`,
    scrollRegion: "Scroll to play the animation",
  },
  "zh-TW": {
    close: "關閉預覽",
    keyframeCounter: (current, total) => `關鍵影格 ${current} / ${total}`,
    keyframeDot: (n) => `關鍵影格 ${n}`,
    scrollRegion: "捲動以播放動畫",
  },
  "zh-CN": {
    close: "关闭预览",
    keyframeCounter: (current, total) => `关键帧 ${current} / ${total}`,
    keyframeDot: (n) => `关键帧 ${n}`,
    scrollRegion: "滚动以播放动画",
  },
  ja: {
    close: "プレビューを閉じる",
    keyframeCounter: (current, total) => `キーフレーム ${current} / ${total}`,
    keyframeDot: (n) => `キーフレーム ${n}`,
    scrollRegion: "スクロールしてアニメーションを再生",
  },
};

export interface AnimationPreviewProps<T = unknown> {
  keyframes: AnimationKeyframe<T>[];
  /** 有傳才顯示右上角關閉鈕 */
  onClose?: () => void;
  /** 卡片內容；外框（白底、圓角、陰影）由預覽提供 */
  renderElement?: (element: InterpolatedElement<T>) => ReactNode;
  /** 每秒對應的捲動距離（px），原本為 1000 */
  scrollDistancePerSecond?: number;
  /** 捲動進度改變（0 到 1） */
  onProgressChange?: (progress: number) => void;
  /** true：全螢幕覆蓋（原本行為）；false：填滿父層容器 */
  fixed?: boolean;
  accent?: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<AnimationPreviewLabels>;
  className?: string;
}

export function AnimationPreview<T = unknown>({
  keyframes,
  onClose,
  renderElement,
  scrollDistancePerSecond = 1000,
  onProgressChange,
  fixed = true,
  accent,
  locale = "en",
  labels: labelsProp,
  className,
}: AnimationPreviewProps<T>) {
  const labels = { ...MESSAGES[resolveLocale(locale)], ...labelsProp };
  const reduce = useReducedMotion() ?? false;
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  // 視窗（或容器）高度
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setViewportHeight(el.clientHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 總捲動高度：依最大時間戳，至少每個關鍵影格一個視窗高
  const totalScrollHeight = useMemo(() => {
    if (keyframes.length === 0) return viewportHeight * 3;
    const sorted = sortKeyframes(keyframes);
    const maxTimestamp = sorted[sorted.length - 1].timestamp;
    const minScrollHeight = viewportHeight * Math.max(3, sorted.length + 1);
    return maxTimestamp > 0 ? Math.max(minScrollHeight, maxTimestamp * scrollDistancePerSecond + viewportHeight) : minScrollHeight;
  }, [keyframes, viewportHeight, scrollDistancePerSecond]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current || viewportHeight === 0 || totalScrollHeight === 0) return;
    const maxScroll = totalScrollHeight - viewportHeight;
    const progress = Math.max(0, Math.min(1, maxScroll > 0 ? containerRef.current.scrollTop / maxScroll : 0));
    setScrollProgress(progress);
  }, [totalScrollHeight, viewportHeight]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    onProgressChange?.(scrollProgress);
  }, [scrollProgress, onProgressChange]);

  const state = useMemo(() => interpolateKeyframes(keyframes, scrollProgress), [keyframes, scrollProgress]);
  const currentKeyframeIndex = getKeyframeIndexAt(keyframes, scrollProgress);
  const dotCount = keyframes.length;

  const overlay = fixed ? "fixed" : "absolute";

  return (
    <div
      className={cn(
        fixed ? "fixed inset-0 z-[100]" : "relative h-full w-full overflow-hidden",
        "bg-background",
        className,
      )}
      style={accentVars(accent)}
    >
      {/* 捲動容器：只用來產生捲動距離 */}
      <div
        ref={containerRef}
        tabIndex={0}
        aria-label={labels.scrollRegion}
        className="absolute inset-0 overflow-y-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ae-accent)]"
        style={{ scrollBehavior: reduce ? "auto" : "smooth" }}
      >
        <div style={{ height: `${totalScrollHeight}px`, position: "relative" }} />
      </div>

      {/* 固定的畫布層，pointer-events-none 不擋捲動 */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(color-mix(in oklab, var(--border) 70%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--border) 70%, transparent) 1px, transparent 1px)",
          backgroundSize: `${20 * state.scale}px ${20 * state.scale}px`,
          backgroundPosition: `${state.offset.x}px ${state.offset.y}px`,
        }}
      >
        <div className="pointer-events-none absolute inset-0" style={getCanvasStyle(state)}>
          {[...state.elements]
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((element) => (
              <div
                key={element.id}
                style={{ opacity: element.opacity ?? 1, transition: reduce ? undefined : "opacity 0.15s ease-in-out" }}
              >
                <div
                  className="pointer-events-none absolute"
                  style={
                    {
                      left: element.position.x,
                      top: element.position.y,
                      width: element.size.width,
                      height: element.size.height,
                      zIndex: element.zIndex,
                    } as CSSProperties
                  }
                >
                  <div className="relative h-full w-full overflow-hidden rounded-lg border border-border bg-card shadow-sm">{renderElement?.(element)}</div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* 關閉 */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className={cn(
            overlay,
            "right-4 top-4 z-[101] rounded-lg p-3 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-[var(--ae-accent)]",
          )}
          style={glassPanelStyle}
          aria-label={labels.close}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* 進度指示 */}
      <div
        className={cn(overlay, "left-1/2 top-4 z-[101] -translate-x-1/2 rounded-lg px-4 py-2", onClose && !fixed && "max-w-[calc(100%-6rem)]")}
        style={glassPanelStyle}
      >
        <div className="flex items-center gap-3">
          <span className="whitespace-nowrap text-xs font-medium tabular-nums text-foreground" aria-live="polite">
            {labels.keyframeCounter(currentKeyframeIndex + 1, keyframes.length)}
          </span>
          <div className="flex gap-1" aria-hidden="true">
            {Array.from({ length: dotCount }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-2 w-2 rounded-full transition-colors motion-reduce:transition-none",
                  index === currentKeyframeIndex
                    ? "bg-[var(--ae-accent)]"
                    : index < currentKeyframeIndex
                      ? "bg-[var(--ae-accent-light)]"
                      : "bg-border",
                )}
                title={labels.keyframeDot(index + 1)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
