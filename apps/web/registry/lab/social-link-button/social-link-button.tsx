"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type SocialPlatform = "github" | "x" | "linkedin" | "instagram" | "facebook" | "youtube" | "email";

export interface SocialLinkButtonProps {
  platform: SocialPlatform;
  href: string;
  /** 顯示與無障礙名稱，預設為平台名稱 */
  label?: string;
  /** icon：圓形圖示；pill：圖示加文字；expand：hover 或聚焦時展開文字 */
  variant?: "icon" | "pill" | "expand";
  size?: "sm" | "md" | "lg";
  /** 填色方式：brand 為品牌色，mono 為主題色 */
  tone?: "brand" | "mono";
  /** 自訂圖示，覆蓋內建圖示 */
  icon?: ReactNode;
  /** 是否在新分頁開啟，預設對非 mailto 連結為 true */
  newTab?: boolean;
  labels?: {
    newTabHint?: string;
  };
  className?: string;
}

const platformMeta: Record<SocialPlatform, { name: string; color: string; path: string }> = {
  github: {
    name: "GitHub",
    color: "#24292f",
    path: "M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.55v-2.1c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.66.8.55A11.5 11.5 0 0 0 12 .5z",
  },
  x: {
    name: "X",
    color: "#0f1419",
    path: "M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L1.9 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z",
  },
  linkedin: {
    name: "LinkedIn",
    color: "#0a66c2",
    path: "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z",
  },
  instagram: {
    name: "Instagram",
    color: "#e1306c",
    path: "M12 2.2c3.2 0 3.58 0 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s0 3.58-.07 4.85c-.15 3.22-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58 0-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s0-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.2 12 2.2zm0 4.62a5.18 5.18 0 1 0 0 10.36 5.18 5.18 0 0 0 0-10.36zm0 8.54a3.36 3.36 0 1 1 0-6.72 3.36 3.36 0 0 1 0 6.72zm5.39-9.96a1.21 1.21 0 1 0 0 2.42 1.21 1.21 0 0 0 0-2.42z",
  },
  facebook: {
    name: "Facebook",
    color: "#1877f2",
    path: "M14 8.5V6.6c0-.8.2-1.3 1.4-1.3H17V2.2c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.3H8v3.4h2.6V22H14v-10.1h2.7l.4-3.4H14z",
  },
  youtube: {
    name: "YouTube",
    color: "#ff0000",
    path: "M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.75 15.02V8.98L15.5 12l-5.75 3.02z",
  },
  email: {
    name: "Email",
    color: "#0f766e",
    path: "M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2.3V17h16V7.3l-8 5.4-8-5.4zM5.6 7l6.4 4.3L18.4 7H5.6z",
  },
};

const sizeClass = {
  sm: { box: "h-9", icon: "size-4", text: "text-xs", pad: "px-3", square: "w-9" },
  md: { box: "h-11", icon: "size-5", text: "text-sm", pad: "px-4", square: "w-11" },
  lg: { box: "h-13", icon: "size-6", text: "text-base", pad: "px-5", square: "w-13" },
};

const fillVariants: Variants = {
  rest: { clipPath: "circle(0% at 50% 100%)" },
  active: { clipPath: "circle(150% at 50% 100%)" },
};

export function SocialLinkButton({
  platform,
  href,
  label,
  variant = "icon",
  size = "md",
  tone = "brand",
  icon,
  newTab,
  labels,
  className,
}: SocialLinkButtonProps) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(false);
  const meta = platformMeta[platform];
  const name = label ?? meta.name;
  const s = sizeClass[size];
  const external = newTab ?? !href.startsWith("mailto:");
  const hint = labels?.newTabHint ?? "(opens in a new tab)";
  const fillColor = tone === "brand" ? meta.color : "var(--primary)";
  const showText = variant === "pill" || (variant === "expand" && active);

  const glyph = icon ?? (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={meta.path} />
    </svg>
  );

  return (
    <motion.a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      aria-label={variant === "icon" || variant === "expand" ? `${name}${external ? ` ${hint}` : ""}` : undefined}
      title={variant === "icon" ? name : undefined}
      initial="rest"
      animate={active ? "active" : "rest"}
      onHoverStart={() => setActive(true)}
      onHoverEnd={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      whileTap={reduce ? undefined : { scale: 0.95 }}
      layout={variant === "expand" && !reduce}
      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 34 }}
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-full border border-border bg-card font-medium text-card-foreground shadow-sm outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        s.box,
        s.text,
        variant === "icon" ? s.square : s.pad,
        variant === "expand" && !active && cn(s.square, "px-0"),
        className,
      )}
    >
      {/* 品牌色由下往上以圓形擴散填滿 */}
      <motion.span
        aria-hidden="true"
        className="absolute inset-0"
        style={{ backgroundColor: fillColor }}
        variants={fillVariants}
        transition={reduce ? { duration: 0 } : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      />
      <span
        className={cn(
          "relative z-10 flex items-center gap-2 transition-colors duration-200",
          active && (tone === "brand" ? "text-white" : "text-primary-foreground"),
        )}
      >
        <motion.span
          className={cn("flex shrink-0 [&>svg]:size-full", s.icon)}
          animate={reduce ? undefined : { y: active ? -1 : 0, rotate: active ? -6 : 0 }}
          aria-hidden="true"
        >
          {glyph}
        </motion.span>
        {showText && (
          <motion.span
            layout={!reduce}
            initial={reduce || variant === "pill" ? false : { opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            className="whitespace-nowrap"
            aria-hidden={variant === "expand" ? true : undefined}
          >
            {name}
          </motion.span>
        )}
        {variant === "pill" && external && <span className="sr-only">{hint}</span>}
      </span>
    </motion.a>
  );
}
