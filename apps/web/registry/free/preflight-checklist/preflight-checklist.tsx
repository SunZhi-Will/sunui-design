"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/*
 * 錄製前檢查：底部即時檢查列 + 主 CTA，以及產生檢查項的純函式。
 * 移植自 KapZoom 的 PreflightChecklist.tsx 與 preflightChecks.ts。
 * 檢查結果放在 CTA 旁邊而不是彈 dialog：錄製前的問題幾乎都是「知道就好」，不值得中斷。
 */

/* ---------- 主題 token（KapZoom 暗色，數值照原本的 index.css） ---------- */

export function preflightTheme(accent = "#eab308", accentHover = "#facc15"): CSSProperties {
  return {
    "--pf-accent": accent,
    "--pf-accent-hover": accentHover,
    "--pf-accent-fg": "#111111",
    "--pf-bg-app": "#111111",
    "--pf-surface": "#1c1c1c",
    "--pf-elevated": "#252525",
    "--pf-sunken": "#0a0a0a",
    "--pf-text": "#e5e5e5",
    "--pf-text-2": "#a3a3a3",
    "--pf-muted": "#8a8a8a",
    "--pf-border": "rgba(255, 255, 255, 0.06)",
    "--pf-success": "#22c55e",
    "--pf-warning": "#f59e0b",
    "--pf-danger": "#dc2626",
  } as CSSProperties;
}

export const PF_FOCUS = "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pf-accent)]";

/* ---------- lucide 圖示的 inline 版本 ---------- */

type IconProps = { className?: string; style?: CSSProperties };
const icon = (children: ReactNode) =>
  function Icon({ className, style }: IconProps) {
    return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={style}
    >
      {children}
    </svg>
    );
  };

export const Icons = {
  ShieldCheck: icon(
    <>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </>,
  ),
  Info: icon(
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </>,
  ),
  AlertTriangle: icon(
    <>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4M12 17h.01" />
    </>,
  ),
  CircleAlert: icon(
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </>,
  ),
  ChevronDown: icon(<path d="m6 9 6 6 6-6" />),
};

/* ---------- 檢查項 ---------- */

export type PermissionState = "not-determined" | "granted" | "denied" | "restricted" | "restart-required" | "unknown";
export type MicHealth = "idle" | "probing" | "ok" | "silent" | "clipping" | "unavailable";
export type PreflightSeverity = "ok" | "info" | "warning" | "blocker";
export type SettingsPane = "screen" | "microphone" | "camera";
export type PreflightAction = { kind: "open-settings"; pane: SettingsPane } | { kind: "retry" };

export interface PreflightCheck {
  id: string;
  severity: PreflightSeverity;
  message: string;
  action?: PreflightAction;
}

export interface PreflightCheckLabels {
  screenDenied: string;
  screenNotDetermined: string;
  sourceLoading: string;
  sourceMissing: string;
  regionMissing: string;
  sourceReady: (name: string) => string;
  boundsPending: string;
  micDenied: string;
  micUnavailable: string;
  micSilent: string;
  micClipping: string;
  micOk: string;
  clickCaptureDegraded: string;
  cameraDenied: string;
  diskUnknown: string;
  diskLow: (time: string) => string;
  diskEstimate: (time: string) => string;
  privacyRegion: string;
  privacyWindow: string;
  privacyEntireScreen: string;
  privacySensitive: (titles: string, count: number) => string;
  startFailed: (message: string) => string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const CHECK_MESSAGES: Record<SunLocale, PreflightCheckLabels> = {
  en: {
    screenDenied: "Screen recording permission is required before you can record",
    screenNotDetermined: "Screen Recording permission has not been granted yet, no screens are available",
    sourceLoading: "Loading available sources…",
    sourceMissing: "Choose what to record first",
    regionMissing: "Select the region to record first",
    sourceReady: (name) => `Recording: ${name}`,
    boundsPending: "Source selected, bounds still calibrating in the background",
    micDenied: "Microphone permission not granted, this recording will have no voice",
    micUnavailable: "No usable microphone, this recording will have no voice",
    micSilent: "Microphone is silent, check the device and its mute switch",
    micClipping: "Microphone is too loud and may distort",
    micOk: "Microphone is fine",
    clickCaptureDegraded: "The click detector did not start, so auto-zoom will be off (reinstalling fixes this)",
    cameraDenied: "Camera permission not granted, no webcam in this recording",
    diskUnknown: "Cannot estimate free space",
    diskLow: (t) => `Low disk space, about ${t} of recording left`,
    diskEstimate: (t) => `About ${t} of recording at this quality`,
    privacyRegion: "Only the selected region is captured",
    privacyWindow: "Only this window is captured",
    privacyEntireScreen: "The whole screen is captured, including notifications and other windows",
    privacySensitive: (titles, count) => `Windows that may contain secrets are open (${titles} and ${count} total)`,
    startFailed: (m) => `Last start failed: ${m}`,
  },
  "zh-TW": {
    screenDenied: "需要先授予螢幕錄製權限才能開始錄製",
    screenNotDetermined: "尚未授予螢幕錄製權限，目前沒有可用的螢幕",
    sourceLoading: "正在載入可用來源…",
    sourceMissing: "請先選擇要錄製的內容",
    regionMissing: "請先框選要錄製的範圍",
    sourceReady: (name) => `錄製來源：${name}`,
    boundsPending: "已選好來源，邊界仍在背景校正中",
    micDenied: "未授予麥克風權限，這次錄製不會有聲音",
    micUnavailable: "沒有可用的麥克風，這次錄製不會有聲音",
    micSilent: "麥克風沒有聲音，請檢查裝置與靜音開關",
    micClipping: "麥克風音量過大，可能會破音",
    micOk: "麥克風正常",
    clickCaptureDegraded: "點擊偵測沒有啟動，自動縮放將關閉（重新安裝即可修復）",
    cameraDenied: "未授予攝影機權限，這次錄製不會有鏡頭畫面",
    diskUnknown: "無法估算剩餘空間",
    diskLow: (t) => `磁碟空間不足，大約只能再錄 ${t}`,
    diskEstimate: (t) => `以目前畫質大約可錄 ${t}`,
    privacyRegion: "只會錄下選取的範圍",
    privacyWindow: "只會錄下這個視窗",
    privacyEntireScreen: "會錄下整個螢幕，包含通知與其他視窗",
    privacySensitive: (titles, count) => `有視窗可能含有機密資訊（${titles}，共 ${count} 個）`,
    startFailed: (m) => `上次啟動失敗：${m}`,
  },
  "zh-CN": {
    screenDenied: "需要先授予屏幕录制权限才能开始录制",
    screenNotDetermined: "尚未授予屏幕录制权限，当前没有可用的屏幕",
    sourceLoading: "正在加载可用来源…",
    sourceMissing: "请先选择要录制的内容",
    regionMissing: "请先框选要录制的区域",
    sourceReady: (name) => `录制来源：${name}`,
    boundsPending: "已选好来源，边界仍在后台校准中",
    micDenied: "未授予麦克风权限，本次录制将没有声音",
    micUnavailable: "没有可用的麦克风，本次录制将没有声音",
    micSilent: "麦克风没有声音，请检查设备和静音开关",
    micClipping: "麦克风音量过大，可能会爆音",
    micOk: "麦克风正常",
    clickCaptureDegraded: "点击检测未启动，自动缩放将关闭（重新安装即可修复）",
    cameraDenied: "未授予摄像头权限，本次录制将没有摄像头画面",
    diskUnknown: "无法估算剩余空间",
    diskLow: (t) => `磁盘空间不足，大约只能再录 ${t}`,
    diskEstimate: (t) => `按当前画质大约可录 ${t}`,
    privacyRegion: "只会录下所选区域",
    privacyWindow: "只会录下这个窗口",
    privacyEntireScreen: "会录下整个屏幕，包括通知和其他窗口",
    privacySensitive: (titles, count) => `有窗口可能包含敏感信息（${titles}，共 ${count} 个）`,
    startFailed: (m) => `上次启动失败：${m}`,
  },
  ja: {
    screenDenied: "録画するには画面収録の許可が必要です",
    screenNotDetermined: "画面収録がまだ許可されていないため、使える画面がありません",
    sourceLoading: "利用できるソースを読み込み中…",
    sourceMissing: "まず録画する対象を選んでください",
    regionMissing: "まず録画する範囲を選択してください",
    sourceReady: (name) => `録画対象：${name}`,
    boundsPending: "ソースを選択済み、範囲はバックグラウンドで調整中です",
    micDenied: "マイクが許可されていないため、この録画には音声が入りません",
    micUnavailable: "使えるマイクがないため、この録画には音声が入りません",
    micSilent: "マイクが無音です。デバイスとミュートスイッチを確認してください",
    micClipping: "マイクの音量が大きすぎて、音割れするおそれがあります",
    micOk: "マイクは正常です",
    clickCaptureDegraded: "クリック検出が起動しなかったため、自動ズームはオフになります（再インストールで直ります）",
    cameraDenied: "カメラが許可されていないため、この録画にはカメラ映像が入りません",
    diskUnknown: "空き容量を見積もれません",
    diskLow: (t) => `空き容量が少なく、録画できるのは残り約 ${t} です`,
    diskEstimate: (t) => `この画質で約 ${t} 録画できます`,
    privacyRegion: "選択した範囲だけを収録します",
    privacyWindow: "このウィンドウだけを収録します",
    privacyEntireScreen: "通知や他のウィンドウも含め、画面全体を収録します",
    privacySensitive: (titles, count) => `機密情報を含む可能性のあるウィンドウが開いています（${titles}、計 ${count} 件）`,
    startFailed: (m) => `前回の開始に失敗しました：${m}`,
  },
};

/** 英文預設字串，保留舊的匯出名稱 */
export const defaultCheckLabels: PreflightCheckLabels = CHECK_MESSAGES.en;

const DURATION_UNITS: Record<SunLocale, { hour: string; minute: string; second: string }> = {
  en: { hour: "h", minute: "min", second: "sec" },
  "zh-TW": { hour: "小時", minute: "分鐘", second: "秒" },
  "zh-CN": { hour: "小时", minute: "分钟", second: "秒" },
  ja: { hour: "時間", minute: "分", second: "秒" },
};

/** 低於這個可錄時間就提出警告（10 分鐘） */
export const DISK_WARNING_SECONDS = 10 * 60;
export const MIC_SILENT_THRESHOLD = 3;
export const MIC_CLIPPING_THRESHOLD = 97;

/** 一段取樣判斷麥克風狀態：講話本來就有停頓，單看一幀幾乎一定是靜音 */
export function classifyMicLevels(samples: readonly number[], minSamples = 5): MicHealth {
  if (samples.length < minSamples) return "probing";
  const peak = samples.reduce((max, v) => (v > max ? v : max), 0);
  if (peak >= MIC_CLIPPING_THRESHOLD) return "clipping";
  if (peak < MIC_SILENT_THRESHOLD) return "silent";
  return "ok";
}

export function formatDurationShort(totalSeconds: number, units = { hour: "h", minute: "min", second: "sec" }): string {
  if (totalSeconds < 60) return `${Math.max(0, Math.floor(totalSeconds))} ${units.second}`;
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) return `${minutes} ${units.minute}`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} ${units.hour}` : `${hours} ${units.hour} ${rest} ${units.minute}`;
}

const SENSITIVE_TITLE_KEYWORDS = [
  "password", "passwd", "1password", "bitwarden", "lastpass", "keychain", "keepass", "authenticator",
  "wallet", "banking", "bank of", "credit card", "secret", "private key",
  "密碼", "金鑰", "網路銀行", "信用卡", "鑰匙圈",
];

/** 掃描標題看起來敏感的視窗；只回報，不阻擋 */
export function scanSensitiveWindows(sources: readonly { id: string; name: string; kind?: string }[]): string[] {
  return sources
    .filter((s) => s.kind !== "screen" && !s.id.includes("screen"))
    .filter((s) => SENSITIVE_TITLE_KEYWORDS.some((k) => s.name.toLowerCase().includes(k)))
    .map((s) => s.name);
}

export interface PreflightInput {
  sourcesLoading: boolean;
  loadedSourceCount: number;
  selectedSourceId: string | null;
  selectedSourceName: string | null;
  sourceKind: "screen" | "window" | "region";
  hasRegion: boolean;
  boundsPending: boolean;
  screenPermission: PermissionState;
  micPermission: PermissionState;
  cameraPermission: PermissionState;
  micEnabled: boolean;
  cameraEnabled: boolean;
  micHealth: MicHealth;
  clickCaptureDegraded: boolean;
  freeDiskBytes: number | null;
  bytesPerSecond: number;
  sensitiveWindowTitles: readonly string[];
  startError: string | null;
  formatDuration?: (seconds: number) => string;
  /** 訊息語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
}

const blocked = (s: PermissionState) => s === "denied" || s === "restricted";

/** 順序即顯示順序：先講「能不能開始」，再講「開始之後會怎樣」 */
export function buildPreflightChecks(input: PreflightInput, labels: Partial<PreflightCheckLabels> = {}): PreflightCheck[] {
  const loc = resolveLocale(input.locale);
  const l = { ...CHECK_MESSAGES[loc], ...labels };
  const fmt = input.formatDuration ?? ((s: number) => formatDurationShort(s, DURATION_UNITS[loc]));
  const checks: PreflightCheck[] = [];

  // ① 螢幕錄製權限
  if (blocked(input.screenPermission)) {
    checks.push({ id: "permission-screen", severity: "blocker", message: l.screenDenied, action: { kind: "open-settings", pane: "screen" } });
  } else if (input.screenPermission === "not-determined" && !input.sourcesLoading && input.loadedSourceCount === 0) {
    // 還沒問過且一個來源都列不出來，實際上是死路
    checks.push({ id: "permission-screen-not-determined", severity: "blocker", message: l.screenNotDetermined, action: { kind: "open-settings", pane: "screen" } });
  }

  // ② 來源狀態
  if (input.sourcesLoading && input.loadedSourceCount === 0) {
    checks.push({ id: "source-loading", severity: "info", message: l.sourceLoading });
  } else if (!input.selectedSourceId) {
    checks.push({ id: "source-missing", severity: "blocker", message: l.sourceMissing });
  } else if (input.sourceKind === "region" && !input.hasRegion) {
    checks.push({ id: "region-missing", severity: "blocker", message: l.regionMissing });
  } else {
    checks.push({ id: "source-ready", severity: "ok", message: l.sourceReady(input.selectedSourceName ?? "") });
  }

  // ③ 邊界校正：明說「不影響開始」
  if (input.boundsPending) checks.push({ id: "bounds-pending", severity: "info", message: l.boundsPending });

  // ④ 麥克風：只有打算錄音時才值得警告
  if (input.micEnabled) {
    if (blocked(input.micPermission)) {
      checks.push({ id: "permission-mic", severity: "warning", message: l.micDenied, action: { kind: "open-settings", pane: "microphone" } });
    } else if (input.micHealth === "unavailable") {
      checks.push({ id: "mic-unavailable", severity: "warning", message: l.micUnavailable });
    } else if (input.micHealth === "silent") {
      checks.push({ id: "mic-silent", severity: "warning", message: l.micSilent });
    } else if (input.micHealth === "clipping") {
      checks.push({ id: "mic-clipping", severity: "warning", message: l.micClipping });
    } else if (input.micHealth === "ok") {
      checks.push({ id: "mic-ok", severity: "ok", message: l.micOk });
    }
  }

  // ④.5 點擊偵測降級：不擋錄製，但自動縮放會失效
  if (input.clickCaptureDegraded) checks.push({ id: "click-capture-degraded", severity: "warning", message: l.clickCaptureDegraded });

  // ⑤ 攝影機
  if (input.cameraEnabled && blocked(input.cameraPermission)) {
    checks.push({ id: "permission-camera", severity: "warning", message: l.cameraDenied, action: { kind: "open-settings", pane: "camera" } });
  }

  // ⑥ 磁碟：永遠只到 warning，估值不拿來擋人
  const recordable =
    input.freeDiskBytes === null || !Number.isFinite(input.freeDiskBytes) || input.freeDiskBytes < 0 || input.bytesPerSecond <= 0
      ? null
      : Math.floor(input.freeDiskBytes / input.bytesPerSecond);
  if (recordable === null) checks.push({ id: "disk-unknown", severity: "info", message: l.diskUnknown });
  else if (recordable < DISK_WARNING_SECONDS) checks.push({ id: "disk-low", severity: "warning", message: l.diskLow(fmt(recordable)) });
  else checks.push({ id: "disk-ok", severity: "ok", message: l.diskEstimate(fmt(recordable)) });

  // ⑦ 隱私
  if (input.selectedSourceId) {
    const region = input.sourceKind === "region" && input.hasRegion;
    const whole = !region && input.sourceKind !== "window";
    checks.push({
      id: "privacy-scope",
      severity: whole ? "info" : "ok",
      message: region ? l.privacyRegion : input.sourceKind === "window" ? l.privacyWindow : l.privacyEntireScreen,
    });
  }
  // 敏感視窗只有在整個螢幕入鏡時才構成風險
  if (input.sensitiveWindowTitles.length > 0 && input.sourceKind !== "window" && !(input.sourceKind === "region" && input.hasRegion)) {
    checks.push({
      id: "privacy-sensitive",
      severity: "warning",
      message: l.privacySensitive(input.sensitiveWindowTitles.slice(0, 3).join(", "), input.sensitiveWindowTitles.length),
    });
  }

  // ⑧ 啟動失敗：描述的是「剛剛」，排最後
  if (input.startError) {
    checks.push({ id: "start-error", severity: "warning", message: l.startFailed(input.startError), action: { kind: "retry" } });
  }
  return checks;
}

export const isStartBlocked = (checks: readonly PreflightCheck[]) => checks.some((c) => c.severity === "blocker");

/* ---------- 底部檢查列 + 主 CTA ---------- */

const SEVERITY_COLOR: Record<PreflightSeverity, string> = {
  ok: "var(--pf-success)",
  info: "var(--pf-muted)",
  warning: "var(--pf-warning)",
  blocker: "var(--pf-danger)",
};
const SEVERITY_ICON = { ok: Icons.ShieldCheck, info: Icons.Info, warning: Icons.AlertTriangle, blocker: Icons.CircleAlert };

export interface PreflightChecklistLabels {
  checksLabel: string;
  detailsToggle: (count: number) => string;
  openSettings: string;
  retry: string;
  startRecording: string;
  pleaseWait: string;
}

const CHECKLIST_MESSAGES: Record<SunLocale, PreflightChecklistLabels> = {
  en: {
    checksLabel: "Live checks",
    detailsToggle: (n) => `${n} look fine`,
    openSettings: "Open System Settings",
    retry: "Retry",
    startRecording: "Start Recording",
    pleaseWait: "Please wait...",
  },
  "zh-TW": {
    checksLabel: "即時檢查",
    detailsToggle: (n) => `${n} 項正常`,
    openSettings: "打開系統設定",
    retry: "重試",
    startRecording: "開始錄製",
    pleaseWait: "請稍候...",
  },
  "zh-CN": {
    checksLabel: "实时检查",
    detailsToggle: (n) => `${n} 项正常`,
    openSettings: "打开系统设置",
    retry: "重试",
    startRecording: "开始录制",
    pleaseWait: "请稍候...",
  },
  ja: {
    checksLabel: "リアルタイムチェック",
    detailsToggle: (n) => `${n} 件は問題なし`,
    openSettings: "システム設定を開く",
    retry: "再試行",
    startRecording: "録画を開始",
    pleaseWait: "お待ちください...",
  },
};

/** 英文預設字串，保留舊的匯出名稱 */
export const defaultChecklistLabels: PreflightChecklistLabels = CHECKLIST_MESSAGES.en;

function CheckItem({
  check,
  l,
  onOpenSettings,
  onRetry,
}: {
  check: PreflightCheck;
  l: PreflightChecklistLabels;
  onOpenSettings?: (pane: SettingsPane) => void;
  onRetry?: () => void;
}) {
  const Icon = SEVERITY_ICON[check.severity];
  const action = check.action;
  const link = cn("text-[11px] underline text-[var(--pf-accent)] hover:text-[var(--pf-accent-hover)] shrink-0 rounded-[8px]", PF_FOCUS);
  return (
    <li className="flex items-center gap-1.5 min-w-0">
      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: SEVERITY_COLOR[check.severity] }} />
      <span
        className="text-[11px] truncate max-w-[320px]"
        style={{ color: check.severity === "ok" || check.severity === "info" ? "var(--pf-text-2)" : SEVERITY_COLOR[check.severity] }}
        title={check.message}
      >
        {check.message}
      </span>
      {action?.kind === "open-settings" && onOpenSettings && (
        <button type="button" onClick={() => onOpenSettings(action.pane)} className={link}>
          {l.openSettings}
        </button>
      )}
      {action?.kind === "retry" && onRetry && (
        <button type="button" onClick={onRetry} className={link}>
          {l.retry}
        </button>
      )}
    </li>
  );
}

export interface PreflightChecklistProps {
  checks: readonly PreflightCheck[];
  /** 預設依有無 blocker 決定 */
  startDisabled?: boolean;
  isConfirming?: boolean;
  onStart: () => void;
  onOpenSettings?: (pane: SettingsPane) => void;
  onRetry?: () => void;
  accent?: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<PreflightChecklistLabels>;
  className?: string;
}

export function PreflightChecklist({
  checks,
  startDisabled,
  isConfirming = false,
  onStart,
  onOpenSettings,
  onRetry,
  accent,
  locale = "en",
  labels,
  className,
}: PreflightChecklistProps) {
  const l = { ...CHECKLIST_MESSAGES[resolveLocale(locale)], ...labels };
  // 「正常/資訊」預設收合，只有 warning／blocker 常駐顯示，免得重要的警告被淹沒
  const [showSecondary, setShowSecondary] = useState(false);
  const primary = checks.filter((c) => c.severity === "warning" || c.severity === "blocker");
  const secondary = checks.filter((c) => c.severity === "ok" || c.severity === "info");
  const disabled = (startDisabled ?? isStartBlocked(checks)) || isConfirming;

  return (
    <div style={preflightTheme(accent)} className={cn("px-4 pt-1.5 pb-2.5 flex items-center gap-4", className)}>
      <ul aria-label={l.checksLabel} aria-live="polite" className="flex-1 min-w-0 flex flex-wrap items-center gap-x-4 gap-y-1">
        {primary.map((c) => (
          <CheckItem key={c.id} check={c} l={l} onOpenSettings={onOpenSettings} onRetry={onRetry} />
        ))}
        {secondary.length > 0 && (
          <li className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowSecondary((p) => !p)}
              aria-expanded={showSecondary}
              className={cn("flex items-center gap-1 text-[11px] text-[var(--pf-muted)] hover:text-[var(--pf-text-2)] transition-colors rounded-[8px]", PF_FOCUS)}
            >
              <Icons.ShieldCheck className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--pf-success)" }} />
              {l.detailsToggle(secondary.length)}
              <Icons.ChevronDown className={cn("w-3 h-3 shrink-0 transition-transform motion-reduce:transition-none", showSecondary && "rotate-180")} />
            </button>
            {showSecondary && (
              <ul className="absolute bottom-full left-0 mb-2 w-max max-w-[min(24rem,calc(100vw-2rem))] flex flex-col gap-1 p-2.5 rounded-[14px] border border-[var(--pf-border)] bg-[var(--pf-elevated)] shadow-lg z-10">
                {secondary.map((c) => (
                  <CheckItem key={c.id} check={c} l={l} onOpenSettings={onOpenSettings} onRetry={onRetry} />
                ))}
              </ul>
            )}
          </li>
        )}
      </ul>

      <button
        type="button"
        onClick={onStart}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-[8px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-base shrink-0",
          "bg-[var(--pf-accent)] text-[var(--pf-accent-fg)] enabled:hover:bg-[var(--pf-accent-hover)]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pf-surface)]",
        )}
      >
        {isConfirming ? (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 border border-current/40 border-t-current rounded-full motion-safe:animate-spin inline-block" />
            {l.pleaseWait}
          </span>
        ) : (
          l.startRecording
        )}
      </button>
    </div>
  );
}
