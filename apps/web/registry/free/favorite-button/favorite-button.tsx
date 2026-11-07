"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

import { cn } from "@/lib/utils";

export interface FavoriteButtonProps {
  /** 受控狀態；不給時元件自行管理 */
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  /** 顯示收藏數；不給則只顯示愛心 */
  count?: number;
  size?: "sm" | "md" | "lg";
  /** 介面語言與數字格式：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<FavoriteButtonLabels>;
  className?: string;
}

export interface FavoriteButtonLabels {
  add: string;
  remove: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
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

// 設計語言（DESIGN.md）：墨色外框，收藏時品牌專色實心
const ink = "text-[#171717] dark:text-[#ededed]";
/** 品牌專色：預設跟著主題的 --primary，買家設 --sunui-spot 就換成自己的品牌色。只用在選中、優惠、目前進度 */
const spot = "text-[color:var(--sunui-spot,var(--primary))]";

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
        "group inline-flex items-center gap-1.5 rounded-full",
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
          {/* 實心像印章壓上去：先大後落定 */}
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
