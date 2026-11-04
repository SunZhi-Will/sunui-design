"use client";

import { useEffect, useState } from "react";

import { ChapterSeekbar, formatTime, type SeekChapter } from "./chapter-seekbar";

const DURATION = 18 * 60 + 24;

const chapters: SeekChapter[] = [
  { t: 0, title: "Opening" },
  { t: 74, title: "Unboxing the camera" },
  { t: 262, title: "Sensor and lens" },
  { t: 548, title: "Low light test" },
  { t: 806, title: "Battery life" },
  { t: 1012, title: "Verdict" },
];

export default function ChapterSeekbarDemo() {
  const [current, setCurrent] = useState(301);
  const [playing, setPlaying] = useState(true);
  const chapter = [...chapters].reverse().find((c) => c.t <= current)?.title;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setCurrent((c) => Math.min(DURATION, c + 1)), 1000);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <div className="w-full max-w-3xl min-w-0 overflow-hidden rounded-xl bg-[#0d0f13] text-[#e9ecf1] select-none">
      {/* 影片畫面以漸層色塊示意 */}
      <div className="relative h-52 sm:h-80" style={{ background: "radial-gradient(circle at 30% 35%, #3a4560, #0d0f13 75%)" }}>
        <div className="absolute top-[22%] left-[14%] h-[44%] w-[36%] rounded-xl bg-[#1e222b]" />
        <div className="absolute top-[30%] left-[58%] h-[24%] w-[24%] rounded-lg bg-[#282d38]" />
        <p className="absolute top-3 left-4 text-sm font-semibold">Mirrorless camera review</p>
      </div>
      <div className="px-3.5 pt-3 pb-1.5">
        <ChapterSeekbar duration={DURATION} current={current} buffered={Math.min(DURATION, current + 120)} chapters={chapters} onSeek={setCurrent} labels={{ seek: "Video position" }} />
        <div className="flex h-11 min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pause" : "Play"}
            className="grid size-10 shrink-0 place-items-center rounded-lg hover:bg-white/10"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
              {playing ? <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /> : <path d="M8 5.5v13l10.5-6.5z" />}
            </svg>
          </button>
          <span className="shrink-0 text-[13px] tabular-nums">{formatTime(current)} / {formatTime(DURATION)}</span>
          <span className="min-w-0 truncate text-[13px] text-white/60">{chapter}</span>
        </div>
      </div>
    </div>
  );
}
