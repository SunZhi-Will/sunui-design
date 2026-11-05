"use client";

import { useMemo, useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { PreflightChecklist, buildPreflightChecks, preflightTheme, type PermissionState } from "./preflight-checklist";

const copy = {
  en: { screen: "Screen 1", recording: (n: string) => `Recording ${n}…`, selected: (n: string) => `${n} selected` },
  "zh-TW": { screen: "螢幕 1", recording: (n: string) => `正在錄製${n}…`, selected: (n: string) => `已選擇${n}` },
  "zh-CN": { screen: "屏幕 1", recording: (n: string) => `正在录制${n}…`, selected: (n: string) => `已选择${n}` },
  ja: { screen: "画面 1", recording: (n: string) => `${n}を録画中…`, selected: (n: string) => `${n}を選択中` },
};

export default function PreflightChecklistDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [micPermission, setMicPermission] = useState<PermissionState>("denied");
  const [confirming, setConfirming] = useState(false);
  const [started, setStarted] = useState(false);

  const checks = useMemo(
    () =>
      buildPreflightChecks({
        sourcesLoading: false,
        loadedSourceCount: 3,
        selectedSourceId: "screen:1",
        selectedSourceName: t.screen,
        sourceKind: "screen",
        hasRegion: false,
        boundsPending: false,
        screenPermission: "granted",
        micPermission,
        cameraPermission: "granted",
        micEnabled: true,
        cameraEnabled: false,
        micHealth: micPermission === "granted" ? "ok" : "idle",
        clickCaptureDegraded: false,
        freeDiskBytes: 41.8e9,
        bytesPerSecond: 1_650_000,
        sensitiveWindowTitles: [],
        startError: null,
        locale,
      }),
    [micPermission, locale, t.screen],
  );

  return (
    <div style={preflightTheme()} className="w-full max-w-3xl mx-auto overflow-visible rounded-[14px] border border-[var(--pf-border)] bg-[var(--pf-bg-app)] flex flex-col">
      <div className="h-40 grid place-items-center px-4 text-center text-sm text-[var(--pf-text-2)]" role="status">
        {started ? t.recording(t.screen) : t.selected(t.screen)}
      </div>
      <PreflightChecklist
        className="border-t border-[var(--pf-border)] bg-[var(--pf-surface)] rounded-b-[14px] pt-2.5"
        checks={checks}
        locale={locale}
        isConfirming={confirming}
        onOpenSettings={() => setMicPermission("granted")}
        onStart={() => {
          setConfirming(true);
          setTimeout(() => {
            setConfirming(false);
            setStarted(true);
          }, 1200);
        }}
      />
    </div>
  );
}
