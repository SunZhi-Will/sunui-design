"use client";

import { type CSSProperties } from "react";

import { cn } from "@/lib/utils";

/*
 * macOS 權限面板：螢幕錄製、麥克風、攝影機的目前狀態，以及請求或開系統設定的動作。
 * 移植自 KapZoom 的 PermissionCenter.tsx。
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

export type PermissionState = "not-determined" | "granted" | "denied" | "restricted" | "restart-required" | "unknown";

/* ---------- 權限面板 ---------- */

export type PermissionKey = "screenRecording" | "microphone" | "camera";

export interface PermissionSnapshot {
  key: PermissionKey;
  state: Exclude<PermissionState, "unknown">;
  required: boolean;
}

export interface PermissionCenterLabels {
  title: string;
  checking: string;
  current: string;
  required: string;
  blockedRequired: string;
  degradedOptional: string;
  request: string;
  openSettings: string;
  label: Record<PermissionKey, string>;
  desc: Record<PermissionKey, string>;
  state: Record<PermissionSnapshot["state"], string>;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, PermissionCenterLabels> = {
  en: {
    title: "macOS permissions",
    checking: "Checking current permission status…",
    current: "Current permission status.",
    required: "required",
    blockedRequired: "Screen recording is blocked until this is granted.",
    degradedOptional: "Screen-only recording still works without this.",
    request: "Request",
    openSettings: "Open System Settings",
    label: { screenRecording: "Screen & system audio recording", microphone: "Microphone", camera: "Camera" },
    desc: {
      screenRecording: "Required to capture your screen. On macOS this single grant also covers system audio, there is no separate \"system audio\" permission.",
      microphone: "Optional. Lets you record your voice alongside the screen.",
      camera: "Optional. Lets you overlay a webcam bubble while recording.",
    },
    state: {
      "not-determined": "Not requested yet",
      granted: "Granted",
      denied: "Denied",
      restricted: "Restricted by system policy",
      "restart-required": "Granted, restart the app to use it",
    },
  },
  "zh-TW": {
    title: "macOS 權限",
    checking: "正在檢查目前的權限狀態…",
    current: "目前的權限狀態。",
    required: "必要",
    blockedRequired: "授權之前無法錄製螢幕。",
    degradedOptional: "沒有這項權限仍可只錄螢幕。",
    request: "請求權限",
    openSettings: "打開系統設定",
    label: { screenRecording: "螢幕與系統錄音", microphone: "麥克風", camera: "相機" },
    desc: {
      screenRecording: "擷取螢幕畫面時必要。在 macOS 上這一項授權也涵蓋系統聲音，沒有另外的「系統聲音」權限。",
      microphone: "選用。可以在錄螢幕時同時錄下你的聲音。",
      camera: "選用。錄製時可以疊上視訊鏡頭的小圓框。",
    },
    state: {
      "not-determined": "尚未請求",
      granted: "已授權",
      denied: "已拒絕",
      restricted: "受系統原則限制",
      "restart-required": "已授權，重新啟動 app 後生效",
    },
  },
  "zh-CN": {
    title: "macOS 权限",
    checking: "正在检查当前权限状态…",
    current: "当前的权限状态。",
    required: "必需",
    blockedRequired: "授权之前无法录屏。",
    degradedOptional: "没有这项权限仍可只录屏幕。",
    request: "请求权限",
    openSettings: "打开系统设置",
    label: { screenRecording: "录屏与系统录音", microphone: "麦克风", camera: "摄像头" },
    desc: {
      screenRecording: "录制屏幕时必需。在 macOS 上这一项授权也包含系统声音，没有单独的“系统声音”权限。",
      microphone: "可选。录屏时可以同时录下你的声音。",
      camera: "可选。录制时可以叠加摄像头小圆窗。",
    },
    state: {
      "not-determined": "尚未请求",
      granted: "已授权",
      denied: "已拒绝",
      restricted: "受系统策略限制",
      "restart-required": "已授权，重启应用后生效",
    },
  },
  ja: {
    title: "macOS のアクセス権",
    checking: "現在のアクセス権を確認しています…",
    current: "現在のアクセス権の状態です。",
    required: "必須",
    blockedRequired: "許可されるまで画面収録はできません。",
    degradedOptional: "許可がなくても画面だけの収録はできます。",
    request: "許可を求める",
    openSettings: "システム設定を開く",
    label: { screenRecording: "画面収録とシステムオーディオ録音", microphone: "マイク", camera: "カメラ" },
    desc: {
      screenRecording: "画面の収録に必要です。macOS ではこの許可でシステムオーディオも含まれ、別の「システムオーディオ」権限はありません。",
      microphone: "任意。画面と一緒に自分の声を録音できます。",
      camera: "任意。収録中に Web カメラの小窓を重ねられます。",
    },
    state: {
      "not-determined": "未リクエスト",
      granted: "許可済み",
      denied: "拒否",
      restricted: "システムのポリシーで制限",
      "restart-required": "許可済み、アプリの再起動後に有効",
    },
  },
};

/** 英文預設字串（保留舊的匯出名稱） */
export const defaultPermissionLabels: PermissionCenterLabels = MESSAGES.en;

const STATE_DOT: Record<PermissionSnapshot["state"], string> = {
  "not-determined": "bg-[var(--pf-muted)]",
  granted: "bg-[var(--pf-success)]",
  denied: "bg-[var(--pf-danger)]",
  restricted: "bg-[var(--pf-danger)]",
  "restart-required": "bg-[var(--pf-warning)]",
};

export interface PermissionCenterProps {
  permissions: PermissionSnapshot[];
  loading?: boolean;
  /** 只有麥克風與攝影機能由 app 直接請求；螢幕錄製只能開系統設定 */
  onRequest?: (key: PermissionKey) => void;
  onOpenSettings: (key: PermissionKey) => void;
  hideHeading?: boolean;
  accent?: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<PermissionCenterLabels>;
  className?: string;
}

export function PermissionCenter({ permissions, loading = false, onRequest, onOpenSettings, hideHeading, accent, locale = "en", labels, className }: PermissionCenterProps) {
  const l = { ...MESSAGES[resolveLocale(locale)], ...labels };
  return (
    <div style={preflightTheme(accent)} className={cn("flex flex-col gap-2 text-left", className)}>
      {!hideHeading && (
        <div>
          <h2 className="text-sm font-semibold text-[var(--pf-text)]">{l.title}</h2>
          <p className="text-[11px] text-[var(--pf-muted)]">{loading ? l.checking : l.current}</p>
        </div>
      )}
      {permissions.map((p) => {
        const canRequest = onRequest && (p.key === "microphone" || p.key === "camera");
        const degrade = p.state === "granted" ? null : p.required ? l.blockedRequired : l.degradedOptional;
        return (
          <div key={p.key} data-state={p.state} className="flex flex-col gap-1 rounded-[8px] border border-[var(--pf-border)] bg-[var(--pf-elevated)] p-3">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <div className="flex items-center gap-2 min-w-0">
                <span aria-hidden="true" className={cn("inline-block h-2.5 w-2.5 shrink-0 rounded-full", STATE_DOT[p.state])} />
                <span className="text-xs font-medium text-[var(--pf-text)]">{l.label[p.key]}</span>
                {p.required && <span className="rounded bg-[var(--pf-surface)] px-1.5 py-0.5 text-[10px] text-[var(--pf-muted)]">{l.required}</span>}
              </div>
              <span className="text-[11px] text-[var(--pf-muted)]">{l.state[p.state]}</span>
            </div>
            <p className="text-[11px] text-[var(--pf-muted)]">{l.desc[p.key]}</p>
            {degrade && <p className={cn("text-[11px]", p.required ? "text-[var(--pf-danger)]" : "text-[var(--pf-muted)]")}>{degrade}</p>}
            {p.state !== "granted" && (
              <div className="mt-1 flex flex-wrap gap-2">
                {canRequest && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => onRequest(p.key)}
                    className={cn("rounded-[8px] bg-[var(--pf-accent)] px-3 py-1 text-[11px] text-[var(--pf-accent-fg)] disabled:opacity-50", PF_FOCUS)}
                  >
                    {l.request}
                  </button>
                )}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => onOpenSettings(p.key)}
                  className={cn("rounded-[8px] border border-[var(--pf-border)] px-3 py-1 text-[11px] text-[var(--pf-text)] disabled:opacity-50", PF_FOCUS)}
                >
                  {l.openSettings}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
