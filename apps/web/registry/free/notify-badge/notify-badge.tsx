"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const springs = {
  stamp: { type: "spring", stiffness: 620, damping: 20, mass: 0.8 },
} as const;

export interface NotifyBadgeProps {
  /** 被標記的元素，例如鈴鐺或購物車圖示 */
  children: ReactNode;
  /** 數量；0 時隱藏（除非 showZero） */
  count?: number;
  /** 超過時顯示「max+」 */
  max?: number;
  /** 只顯示小圓點，不顯示數字 */
  dot?: boolean;
  showZero?: boolean;
  /** accent：朱紅；ink：墨色；primary：主題主色 */
  tone?: "accent" | "ink" | "primary";
  /** 徽章位置 */
  placement?: "top-right" | "top-left" | "bottom-right";
  /** 給螢幕閱讀器的完整說法，例如 (n) => `${n} 則新通知` */
  label?: (count: number) => string;
  className?: string;
}

const tones = {
  accent: "bg-[#171717] text-white dark:bg-[#ededed] dark:text-[#1c1c1c]",
  ink: "bg-[#171717] text-[#f7f7f7] dark:bg-[#ededed] dark:text-[#1c1c1c]",
  primary: "bg-primary text-primary-foreground",
};

const places = {
  "top-right": "right-0 top-0 translate-x-1/3 -translate-y-1/3",
  "top-left": "left-0 top-0 -translate-x-1/3 -translate-y-1/3",
  "bottom-right": "bottom-0 right-0 translate-x-1/3 translate-y-1/3",
};

export function NotifyBadge({
  children,
  count = 0,
  max = 99,
  dot = false,
  showZero = false,
  tone = "accent",
  placement = "top-right",
  label = (n) => `${n} new`,
  className,
}: NotifyBadgeProps) {
  const reduce = useReducedMotion();
  const prev = useRef(count);
  const [bump, setBump] = useState(0);

  useEffect(() => {
    if (count > prev.current) setBump((b) => b + 1);
    prev.current = count;
  }, [count]);

  const visible = count > 0 || showZero;
  const text = count > max ? `${max}+` : String(count);

  return (
    <span className={cn("relative inline-flex", className)}>
      {children}
      <span className="sr-only" aria-live="polite">
        {visible ? label(count) : ""}
      </span>
      <span aria-hidden="true" className={cn("pointer-events-none absolute", places[placement])}>
        <AnimatePresence initial={false}>
          {visible && (
            <motion.span
              key="badge"
              className="block"
              initial={{ scale: reduce ? 1 : 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: reduce ? 1 : 0, opacity: 0 }}
              transition={reduce ? { duration: 0 } : springs.stamp}
            >
              {/* 數量增加時像被蓋了一下：先放大再落定；減少時不動 */}
              <motion.span
                key={bump}
                initial={reduce || bump === 0 ? false : { scale: 1.35 }}
                animate={{ scale: 1 }}
                transition={springs.stamp}
                className={cn(
                  "flex items-center justify-center rounded-full ring-2 ring-background",
                  dot ? "size-2.5" : "h-[1.15rem] min-w-[1.15rem] px-1 text-[0.68rem] font-semibold tabular-nums leading-none",
                  tones[tone],
                )}
              >
                {!dot && text}
              </motion.span>
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </span>
  );
}
