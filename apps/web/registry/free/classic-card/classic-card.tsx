"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import * as React from "react";

import { cn } from "@/lib/utils";

export type CardVariant = "outlined" | "filled" | "elevated" | "glass" | "gradient";
export type CardSize = "sm" | "md" | "lg" | "xl";
export type CardTheme = "violet" | "cyan" | "orange" | "gradient" | "dark" | "light";
export type CardLoadingMode = "overlay" | "skeleton" | "shimmer";
export type CardMode = "light" | "dark";

// 唯一的強調色：預設朱紅，暗色時亮一階；theme 只決定要不要用它
const VERMILION = "text-[#c8361d] dark:text-[#ec6a4f]";

/**
 * 取得主題的強調文字 class，方便標題或價格套用（整張卡只建議用在一處）。
 * 舊版的 violet、cyan、gradient 霓虹配色已停用，彩色主題一律回傳朱紅；light、dark 回傳前景色。
 * mode 參數保留相容：指定 mode 時直接回傳該明暗的朱紅，不依賴網站主題。
 */
export function cardAccentClass(theme: CardTheme = "violet", mode?: CardMode) {
  if (theme === "light" || theme === "dark") return "text-foreground";
  if (mode === "light") return "text-[#c8361d]";
  if (mode === "dark") return "text-[#ec6a4f]";
  return VERMILION;
}

// mode 指定明暗時，在卡片內覆寫 shadcn token；不指定就跟隨網站
const forcedTokens: Record<CardMode, Record<string, string>> = {
  light: {
    "--background": "#fafaf9",
    "--foreground": "#1c1917",
    "--card": "#ffffff",
    "--muted": "#f5f5f4",
    "--muted-foreground": "#78716c",
    "--border": "#e7e5e4",
    "--primary": "#1c1917",
    "--primary-foreground": "#fafaf9",
    colorScheme: "light",
  },
  dark: {
    "--background": "#0c0a09",
    "--foreground": "#f5f5f4",
    "--card": "#151311",
    "--muted": "#292524",
    "--muted-foreground": "#a8a29e",
    "--border": "#292524",
    "--primary": "#f5f5f4",
    "--primary-foreground": "#1c1917",
    colorScheme: "dark",
  },
};

// 子元件預設跟隨 Card 的 mode，仍可個別覆寫
const CardModeContext = React.createContext<CardMode | undefined>(undefined);

export interface CardProps {
  children?: React.ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  /** 舊版配色。現在卡片本身一律中性，theme 只影響 cardAccentClass 回傳的強調色 */
  theme?: CardTheme;
  /** 不給時跟隨網站明暗（shadcn token）；給 light 或 dark 時卡片自帶該配色 */
  mode?: CardMode;
  loading?: boolean;
  loadingMode?: CardLoadingMode;
  hoverable?: boolean;
  clickable?: boolean;
  bordered?: boolean;
  shadow?: boolean;
  /** 已停用：舊版的彩色光暈。保留參數相容，現在只是讓滑過時的邊線再深一點 */
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

function SkeletonBlock() {
  const base = "rounded-sm bg-muted";
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
  mode,
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

  // 基礎樣式
  const baseStyles = cn(
    "relative overflow-hidden text-card-foreground transition-[border-color,background-color] duration-200",
    "focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "text-foreground",
    clickable && "cursor-pointer",
  );

  const hoverBorder = hoverable && bordered && (glow ? "hover:border-foreground/30" : "hover:border-foreground/20");

  // 變體樣式：全部是中性底，差別只在底色深淺、邊線與陰影
  const variantStyles: Record<CardVariant, string> = {
    outlined: cn("bg-card", bordered && "border-border", shadow && "shadow-sm"),
    filled: cn("bg-muted", bordered && "border-border"),
    elevated: cn("bg-card", bordered && "border-border", "shadow-sm"),
    // 只在真的疊在內容上時才有意義；底色維持 90% 不透明
    glass: cn("bg-card/90 backdrop-blur-sm", bordered && "border-border", shadow && "shadow-sm"),
    // 同色相的淡變化，像紙面受光，不跨色相
    gradient: cn("bg-linear-to-b from-card to-muted", bordered && "border-border", shadow && "shadow-sm"),
  };

  // 尺寸樣式
  const sizeStyles: Record<CardSize, string> = {
    sm: "p-4 rounded-xl",
    md: "p-6 rounded-xl",
    lg: "p-8 rounded-xl",
    xl: "p-10 rounded-xl",
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!clickable || !onClick || e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  const ease = [0.23, 1, 0.32, 1] as const;

  return (
    <CardModeContext.Provider value={mode}>
      <motion.div
        ref={ref}
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        aria-label={ariaLabel}
        aria-busy={loading || undefined}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], bordered && "border", hoverBorder, className)}
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={reduce ? { opacity: 1, y: 0 } : isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        transition={{ duration: reduce ? 0 : 0.36, ease }}
        whileTap={clickable && !reduce ? { scale: 0.99, transition: { duration: 0.12 } } : undefined}
        style={{ ...(mode ? forcedTokens[mode] : null), ...style } as React.CSSProperties}
        onClick={clickable ? onClick : undefined}
        onKeyDown={handleKeyDown}
      >
        {loading && loadingMode === "shimmer" && <style>{SHIMMER_CSS}</style>}

        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.18 }}
              className="absolute inset-0 z-30 flex items-center justify-center bg-card/95"
            >
              {loadingMode === "overlay" ? (
                <div className="relative flex flex-col items-center gap-3" role="status">
                  <div className="relative h-8 w-8" aria-hidden>
                    <div className="absolute h-full w-full rounded-full border-2 border-border" />
                    <div
                      className={cn(
                        "absolute h-full w-full animate-[spin_0.8s_cubic-bezier(0.4,0,0.2,1)_infinite] rounded-full border-2 border-foreground/60 motion-reduce:animate-[spin_2.4s_linear_infinite]",
                        // 放在顏色之後，否則會被 tailwind-merge 蓋掉
                        "border-t-transparent",
                      )}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">{t.loading}</span>
                </div>
              ) : (
                <>
                  <span className="sr-only" role="status">
                    {t.loading}
                  </span>
                  {loadingMode === "shimmer" && (
                    <div
                      aria-hidden
                      className="absolute inset-0 z-20 animate-[classic-card-shimmer_2s_infinite] bg-linear-to-r from-transparent via-foreground/[0.04] to-transparent motion-reduce:animate-none"
                    />
                  )}
                  <div aria-hidden className="h-full w-full">
                    <SkeletonBlock />
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
            loading && loadingMode === "overlay" && "pointer-events-none opacity-30 select-none",
          )}
          aria-hidden={loading || undefined}
        >
          {children}
        </div>
      </motion.div>
    </CardModeContext.Provider>
  );
}

// 分隔線一律用 border token；mode 參數保留相容
const dividerBorder = (_mode: CardMode | undefined, side: "b" | "t") => (side === "b" ? "border-b border-border" : "border-t border-border");

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
    <div className={cn("relative mb-4 w-full overflow-hidden rounded-lg border border-border bg-muted", aspectRatioStyles[aspectRatio])}>
      {/* 載入骨架屏 */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-muted" />
      )}

      <motion.img
        ref={imgRef}
        src={imgSrc}
        alt={alt}
        loading={loading}
        onError={() => fallback && setImgSrc(fallback)}
        onLoad={() => setImageLoaded(true)}
        className={cn(
          "h-full w-full transition-transform duration-500",
          objectFitStyles[objectFit],
          "group-hover:scale-[1.03] motion-reduce:group-hover:scale-100",
          className,
        )}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: imageLoaded ? 1 : 0 }}
        transition={{ duration: reduce ? 0 : 0.36, ease: [0.23, 1, 0.32, 1] }}
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
    </div>
  );
}
