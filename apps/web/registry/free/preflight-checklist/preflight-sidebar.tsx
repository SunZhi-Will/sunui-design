"use client";

import { memo, useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Icons, PF_FOCUS, preflightTheme, type MicHealth, type PermissionState } from "./preflight-checklist";

/*
 * Preflight 的右欄（Mic／System／Camera／倒數／進階）、來源卡片與底部來源類型列。
 * 移植自 KapZoom 的 PreflightSidebar.tsx 與 Preflight.tsx。
 */

export interface PreflightPreferences {
  micEnabled: boolean;
  systemAudioEnabled: boolean;
  cameraEnabled: boolean;
}

export type PerformanceMode = "compatibility" | "balanced" | "quality";
export type RecordingQuality = "high" | "medium" | "low";
export type CountdownSec = 0 | 3 | 5 | 10;

export interface RecordingSettings {
  countdownSec: CountdownSec;
  showCursor: boolean;
  performanceMode: PerformanceMode;
  quality: RecordingQuality;
}

export interface PreflightSidebarLabels {
  sidebarLabel: string;
  audioSection: string;
  microphone: string;
  systemAudio: string;
  systemAudioHint: string;
  micLevel: string;
  mic: Record<"ok" | "silent" | "clipping" | "probing" | "denied" | "unavailable" | "notProbed" | "test", string>;
  camera: string;
  cameraHint: string;
  cameraDenied: string;
  countdown: string;
  countdownOff: string;
  countdownSeconds: (n: number) => string;
  advancedSection: string;
  keepSystemCursor: string;
  cursorKeep: string;
  cursorHide: string;
  performanceModeTitle: string;
  performanceModes: Record<PerformanceMode, string>;
  qualityTitle: string;
  qualities: Record<RecordingQuality, string>;
}

export const defaultSidebarLabels: PreflightSidebarLabels = {
  sidebarLabel: "Audio, camera and quality",
  audioSection: "Audio",
  microphone: "Microphone",
  systemAudio: "System Audio",
  systemAudioHint: "Record the sound your computer plays",
  micLevel: "Microphone level",
  mic: {
    ok: "Picking up sound",
    silent: "No sound detected",
    clipping: "Too loud, may distort",
    probing: "Listening…",
    denied: "Microphone permission not granted",
    unavailable: "No usable microphone found",
    notProbed: "Press test to turn the microphone on",
    test: "Test microphone",
  },
  camera: "Camera",
  cameraHint: "Permission is requested when recording starts",
  cameraDenied: "Camera permission not granted",
  countdown: "Countdown",
  countdownOff: "No countdown",
  countdownSeconds: (n) => `${n}s`,
  advancedSection: "Advanced",
  keepSystemCursor: "Keep system cursor",
  cursorKeep: "No software cursor overlay (video keeps the real cursor)",
  cursorHide: "Software cursor overlay enabled (system cursor hidden)",
  performanceModeTitle: "Performance Mode",
  performanceModes: { compatibility: "Compatibility", balanced: "Balanced", quality: "High Quality" },
  qualityTitle: "Recording Quality",
  qualities: { high: "High Quality", medium: "Medium Quality", low: "Low Quality" },
};

function SectionTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[var(--pf-muted)]">{icon}</span>
      <span className="text-[10px] font-medium text-[var(--pf-text-2)] uppercase tracking-wider">{children}</span>
    </div>
  );
}

/** 分段選擇器：每個選項都是真按鈕 */
function SegmentedRow<T extends string | number>({
  label,
  options,
  value,
  onChange,
  renderLabel,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
  renderLabel: (option: T) => string;
}) {
  return (
    <fieldset className="grid gap-1 border-0 m-0 p-0 min-w-0" aria-label={label}>
      <div className="flex gap-1">
        {options.map((option) => {
          const selected = option === value;
          return (
            <button
              key={String(option)}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option)}
              className={cn(
                "flex-1 min-w-0 py-1.5 px-1 rounded-[8px] text-[11px] font-medium border transition-colors",
                PF_FOCUS,
                selected
                  ? "bg-[color-mix(in_srgb,var(--pf-accent)_15%,transparent)] border-[var(--pf-accent)] text-[var(--pf-accent)]"
                  : "bg-[var(--pf-elevated)] border-[var(--pf-border)] text-[var(--pf-muted)] hover:text-[var(--pf-text-2)]",
              )}
            >
              {renderLabel(option)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** 開關列：圖示 + 名稱 + 狀態說明 + 切換鈕 */
function ToggleRow({ icon, label, hint, checked, onChange }: { icon: ReactNode; label: string; hint?: string; checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] border border-[var(--pf-border)] bg-[var(--pf-elevated)] hover:border-[color-mix(in_srgb,var(--pf-accent)_40%,transparent)] transition-colors text-left",
        PF_FOCUS,
      )}
    >
      <span className={checked ? "text-[var(--pf-accent)]" : "text-[var(--pf-muted)]"}>{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-medium text-[var(--pf-text)] truncate">{label}</span>
        {hint && <span className="block text-[10px] text-[var(--pf-muted)] truncate">{hint}</span>}
      </span>
      <span aria-hidden="true" className={cn("relative w-9 h-5 rounded-full shrink-0 transition-colors", checked ? "bg-[var(--pf-accent)]" : "bg-[var(--pf-sunken)]")}>
        <span className={cn("absolute top-1 w-3 h-3 rounded-full bg-[var(--pf-text)] shadow-md transition-all motion-reduce:transition-none", checked ? "left-5" : "left-1")} />
      </span>
    </button>
  );
}

/** 音量條：訂閱音量直接寫 DOM style，不進 React state，避免 5fps 的整棵樹重繪 */
const MicLevelBar = memo(function MicLevelBar({ clipping, subscribeLevel }: { clipping: boolean; subscribeLevel: (listener: (level: number) => void) => () => void }) {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(
    () =>
      subscribeLevel((level) => {
        if (barRef.current) barRef.current.style.width = `${Math.min(100, level)}%`;
      }),
    [subscribeLevel],
  );
  return (
    <div aria-hidden="true" className="h-1.5 rounded-full bg-[var(--pf-sunken)] overflow-hidden">
      <div ref={barRef} className="h-full transition-[width] duration-100 motion-reduce:transition-none" style={{ width: "0%", backgroundColor: clipping ? "var(--pf-danger)" : "var(--pf-accent)" }} />
    </div>
  );
});

export interface PreflightSidebarProps {
  settings: RecordingSettings;
  onSettingsChange: (settings: RecordingSettings) => void;
  preferences: PreflightPreferences;
  onPreferencesChange: (preferences: PreflightPreferences) => void;
  micHealth: MicHealth;
  /** 音量 0 到 100 的訂閱 */
  subscribeMicLevel: (listener: (level: number) => void) => () => void;
  /** 還沒碰過麥克風時給一顆「測試麥克風」，權限對話框才不會在挑螢幕時跳出來 */
  micProbeArmed: boolean;
  onArmMicProbe: () => void;
  micPermission: PermissionState;
  cameraPermission: PermissionState;
  accent?: string;
  labels?: Partial<PreflightSidebarLabels>;
  className?: string;
}

const COUNTDOWN_OPTIONS: CountdownSec[] = [0, 3, 5, 10];

export function PreflightSidebar({
  settings,
  onSettingsChange,
  preferences,
  onPreferencesChange,
  micHealth,
  subscribeMicLevel,
  micProbeArmed,
  onArmMicProbe,
  micPermission,
  cameraPermission,
  accent,
  labels,
  className,
}: PreflightSidebarProps) {
  const l = { ...defaultSidebarLabels, ...labels };
  const set = <K extends keyof RecordingSettings>(k: K, v: RecordingSettings[K]) => onSettingsChange({ ...settings, [k]: v });
  const pref = <K extends keyof PreflightPreferences>(k: K, v: PreflightPreferences[K]) => onPreferencesChange({ ...preferences, [k]: v });

  const micHint =
    micPermission === "denied" || micPermission === "restricted"
      ? l.mic.denied
      : !micProbeArmed
        ? l.mic.notProbed
        : micHealth === "unavailable"
          ? l.mic.unavailable
          : micHealth === "silent"
            ? l.mic.silent
            : micHealth === "clipping"
              ? l.mic.clipping
              : micHealth === "ok"
                ? l.mic.ok
                : l.mic.probing;

  return (
    <aside
      aria-label={l.sidebarLabel}
      style={preflightTheme(accent)}
      className={cn("w-72 shrink-0 border-l border-[var(--pf-border)] bg-[var(--pf-surface)] overflow-y-auto p-4 flex flex-col gap-5", className)}
    >
      <section>
        <SectionTitle icon={<Icons.Mic className="w-3.5 h-3.5" />}>{l.audioSection}</SectionTitle>
        <div className="flex flex-col gap-2">
          <ToggleRow
            icon={preferences.micEnabled ? <Icons.Mic className="w-4 h-4" /> : <Icons.MicOff className="w-4 h-4" />}
            label={l.microphone}
            hint={preferences.micEnabled ? micHint : undefined}
            checked={preferences.micEnabled}
            onChange={(v) => pref("micEnabled", v)}
          />
          {preferences.micEnabled &&
            (micProbeArmed ? (
              <>
                <MicLevelBar clipping={micHealth === "clipping"} subscribeLevel={subscribeMicLevel} />
                <span className="sr-only" aria-live="polite">{`${l.micLevel}: ${micHint}`}</span>
              </>
            ) : (
              <button
                type="button"
                onClick={onArmMicProbe}
                className={cn(
                  "w-full flex items-center justify-center gap-1.5 h-7 rounded-[8px] border border-[var(--pf-border)] bg-[var(--pf-elevated)] text-[11px] font-medium text-[var(--pf-text-2)] hover:text-[var(--pf-text)] hover:border-[color-mix(in_srgb,var(--pf-accent)_40%,transparent)] transition-colors",
                  PF_FOCUS,
                )}
              >
                <Icons.Mic className="w-3.5 h-3.5" />
                {l.mic.test}
              </button>
            ))}
          <ToggleRow
            icon={preferences.systemAudioEnabled ? <Icons.Volume2 className="w-4 h-4" /> : <Icons.VolumeX className="w-4 h-4" />}
            label={l.systemAudio}
            hint={l.systemAudioHint}
            checked={preferences.systemAudioEnabled}
            onChange={(v) => pref("systemAudioEnabled", v)}
          />
        </div>
      </section>

      <section>
        <SectionTitle icon={<Icons.Camera className="w-3.5 h-3.5" />}>{l.camera}</SectionTitle>
        <ToggleRow
          icon={<Icons.Camera className="w-4 h-4" />}
          label={l.camera}
          hint={cameraPermission === "denied" || cameraPermission === "restricted" ? l.cameraDenied : l.cameraHint}
          checked={preferences.cameraEnabled}
          onChange={(v) => pref("cameraEnabled", v)}
        />
      </section>

      <section>
        <SectionTitle icon={<Icons.Timer className="w-3.5 h-3.5" />}>{l.countdown}</SectionTitle>
        <SegmentedRow
          label={l.countdown}
          options={COUNTDOWN_OPTIONS}
          value={settings.countdownSec}
          onChange={(v) => set("countdownSec", v)}
          renderLabel={(v) => (v === 0 ? l.countdownOff : l.countdownSeconds(v))}
        />
      </section>

      {/* 進階：摺疊起來，不跟上面的主要決定搶注意力 */}
      <details className="group">
        <summary
          className={cn(
            "cursor-pointer list-none text-[10px] font-medium text-[var(--pf-muted)] uppercase tracking-wider hover:text-[var(--pf-text-2)] transition-colors rounded-[8px] [&::-webkit-details-marker]:hidden",
            PF_FOCUS,
          )}
        >
          {l.advancedSection}
        </summary>
        <div className="flex flex-col gap-2 mt-2">
          <ToggleRow
            icon={<Icons.MousePointer className="w-4 h-4" />}
            label={l.keepSystemCursor}
            hint={settings.showCursor ? l.cursorKeep : l.cursorHide}
            checked={settings.showCursor}
            onChange={(v) => set("showCursor", v)}
          />
          <section>
            <SectionTitle icon={<Icons.Zap className="w-3.5 h-3.5" />}>{l.performanceModeTitle}</SectionTitle>
            <SegmentedRow
              label={l.performanceModeTitle}
              options={["compatibility", "balanced", "quality"] as const}
              value={settings.performanceMode}
              onChange={(v) => set("performanceMode", v)}
              renderLabel={(v) => l.performanceModes[v]}
            />
          </section>
          <section>
            <SectionTitle icon={<Icons.Gauge className="w-3.5 h-3.5" />}>{l.qualityTitle}</SectionTitle>
            <SegmentedRow
              label={l.qualityTitle}
              options={["high", "medium", "low"] as const}
              value={settings.quality}
              onChange={(v) => set("quality", v)}
              renderLabel={(v) => l.qualities[v]}
            />
          </section>
        </div>
      </details>
    </aside>
  );
}

/* ---------- 來源卡片 ---------- */

export interface PreflightSource {
  id: string;
  name: string;
  kind: "screen" | "window";
  /** 縮圖內容（img 或 inline SVG） */
  thumbnail: ReactNode;
  appIcon?: ReactNode;
}

export function SourceCard({ source, selected, onSelect }: { source: PreflightSource; selected: boolean; onSelect: (id: string) => void }) {
  const isScreen = source.kind === "screen";
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(source.id)}
      title={source.name}
      className={cn(
        "group relative w-full bg-[var(--pf-surface)] overflow-hidden border rounded-[14px] transition-all duration-150 motion-reduce:transition-none motion-reduce:transform-none",
        PF_FOCUS,
        selected
          ? "border-[var(--pf-accent)] border-2 shadow-[0_0_0_3px_color-mix(in_srgb,var(--pf-accent)_25%,transparent),0_8px_24px_color-mix(in_srgb,var(--pf-accent)_20%,transparent)] -translate-y-0.5"
          : "border-[var(--pf-border)] hover:border-[color-mix(in_srgb,var(--pf-accent-hover)_60%,transparent)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.18)]",
      )}
    >
      {/* 固定 16:9 */}
      <div className={cn("w-full aspect-video bg-black [&>svg]:size-full [&>img]:size-full", isScreen ? "[&>img]:object-cover" : "[&>img]:object-contain")}>
        {source.thumbnail}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
      {selected && (
        <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[var(--pf-accent)] flex items-center justify-center shadow-lg ring-2 ring-white/20">
          <svg aria-hidden="true" className="w-3.5 h-3.5 text-[var(--pf-accent-fg)]" fill="none" viewBox="0 0 12 12">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 flex items-center gap-2">
        {source.appIcon ? (
          <span className="w-5 h-5 rounded shrink-0 overflow-hidden [&>svg]:size-full">{source.appIcon}</span>
        ) : isScreen ? (
          <Icons.Monitor className="w-5 h-5 text-[var(--pf-accent)] shrink-0" />
        ) : (
          <Icons.AppWindow className="w-5 h-5 text-[var(--pf-text-2)] shrink-0" />
        )}
        <span className="text-[13px] font-semibold text-white truncate flex-1 text-left drop-shadow">{source.name}</span>
      </div>
    </button>
  );
}

/* ---------- 底部來源類型 + 搜尋 ---------- */

export type SourceKind = "screen" | "window" | "region";

export interface SourceKindBarProps {
  value: SourceKind;
  onChange: (kind: SourceKind) => void;
  query: string;
  onQueryChange: (q: string) => void;
  loading?: boolean;
  onRefresh?: () => void;
  /** tabpanel 的 id，用於 aria-controls */
  panelId: string;
  labels?: Partial<{ toggle: string; screen: string; window: string; region: string; search: string; refresh: string }>;
}

const KIND_TABS = [
  { value: "screen", icon: Icons.Monitor },
  { value: "window", icon: Icons.AppWindow },
  { value: "region", icon: Icons.Crop },
] as const;

export function SourceKindBar({ value, onChange, query, onQueryChange, loading, onRefresh, panelId, labels }: SourceKindBarProps) {
  const l = { toggle: "Toggle Screen/Window/Region", screen: "Screen", window: "Window", region: "Region", search: "Search windows...", refresh: "Refresh", ...labels };
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = KIND_TABS.findIndex((t) => t.value === value);

  // 方向鍵在三個分頁間移動（roving tabindex）
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    let next = -1;
    if (e.key === "ArrowRight") next = (current + 1) % KIND_TABS.length;
    else if (e.key === "ArrowLeft") next = (current - 1 + KIND_TABS.length) % KIND_TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = KIND_TABS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    onChange(KIND_TABS[next].value);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="px-4 pt-2 pb-1.5 flex flex-wrap items-center gap-3 border-b border-[color-mix(in_srgb,var(--pf-border)_60%,transparent)]">
      <div role="tablist" tabIndex={-1} aria-label={l.toggle} className="flex items-center gap-1 shrink-0" onKeyDown={onKeyDown}>
        {KIND_TABS.map(({ value: v, icon: Icon }, i) => {
          const selected = value === v;
          return (
            <button
              key={v}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${panelId}-tab-${v}`}
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(v)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-medium transition-colors",
                PF_FOCUS,
                selected ? "bg-[var(--pf-accent)] text-[var(--pf-accent-fg)]" : "text-[var(--pf-muted)] hover:text-[var(--pf-text)] hover:bg-[var(--pf-elevated)]",
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{l[v]}</span>
            </button>
          );
        })}
      </div>
      <div className="relative flex-1 min-w-[8rem] max-w-xs">
        <Icons.Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--pf-muted)] pointer-events-none" />
        <input
          type="text"
          aria-label={l.search}
          placeholder={l.search}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="w-full bg-[var(--pf-elevated)] border border-[var(--pf-border)] rounded-full focus:border-[var(--pf-accent)] text-xs text-[var(--pf-text)] placeholder:text-[var(--pf-muted)] pl-8 pr-2.5 py-1.5 focus:outline-none transition-colors"
        />
      </div>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          title={l.refresh}
          aria-label={l.refresh}
          className={cn("shrink-0 flex items-center justify-center w-7 h-7 rounded-[8px] text-[var(--pf-muted)] hover:text-[var(--pf-text)] hover:bg-[var(--pf-elevated)] transition-colors", PF_FOCUS)}
        >
          <Icons.RefreshCw className={cn("w-3.5 h-3.5", loading && "motion-safe:animate-spin")} />
        </button>
      )}
    </div>
  );
}
