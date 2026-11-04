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

export const defaultCheckLabels: PreflightCheckLabels = {
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
}

const blocked = (s: PermissionState) => s === "denied" || s === "restricted";

/** 順序即顯示順序：先講「能不能開始」，再講「開始之後會怎樣」 */
export function buildPreflightChecks(input: PreflightInput, labels: Partial<PreflightCheckLabels> = {}): PreflightCheck[] {
  const l = { ...defaultCheckLabels, ...labels };
  const fmt = input.formatDuration ?? ((s: number) => formatDurationShort(s));
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

export const defaultChecklistLabels: PreflightChecklistLabels = {
  checksLabel: "Live checks",
  detailsToggle: (n) => `${n} look fine`,
  openSettings: "Open System Settings",
  retry: "Retry",
  startRecording: "Start Recording",
  pleaseWait: "Please wait...",
};

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
  labels,
  className,
}: PreflightChecklistProps) {
  const l = { ...defaultChecklistLabels, ...labels };
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
