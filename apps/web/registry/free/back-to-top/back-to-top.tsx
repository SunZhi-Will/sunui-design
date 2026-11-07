"use client";

import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { useState, type RefObject } from "react";

import { cn } from "@/lib/utils";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  gentle: { type: "spring", stiffness: 240, damping: 30 },
} as const;

export interface BackToTopProps {
  /** 在可捲動容器裡使用時傳入；預設跟著視窗 */
  container?: RefObject<HTMLElement | null>;
  /** 捲過多少 px 才出現 */
  threshold?: number;
  /** 外圈顯示閱讀進度 */
  showProgress?: boolean;
  /** fixed：貼在視窗角落；contained：貼在最近的 relative 容器角落（可捲動容器請用 sticky 包一層） */
  position?: "fixed" | "contained";
  label?: string;
  className?: string;
}

/** 品牌專色：預設跟著主題的 --primary，買家設 --sunui-spot 就換成自己的品牌色。只用在選中、優惠、目前進度 */
const spot = "text-[color:var(--sunui-spot,var(--primary))]";

const R = 21;
const C = 2 * Math.PI * R;

export function BackToTop({ container, threshold = 400, showProgress = true, position = "fixed", label = "Back to top", className }: BackToTopProps) {
  const reduce = useReducedMotion();
  const { scrollY, scrollYProgress } = useScroll(container ? { container, layoutEffect: false } : undefined);
  const [shown, setShown] = useState(false);
  const [progress, setProgress] = useState(0);

  useMotionValueEvent(scrollY, "change", (y) => setShown(y > threshold));
  useMotionValueEvent(scrollYProgress, "change", (p) => setProgress(p));

  const toTop = () => {
    const target = container?.current ?? window;
    target.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <AnimatePresence>
      {shown && (
        <motion.button
          type="button"
          aria-label={label}
          onClick={toTop}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, transition: reduce ? { duration: 0 } : springs.gentle }}
          exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: 16, transition: { duration: 0.15 } }}
          whileTap={reduce ? undefined : { scale: 0.94, transition: springs.snappy }}
          className={cn(
            "z-40 grid size-12 place-items-center rounded-full border border-[#e2e2e2] bg-[#f7f7f7] text-[#171717] outline-offset-2 focus-visible:outline-2 dark:border-[#333333] dark:bg-[#1c1c1c] dark:text-[#ededed]",
            position === "fixed" ? "fixed bottom-6 right-6" : "absolute bottom-4 right-4",
            className,
          )}
        >
          {showProgress && (
            <svg viewBox="0 0 48 48" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
              <circle cx="24" cy="24" r={R} className={spot} fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray={C} strokeDashoffset={C * (1 - progress)} strokeLinecap="round" />
            </svg>
          )}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="relative size-5" aria-hidden="true">
            <path d="M12 19V5M6 11l6-6 6 6" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
