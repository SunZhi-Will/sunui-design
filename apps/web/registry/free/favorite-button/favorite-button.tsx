"use client";

import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export interface FavoriteButtonProps {
  /** 受控狀態；不給時元件自行管理 */
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  /** 顯示收藏數；不給則只顯示愛心 */
  count?: number;
  size?: "sm" | "md" | "lg";
  /** 收藏時的主色 */
  color?: "rose" | "amber" | "violet";
  /** 顯示粒子與光環 */
  burst?: boolean;
  labels?: {
    add?: string;
    remove?: string;
  };
  className?: string;
}

const defaultLabels = {
  add: "Add to favorites",
  remove: "Remove from favorites",
};

const sizes = {
  sm: { btn: "size-8", icon: "size-4", text: "text-xs" },
  md: { btn: "size-10", icon: "size-5", text: "text-sm" },
  lg: { btn: "size-12", icon: "size-6", text: "text-base" },
};

const palettes = {
  rose: { text: "text-rose-500", ring: "border-rose-500", dots: ["#f43f5e", "#fb7185", "#f59e0b", "#ec4899"] },
  amber: { text: "text-amber-500", ring: "border-amber-500", dots: ["#f59e0b", "#fbbf24", "#f97316", "#facc15"] },
  violet: { text: "text-violet-500", ring: "border-violet-500", dots: ["#8b5cf6", "#a78bfa", "#ec4899", "#6366f1"] },
};

const heartVariants: Variants = {
  off: { scale: 1 },
  on: { scale: [1, 0.7, 1.25, 1], transition: { duration: 0.45, times: [0, 0.2, 0.6, 1] } },
};

const PARTICLES = 10;

export function FavoriteButton({
  pressed: pressedProp,
  defaultPressed = false,
  onPressedChange,
  count,
  size = "md",
  color = "rose",
  burst = true,
  labels,
  className,
}: FavoriteButtonProps) {
  const reduceMotion = useReducedMotion();
  const text = { ...defaultLabels, ...labels };
  const [internal, setInternal] = useState(defaultPressed);
  const pressed = pressedProp ?? internal;
  const s = sizes[size];
  const p = palettes[color];

  // 只在使用者把狀態切為 true 的那一刻放光環
  const [burstKey, setBurstKey] = useState(0);
  const was = useRef(pressed);
  useEffect(() => {
    if (pressed && !was.current && burst && !reduceMotion) setBurstKey((k) => k + 1);
    was.current = pressed;
  }, [pressed, burst, reduceMotion]);

  function toggle() {
    const next = !pressed;
    if (pressedProp === undefined) setInternal(next);
    onPressedChange?.(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={pressed}
      aria-label={pressed ? text.remove : text.add}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-full text-muted-foreground transition-colors",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
        count !== undefined && "pr-3",
        className,
      )}
    >
      <span
        className={cn(
          "relative grid shrink-0 place-items-center rounded-full border border-border bg-card transition-colors group-hover:bg-muted",
          s.btn,
        )}
      >
        <AnimatePresence>
          {burstKey > 0 && (
            <motion.span key={burstKey} className="pointer-events-none absolute inset-0" aria-hidden="true">
              <motion.span
                className={cn("absolute inset-0 rounded-full border-2", p.ring)}
                initial={{ scale: 0.4, opacity: 0.9 }}
                animate={{ scale: 1.7, opacity: 0, borderWidth: 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
              />
              {Array.from({ length: PARTICLES }, (_, i) => {
                const angle = (i / PARTICLES) * Math.PI * 2 - Math.PI / 2;
                const dist = i % 2 === 0 ? 26 : 19;
                return (
                  <motion.span
                    key={i}
                    className="absolute top-1/2 left-1/2 -mt-[3px] -ml-[3px] size-1.5 rounded-full"
                    style={{ backgroundColor: p.dots[i % p.dots.length] }}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                    animate={{
                      x: Math.cos(angle) * dist,
                      y: Math.sin(angle) * dist,
                      scale: [0, 1.2, 0],
                      opacity: [1, 1, 0],
                    }}
                    transition={{ duration: 0.6, delay: 0.08, ease: "easeOut" }}
                  />
                );
              })}
            </motion.span>
          )}
        </AnimatePresence>

        <motion.svg
          viewBox="0 0 24 24"
          className={cn("relative", s.icon, pressed ? p.text : "group-hover:text-foreground")}
          variants={heartVariants}
          initial={false}
          animate={pressed && !reduceMotion ? "on" : "off"}
          aria-hidden="true"
        >
          <motion.path
            d="M12 20.3s-7.5-4.4-8.9-9.4C2.2 7.6 4.3 4.5 7.6 4.5c1.9 0 3.4 1.1 4.4 2.6 1-1.5 2.5-2.6 4.4-2.6 3.3 0 5.4 3.1 4.5 6.4-1.4 5-8.9 9.4-8.9 9.4z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
            initial={false}
            animate={{ fillOpacity: pressed ? 1 : 0 }}
            fill="currentColor"
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
          />
        </motion.svg>
      </span>

      {count !== undefined && (
        <span className={cn("relative overflow-hidden font-medium tabular-nums", s.text, pressed && "text-foreground")}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={count}
              className="inline-block"
              initial={reduceMotion ? false : { y: pressed ? "100%" : "-100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduceMotion ? undefined : { y: pressed ? "-100%" : "100%", opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {new Intl.NumberFormat("en-US", { notation: "compact" }).format(count)}
            </motion.span>
          </AnimatePresence>
        </span>
      )}
    </button>
  );
}
