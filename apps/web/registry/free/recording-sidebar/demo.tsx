"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useDemoLocale } from "@/lib/demo-locale";

import { PreflightSidebar, type MicHealth, type PreflightPreferences, type RecordingSettings } from "./recording-sidebar";

export default function RecordingSidebarDemo() {
  const locale = useDemoLocale();
  const [settings, setSettings] = useState<RecordingSettings>({ countdownSec: 3, showCursor: false, performanceMode: "balanced", quality: "high" });
  const [prefs, setPrefs] = useState<PreflightPreferences>({ micEnabled: true, systemAudioEnabled: true, cameraEnabled: false });
  const [armed, setArmed] = useState(false);
  const [micHealth, setMicHealth] = useState<MicHealth>("idle");

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
      listeners.current.forEach((fn) => fn(18 + Math.random() * 46));
      if (++n === 5) setMicHealth("ok");
    }, 200);
    return () => clearInterval(id);
  }, [armed, prefs.micEnabled]);

  return (
    <div className="w-full max-w-xs mx-auto overflow-hidden rounded-[14px] border border-white/10">
      <PreflightSidebar
        className="w-full border-l-0"
        locale={locale}
        settings={settings}
        onSettingsChange={setSettings}
        preferences={prefs}
        onPreferencesChange={setPrefs}
        micHealth={micHealth}
        subscribeMicLevel={subscribeMicLevel}
        micProbeArmed={armed}
        onArmMicProbe={() => setArmed(true)}
        micPermission={armed ? "granted" : "not-determined"}
        cameraPermission="denied"
      />
    </div>
  );
}
