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
  labels?: PaymentStatusBannerLabels;
  className?: string;
}

const defaultLabels: Required<PaymentStatusBannerLabels> = {
  success: "Payment received! You're all set, enjoy the course.",
  pending: "Confirming your payment. Hang on a few seconds; this page updates by itself once you're in.",
  failed: "Payment wasn't completed. Please try again.",
  error: "Something went wrong during payment. Contact support if you have questions.",
  successLink: "Go to course →",
  close: "Close",
};

const TONE = {
  success: { bg: "rgba(34,197,94,0.18)", border: "rgba(34,197,94,0.35)", text: "#4ade80" },
  pending: { bg: "rgba(59,130,246,0.18)", border: "rgba(59,130,246,0.35)", text: "#60a5fa" },
  failed: { bg: "rgba(239,68,68,0.18)", border: "rgba(239,68,68,0.35)", text: "#f87171" },
} as const;

// lucide 圖示（18px）
const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function PartyPopperIcon() {
  return (
    <svg {...iconProps}>
      <path d="M5.8 11.3 2 22l10.7-3.79" />
      <path d="M4 3h.01" />
      <path d="M22 8h.01" />
      <path d="M15 2h.01" />
      <path d="M22 20h.01" />
      <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" />
      <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17" />
      <path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7" />
      <path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z" />
    </svg>
  );
}

function LoaderIcon() {
  return (
    <svg {...iconProps} className="animate-spin motion-reduce:animate-none">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}

function AlertTriangleIcon() {
  return (
    <svg {...iconProps}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
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
  labels,
  className,
}: PaymentStatusBannerProps) {
  const t = { ...defaultLabels, ...labels };
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

  const tone = banner === "success" ? TONE.success : banner === "pending" ? TONE.pending : TONE.failed;
  const urgent = banner !== "success" && banner !== "pending";

  return (
    <div
      role={urgent ? "alert" : "status"}
      className={cn("flex items-center justify-between gap-4 px-6 py-3.5", fixed ? "fixed inset-x-0 z-40" : "relative w-full", className)}
      style={{
        top: fixed ? top : undefined,
        background: tone.bg,
        borderBottom: `1px solid ${tone.border}`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <span className="inline-flex min-w-0 items-center gap-2 font-semibold" style={{ color: tone.text }}>
        <span className="inline-flex shrink-0">
          {banner === "success" ? <PartyPopperIcon /> : banner === "pending" ? <LoaderIcon /> : banner === "failed" ? <XCircleIcon /> : <AlertTriangleIcon />}
        </span>
        <span className="min-w-0">{banner === "success" ? t.success : banner === "pending" ? t.pending : banner === "failed" ? t.failed : t.error}</span>
      </span>
      <div className="flex flex-none items-center gap-3">
        {banner === "success" && successHref && (
          <a
            href={successHref}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-bold whitespace-nowrap"
            style={{ background: "#22c55e", color: "#062e13" }}
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
          className="inline-flex flex-none cursor-pointer border-none bg-transparent"
          style={{ color: "var(--psb-muted, rgba(255,255,255,0.50))" }}
        >
          <XIcon />
        </button>
      </div>
    </div>
  );
}
