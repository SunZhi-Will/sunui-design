"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

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
  /** 付款頁導回時帶的結果（原本來自網址 ?checkout=），沒有就不顯示 */
  status: CheckoutResult | string | null;
  /** 目前是否已開通。pending 期間它一變 true，banner 就切成 success */
  unlocked: boolean;
  /** pending 時每次輪詢呼叫，負責重新抓資料並更新 unlocked（原本是 router.refresh） */
  onRefresh?: () => void;
  /** pending 轉 success 時呼叫一次，例如重抓已購清單 */
  onUnlocked?: () => void;
  /** 掛載時若為 pending，先立刻同步一次付款結果，不等第一個輪詢間隔 */
  syncOnMount?: boolean;
  /** 輪詢間隔，預設 3000 毫秒 */
  interval?: number;
  /** 最多輪詢次數，預設 8 次（共 24 秒） */
  maxAttempts?: number;
  /** failed、error 自動消失的毫秒數，預設 8000 */
  dismissAfter?: number;
  /** 成功時「前往課程」的連結，沒給就不顯示按鈕 */
  successHref?: string;
  onDismiss?: () => void;
  /** 固定在視窗頂端（頁首下方）；false 時跟著版面流動 */
  fixed?: boolean;
  /** fixed 時距離視窗頂端的距離，預設 56（頁首高度） */
  top?: number;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: PaymentStatusBannerLabels;
  className?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
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

// 狀態色只上在 6px 的點上，其餘全部是中性 token
const DOT = {
  success: "bg-emerald-500",
  failed: "bg-destructive",
  error: "bg-amber-500",
} as const;

// lucide 圖示（16px）
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
 * 付款結果通知 banner。
 * pending：開通是非同步的，落地時資料可能還沒寫完，不代表付款有問題，所以輪詢重抓，
 * unlocked 一變 true 就自動切成 success。success 不自動消失（讓使用者有時間點「前往課程」），
 * failed、error 8 秒後自動消失。
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
  const [banner, setBanner] = useState<string>(status ?? "");
  const refreshRef = useRef(onRefresh);
  refreshRef.current = onRefresh;
  const unlockedRef = useRef(onUnlocked);
  unlockedRef.current = onUnlocked;
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  // 從付款頁回來時先查一次，不必等第一個輪詢間隔
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

  if (!banner) return null;

  const urgent = banner !== "success" && banner !== "pending";
  const dot = banner === "success" ? DOT.success : banner === "failed" ? DOT.failed : DOT.error;

  return (
    <div
      role={urgent ? "alert" : "status"}
      className={cn(
        "flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-3 text-sm text-card-foreground",
        fixed ? "fixed inset-x-0 z-40" : "relative w-full",
        className,
      )}
      style={{ top: fixed ? top : undefined }}
    >
      <span className="inline-flex min-w-0 items-center gap-2.5">
        <span className="inline-flex size-4 shrink-0 items-center justify-center text-muted-foreground">
          {banner === "pending" ? <LoaderIcon /> : <span aria-hidden className={cn("size-1.5 rounded-full", dot)} />}
        </span>
        <span className="min-w-0 leading-snug">{banner === "success" ? t.success : banner === "pending" ? t.pending : banner === "failed" ? t.failed : t.error}</span>
      </span>
      <div className="flex flex-none items-center gap-2">
        {banner === "success" && successHref && (
          <a
            href={successHref}
            className="inline-flex h-7 items-center rounded-md bg-primary px-3 text-[13px] font-medium whitespace-nowrap text-primary-foreground transition-opacity outline-none hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {t.successLink}
          </a>
        )}
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
  );
}
