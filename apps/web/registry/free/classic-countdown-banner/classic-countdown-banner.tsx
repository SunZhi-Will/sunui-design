"use client";

import { AnimatePresence, motion, useInView, useReducedMotion, type Variants } from "framer-motion";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

export type CountdownLanguage = "zh" | "en";
export type CountdownMode = "light" | "dark";
export type CountdownTheme = "orange" | "violet" | "cyan" | "gradient" | "dark";
export type CountdownLayout = "default" | "spacious" | "modern";
export type CountdownVariant = "card" | "banner" | "floating";

export type CountdownLabels = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  originalPrice: string;
  discountedPrice: string;
};

// 語言包
const translations: Record<CountdownLanguage, CountdownLabels> = {
  zh: {
    days: "天",
    hours: "時",
    minutes: "分",
    seconds: "秒",
    originalPrice: "原價",
    discountedPrice: "優惠價",
  },
  en: {
    days: "Days",
    hours: "Hrs",
    minutes: "Min",
    seconds: "Sec",
    originalPrice: "Original Price",
    discountedPrice: "Sale Price",
  },
};

export interface ClassicCountdownBannerProps {
  title?: string;
  subtitle?: string;
  discount?: string;
  originalPrice?: string;
  discountedPrice?: string;
  /** 結束時間；未給則為掛載後一週 */
  endDate?: Date | string;
  ctaText?: string;
  onCtaClick?: () => void;
  theme?: CountdownTheme;
  className?: string;
  style?: CSSProperties;
  showParticles?: boolean;
  layout?: CountdownLayout;
  variant?: CountdownVariant;
  language?: CountdownLanguage;
  mode?: CountdownMode;
  /** 覆寫單位與價格標籤 */
  labels?: Partial<CountdownLabels>;
  /** floating 變體：true 固定在視窗底部，false 在容器內 sticky（預設） */
  fixed?: boolean;
  /** CTA 光暈的 RGB，預設為原本的橘色 */
  ctaGlowRgb?: string;
}

type TimeUnit = { days: number; hours: number; minutes: number; seconds: number };

type Particle = {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
  opacity: number;
};

type ThemeTokens = {
  banner: string;
  title: string;
  discount: string;
  timeBox: string;
  timeBoxShadow: string;
  timeSeparator: string;
  cta: string;
  ctaShadow: string;
  glow: string;
  border: string;
  icon: string;
  text: string;
  subtitleText: string;
  originalPriceText: string;
  discountedPriceText: string;
};

const darkThemeClasses: Record<CountdownTheme, ThemeTokens> = {
  orange: {
    banner: "bg-gradient-to-b from-gray-950 to-gray-900",
    title: "text-orange-400",
    discount: "text-orange-400",
    timeBox: "bg-gray-800 text-white",
    timeBoxShadow: "shadow-lg shadow-orange-500/20",
    timeSeparator: "text-gray-400",
    cta: "bg-orange-500 hover:bg-orange-600 text-white",
    ctaShadow: "shadow-lg shadow-orange-500/30",
    glow: "from-orange-500/10 via-orange-400/5 to-transparent",
    border: "border-orange-900/50",
    icon: "text-orange-400",
    text: "text-gray-300",
    subtitleText: "text-gray-300",
    originalPriceText: "text-gray-400",
    discountedPriceText: "text-gray-100",
  },
  violet: {
    banner: "bg-gradient-to-b from-gray-950 to-gray-900",
    title: "text-violet-400",
    discount: "text-violet-400",
    timeBox: "bg-gray-800 text-white",
    timeBoxShadow: "shadow-lg shadow-violet-500/20",
    timeSeparator: "text-gray-400",
    cta: "bg-violet-500 hover:bg-violet-600 text-white",
    ctaShadow: "shadow-lg shadow-violet-500/30",
    glow: "from-violet-500/10 via-violet-400/5 to-transparent",
    border: "border-violet-900/50",
    icon: "text-violet-400",
    text: "text-gray-300",
    subtitleText: "text-gray-300",
    originalPriceText: "text-gray-400",
    discountedPriceText: "text-gray-100",
  },
  cyan: {
    banner: "bg-gradient-to-b from-gray-950 to-gray-900",
    title: "text-cyan-400",
    discount: "text-cyan-400",
    timeBox: "bg-gray-800 text-white",
    timeBoxShadow: "shadow-lg shadow-cyan-500/20",
    timeSeparator: "text-gray-400",
    cta: "bg-cyan-500 hover:bg-cyan-600 text-white",
    ctaShadow: "shadow-lg shadow-cyan-500/30",
    glow: "from-cyan-500/10 via-cyan-400/5 to-transparent",
    border: "border-cyan-900/50",
    icon: "text-cyan-400",
    text: "text-gray-300",
    subtitleText: "text-gray-300",
    originalPriceText: "text-gray-400",
    discountedPriceText: "text-gray-100",
  },
  gradient: {
    banner: "bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950",
    title: "text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500",
    discount: "text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600",
    timeBox: "bg-gray-800/80 backdrop-blur-sm text-white",
    timeBoxShadow: "shadow-lg shadow-pink-500/20",
    timeSeparator: "text-gray-400",
    cta: "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 hover:opacity-90 text-white",
    ctaShadow: "shadow-lg shadow-pink-500/30",
    glow: "from-pink-500/10 via-purple-400/5 to-transparent",
    border: "border-pink-900/50",
    icon: "text-pink-400",
    text: "text-gray-300",
    subtitleText: "text-gray-300",
    originalPriceText: "text-gray-400",
    discountedPriceText: "text-gray-100",
  },
  dark: {
    banner: "bg-gradient-to-br from-gray-950 via-slate-900 to-gray-900",
    title: "text-blue-400",
    discount: "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400",
    timeBox: "bg-gray-800/80 backdrop-blur-sm text-white",
    timeBoxShadow: "shadow-lg shadow-blue-500/20",
    timeSeparator: "text-gray-400",
    cta: "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white",
    ctaShadow: "shadow-lg shadow-blue-500/30",
    glow: "from-blue-500/10 via-blue-400/5 to-transparent",
    border: "border-blue-900/50",
    icon: "text-blue-400",
    text: "text-gray-300",
    subtitleText: "text-gray-300",
    originalPriceText: "text-gray-400",
    discountedPriceText: "text-gray-100",
  },
};

const lightThemeClasses: Record<CountdownTheme, ThemeTokens> = {
  orange: {
    banner: "bg-gradient-to-b from-white to-orange-50",
    title: "text-orange-600",
    discount: "text-orange-600",
    timeBox: "bg-white text-gray-800 border border-orange-200",
    timeBoxShadow: "shadow-lg shadow-orange-200/30",
    timeSeparator: "text-orange-300",
    cta: "bg-orange-500 hover:bg-orange-600 text-white",
    ctaShadow: "shadow-lg shadow-orange-300/30",
    glow: "from-orange-300/10 via-orange-200/5 to-transparent",
    border: "border-orange-200",
    icon: "text-orange-500",
    text: "text-gray-700",
    subtitleText: "text-gray-600",
    originalPriceText: "text-gray-500",
    discountedPriceText: "text-gray-800",
  },
  violet: {
    banner: "bg-gradient-to-b from-white to-violet-50",
    title: "text-violet-600",
    discount: "text-violet-600",
    timeBox: "bg-white text-gray-800 border border-violet-200",
    timeBoxShadow: "shadow-lg shadow-violet-200/30",
    timeSeparator: "text-violet-300",
    cta: "bg-violet-500 hover:bg-violet-600 text-white",
    ctaShadow: "shadow-lg shadow-violet-300/30",
    glow: "from-violet-300/10 via-violet-200/5 to-transparent",
    border: "border-violet-200",
    icon: "text-violet-500",
    text: "text-gray-700",
    subtitleText: "text-gray-600",
    originalPriceText: "text-gray-500",
    discountedPriceText: "text-gray-800",
  },
  cyan: {
    banner: "bg-gradient-to-b from-white to-cyan-50",
    title: "text-cyan-600",
    discount: "text-cyan-600",
    timeBox: "bg-white text-gray-800 border border-cyan-200",
    timeBoxShadow: "shadow-lg shadow-cyan-200/30",
    timeSeparator: "text-cyan-300",
    cta: "bg-cyan-500 hover:bg-cyan-600 text-white",
    ctaShadow: "shadow-lg shadow-cyan-300/30",
    glow: "from-cyan-300/10 via-cyan-200/5 to-transparent",
    border: "border-cyan-200",
    icon: "text-cyan-500",
    text: "text-gray-700",
    subtitleText: "text-gray-600",
    originalPriceText: "text-gray-500",
    discountedPriceText: "text-gray-800",
  },
  gradient: {
    banner: "bg-gradient-to-br from-white via-purple-50 to-pink-50",
    title: "text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600",
    discount: "text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600",
    timeBox: "bg-white/90 backdrop-blur-sm text-gray-800 border border-pink-100",
    timeBoxShadow: "shadow-lg shadow-pink-200/30",
    timeSeparator: "text-pink-300",
    cta: "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 hover:opacity-90 text-white",
    ctaShadow: "shadow-lg shadow-pink-300/30",
    glow: "from-pink-300/10 via-purple-200/5 to-transparent",
    border: "border-pink-200",
    icon: "text-pink-500",
    text: "text-gray-700",
    subtitleText: "text-gray-600",
    originalPriceText: "text-gray-500",
    discountedPriceText: "text-gray-800",
  },
  dark: {
    banner: "bg-gradient-to-br from-white via-blue-50 to-slate-50",
    title: "text-blue-600",
    discount: "text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500",
    timeBox: "bg-white/90 backdrop-blur-sm text-gray-800 border border-blue-100",
    timeBoxShadow: "shadow-lg shadow-blue-200/30",
    timeSeparator: "text-blue-300",
    cta: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white",
    ctaShadow: "shadow-lg shadow-blue-300/30",
    glow: "from-blue-300/10 via-blue-200/5 to-transparent",
    border: "border-blue-200",
    icon: "text-blue-500",
    text: "text-gray-700",
    subtitleText: "text-gray-600",
    originalPriceText: "text-gray-500",
    discountedPriceText: "text-gray-800",
  },
};

const particleColors: Record<CountdownTheme, string[]> = {
  orange: ["#FF8A00", "#FF5E00", "#FFB800", "#FFD700"],
  violet: ["#8B5CF6", "#7C3AED", "#A78BFA", "#C4B5FD"],
  cyan: ["#06B6D4", "#0891B2", "#22D3EE", "#67E8F9"],
  dark: ["#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE"],
  gradient: ["#FF8A00", "#8B5CF6", "#06B6D4", "#FFD700"],
};

const padWithZero = (num: number) => num.toString().padStart(2, "0");

const ZERO: TimeUnit = { days: 0, hours: 0, minutes: 0, seconds: 0 };

export function ClassicCountdownBanner({
  title = "限時優惠活動",
  subtitle = "倒數結束，錯過不再",
  discount = "40% OFF",
  originalPrice = "42,000 NTD",
  discountedPrice = "25,200 NTD",
  endDate,
  ctaText = "立即查看優惠",
  onCtaClick,
  theme = "gradient",
  className,
  style,
  showParticles = true,
  layout = "modern",
  variant = "card",
  language = "zh",
  mode = "dark",
  labels,
  fixed = false,
  ctaGlowRgb = "255, 115, 0",
}: ClassicCountdownBannerProps) {
  const reduce = useReducedMotion() ?? false;
  const [timeLeft, setTimeLeft] = useState<TimeUnit>(ZERO);
  const [isHovering, setIsHovering] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [glowPulse, setGlowPulse] = useState(false);
  // 預設結束時間只在掛載時算一次（原版預設一週後）
  const [fallbackEnd] = useState(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  const t = { ...translations[language], ...labels };
  const end = endDate ?? fallbackEnd;
  const endMs = new Date(end).getTime();

  // 每秒更新倒數計時
  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endMs - Date.now();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft(ZERO);
      }
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [endMs]);

  // 光暈脈動效果（每 2 秒切換）
  useEffect(() => {
    if (reduce) return;
    const pulseTimer = setInterval(() => setGlowPulse((prev) => !prev), 2000);
    return () => clearInterval(pulseTimer);
  }, [reduce]);

  // 粒子效果：20 顆，每 50ms 往上飄
  useEffect(() => {
    if (!showParticles) return;
    const colors = particleColors[theme];
    const next: Particle[] = [];
    for (let i = 0; i < 20; i++) {
      next.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 6 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 0.5 + 0.2,
        opacity: Math.random() * 0.6 + 0.2,
      });
    }
    setParticles(next);
    // 減少動態時粒子靜止不動
    if (reduce) return;

    const particleInterval = setInterval(() => {
      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          y: p.y - p.speed,
          x: p.x + (Math.random() * 0.6 - 0.3),
          opacity: p.y < 15 ? p.opacity - 0.02 : p.opacity,
          // 到頂部或變透明時重設
          ...(p.y < 0 || p.opacity <= 0
            ? { y: 100 + Math.random() * 20, opacity: Math.random() * 0.6 + 0.2, x: Math.random() * 100 }
            : {}),
        })),
      );
    }, 50);
    return () => clearInterval(particleInterval);
  }, [showParticles, theme, reduce]);

  const selectedTheme = (mode === "dark" ? darkThemeClasses : lightThemeClasses)[theme];
  const isModern = layout === "modern";
  const isSpacious = layout === "spacious" || isModern;

  // 倒數格子樣式
  const modernBaseClasses =
    mode === "dark"
      ? isModern
        ? "backdrop-blur-xl bg-gradient-to-b from-white/[0.12] to-white/[0.05] rounded-[1.2rem] border border-white/15 shadow-[0_10px_25px_-12px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.1)]"
        : "backdrop-blur-lg bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-[0_8px_16px_rgba(0,0,0,0.4)]"
      : isModern
        ? "backdrop-blur-xl bg-gradient-to-b from-white/95 to-gray-50/95 rounded-[1.2rem] border border-gray-200 shadow-[0_10px_25px_-15px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.8)]"
        : "backdrop-blur-lg bg-gradient-to-b from-white to-gray-50 rounded-2xl border border-gray-200 shadow-[0_8px_20px_rgba(0,0,0,0.08)]";

  const timeBoxClass = cn(
    isModern ? modernBaseClasses : "",
    isSpacious ? "w-[4.5rem] h-[4.5rem] md:w-[6rem] md:h-[6rem]" : "w-[4rem] h-[4rem] sm:w-[4.5rem] sm:h-[4.5rem]",
    !isModern ? "rounded-xl" : "",
    "flex items-center justify-center relative overflow-hidden",
    !isModern ? selectedTheme.timeBox : "",
    selectedTheme.timeBoxShadow,
  );

  // 容器尺寸
  const containerClass = isModern
    ? variant === "banner"
      ? "w-full p-8 sm:p-10 rounded-xl"
      : "w-full max-w-4xl p-10 sm:p-12 rounded-3xl"
    : layout === "spacious"
      ? "w-full max-w-4xl p-8 sm:p-10 rounded-xl"
      : "w-full max-w-3xl p-6 rounded-xl";

  // 數字樣式
  const timeDigitClass = isModern
    ? mode === "dark"
      ? "text-3xl md:text-4xl font-bold bg-gradient-to-br from-white via-gray-100 to-gray-300 text-transparent bg-clip-text drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]"
      : "text-3xl md:text-4xl font-bold text-gray-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]"
    : layout === "spacious"
      ? cn("text-3xl md:text-4xl font-bold drop-shadow-sm", mode === "dark" ? "text-white" : "text-gray-900")
      : cn("text-2xl sm:text-3xl font-bold drop-shadow-sm", mode === "dark" ? "text-white" : "text-gray-900");

  // 格子內部高光
  const innerEffectClass =
    mode === "dark"
      ? isModern
        ? "bg-gradient-to-b from-white/[0.08] via-transparent to-transparent"
        : "bg-gradient-to-b from-white/[0.15] via-white/[0.05] to-transparent"
      : isModern
        ? "bg-gradient-to-b from-white/80 via-white/40 to-transparent"
        : "bg-gradient-to-b from-white/90 via-white/60 to-transparent";

  // 單位之間的分隔點
  const spacerClass = isModern
    ? cn("text-4xl font-light mx-1 sm:mx-2", mode === "dark" ? "text-gray-400/70" : "text-gray-400")
    : layout === "spacious"
      ? "text-4xl font-light mx-1 sm:mx-3 text-gray-400"
      : "text-3xl font-bold text-gray-400";

  // modern 佈局的背景
  const modernBackgroundClass = !isModern
    ? ""
    : mode === "dark"
      ? "bg-gradient-to-br from-black to-gray-900 border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
      : "bg-gradient-to-br from-white via-gray-50 to-gray-100 border border-gray-200/60 shadow-[0_10px_40px_rgba(0,0,0,0.08)]";

  // 單位標籤，英文較長時縮小
  const unitLabelClass = cn(
    mode === "dark" ? "text-gray-400 text-sm mt-2" : "text-gray-500 text-sm mt-2",
    language === "en" && "text-[11px] sm:text-xs whitespace-nowrap",
  );

  const containerAnimation: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1 } },
  };
  const childAnimation: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };
  const timeContainerAnimation: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
  };
  const timeItemAnimation: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 400, damping: 20 } },
    hover: {
      scale: 1.05,
      boxShadow: mode === "dark" ? "0 8px 32px rgba(0, 0, 0, 0.3)" : "0 8px 32px rgba(0, 0, 0, 0.1)",
      transition: { type: "spring", stiffness: 300, damping: 15 },
    },
  };

  const units: { key: keyof TimeUnit; label: string }[] = [
    { key: "days", label: t.days },
    { key: "hours", label: t.hours },
    { key: "minutes", label: t.minutes },
    { key: "seconds", label: t.seconds },
  ];

  // 給輔助技術的摘要（只到分鐘，避免每秒朗讀）
  const timerLabel = `${timeLeft.days} ${t.days} ${timeLeft.hours} ${t.hours} ${timeLeft.minutes} ${t.minutes}`;
  const glow = (a: number) => `0 4px ${a === 0.5 ? 20 : 12}px rgba(${ctaGlowRgb}, ${a})`;

  return (
    <motion.div
      ref={ref}
      className={cn(
        containerClass,
        modernBackgroundClass,
        "border relative overflow-hidden backdrop-blur-md",
        selectedTheme.banner,
        selectedTheme.border,
        variant === "floating" && (fixed ? "fixed inset-x-4 bottom-4 z-50 mx-auto w-auto" : "sticky bottom-4 mx-auto"),
        className,
      )}
      style={style}
      variants={containerAnimation}
      initial={reduce ? false : "hidden"}
      animate={reduce || isInView ? "visible" : "hidden"}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* 背景光暈效果 */}
      <div
        aria-hidden
        className={cn(
          "absolute top-0 left-0 w-full h-full",
          "bg-radial opacity-30",
          selectedTheme.glow,
          glowPulse ? "scale-110" : "scale-100",
          "transition-all duration-2000 ease-in-out",
        )}
      />

      {/* 粒子效果 */}
      {showParticles && (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                opacity: p.opacity,
              }}
            />
          ))}
        </div>
      )}

      {/* 主要內容 */}
      <div className="flex flex-col items-center justify-center relative z-10 text-center">
        <motion.div variants={childAnimation} className="flex items-center justify-center mb-5">
          <motion.div whileHover={reduce ? undefined : { rotate: 360 }} transition={{ duration: 0.5 }} className="mr-2 shrink-0">
            <svg aria-hidden className={cn("h-6 w-6", selectedTheme.icon)} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v2h-2v-2zm0-10h2v8h-2V6z" />
            </svg>
          </motion.div>
          <h2 className={cn("text-xl md:text-2xl font-bold", selectedTheme.title)}>
            {isModern ? <span className="tracking-wide">{title}</span> : title}
          </h2>
        </motion.div>

        <motion.div variants={childAnimation} className="flex items-center justify-center mb-6">
          <svg
            aria-hidden
            className={cn("h-5 w-5 mr-2 shrink-0", selectedTheme.icon, "opacity-70", isHovering && !reduce ? "animate-pulse" : "")}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5v-5z" />
          </svg>
          <p className={cn("text-sm md:text-base", selectedTheme.subtitleText)}>{subtitle}</p>
        </motion.div>

        <motion.div
          variants={childAnimation}
          whileHover={reduce ? undefined : { scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="mb-6"
        >
          <p className={cn("text-5xl md:text-6xl font-bold", selectedTheme.discount, isModern && "tracking-wide")}>{discount}</p>
        </motion.div>

        <motion.div variants={childAnimation} className="flex flex-col items-center mb-8">
          <p className={cn("line-through mb-2", selectedTheme.originalPriceText)}>
            {t.originalPrice} {originalPrice}
          </p>
          <motion.p
            className={cn("text-2xl md:text-3xl font-bold", selectedTheme.discountedPriceText, isModern && "tracking-wide")}
            animate={{ scale: glowPulse ? 1.05 : 1 }}
            transition={{ duration: 1.5 }}
          >
            {t.discountedPrice} {discountedPrice}
          </motion.p>
        </motion.div>

        <motion.div variants={timeContainerAnimation} className="flex items-center justify-center mb-10 relative">
          <div role="timer" aria-label={timerLabel} className="flex items-center flex-wrap justify-center gap-3 sm:gap-4 md:gap-6">
            {units.map((u, i) => (
              <TimeCell
                key={u.key}
                value={timeLeft[u.key]}
                unitKey={u.key}
                label={u.label}
                showSpacer={i < units.length - 1}
                reduce={reduce}
                mode={mode}
                boxClass={timeBoxClass}
                digitClass={timeDigitClass}
                innerEffectClass={innerEffectClass}
                labelClass={unitLabelClass}
                spacerClass={spacerClass}
                itemVariants={timeItemAnimation}
              />
            ))}
          </div>
        </motion.div>

        <motion.div variants={childAnimation} className={cn("flex justify-center", isModern && "relative")}>
          {isModern && (
            <motion.div
              aria-hidden
              className={cn(
                "absolute -inset-3 rounded-full blur-xl opacity-70",
                mode === "dark"
                  ? "bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20"
                  : "bg-gradient-to-r from-purple-300/30 via-pink-300/30 to-orange-300/30",
              )}
              animate={reduce ? undefined : { opacity: [0.5, 0.7, 0.5], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 4, repeat: Infinity, repeatType: "mirror" }}
            />
          )}
          <motion.button
            type="button"
            className={cn(
              "py-4 px-10 sm:px-12 rounded-full text-lg font-bold transition-all w-auto",
              "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current",
              selectedTheme.cta,
              selectedTheme.ctaShadow,
              isModern && "relative z-10 tracking-wide",
            )}
            onClick={onCtaClick}
            whileHover={reduce ? undefined : { scale: 1.05, boxShadow: `0 0 20px rgba(${ctaGlowRgb}, 0.5)` }}
            whileTap={reduce ? undefined : { scale: 0.95 }}
            animate={{
              boxShadow: glowPulse ? [glow(0.25), glow(0.5), glow(0.25)] : glow(0.25),
            }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          >
            <motion.span
              className="inline-block"
              animate={reduce ? undefined : { scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {ctaText}
            </motion.span>
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}

function TimeCell({
  value,
  unitKey,
  label,
  showSpacer,
  reduce,
  mode,
  boxClass,
  digitClass,
  innerEffectClass,
  labelClass,
  spacerClass,
  itemVariants,
}: {
  value: number;
  unitKey: string;
  label: string;
  showSpacer: boolean;
  reduce: boolean;
  mode: CountdownMode;
  boxClass: string;
  digitClass: string;
  innerEffectClass: string;
  labelClass: string;
  spacerClass: string;
  itemVariants: Variants;
}) {
  return (
    <>
      <motion.div variants={itemVariants} className="flex flex-col items-center" aria-hidden>
        <motion.div className={boxClass} whileHover={reduce ? undefined : "hover"} variants={itemVariants}>
          {/* 數字翻動：舊值往下淡出，新值從上方落下 */}
          <AnimatePresence mode="popLayout">
            <motion.span
              key={`${unitKey}-${value}`}
              className={digitClass}
              initial={reduce ? false : { y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { y: 20, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {padWithZero(value)}
            </motion.span>
          </AnimatePresence>
          <motion.div
            className={cn("absolute inset-0 pointer-events-none", innerEffectClass)}
            style={reduce ? { opacity: 0.15 } : undefined}
            animate={reduce ? undefined : { opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          {/* 底部陰影效果 */}
          <motion.div
            className={cn(
              "absolute inset-x-0 bottom-0 h-1/3 pointer-events-none bg-gradient-to-t",
              mode === "dark" ? "from-black/20 to-transparent" : "from-black/[0.03] to-transparent",
            )}
            style={reduce ? { opacity: 0.65 } : undefined}
            animate={reduce ? undefined : { opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
        <span className={labelClass}>{label}</span>
      </motion.div>
      {showSpacer && (
        <span aria-hidden className={spacerClass}>
          ·
        </span>
      )}
    </>
  );
}
