"use client";

import { useEffect, useRef, useState } from "react";

import { ChapterSeekbar, type SeekChapter, type SeekMarker } from "./chapter-seekbar";

const DURATION = 12 * 60 + 40;

const chapters: SeekChapter[] = [
  { start: 0, title: "Intro" },
  { start: 95, title: "Setup" },
  { start: 260, title: "Build the form" },
  { start: 520, title: "Handle payments" },
  { start: 690, title: "Wrap up" },
];

const markers: SeekMarker[] = [
  { t: 210, label: "Code" },
  { t: 455, label: "Key point" },
  { t: 640, label: "Quiz" },
];

const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

export default function ChapterSeekbarDemo() {
  const [current, setCurrent] = useState(132);
  const [playing, setPlaying] = useState(false);
  const wasPlaying = useRef(false);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setCurrent((c) => {
        if (c + 0.25 >= DURATION) {
          setPlaying(false);
          return DURATION;
        }
        return c + 0.25;
      });
    }, 250);
    return () => clearInterval(id);
  }, [playing]);

  const chapter = [...chapters].reverse().find((c) => current >= c.start) ?? chapters[0];

  return (
    <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card text-card-foreground">
      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        aria-label={playing ? "Pause lesson" : "Play lesson"}
        className="relative flex aspect-video w-full items-center justify-center bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <span className="absolute top-3 left-4 text-left">
          <span className="block text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">Lesson 4</span>
          <span className="block text-sm font-medium">{chapter.title}</span>
        </span>
        <span className="flex size-14 items-center justify-center rounded-full border border-border bg-background">
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
            {playing ? <path d="M9 5v14M15 5v14" /> : <path d="M8 5.5v13l10-6.5z" />}
          </svg>
        </span>
      </button>

      <div className="space-y-3 px-4 pt-6 pb-4">
        <ChapterSeekbar
          duration={DURATION}
          current={current}
          buffered={Math.min(DURATION, current + 90)}
          chapters={chapters}
          markers={markers}
          onSeek={setCurrent}
          onScrubStart={() => {
            wasPlaying.current = playing;
            setPlaying(false);
          }}
          onScrubEnd={() => setPlaying(wasPlaying.current)}
          labels={{ seek: "Lesson position" }}
        />
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="truncate text-muted-foreground">Build a checkout with Stripe</span>
          <span className="shrink-0 font-mono text-xs tabular-nums">
            {fmt(current)} / {fmt(DURATION)}
          </span>
        </div>
      </div>
    </div>
  );
}
