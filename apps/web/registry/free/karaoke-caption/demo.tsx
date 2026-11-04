"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { KaraokeCaption, type SubtitleItem } from "./karaoke-caption";

type Speaker = "Mei" | "Owen";
type Turn = { speaker: Speaker; duration: number; subtitles: SubtitleItem[] };

// 兩位講者沿用原作的金與青銅兩色，彼此分得開又不刺眼
const SPEAKERS = {
  Mei: { accent: "#a9781a", soft: "#f6ecd2", role: "主持人", initial: "M" },
  Owen: { accent: "#8b5e34", soft: "#f3e6d8", role: "來賓", initial: "O" },
} as const;

const turns: Turn[] = [
  {
    speaker: "Mei",
    duration: 6.2,
    subtitles: [
      { text: "歡迎回到 Night Shelf，", start: 0, end: 2.4 },
      { text: "今天聊聊怎麼替沒有插畫的小說做封面。", start: 2.5, end: 6.2 },
    ],
  },
  {
    speaker: "Owen",
    duration: 7,
    subtitles: [
      { text: "我們的做法很簡單：", start: 0, end: 1.8 },
      { text: "用作品 id 當種子，算出色相和紋理。", start: 1.9, end: 4.6 },
      { text: "Same book, same cover.", start: 4.7, end: 7 },
    ],
  },
];

const timeline = turns.reduce<(Turn & { start: number })[]>((acc, t) => {
  const prev = acc[acc.length - 1];
  acc.push({ ...t, start: prev ? prev.start + prev.duration : 0 });
  return acc;
}, []);
const TOTAL = timeline.reduce((s, t) => s + t.duration, 0);
const STEP = 0.05;

const clock = (s: number) => `0:${Math.floor(s).toString().padStart(2, "0")}`;

export default function KaraokeCaptionDemo() {
  const reduce = useReducedMotion() ?? false;
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);

  // 模擬播放：每 50ms 前進，播完自動停
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setTime((t) => {
        const next = Math.min(TOTAL, t + STEP);
        if (next >= TOTAL) setPlaying(false);
        return next;
      });
    }, STEP * 1000);
    return () => clearInterval(id);
  }, [playing]);

  const toggle = () => {
    if (!playing && time >= TOTAL) setTime(0);
    setPlaying((p) => !p);
  };

  const turn = timeline.find((t) => time >= t.start && time <= t.start + t.duration) ?? timeline[timeline.length - 1];
  const speaker = turn.speaker;

  // 與原作同一條波形公式，只在播放中跳動
  const bar = (i: number, on: boolean) => {
    if (!on || !playing || reduce) return 6;
    const wave = Math.abs(Math.sin(time * 25 + i * 1.5));
    const envelope = 0.4 + 0.6 * Math.abs(Math.cos(time * 2));
    return Math.min(32, Math.max(6, 6 + wave * 26 * envelope));
  };

  return (
    <section aria-labelledby="podcast-heading" className="w-full max-w-2xl space-y-3">
      <div className="relative overflow-hidden rounded-[20px] border border-slate-200 bg-[radial-gradient(125%_85%_at_50%_-12%,#ffffff_0%,#f2f4fa_56%,#eaeef7_100%)] p-4 text-slate-950 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 id="podcast-heading" className="min-w-0 truncate text-sm font-black tracking-[0.24em] text-slate-900 uppercase">
            Night Shelf
          </h2>
          <span className="shrink-0 rounded-full border border-slate-200 bg-white/85 px-3 py-1 text-[10px] font-black tracking-[0.22em] text-slate-500 uppercase">
            Podcast
          </span>
        </div>

        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(Object.keys(SPEAKERS) as Speaker[]).map((name) => {
            const meta = SPEAKERS[name];
            const on = speaker === name;
            return (
              <li
                key={name}
                className="flex min-w-0 items-center gap-3 rounded-[18px] border p-3 transition-all duration-300 motion-reduce:transition-none"
                style={{
                  borderColor: on ? meta.accent : "rgb(226 232 240)",
                  background: on ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.55)",
                  opacity: on ? 1 : 0.5,
                  transform: on ? "scale(1)" : "scale(0.97)",
                }}
              >
                <span
                  aria-hidden="true"
                  className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-[#0f172a] text-lg font-black text-white"
                  style={{ boxShadow: on ? `0 0 0 4px ${meta.soft}` : "none" }}
                >
                  {meta.initial}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-black">{name}</span>
                  <span className="block text-[11px] font-black tracking-[0.22em]" style={{ color: on ? meta.accent : "#94a3b8" }}>
                    {meta.role}
                  </span>
                </span>
                <span aria-hidden="true" className="flex h-8 items-end gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className="w-1 rounded-full"
                      style={{ height: bar(i, on), backgroundColor: on ? meta.accent : "#cbd5e1" }}
                    />
                  ))}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-5 flex min-h-20 items-center justify-center">
          <KaraokeCaption
            subtitles={turn.subtitles}
            time={time - turn.start}
            accent={SPEAKERS[speaker].accent}
            labels={{ region: `${speaker} captions` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
            {playing ? <path d="M5 3.5v9M11 3.5v9" strokeLinecap="round" /> : <path d="M5 3.5v9l7.5-4.5Z" />}
          </svg>
        </button>
        <input
          type="range"
          min={0}
          max={TOTAL}
          step={STEP}
          value={time}
          onChange={(e) => setTime(Number(e.target.value))}
          aria-label="Seek"
          aria-valuetext={`${clock(time)} of ${clock(TOTAL)}`}
          className="h-1 min-w-0 flex-1 accent-current"
        />
        <span className="w-16 shrink-0 text-right font-mono text-xs text-muted-foreground tabular-nums">
          {clock(time)} / {clock(TOTAL)}
        </span>
      </div>
    </section>
  );
}
