"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/* UpdateBanner：AutoLens 深色、金色的應用程式更新橫幅 */

/** 外部（updater）推進來的事件；checking、not-available 不顯示，等同 idle */
export type UpdaterEvent =
  | { type: "idle" }
  | { type: "available"; version?: string }
  | { type: "progress"; percent: number }
  | { type: "downloaded" }
  | { type: "error"; message: string };

type BannerState =
  | { type: "idle" }
  | { type: "available"; version?: string }
  | { type: "downloading"; percent: number; retryAttempt?: number }
  | { type: "downloaded" }
  | { type: "installing" }
  | { type: "error"; message: string };

type Result = { success: boolean; error?: string } | void | undefined;

// 大檔下載偶爾被 CDN 中途截斷，這類暫時性錯誤自動重試幾次
const MAX_DOWNLOAD_RETRIES = 2;
const RETRY_DELAY_MS = 3000;
const TRANSIENT_ERROR_PATTERNS = [
  "ERR_INCOMPLETE_CHUNKED_ENCODING",
  "ERR_CONNECTION_RESET",
  "ERR_CONNECTION_CLOSED",
  "ERR_CONNECTION_ABORTED",
  "ERR_NETWORK_CHANGED",
  "ERR_TIMED_OUT",
  "ERR_EMPTY_RESPONSE",
];
const isTransientDownloadError = (message: string) => TRANSIENT_ERROR_PATTERNS.some((p) => message.includes(p));

export interface UpdateBannerLabels {
  updateAvailable?: (version?: string) => string;
  downloadNow?: string;
  dismissUpdate?: string;
  downloadingUpdate?: (percent: number) => string;
  downloadRetrying?: (attempt: number, max: number) => string;
  updateDownloaded?: string;
  restartNow?: string;
  installingUpdate?: string;
  updateFailed?: (message: string) => string;
  dismissError?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, Required<UpdateBannerLabels>> = {
  en: {
    updateAvailable: (v) => `A new version${v ? ` v${v}` : ""} is available. Ready to update?`,
    downloadNow: "Download Now",
    dismissUpdate: "Dismiss update notice",
    downloadingUpdate: (p) => `Downloading update… ${p}%`,
    downloadRetrying: (a, m) => `Download interrupted, retrying… (${a}/${m})`,
    updateDownloaded: "Update downloaded. After you restart, the app will close for a few seconds then reopen automatically.",
    restartNow: "Restart Now",
    installingUpdate: "Installing update… the app will restart shortly.",
    updateFailed: (m) => `Update failed: ${m}`,
    dismissError: "Dismiss error notice",
  },
  "zh-TW": {
    updateAvailable: (v) => `有新版本${v ? ` v${v}` : ""}可以更新，要現在更新嗎？`,
    downloadNow: "立即下載",
    dismissUpdate: "關閉更新通知",
    downloadingUpdate: (p) => `正在下載更新… ${p}%`,
    downloadRetrying: (a, m) => `下載中斷，正在重試… (${a}/${m})`,
    updateDownloaded: "更新已下載。重新啟動後，應用程式會關閉幾秒再自動開啟。",
    restartNow: "立即重新啟動",
    installingUpdate: "正在安裝更新… 應用程式即將重新啟動。",
    updateFailed: (m) => `更新失敗：${m}`,
    dismissError: "關閉錯誤通知",
  },
  "zh-CN": {
    updateAvailable: (v) => `有新版本${v ? ` v${v}` : ""}可用，要现在更新吗？`,
    downloadNow: "立即下载",
    dismissUpdate: "关闭更新通知",
    downloadingUpdate: (p) => `正在下载更新… ${p}%`,
    downloadRetrying: (a, m) => `下载中断，正在重试… (${a}/${m})`,
    updateDownloaded: "更新已下载。重启后，应用会关闭几秒钟再自动打开。",
    restartNow: "立即重启",
    installingUpdate: "正在安装更新… 应用即将重启。",
    updateFailed: (m) => `更新失败：${m}`,
    dismissError: "关闭错误通知",
  },
  ja: {
    updateAvailable: (v) => `新しいバージョン${v ? ` v${v}` : ""}があります。アップデートしますか？`,
    downloadNow: "今すぐダウンロード",
    dismissUpdate: "アップデート通知を閉じる",
    downloadingUpdate: (p) => `アップデートをダウンロード中… ${p}%`,
    downloadRetrying: (a, m) => `ダウンロードが中断されました。再試行中… (${a}/${m})`,
    updateDownloaded: "アップデートをダウンロードしました。再起動するとアプリが数秒間閉じ、自動で再び開きます。",
    restartNow: "今すぐ再起動",
    installingUpdate: "アップデートをインストール中… まもなくアプリが再起動します。",
    updateFailed: (m) => `アップデートに失敗しました：${m}`,
    dismissError: "エラー通知を閉じる",
  },
};

export interface UpdateBannerProps {
  /** 每次 updater 推來新事件就換一個新物件 */
  event: UpdaterEvent;
  /** 回傳 { success: false, error } 或丟例外視為失敗；暫時性網路錯誤會自動重試 */
  onDownload?: () => Promise<Result>;
  onInstall?: () => Promise<Result>;
  /** 預設 fixed 於視窗頂部並把實際高度寫進 :root 的 --banner-height；false 時改為 absolute */
  fixed?: boolean;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: UpdateBannerLabels;
  className?: string;
}

const Icon = ({ className, children }: { className?: string; children: ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
    {children}
  </svg>
);
const Spinner = () => (
  <Icon className="h-4 w-4 shrink-0 animate-spin text-yellow-300">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </Icon>
);
const CloseIcon = () => (
  <Icon className="h-3.5 w-3.5">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Icon>
);

export function UpdateBanner({ event, onDownload, onInstall, fixed = true, locale = "en", labels, className }: UpdateBannerProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const reduce = useReducedMotion() ?? false;
  const [banner, setBanner] = useState<BannerState>({ type: "idle" });
  const [dismissed, setDismissed] = useState(false);
  // 重試進行中壓下外部 error 事件，避免畫面在 error 與重試中之間閃爍
  const retryInFlightRef = useRef(false);

  useEffect(() => {
    switch (event.type) {
      case "available":
        setBanner({ type: "available", version: event.version });
        setDismissed(false);
        break;
      case "progress":
        setBanner({ type: "downloading", percent: Math.round(event.percent ?? 0) });
        break;
      case "downloaded":
        setBanner({ type: "downloaded" });
        setDismissed(false);
        break;
      case "error":
        if (retryInFlightRef.current) break;
        setBanner({ type: "error", message: event.message });
        setDismissed(false);
        break;
      default:
        break;
    }
  }, [event]);

  const isVisible = banner.type !== "idle" && !dismissed;

  // 把橫幅實際高度寫到 :root，讓各畫面可以 calc(var(--titlebar-height) + var(--banner-height)) 讓開
  const bannerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!fixed) return;
    const root = document.documentElement;
    if (!isVisible) {
      root.style.setProperty("--banner-height", "0px");
      return;
    }
    const node = bannerRef.current;
    if (!node) return;
    const sync = () => root.style.setProperty("--banner-height", `${node.offsetHeight}px`);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    return () => {
      observer.disconnect();
      root.style.setProperty("--banner-height", "0px");
    };
  }, [isVisible, fixed]);

  if (!isVisible) return null;

  const handleDownload = async () => {
    retryInFlightRef.current = true;
    try {
      for (let attempt = 0; attempt <= MAX_DOWNLOAD_RETRIES; attempt++) {
        // 立刻給回饋，不等第一個 progress 事件
        setBanner({ type: "downloading", percent: 0, retryAttempt: attempt > 0 ? attempt : undefined });
        let message: string | null = null;
        try {
          const result = await onDownload?.();
          if (!result || result.success !== false) return; // 成功，交給 progress 與 downloaded 事件接手
          message = result.error ?? "downloadUpdate failed";
        } catch (err) {
          message = String(err);
        }
        const canRetry = attempt < MAX_DOWNLOAD_RETRIES && isTransientDownloadError(message);
        if (!canRetry) {
          setBanner({ type: "error", message });
          setDismissed(false);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    } finally {
      retryInFlightRef.current = false;
    }
  };

  const handleInstall = async () => {
    // 立即切到安裝中，應用程式關閉前的空窗期才不像當機
    setBanner({ type: "installing" });
    try {
      const result = await onInstall?.();
      if (result && result.success === false) {
        setBanner({ type: "error", message: result.error ?? "installUpdateNow failed" });
        setDismissed(false);
      }
    } catch (err) {
      setBanner({ type: "error", message: String(err) });
      setDismissed(false);
    }
  };

  const primary = "shrink-0 px-3 py-0.5 rounded bg-yellow-500 hover:bg-yellow-400 text-[#111111] text-xs font-medium transition-colors";
  const close = "shrink-0 p-1 rounded hover:bg-white/10 transition-colors";

  return (
    <motion.div
      ref={bannerRef}
      role="status"
      aria-live="polite"
      initial={reduce ? false : { y: "-0.25rem" }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        fixed ? "fixed top-[var(--titlebar-height,0px)] z-[9998]" : "absolute top-0 z-20",
        "left-0 right-0 flex items-center gap-3 px-4 py-2 text-sm bg-yellow-900/95 border-b border-yellow-500/40 text-yellow-100 backdrop-blur-sm",
        className,
      )}
    >
      {banner.type === "available" && (
        <>
          <Icon className="h-4 w-4 shrink-0 text-yellow-300">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8" />
            <path d="m8 12 4 4 4-4" />
          </Icon>
          <span className="min-w-0 flex-1">{t.updateAvailable(banner.version)}</span>
          <button type="button" onClick={handleDownload} className={primary}>
            {t.downloadNow}
          </button>
          <button type="button" onClick={() => setDismissed(true)} className={close} aria-label={t.dismissUpdate}>
            <CloseIcon />
          </button>
        </>
      )}

      {banner.type === "downloading" && (
        <>
          <Spinner />
          <span className="min-w-0 flex-1">
            {banner.retryAttempt ? t.downloadRetrying(banner.retryAttempt, MAX_DOWNLOAD_RETRIES) : t.downloadingUpdate(banner.percent)}
          </span>
          <div className="h-1.5 w-32 max-w-[30%] shrink-0 overflow-hidden rounded-full bg-yellow-800">
            <div className="h-full rounded-full bg-yellow-400 transition-all duration-300 motion-reduce:transition-none" style={{ width: `${banner.percent}%` }} />
          </div>
        </>
      )}

      {banner.type === "downloaded" && (
        <>
          <Icon className="h-4 w-4 shrink-0 text-[#e5e5e5]">
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
          </Icon>
          <span className="min-w-0 flex-1">{t.updateDownloaded}</span>
          <button type="button" onClick={handleInstall} className={primary}>
            {t.restartNow}
          </button>
          <button type="button" onClick={() => setDismissed(true)} className={close} aria-label={t.dismissUpdate}>
            <CloseIcon />
          </button>
        </>
      )}

      {banner.type === "installing" && (
        <>
          <Spinner />
          <span className="min-w-0 flex-1">{t.installingUpdate}</span>
        </>
      )}

      {banner.type === "error" && (
        <>
          <Icon className="h-4 w-4 shrink-0 text-red-400">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </Icon>
          <span className="min-w-0 flex-1 break-words text-red-200">{t.updateFailed(banner.message)}</span>
          <button type="button" onClick={() => setDismissed(true)} className={close} aria-label={t.dismissError}>
            <CloseIcon />
          </button>
        </>
      )}
    </motion.div>
  );
}
