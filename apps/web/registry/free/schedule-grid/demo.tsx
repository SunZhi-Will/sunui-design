"use client";

import { useState } from "react";

import { ScheduleGrid, type ScheduleItem, type SchedulePerson } from "./schedule-grid";

const staff: SchedulePerson[] = [
  { id: "ava", name: "Ava" },
  { id: "ben", name: "Ben" },
  { id: "chen", name: "Chen" },
  { id: "dara", name: "Dara" },
  { id: "eli", name: "Eli" },
];
const p = (id: string) => staff.find((s) => s.id === id)!;

const days = [
  { id: "mon", label: "Mon 10" },
  { id: "tue", label: "Tue 11" },
  { id: "wed", label: "Wed 12", isToday: true },
  { id: "thu", label: "Thu 13" },
  { id: "fri", label: "Fri 14" },
  { id: "sat", label: "Sat 15" },
  { id: "sun", label: "Sun 16" },
];

const rows = [
  { id: "am", label: "Morning", color: "#d97706" },
  { id: "pm", label: "Afternoon", color: "#0284c7" },
  { id: "close", label: "Close", color: "#7c3aed" },
];

const plan: Record<string, string[]> = {
  "mon:am": ["ava", "ben"], "mon:pm": ["chen"], "mon:close": ["dara"],
  "tue:am": ["ava", "eli"], "tue:pm": ["chen", "eli"], "tue:close": ["dara"],
  "wed:am": ["ben", "ava"], "wed:pm": ["eli"], "wed:close": ["chen"],
  "thu:am": ["ava", "dara"], "thu:pm": ["ben"], "thu:close": ["eli"],
  "fri:am": ["ben", "chen"], "fri:pm": ["ava", "eli"], "fri:close": ["dara"],
  "sat:am": ["ava", "ben", "eli"], "sat:pm": ["chen", "dara"], "sat:close": ["eli"],
  "sun:am": ["dara", "chen"], "sun:pm": ["ava", "ben"], "sun:close": [],
};

// 平日早班 2 人、午班與打烊 1 人；週末早班 3 人、午班 2 人
const need = (day: string, row: string) => {
  const weekend = day === "sat" || day === "sun";
  if (row === "am") return weekend ? 3 : 2;
  if (row === "pm") return weekend ? 2 : 1;
  return 1;
};

export default function ScheduleGridDemo() {
  const [items, setItems] = useState<ScheduleItem[]>(() =>
    Object.entries(plan).map(([key, ids]) => {
      const [day, row] = key.split(":");
      return { id: key, day, row, people: ids.map(p) };
    }),
  );
  const [focus, setFocus] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>("wed:pm");

  const sel = items.find((i) => i.id === selected);
  const [selDay, selRow] = selected?.split(":") ?? [];

  // 補人：挑一位當天還沒排班的同事
  function fillGap(key: string) {
    const [day] = key.split(":");
    const busy = new Set(items.filter((i) => i.day === day).flatMap((i) => i.people.map((x) => x.id)));
    const pick = staff.find((s) => !busy.has(s.id));
    if (!pick) return;
    setItems((list) => list.map((i) => (i.id === key ? { ...i, people: [...i.people, pick] } : i)));
    setSelected(key);
  }

  return (
    <div className="w-full max-w-6xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Week of Nov 10, Harbor St. cafe</h2>
          <p className="text-sm text-muted-foreground">Amber outlines changed since the published version.</p>
        </div>
        <div role="group" aria-label="Highlight a person" className="flex flex-wrap gap-1.5">
          {staff.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={focus === s.id}
              onClick={() => setFocus((f) => (f === s.id ? null : s.id))}
              className="rounded-full border border-border px-3 py-1 text-xs transition-colors hover:bg-muted aria-pressed:bg-foreground aria-pressed:text-background"
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <ScheduleGrid
          days={days}
          rows={rows}
          items={items}
          required={need}
          changedKeys={["tue:pm", "fri:am"]}
          focusId={focus}
          selectedId={selected}
          onSelect={(key) => setSelected(key)}
          onFillGap={fillGap}
        />
        <aside aria-live="polite" className="h-fit rounded-xl border border-border bg-card p-4">
          {selected ? (
            <>
              <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">Selected shift</p>
              <p className="mt-1 font-semibold">
                {rows.find((r) => r.id === selRow)?.label}, {days.find((d) => d.id === selDay)?.label}
              </p>
              <p className="mt-2 text-sm text-muted-foreground tabular-nums">
                {sel?.people.length ?? 0} of {need(selDay, selRow)} staffed
              </p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {(sel?.people ?? []).map((x) => (
                  <li key={x.id}>{x.name}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Pick a shift to see who is on it.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
