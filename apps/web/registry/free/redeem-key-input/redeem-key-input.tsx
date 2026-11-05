"use client";

import { useId, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/*
 * 授權 / 兌換面板：同一個輸入框收兩種碼
 * - Supporter 兌換碼（12 碼，印成 ABCD-EFGH-JKLM）
 * - Pro 授權碼（Lemon Squeezy 的 UUID）
 * 版面與狀態流程移植自 KapZoom 的 LicenseDialog，偵測邏輯移植自 PostVault 的 redeem-input。
 */

export type LicenseTier = "free" | "trial" | "basic" | "pro" | "supporter";
export type LicenseStatus = "active" | "grace" | "expired" | "invalid";
export type RedeemKeyKind = "supporter" | "pro";

export interface LicenseState {
  tier: LicenseTier;
  status?: LicenseStatus;
  /** 有沒有金鑰要看這個，不能看 tier（離線過久時 tier 會被打回 free） */
  hasKey?: boolean;
  needsRevalidation?: boolean;
  maskedKey?: string | null;
  customerName?: string | null;
  trialDaysLeft?: number;
  freeExportsRemaining?: number | null;
  freeExportLimit?: number;
}

/** 供應商錯誤碼（PostVault 的 ProLicenseError）或伺服器原文 */
export type RedeemOutcome =
  | { ok: true }
  | { ok: false; offline?: boolean; error?: string };

export interface LicensePricing {
  current: string;
  strike?: string | null;
  basic?: string | null;
  earlyBird?: boolean;
  competitorYearly?: string | null;
  /** 顯示在地幣別時，標出實際結帳金額 */
  checkoutNote?: string | null;
}

export interface RedeemKeyInputLabels {
  title: string;
  close: string;
  proThanks: string;
  basicThanks: string;
  supporterThanks: string;
  trialRemaining: (days: number) => string;
  tierPro: string;
  tierBasic: string;
  tierTrial: string;
  tierFree: string;
  tierSupporter: string;
  daysLeft: (days: number) => string;
  freeLimits: string;
  freeExportsRemaining: (remaining: number, limit: number) => string;
  freeExportsExhausted: (limit: number) => string;
  supporterNote: string;
  degradedTitle: string;
  degradedBody: string;
  degradedRetry: string;
  statusGrace: string;
  statusExpired: string;
  statusInvalid: string;
  upgradePro: string;
  upgradeBasic: string;
  unlockTitle: string;
  unlockBasicTitle: string;
  priceOneTime: string;
  priceEarlyBirdBadge: string;
  priceSubnote: string;
  priceBasicSubnote: string;
  priceAnchor: (yearly: string) => string;
  basicWatermarkNote: string;
  haveKey: string;
  placeholder: string;
  field: string;
  detectedSupporter: string;
  detectedPro: string;
  activate: string;
  revalidate: string;
  revalidateNow: string;
  deactivate: string;
  activated: string;
  redeemed: string;
  activateFailed: string;
  offlineError: string;
  deactivated: string;
  revalidated: string;
  revalidateOffline: string;
  revalidateFailed: string;
  invalidSupporter: string;
  desktopOnly: string;
  /** 升級區列出的 Pro 功能；proFeatures prop 優先 */
  proFeatures: string[];
  /** 錯誤碼對應的訊息與處理指引 */
  errors: Record<string, { text: string; hint?: string }>;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, RedeemKeyInputLabels> = {
  en: {
    title: "KapZoom License",
    close: "Close",
    proThanks: "Pro, thanks for your support",
    basicThanks: "Basic, unlimited exports (watermarked)",
    supporterThanks: "Supporter, thanks for the coffee",
    trialRemaining: (d) => `Trial · ${d} days left`,
    tierPro: "Pro",
    tierBasic: "Basic",
    tierTrial: "Trial",
    tierFree: "Free",
    tierSupporter: "Supporter",
    daysLeft: (d) => `${d} days left`,
    freeLimits: "Watermark on export · 720p max",
    freeExportsRemaining: (r, l) => `${r} of ${l} free exports left`,
    freeExportsExhausted: (l) => `You've used all ${l} free exports`,
    supporterNote: "Supporter features unlocked on this browser",
    degradedTitle: "Couldn't read your license status",
    degradedBody:
      "Running in Free mode for now. Your purchase is unaffected, this is usually a temporary problem reading local license storage.",
    degradedRetry: "Retry",
    statusGrace: "Your license needs to reconnect to be verified.",
    statusExpired: "Your license has expired.",
    statusInvalid: "Your license could not be verified.",
    upgradePro: "Upgrade to KapZoom Pro",
    upgradeBasic: "Unlock unlimited exports",
    unlockTitle: "Unlock with Pro",
    unlockBasicTitle: "Unlock unlimited exports",
    priceOneTime: "one-time · lifetime",
    priceEarlyBirdBadge: "Early bird",
    priceSubnote: "Bonus: 1 year of updates · no subscription",
    priceBasicSubnote: "One-time · removes the free export limit",
    priceAnchor: (y) => `Screen Studio is ${y}/yr, and Mac-only`,
    basicWatermarkNote: "Still watermarked. Upgrade to Pro to remove it",
    haveKey: "Already purchased? Enter your license key or supporter code",
    placeholder: "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
    field: "License key or supporter code",
    detectedSupporter: "Supporter code",
    detectedPro: "Pro license key",
    activate: "Activate",
    revalidate: "Revalidate license",
    revalidateNow: "Verify now",
    deactivate: "Deactivate this device (for switching machines)",
    activated: "KapZoom Pro activated. Thank you!",
    redeemed: "Code redeemed! Supporter features are unlocked.",
    activateFailed: "Activation failed. Please check your key.",
    offlineError: "Cannot reach the license server. Check your connection and retry.",
    deactivated: "License deactivated on this device. You can activate it elsewhere.",
    revalidated: "License revalidated successfully.",
    revalidateOffline: "Currently offline, will retry automatically.",
    revalidateFailed: "Revalidation failed.",
    invalidSupporter: "Invalid code. Please try again",
    desktopOnly: "Licensing is available in the desktop app only.",
    proFeatures: ["Watermark-free export", "4K / native-resolution export", "All auto-zoom & cursor effects", "Bonus: one year of updates"],
    errors: {
      activation_limit: {
        text: "This license key has reached its device activation limit.",
        hint: "Open the license window on the device you no longer use and click “Deactivate this device”, then activate here again.",
      },
      not_found: { text: "License key not found. Check for typos or extra spaces." },
      disabled: { text: "This license key has been disabled. Contact support." },
      expired: { text: "This license key has expired" },
      wrong_product: { text: "This license key is not for this product" },
      bad_format: { text: "This does not look like a Pro license key" },
      not_configured: { text: "Pro is not on sale yet" },
      network: { text: "Could not reach the license server. Check your connection and try again" },
      no_background: { text: "The app was just updated. Close this window and open it again" },
      unexpected: { text: "Activation failed. Please try again later" },
    },
  },
  "zh-TW": {
    title: "KapZoom 授權",
    close: "關閉",
    proThanks: "Pro，感謝你的支持",
    basicThanks: "Basic，無限次匯出（含浮水印）",
    supporterThanks: "贊助者，謝謝你請的咖啡",
    trialRemaining: (d) => `試用中 · 剩 ${d} 天`,
    tierPro: "Pro",
    tierBasic: "Basic",
    tierTrial: "試用",
    tierFree: "免費",
    tierSupporter: "贊助者",
    daysLeft: (d) => `剩 ${d} 天`,
    freeLimits: "匯出含浮水印 · 最高 720p",
    freeExportsRemaining: (r, l) => `免費匯出剩 ${r} / ${l} 次`,
    freeExportsExhausted: (l) => `${l} 次免費匯出已用完`,
    supporterNote: "此瀏覽器已解鎖贊助者功能",
    degradedTitle: "無法讀取授權狀態",
    degradedBody: "目前暫以免費模式執行。你的購買不受影響，這通常是讀取本機授權資料時的暫時問題。",
    degradedRetry: "重試",
    statusGrace: "授權需要重新連線驗證。",
    statusExpired: "授權已過期。",
    statusInvalid: "無法驗證你的授權。",
    upgradePro: "升級 KapZoom Pro",
    upgradeBasic: "解鎖無限匯出",
    unlockTitle: "升級 Pro 解鎖",
    unlockBasicTitle: "解鎖無限匯出",
    priceOneTime: "一次買斷 · 永久使用",
    priceEarlyBirdBadge: "早鳥價",
    priceSubnote: "加贈 1 年更新 · 不必訂閱",
    priceBasicSubnote: "一次付費 · 解除免費匯出次數限制",
    priceAnchor: (y) => `Screen Studio 每年 ${y}，而且只支援 Mac`,
    basicWatermarkNote: "仍有浮水印，升級 Pro 才能移除",
    haveKey: "已經購買？輸入授權碼或贊助兌換碼",
    placeholder: "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
    field: "授權碼或贊助兌換碼",
    detectedSupporter: "贊助兌換碼",
    detectedPro: "Pro 授權碼",
    activate: "啟用",
    revalidate: "重新驗證授權",
    revalidateNow: "立即驗證",
    deactivate: "在此裝置停用（換電腦時使用）",
    activated: "KapZoom Pro 已啟用，謝謝你！",
    redeemed: "兌換成功！已解鎖贊助者功能。",
    activateFailed: "啟用失敗，請檢查授權碼。",
    offlineError: "無法連線到授權伺服器，請檢查網路後重試。",
    deactivated: "已在此裝置停用授權，可以到其他裝置啟用。",
    revalidated: "授權重新驗證成功。",
    revalidateOffline: "目前離線，稍後會自動重試。",
    revalidateFailed: "重新驗證失敗。",
    invalidSupporter: "兌換碼無效，請再試一次",
    desktopOnly: "授權功能僅限桌面版使用。",
    proFeatures: ["無浮水印匯出", "4K / 原生解析度匯出", "所有自動縮放與游標特效", "加贈一年更新"],
    errors: {
      activation_limit: {
        text: "這組授權碼已達裝置啟用上限。",
        hint: "請在不再使用的裝置上開啟授權視窗，點「在此裝置停用」，再回到這裡啟用。",
      },
      not_found: { text: "找不到這組授權碼，請檢查是否有錯字或多餘空白。" },
      disabled: { text: "這組授權碼已被停用，請聯絡客服。" },
      expired: { text: "這組授權碼已過期" },
      wrong_product: { text: "這組授權碼不是這個產品的" },
      bad_format: { text: "這看起來不像 Pro 授權碼" },
      not_configured: { text: "Pro 尚未開賣" },
      network: { text: "無法連線到授權伺服器，請檢查網路後再試一次" },
      no_background: { text: "App 剛更新完成，請關閉此視窗後重新開啟" },
      unexpected: { text: "啟用失敗，請稍後再試" },
    },
  },
  "zh-CN": {
    title: "KapZoom 授权",
    close: "关闭",
    proThanks: "Pro，感谢你的支持",
    basicThanks: "Basic，无限次导出（带水印）",
    supporterThanks: "赞助者，谢谢你请的咖啡",
    trialRemaining: (d) => `试用中 · 剩余 ${d} 天`,
    tierPro: "Pro",
    tierBasic: "Basic",
    tierTrial: "试用",
    tierFree: "免费",
    tierSupporter: "赞助者",
    daysLeft: (d) => `剩余 ${d} 天`,
    freeLimits: "导出带水印 · 最高 720p",
    freeExportsRemaining: (r, l) => `免费导出剩余 ${r} / ${l} 次`,
    freeExportsExhausted: (l) => `${l} 次免费导出已用完`,
    supporterNote: "此浏览器已解锁赞助者功能",
    degradedTitle: "无法读取授权状态",
    degradedBody: "目前暂以免费模式运行。你的购买不受影响，这通常是读取本地授权数据时的临时问题。",
    degradedRetry: "重试",
    statusGrace: "授权需要重新联网验证。",
    statusExpired: "授权已过期。",
    statusInvalid: "无法验证你的授权。",
    upgradePro: "升级 KapZoom Pro",
    upgradeBasic: "解锁无限导出",
    unlockTitle: "升级 Pro 解锁",
    unlockBasicTitle: "解锁无限导出",
    priceOneTime: "一次买断 · 永久使用",
    priceEarlyBirdBadge: "早鸟价",
    priceSubnote: "赠送 1 年更新 · 无需订阅",
    priceBasicSubnote: "一次付费 · 解除免费导出次数限制",
    priceAnchor: (y) => `Screen Studio 每年 ${y}，而且仅支持 Mac`,
    basicWatermarkNote: "仍带水印，升级 Pro 才能去除",
    haveKey: "已经购买？输入许可证密钥或赞助兑换码",
    placeholder: "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
    field: "许可证密钥或赞助兑换码",
    detectedSupporter: "赞助兑换码",
    detectedPro: "Pro 许可证密钥",
    activate: "激活",
    revalidate: "重新验证授权",
    revalidateNow: "立即验证",
    deactivate: "在此设备停用（更换电脑时使用）",
    activated: "KapZoom Pro 已激活，谢谢你！",
    redeemed: "兑换成功！已解锁赞助者功能。",
    activateFailed: "激活失败，请检查密钥。",
    offlineError: "无法连接授权服务器，请检查网络后重试。",
    deactivated: "已在此设备停用授权，可以在其他设备上激活。",
    revalidated: "授权重新验证成功。",
    revalidateOffline: "当前离线，稍后会自动重试。",
    revalidateFailed: "重新验证失败。",
    invalidSupporter: "兑换码无效，请重试",
    desktopOnly: "授权功能仅限桌面版使用。",
    proFeatures: ["无水印导出", "4K / 原生分辨率导出", "全部自动缩放与光标特效", "赠送一年更新"],
    errors: {
      activation_limit: {
        text: "此许可证密钥已达到设备激活上限。",
        hint: "请在不再使用的设备上打开授权窗口，点击“在此设备停用”，然后回到这里重新激活。",
      },
      not_found: { text: "未找到此许可证密钥，请检查是否有错字或多余空格。" },
      disabled: { text: "此许可证密钥已被停用，请联系客服。" },
      expired: { text: "此许可证密钥已过期" },
      wrong_product: { text: "此许可证密钥不适用于本产品" },
      bad_format: { text: "这看起来不像 Pro 许可证密钥" },
      not_configured: { text: "Pro 尚未开售" },
      network: { text: "无法连接授权服务器，请检查网络后重试" },
      no_background: { text: "应用刚刚更新，请关闭此窗口后重新打开" },
      unexpected: { text: "激活失败，请稍后重试" },
    },
  },
  ja: {
    title: "KapZoom ライセンス",
    close: "閉じる",
    proThanks: "Pro、ご支援ありがとうございます",
    basicThanks: "Basic、無制限エクスポート（透かしあり）",
    supporterThanks: "サポーター、コーヒーをありがとう",
    trialRemaining: (d) => `トライアル · 残り ${d} 日`,
    tierPro: "Pro",
    tierBasic: "Basic",
    tierTrial: "トライアル",
    tierFree: "無料",
    tierSupporter: "サポーター",
    daysLeft: (d) => `残り ${d} 日`,
    freeLimits: "エクスポートに透かし · 最大 720p",
    freeExportsRemaining: (r, l) => `無料エクスポート残り ${r} / ${l} 回`,
    freeExportsExhausted: (l) => `無料エクスポート ${l} 回をすべて使いました`,
    supporterNote: "このブラウザでサポーター機能が有効です",
    degradedTitle: "ライセンス状態を読み込めませんでした",
    degradedBody: "ひとまず無料モードで動作しています。ご購入には影響ありません。ローカルのライセンス情報を読み込む際の一時的な問題であることがほとんどです。",
    degradedRetry: "再試行",
    statusGrace: "ライセンスの確認のため、再接続が必要です。",
    statusExpired: "ライセンスの有効期限が切れています。",
    statusInvalid: "ライセンスを確認できませんでした。",
    upgradePro: "KapZoom Pro にアップグレード",
    upgradeBasic: "無制限エクスポートを解放",
    unlockTitle: "Pro で解放される機能",
    unlockBasicTitle: "無制限エクスポートを解放",
    priceOneTime: "買い切り · 永久ライセンス",
    priceEarlyBirdBadge: "早割",
    priceSubnote: "特典：1 年間のアップデート · サブスクなし",
    priceBasicSubnote: "買い切り · 無料エクスポートの回数制限を解除",
    priceAnchor: (y) => `Screen Studio は年額 ${y}、しかも Mac 専用`,
    basicWatermarkNote: "透かしは残ります。消すには Pro にアップグレード",
    haveKey: "購入済みですか？ライセンスキーまたはサポーターコードを入力",
    placeholder: "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
    field: "ライセンスキーまたはサポーターコード",
    detectedSupporter: "サポーターコード",
    detectedPro: "Pro ライセンスキー",
    activate: "有効化",
    revalidate: "ライセンスを再確認",
    revalidateNow: "今すぐ確認",
    deactivate: "このデバイスで無効化（機器の入れ替え用）",
    activated: "KapZoom Pro を有効化しました。ありがとうございます！",
    redeemed: "コードを引き換えました！サポーター機能が有効になりました。",
    activateFailed: "有効化に失敗しました。キーを確認してください。",
    offlineError: "ライセンスサーバーに接続できません。接続を確認して再試行してください。",
    deactivated: "このデバイスのライセンスを無効化しました。別のデバイスで有効化できます。",
    revalidated: "ライセンスを再確認しました。",
    revalidateOffline: "現在オフラインです。自動的に再試行します。",
    revalidateFailed: "再確認に失敗しました。",
    invalidSupporter: "無効なコードです。もう一度お試しください",
    desktopOnly: "ライセンス機能はデスクトップアプリでのみ利用できます。",
    proFeatures: ["透かしなしでエクスポート", "4K / ネイティブ解像度でエクスポート", "すべての自動ズームとカーソル効果", "特典：1 年間のアップデート"],
    errors: {
      activation_limit: {
        text: "このライセンスキーはデバイスの有効化上限に達しています。",
        hint: "使わなくなったデバイスでライセンス画面を開き「このデバイスで無効化」を押してから、ここで再度有効化してください。",
      },
      not_found: { text: "ライセンスキーが見つかりません。入力ミスや余分なスペースがないか確認してください。" },
      disabled: { text: "このライセンスキーは無効化されています。サポートにお問い合わせください。" },
      expired: { text: "このライセンスキーは有効期限切れです" },
      wrong_product: { text: "この製品用のライセンスキーではありません" },
      bad_format: { text: "Pro ライセンスキーの形式ではないようです" },
      not_configured: { text: "Pro はまだ販売されていません" },
      network: { text: "ライセンスサーバーに接続できませんでした。接続を確認して再試行してください" },
      no_background: { text: "アプリが更新されたばかりです。このウィンドウを閉じて開き直してください" },
      unexpected: { text: "有効化に失敗しました。しばらくしてからもう一度お試しください" },
    },
  },
};

/** 英文預設字串，保留舊的匯出名稱 */
export const defaultRedeemLabels: RedeemKeyInputLabels = MESSAGES.en;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 兌換碼正規化：去空白與連字號、轉大寫（打的時候不必照抄連字號） */
export function normalizeSupporterCode(code: string): string {
  return code.trim().toUpperCase().replace(/[\s-]/g, "");
}

/** 判斷輸入的是哪一種碼，判斷不出來回傳 null */
export function detectKeyKind(input: string): RedeemKeyKind | null {
  const value = input.trim();
  if (!value) return null;
  if (UUID_RE.test(value)) return "pro";
  if (/^[A-Z0-9]{12}$/.test(normalizeSupporterCode(value))) return "supporter";
  return null;
}

/**
 * 錯誤碼或 Lemon Squeezy 原文對應成可處理的訊息。
 * 先比對錯誤碼，再比對最常見的三種原文；都對不上才回落原文。
 */
export function mapLicenseError(
  raw: string | undefined,
  errors: RedeemKeyInputLabels["errors"],
): { text: string; hint?: string } | null {
  if (!raw) return null;
  if (errors[raw]) return errors[raw];
  const text = raw.toLowerCase();
  if (text.includes("activation limit") || text.includes("activation_limit")) return errors.activation_limit ?? null;
  if (text.includes("not found") || text.includes("does not exist")) return errors.not_found ?? null;
  if (text.includes("disabled") || text.includes("revoked")) return errors.disabled ?? null;
  return null;
}

/* lucide 圖示的 inline 版本 */
type IconProps = { className?: string };
const svg = (className: string | undefined, children: ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    {children}
  </svg>
);
const XIcon = ({ className }: IconProps) => svg(className, <path d="M18 6 6 18M6 6l12 12" />);
const CheckIcon = ({ className }: IconProps) => svg(className, <path d="M20 6 9 17l-5-5" />);
const CrownIcon = ({ className }: IconProps) =>
  svg(
    className,
    <>
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
      <path d="M5 21h14" />
    </>,
  );
const UnlockIcon = ({ className }: IconProps) =>
  svg(
    className,
    <>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </>,
  );
const ShieldCheckIcon = ({ className }: IconProps) =>
  svg(
    className,
    <>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </>,
  );
const ClockIcon = ({ className }: IconProps) =>
  svg(
    className,
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </>,
  );
const AlertIcon = ({ className }: IconProps) =>
  svg(
    className,
    <>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4M12 17h.01" />
    </>,
  );
const ExternalIcon = ({ className }: IconProps) =>
  svg(className, <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />);
const Spinner = ({ className }: IconProps) =>
  svg(cn("motion-safe:animate-spin", className), <path d="M21 12a9 9 0 1 1-6.219-8.56" />);
/* PostVault 贊助按鈕的咖啡杯 */
const CoffeeIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
    <path d="M4 3h10v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V3z" />
    <path d="M14 6c1 0 2 1 2 2s-1 2-2 2" />
    <path d="M5 5h8" />
  </svg>
);

const FOCUS = "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rk-accent)]";
const PRIMARY_CTA =
  "w-full py-2.5 rounded-lg bg-gradient-to-r from-[var(--rk-accent)] to-[var(--rk-accent-2)] hover:brightness-110 text-neutral-900 text-sm font-semibold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[color-mix(in_srgb,var(--rk-accent)_20%,transparent)]";

type Busy = "activate" | "deactivate" | "revalidate" | "retry" | null;
type Message = { type: "error" | "ok"; text: string; hint?: string } | null;

export interface RedeemKeyInputProps {
  state: LicenseState;
  /** 讀不到授權狀態：不顯示任何價格或購買按鈕 */
  degraded?: boolean;
  /** 不在可授權的環境（例如瀏覽器版） */
  available?: boolean;
  pricing?: LicensePricing;
  proFeatures?: string[];
  onActivate: (code: string, kind: RedeemKeyKind) => Promise<RedeemOutcome> | RedeemOutcome;
  onDeactivate?: () => Promise<void> | void;
  onRevalidate?: () => Promise<RedeemOutcome | null> | RedeemOutcome | null;
  onRetryRead?: () => Promise<void> | void;
  onPurchase?: () => void;
  onPurchaseBasic?: () => void;
  onClose?: () => void;
  /** 面板底部的額外內容（例如版本資訊） */
  footer?: ReactNode;
  /** 強調色，預設 KapZoom 黃 */
  accent?: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<RedeemKeyInputLabels>;
  className?: string;
}

export function RedeemKeyInput({
  state,
  degraded = false,
  available = true,
  pricing,
  proFeatures: proFeaturesProp,
  onActivate,
  onDeactivate,
  onRevalidate,
  onRetryRead,
  onPurchase,
  onPurchaseBasic,
  onClose,
  footer,
  accent = "#eab308",
  locale = "en",
  labels: labelsProp,
  className,
}: RedeemKeyInputProps) {
  const base = MESSAGES[resolveLocale(locale)];
  const l = { ...base, ...labelsProp, errors: { ...base.errors, ...labelsProp?.errors } };
  const proFeatures = proFeaturesProp ?? l.proFeatures;
  const titleId = useId();
  const inputId = useId();
  const kindId = useId();
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState<Busy>(null);
  const [message, setMessage] = useState<Message>(null);

  const isPro = state.tier === "pro";
  const isBasic = state.tier === "basic";
  const isTrial = state.tier === "trial";
  const isSupporter = state.tier === "supporter";
  const days = state.trialDaysLeft ?? 0;
  const hasKey = state.hasKey === true;
  const showKeyControls = isPro || isBasic || hasKey;
  const statusNotice =
    hasKey && state.status === "grace"
      ? l.statusGrace
      : hasKey && state.status === "expired"
        ? l.statusExpired
        : hasKey && state.status === "invalid"
          ? l.statusInvalid
          : null;
  const kind = detectKeyKind(key);

  const handleRetryRead = async () => {
    setBusy("retry");
    setMessage(null);
    await onRetryRead?.();
    setBusy(null);
  };

  const handleActivate = async () => {
    const value = key.trim();
    if (!value) return;
    // 偵測不出時照原本的作法交給 supporter 兌換路徑判定為無效
    const k = kind ?? "supporter";
    setBusy("activate");
    setMessage(null);
    let r: RedeemOutcome;
    try {
      r = await onActivate(k === "supporter" ? normalizeSupporterCode(value) : value, k);
    } catch (e) {
      r = { ok: false, error: e instanceof Error ? e.message : undefined };
    }
    setBusy(null);
    if (r.ok) {
      setMessage({ type: "ok", text: k === "pro" ? l.activated : l.redeemed });
      setKey("");
    } else if (r.offline) {
      setMessage({ type: "error", text: l.offlineError });
    } else if (k === "supporter") {
      setMessage({ type: "error", text: l.invalidSupporter });
    } else {
      const mapped = mapLicenseError(r.error, l.errors);
      setMessage(mapped ? { type: "error", ...mapped } : { type: "error", text: r.error || l.activateFailed });
    }
  };

  const handleDeactivate = async () => {
    setBusy("deactivate");
    setMessage(null);
    await onDeactivate?.();
    setBusy(null);
    setMessage({ type: "ok", text: l.deactivated });
  };

  const handleRevalidate = async () => {
    setBusy("revalidate");
    setMessage(null);
    const r = await onRevalidate?.();
    setBusy(null);
    if (r?.ok) setMessage({ type: "ok", text: l.revalidated });
    else if (r?.offline) setMessage({ type: "error", text: l.revalidateOffline });
    else if (r) setMessage({ type: "error", text: r.error || l.revalidateFailed });
  };

  const freeLimit = state.freeExportLimit ?? 3;
  const freeSubtitle =
    state.freeExportsRemaining != null && state.freeExportsRemaining <= 0
      ? l.freeExportsExhausted(freeLimit)
      : l.freeExportsRemaining(state.freeExportsRemaining ?? freeLimit, freeLimit);

  const style = {
    "--rk-accent": accent,
    "--rk-accent-2": "#f59e0b",
    "--rk-surface": "#1c1c1c",
    "--rk-border": "rgba(255,255,255,0.06)",
    "--rk-text": "#e5e5e5",
    "--rk-text-2": "#a3a3a3",
    "--rk-muted": "#8a8a8a",
    "--rk-warning": "#f59e0b",
  } as CSSProperties;

  return (
    <section
      aria-labelledby={titleId}
      style={style}
      className={cn(
        "w-[440px] max-w-full flex flex-col rounded-[14px] border border-[var(--rk-border)] bg-[var(--rk-surface)] shadow-2xl overflow-hidden text-left",
        className,
      )}
    >
      {/* 標頭 */}
      <div className="relative shrink-0 px-5 py-4 bg-gradient-to-br from-[color-mix(in_srgb,var(--rk-accent)_20%,transparent)] to-[color-mix(in_srgb,var(--rk-accent-2)_20%,transparent)] border-b border-[var(--rk-border)]">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={l.close}
            className={cn("absolute right-3 top-3 text-[var(--rk-muted)] hover:text-[var(--rk-text)] transition-colors rounded-[8px] p-0.5", FOCUS)}
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}
        <div className="flex items-center gap-2.5 pr-6">
          <div className="w-9 h-9 shrink-0 rounded-lg bg-gradient-to-br from-[var(--rk-accent)] to-[var(--rk-accent-2)] flex items-center justify-center text-neutral-900">
            {isPro ? <CrownIcon className="w-5 h-5" /> : isBasic ? <UnlockIcon className="w-5 h-5" /> : isSupporter ? <CoffeeIcon className="w-5 h-5" /> : <ShieldCheckIcon className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h2 id={titleId} className="text-[var(--rk-text)] font-semibold text-sm">
              {l.title}
            </h2>
            <p className="text-[var(--rk-muted)] text-xs">
              {isPro ? l.proThanks : isBasic ? l.basicThanks : isSupporter ? l.supporterThanks : isTrial ? l.trialRemaining(days) : l.tierFree}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-5 space-y-4">
        {/* 讀不到授權狀態時最先講清楚，不把人丟到購買頁 */}
        {degraded && (
          <div role="alert" className="rounded-lg border border-[color-mix(in_srgb,var(--rk-warning)_40%,transparent)] bg-[color-mix(in_srgb,var(--rk-warning)_10%,transparent)] p-3 space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--rk-text)]">
              <AlertIcon className="w-3.5 h-3.5 shrink-0 text-[var(--rk-warning)]" />
              {l.degradedTitle}
            </p>
            <p className="text-[11px] text-[var(--rk-text-2)] leading-relaxed">{l.degradedBody}</p>
            <button
              type="button"
              onClick={handleRetryRead}
              disabled={busy !== null}
              className={cn("w-full py-2 rounded-lg text-xs font-medium border border-[var(--rk-border)] text-[var(--rk-text)] hover:bg-white/5 transition-colors disabled:opacity-50", FOCUS)}
            >
              {busy === "retry" ? <Spinner className="w-3.5 h-3.5 inline mr-1" /> : null}
              {l.degradedRetry}
            </button>
          </div>
        )}

        {/* 目前方案 */}
        <div className="rounded-lg border border-[var(--rk-border)] bg-black/10 p-3 flex items-center gap-3">
          {isPro ? (
            <CrownIcon className="w-5 h-5 text-amber-400 shrink-0" />
          ) : isBasic ? (
            <UnlockIcon className="w-5 h-5 text-amber-400 shrink-0" />
          ) : isSupporter ? (
            <CoffeeIcon className="w-5 h-5 text-amber-400 shrink-0" />
          ) : isTrial ? (
            <ClockIcon className="w-5 h-5 text-yellow-400 shrink-0" />
          ) : (
            <ShieldCheckIcon className="w-5 h-5 text-[var(--rk-muted)] shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[var(--rk-text)] font-medium">
              {isPro ? l.tierPro : isBasic ? l.tierBasic : isSupporter ? l.tierSupporter : isTrial ? l.tierTrial : l.tierFree}
              {isTrial && <span className="text-yellow-400 ml-1.5">{l.daysLeft(days)}</span>}
            </p>
            <p className="text-[11px] text-[var(--rk-muted)] truncate">
              {isPro || isBasic
                ? `${state.customerName ? `${state.customerName} · ` : ""}${state.maskedKey ?? ""}`
                : isSupporter
                  ? l.supporterNote
                  : isTrial
                    ? l.freeLimits
                    : freeSubtitle}
            </p>
          </div>
        </div>

        {showKeyControls ? (
          <div className="space-y-2">
            {/* grace / expired / invalid 各給一段說明，並把重新驗證抬成主要按鈕 */}
            {statusNotice && (
              <div className="rounded-lg border border-[color-mix(in_srgb,var(--rk-warning)_40%,transparent)] bg-[color-mix(in_srgb,var(--rk-warning)_10%,transparent)] px-3 py-2 text-[11px] text-[var(--rk-text-2)] flex items-start gap-1.5">
                <ClockIcon className="w-3.5 h-3.5 shrink-0 mt-px text-[var(--rk-warning)]" />
                <span>{statusNotice}</span>
              </div>
            )}
            {isBasic && pricing && (
              <button type="button" onClick={onPurchase} className={cn(PRIMARY_CTA, FOCUS)}>
                <CrownIcon className="w-4 h-4" />
                {l.upgradePro} · {pricing.current}
                <ExternalIcon className="w-3.5 h-3.5 opacity-70" />
              </button>
            )}
            {(state.needsRevalidation || statusNotice !== null) && (
              <button
                type="button"
                onClick={handleRevalidate}
                disabled={busy !== null}
                className={cn(
                  "w-full py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50",
                  FOCUS,
                  statusNotice
                    ? "bg-[var(--rk-accent)] text-[#111111] hover:brightness-110"
                    : "border border-[var(--rk-border)] text-[var(--rk-text-2)] hover:bg-white/5",
                )}
              >
                {busy === "revalidate" ? <Spinner className="w-3.5 h-3.5 inline mr-1" /> : null}
                {statusNotice ? l.revalidateNow : l.revalidate}
              </button>
            )}
            <button
              type="button"
              onClick={handleDeactivate}
              disabled={busy !== null}
              className={cn("w-full py-2 rounded-lg text-xs font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50", FOCUS)}
            >
              {busy === "deactivate" ? <Spinner className="w-3.5 h-3.5 inline mr-1" /> : null}
              {l.deactivate}
            </button>
          </div>
        ) : (
          <>
            {/* 免費 / 試用 / Supporter：升級區（degraded 時整塊拿掉） */}
            {!degraded && pricing && (
              <>
                <div className="rounded-lg border border-[color-mix(in_srgb,var(--rk-accent)_30%,transparent)] bg-gradient-to-b from-[color-mix(in_srgb,var(--rk-accent)_9%,transparent)] to-transparent p-3">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-2xl font-bold text-[var(--rk-text)] whitespace-nowrap">{pricing.current}</span>
                    {pricing.strike && <span className="text-sm text-[var(--rk-muted)] line-through whitespace-nowrap">{pricing.strike}</span>}
                    {pricing.earlyBird && (
                      <span className="ml-auto rounded-full bg-[color-mix(in_srgb,var(--rk-accent)_20%,transparent)] px-2 py-0.5 text-[10px] font-medium text-yellow-300 whitespace-nowrap">
                        {l.priceEarlyBirdBadge}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--rk-muted)]">{l.priceOneTime}</p>
                  <p className="mt-1.5 text-[10px] text-[var(--rk-muted)]">{l.priceSubnote}</p>
                  {pricing.competitorYearly && <p className="mt-0.5 text-[10px] text-yellow-300/80">{l.priceAnchor(pricing.competitorYearly)}</p>}
                  {pricing.checkoutNote && <p className="mt-1 text-[10px] text-[var(--rk-muted)]">{pricing.checkoutNote}</p>}
                </div>

                {pricing.basic && (
                  <div className="rounded-lg border border-[var(--rk-border)] bg-white/[0.03] p-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[var(--rk-text)] flex items-center gap-1.5">
                        <UnlockIcon className="w-3.5 h-3.5 text-[var(--rk-text-2)]" />
                        {l.unlockBasicTitle}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[var(--rk-muted)]">{l.priceBasicSubnote}</p>
                      <p className="mt-0.5 text-[10px] text-yellow-300/70">{l.basicWatermarkNote}</p>
                    </div>
                    <button
                      type="button"
                      onClick={onPurchaseBasic}
                      className={cn("shrink-0 px-3 py-2 rounded-lg border border-[var(--rk-border)] text-[var(--rk-text)] text-xs font-medium hover:bg-white/5 transition-colors whitespace-nowrap", FOCUS)}
                    >
                      {l.upgradeBasic} · {pricing.basic}
                    </button>
                  </div>
                )}

                <div className="rounded-lg border border-[color-mix(in_srgb,var(--rk-accent)_20%,transparent)] bg-[color-mix(in_srgb,var(--rk-accent)_6%,transparent)] p-3">
                  <p className="text-xs font-medium text-[var(--rk-text)] mb-2 flex items-center gap-1.5">
                    <CrownIcon className="w-3.5 h-3.5 text-amber-400" />
                    {l.unlockTitle}
                  </p>
                  <ul className="space-y-1">
                    {proFeatures.map((f) => (
                      <li key={f} className="text-[11px] text-[var(--rk-text-2)] flex items-center gap-1.5">
                        <CheckIcon className="w-3 h-3 text-neutral-300 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* 輸入金鑰：同一格收 12 碼兌換碼與 UUID 授權碼 */}
            <div className="space-y-2">
              <label htmlFor={inputId} className="block text-xs text-[var(--rk-text-2)] font-medium">
                {l.haveKey}
              </label>
              <div className="flex gap-2">
                <input
                  id={inputId}
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleActivate();
                  }}
                  placeholder={l.placeholder}
                  aria-describedby={kind ? kindId : undefined}
                  autoComplete="off"
                  spellCheck={false}
                  disabled={busy !== null || !available}
                  className="min-w-0 flex-1 px-3 py-2 rounded-lg bg-black/20 border border-[var(--rk-border)] text-[var(--rk-text)] text-xs placeholder:text-[var(--rk-muted)] focus:outline-none focus:border-[color-mix(in_srgb,var(--rk-accent)_60%,transparent)] transition-colors disabled:opacity-50 font-mono"
                />
                <button
                  type="button"
                  onClick={() => void handleActivate()}
                  disabled={busy !== null || !key.trim() || !available}
                  aria-busy={busy === "activate"}
                  className={cn("px-4 py-2 rounded-lg bg-[var(--rk-accent)] hover:brightness-110 text-neutral-900 text-xs font-medium transition-colors disabled:opacity-40 shrink-0", FOCUS)}
                >
                  {busy === "activate" ? <Spinner className="w-3.5 h-3.5" /> : l.activate}
                </button>
              </div>
              {kind && (
                <p id={kindId} className="text-[10px] text-[var(--rk-muted)]">
                  {kind === "pro" ? l.detectedPro : l.detectedSupporter}
                </p>
              )}
            </div>

            {!degraded && pricing && (
              <button type="button" onClick={onPurchase} className={cn(PRIMARY_CTA, FOCUS)}>
                <CrownIcon className="w-4 h-4" />
                {l.upgradePro} · {pricing.current}
                <ExternalIcon className="w-3.5 h-3.5 opacity-70" />
              </button>
            )}
          </>
        )}

        {/* 訊息 */}
        <div role="status" aria-live="polite">
          {message && (
            <div
              className={cn(
                "text-xs px-3 py-2 rounded-lg flex items-center gap-1.5",
                message.type === "ok"
                  ? "bg-neutral-700/30 text-neutral-200 border border-neutral-600/40"
                  : "bg-red-500/10 text-red-400 border border-red-500/20",
              )}
            >
              {message.type === "ok" ? <CheckIcon className="w-3.5 h-3.5 shrink-0" /> : <XIcon className="w-3.5 h-3.5 shrink-0" />}
              <span className="min-w-0">
                {message.text}
                {message.hint && <span className="mt-1 block text-[var(--rk-text-2)]">{message.hint}</span>}
              </span>
            </div>
          )}
        </div>

        {!available && <p className="text-[10px] text-[var(--rk-muted)] text-center">{l.desktopOnly}</p>}

        {footer}
      </div>
    </section>
  );
}
