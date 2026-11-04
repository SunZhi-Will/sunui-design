"use client";

import { AppChip } from "./app-chip";

const apps = [
  { id: "lumen", name: "Lumen Reader", paid: true },
  { id: "tidepool", name: "Tidepool" },
  { id: "orbit", name: "Orbit Notes", paid: true },
];

export default function AppChipDemo() {
  return (
    <div className="flex w-full max-w-md min-w-0 flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card p-4">
      <span className="text-sm font-medium text-foreground">Hana Ito</span>
      <span className="text-xs text-muted-foreground">uses</span>
      {apps.map((a) => (
        <AppChip key={a.id} appId={a.id} name={a.name} paid={a.paid} />
      ))}
    </div>
  );
}
