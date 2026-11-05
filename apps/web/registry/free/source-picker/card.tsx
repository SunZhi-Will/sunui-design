"use client";

import { useId, useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

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

const BASE = [
  { id: "screen:1", kind: "screen", thumbnail: <Desk hue={220} bars={3} /> },
  { id: "screen:2", kind: "screen", thumbnail: <Desk hue={30} bars={2} /> },
  { id: "window:figma", kind: "window", thumbnail: <Desk hue={280} bars={1} /> },
  { id: "window:code", kind: "window", thumbnail: <Desk hue={200} bars={2} /> },
] as const;

const copy = {
  en: { names: ["Screen 1", "Screen 2", "Figma", "Code"], empty: "No sources found" },
  "zh-TW": { names: ["螢幕 1", "螢幕 2", "Figma", "Code"], empty: "找不到來源" },
  "zh-CN": { names: ["屏幕 1", "屏幕 2", "Figma", "Code"], empty: "未找到来源" },
  ja: { names: ["画面 1", "画面 2", "Figma", "Code"], empty: "ソースが見つかりません" },
};

/** 型錄卡片：兩張來源縮圖可選取，底部分頁切換螢幕或視窗，並可搜尋。 */
export default function SourcePickerCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const SOURCES: PreflightSource[] = BASE.map((s, i) => ({ ...s, name: t.names[i] }));
  const panelId = useId();
  const [kind, setKind] = useState<SourceKind>("screen");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>("screen:1");
  const items = SOURCES.filter((s) => (kind === "window" ? s.kind === "window" : s.kind === "screen")).filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div style={preflightTheme()} className="mx-auto flex w-[300px] flex-col overflow-hidden rounded-[14px] border border-[var(--pf-border)] bg-[var(--pf-bg-app)]">
      <div id={panelId} role="tabpanel" aria-labelledby={`${panelId}-tab-${kind}`} className="grid min-h-[96px] grid-cols-2 content-center gap-2.5 p-3">
        {items.map((s) => (
          <div key={s.id} className="min-w-0">
            <SourceCard source={s} selected={selectedId === s.id} onSelect={setSelectedId} />
          </div>
        ))}
        {items.length === 0 && <p className="col-span-full text-center text-sm text-[var(--pf-text-2)]">{t.empty}</p>}
      </div>
      <div className="border-t border-[var(--pf-border)] bg-[var(--pf-surface)]">
        <SourceKindBar locale={locale} value={kind} onChange={setKind} query={query} onQueryChange={setQuery} panelId={panelId} />
      </div>
    </div>
  );
}
