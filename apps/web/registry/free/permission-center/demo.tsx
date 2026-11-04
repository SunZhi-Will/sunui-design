"use client";

import { useState } from "react";

import { PermissionCenter, preflightTheme, type PermissionKey, type PermissionSnapshot } from "./permission-center";

export default function PermissionCenterDemo() {
  const [permissions, setPermissions] = useState<PermissionSnapshot[]>([
    { key: "screenRecording", state: "granted", required: true },
    { key: "microphone", state: "not-determined", required: false },
    { key: "camera", state: "denied", required: false },
  ]);

  const update = (key: PermissionKey, state: PermissionSnapshot["state"]) =>
    setPermissions((ps) => ps.map((p) => (p.key === key ? { ...p, state } : p)));

  return (
    <div style={preflightTheme()} className="w-full max-w-md mx-auto rounded-[14px] border border-[var(--pf-border)] bg-[var(--pf-surface)] p-4">
      <PermissionCenter
        permissions={permissions}
        onRequest={(k) => update(k, "granted")}
        onOpenSettings={(k) => update(k, "restart-required")}
      />
    </div>
  );
}
