"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface ScheduleDay {
  id: string;
  label: ReactNode;
  isToday?: boolean;
}

export interface ScheduleRow {
  id: string;
  label: ReactNode;
  /** 只用在 2px 色條 */
  color: string;
}

export interface SchedulePerson {
  id: string;
  name: string;
}

export interface ScheduleItem {
  id: string;
  day: string;
  row: string;
  people: SchedulePerson[];
}

export interface ScheduleGridLabels {
  shift?: string;
  short?: (n: number) => ReactNode;
  fillGap?: (n: number) => string;
  empty?: ReactNode;
  today?: string;
  changed?: string;
  dayStrip?: string;
  goToDay?: (label: string) => string;
}

export interface ScheduleGridProps {
  days: ScheduleDay[];
  rows: ScheduleRow[];
  items: ScheduleItem[];
  /** 每格需要的人數；key 為 `${day}:${row}` */
  required?: Record<string, number> | ((day: string, row: string) => number);
  /** 與上一版不同的格子，key 為 `${day}:${row}` */
  changedKeys?: string[];
  /** 只強調這個人的班，其他淡化 */
  focusId?: string | null;
  selectedId?: string | null;
  onSelect?: (key: string, item: ScheduleItem | undefined) => void;
  onFillGap?: (key: string, missing: number) => void;
  labels?: ScheduleGridLabels;
  className?: string;
}

const defaultLabels: Required<ScheduleGridLabels> = {
  shift: "Shift",
  short: (n) => <>Short {n}</>,
  fillGap: (n) => `Fill gap, ${n} more needed`,
  empty: "No one",
  today: "Today",
  changed: "Changed",
  dayStrip: "Days",
  goToDay: (label) => `Show ${label}`,
};

// 由 id 算出穩定色相，只上在小點
function hue(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}

const keyOf = (day: string, row: string) => `${day}:${row}`;

export function ScheduleGrid({
  days,
  rows,
  items,
  required,
  changedKeys = [],
  focusId,
  selectedId,
  onSelect,
  onFillGap,
  labels,
  className,
}: ScheduleGridProps) {
  const t = { ...defaultLabels, ...labels };
  const byKey = new Map(items.map((it) => [keyOf(it.day, it.row), it]));
  const changed = new Set(changedKeys);
  const need = (day: string, row: string) =>
    typeof required === "function" ? required(day, row) : (required?.[keyOf(day, row)] ?? 0);

  function cell(day: ScheduleDay, row: ScheduleRow) {
    const key = keyOf(day.id, row.id);
    const item = byKey.get(key);
    const people = item?.people ?? [];
    const missing = Math.max(0, need(day.id, row.id) - people.length);
    const selected = selectedId === key;
    return (
      <div
        className={cn(
          "relative flex h-full min-h-20 flex-col gap-1.5 rounded-md p-2 text-left",
          changed.has(key) && "outline outline-1 -outline-offset-1 outline-amber-500",
          selected && "ring-2 ring-ring",
        )}
      >
        {onSelect && (
          <button
            type="button"
            aria-pressed={selected}
            aria-label={`${row.label} ${typeof day.label === "string" ? day.label : day.id}`}
            onClick={() => onSelect(key, item)}
            className="absolute inset-0 rounded-md outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
          />
        )}
        {changed.has(key) && <span className="sr-only">{t.changed}</span>}
        {people.length === 0 && missing === 0 && <span className="text-xs text-muted-foreground">{t.empty}</span>}
        <ul className="pointer-events-none relative flex flex-wrap gap-1">
          {people.map((p) => (
            <li
              key={p.id}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-xs transition-opacity duration-200",
                focusId && focusId !== p.id && "opacity-40",
                focusId === p.id && "border-foreground/40 font-medium",
              )}
            >
              <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: `hsl(${hue(p.id)} 55% 50%)` }} />
              {p.name}
            </li>
          ))}
        </ul>
        {missing > 0 && (
          <button
            type="button"
            disabled={!onFillGap}
            aria-label={t.fillGap(missing)}
            onClick={() => onFillGap?.(key, missing)}
            className="relative w-fit rounded-md border border-dashed border-amber-500 px-2 py-0.5 text-xs font-medium text-amber-700 tabular-nums outline-none hover:bg-amber-500/10 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default dark:text-amber-400"
          >
            {t.short(missing)}
          </button>
        )}
      </div>
    );
  }

  // 行動版：一次一天，水平捲動吸附
  const strip = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(() => Math.max(0, days.findIndex((d) => d.isToday)));
  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
      },
      { root: el, threshold: 0.6 },
    );
    el.querySelectorAll("[data-index]").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [days.length]);
  const goTo = (i: number) => {
    const el = strip.current?.querySelector<HTMLElement>(`[data-index="${i}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  return (
    <div className={cn("w-full text-sm text-foreground", className)}>
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-card md:block">
        <table className="w-full min-w-[44rem] table-fixed border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="sticky left-0 z-10 w-32 bg-card px-3 py-2 text-left text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                {t.shift}
              </th>
              {days.map((d) => (
                <th key={d.id} scope="col" aria-current={d.isToday ? "date" : undefined} className="px-2 py-2 text-left text-xs font-medium">
                  <span className={cn(d.isToday ? "text-primary" : "text-muted-foreground")}>{d.label}</span>
                  {d.isToday && <span className="sr-only"> {t.today}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-b-0">
                <th scope="row" className="sticky left-0 z-10 bg-card px-3 py-2 text-left align-top font-medium">
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true" className="h-4 w-0.5 rounded-full" style={{ background: r.color }} />
                    {r.label}
                  </span>
                </th>
                {days.map((d) => (
                  <td key={d.id} className={cn("p-1 align-top", d.isToday && "bg-primary/5")}>
                    {cell(d, r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden">
        <div
          ref={strip}
          role="group"
          aria-label={t.dayStrip}
          className="flex snap-x snap-mandatory overflow-x-auto rounded-xl border border-border bg-card [scrollbar-width:none]"
        >
          {days.map((d, i) => (
            <section key={d.id} data-index={i} aria-label={typeof d.label === "string" ? d.label : d.id} className="w-full shrink-0 snap-start p-3">
              <h3 className={cn("mb-2 text-sm font-semibold", d.isToday && "text-primary")}>{d.label}</h3>
              <div className="space-y-2">
                {rows.map((r) => (
                  <div key={r.id} className="rounded-lg border border-border">
                    <p className="flex items-center gap-2 border-b border-border px-2 py-1.5 text-xs font-medium">
                      <span aria-hidden="true" className="h-3 w-0.5 rounded-full" style={{ background: r.color }} />
                      {r.label}
                    </p>
                    {cell(d, r)}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="mt-2 flex justify-center gap-1.5">
          {days.map((d, i) => (
            <button
              key={d.id}
              type="button"
              aria-label={t.goToDay(typeof d.label === "string" ? d.label : d.id)}
              aria-current={i === active ? "true" : undefined}
              onClick={() => goTo(i)}
              className={cn("size-2 rounded-full transition-colors", i === active ? "bg-foreground" : "bg-border", d.isToday && i !== active && "bg-primary/50")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
