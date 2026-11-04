"use client";

import { useState } from "react";

import { ToggleSwitch, type ToggleSwitchProps } from "./toggle-switch";

type Size = NonNullable<ToggleSwitchProps["size"]>;

const settings = [
  { key: "wifi", label: "Wi-Fi", description: "Connected to Studio 5G", variant: "default" },
  { key: "dark", label: "Dark mode", description: "Follow the night sky after sunset", variant: "day-night" },
  { key: "notify", label: "Notifications", description: "Banners, sounds and badges", variant: "icon" },
  { key: "location", label: "Location services", description: "Managed by your organisation", variant: "default", disabled: true },
] as const;

/** 快速設定清單：一張卡片內多個有標籤的開關 */
export function SettingsList({ size = "md" }: { size?: Size }) {
  const [state, setState] = useState<Record<string, boolean>>({ wifi: true, dark: false, notify: true, location: false });

  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-2 text-card-foreground shadow-sm">
      <h3 className="px-4 pt-3 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Quick settings</h3>
      <ul className="divide-y divide-border">
        {settings.map((s) => (
          <li key={s.key} className="px-4 py-3.5">
            <ToggleSwitch
              size={size}
              variant={s.variant}
              label={s.label}
              description={s.description}
              disabled={"disabled" in s ? s.disabled : false}
              checked={state[s.key]}
              onCheckedChange={(v) => setState((prev) => ({ ...prev, [s.key]: v }))}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ToggleSwitchDemo() {
  const [size, setSize] = useState<Size>("md");

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <div role="group" aria-label="Size" className="flex gap-1 text-sm">
        {(["sm", "md", "lg"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={size === v}
            onClick={() => setSize(v)}
            className="rounded-full border border-border px-3 py-1.5 text-foreground transition-colors hover:bg-muted aria-pressed:bg-primary aria-pressed:text-primary-foreground"
          >
            {v}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-6 rounded-2xl border border-border bg-card px-5 py-4">
        <ToggleSwitch size={size} aria-label="Default switch" defaultChecked />
        <ToggleSwitch size={size} variant="day-night" aria-label="Night mode" />
        <ToggleSwitch size={size} variant="icon" aria-label="Enabled" defaultChecked />
        <ToggleSwitch size={size} aria-label="Disabled switch" disabled />
      </div>
      <SettingsList size={size} />
    </div>
  );
}
