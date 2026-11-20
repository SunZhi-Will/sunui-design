"use client";

import { AnimatePresence, motion, useReducedMotion, useSpring } from "framer-motion";
import { useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  gentle: { type: "spring", stiffness: 240, damping: 30 },
} as const;

export interface SeekChapter {
  /** 起始秒數 */
  t: number;
  title: string;
}

export interface SeekMarker {
  t: number;
  /** 滑到記號附近時顯示在浮層裡 */
  label?: string;
}

export interface ChapterSeekbarLabels {
  seek?: string;
  valueText?: (time: string, total: string, chapter?: string) => string;
}

export interface ChapterSeekbarProps {
  /** 總長（秒） */
  duration: number;
  current: number;
  /** 已緩衝到的秒數；不給就不畫 */
  buffered?: number;
  /** 兩章以上才會把進度條切段 */
  chapters?: SeekChapter[];
  /** 書籤、片段這類記號，單色顯示；點在記號附近會吸附到它 */
  markers?: SeekMarker[];
  onSeek?: (t: number) => void;
  onMarkerClick?: (marker: SeekMarker) => void;
  /** 浮層裡的縮圖（16:9，寬 160） */
  renderThumb?: (t: number) => ReactNode;
  formatTime?: (t: number) => string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: ChapterSeekbarLabels;
  className?: string;
}

/** 沒有小時時分鐘不補零：4:05、1:02:09 */
export function formatTime(sec: number) {
  if (!Number.isFinite(sec)) return "--:--";
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = String(Math.floor((s % 3600) / 60)).padStart(h ? 2 : 1, "0");
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${m}:${ss}` : `${m}:${ss}`;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";
const resolveLocale = (tag = "en"): SunLocale => {
  const t = tag.toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  return t.startsWith("ja") ? "ja" : "en";
};
const zh = (time: string, total: string, chapter?: string) => `${chapter ? `${chapter}，` : ""}${time}，共 ${total}`;
const MESSAGES: Record<SunLocale, Required<ChapterSeekbarLabels>> = {
  en: { seek: "Seek", valueText: (time, total, chapter) => `${chapter ? `${chapter}, ` : ""}${time} of ${total}` },
  "zh-TW": { seek: "播放進度", valueText: zh },
  "zh-CN": { seek: "播放进度", valueText: zh },
  ja: { seek: "再生位置", valueText: (time, total, chapter) => `${chapter ? `${chapter}、` : ""}${time} / ${total}` },
};

const GAP = 3; // 章節之間的縫（px）
const SNAP = 8; // 點在記號幾 px 內會吸附
const spot = "bg-[color:var(--sunui-spot,var(--primary))]";
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function ChapterSeekbar({
  duration,
  current,
  buffered,
  chapters = [],
  markers = [],
  onSeek,
  onMarkerClick,
  renderThumb,
  formatTime: fmt = formatTime,
  locale,
  labels,
  className,
}: ChapterSeekbarProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const reduce = useReducedMotion();
  const barRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ v: number; x: number; w: number } | null>(null);
  const [inside, setInside] = useState(false);
  const [drag, setDrag] = useState(false);
  const chipX = useSpring(0, { stiffness: 520, damping: 34 });

  const d = duration > 0 ? duration : 0;
  const sorted = [...chapters].filter((c) => c.t < d || !d).sort((a, b) => a.t - b.t);
  // 一章或沒有章節時整條就是一段
  const segs = sorted.length > 1 && d ? sorted : [{ t: 0, title: sorted[0]?.title ?? "" }];
  const marks = d ? markers.filter((m) => m.t >= 0 && m.t <= d) : [];
  const chapterAt = (v: number) => segs.reduce((i, c, k) => (c.t <= v + 0.01 ? k : i), 0);

  const read = (e: PointerEvent) => {
    const r = barRef.current!.getBoundingClientRect();
    const x = Math.min(r.width, Math.max(0, e.clientX - r.left));
    return { v: (x / r.width) * d, x, w: r.width };
  };
  const nearMark = (x: number, w: number) => marks.find((m) => Math.abs((m.t / d) * w - x) <= SNAP);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!d || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag(true);
    const p = read(e);
    const m = nearMark(p.x, p.w);
    if (m) onMarkerClick?.(m);
    onSeek?.(m ? m.t : p.v);
    setHover(p);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!d || (!drag && e.pointerType !== "mouse")) return;
    const p = read(e);
    if (drag) onSeek?.(p.v);
    setHover(p);
  };
  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    setDrag(false);
    // 觸控沒有懸停：放開手指就收起浮層
    if (e.pointerType !== "mouse" || !inside) setHover(null);
  };

  // 浮層中心夾在進度條內，375px 也不會超出
  const shown = useRef(false);
  useLayoutEffect(() => {
    if (!hover) return void (shown.current = false);
    const cw = chipRef.current?.offsetWidth ?? 0;
    const x = cw >= hover.w ? (hover.w - cw) / 2 : Math.min(Math.max(hover.x - cw / 2, 0), hover.w - cw);
    // 剛出現時直接就位，之後用彈簧跟手
    if (reduce || !shown.current) chipX.jump(x);
    else chipX.set(x);
    shown.current = true;
  }, [hover, reduce, chipX]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!d) return;
    const step = e.shiftKey ? 30 : 5;
    const i = chapterAt(current);
    const keys: Record<string, number> = {
      ArrowLeft: current - step,
      ArrowDown: current - step,
      ArrowRight: current + step,
      ArrowUp: current + step,
      Home: 0,
      End: d,
      // 上一章：在章首 3 秒內就跳到前一章
      PageDown: current - segs[i].t > 3 ? segs[i].t : segs[Math.max(0, i - 1)].t,
      PageUp: segs[i + 1]?.t ?? d,
    };
    if (!(e.key in keys)) return;
    e.preventDefault();
    onSeek?.(Math.min(d, Math.max(0, keys[e.key])));
  };

  const active = inside || drag;
  const hotIdx = hover ? chapterAt(hover.v) : -1;
  const curIdx = chapterAt(current);
  const hoverMark = hover ? nearMark(hover.x, hover.w) : undefined;
  const played = d ? clamp01(current / d) : 0;
  const fade = reduce ? { duration: 0 } : { duration: 0.15, ease: [0.32, 0.72, 0, 1] as const };

  return (
    <div
      ref={barRef}
      role="slider"
      tabIndex={0}
      aria-label={t.seek}
      aria-valuemin={0}
      aria-valuemax={Math.round(d)}
      aria-valuenow={Math.round(Math.min(current, d))}
      aria-valuetext={t.valueText(fmt(current), fmt(d), segs[curIdx].title || undefined)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerEnter={(e) => e.pointerType === "mouse" && setInside(true)}
      onPointerLeave={() => {
        setInside(false);
        if (!drag) setHover(null);
      }}
      onKeyDown={onKeyDown}
      className={cn(
        "group relative h-6 w-full min-w-0 cursor-pointer touch-pan-y select-none rounded-md outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2">
        {segs.map((c, i) => {
          const end = segs[i + 1]?.t ?? d;
          const span = Math.max(end - c.t, 0.001);
          const gap = i + 1 < segs.length ? GAP : 0;
          const fill = (v: number) => `${clamp01((v - c.t) / span) * 100}%`;
          return (
            <motion.div
              key={`${c.t}-${i}`}
              initial={false}
              animate={{ scaleY: i === hotIdx ? 1 : active ? 0.75 : 0.5 }}
              transition={reduce ? { duration: 0 } : i === hotIdx ? springs.snappy : springs.gentle}
              style={{ left: d ? `${(c.t / d) * 100}%` : 0, width: d ? `calc(${(span / d) * 100}% - ${gap}px)` : "100%" }}
              className="absolute inset-y-0 overflow-hidden rounded-full bg-muted shadow-[inset_0_1px_2px_rgb(0_0_0/0.08)] dark:bg-foreground/10"
            >
              {buffered != null && <i className="absolute inset-y-0 left-0 bg-foreground/10" style={{ width: fill(buffered) }} />}
              {hover && <i className="absolute inset-y-0 left-0 bg-foreground/10" style={{ width: fill(hover.v) }} />}
              <i className={cn("absolute inset-y-0 left-0", spot)} style={{ width: fill(current) }} />
            </motion.div>
          );
        })}
        {marks.map((m, i) => (
          <i
            key={`${m.t}-${i}`}
            aria-hidden="true"
            className="pointer-events-none absolute -inset-y-0.5 w-0.5 -translate-x-1/2 rounded-full bg-foreground/70"
            style={{ left: `${(m.t / d) * 100}%` }}
          />
        ))}
      </div>

      <motion.div
        aria-hidden="true"
        initial={false}
        animate={{ scale: drag ? 1.2 : active ? 1 : 0.8 }}
        transition={reduce ? { duration: 0 } : springs.snappy}
        style={{ left: `${played * 100}%` }}
        className={cn(
          "pointer-events-none absolute top-1/2 -ml-[7px] -mt-[7px] size-3.5 rounded-full",
          "shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_0_0_1px_rgb(0_0_0/0.08),0_1px_2px_rgb(0_0_0/0.16)]",
          spot,
        )}
      />

      <AnimatePresence>
        {hover && (
          <motion.div
            ref={chipRef}
            aria-hidden="true"
            initial={{ opacity: 0, scale: reduce ? 1 : 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: reduce ? 1 : 0.96, transition: reduce ? { duration: 0 } : { duration: 0.1 } }}
            transition={fade}
            style={{ x: chipX, transformOrigin: "50% 100%" }}
            className={cn(
              "pointer-events-none absolute bottom-[calc(100%+6px)] left-0 z-10 flex flex-col rounded-xl bg-card text-card-foreground",
              "shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_16px_32px_-8px_rgb(0_0_0/0.10),0_32px_64px_-16px_rgb(0_0_0/0.10)]",
              "dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_0_0_1px_rgb(255_255_255/0.1)]",
              renderThumb ? "w-[168px] p-1" : "max-w-[220px] px-2.5 py-1.5",
            )}
          >
            {renderThumb && (
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">{renderThumb(hover.v)}</div>
            )}
            <div className={cn("flex min-w-0 items-baseline gap-2 text-xs", renderThumb && "px-1.5 pb-1 pt-1.5")}>
              <span className="min-w-0 flex-1 truncate font-medium">{hoverMark?.label || segs[hotIdx]?.title}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">{fmt(hoverMark ? hoverMark.t : hover.v)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
