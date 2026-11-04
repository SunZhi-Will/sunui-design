"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";


export interface SpeedReaderProps {
  text: string;
  wpm?: number;
  defaultWpm?: number;
  onWpmChange?: (wpm: number) => void;
  /** 中日文每 2 到 3 字一組，而不是依空白切 */
  chunkCJK?: boolean;
  minWpm?: number;
  maxWpm?: number;
  labels?: SpeedReaderLabels;
  className?: string;
}

const defaultLabels = {
  region: "Speed reader",
  play: "Play",
  pause: "Pause",
  back: "Back 10 words",
  forward: "Forward 10 words",
  slower: "Slower",
  faster: "Faster",
  progress: "Reading position",
  wpm: "words per minute",
  filterSymbols: "Skip symbols",
  help: "Keyboard shortcuts",
  closeHelp: "Close",
  elapsed: "Elapsed",
  remaining: "Left",
  paused: (i: number, n: number) => `Paused at word ${i} of ${n}`,
  done: "Finished",
  shortcuts: [
    ["Space", "Play or pause"],
    ["← →", "Back or forward 10 words"],
    ["↑ ↓", "Faster or slower"],
    ["?", "Show this list"],
  ] as [string, string][],
};

export type SpeedReaderLabels = Partial<typeof defaultLabels>;

const CJK = /[぀-ヿ㐀-鿿豈-﫿]/;
const PUNCT_CJK = /[，。！？、；：「」『』（）《》…]/;
const SYMBOL_ONLY = /^[^\p{L}\p{N}]+$/u;

export function tokenize(text: string, chunkCJK = true, filterSymbols = false): string[] {
  const out: string[] = [];
  for (const raw of text.split(/\s+/).filter(Boolean)) {
    if (!chunkCJK || !CJK.test(raw)) {
      out.push(raw);
      continue;
    }
    // 依 2 到 3 字切組，標點黏在前一組後面
    let buf = "";
    for (const ch of raw) {
      if (PUNCT_CJK.test(ch) && buf) {
        buf += ch;
        out.push(buf);
        buf = "";
        continue;
      }
      buf += ch;
      if (buf.length >= 2 && CJK.test(ch)) {
        out.push(buf);
        buf = "";
      }
    }
    if (buf) {
      if (buf.length === 1 && out.length && CJK.test(buf)) out[out.length - 1] += buf;
      else out.push(buf);
    }
  }
  if (!filterSymbols) return out;
  return out.map((w) => w.replace(/["'“”‘’()[\]{}<>*_#|「」『』（）《》]/g, "")).filter((w) => w && !SYMBOL_ONLY.test(w));
}

/** 最佳辨識點：英文偏左，CJK 取中間 */
function pivotOf(word: string) {
  const n = [...word].length;
  if (CJK.test(word)) return Math.floor((n - 1) / 2);
  if (n <= 1) return 0;
  if (n <= 5) return 1;
  if (n <= 9) return 2;
  if (n <= 13) return 3;
  return 4;
}

function delayOf(word: string, wpm: number) {
  const base = 60_000 / wpm;
  if (/[.!?。！？…]["”」』]?$/.test(word)) return base * 2.2;
  if (/[,;:，、；：]$/.test(word)) return base * 1.5;
  return [...word].length > 9 ? base * 1.3 : base;
}

const clock = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export function SpeedReader({
  text,
  wpm: wpmProp,
  defaultWpm = 300,
  onWpmChange,
  chunkCJK = true,
  minWpm = 100,
  maxWpm = 900,
  labels,
  className,
}: SpeedReaderProps) {
  const t = { ...defaultLabels, ...labels };
  const [filter, setFilter] = useState(false);
  const words = useMemo(() => tokenize(text, chunkCJK, filter), [text, chunkCJK, filter]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [help, setHelp] = useState(false);
  const [innerWpm, setInnerWpm] = useState(defaultWpm);
  const wpm = wpmProp ?? innerWpm;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = words.length;
  const word = words[Math.min(index, total - 1)] ?? "";
  const atEnd = index >= total - 1;

  useEffect(() => setIndex((i) => Math.min(i, Math.max(0, total - 1))), [total]);

  useEffect(() => {
    if (!playing) return;
    if (atEnd) {
      setPlaying(false);
      return;
    }
    timer.current = setTimeout(() => setIndex((i) => i + 1), delayOf(word, wpm));
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [playing, index, word, wpm, atEnd]);

  // 分頁隱藏時暫停
  useEffect(() => {
    const onVis = () => document.hidden && setPlaying(false);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const setWpm = (next: number) => {
    const v = Math.min(maxWpm, Math.max(minWpm, next));
    if (wpmProp === undefined) setInnerWpm(v);
    onWpmChange?.(v);
  };
  const seek = (i: number) => setIndex(Math.min(Math.max(0, i), Math.max(0, total - 1)));
  const toggle = () => {
    if (!playing && atEnd) setIndex(0);
    setPlaying((p) => !p);
  };

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const tag = (e.target as HTMLElement).tagName;
    // 按鈕與勾選框保留原生的空白鍵行為；滑桿保留方向鍵
    if (tag === "BUTTON" && e.key === " ") return;
    if (tag === "INPUT" && e.key !== "?" && e.key !== "Escape") return;
    const map: Record<string, () => void> = {
      " ": toggle,
      ArrowLeft: () => seek(index - 10),
      ArrowRight: () => seek(index + 10),
      ArrowUp: () => setWpm(wpm + 25),
      ArrowDown: () => setWpm(wpm - 25),
      "?": () => setHelp((h) => !h),
      Escape: () => setHelp(false),
    };
    const fn = map[e.key];
    if (!fn) return;
    e.preventDefault();
    fn();
  }

  const chars = [...word];
  const pivot = pivotOf(word);
  const perWord = 60_000 / wpm;
  const iconBtn =
    "inline-flex size-9 items-center justify-center rounded-md border border-border text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40";

  return (
    <div
      role="region"
      aria-label={t.region}
      aria-keyshortcuts="Space ArrowLeft ArrowRight ArrowUp ArrowDown ?"
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={cn("relative w-full rounded-xl border border-border bg-card p-4 text-card-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
    >
      {/* 舞台：以辨識點對齊，左右兩段各佔一半 */}
      <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
        <span aria-hidden="true" className="absolute inset-x-0 top-3 mx-auto h-2 w-px bg-border" />
        <span aria-hidden="true" className="absolute inset-x-0 bottom-3 mx-auto h-2 w-px bg-border" />
        <p aria-hidden="true" className="grid w-full grid-cols-[1fr_auto_1fr] font-mono text-3xl tracking-normal whitespace-pre sm:text-4xl">
          <span className="text-right">{chars.slice(0, pivot).join("")}</span>
          <span className="text-primary">{chars[pivot] ?? ""}</span>
          <span className="text-left">{chars.slice(pivot + 1).join("")}</span>
        </p>
      </div>

      <p aria-hidden="true" className="mt-3 truncate text-center text-sm text-muted-foreground">
        {words.slice(Math.max(0, index - 5), index + 6).map((w, k) => {
          const i = Math.max(0, index - 5) + k;
          return (
            <span key={i} className={cn("rounded px-0.5", i === index && "bg-primary/10 text-foreground")}>
              {w}{" "}
            </span>
          );
        })}
      </p>

      <input
        type="range"
        min={0}
        max={Math.max(0, total - 1)}
        value={Math.min(index, Math.max(0, total - 1))}
        onChange={(e) => seek(Number(e.target.value))}
        aria-label={t.progress}
        aria-valuetext={`${index + 1} / ${total}`}
        className="mt-3 w-full accent-[var(--primary)]"
      />
      <div className="mt-1 flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>{`${t.elapsed} ${clock(index * perWord)}`}</span>
        <span>{`${t.remaining} ${clock((total - 1 - index) * perWord)}`}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" aria-label={t.back} onClick={() => seek(index - 10)} className={iconBtn}><Icon d="M11 7 6 12l5 5M18 7l-5 5 5 5" /></button>
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? t.pause : t.play}
          className="inline-flex h-9 min-w-20 items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Icon d={playing ? "M8 6v12M16 6v12" : "M8 5.5v13l10-6.5Z"} />
          {playing ? t.pause : t.play}
        </button>
        <button type="button" aria-label={t.forward} onClick={() => seek(index + 10)} className={iconBtn}><Icon d="M13 7l5 5-5 5M6 7l5 5-5 5" /></button>

        <div className="ml-auto flex items-center gap-1">
          <button type="button" aria-label={t.slower} onClick={() => setWpm(wpm - 25)} disabled={wpm <= minWpm} className={iconBtn}>
            <Icon d="M6 12h12" />
          </button>
          <span className="w-20 text-center text-sm tabular-nums" aria-live="polite">
            {wpm} <span className="text-xs text-muted-foreground">wpm</span>
            <span className="sr-only"> {t.wpm}</span>
          </span>
          <button type="button" aria-label={t.faster} onClick={() => setWpm(wpm + 25)} disabled={wpm >= maxWpm} className={iconBtn}>
            <Icon d="M12 6v12M6 12h12" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={filter} onChange={(e) => setFilter(e.target.checked)} className="size-4 accent-[var(--primary)]" />
          {t.filterSymbols}
        </label>
        <button type="button" onClick={() => setHelp(true)} aria-expanded={help} className="underline-offset-4 hover:text-foreground hover:underline">
          {t.help} (?)
        </button>
      </div>

      {help && (
        <div role="dialog" aria-label={t.help} className="absolute inset-2 z-10 flex flex-col rounded-lg border border-border bg-card p-4 shadow-sm">
          <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">{t.help}</p>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            {t.shortcuts.map(([k, v]) => (
              <div key={k} className="contents">
                <dt><kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-xs">{k}</kbd></dt>
                <dd className="text-muted-foreground">{v}</dd>
              </div>
            ))}
          </dl>
          <button type="button" autoFocus onClick={() => setHelp(false)} className="mt-auto w-fit rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted">
            {t.closeHelp}
          </button>
        </div>
      )}

      <span className="sr-only" role="status" aria-live="polite">
        {playing ? "" : atEnd && index > 0 ? t.done : t.paused(index + 1, total)}
      </span>
    </div>
  );
}

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
