"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import * as React from "react";

import { cn } from "@/lib/utils";

export type SocialLayout = "petal" | "vertical" | "grid";
export type SocialCorner = "bottom-right" | "bottom-left" | "top-right" | "top-left";
export type TitlePosition = "top" | "right" | "bottom" | "left";

export interface SocialButtonProps {
  href?: string;
  /** 圖示：網址字串會渲染成 <img>，或直接傳 React 節點 */
  icon: React.ReactNode;
  /** 漸層色 class，例如 "from-purple-600/90 to-indigo-800/90" */
  className?: string;
  iconClassName?: string;
  position?: { x: number; y: number };
  variant?: SocialLayout;
  title?: string;
  titleDisplay?: "always" | "hover" | "none";
  titlePosition?: TitlePosition;
  onClick?: () => void;
  isMainButton?: boolean;
  isOpen?: boolean;
  "aria-label"?: string;
}

const titlePositionClass: Record<TitlePosition, string> = {
  top: "bottom-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2",
  right: "left-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2",
  bottom: "top-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2",
  left: "right-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2",
};

const titleArrowClass: Record<TitlePosition, string> = {
  top: "bottom-[-0.25rem] left-1/2 -translate-x-1/2",
  right: "left-[-0.25rem] top-1/2 -translate-y-1/2",
  bottom: "top-[-0.25rem] left-1/2 -translate-x-1/2",
  left: "right-[-0.25rem] top-1/2 -translate-y-1/2",
};

export function SocialButton({
  href,
  icon,
  position,
  className = "",
  iconClassName = "",
  variant,
  title,
  titleDisplay = "none",
  titlePosition = "bottom",
  onClick,
  isMainButton,
  isOpen,
  "aria-label": ariaLabel,
}: SocialButtonProps) {
  const reduce = useReducedMotion() ?? false;

  const buttonContent = (
    <>
      {typeof icon === "string" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={icon} alt="" width={20} height={20} className={iconClassName} />
      ) : (
        icon
      )}
      {title && titleDisplay !== "none" && (
        <span
          aria-hidden
          className={cn(
            "absolute z-[2000] rounded-sm bg-gray-800/90 px-2 py-1 text-sm whitespace-nowrap text-white transition-opacity duration-200",
            titlePositionClass[titlePosition],
            titleDisplay === "always"
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-visible:opacity-100",
          )}
        >
          <span className={cn("absolute h-2 w-2 rotate-45 bg-gray-800/90", titleArrowClass[titlePosition])} />
          {title}
        </span>
      )}
    </>
  );

  const buttonClassName = cn(
    isMainButton ? "h-12 w-12" : "h-10 w-10",
    "group relative flex items-center justify-center rounded-full bg-linear-to-r text-white shadow-lg transition-all duration-300 hover:z-[1500]",
    "focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:outline-hidden",
    className || "from-blue-600/90 to-blue-800/90 hover:shadow-blue-500/50",
  );

  const x = variant === "vertical" ? 0 : position?.x || 0;
  const y = position?.y || 0;
  const motionProps = {
    initial: reduce ? false : { scale: 0, x, y },
    animate: { scale: 1, x, y },
    exit: reduce ? { opacity: 0, x, y } : { scale: 0, x, y },
    whileHover: reduce ? undefined : { scale: 1.1 },
    whileTap: reduce ? undefined : { scale: 0.9 },
    transition: { duration: reduce ? 0 : 0.1, ease: [1, 1, 1, 1] as [number, number, number, number] },
  };

  if (isMainButton) {
    return (
      <motion.button
        type="button"
        className={buttonClassName}
        onClick={onClick}
        aria-label={ariaLabel ?? title}
        aria-expanded={isOpen}
        {...motionProps}
      >
        {buttonContent}
      </motion.button>
    );
  }

  return (
    <motion.div>
      <motion.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("absolute", buttonClassName)}
        onClick={onClick}
        aria-label={ariaLabel ?? title}
        {...motionProps}
      >
        {buttonContent}
      </motion.a>
    </motion.div>
  );
}

/** 原 FloatingButton 的展開位置計算：花瓣、垂直、網格三種排法 */
export function getSocialButtonPosition(layout: SocialLayout, index: number, total: number, corner: SocialCorner = "bottom-right") {
  const baseRadius = 56;
  const spacing = 56;

  if (layout === "grid") {
    const itemsPerRow = Math.ceil(Math.sqrt(total));
    const now = index + 1;
    if (corner === "bottom-right" || corner === "bottom-left") {
      const reversedIndex = total - index;
      const row = Math.floor(reversedIndex / itemsPerRow);
      const col = reversedIndex % itemsPerRow;
      return { x: (corner === "bottom-right" ? -col : col) * spacing, y: -row * spacing };
    }
    const row = Math.floor(now / itemsPerRow);
    const col = now % itemsPerRow;
    return { x: (corner === "top-right" ? -col : col) * spacing, y: row * spacing };
  }

  if (layout === "vertical") {
    return { x: 0, y: (corner.startsWith("bottom") ? -1 : 1) * spacing * (index + 1) };
  }

  // 花瓣模式：第一層 3 顆，之後每層多 2 顆，半徑逐層加大
  let currentIndex = index;
  let layer = 0;
  let buttonsInPreviousLayers = 0;
  while (currentIndex >= 0) {
    const inLayer = Math.min(3 + layer * 2, total - buttonsInPreviousLayers);
    if (currentIndex < inLayer) break;
    currentIndex -= inLayer;
    buttonsInPreviousLayers += inLayer;
    layer++;
  }
  const buttonsInThisLayer = Math.min(3 + layer * 2, total - buttonsInPreviousLayers);
  const indexInLayer = index - buttonsInPreviousLayers;
  const radius = baseRadius * (layer + 1);
  // 90 度扇形展開
  const angleStep = Math.PI / 2 / (buttonsInThisLayer - 1 || 1);
  const angle = angleStep * indexInLayer;
  const sx = corner.endsWith("right") ? -1 : 1;
  const sy = corner.startsWith("bottom") ? -1 : 1;
  return { x: sx * radius * Math.cos(angle), y: sy * radius * Math.sin(angle) };
}

export type SocialGroupItem = Omit<SocialButtonProps, "position" | "variant" | "isMainButton" | "isOpen">;

export interface SocialButtonGroupProps {
  buttons: SocialGroupItem[];
  layout?: SocialLayout;
  corner?: SocialCorner;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  show?: boolean;
  showToggleButton?: boolean;
  /** true 時固定在視窗角落；false 時以 absolute 貼齊最近的 relative 父層角落 */
  fixed?: boolean;
  /** 主按鈕漸層色 class */
  toggleClassName?: string;
  className?: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<SocialButtonGroupLabels>;
}

export interface SocialButtonGroupLabels {
  open: string;
  close: string;
  group: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, SocialButtonGroupLabels> = {
  en: { open: "Open social links", close: "Close social links", group: "Social links" },
  "zh-TW": { open: "展開社群連結", close: "收合社群連結", group: "社群連結" },
  "zh-CN": { open: "展开社交链接", close: "收起社交链接", group: "社交链接" },
  ja: { open: "SNS リンクを開く", close: "SNS リンクを閉じる", group: "SNS リンク" },
};

const cornerClass: Record<SocialCorner, string> = {
  "bottom-right": "right-4 sm:right-8 bottom-8",
  "bottom-left": "left-4 sm:left-8 bottom-8",
  "top-right": "right-4 sm:right-8 top-8",
  "top-left": "left-4 sm:left-8 top-8",
};

/** 主按鈕 + 展開的社群按鈕（原 FloatingButton 的展開行為，不含拖曳） */
export function SocialButtonGroup({
  buttons,
  layout = "petal",
  corner = "bottom-right",
  open,
  defaultOpen = false,
  onOpenChange,
  show = true,
  showToggleButton = true,
  fixed = false,
  toggleClassName = "from-blue-600 to-blue-800 shadow-md hover:shadow-blue-500/50",
  className,
  locale = "en",
  labels,
}: SocialButtonGroupProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const reduce = useReducedMotion() ?? false;
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen);
  const isOpen = open ?? uncontrolled;
  const menuId = React.useId();

  const toggle = () => {
    const next = !isOpen;
    onOpenChange?.(next);
    if (open === undefined) setUncontrolled(next);
  };

  const total = buttons.length;
  const positionOf = (i: number) => {
    if (showToggleButton) return getSocialButtonPosition(layout, i, total, corner);
    if (i === 0) return { x: 0, y: 0 };
    return getSocialButtonPosition(layout, i - 1, total - 1, corner);
  };

  return (
    <div
      className={cn(
        fixed ? "fixed z-[140]" : "absolute z-10",
        cornerClass[corner],
        "h-12 w-12 transition-all duration-300",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-20 opacity-0",
        className,
      )}
    >
      <AnimatePresence>
        {isOpen && (
          <ul id={menuId} aria-label={t.group} className="absolute inset-0">
            {buttons.map((b, i) => {
              const pos = positionOf(i);
              return (
                <motion.li
                  key={b.href ?? i}
                  className="absolute top-1/2 left-1/2 -mt-5 -ml-5 h-10 w-10"
                  style={{ zIndex: layout === "vertical" ? 1000 - i : 10 }}
                  initial={reduce ? { opacity: 0, x: pos.x, y: pos.y } : { opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: pos.x,
                    y: pos.y,
                    transition: reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 24, delay: i * 0.05 },
                  }}
                  exit={
                    reduce
                      ? { opacity: 0, transition: { duration: 0 } }
                      : { opacity: 0, scale: 0, x: 0, y: 0, transition: { duration: 0.2, delay: (total - i - 1) * 0.05 } }
                  }
                >
                  <SocialButton {...b} variant={layout} className={cn(b.className || "from-blue-600 to-blue-800 shadow-md hover:shadow-blue-500/50", "cursor-pointer")} />
                </motion.li>
              );
            })}
          </ul>
        )}
      </AnimatePresence>

      {showToggleButton && (
        <div className="relative" style={{ zIndex: layout === "vertical" ? 2000 : "auto" }}>
          <SocialButton
            isMainButton
            isOpen={isOpen}
            aria-label={isOpen ? t.close : t.open}
            icon={
              <motion.svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: reduce ? 0 : 0.3 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </motion.svg>
            }
            className={toggleClassName}
            onClick={toggle}
          />
        </div>
      )}
    </div>
  );
}
