"use client";

import { useEffect, useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ChapterSeekbar, formatTime, type SeekChapter } from "./chapter-seekbar";

const DURATION = 18 * 60 + 24;

const starts = [0, 74, 262, 548, 806, 1012];

const copy = {
  en: {
    video: "Mirrorless camera review",
    seek: "Video position",
    play: "Play",
    pause: "Pause",
    chapters: ["Opening", "Unboxing the camera", "Sensor and lens", "Low light test", "Battery life", "Verdict"],
  },
  "zh-TW": {
    video: "無反光鏡相機評測",
    seek: "影片位置",
    play: "播放",
    pause: "暫停",
    chapters: ["開場", "相機開箱", "感光元件與鏡頭", "弱光測試", "電池續航", "總結"],
  },
  "zh-CN": {
    video: "无反相机评测",
    seek: "视频位置",
    play: "播放",
    pause: "暂停",
    chapters: ["开场", "相机开箱", "传感器与镜头", "弱光测试", "电池续航", "总结"],
  },
  ja: {
    video: "ミラーレスカメラレビュー",
    seek: "動画の再生位置",
    play: "再生",
    pause: "一時停止",
    chapters: ["オープニング", "カメラを開封", "センサーとレンズ", "暗所テスト", "バッテリー持ち", "総評"],
  },
};

export default function ChapterSeekbarDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const chapters: SeekChapter[] = starts.map((s, i) => ({ t: s, title: t.chapters[i] }));
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
        <p className="absolute top-3 left-4 text-sm font-semibold">{t.video}</p>
      </div>
      <div className="px-3.5 pt-3 pb-1.5">
        <ChapterSeekbar duration={DURATION} current={current} buffered={Math.min(DURATION, current + 120)} chapters={chapters} onSeek={setCurrent} locale={locale} labels={{ seek: t.seek }} />
        <div className="flex h-11 min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? t.pause : t.play}
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
