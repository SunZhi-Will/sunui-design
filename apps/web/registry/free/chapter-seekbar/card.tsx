"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ChapterSeekbar, formatTime } from "./chapter-seekbar";
import { DURATION, FRAME, demoCopy, frameThumb, lessonChapters, lessonMarks } from "./demo";

/** 型錄卡片：課程畫面加章節進度條，停在第三章中段。 */
export default function ChapterSeekbarCard() {
  const t = useDemoText(demoCopy);
  const locale = useDemoLocale();
  const chapters = lessonChapters(t);
  const [current, setCurrent] = useState(301);
  const title = chapters.reduce((s, c) => (c.t <= current ? c.title : s), "");

  return (
    <div className="w-[22rem] overflow-hidden rounded-xl bg-card shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(255_255_255/0.08)]">
      <div className="aspect-video bg-muted">
        <img src={FRAME} alt="" draggable={false} className="size-full object-cover" />
      </div>
      <div className="px-3 pt-2 pb-3">
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
        <p className="mt-1 flex min-w-0 gap-3 text-xs">
          <span className="shrink-0 tabular-nums text-muted-foreground">
            {formatTime(current)} / {formatTime(DURATION)}
          </span>
          <span className="min-w-0 truncate font-medium">{title}</span>
        </p>
      </div>
    </div>
  );
}
