"use client";

import { useState } from "react";

import { PreflightChecklist, type PermissionStatus, type PreflightCheck } from "./preflight-checklist";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function PreflightChecklistDemo() {
  const [mic, setMic] = useState<PermissionStatus>("denied");
  const [notify, setNotify] = useState<PermissionStatus>("unknown");
  const [quality, setQuality] = useState<"1080p" | "720p">("1080p");
  const [live, setLive] = useState(false);

  const checks: PreflightCheck[] = [
    { id: "links", severity: "ok", message: "All 12 product links are valid" },
    {
      id: "storage",
      severity: quality === "1080p" ? "warn" : "ok",
      message:
        quality === "1080p"
          ? "2.1 GB free, enough for about 40 minutes at 1080p"
          : "2.1 GB free, enough for about 2 hours at 720p",
      fix: { label: "Use 720p", onClick: () => setQuality("720p") },
    },
    { id: "network", severity: "ok", message: "Upload speed 18 Mbps, stable" },
  ];

  return (
    <div className="w-full max-w-3xl space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Before you go live</h2>
        <p className="mt-1 text-sm text-muted-foreground">Autumn ceramics drop, starts at 8:00 PM.</p>
      </div>
      <PreflightChecklist
        checks={checks}
        permissions={[
          { id: "camera", name: "Camera", required: true, status: "granted" },
          { id: "mic", name: "Microphone", required: true, status: mic, onFix: () => setMic("granted") },
          { id: "notify", name: "Notifications", status: notify, onFix: () => setNotify("granted") },
        ]}
        cta={{ label: live ? "You're live" : "Go live", onClick: () => setLive(true) }}
        onRecheck={() => wait(900)}
      />
    </div>
  );
}
