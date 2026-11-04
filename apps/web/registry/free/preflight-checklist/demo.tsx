"use client";

import { useMemo, useState } from "react";

import { PreflightChecklist, buildPreflightChecks, preflightTheme, type PermissionState } from "./preflight-checklist";

export default function PreflightChecklistDemo() {
  const [micPermission, setMicPermission] = useState<PermissionState>("denied");
  const [confirming, setConfirming] = useState(false);
  const [started, setStarted] = useState(false);

  const checks = useMemo(
    () =>
      buildPreflightChecks({
        sourcesLoading: false,
        loadedSourceCount: 3,
        selectedSourceId: "screen:1",
        selectedSourceName: "Screen 1",
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
      }),
    [micPermission],
  );

  return (
    <div style={preflightTheme()} className="w-full max-w-3xl mx-auto overflow-visible rounded-[14px] border border-[var(--pf-border)] bg-[var(--pf-bg-app)] flex flex-col">
      <div className="h-40 grid place-items-center px-4 text-center text-sm text-[var(--pf-text-2)]" role="status">
        {started ? "Recording Screen 1…" : "Screen 1 selected"}
      </div>
      <PreflightChecklist
        className="border-t border-[var(--pf-border)] bg-[var(--pf-surface)] rounded-b-[14px] pt-2.5"
        checks={checks}
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
