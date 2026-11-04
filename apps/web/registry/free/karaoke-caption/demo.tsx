"use client";

import { useEffect, useState } from "react";

import { KaraokeCaption, type CaptionCue } from "./karaoke-caption";

const DURATION = 12;
const STEP = 0.05;

const cues: CaptionCue[] = [
  { text: "Meet Lumen, the desk lamp that dims itself at dusk.", start: 0.3, end: 4.2 },
  { text: "傍晚一到，燈光就會自己變暖。", start: 4.4, end: 8.2 },
  { text: "Order today and it ships before the weekend.", start: 8.4, end: 11.8 },
];

const clock = (s: number) => `0:${Math.floor(s).toString().padStart(2, "0")}`;

export default function KaraokeCaptionDemo() {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);

  // 模擬播放：每 50ms 前進，播完自動停
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setTime((t) => {
        const next = Math.min(DURATION, t + STEP);
        if (next >= DURATION) setPlaying(false);
        return next;
      });
    }, STEP * 1000);
    return () => clearInterval(id);
  }, [playing]);

  const toggle = () => {
    if (!playing && time >= DURATION) setTime(0);
    setPlaying((p) => !p);
  };

  return (
    <section aria-labelledby="voiceover-heading" className="w-full max-w-2xl space-y-3">
      <div>
        <h2 id="voiceover-heading" className="text-lg font-semibold tracking-tight">
          Product voiceover
        </h2>
        <p className="text-sm text-muted-foreground">Captions follow the narration word by word, and character by character in Chinese.</p>
      </div>

      <div className="relative aspect-video overflow-hidden rounded-[3px] border border-border bg-muted">
        <svg viewBox="0 0 160 90" className="absolute inset-0 size-full text-muted-foreground/40" aria-hidden="true">
          <path d="M70 62h20M80 62V40M66 40h28l-6-12H72Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        <KaraokeCaption cues={cues} time={time} className="absolute inset-x-0 bottom-3 sm:bottom-5" />
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
          max={DURATION}
          step={STEP}
          value={time}
          onChange={(e) => setTime(Number(e.target.value))}
          aria-label="Seek"
          aria-valuetext={`${clock(time)} of ${clock(DURATION)}`}
          className="h-1 min-w-0 flex-1 accent-current"
        />
        <span className="w-16 shrink-0 text-right font-mono text-xs text-muted-foreground tabular-nums">
          {clock(time)} / {clock(DURATION)}
        </span>
      </div>
    </section>
  );
}
