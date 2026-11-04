"use client";

import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SeekChapter {
  /** 起始秒數 */
  t: number;
  title: string;
}

export type SeekMarkerKind = "default" | "user" | "clip";

export interface SeekMarker {
  t: number;
  label?: string;
  /** default 白線、user 主色、clip 粉紅 */
  kind?: SeekMarkerKind;
}

export interface ChapterSeekbarLabels {
  seek?: string;
  valueText?: (time: string, total: string, chapter?: string) => string;
}

export interface ChapterSeekbarProps {
  /** 總長（秒） */
  duration: number;
  current: number;
  /** 已緩衝到的秒數 */
  buffered?: number;
  /** 兩章以上才會把進度條切段 */
  chapters?: SeekChapter[];
  markers?: SeekMarker[];
  /** 分集切口的秒數（多集合併播放時） */
  cuts?: number[];
  onSeek?: (t: number) => void;
  onMarkerClick?: (marker: SeekMarker) => void;
  /** 滑過時在時間上方顯示的縮圖（192 x 108） */
  renderThumb?: (t: number) => ReactNode;
  formatTime?: (t: number) => string;
  /** 主色，預設萬寶箱金 */
  accent?: string;
  labels?: ChapterSeekbarLabels;
  className?: string;
}

// 跟原播放器的 formatTime 一樣：沒有小時時分鐘不補零
export function formatTime(sec: number) {
  if (!Number.isFinite(sec)) return "--:--";
  const neg = sec < 0;
  sec = Math.abs(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const mm = String(m).padStart(h ? 2 : 1, "0");
  const out = h ? `${h}:${mm}:${String(s).padStart(2, "0")}` : `${mm}:${String(s).padStart(2, "0")}`;
  return neg ? `-${out}` : out;
}

const defaultLabels: Required<ChapterSeekbarLabels> = {
  seek: "Seek",
  valueText: (time, total, chapter) => `${time} of ${total}${chapter ? `, ${chapter}` : ""}`,
};

const markColor: Record<SeekMarkerKind, string> = {
  default: "rgba(255, 255, 255, .9)",
  user: "var(--accent)",
  clip: "#ff6b9a",
};

const pct = (n: number) => `${Math.min(1, Math.max(0, n)) * 100}%`;

export function ChapterSeekbar({
  duration,
  current,
  buffered = 0,
  chapters = [],
  markers = [],
  cuts = [],
  onSeek,
  onMarkerClick,
  renderThumb,
  formatTime: fmt = formatTime,
  accent = "#f5b324",
  labels,
  className,
}: ChapterSeekbarProps) {
  const t = { ...defaultLabels, ...labels };
  const seekRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [hover, setHover] = useState<{ v: number; x: number } | null>(null);
  const [drag, setDrag] = useState(false);

  const d = duration > 0 ? duration : 0;
  const sorted = [...chapters].sort((a, b) => a.t - b.t);
  // 片長還沒讀到時先不切
  const list = sorted.length > 1 && d > 0 ? sorted.filter((c) => c.t < d) : [];
  const chaptered = list.length > 1;

  // 第 v 秒落在第幾章；沒有章節回傳 -1
  const chapterAt = (v: number) => {
    let i = -1;
    for (let k = 0; k < sorted.length && sorted[k].t <= v + 0.01; k++) i = k;
    return i;
  };

  const fracAt = (clientX: number) => {
    const r = seekRef.current!.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!d || e.button !== 0) return;
    dragging.current = true;
    setDrag(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    onSeek?.(fracAt(e.clientX) * d);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!d) return;
    const v = fracAt(e.clientX) * d;
    if (dragging.current) onSeek?.(v);
    const r = seekRef.current!.getBoundingClientRect();
    // 時間小方塊左右各留 100px，不會被切到
    setHover({ v, x: Math.min(Math.max(100, e.clientX - r.left), r.width - 100) });
  };
  const endDrag = () => {
    dragging.current = false;
    setDrag(false);
  };

  // 鍵盤：←/→ 5 秒，Shift 加大為 30 秒，跟原播放器的快捷鍵相同
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!d) return;
    const step = e.shiftKey ? 30 : 5;
    let next: number | null = null;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = current - step;
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") next = current + step;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = d;
    if (next === null) return;
    e.preventDefault();
    onSeek?.(Math.min(d, Math.max(0, next)));
  };

  const hv = hover?.v ?? 0;
  const hotIdx = hover ? chapterAt(hv) : -1;
  const curIdx = chapterAt(current);
  const played = d ? current / d : 0;

  return (
    <div
      ref={seekRef}
      role="slider"
      tabIndex={0}
      aria-label={t.seek}
      aria-valuemin={0}
      aria-valuemax={Math.round(d)}
      aria-valuenow={Math.round(current)}
      aria-valuetext={t.valueText(fmt(current), fmt(d), curIdx >= 0 ? sorted[curIdx]?.title : undefined)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={() => setHover(null)}
      onKeyDown={onKeyDown}
      data-drag={drag || undefined}
      style={{ "--accent": accent } as CSSProperties}
      className={cn("va-seek touch-none outline-none select-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60 focus-visible:rounded", className)}
    >
      <div className={cn("va-rail", chaptered && "chaptered")}>
        {chaptered && (
          <div className="va-segs">
            {list.map((c, i) => {
              const end = i + 1 < list.length ? list[i + 1].t : d;
              // 段與段之間留 3px 的縫
              const gap = i + 1 < list.length ? 3 : 0;
              const span = end - c.t;
              const fill = (v: number) => pct((v - c.t) / span);
              return (
                <div
                  key={`${c.t}-${i}`}
                  className={cn("va-sg", i === hotIdx && "hot")}
                  style={{ left: `${(c.t / d) * 100}%`, width: `calc(${(span / d) * 100}% - ${gap}px)` }}
                >
                  <i className="b" style={{ width: fill(buffered) }} />
                  <i className="h" style={{ width: fill(hover ? hv : 0) }} />
                  <i className="p" style={{ width: fill(current) }} />
                </div>
              );
            })}
          </div>
        )}
        {!chaptered && (
          <>
            <div className="va-buffered" style={{ width: pct(d ? buffered / d : 0) }} />
            <div className="va-played" style={{ width: pct(played) }} />
          </>
        )}
        {d > 0 && cuts.length > 0 && (
          <div aria-hidden="true">
            {cuts.map((c) => (
              <i key={c} className="va-cut" style={{ left: `${(c / d) * 100}%` }} />
            ))}
          </div>
        )}
      </div>

      {d > 0 && markers.length > 0 && (
        <div className="va-marks">
          {markers
            .filter((m) => Number.isFinite(m.t) && m.t >= 0 && m.t <= d)
            .map((m, i) => (
              <i
                key={`${m.t}-${i}`}
                data-tip={`${m.label ? `${m.label} ` : ""}${fmt(m.t)}`}
                style={{ left: `${(m.t / d) * 100}%`, "--mk": markColor[m.kind ?? "default"] } as CSSProperties}
                // 不要同時觸發進度條的跳轉
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onSeek?.(m.t);
                  onMarkerClick?.(m);
                }}
              />
            ))}
        </div>
      )}

      <div className="va-knob" style={{ left: pct(played) }} />

      {hover && (
        <div className="va-hover" style={{ left: hover.x }} aria-hidden="true">
          {renderThumb && <div className="va-thumb">{renderThumb(hv)}</div>}
          {hotIdx >= 0 && <span className="va-hover-chapter">{sorted[hotIdx].title}</span>}
          <span className="va-hover-time">{fmt(hv)}</span>
        </div>
      )}

      <style>{`
        .va-seek { position: relative; height: 18px; cursor: pointer; display: flex; align-items: center; }
        .va-rail { position: relative; width: 100%; height: 4px; border-radius: 4px; background: rgba(255,255,255,.18); transition: height .12s; }
        .va-seek:hover .va-rail, .va-seek[data-drag] .va-rail { height: 6px; }
        .va-buffered, .va-played { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 4px; }
        .va-buffered { background: rgba(255,255,255,.28); }
        .va-played { background: var(--accent); }
        .va-cut { position: absolute; top: -2px; bottom: -2px; width: 4px; margin-left: -2px; background: rgba(5, 6, 9, .95); z-index: 2; }
        .va-rail.chaptered { height: 6px; background: none; }
        .va-segs { position: absolute; inset: 0; }
        .va-sg { position: absolute; top: 0; bottom: 0; overflow: hidden; border-radius: 1px; background: rgba(255,255,255,.2); transform: scaleY(.6); transition: transform .15s cubic-bezier(.4, 0, .2, 1); }
        .va-sg:first-child { border-radius: 4px 1px 1px 4px; }
        .va-sg:last-child { border-radius: 1px 4px 4px 1px; }
        .va-seek:hover .va-sg, .va-seek[data-drag] .va-sg { transform: scaleY(1); }
        .va-seek:hover .va-sg.hot, .va-seek[data-drag] .va-sg.hot { transform: scaleY(1.7); }
        .va-sg i { position: absolute; left: 0; top: 0; bottom: 0; }
        .va-sg .b { background: rgba(255,255,255,.3); }
        .va-sg .h { background: rgba(255,255,255,.35); }
        .va-sg .p { background: var(--accent); }
        .va-marks { position: absolute; inset: 0; z-index: 3; pointer-events: none; }
        .va-marks i { --mk: rgba(255, 255, 255, .9); position: absolute; top: 1px; bottom: 1px; width: 9px; margin-left: -4px; cursor: pointer; pointer-events: auto; }
        .va-marks i::before { content: ''; position: absolute; left: 4px; top: 0; bottom: 0; width: 2px; border-radius: 1px; background: var(--mk); }
        .va-marks i:hover::before { left: 3px; width: 4px; }
        .va-marks i:hover::after { content: attr(data-tip); position: absolute; left: 50%; bottom: calc(100% + 6px); transform: translateX(-50%); padding: 4px 8px; border-radius: 6px; background: rgba(8, 10, 14, .92); color: #fff; font-size: 12px; white-space: nowrap; max-width: 260px; overflow: hidden; text-overflow: ellipsis; pointer-events: none; }
        .va-knob { position: absolute; top: 50%; width: 14px; height: 14px; margin: -7px 0 0 -7px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 3px var(--accent); transform: scale(0); transition: transform .12s; pointer-events: none; z-index: 4; }
        .va-seek:hover .va-knob, .va-seek[data-drag] .va-knob, .va-seek:focus-visible .va-knob { transform: scale(1); }
        .va-hover { position: absolute; bottom: 24px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; pointer-events: none; color: #fff; z-index: 5; }
        .va-thumb { width: 192px; height: 108px; overflow: hidden; border-radius: 8px; border: 1px solid rgba(255,255,255,.35); background: #000; box-shadow: 0 8px 24px rgba(0,0,0,.5); }
        .va-hover-chapter { max-width: 240px; margin-top: 6px; padding: 3px 8px 0; font-size: 13px; font-weight: 700; text-align: center; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,.9); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .va-hover-chapter + .va-hover-time { margin-top: 2px; }
        .va-hover-time { margin-top: 6px; padding: 2px 8px; border-radius: 6px; background: rgba(8, 10, 14, .85); font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums; }
        @media (prefers-reduced-motion: reduce) {
          .va-rail, .va-sg, .va-knob { transition: none; }
        }
      `}</style>
    </div>
  );
}
