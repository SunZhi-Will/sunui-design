"use client";

import { useEffect, useState } from "react";

import { KaraokeCaption, type SubtitleItem } from "./karaoke-caption";

const subtitles: SubtitleItem[] = [
  { text: "歡迎回到 Night Shelf，", start: 0, end: 2.4 },
  { text: "今天聊聊怎麼替沒有插畫的小說做封面。", start: 2.5, end: 6.2 },
  { text: "Same book, same cover.", start: 6.3, end: 8.5 },
];
const TOTAL = 8.5;
const STEP = 0.05;

export default function KaraokeCaptionDemo() {
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

  return (
    <div className="w-full max-w-2xl min-w-0 rounded-[20px] border border-slate-200 bg-[radial-gradient(125%_85%_at_50%_-12%,#ffffff_0%,#f2f4fa_56%,#eaeef7_100%)] p-4 text-slate-950 sm:p-6">
      <div className="flex min-h-24 items-center justify-center">
        <KaraokeCaption subtitles={subtitles} time={time} labels={{ region: "Episode captions" }} />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
        >
          <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
            {playing ? <path d="M5 3.5v9M11 3.5v9" strokeLinecap="round" /> : <path d="M5 3.5v9l7.5-4.5Z" />}
          </svg>
        </button>
        <input type="range" min={0} max={TOTAL} step={STEP} value={time} onChange={(e) => setTime(Number(e.target.value))} aria-label="Seek" className="h-1 min-w-0 flex-1 accent-slate-900" />
        <span className="w-10 shrink-0 text-right font-mono text-xs text-slate-500 tabular-nums">0:{Math.floor(time).toString().padStart(2, "0")}</span>
      </div>
    </div>
  );
}
