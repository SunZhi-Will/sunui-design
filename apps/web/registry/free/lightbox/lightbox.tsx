"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion, type PanInfo } from "framer-motion";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  gentle: { type: "spring", stiffness: 240, damping: 30 },
} as const;

export interface LightboxImage {
  id: string;
  src: string;
  alt: string;
  /** 大圖下方的說明 */
  caption?: ReactNode;
  /** 縮圖可用較小的檔案；不給時用 src */
  thumbSrc?: string;
}

export interface LightboxProps {
  images: LightboxImage[];
  /** 縮圖格線的 class，例如 "grid-cols-3 gap-2" */
  gridClassName?: string;
  /** 自訂縮圖；需把 image 畫在一個會被放大的元素裡 */
  renderThumb?: (image: LightboxImage, index: number) => ReactNode;
  /** 縮圖的長寬比 */
  aspect?: string;
  /** fixed：蓋住整個視窗；contained：只蓋住最近的 relative 容器 */
  position?: "fixed" | "contained";
  /** 受控：目前打開第幾張；null 表示關閉 */
  index?: number | null;
  onIndexChange?: (index: number | null) => void;
  labels?: { close?: string; previous?: string; next?: string; open?: (alt: string) => string };
  className?: string;
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function Lightbox({
  images,
  gridClassName = "grid-cols-3 gap-2",
  renderThumb,
  aspect = "4 / 5",
  position = "fixed",
  index: indexProp,
  onIndexChange,
  labels = {},
  className,
}: LightboxProps) {
  const reduce = useReducedMotion();
  const group = useId();
  const [inner, setInner] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const index = indexProp !== undefined ? indexProp : inner;
  const current = index === null ? null : images[index];
  const closeRef = useRef<HTMLButtonElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const lastIndex = useRef<number | null>(null);
  const L = { close: "Close", previous: "Previous image", next: "Next image", open: (alt: string) => `Enlarge: ${alt}`, ...labels };

  useEffect(() => setMounted(true), []);

  const set = useCallback(
    (next: number | null) => {
      if (indexProp === undefined) setInner(next);
      onIndexChange?.(next);
    },
    [indexProp, onIndexChange],
  );

  const step = useCallback(
    (delta: number) => {
      if (index === null) return;
      set((index + delta + images.length) % images.length);
    },
    [index, images.length, set],
  );

  useEffect(() => {
    if (index === null) {
      if (lastIndex.current !== null) thumbRefs.current[lastIndex.current]?.focus();
      lastIndex.current = null;
      return;
    }
    lastIndex.current = index;
  }, [index]);

  const isOpen = index !== null;
  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") set(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    if (position === "fixed") document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, position, set, step]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 60 || Math.abs(info.velocity.x) > 500) step(info.offset.x < 0 ? 1 : -1);
    else if (info.offset.y > 100) set(null);
  };

  const layoutT = reduce ? { duration: 0 } : springs.gentle;

  const overlay = (
    <AnimatePresence>
      {current && index !== null && (
        <div role="dialog" aria-modal="true" aria-label={current.alt} className={cn("inset-0 z-50 flex flex-col", position === "fixed" ? "fixed" : "absolute")}>
          <motion.div
            className="absolute inset-0 bg-[#1c1917]/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
            onClick={() => set(null)}
          />
          <div className="relative flex items-center justify-between p-3 text-[#faf7f0]">
            <span className="px-2 text-xs tabular-nums opacity-70">
              {index + 1} / {images.length}
            </span>
            <button ref={closeRef} type="button" aria-label={L.close} onClick={() => set(null)} className="grid size-10 place-items-center rounded-md outline-offset-2 hover:bg-white/10 focus-visible:outline-2">
              <Icon d="M6 6l12 12M18 6L6 18" />
            </button>
          </div>
          <div className="pointer-events-none relative flex min-h-0 flex-1 items-center justify-center px-12 sm:px-16">
            {/* 換張時舊圖縮回自己的縮圖、新圖從它的縮圖長出來，位置關係一直是清楚的 */}
            <AnimatePresence initial={false} mode="popLayout">
              <motion.img
                key={current.id}
                layoutId={`${group}-${current.id}`}
                src={current.src}
                alt={current.alt}
                draggable={false}
                drag={reduce ? false : true}
                dragSnapToOrigin
                dragElastic={0.4}
                onDragEnd={onDragEnd}
                transition={layoutT}
                className="pointer-events-auto max-h-full max-w-full cursor-grab touch-none select-none rounded-md object-contain active:cursor-grabbing"
              />
            </AnimatePresence>
            {images.length > 1 && (
              <>
                <button type="button" aria-label={L.previous} onClick={() => step(-1)} className="pointer-events-auto absolute left-2 grid size-10 place-items-center rounded-full text-[#faf7f0] outline-offset-2 hover:bg-white/10 focus-visible:outline-2">
                  <Icon d="M15 6l-6 6 6 6" />
                </button>
                <button type="button" aria-label={L.next} onClick={() => step(1)} className="pointer-events-auto absolute right-2 grid size-10 place-items-center rounded-full text-[#faf7f0] outline-offset-2 hover:bg-white/10 focus-visible:outline-2">
                  <Icon d="M9 6l6 6-6 6" />
                </button>
              </>
            )}
          </div>
          <div className="relative min-h-12 px-4 py-3 text-center text-sm text-[#faf7f0]/80">{current.caption}</div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <LayoutGroup id={group}>
      <ul className={cn("grid", gridClassName, className)}>
        {images.map((image, i) => (
          <li key={image.id}>
            <button
              ref={(el) => {
                thumbRefs.current[i] = el;
              }}
              type="button"
              aria-label={L.open(image.alt)}
              onClick={() => set(i)}
              className="block w-full overflow-hidden rounded-md outline-offset-2 focus-visible:outline-2"
              style={{ aspectRatio: aspect }}
            >
              {renderThumb ? (
                renderThumb(image, i)
              ) : (
                <motion.img
                  layoutId={`${group}-${image.id}`}
                  src={image.thumbSrc ?? image.src}
                  alt=""
                  transition={layoutT}
                  className="size-full object-cover transition-opacity hover:opacity-90"
                  style={{ visibility: index === i ? "hidden" : "visible" }}
                />
              )}
            </button>
          </li>
        ))}
      </ul>
      {position === "fixed" ? (mounted ? createPortal(overlay, document.body) : null) : overlay}
    </LayoutGroup>
  );
}
