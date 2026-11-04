"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface MediaItem {
  id: string;
  kind: "image" | "video";
  thumb: ReactNode;
  /** 影片長度，例如 "0:42" */
  duration?: string;
  alt?: string;
}

export interface MediaPickerLabels {
  title?: ReactNode;
  selectAll?: ReactNode;
  selectNone?: ReactNode;
  includeText?: ReactNode;
  summary?: (count: number, videos: number) => ReactNode;
  downloadOne?: ReactNode;
  downloadMany?: (count: number) => ReactNode;
  pickSome?: ReactNode;
  pro?: ReactNode;
  item?: (index: number, kind: MediaItem["kind"]) => string;
}

export interface MediaPickerProps {
  items: MediaItem[];
  /** 依點選順序排列的 id */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (ids: string[]) => void;
  onDownload?: (ids: string[], options: { includeText: boolean }) => void;
  /** 記住「包含貼文文字」的上次選擇 */
  persistKey?: string;
  lockedOptions?: { label: ReactNode; reason: ReactNode }[];
  labels?: MediaPickerLabels;
  className?: string;
}

const defaultLabels: Required<MediaPickerLabels> = {
  title: "Download media",
  selectAll: "Select all",
  selectNone: "Select none",
  includeText: "Include caption text",
  summary: (count, videos) => (
    <>
      {count} {count === 1 ? "item" : "items"}
      {videos > 0 && <> · {videos} {videos === 1 ? "video" : "videos"}</>}
    </>
  ),
  downloadOne: "Download file",
  downloadMany: (n) => <>Download {n} as ZIP</>,
  pickSome: "Pick at least one",
  pro: "Pro",
  item: (i, kind) => `${kind === "video" ? "Video" : "Image"} ${i + 1}`,
};

const springs = { snappy: { type: "spring", stiffness: 520, damping: 34 } } as const;

function readPersisted(key?: string) {
  if (!key) return true;
  try {
    const v = localStorage.getItem(key);
    return v === null ? true : v === "1";
  } catch {
    return true;
  }
}

export function MediaPicker({
  items,
  value: valueProp,
  defaultValue = [],
  onValueChange,
  onDownload,
  persistKey,
  lockedOptions = [],
  labels,
  className,
}: MediaPickerProps) {
  const t = { ...defaultLabels, ...labels };
  const reduce = useReducedMotion() ?? false;
  const id = useId();
  const [inner, setInner] = useState(defaultValue);
  const value = valueProp ?? inner;
  const [includeText, setIncludeText] = useState(true);
  const [active, setActive] = useState(0);
  const cells = useRef<(HTMLDivElement | null)[]>([]);

  // 掛載後才讀 localStorage，避免 hydration 不一致
  useEffect(() => setIncludeText(readPersisted(persistKey)), [persistKey]);

  const set = (next: string[]) => {
    if (valueProp === undefined) setInner(next);
    onValueChange?.(next);
  };
  const toggle = (itemId: string) => set(value.includes(itemId) ? value.filter((v) => v !== itemId) : [...value, itemId]);

  const setText = (on: boolean) => {
    setIncludeText(on);
    if (!persistKey) return;
    try {
      localStorage.setItem(persistKey, on ? "1" : "0");
    } catch {
      // 私密模式等情況無法寫入，忽略即可
    }
  };

  const cols = 3;
  const onGridKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols };
    if (e.key in moves) {
      e.preventDefault();
      const next = Math.min(items.length - 1, Math.max(0, active + moves[e.key]));
      setActive(next);
      cells.current[next]?.focus();
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (items[active]) toggle(items[active].id);
    } else if ((e.key === "a" || e.key === "A") && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      set(items.map((i) => i.id));
    }
  };

  const videos = value.filter((v) => items.find((i) => i.id === v)?.kind === "video").length;
  const allSelected = value.length === items.length && items.length > 0;

  return (
    <section aria-labelledby={`${id}-title`} className={cn("w-full max-w-md rounded-xl border border-border bg-card text-card-foreground", className)}>
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h3 id={`${id}-title`} className="text-sm font-semibold">
          {t.title}
        </h3>
        <button
          type="button"
          onClick={() => set(allSelected ? [] : items.map((i) => i.id))}
          className="text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
        >
          {allSelected ? t.selectNone : t.selectAll}
        </button>
      </header>

      <div
        role="listbox"
        aria-multiselectable="true"
        aria-labelledby={`${id}-title`}
        onKeyDown={onGridKey}
        className="grid grid-cols-3 gap-2 p-4"
      >
        {items.map((item, i) => {
          const order = value.indexOf(item.id);
          const selected = order >= 0;
          return (
            <div
              key={item.id}
              ref={(el) => {
                cells.current[i] = el;
              }}
              role="option"
              aria-selected={selected}
              aria-label={item.alt ?? t.item(i, item.kind)}
              tabIndex={i === active ? 0 : -1}
              onFocus={() => setActive(i)}
              onClick={() => toggle(item.id)}
              className={cn(
                "relative aspect-square cursor-pointer overflow-hidden rounded-md border outline-none select-none",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                selected ? "border-primary" : "border-border",
              )}
            >
              <div className={cn("size-full transition-opacity", value.length > 0 && !selected && "opacity-60")}>{item.thumb}</div>
              {item.kind === "video" && (
                <span className="absolute bottom-1 left-1 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-white tabular-nums">
                  <svg viewBox="0 0 16 16" className="size-2.5" fill="currentColor" aria-hidden="true">
                    <path d="M5 3.5v9l7-4.5-7-4.5Z" />
                  </svg>
                  {item.duration}
                </span>
              )}
              <motion.span
                aria-hidden="true"
                initial={false}
                animate={{ scale: selected ? 1 : 0.6, opacity: selected ? 1 : 0 }}
                transition={reduce ? { duration: 0 } : springs.snappy}
                className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground tabular-nums"
              >
                {selected ? order + 1 : ""}
              </motion.span>
              {!selected && (
                <span aria-hidden="true" className="absolute top-1 right-1 size-5 rounded-full border border-zinc-500/70 bg-white/60" />
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-2 border-t border-border px-4 py-3 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={includeText}
            onChange={(e) => setText(e.target.checked)}
            className="size-4 accent-primary"
          />
          {t.includeText}
        </label>
        {lockedOptions.map((opt, i) => (
          <div key={i} className="flex items-start gap-2 text-muted-foreground" aria-disabled="true">
            <input type="checkbox" disabled className="mt-0.5 size-4" aria-describedby={`${id}-lock-${i}`} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                {opt.label}
                <span className="rounded-full border border-border px-1.5 text-[10px] font-medium tracking-wide uppercase">{t.pro}</span>
              </span>
              <span id={`${id}-lock-${i}`} className="block text-xs">
                {opt.reason}
              </span>
            </span>
          </div>
        ))}
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
        <span className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
          {value.length ? t.summary(value.length, videos) : t.pickSome}
        </span>
        <button
          type="button"
          disabled={!value.length}
          onClick={() => onDownload?.(value, { includeText })}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {value.length > 1 ? t.downloadMany(value.length) : t.downloadOne}
        </button>
      </footer>
    </section>
  );
}
