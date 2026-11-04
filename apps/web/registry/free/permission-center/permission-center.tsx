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

export const defaultPermissionLabels: PermissionCenterLabels = {
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
};

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
  labels?: Partial<PermissionCenterLabels>;
  className?: string;
}

export function PermissionCenter({ permissions, loading = false, onRequest, onOpenSettings, hideHeading, accent, labels, className }: PermissionCenterProps) {
  const l = { ...defaultPermissionLabels, ...labels };
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
