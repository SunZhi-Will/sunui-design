"use client";

import { useEffect, useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { KaraokeCaption, type SubtitleItem } from "./karaoke-caption";

const lines = {
  en: ["Welcome back to Night Shelf,", "today: covers for novels that have no illustrations.", "Same book, same cover."],
  "zh-TW": ["歡迎回到 Night Shelf，", "今天聊聊怎麼替沒有插畫的小說做封面。", "Same book, same cover."],
  "zh-CN": ["欢迎回到 Night Shelf，", "今天聊聊怎么给没有插画的小说做封面。", "Same book, same cover."],
  ja: ["Night Shelf へおかえりなさい。", "今日は挿絵のない小説の表紙づくりの話です。", "Same book, same cover."],
};
const TIMES = [
  [0, 2.4],
  [2.5, 6.2],
  [6.3, 8.5],
];
const controls = {
  en: { region: "Episode captions", play: "Play", pause: "Pause", seek: "Seek" },
  "zh-TW": { region: "本集字幕", play: "播放", pause: "暫停", seek: "播放進度" },
  "zh-CN": { region: "本集字幕", play: "播放", pause: "暂停", seek: "播放进度" },
  ja: { region: "このエピソードの字幕", play: "再生", pause: "一時停止", seek: "再生位置" },
};
const TOTAL = 8.5;
const STEP = 0.05;

export default function KaraokeCaptionDemo() {
  const locale = useDemoLocale();
  const c = useDemoText(controls);
  const texts = useDemoText(lines);
  const subtitles: SubtitleItem[] = texts.map((text, i) => ({ text, start: TIMES[i][0], end: TIMES[i][1] }));
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
        <KaraokeCaption subtitles={subtitles} time={time} locale={locale} labels={{ region: c.region }} />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? c.pause : c.play}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
        >
          <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
            {playing ? <path d="M5 3.5v9M11 3.5v9" strokeLinecap="round" /> : <path d="M5 3.5v9l7.5-4.5Z" />}
          </svg>
        </button>
        <input type="range" min={0} max={TOTAL} step={STEP} value={time} onChange={(e) => setTime(Number(e.target.value))} aria-label={c.seek} className="h-1 min-w-0 flex-1 accent-slate-900" />
        <span className="w-10 shrink-0 text-right font-mono text-xs text-slate-500 tabular-nums">0:{Math.floor(time).toString().padStart(2, "0")}</span>
      </div>
    </div>
  );
}
