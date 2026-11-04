"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useId, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SensitiveImageLabels {
  /** 遮蔽時的中性替代文字 */
  hiddenAlt?: (rating?: string) => string;
  cover?: ReactNode;
  show?: ReactNode;
  revealed?: string;
  open?: string;
}

export interface SensitiveImageProps {
  src: string;
  alt: string;
  /** 為真時從第一幀就以紙面遮住，原圖不會閃現 */
  flagged?: boolean;
  /** 分級標籤，例如 Spoiler、Mature、Graphic */
  rating?: string;
  /** 為什麼被遮住，一行說明 */
  reason?: ReactNode;
  revealLabel?: ReactNode;
  /** CSS aspect-ratio，例如 "4 / 3" */
  aspect?: string;
  onReveal?: () => void;
  /** 顯示後點擊圖片，例如開啟大圖 */
  onOpen?: () => void;
  labels?: SensitiveImageLabels;
  className?: string;
}

const defaultLabels: Required<SensitiveImageLabels> = {
  hiddenAlt: (rating) => (rating ? `Hidden image: ${rating.toLowerCase()}` : "Hidden image: sensitive"),
  cover: "Sensitive content",
  show: "Show",
  revealed: "Image shown",
  open: "Open image",
};

// 設計語言（DESIGN.md）：紙、紙邊、墨
const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const inkMuted = "text-[#1c1917]/60 dark:text-[#ece7dc]/60";

const springs = {
  gentle: { type: "spring", stiffness: 240, damping: 30 },
} as const;

export function SensitiveImage({
  src,
  alt,
  flagged = false,
  rating,
  reason,
  revealLabel,
  aspect = "4 / 3",
  onReveal,
  onOpen,
  labels,
  className,
}: SensitiveImageProps) {
  const t = { ...defaultLabels, ...labels };
  const reduce = useReducedMotion() ?? false;
  const id = useId();
  // 只在這次瀏覽有效，不寫入任何儲存
  const [revealed, setRevealed] = useState(false);
  const hidden = flagged && !revealed;
  const [announcement, setAnnouncement] = useState("");

  function reveal() {
    setRevealed(true);
    setAnnouncement(t.revealed);
    onReveal?.();
  }

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={hidden ? t.hiddenAlt(rating) : alt} className="size-full object-cover" draggable={false} />
  );

  return (
    <figure className={cn("relative w-full overflow-hidden rounded-md border", edge, ink, className)} style={{ aspectRatio: aspect }}>
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          tabIndex={hidden ? -1 : undefined}
          aria-hidden={hidden || undefined}
          aria-label={hidden ? undefined : `${t.open}: ${alt}`}
          className="block size-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
        >
          {img}
        </button>
      ) : (
        img
      )}

      {/* 遮罩在伺服器端就輸出，所以原圖不會先露出再被蓋住 */}
      <AnimatePresence initial={false}>
        {hidden && (
          <motion.div
            key="cover"
            className={cn("absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-3 text-center", paper)}
            exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, transition: springs.gentle }}
          >
            <span aria-hidden="true" className={cn("absolute inset-2 rounded-[3px] border border-dashed", edge)} />
            {rating && (
              <span className="relative rounded-[3px] border border-current px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.16em] uppercase">
                {rating}
              </span>
            )}
            <p id={`${id}-reason`} className={cn("relative line-clamp-3 max-w-[16rem] text-xs leading-[1.35]", inkMuted)}>
              {reason ?? t.cover}
            </p>
            <button
              type="button"
              onClick={reveal}
              aria-describedby={`${id}-reason`}
              className={cn(
                "relative mt-1 rounded-md border bg-transparent px-3 py-1 text-xs font-medium transition-colors hover:bg-[#1c1917]/5 dark:hover:bg-[#ece7dc]/10",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
                edge,
              )}
            >
              {revealLabel ?? t.show}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </figure>
  );
}
