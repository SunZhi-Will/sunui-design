"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type CheckoutResult = "success" | "pending" | "failed" | "error";

export interface PaymentStatusBannerLabels {
  success?: ReactNode;
  pending?: ReactNode;
  failed?: ReactNode;
  error?: ReactNode;
  successLink?: ReactNode;
  close?: string;
}

export interface PaymentStatusBannerProps {
  /** Result carried back from the payment page (originally from the ?checkout= URL); nothing is shown when absent */
  status: CheckoutResult | string | null;
  /** Whether access is currently unlocked. While pending, once it becomes true the banner switches to success */
  unlocked: boolean;
  /** Called on each poll while pending; re-fetches data and updates unlocked (originally router.refresh) */
  onRefresh?: () => void;
  /** Called once when pending turns into success, for example to re-fetch the purchased list */
  onUnlocked?: () => void;
  /** If pending on mount, sync the payment result immediately instead of waiting for the first poll interval */
  syncOnMount?: boolean;
  /** Poll interval in milliseconds, default 3000 */
  interval?: number;
  /** Maximum number of polls, default 8 (24 seconds in total) */
  maxAttempts?: number;
  /** Milliseconds before failed and error dismiss themselves, default 8000 */
  dismissAfter?: number;
  /** Link for "Go to course" on success; no button is shown when omitted */
  successHref?: string;
  onDismiss?: () => void;
  /** Fixed to the top of the viewport (below the header); when false it flows with the layout */
  fixed?: boolean;
  /** Distance from the top of the viewport when fixed, default 56 (header height) */
  top?: number;
  /** UI language: en, zh-TW, zh-CN, ja. Tags such as zh-Hant-HK or ja-JP are also accepted */
  locale?: string;
  /** Override built-in strings; takes precedence over locale */
  labels?: PaymentStatusBannerLabels;
  className?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Map any language tag to one of the four built-in languages; everything else falls back to English */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, Required<PaymentStatusBannerLabels>> = {
  en: {
    success: "Payment received! You're all set, enjoy the course.",
    pending: "Confirming your payment. Hang on a few seconds; this page updates by itself once you're in.",
    failed: "Payment wasn't completed. Please try again.",
    error: "Something went wrong during payment. Contact support if you have questions.",
    successLink: "Go to course →",
    close: "Close",
  },
  "zh-TW": {
    success: "付款成功！課程已開通，祝你學習愉快。",
    pending: "正在確認付款，請稍候幾秒，開通後頁面會自動更新。",
    failed: "付款未完成，請再試一次。",
    error: "付款過程發生錯誤，如有疑問請聯絡客服。",
    successLink: "前往課程 →",
    close: "關閉",
  },
  "zh-CN": {
    success: "支付成功！课程已开通，祝你学习愉快。",
    pending: "正在确认支付，请稍等几秒，开通后页面会自动刷新。",
    failed: "支付未完成，请重试。",
    error: "支付过程中出现错误，如有疑问请联系客服。",
    successLink: "前往课程 →",
    close: "关闭",
  },
  ja: {
    success: "お支払いが完了しました！準備完了です。講座をお楽しみください。",
    pending: "お支払いを確認しています。数秒お待ちください。利用可能になるとページが自動で更新されます。",
    failed: "お支払いが完了しませんでした。もう一度お試しください。",
    error: "お支払い中にエラーが発生しました。ご不明な点はサポートまでお問い合わせください。",
    successLink: "講座へ進む →",
    close: "閉じる",
  },
};

// The status colour appears only on the 6px dot; everything else uses neutral tokens
const DOT = {
  success: "bg-emerald-500",
  failed: "bg-destructive",
  error: "bg-amber-500",
} as const;

// Motion of the product series: expo-out easing, durations on a 120 / 180 / 240ms ladder
const ease = [0.23, 1, 0.32, 1] as const;

// lucide icons (16px)
const iconProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function LoaderIcon() {
  return (
    <svg {...iconProps} className="animate-spin motion-reduce:animate-none">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg {...iconProps}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

/**
 * Payment result notification banner.
 * pending: unlocking is asynchronous and the data may not be written yet when the user lands, which does not mean the payment failed, so it polls and re-fetches;
 * as soon as unlocked becomes true it switches to success. success does not dismiss itself (so the user has time to click "Go to course");
 * failed and error dismiss themselves after 8 seconds.
 */
export function PaymentStatusBanner({
  status,
  unlocked,
  onRefresh,
  onUnlocked,
  syncOnMount = true,
  interval = 3000,
  maxAttempts = 8,
  dismissAfter = 8000,
  successHref,
  onDismiss,
  fixed = true,
  top = 56,
  locale = "en",
  labels,
  className,
}: PaymentStatusBannerProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const reduce = useReducedMotion() ?? false;
  const [banner, setBanner] = useState<string>(status ?? "");
  const refreshRef = useRef(onRefresh);
  refreshRef.current = onRefresh;
  const unlockedRef = useRef(onUnlocked);
  unlockedRef.current = onUnlocked;
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  // On returning from the payment page, check once now instead of waiting for the first poll interval
  useEffect(() => {
    if (!syncOnMount || status !== "pending" || unlocked) return;
    const id = setTimeout(() => refreshRef.current?.(), 0);
    return () => clearTimeout(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (banner !== "pending") return;
    if (unlocked) {
      setBanner("success");
      unlockedRef.current?.();
      return;
    }
    let attempts = 0;
    const id = setInterval(() => {
      attempts += 1;
      refreshRef.current?.();
      if (attempts >= maxAttempts) clearInterval(id);
    }, interval);
    return () => clearInterval(id);
  }, [banner, unlocked, interval, maxAttempts]);

  useEffect(() => {
    if (!banner || banner === "pending" || banner === "success") return;
    const id = setTimeout(() => {
      setBanner("");
      dismissRef.current?.();
    }, dismissAfter);
    return () => clearTimeout(id);
  }, [banner, dismissAfter]);

  const urgent = banner !== "success" && banner !== "pending";
  const dot = banner === "success" ? DOT.success : banner === "failed" ? DOT.failed : DOT.error;
  const swap = reduce ? { duration: 0 } : { duration: 0.18, ease };
  const leave = reduce ? { duration: 0 } : { duration: 0.12, ease };
  const message = banner === "success" ? t.success : banner === "pending" ? t.pending : banner === "failed" ? t.failed : t.error;

  // When the content wraps, the height changes with it; measure the inner element and tween it so the frame does not jump
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");
  const visible = !!banner;
  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const update = () => setHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [visible]);

  // Continuity: the same banner stays throughout. The icon cell on the left is a fixed anchor and only the glyph changes; text wraps up and down;
  // when fixed to the top it slides out from below the header, and when flowing with the layout it uses a height tween so content below slides instead of jumping.
  const enter = fixed ? { opacity: 0, y: reduce ? 0 : -8 } : { opacity: 0, height: reduce ? "auto" : 0 };
  const shown = fixed ? { opacity: 1, y: 0, height } : { opacity: 1, height };
  const gone = fixed ? { opacity: 0, y: reduce ? 0 : -8, transition: leave } : { opacity: 0, height: reduce ? "auto" : 0, transition: reduce ? leave : { duration: 0.18, ease } };

  return (
    <AnimatePresence initial={!reduce}>
      {banner && (
        <motion.div
          key="banner"
          role={urgent ? "alert" : "status"}
          initial={enter}
          animate={shown}
          exit={gone}
          transition={reduce ? { duration: 0 } : { duration: 0.24, ease }}
          className={cn(
            "overflow-hidden border-b border-border bg-card text-sm text-card-foreground",
            fixed ? "fixed inset-x-0 z-40" : "relative w-full",
            className,
          )}
          style={{ top: fixed ? top : undefined }}
        >
          <div ref={innerRef} className="flex items-center justify-between gap-4 px-6 py-3">
            <span className="inline-flex min-w-0 items-center gap-2.5">
              <span className="relative inline-flex size-4 shrink-0 items-center justify-center text-muted-foreground">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={banner === "pending" ? "pending" : banner}
                    initial={{ opacity: 0, scale: reduce ? 1 : 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: reduce ? 1 : 0.5, transition: leave }}
                    transition={swap}
                    className="inline-flex"
                  >
                    {banner === "pending" ? <LoaderIcon /> : <span aria-hidden className={cn("size-1.5 rounded-full", dot)} />}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span className="relative min-w-0 leading-snug">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={banner}
                    initial={{ opacity: 0, y: reduce ? 0 : 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: reduce ? 0 : -6, transition: leave }}
                    transition={swap}
                    className="block"
                  >
                    {message}
                  </motion.span>
                </AnimatePresence>
              </span>
            </span>
            <div className="flex flex-none items-center gap-2">
              <AnimatePresence initial={false}>
                {banner === "success" && successHref && (
                  <motion.a
                    key="link"
                    href={successHref}
                    initial={{ opacity: 0, x: reduce ? 0 : 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, transition: leave }}
                    transition={reduce ? { duration: 0 } : { duration: 0.18, ease, delay: 0.06 }}
                    className="inline-flex h-7 items-center rounded-md bg-primary px-3 text-[13px] font-medium whitespace-nowrap text-primary-foreground transition-opacity outline-none hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {t.successLink}
                  </motion.a>
                )}
              </AnimatePresence>
              <button
                type="button"
                onClick={() => {
                  setBanner("");
                  onDismiss?.();
                }}
                aria-label={t.close}
                className="inline-flex size-7 flex-none cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <XIcon />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
