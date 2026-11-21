"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

import { cn } from "@/lib/utils";

export interface FavoriteButtonProps {
  /** Controlled state. When omitted, the component manages its own */
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  /** Shows the favorite count. When omitted, only the heart is shown */
  count?: number;
  size?: "sm" | "md" | "lg";
  /** UI language and number format: en, zh-TW, zh-CN, ja. Tags such as zh-Hant-HK and ja-JP are also accepted */
  locale?: string;
  /** Overrides the built-in strings, takes priority over locale */
  labels?: Partial<FavoriteButtonLabels>;
  className?: string;
}

export interface FavoriteButtonLabels {
  add: string;
  remove: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Maps any language tag to one of the four built-in languages, falling back to English for everything else */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, FavoriteButtonLabels> = {
  en: { add: "Add to favorites", remove: "Remove from favorites" },
  "zh-TW": { add: "加入收藏", remove: "取消收藏" },
  "zh-CN": { add: "加入收藏", remove: "取消收藏" },
  ja: { add: "お気に入りに追加", remove: "お気に入りから削除" },
};

// Design language (DESIGN.md): an outline in the text color, filled with the brand accent once favorited
const ink = "text-foreground";
/** Semantic like colour: a saved heart is red everywhere people shop, so it does not follow the brand spot. Buyers can set --sunui-like to change it */
const spot = "text-[color:var(--sunui-like,#dc3d43)] dark:text-[color:var(--sunui-like,#ff6b70)]";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  stamp: { type: "spring", stiffness: 620, damping: 20, mass: 0.8 },
} as const;

const sizes = {
  sm: { btn: "size-8", icon: "size-4", text: "text-xs" },
  md: { btn: "size-10", icon: "size-5", text: "text-sm" },
  lg: { btn: "size-12", icon: "size-6", text: "text-base" },
};

const HEART =
  "M12 20.3s-7.5-4.4-8.9-9.4C2.2 7.6 4.3 4.5 7.6 4.5c1.9 0 3.4 1.1 4.4 2.6 1-1.5 2.5-2.6 4.4-2.6 3.3 0 5.4 3.1 4.5 6.4-1.4 5-8.9 9.4-8.9 9.4z";

export function FavoriteButton({
  pressed: pressedProp,
  defaultPressed = false,
  onPressedChange,
  count,
  size = "md",
  locale = "en-US",
  labels,
  className,
}: FavoriteButtonProps) {
  const reduceMotion = useReducedMotion();
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const [internal, setInternal] = useState(defaultPressed);
  const pressed = pressedProp ?? internal;
  const s = sizes[size];

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
      aria-label={pressed ? t.remove : t.add}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-full motion-safe:active:scale-[0.97] transition-[color,background-color,border-color,opacity,scale]",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
        ink,
        count !== undefined && "pr-2",
        className,
      )}
    >
      <motion.span
        whileTap={reduceMotion ? undefined : { scale: 0.88 }}
        transition={springs.snappy}
        className={cn(
          "relative grid shrink-0 place-items-center rounded-full border border-border bg-background transition-colors group-hover:border-foreground/30",
          s.btn,
        )}
      >
        <svg viewBox="0 0 24 24" className={cn("overflow-visible", s.icon)} aria-hidden="true">
          {/* The fill presses on like a stamp: large first, then settles */}
          <AnimatePresence initial={false}>
            {pressed && (
              <motion.path
                key="fill"
                d={HEART}
                fill="currentColor"
                className={spot}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
                initial={reduceMotion ? false : { scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: reduceMotion ? 0 : 0.12 } }}
                transition={springs.stamp}
              />
            )}
          </AnimatePresence>
          <path
            d={HEART}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            className={cn("transition-colors", pressed && spot)}
          />
        </svg>
      </motion.span>

      {count !== undefined && (
        <span className={cn("relative overflow-hidden font-medium tabular-nums", s.text)}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={count}
              className="inline-block"
              initial={reduceMotion ? false : { y: pressed ? "100%" : "-100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { y: pressed ? "-100%" : "100%", opacity: 0 }}
              transition={springs.snappy}
            >
              {new Intl.NumberFormat(locale, { notation: "compact" }).format(count)}
            </motion.span>
          </AnimatePresence>
        </span>
      )}
    </button>
  );
}
