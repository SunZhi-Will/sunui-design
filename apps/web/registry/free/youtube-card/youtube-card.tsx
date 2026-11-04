"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface YouTubeCardProps {
  /** YouTube 網址或 11 碼影片 ID */
  videoId: string;
  title?: string;
  /** 自訂縮圖；預設使用 i.ytimg.com 的 hqdefault */
  thumbnail?: ReactNode;
  /** 點擊播放後才嵌入播放器（預設 true）；false 則一開始就嵌入 */
  clickToPlay?: boolean;
  /** 提供時，四邊、四角與標題列成為拖動把手（例如放在畫布上） */
  onDragHandleMouseDown?: (e: MouseEvent<HTMLDivElement>) => void;
  onPlay?: (videoId: string) => void;
  /** 套用 CardFlow 畫布卡片外框（白底、圓角、陰影） */
  framed?: boolean;
  labels?: Partial<typeof defaultLabels>;
  className?: string;
}

const defaultLabels = {
  emptyTitle: "YouTube video",
  emptyHint: "Add a YouTube link or video ID in the editor",
  formatsTitle: "Supported formats:",
  formats: ["youtube.com/watch?v=ID", "youtu.be/ID", "Video ID on its own"],
  fallbackTitle: "YouTube video",
  play: (title: string) => `Play ${title}`,
};

// 支援多種 YouTube 網址格式
export function extractVideoId(input: string): string {
  const patterns = [/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/, /^([a-zA-Z0-9_-]{11})$/];
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  return input;
}

const edges = [
  { className: "top-0 left-0 right-0", style: { height: 8, marginTop: -4 } },
  { className: "bottom-0 left-0 right-0", style: { height: 8, marginBottom: -4 } },
  { className: "top-0 bottom-0 left-0", style: { width: 8, marginLeft: -4 } },
  { className: "top-0 bottom-0 right-0", style: { width: 8, marginRight: -4 } },
  { className: "top-0 left-0", style: { width: 20, height: 20, marginTop: -4, marginLeft: -4 } },
  { className: "top-0 right-0", style: { width: 20, height: 20, marginTop: -4, marginRight: -4 } },
  { className: "bottom-0 left-0", style: { width: 20, height: 20, marginBottom: -4, marginLeft: -4 } },
  { className: "bottom-0 right-0", style: { width: 20, height: 20, marginBottom: -4, marginRight: -4 } },
];

export function YouTubeCard({
  videoId,
  title = "",
  thumbnail,
  clickToPlay = true,
  onDragHandleMouseDown,
  onPlay,
  framed = true,
  labels: labelsProp,
  className,
}: YouTubeCardProps) {
  const labels = { ...defaultLabels, ...labelsProp };
  const id = videoId ? extractVideoId(videoId) : "";
  const [playing, setPlaying] = useState(!clickToPlay);
  const [isDragging, setIsDragging] = useState(false);
  const drag = useRef({ x: 0, y: 0, hasMoved: false, isMouseDown: false });

  // 換影片時回到縮圖狀態
  useEffect(() => {
    setPlaying(!clickToPlay);
  }, [id, clickToPlay]);

  // 全域追蹤拖動，超過 3px 換成 grabbing 游標
  useEffect(() => {
    const t = drag.current;
    const onMove = (e: globalThis.MouseEvent) => {
      if (!t.isMouseDown) return;
      if (Math.abs(e.clientX - t.x) > 3 || Math.abs(e.clientY - t.y) > 3) {
        t.hasMoved = true;
        setIsDragging(true);
      }
    };
    const onUp = () => {
      t.isMouseDown = false;
      setIsDragging(false);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      t.hasMoved = false;
      t.isMouseDown = false;
    };
  }, []);

  // 只記錄位置，不阻止冒泡，讓外層處理拖動
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    drag.current = { x: e.clientX, y: e.clientY, hasMoved: false, isMouseDown: true };
    onDragHandleMouseDown?.(e);
  };

  // 點在播放區（非邊框）時阻止冒泡，避免觸發外層選取
  const handleClick = (e: MouseEvent) => {
    if (drag.current.hasMoved) {
      drag.current.hasMoved = false;
      return;
    }
    if (!(e.target as HTMLElement).closest("[data-drag-area]")) e.stopPropagation();
  };

  const play = () => {
    if (drag.current.hasMoved) return;
    setPlaying(true);
    onPlay?.(id);
  };

  const frame = framed && "rounded-lg bg-white shadow-lg overflow-hidden";
  const draggable = Boolean(onDragHandleMouseDown);
  const grab = draggable ? { cursor: isDragging ? "grabbing" : "grab" } : undefined;
  const displayTitle = title || labels.fallbackTitle;

  if (!id) {
    return (
      <div className={cn("relative h-full w-full", frame, className)}>
        <div
          className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 p-6"
          onMouseDown={draggable ? handleMouseDown : undefined}
        >
          <div className="mb-4 text-6xl" aria-hidden>
            🎥
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-800">{labels.emptyTitle}</h3>
          <p className="mb-4 text-center text-sm text-gray-600">{labels.emptyHint}</p>
          <div className="text-center text-xs text-gray-500">
            {labels.formatsTitle}
            {labels.formats.map((f) => (
              <span key={f}>
                <br />• {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative flex h-full w-full flex-col", frame, className)}>
      <div className="relative min-h-0 flex-1" onClick={handleClick}>
        {draggable &&
          edges.map((edge, i) => (
            <div
              key={i}
              data-drag-area="true"
              aria-hidden
              className={cn("pointer-events-auto absolute z-20", edge.className)}
              style={{ ...edge.style, ...grab }}
              onMouseDown={handleMouseDown}
            />
          ))}

        {playing ? (
          <iframe
            className="relative z-0 h-full w-full"
            src={`https://www.youtube.com/embed/${id}?autoplay=${clickToPlay ? 1 : 0}&mute=0`}
            title={displayTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ pointerEvents: "auto" }}
          />
        ) : (
          <button
            type="button"
            onClick={play}
            className="group relative z-0 block h-full w-full overflow-hidden bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
            aria-label={labels.play(displayTitle)}
          >
            {thumbnail ?? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" className="h-full w-full object-cover" />
            )}
            {/* YouTube 樣式播放鍵 */}
            <svg
              viewBox="0 0 68 48"
              aria-hidden
              className="absolute left-1/2 top-1/2 h-12 w-[68px] -translate-x-1/2 -translate-y-1/2"
            >
              <path
                d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z"
                className="fill-[#212121] opacity-80 transition-[fill,opacity] group-hover:fill-[#ff0000] group-hover:opacity-100 group-focus-visible:fill-[#ff0000] group-focus-visible:opacity-100 motion-reduce:transition-none"
              />
              <path d="M45 24 27 14v20" fill="#fff" />
            </svg>
          </button>
        )}
      </div>

      {title && (
        <div
          data-drag-area={draggable ? "true" : undefined}
          className="pointer-events-auto border-t border-gray-200 bg-gray-50 px-3 py-2"
          style={grab}
          onMouseDown={draggable ? handleMouseDown : undefined}
        >
          <p className="truncate text-sm font-medium text-gray-800">{title}</p>
        </div>
      )}
    </div>
  );
}
