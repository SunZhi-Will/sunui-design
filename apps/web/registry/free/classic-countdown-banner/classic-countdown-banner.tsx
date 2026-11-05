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
  /** 未傳 title / subtitle / ctaText 時的預設文案 */
  title: string;
  subtitle: string;
  cta: string;
};

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

// 語言包
const MESSAGES: Record<SunLocale, CountdownLabels> = {
  en: {
    days: "Days",
    hours: "Hrs",
    minutes: "Min",
    seconds: "Sec",
    originalPrice: "Original Price",
    discountedPrice: "Sale Price",
    title: "Limited-Time Offer",
    subtitle: "Once the countdown ends, it's gone",
    cta: "View the Offer",
  },
  "zh-TW": {
    days: "天",
    hours: "時",
    minutes: "分",
    seconds: "秒",
    originalPrice: "原價",
    discountedPrice: "優惠價",
    title: "限時優惠活動",
    subtitle: "倒數結束，錯過不再",
    cta: "立即查看優惠",
  },
  "zh-CN": {
    days: "天",
    hours: "时",
    minutes: "分",
    seconds: "秒",
    originalPrice: "原价",
    discountedPrice: "优惠价",
    title: "限时优惠活动",
    subtitle: "倒计时结束，错过不再",
    cta: "立即查看优惠",
  },
  ja: {
    days: "日",
    hours: "時間",
    minutes: "分",
    seconds: "秒",
    originalPrice: "通常価格",
    discountedPrice: "セール価格",
    title: "期間限定セール",
    subtitle: "カウントダウン終了でセールも終了",
    cta: "セール内容を見る",
  },
};

export interface ClassicCountdownBannerProps {
  title?: string;
  subtitle?: string;
  discount?: string;
  originalPrice?: string;
  discountedPrice?: string;
  /** 真實的結束時間（必填）。不提供預設值，避免每次載入都重新倒數的假稀缺 */
  endDate: Date | string;
  ctaText?: string;
  onCtaClick?: () => void;
  /** 已停用：舊版的五種配色。現在一律用中性底加單一強調色，改用 accent 換色 */
  theme?: CountdownTheme;
  className?: string;
  style?: CSSProperties;
  /** 已停用：舊版的漂浮粒子。為了保持安靜的畫面不再繪製，保留參數避免既有程式出錯 */
  showParticles?: boolean;
  layout?: CountdownLayout;
  variant?: CountdownVariant;
  /** 舊版語言參數："zh" 對應 zh-TW；有 locale 時以 locale 為準 */
  language?: CountdownLanguage;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 不給時跟隨網站明暗（shadcn token）；給 light 或 dark 時元件自帶該配色 */
  mode?: CountdownMode;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<CountdownLabels>;
  /** floating 變體：true 固定在視窗底部，false 在容器內 sticky（預設） */
  fixed?: boolean;
  /** 已停用：舊版 CTA 光暈。CTA 改用 primary 實色按鈕，不再發光 */
  ctaGlowRgb?: string;
  /** 唯一的強調色，只用在折扣字樣；預設朱紅 #c8361d（暗色 #ec6a4f） */
  accent?: string;
}

type TimeUnit = { days: number; hours: number; minutes: number; seconds: number };

// mode 指定明暗時，在元件內覆寫 shadcn token，內部樣式就不必分兩套
const forcedTokens: Record<CountdownMode, Record<string, string>> = {
  light: {
    "--background": "#fafaf9",
    "--foreground": "#1c1917",
    "--card": "#ffffff",
    "--muted": "#f5f5f4",
    "--muted-foreground": "#78716c",
    "--border": "#e7e5e4",
    "--primary": "#1c1917",
    "--primary-foreground": "#fafaf9",
    "--cd-accent": "#c8361d",
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
    "--cd-accent": "#ec6a4f",
    colorScheme: "dark",
  },
};

const padWithZero = (num: number) => num.toString().padStart(2, "0");

const ZERO: TimeUnit = { days: 0, hours: 0, minutes: 0, seconds: 0 };

const ease = [0.23, 1, 0.32, 1] as const;

export function ClassicCountdownBanner({
  title,
  subtitle,
  discount = "40% OFF",
  originalPrice = "42,000 NTD",
  discountedPrice = "25,200 NTD",
  endDate,
  ctaText,
  onCtaClick,
  className,
  style,
  layout = "modern",
  variant = "card",
  language,
  locale,
  mode,
  labels,
  fixed = false,
  accent,
}: ClassicCountdownBannerProps) {
  const reduce = useReducedMotion() ?? false;
  const [timeLeft, setTimeLeft] = useState<TimeUnit>(ZERO);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  const lang = resolveLocale(locale ?? (language === "zh" ? "zh-TW" : language));
  const t = { ...MESSAGES[lang], ...labels };
  const endMs = new Date(endDate).getTime();

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

  const isModern = layout === "modern";
  const isSpacious = layout === "spacious" || isModern;

  // 容器尺寸
  const containerClass = isModern
    ? variant === "banner"
      ? "w-full p-6 sm:p-10"
      : "w-full max-w-4xl p-6 sm:p-12"
    : layout === "spacious"
      ? "w-full max-w-4xl p-6 sm:p-10"
      : "w-full max-w-3xl p-6";

  // 倒數格子：中性底、1px 邊線，數字等寬
  const timeBoxClass = cn(
    "flex items-center justify-center rounded-md border border-border bg-muted/60",
    isSpacious ? "h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20" : "h-14 w-14 sm:h-16 sm:w-16",
  );
  const timeDigitClass = cn(
    "font-semibold tabular-nums text-foreground",
    isSpacious ? "text-2xl md:text-3xl" : "text-xl sm:text-2xl",
  );
  const spacerClass = cn("pb-6 font-light text-muted-foreground/60", isSpacious ? "text-2xl" : "text-xl");
  // 單位標籤，英文較長時縮小
  const unitLabelClass = cn("mt-2 text-xs text-muted-foreground", lang === "en" && "text-[11px] whitespace-nowrap");

  const containerAnimation: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.36, ease, staggerChildren: 0.06 } },
  };
  const childAnimation: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.24, ease } },
  };

  const units: { key: keyof TimeUnit; label: string }[] = [
    { key: "days", label: t.days },
    { key: "hours", label: t.hours },
    { key: "minutes", label: t.minutes },
    { key: "seconds", label: t.seconds },
  ];

  // 給輔助技術的摘要（只到分鐘，避免每秒朗讀）
  const timerLabel = `${timeLeft.days} ${t.days} ${timeLeft.hours} ${t.hours} ${timeLeft.minutes} ${t.minutes}`;

  const rootStyle = {
    ...(mode ? forcedTokens[mode] : null),
    ...(accent ? { "--cd-accent": accent } : null),
    ...style,
  } as CSSProperties;

  return (
    <motion.div
      ref={ref}
      className={cn(
        containerClass,
        "relative overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-sm",
        "[--cd-accent:#c8361d] dark:[--cd-accent:#ec6a4f]",
        variant === "floating" && (fixed ? "fixed inset-x-4 bottom-4 z-50 mx-auto w-auto" : "sticky bottom-4 mx-auto"),
        className,
      )}
      style={rootStyle}
      variants={containerAnimation}
      initial={reduce ? false : "hidden"}
      animate={reduce || isInView ? "visible" : "hidden"}
    >
      <div className="relative flex flex-col items-center justify-center text-center">
        <motion.div variants={childAnimation} className="mb-2 flex items-center justify-center gap-2">
          <svg aria-hidden className="h-5 w-5 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="13" r="8" />
            <path d="M12 9v4l2.5 2.5M9 2h6" />
          </svg>
          <h2 className="text-lg font-semibold tracking-tight md:text-xl">{title ?? t.title}</h2>
        </motion.div>

        <motion.div variants={childAnimation} className="mb-6 flex items-center justify-center">
          <p className="text-sm text-muted-foreground md:text-base">{subtitle ?? t.subtitle}</p>
        </motion.div>

        <motion.div variants={childAnimation} className="mb-3">
          {/* 唯一的強調色 */}
          <p className="text-4xl font-semibold tracking-tight tabular-nums text-[var(--cd-accent)] md:text-5xl">{discount}</p>
        </motion.div>

        <motion.div variants={childAnimation} className="mb-8 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 tabular-nums">
          <p className="text-sm text-muted-foreground line-through">
            {t.originalPrice} {originalPrice}
          </p>
          <p className="text-lg font-semibold md:text-xl">
            {t.discountedPrice} {discountedPrice}
          </p>
        </motion.div>

        <motion.div variants={childAnimation} className="relative mb-8 flex items-center justify-center">
          <div role="timer" aria-label={timerLabel} className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-3">
            {units.map((u, i) => (
              <TimeCell
                key={u.key}
                value={timeLeft[u.key]}
                unitKey={u.key}
                label={u.label}
                showSpacer={i < units.length - 1}
                reduce={reduce}
                boxClass={timeBoxClass}
                digitClass={timeDigitClass}
                labelClass={unitLabelClass}
                spacerClass={spacerClass}
              />
            ))}
          </div>
        </motion.div>

        <motion.div variants={childAnimation} className="flex justify-center">
          <button
            type="button"
            className={cn(
              "rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            )}
            onClick={onCtaClick}
          >
            {ctaText ?? t.cta}
          </button>
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
  boxClass,
  digitClass,
  labelClass,
  spacerClass,
}: {
  value: number;
  unitKey: string;
  label: string;
  showSpacer: boolean;
  reduce: boolean;
  boxClass: string;
  digitClass: string;
  labelClass: string;
  spacerClass: string;
}) {
  return (
    <>
      <div className="flex flex-col items-center" aria-hidden>
        <div className={cn(boxClass, "relative overflow-hidden")}>
          {/* 數字翻動：舊值往下淡出，新值從上方落下 */}
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={`${unitKey}-${value}`}
              className={digitClass}
              initial={reduce ? false : { y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { y: 12, opacity: 0 }}
              transition={{ duration: 0.3, ease }}
            >
              {padWithZero(value)}
            </motion.span>
          </AnimatePresence>
        </div>
        <span className={labelClass}>{label}</span>
      </div>
      {showSpacer && (
        <span aria-hidden className={spacerClass}>
          :
        </span>
      )}
    </>
  );
}
