"use client";

import { useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import { cn } from "@/lib/utils";

export interface SeekChapter {
  /** 起始秒數 */
  start: number;
  title: string;
}

export interface SeekMarker {
  t: number;
  label: string;
}

export interface ChapterSeekbarProps {
  /** 總長（秒） */
  duration: number;
  current: number;
  /** 已緩衝到的秒數 */
  buffered?: number;
  chapters?: SeekChapter[];
  markers?: SeekMarker[];
  onSeek?: (t: number) => void;
  onScrubStart?: () => void;
  onScrubEnd?: (t: number) => void;
  formatTime?: (t: number) => string;
  labels?: {
    seek?: string;
    valueText?: (time: string, total: string, chapter?: { index: number; title: string }) => string;
  };
  className?: string;
}

function defaultFormat(t: number) {
  const s = Math.max(0, Math.floor(t));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

const defaultLabels = {
  seek: "Seek",
  valueText: (time: string, total: string, chapter?: { index: number; title: string }) =>
    `${time} of ${total}${chapter ? `, Chapter ${chapter.index + 1}: ${chapter.title}` : ""}`,
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function ChapterSeekbar({
  duration,
  current,
  buffered = 0,
  chapters = [],
  markers = [],
  onSeek,
  onScrubStart,
  onScrubEnd,
  formatTime = defaultFormat,
  labels,
  className,
}: ChapterSeekbarProps) {
  const t = { ...defaultLabels, ...labels };
  const trackRef = useRef<HTMLDivElement>(null);
  const fills = useRef<(HTMLSpanElement | null)[]>([]);
  const knobRef = useRef<HTMLSpanElement>(null);
  const dragging = useRef(false);
  const scrubT = useRef(current);
  const [hoverT, setHoverT] = useState<number | null>(null);
  const [active, setActive] = useState(false);

  const total = Math.max(duration, 0.001);
  const segs = (chapters.length ? [...chapters].sort((a, b) => a.start - b.start) : [{ start: 0, title: "" }]).map(
    (c, i, arr) => ({ ...c, end: arr[i + 1]?.start ?? total }),
  );
  const chapterAt = (time: number) => {
    const i = segs.findIndex((s) => time >= s.start && time < s.end);
    return i === -1 ? segs.length - 1 : i;
  };

  // 播放位置直接寫 style，拖曳時不必等父層重新渲染
  const paint = (time: number) => {
    segs.forEach((s, i) => {
      const el = fills.current[i];
      if (el) el.style.transform = `scaleX(${clamp((time - s.start) / (s.end - s.start), 0, 1)})`;
    });
    if (knobRef.current) knobRef.current.style.left = `${(clamp(time, 0, total) / total) * 100}%`;
  };

  // 拖曳中以拖曳位置為準，避免父層還沒更新時跳回舊位置
  const shown = dragging.current ? scrubT.current : current;
  useLayoutEffect(() => paint(shown));

  const timeAtX = (clientX: number) => {
    const r = trackRef.current!.getBoundingClientRect();
    let time = clamp((clientX - r.left) / r.width, 0, 1) * total;
    // 靠近標記時吸附過去
    const near = markers.find((m) => Math.abs(m.t - time) < total * 0.01);
    if (near) time = near.t;
    return time;
  };

  const seek = (time: number) => {
    const v = clamp(time, 0, total);
    scrubT.current = v;
    paint(v);
    onSeek?.(v);
    return v;
  };

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragging.current = true;
    setActive(true);
    onScrubStart?.();
    seek(timeAtX(e.clientX));
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const time = timeAtX(e.clientX);
    setHoverT(time);
    if (dragging.current) seek(time);
  }

  function endScrub(e: PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    dragging.current = false;
    setActive(false);
    onScrubEnd?.(timeAtX(e.clientX));
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const idx = chapterAt(current);
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = current + 5;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = current - 5;
    else if (e.key === "PageUp") next = segs[idx + 1]?.start ?? total;
    // 在章節開頭 2 秒內再按，跳到上一章
    else if (e.key === "PageDown") next = current - segs[idx].start < 2 ? (segs[idx - 1]?.start ?? 0) : segs[idx].start;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = total;
    if (next === null) return;
    e.preventDefault();
    seek(next);
  }

  const hoverIdx = hoverT === null ? -1 : chapterAt(hoverT);
  const hoverMarker = hoverT === null ? undefined : markers.find((m) => Math.abs(m.t - hoverT) < total * 0.01);
  const currentIdx = chapterAt(current);
  const engaged = active || hoverT !== null;

  return (
    <div className={cn("relative w-full select-none", className)}>
      {hoverT !== null && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-full mb-2 -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground shadow-sm"
          style={{ left: `${clamp((hoverT / total) * 100, 8, 92)}%` }}
        >
          {hoverMarker ? <span className="font-medium">{hoverMarker.label}</span> : chapters.length > 0 && <span className="font-medium">{segs[hoverIdx].title}</span>}
          <span className="ml-1.5 font-mono text-muted-foreground tabular-nums">{formatTime(hoverMarker?.t ?? hoverT)}</span>
        </div>
      )}

      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={t.seek}
        aria-valuemin={0}
        aria-valuemax={Math.round(total)}
        aria-valuenow={Math.round(current)}
        aria-valuetext={t.valueText(
          formatTime(current),
          formatTime(total),
          chapters.length ? { index: currentIdx, title: segs[currentIdx].title } : undefined,
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endScrub}
        onPointerCancel={endScrub}
        onPointerLeave={() => setHoverT(null)}
        onKeyDown={onKeyDown}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
        className="group relative h-4 cursor-pointer touch-none rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {segs.map((s, i) => {
          const left = (s.start / total) * 100;
          const width = ((s.end - s.start) / total) * 100;
          const scale = i === hoverIdx ? 1.7 : engaged ? 1 : 0.6;
          return (
            <span
              key={i}
              className="absolute top-1/2 h-1 -mt-0.5 overflow-hidden rounded-full bg-muted-foreground/25 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
              style={{
                left: `${left}%`,
                width: i === segs.length - 1 ? `${width}%` : `calc(${width}% - 2px)`,
                transform: `scaleY(${scale})`,
              }}
            >
              <span
                className="absolute inset-0 origin-left bg-muted-foreground/30"
                style={{ transform: `scaleX(${clamp((buffered - s.start) / (s.end - s.start), 0, 1)})` }}
              />
              <span
                ref={(el) => {
                  fills.current[i] = el;
                }}
                className="absolute inset-0 origin-left bg-primary"
                style={{ transform: `scaleX(${clamp((shown - s.start) / (s.end - s.start), 0, 1)})` }}
              />
            </span>
          );
        })}

        {markers.map((m) => (
          <span
            key={`${m.t}-${m.label}`}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 h-2.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/70"
            style={{ left: `${(m.t / total) * 100}%` }}
          />
        ))}

        <span
          ref={knobRef}
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary transition-[scale] duration-150 motion-reduce:transition-none",
            engaged ? "scale-100" : "scale-0",
          )}
          style={{ left: `${(clamp(shown, 0, total) / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
