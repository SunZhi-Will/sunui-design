"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import {
  Icons,
  PermissionCenter,
  PreflightChecklist,
  buildPreflightChecks,
  preflightTheme,
  scanSensitiveWindows,
  type MicHealth,
  type PermissionSnapshot,
} from "./preflight-checklist";
import {
  PreflightSidebar,
  SourceCard,
  SourceKindBar,
  type PreflightPreferences,
  type PreflightSource,
  type RecordingSettings,
  type SourceKind,
} from "./preflight-sidebar";

// 內嵌的示意縮圖：桌面與幾個 app 視窗
function Desk({ hue, bars }: { hue: number; bars: number }) {
  return (
    <svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="160" height="90" fill={`hsl(${hue} 30% 18%)`} />
      <rect x="0" y="0" width="160" height="6" fill="rgba(255,255,255,0.08)" />
      {Array.from({ length: bars }, (_, i) => (
        <rect key={i} x={14 + i * 22} y={18 + (i % 2) * 8} width="56" height="40" rx="3" fill={`hsl(${hue + i * 40} 25% ${34 + i * 6}%)`} />
      ))}
    </svg>
  );
}
function AppIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <rect width="20" height="20" rx="5" fill={color} />
    </svg>
  );
}

const SOURCES: PreflightSource[] = [
  { id: "screen:1", kind: "screen", name: "Screen 1", thumbnail: <Desk hue={220} bars={3} /> },
  { id: "screen:2", kind: "screen", name: "Screen 2", thumbnail: <Desk hue={30} bars={2} /> },
  { id: "window:figma", kind: "window", name: "Onboarding flow – Figma", thumbnail: <Desk hue={280} bars={1} />, appIcon: <AppIcon color="#a855f7" /> },
  { id: "window:code", kind: "window", name: "release-notes.md – Code", thumbnail: <Desk hue={200} bars={2} />, appIcon: <AppIcon color="#0ea5e9" /> },
  { id: "window:1p", kind: "window", name: "1Password", thumbnail: <Desk hue={210} bars={1} />, appIcon: <AppIcon color="#3b82f6" /> },
];

export default function PreflightChecklistDemo() {
  const panelId = useId();
  const [kind, setKind] = useState<SourceKind>("screen");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>("screen:1");
  const [settings, setSettings] = useState<RecordingSettings>({ countdownSec: 3, showCursor: false, performanceMode: "balanced", quality: "high" });
  const [prefs, setPrefs] = useState<PreflightPreferences>({ micEnabled: true, systemAudioEnabled: true, cameraEnabled: false });
  const [armed, setArmed] = useState(false);
  const [micHealth, setMicHealth] = useState<MicHealth>("idle");
  const [showPermissions, setShowPermissions] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [started, setStarted] = useState(false);
  const [permissions, setPermissions] = useState<PermissionSnapshot[]>([
    { key: "screenRecording", state: "granted", required: true },
    { key: "microphone", state: "not-determined", required: false },
    { key: "camera", state: "denied", required: false },
  ]);

  // 模擬麥克風探測：每 200ms 一個音量取樣，直接推給音量條
  const listeners = useRef(new Set<(level: number) => void>());
  const subscribeMicLevel = useCallback((fn: (level: number) => void) => {
    listeners.current.add(fn);
    return () => {
      listeners.current.delete(fn);
    };
  }, []);
  useEffect(() => {
    if (!armed || !prefs.micEnabled) return;
    setMicHealth("probing");
    let n = 0;
    const id = setInterval(() => {
      const level = 18 + Math.random() * 46;
      listeners.current.forEach((fn) => fn(level));
      if (++n === 5) setMicHealth("ok");
    }, 200);
    return () => clearInterval(id);
  }, [armed, prefs.micEnabled]);

  const perm = (k: PermissionSnapshot["key"]) => permissions.find((p) => p.key === k)!.state;
  const items = SOURCES.filter((s) => (kind === "window" ? s.kind === "window" : s.kind === "screen")).filter((s) => s.name.toLowerCase().includes(query.toLowerCase()));
  const selected = SOURCES.find((s) => s.id === selectedId) ?? null;

  const checks = useMemo(
    () =>
      buildPreflightChecks({
        sourcesLoading: false,
        loadedSourceCount: SOURCES.length,
        selectedSourceId: selected?.id ?? null,
        selectedSourceName: selected?.name ?? null,
        sourceKind: kind,
        hasRegion: false,
        boundsPending: false,
        screenPermission: perm("screenRecording"),
        micPermission: perm("microphone"),
        cameraPermission: perm("camera"),
        micEnabled: prefs.micEnabled,
        cameraEnabled: prefs.cameraEnabled,
        micHealth: armed ? micHealth : "idle",
        clickCaptureDegraded: false,
        freeDiskBytes: 41.8e9,
        bytesPerSecond: settings.quality === "high" ? 1_650_000 : settings.quality === "medium" ? 1_000_000 : 520_000,
        sensitiveWindowTitles: scanSensitiveWindows(SOURCES),
        startError: null,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, kind, permissions, prefs, armed, micHealth, settings.quality],
  );

  const changeKind = (k: SourceKind) => {
    setKind(k);
    setSelectedId(k === "window" ? null : "screen:1");
  };

  return (
    <div style={preflightTheme()} className="w-full overflow-hidden rounded-[14px] border border-[var(--pf-border)] bg-[var(--pf-bg-app)] text-[var(--pf-text)] flex flex-col min-h-[640px]">
      {/* 標題列 */}
      <div className="flex items-center gap-3 h-10 px-2 border-b border-[var(--pf-border)] min-w-0">
        <button type="button" className="flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[var(--pf-text-2)] hover:text-[var(--pf-text)] hover:bg-[var(--pf-elevated)] transition-colors text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pf-accent)]">
          <Icons.ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>
        <div className="w-px h-4 bg-[var(--pf-border)]" />
        <span className="text-xs font-medium text-[var(--pf-text-2)] tracking-wide">Preflight</span>
        <span className="text-[11px] text-[var(--pf-muted)] truncate">{"Using “Product demo” presets"}</span>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* 中欄：來源卡片 */}
        <div id={panelId} role="tabpanel" aria-labelledby={`${panelId}-tab-${kind}`} className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4">
          {started ? (
            <p role="status" className="my-auto text-center text-sm text-[var(--pf-text-2)]">
              Recording {selected?.name} in {settings.countdownSec}s…
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto w-full my-auto">
                {items.map((s) => (
                  <div key={s.id} className="min-w-0">
                    <SourceCard source={s} selected={selectedId === s.id} onSelect={setSelectedId} />
                  </div>
                ))}
                {items.length === 0 && <p className="text-[var(--pf-text-2)] col-span-full text-center">No sources found</p>}
              </div>
              {kind === "region" && <p className="text-center text-xs text-[var(--pf-muted)]">Pick a screen, then draw the area to record</p>}
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPermissions((p) => !p)}
                  aria-expanded={showPermissions}
                  className="text-[11px] text-[var(--pf-muted)] hover:text-[var(--pf-text)] underline underline-offset-2 rounded-[8px] px-1 py-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pf-accent)]"
                >
                  {showPermissions ? "Hide permissions" : "Show all permissions"}
                </button>
                {showPermissions && (
                  <PermissionCenter
                    className="w-full max-w-sm"
                    hideHeading
                    permissions={permissions}
                    onRequest={(k) => setPermissions((ps) => ps.map((p) => (p.key === k ? { ...p, state: "granted" } : p)))}
                    onOpenSettings={(k) => setPermissions((ps) => ps.map((p) => (p.key === k ? { ...p, state: "restart-required" } : p)))}
                  />
                )}
              </div>
            </>
          )}
        </div>

        <PreflightSidebar
          className="w-full lg:w-72 border-l-0 lg:border-l border-t lg:border-t-0"
          settings={settings}
          onSettingsChange={setSettings}
          preferences={prefs}
          onPreferencesChange={setPrefs}
          micHealth={micHealth}
          subscribeMicLevel={subscribeMicLevel}
          micProbeArmed={armed}
          onArmMicProbe={() => {
            setArmed(true);
            setPermissions((ps) => ps.map((p) => (p.key === "microphone" ? { ...p, state: "granted" } : p)));
          }}
          micPermission={perm("microphone")}
          cameraPermission={perm("camera")}
        />
      </div>

      {/* 底部：來源類型與搜尋，疊在即時檢查 + 主 CTA 上方 */}
      <div className="shrink-0 border-t border-[var(--pf-border)] bg-[var(--pf-surface)] flex flex-col">
        <SourceKindBar value={kind} onChange={changeKind} query={query} onQueryChange={setQuery} panelId={panelId} onRefresh={() => undefined} />
        <PreflightChecklist
          checks={checks}
          isConfirming={confirming}
          onStart={() => {
            setConfirming(true);
            setTimeout(() => {
              setConfirming(false);
              setStarted(true);
              setTimeout(() => setStarted(false), 2600);
            }, 1200);
          }}
          onOpenSettings={() => setShowPermissions(true)}
        />
      </div>
    </div>
  );
}
