"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import * as React from "react";

import { cn } from "@/lib/utils";

export type CardVariant = "outlined" | "filled" | "elevated" | "glass" | "gradient";
export type CardSize = "sm" | "md" | "lg" | "xl";
export type CardTheme = "violet" | "cyan" | "orange" | "gradient" | "dark" | "light";
export type CardLoadingMode = "overlay" | "skeleton" | "shimmer";
export type CardMode = "light" | "dark";

type ThemeColors = {
  bg: string;
  border: string;
  hoverBorder: string;
  text: string;
  accent: string;
  glow: string;
  glowHover: string;
  glowLayer: string;
  gradient: string;
  glassBg: string;
};

// 深色模式主題配置（照原本 Card.tsx）
const darkThemeColors: Record<CardTheme, ThemeColors> = {
  violet: {
    bg: "from-gray-950 to-gray-900",
    border: "border-violet-900/50",
    hoverBorder: "hover:border-violet-700/70",
    text: "text-gray-100",
    accent: "text-violet-400",
    glow: "shadow-violet-500/20",
    glowHover: "hover:shadow-violet-500/40",
    glowLayer: "from-violet-500/20",
    gradient: "from-violet-950/50 via-gray-900/50 to-gray-950/50",
    glassBg: "bg-gray-900/80",
  },
  cyan: {
    bg: "from-gray-950 to-gray-900",
    border: "border-cyan-900/50",
    hoverBorder: "hover:border-cyan-700/70",
    text: "text-gray-100",
    accent: "text-cyan-400",
    glow: "shadow-cyan-500/20",
    glowHover: "hover:shadow-cyan-500/40",
    glowLayer: "from-cyan-500/20",
    gradient: "from-cyan-950/50 via-gray-900/50 to-gray-950/50",
    glassBg: "bg-gray-900/80",
  },
  orange: {
    bg: "from-gray-950 to-gray-900",
    border: "border-orange-900/50",
    hoverBorder: "hover:border-orange-700/70",
    text: "text-gray-100",
    accent: "text-orange-400",
    glow: "shadow-orange-500/20",
    glowHover: "hover:shadow-orange-500/40",
    glowLayer: "from-orange-500/20",
    gradient: "from-orange-950/50 via-gray-900/50 to-gray-950/50",
    glassBg: "bg-gray-900/80",
  },
  gradient: {
    bg: "from-gray-950 via-gray-900 to-gray-950",
    border: "border-pink-900/50",
    hoverBorder: "hover:border-pink-700/70",
    text: "text-gray-100",
    accent: "text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-pink-500",
    glow: "shadow-pink-500/20",
    glowHover: "hover:shadow-pink-500/40",
    glowLayer: "from-pink-500/20",
    gradient: "from-pink-950/50 via-purple-950/50 to-orange-950/50",
    glassBg: "bg-linear-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80",
  },
  dark: {
    bg: "from-gray-950 via-slate-900 to-gray-900",
    border: "border-blue-900/50",
    hoverBorder: "hover:border-blue-700/70",
    text: "text-gray-100",
    accent: "text-blue-400",
    glow: "shadow-blue-500/20",
    glowHover: "hover:shadow-blue-500/40",
    glowLayer: "from-blue-500/20",
    gradient: "from-blue-950/50 via-slate-900/50 to-gray-950/50",
    glassBg: "bg-gray-900/80",
  },
  light: {
    bg: "from-white to-gray-50",
    border: "border-gray-200",
    hoverBorder: "hover:border-gray-300",
    text: "text-gray-900",
    accent: "text-gray-700",
    glow: "shadow-gray-200/50",
    glowHover: "hover:shadow-gray-300/60",
    glowLayer: "from-gray-200/50",
    gradient: "from-gray-50/50 via-white/50 to-gray-100/50",
    glassBg: "bg-white/80",
  },
};

// 淺色模式主題配置
const lightThemeColors: Record<CardTheme, ThemeColors> = {
  violet: {
    bg: "from-white to-violet-50",
    border: "border-violet-200",
    hoverBorder: "hover:border-violet-300",
    text: "text-gray-900",
    accent: "text-violet-600",
    glow: "shadow-violet-200/50",
    glowHover: "hover:shadow-violet-300/60",
    glowLayer: "from-violet-200/50",
    gradient: "from-violet-50/50 via-white/50 to-purple-50/50",
    glassBg: "bg-white/80",
  },
  cyan: {
    bg: "from-white to-cyan-50",
    border: "border-cyan-200",
    hoverBorder: "hover:border-cyan-300",
    text: "text-gray-900",
    accent: "text-cyan-600",
    glow: "shadow-cyan-200/50",
    glowHover: "hover:shadow-cyan-300/60",
    glowLayer: "from-cyan-200/50",
    gradient: "from-cyan-50/50 via-white/50 to-blue-50/50",
    glassBg: "bg-white/80",
  },
  orange: {
    bg: "from-white to-orange-50",
    border: "border-orange-200",
    hoverBorder: "hover:border-orange-300",
    text: "text-gray-900",
    accent: "text-orange-600",
    glow: "shadow-orange-200/50",
    glowHover: "hover:shadow-orange-300/60",
    glowLayer: "from-orange-200/50",
    gradient: "from-orange-50/50 via-white/50 to-amber-50/50",
    glassBg: "bg-white/80",
  },
  gradient: {
    bg: "from-white via-purple-50 to-pink-50",
    border: "border-pink-200",
    hoverBorder: "hover:border-pink-300",
    text: "text-gray-900",
    accent: "text-transparent bg-clip-text bg-linear-to-r from-pink-500 to-purple-600",
    glow: "shadow-pink-200/50",
    glowHover: "hover:shadow-pink-300/60",
    glowLayer: "from-pink-200/50",
    gradient: "from-pink-50/50 via-purple-50/50 to-orange-50/50",
    glassBg: "bg-linear-to-br from-white/80 via-purple-50/80 to-pink-50/80",
  },
  dark: {
    bg: "from-gray-50 to-gray-100",
    border: "border-gray-300",
    hoverBorder: "hover:border-gray-400",
    text: "text-gray-900",
    accent: "text-gray-700",
    glow: "shadow-gray-300/50",
    glowHover: "hover:shadow-gray-400/60",
    glowLayer: "from-gray-300/50",
    gradient: "from-gray-100/50 via-gray-50/50 to-slate-100/50",
    glassBg: "bg-white/80",
  },
  light: {
    bg: "from-white to-gray-50",
    border: "border-gray-200",
    hoverBorder: "hover:border-gray-300",
    text: "text-gray-900",
    accent: "text-gray-700",
    glow: "shadow-gray-200/50",
    glowHover: "hover:shadow-gray-300/60",
    glowLayer: "from-gray-200/50",
    gradient: "from-gray-50/50 via-white/50 to-gray-100/50",
    glassBg: "bg-white/80",
  },
};

/** 取得主題的強調文字 class（原本的 accent 欄位），方便標題或價格套用 */
export function cardAccentClass(theme: CardTheme = "violet", mode: CardMode = "light") {
  return (mode === "dark" ? darkThemeColors : lightThemeColors)[theme].accent;
}

// 子元件預設跟隨 Card 的 mode，仍可個別覆寫
const CardModeContext = React.createContext<CardMode>("light");

export interface CardProps {
  children?: React.ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  theme?: CardTheme;
  mode?: CardMode;
  loading?: boolean;
  loadingMode?: CardLoadingMode;
  hoverable?: boolean;
  clickable?: boolean;
  bordered?: boolean;
  shadow?: boolean;
  glow?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  /** 可存取名稱（clickable 時建議提供） */
  "aria-label"?: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<CardLabels>;
}

export interface CardLabels {
  loading: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, CardLabels> = {
  en: { loading: "Loading..." },
  "zh-TW": { loading: "載入中..." },
  "zh-CN": { loading: "加载中..." },
  ja: { loading: "読み込み中..." },
};

const SHIMMER_CSS = `@keyframes classic-card-shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`;

function SkeletonBlock({ mode }: { mode: CardMode }) {
  const base = cn("rounded-sm animate-pulse motion-reduce:animate-none", mode === "dark" ? "bg-gray-700/50" : "bg-gray-200");
  return (
    <div className="flex h-full w-full flex-col px-6 py-5">
      <div className="mb-6 flex flex-col gap-3">
        <div className={cn(base, "h-6 w-2/3")} />
        <div className={cn(base, "h-4 w-1/2")} />
      </div>
      <div className="mb-6 flex flex-col gap-3">
        <div className={cn(base, "h-4 w-full")} />
        <div className={cn(base, "h-4 w-11/12")} />
        <div className={cn(base, "h-4 w-4/5")} />
        <div className={cn(base, "h-4 w-full")} />
      </div>
      <div className={cn(base, "h-10 w-1/3")} />
    </div>
  );
}

export function Card({
  children,
  className,
  variant = "outlined",
  size = "md",
  theme = "violet",
  mode = "light",
  loading = false,
  loadingMode = "skeleton",
  hoverable = true,
  clickable = false,
  bordered = true,
  shadow = true,
  glow = false,
  style,
  onClick,
  locale = "en",
  labels,
  "aria-label": ariaLabel,
}: CardProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const reduce = useReducedMotion() ?? false;
  const [isHovering, setIsHovering] = React.useState(false);

  const colors = (mode === "dark" ? darkThemeColors : lightThemeColors)[theme];

  // 基礎樣式
  const baseStyles = cn(
    "relative overflow-hidden transition-all duration-300",
    "focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2",
    mode === "dark" ? "focus-visible:ring-white/60 focus-visible:ring-offset-gray-950" : "focus-visible:ring-gray-900/40",
    colors.text,
    clickable && "cursor-pointer",
  );

  // 變體樣式
  const variantStyles: Record<CardVariant, string> = {
    outlined: cn(
      "bg-linear-to-b backdrop-blur-xs",
      mode === "dark" ? "from-gray-900/95 to-gray-950/95" : "from-white/95 to-gray-50/95",
      bordered && colors.border,
      bordered && colors.hoverBorder,
      shadow && "shadow-md",
      shadow && hoverable && "hover:shadow-xl",
      glow && colors.glow,
      glow && hoverable && colors.glowHover,
    ),
    filled: cn(
      "bg-linear-to-br",
      colors.bg,
      "backdrop-blur-md",
      bordered && "border border-white/10",
      shadow && "shadow-lg",
      shadow && hoverable && "hover:shadow-2xl",
      glow && colors.glow,
      glow && hoverable && colors.glowHover,
    ),
    elevated: cn(
      "bg-linear-to-br backdrop-blur-md",
      mode === "dark" ? "from-gray-900/95 via-gray-800/95 to-gray-900/95" : "from-white/95 via-gray-50/95 to-white/95",
      "border-transparent",
      "shadow-xl",
      hoverable && "hover:shadow-2xl",
      glow && colors.glow,
      glow && hoverable && colors.glowHover,
    ),
    glass: cn(
      "backdrop-blur-xl",
      colors.glassBg,
      "border border-white/20",
      mode === "dark" && "shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
      mode === "light" && "shadow-[0_8px_32px_rgba(0,0,0,0.08)]",
      hoverable && mode === "dark" && "hover:shadow-[0_12px_48px_rgba(0,0,0,0.5)]",
      hoverable && mode === "light" && "hover:shadow-[0_12px_48px_rgba(0,0,0,0.12)]",
    ),
    gradient: cn(
      "bg-linear-to-br",
      colors.gradient,
      "backdrop-blur-lg border border-white/10",
      shadow && "shadow-xl",
      shadow && hoverable && "hover:shadow-2xl",
      glow && colors.glow,
      glow && hoverable && colors.glowHover,
    ),
  };

  // 尺寸樣式
  const sizeStyles: Record<CardSize, string> = {
    sm: "p-4 rounded-lg",
    md: "p-6 rounded-xl",
    lg: "p-8 rounded-2xl",
    xl: "p-10 rounded-3xl",
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!clickable || !onClick || e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <CardModeContext.Provider value={mode}>
      <motion.div
        ref={ref}
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        aria-label={ariaLabel}
        aria-busy={loading || undefined}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], bordered && "border", className)}
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={reduce ? { opacity: 1, y: 0 } : isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: reduce ? 0 : 0.5, ease: "easeOut" }}
        whileHover={hoverable && !reduce ? { scale: clickable ? 1.02 : 1.01, transition: { duration: 0.2, ease: "easeOut" } } : undefined}
        whileTap={clickable && !reduce ? { scale: 0.98, transition: { duration: 0.1, ease: "easeIn" } } : undefined}
        style={style}
        onClick={clickable ? onClick : undefined}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {loading && loadingMode === "shimmer" && <style>{SHIMMER_CSS}</style>}

        {/* 光暈效果 */}
        {glow && isHovering && (
          <motion.div
            aria-hidden
            className={cn("pointer-events-none absolute inset-0 -z-10 bg-radial to-transparent blur-xl", colors.glowLayer)}
            initial={reduce ? { opacity: 0.5 } : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.5, scale: 1 }}
            transition={{ duration: reduce ? 0 : 0.3 }}
          />
        )}

        {/* 內部光澤效果 */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 z-0 bg-linear-to-b",
            mode === "dark" ? "from-white/[0.05] via-transparent to-transparent" : "from-white/60 via-transparent to-transparent",
          )}
        />

        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.2 }}
              className={cn(
                "absolute inset-0 z-30 flex items-center justify-center backdrop-blur-xs",
                mode === "dark" ? "bg-gray-900/80" : "bg-white/80",
              )}
            >
              {loadingMode === "overlay" ? (
                <motion.div
                  className="relative flex flex-col items-center gap-3"
                  initial={reduce ? false : { scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  role="status"
                >
                  <div className="relative h-12 w-12" aria-hidden>
                    <div
                      className={cn(
                        "absolute h-full w-full rounded-full border-[3px]",
                        mode === "dark" ? "border-gray-700" : "border-gray-200",
                      )}
                    />
                    <div
                      className={cn(
                        "absolute h-full w-full animate-[spin_0.8s_cubic-bezier(0.4,0,0.2,1)_infinite] rounded-full border-[3px] motion-reduce:animate-[spin_2.4s_linear_infinite]",
                        mode === "dark" ? "border-gray-300" : "border-gray-600",
                        // 放在顏色之後，否則會被 tailwind-merge 蓋掉
                        "border-t-transparent",
                      )}
                    />
                  </div>
                  <span className={cn("text-sm font-medium", mode === "dark" ? "text-gray-400" : "text-gray-500")}>
                    {t.loading}
                  </span>
                </motion.div>
              ) : (
                <>
                  <span className="sr-only" role="status">
                    {t.loading}
                  </span>
                  {loadingMode === "shimmer" && (
                    <div
                      aria-hidden
                      className={cn(
                        "absolute inset-0 z-20 bg-linear-to-r animate-[classic-card-shimmer_2s_infinite] motion-reduce:animate-none",
                        mode === "dark" ? "from-transparent via-white/5 to-transparent" : "from-transparent via-white/50 to-transparent",
                      )}
                    />
                  )}
                  <div aria-hidden className="h-full w-full">
                    <SkeletonBlock mode={mode} />
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={cn(
            "relative z-10",
            loading && loadingMode !== "overlay" && "invisible",
            loading && loadingMode === "overlay" && "pointer-events-none blur-[1px] opacity-30 select-none",
          )}
          aria-hidden={loading || undefined}
        >
          {children}
        </div>
      </motion.div>
    </CardModeContext.Provider>
  );
}

const dividerBorder = (mode: CardMode, side: "b" | "t") =>
  side === "b"
    ? mode === "dark"
      ? "border-b border-white/10"
      : "border-b border-gray-200/60"
    : mode === "dark"
      ? "border-t border-white/10"
      : "border-t border-gray-200/60";

export interface CardHeaderProps {
  children?: React.ReactNode;
  showDivider?: boolean;
  className?: string;
  mode?: CardMode;
  align?: "left" | "center" | "right";
}

export function CardHeader({ children, showDivider = false, className, mode, align = "left" }: CardHeaderProps) {
  const inherited = React.useContext(CardModeContext);
  const m = mode ?? inherited;
  const alignStyles = {
    left: "items-start text-left",
    center: "items-center text-center",
    right: "items-end text-right",
  };
  return (
    <div
      className={cn(
        "relative z-10 flex flex-col space-y-2",
        showDivider && "mb-4 pb-4",
        showDivider && dividerBorder(m, "b"),
        alignStyles[align],
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface CardContentProps {
  children?: React.ReactNode;
  showDivider?: boolean;
  className?: string;
  mode?: CardMode;
  noPadding?: boolean;
}

export function CardContent({ children, showDivider = false, className, mode, noPadding = false }: CardContentProps) {
  const inherited = React.useContext(CardModeContext);
  const m = mode ?? inherited;
  return (
    <div className={cn("relative z-10", !noPadding && "py-3", showDivider && "mb-4 pb-4", showDivider && dividerBorder(m, "b"), className)}>
      {children}
    </div>
  );
}

export interface CardFooterProps {
  children?: React.ReactNode;
  showDivider?: boolean;
  className?: string;
  mode?: CardMode;
  justify?: "start" | "center" | "end" | "between" | "around";
}

export function CardFooter({ children, showDivider = false, className, mode, justify = "start" }: CardFooterProps) {
  const inherited = React.useContext(CardModeContext);
  const m = mode ?? inherited;
  const justifyStyles = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
  };
  return (
    <div
      className={cn(
        "relative z-10 flex items-center",
        showDivider && "mt-4 pt-4",
        showDivider && dividerBorder(m, "t"),
        justifyStyles[justify],
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface CardImageProps {
  src: string;
  alt: string;
  loading?: "lazy" | "eager";
  fallback?: string;
  className?: string;
  aspectRatio?: "16/9" | "4/3" | "1/1" | "auto";
  objectFit?: "cover" | "contain" | "fill" | "none";
  overlay?: boolean;
  overlayGradient?: "top" | "bottom" | "both" | "none";
}

export function CardImage({
  className,
  src,
  alt,
  loading = "lazy",
  fallback,
  aspectRatio = "16/9",
  objectFit = "cover",
  overlay = false,
  overlayGradient = "bottom",
}: CardImageProps) {
  const reduce = useReducedMotion() ?? false;
  const [imgSrc, setImgSrc] = React.useState(src);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    setImgSrc(src);
  }, [src]);

  // 圖片若在 hydrate 前就載完（快取或 data URI），onLoad 不會再觸發
  React.useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) setImageLoaded(true);
  }, [imgSrc]);

  const aspectRatioStyles = {
    "16/9": "aspect-[16/9]",
    "4/3": "aspect-[4/3]",
    "1/1": "aspect-square",
    auto: "h-auto",
  };
  const objectFitStyles = {
    cover: "object-cover",
    contain: "object-contain",
    fill: "object-fill",
    none: "object-none",
  };
  const overlayGradients = {
    top: "bg-linear-to-b from-black/40 via-transparent to-transparent",
    bottom: "bg-linear-to-t from-black/40 via-transparent to-transparent",
    both: "bg-linear-to-b from-black/30 via-transparent to-black/30",
    none: "",
  };

  return (
    <div className={cn("relative mb-4 w-full overflow-hidden rounded-xl", aspectRatioStyles[aspectRatio])}>
      {/* 載入骨架屏 */}
      {!imageLoaded && (
        <div className="absolute inset-0 animate-pulse bg-linear-to-br from-gray-200 via-gray-100 to-gray-200 motion-reduce:animate-none" />
      )}

      <motion.img
        ref={imgRef}
        src={imgSrc}
        alt={alt}
        loading={loading}
        onError={() => fallback && setImgSrc(fallback)}
        onLoad={() => setImageLoaded(true)}
        className={cn(
          "h-full w-full transition-all duration-700",
          objectFitStyles[objectFit],
          "group-hover:scale-110 group-hover:brightness-110 motion-reduce:group-hover:scale-100",
          className,
        )}
        initial={reduce ? false : { opacity: 0, scale: 1.1 }}
        animate={{ opacity: imageLoaded ? 1 : 0, scale: 1 }}
        transition={{ duration: reduce ? 0 : 0.6, ease: "easeOut" }}
      />

      {/* 覆蓋層漸變 */}
      {overlay && overlayGradient !== "none" && (
        <motion.div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
            overlayGradients[overlayGradient],
          )}
        />
      )}

      {/* 光暈效果 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-t from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />
    </div>
  );
}
