"use client";

import { useId, useState } from "react";

import { SourceCard, SourceKindBar, preflightTheme, type PreflightSource, type SourceKind } from "./source-picker";

function Desk({ hue, bars }: { hue: number; bars: number }) {
  return (
    <svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="160" height="90" fill={`hsl(${hue} 30% 18%)`} />
      {Array.from({ length: bars }, (_, i) => (
        <rect key={i} x={14 + i * 22} y={18 + (i % 2) * 8} width="56" height="40" rx="3" fill={`hsl(${hue + i * 40} 25% ${34 + i * 6}%)`} />
      ))}
    </svg>
  );
}

const SOURCES: PreflightSource[] = [
  { id: "screen:1", kind: "screen", name: "Screen 1", thumbnail: <Desk hue={220} bars={3} /> },
  { id: "screen:2", kind: "screen", name: "Screen 2", thumbnail: <Desk hue={30} bars={2} /> },
  { id: "window:figma", kind: "window", name: "Onboarding flow, Figma", thumbnail: <Desk hue={280} bars={1} /> },
  { id: "window:code", kind: "window", name: "release-notes.md, Code", thumbnail: <Desk hue={200} bars={2} /> },
];

export default function SourcePickerDemo() {
  const panelId = useId();
  const [kind, setKind] = useState<SourceKind>("screen");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>("screen:1");
  const items = SOURCES.filter((s) => (kind === "window" ? s.kind === "window" : s.kind === "screen")).filter((s) => s.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={preflightTheme()} className="w-full max-w-2xl mx-auto overflow-hidden rounded-[14px] border border-[var(--pf-border)] bg-[var(--pf-bg-app)] flex flex-col">
      <div id={panelId} role="tabpanel" aria-labelledby={`${panelId}-tab-${kind}`} className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
        {items.map((s) => (
          <div key={s.id} className="min-w-0">
            <SourceCard source={s} selected={selectedId === s.id} onSelect={setSelectedId} />
          </div>
        ))}
        {items.length === 0 && <p className="col-span-full text-center text-sm text-[var(--pf-text-2)]">No sources found</p>}
      </div>
      <div className="border-t border-[var(--pf-border)] bg-[var(--pf-surface)]">
        <SourceKindBar value={kind} onChange={setKind} query={query} onQueryChange={setQuery} panelId={panelId} />
      </div>
    </div>
  );
}
