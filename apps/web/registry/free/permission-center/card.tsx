"use client";

import { useState } from "react";

import { PermissionCenter, preflightTheme, defaultPermissionLabels, type PermissionKey, type PermissionSnapshot } from "./permission-center";

const initial: PermissionSnapshot[] = [
  { key: "microphone", state: "not-determined", required: false },
  { key: "camera", state: "denied", required: false },
];

// 卡片空間有限：拿掉說明，只留狀態與降級提示
const labels = {
  desc: { ...defaultPermissionLabels.desc, microphone: "", camera: "" },
  degradedOptional: "Screen-only still works.",
};

/** 型錄卡片：兩項權限，按 Request 或 Open System Settings 看狀態燈與提示切換。 */
export default function PermissionCenterCard() {
  const [permissions, setPermissions] = useState(initial);
  const update = (key: PermissionKey, state: PermissionSnapshot["state"]) =>
    setPermissions((ps) => ps.map((p) => (p.key === key ? { ...p, state } : p)));
  const settled = permissions.every((p) => p.state === "granted");

  return (
    <div style={preflightTheme()} className="mx-auto w-72 rounded-[14px] border border-[var(--pf-border)] bg-[var(--pf-surface)] p-3">
      <PermissionCenter
        hideHeading
        permissions={permissions}
        labels={labels}
        onRequest={(k) => update(k, "granted")}
        onOpenSettings={(k) => update(k, "restart-required")}
      />
      {settled && (
        <button type="button" onClick={() => setPermissions(initial)} className="mt-2 text-[11px] text-[var(--pf-muted)] underline-offset-4 hover:underline">
          Reset
        </button>
      )}
    </div>
  );
}
