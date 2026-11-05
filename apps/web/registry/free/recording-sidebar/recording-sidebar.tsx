"use client";

import { memo, useEffect, useRef, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/*
 * Preflight 的右欄（Mic／System／Camera／倒數／進階）。
 * 移植自 KapZoom 的 PreflightSidebar.tsx。
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
  Mic: icon(
    <>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
    </>,
  ),
  MicOff: icon(
    <>
      <path d="m2 2 20 20M18.89 13.23A7.12 7.12 0 0 0 19 12v-2M5 10v2a7 7 0 0 0 12 5M15 9.34V5a3 3 0 0 0-5.68-1.33M9 9v3a3 3 0 0 0 5.12 2.12M12 19v3" />
    </>,
  ),
  Volume2: icon(
    <>
      <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
      <path d="M16 9a5 5 0 0 1 0 6M19.364 18.364a9 9 0 0 0 0-12.728" />
    </>,
  ),
  VolumeX: icon(
    <>
      <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
      <path d="m22 9-6 6M16 9l6 6" />
    </>,
  ),
  Camera: icon(
    <>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </>,
  ),
  Timer: icon(
    <>
      <path d="M10 2h4M12 14l3-3" />
      <circle cx="12" cy="14" r="8" />
    </>,
  ),
  MousePointer: icon(
    <path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z" />,
  ),
  Zap: icon(
    <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />,
  ),
  Gauge: icon(<path d="m12 14 4-4M3.34 19a10 10 0 1 1 17.32 0" />),
};

export type PermissionState = "not-determined" | "granted" | "denied" | "restricted" | "restart-required" | "unknown";
export type MicHealth = "idle" | "probing" | "ok" | "silent" | "clipping" | "unavailable";

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

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, PreflightSidebarLabels> = {
  en: {
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
  },
  "zh-TW": {
    sidebarLabel: "音訊、鏡頭與畫質",
    audioSection: "音訊",
    microphone: "麥克風",
    systemAudio: "系統音訊",
    systemAudioHint: "錄下電腦播放的聲音",
    micLevel: "麥克風音量",
    mic: {
      ok: "正在收音",
      silent: "沒有偵測到聲音",
      clipping: "音量太大，可能破音",
      probing: "聆聽中…",
      denied: "尚未取得麥克風權限",
      unavailable: "找不到可用的麥克風",
      notProbed: "按下測試以開啟麥克風",
      test: "測試麥克風",
    },
    camera: "鏡頭",
    cameraHint: "開始錄影時才會要求權限",
    cameraDenied: "尚未取得鏡頭權限",
    countdown: "倒數",
    countdownOff: "不倒數",
    countdownSeconds: (n) => `${n} 秒`,
    advancedSection: "進階",
    keepSystemCursor: "保留系統游標",
    cursorKeep: "不疊加軟體游標（影片保留真實游標）",
    cursorHide: "已啟用軟體游標疊加（隱藏系統游標）",
    performanceModeTitle: "效能模式",
    performanceModes: { compatibility: "相容", balanced: "平衡", quality: "高畫質" },
    qualityTitle: "錄影畫質",
    qualities: { high: "高畫質", medium: "中畫質", low: "低畫質" },
  },
  "zh-CN": {
    sidebarLabel: "音频、摄像头与画质",
    audioSection: "音频",
    microphone: "麦克风",
    systemAudio: "系统音频",
    systemAudioHint: "录制电脑播放的声音",
    micLevel: "麦克风音量",
    mic: {
      ok: "正在收音",
      silent: "未检测到声音",
      clipping: "音量过大，可能失真",
      probing: "正在监听…",
      denied: "未获得麦克风权限",
      unavailable: "未找到可用的麦克风",
      notProbed: "点击测试以开启麦克风",
      test: "测试麦克风",
    },
    camera: "摄像头",
    cameraHint: "开始录制时才会请求权限",
    cameraDenied: "未获得摄像头权限",
    countdown: "倒计时",
    countdownOff: "不倒计时",
    countdownSeconds: (n) => `${n} 秒`,
    advancedSection: "高级",
    keepSystemCursor: "保留系统光标",
    cursorKeep: "不叠加软件光标（视频保留真实光标）",
    cursorHide: "已启用软件光标叠加（隐藏系统光标）",
    performanceModeTitle: "性能模式",
    performanceModes: { compatibility: "兼容", balanced: "均衡", quality: "高画质" },
    qualityTitle: "录制画质",
    qualities: { high: "高画质", medium: "中画质", low: "低画质" },
  },
  ja: {
    sidebarLabel: "オーディオ、カメラ、画質",
    audioSection: "オーディオ",
    microphone: "マイク",
    systemAudio: "システム音声",
    systemAudioHint: "パソコンで再生中の音を録音",
    micLevel: "マイクの音量",
    mic: {
      ok: "音を拾っています",
      silent: "音が検出されません",
      clipping: "音量が大きすぎます",
      probing: "聞き取り中…",
      denied: "マイクの使用が許可されていません",
      unavailable: "使用できるマイクが見つかりません",
      notProbed: "テストを押すとマイクがオンになります",
      test: "マイクをテスト",
    },
    camera: "カメラ",
    cameraHint: "録画開始時に許可を求めます",
    cameraDenied: "カメラへのアクセスが許可されていません",
    countdown: "カウントダウン",
    countdownOff: "なし",
    countdownSeconds: (n) => `${n}秒`,
    advancedSection: "詳細設定",
    keepSystemCursor: "システムカーソルを使う",
    cursorKeep: "ソフトウェアカーソルを重ねない（実際のカーソルを録画）",
    cursorHide: "ソフトウェアカーソルを重ねる（システムカーソルは非表示）",
    performanceModeTitle: "パフォーマンスモード",
    performanceModes: { compatibility: "互換性", balanced: "バランス", quality: "高画質" },
    qualityTitle: "録画画質",
    qualities: { high: "高画質", medium: "標準画質", low: "低画質" },
  },
};

/** 英文預設字串，保留舊的匯出名稱 */
export const defaultSidebarLabels: PreflightSidebarLabels = MESSAGES.en;

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
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
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
  locale = "en",
  labels,
  className,
}: PreflightSidebarProps) {
  const l = { ...MESSAGES[resolveLocale(locale)], ...labels };
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
