"use client";

import { useState } from "react";

import { AppChip, EmployeeChip, PersonChip, StatusBadge, StatusDot, WorkBadge, type StatusTone, type WorkStatus } from "./dot-badge";

const works: { name: string; status: WorkStatus }[] = [
  { name: "Lumen Reader", status: "available" },
  { name: "Tidepool", status: "public-beta" },
  { name: "Orbit Notes", status: "prototype" },
  { name: "Paperfold", status: "archived" },
];

const jobs: { name: string; tone: StatusTone; label: string }[] = [
  { name: "upscale_portrait.json", tone: "success", label: "Done" },
  { name: "inpaint_room_v2.json", tone: "info", label: "Running" },
  { name: "batch_thumbs.json", tone: "warning", label: "Queued" },
  { name: "lora_train_cat.json", tone: "destructive", label: "Failed" },
  { name: "old_preview.json", tone: "muted", label: "Cancelled" },
];

const users = [
  { id: 11, name: "Hana Ito", apps: [{ id: "lumen", name: "Lumen", paid: true }, { id: "tidepool", name: "Tidepool" }] },
  { id: 12, name: "Marco Silva", apps: [{ id: "orbit", name: "Orbit" }] },
  { id: 13, name: "王大同", apps: [{ id: "lumen", name: "Lumen" }, { id: "orbit", name: "Orbit", paid: true }] },
];

const crew = [
  { id: 1, name: "Mia" },
  { id: 2, name: "Leo", locked: true },
  { id: 3, name: "Ava", changed: true },
  { id: 4, name: "Noah" },
];

export default function DotBadgeDemo() {
  const [selected, setSelected] = useState<number | null>(3);
  const me = 1;

  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
      {/* Synvize：品牌強制暗色，放在原本的黑底上 */}
      <section className="min-w-0 rounded-xl border border-[rgba(212,175,55,0.14)] bg-[#08080a] p-4 text-[#f7f5f0]">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium">Work</h3>
          <WorkBadge tone="brand" label="Building now" live hint="Currently in active development" />
        </div>
        <ul className="flex flex-col divide-y divide-[rgba(247,245,240,0.1)]">
          {works.map((w) => (
            <li key={w.name} className="flex min-w-0 items-center justify-between gap-3 py-2.5">
              <span className="truncate text-sm">{w.name}</span>
              <StatusBadge status={w.status} />
            </li>
          ))}
        </ul>
      </section>

      <section className="min-w-0 rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-medium text-foreground">Queue</h3>
        <ul className="flex flex-col gap-2 text-sm">
          {jobs.map((j) => (
            <li key={j.name} className="flex min-w-0 items-center justify-between gap-3">
              <span className="truncate font-mono text-xs text-muted-foreground">{j.name}</span>
              <StatusDot tone={j.tone} className="text-xs text-foreground">
                {j.label}
              </StatusDot>
            </li>
          ))}
        </ul>
      </section>

      <section className="min-w-0 rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-medium text-foreground">Users</h3>
        <ul className="flex flex-col gap-2.5">
          {users.map((u) => (
            <li key={u.id} className="flex min-w-0 flex-wrap items-center gap-1.5">
              <PersonChip name={u.name} personId={u.id} />
              <span className="text-xs text-muted-foreground">uses</span>
              {u.apps.map((a) => (
                <AppChip key={a.id} appId={a.id} name={a.name} paid={a.paid} />
              ))}
            </li>
          ))}
        </ul>
      </section>

      <section className="min-w-0 rounded-xl border border-border bg-card p-4">
        <h3 className="mb-1 text-sm font-medium text-foreground">Tonight&apos;s crew</h3>
        <p className="mb-3 text-xs text-muted-foreground">You are Mia. Tap someone to open their details.</p>
        <div className="flex flex-wrap gap-1.5">
          {crew.map((c) => (
            <EmployeeChip
              key={c.id}
              size="lg"
              name={c.name}
              employeeId={c.id}
              locked={c.locked}
              highlighted={c.changed}
              emphasized={c.id === me}
              muted={c.id !== me && c.id !== selected}
              selected={c.id === selected}
              onClick={() => setSelected((s) => (s === c.id ? null : c.id))}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
