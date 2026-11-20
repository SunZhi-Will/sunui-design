"use client";

import { useEffect, useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";
import { cn } from "@/lib/utils";

import { ChapterSeekbar, formatTime, type SeekChapter, type SeekMarker } from "./chapter-seekbar";

export const DURATION = 14 * 60 + 36;
const STARTS = [0, 48, 190, 372, 560, 812];
const MARKS = [236, 640];
export const FRAME = "/demo/raster/peaks.webp";

export const demoCopy = {
  en: {
    course: "Landscape photography",
    lesson: "Lesson 4 of 9",
    title: "Reading mountain light",
    seek: "Lesson position",
    play: "Play",
    pause: "Pause",
    contents: "In this lesson",
    chapters: ["Introduction", "Scouting the ridge", "Metering for the highlights", "Waiting for side light", "Converting to black and white", "Recap and exercise"],
    marks: ["Your note: histogram", "Exercise brief"],
  },
  "zh-TW": {
    course: "風景攝影",
    lesson: "第 4 課，共 9 課",
    title: "讀懂山裡的光",
    seek: "課程進度",
    play: "播放",
    pause: "暫停",
    contents: "本課內容",
    chapters: ["課程介紹", "勘查稜線", "以亮部測光", "等待側光", "轉成黑白", "重點回顧與練習"],
    marks: ["你的筆記：直方圖", "練習說明"],
  },
  "zh-CN": {
    course: "风光摄影",
    lesson: "第 4 课，共 9 课",
    title: "读懂山里的光",
    seek: "课程进度",
    play: "播放",
    pause: "暂停",
    contents: "本课内容",
    chapters: ["课程介绍", "勘察山脊", "以亮部测光", "等待侧光", "转成黑白", "要点回顾与练习"],
    marks: ["你的笔记：直方图", "练习说明"],
  },
  ja: {
    course: "風景写真",
    lesson: "レッスン 4 / 9",
    title: "山の光を読む",
    seek: "レッスンの再生位置",
    play: "再生",
    pause: "一時停止",
    contents: "このレッスンの内容",
    chapters: ["イントロダクション", "尾根を下見する", "ハイライトで測光する", "サイド光を待つ", "モノクロに変換する", "まとめと課題"],
    marks: ["メモ：ヒストグラム", "課題の説明"],
  },
};

type Copy = (typeof demoCopy)["en"];

export const lessonChapters = (t: Copy): SeekChapter[] => STARTS.map((s, i) => ({ t: s, title: t.chapters[i] }));
export const lessonMarks = (t: Copy): SeekMarker[] => MARKS.map((s, i) => ({ t: s, label: t.marks[i] }));

/** 縮圖：同一張靜止畫面，依時間上下移動取景，示意不同片段 */
export const frameThumb = (v: number) => (
  <img src={FRAME} alt="" draggable={false} className="size-full object-cover" style={{ objectPosition: `50% ${(v / DURATION) * 100}%` }} />
);

/** 播放時用 rAF 依實際經過時間前進；分頁隱藏時 rAF 自然停住 */
function usePlayback(start: number) {
  const [current, setCurrent] = useState(start);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let id = requestAnimationFrame(function tick(now) {
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      setCurrent((c) => Math.min(DURATION, c + dt));
      id = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(id);
  }, [playing]);
  // 播到片尾就停
  useEffect(() => {
    if (current >= DURATION) setPlaying(false);
  }, [current]);
  return { current, setCurrent, playing, setPlaying };
}

const e1 =
  "shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(255_255_255/0.08)]";

/** 課程播放頁：畫面、進度條與控制列，旁邊的章節列表跟進度條同步。 */
export default function ChapterSeekbarDemo() {
  const t = useDemoText(demoCopy);
  const locale = useDemoLocale();
  const chapters = lessonChapters(t);
  const { current, setCurrent, playing, setPlaying } = usePlayback(301);
  const curIdx = chapters.reduce((i, c, k) => (c.t <= current ? k : i), 0);

  return (
    <div className="grid w-full max-w-4xl min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <section className={cn("min-w-0 overflow-hidden rounded-xl bg-card", e1)}>
        <div className="relative aspect-video bg-muted">
          <img src={FRAME} alt="" draggable={false} className="absolute inset-0 size-full object-cover" />
        </div>
        <div className="px-3 pt-2 pb-3 sm:px-4">
          <ChapterSeekbar
            duration={DURATION}
            current={current}
            buffered={Math.min(DURATION, current + 95)}
            chapters={chapters}
            markers={lessonMarks(t)}
            onSeek={setCurrent}
            renderThumb={frameThumb}
            locale={locale}
            labels={{ seek: t.seek }}
          />
          <div className="mt-1 flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? t.pause : t.play}
              className="grid size-9 shrink-0 place-items-center rounded-md text-foreground outline-none transition-[background-color,scale] duration-150 hover:bg-muted hover:duration-0 focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-[0.97]"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
                {playing ? <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /> : <path d="M8 5.5v13l10.5-6.5z" />}
              </svg>
            </button>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              <span className="text-foreground">{formatTime(current)}</span> / {formatTime(DURATION)}
            </span>
            <span className="min-w-0 truncate text-xs font-medium">{chapters[curIdx].title}</span>
          </div>
          <div className="mt-3 border-t border-foreground/10 pt-3">
            <p className="text-xs text-muted-foreground">
              {t.course} · {t.lesson}
            </p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight">{t.title}</h1>
          </div>
        </div>
      </section>

      <nav aria-label={t.contents} className={cn("min-w-0 self-start rounded-xl bg-card p-1", e1)}>
        <p className="px-3 pt-2.5 pb-1.5 text-xs font-medium text-muted-foreground">{t.contents}</p>
        <ol>
          {chapters.map((c, i) => {
            const on = i === curIdx;
            return (
              <li key={c.t}>
                <button
                  type="button"
                  aria-current={on ? "step" : undefined}
                  onClick={() => setCurrent(c.t)}
                  className={cn(
                    "flex w-full min-w-0 items-baseline gap-3 rounded-lg px-3 py-2 text-left text-sm outline-none transition-[background-color,scale] duration-150",
                    "hover:bg-muted hover:duration-0 focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-[0.99]",
                    on ? "bg-muted font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  <span className="w-4 shrink-0 text-xs tabular-nums">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{c.title}</span>
                  <span className="shrink-0 text-xs tabular-nums">{formatTime(c.t)}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
