"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useDemoLocale } from "@/lib/demo-locale";

import { PreflightSidebar, type MicHealth, type PreflightPreferences, type RecordingSettings } from "./recording-sidebar";

/** 型錄卡片：錄影前的右欄，切換麥克風與系統音、按測試看音量條跳動，可在框內捲動。 */
export default function RecordingSidebarCard() {
  const locale = useDemoLocale();
  const [settings, setSettings] = useState<RecordingSettings>({ countdownSec: 3, showCursor: false, performanceMode: "balanced", quality: "high" });
  const [prefs, setPrefs] = useState<PreflightPreferences>({ micEnabled: true, systemAudioEnabled: true, cameraEnabled: false });
  const [armed, setArmed] = useState(false);
  const [micHealth, setMicHealth] = useState<MicHealth>("idle");

  // 模擬麥克風音量，每 200ms 推一次
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
    <div className="mx-auto w-72 overflow-hidden rounded-[14px] border border-white/10">
      <PreflightSidebar
        className="h-[230px] w-full border-l-0"
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
