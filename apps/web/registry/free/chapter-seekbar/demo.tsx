"use client";

import { useEffect, useState } from "react";

import { ChapterSeekbar, formatTime, type SeekChapter, type SeekMarker } from "./chapter-seekbar";

const DURATION = 18 * 60 + 24;

const chapters: SeekChapter[] = [
  { t: 0, title: "Opening" },
  { t: 74, title: "Unboxing the camera" },
  { t: 262, title: "Sensor and lens" },
  { t: 548, title: "Low light test" },
  { t: 806, title: "Battery life" },
  { t: 1012, title: "Verdict" },
];

const markers: SeekMarker[] = [
  { t: 333, label: "Bookmark", kind: "user" },
  { t: 612, label: "Clip", kind: "clip" },
  { t: 890, label: "Sponsor" },
];

// 縮圖用漸層色塊代替，依時間換色
function Thumb({ t }: { t: number }) {
  const hue = Math.round((t / DURATION) * 220 + 20);
  return (
    <div className="flex h-full w-full items-end p-2" style={{ background: `linear-gradient(135deg, hsl(${hue} 45% 32%), hsl(${hue + 40} 35% 12%))` }}>
      <span className="h-2 w-16 rounded-full bg-white/25" />
    </div>
  );
}

export default function ChapterSeekbarDemo() {
  const [current, setCurrent] = useState(301);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setCurrent((c) => (c + 0.25 >= DURATION ? DURATION : c + 0.25)), 250);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <div className="w-full max-w-3xl">
      <div className="relative aspect-video w-full overflow-hidden rounded-[10px] bg-black select-none">
        {/* 影片畫面以色塊示意 */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 30% 35%, #2b3242, #0d0f13 70%)" }} />
        <div className="absolute top-[22%] left-[18%] h-[38%] w-[34%] rounded-xl bg-[#1e222b]" />
        <div className="absolute top-[30%] left-[58%] h-[20%] w-[22%] rounded-lg bg-[#282d38]" />

        <div className="absolute inset-x-0 bottom-0 z-10 px-3.5 pt-7 pb-1.5" style={{ background: "linear-gradient(transparent, rgba(5, 6, 9, .85))" }}>
          <ChapterSeekbar
            duration={DURATION}
            current={current}
            buffered={Math.min(DURATION, current + 120)}
            chapters={chapters}
            markers={markers}
            onSeek={setCurrent}
            renderThumb={(t) => <Thumb t={t} />}
            labels={{ seek: "Video position" }}
          />
          <div className="flex h-11 min-w-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause" : "Play"}
              className="grid size-10 shrink-0 place-items-center rounded-lg text-[#e9ecf1] hover:bg-white/10"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
                {playing ? <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /> : <path d="M8 5.5v13l10.5-6.5z" />}
              </svg>
            </button>
            <span className="min-w-0 truncate text-[13px] text-[#e9ecf1] tabular-nums">
              {formatTime(current)} / {formatTime(DURATION)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
