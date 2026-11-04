"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/*
 * 選擇要下載的（圖片、影片）
 * 移植自 PostVault 的 media-pick-download.ts：點縮圖勾選（只選一個也可以），
 * 預設全選，可連同貼文文字一起下載；整則只有一個媒體時不開視窗，直接給檔案（video-picker.ts）。
 */

export interface PickMediaItem {
  id: string;
  kind: "image" | "video";
  /** 圖片網址，或影片網址（用 metadata 預載顯示第一格） */
  src?: string;
  /** 影片封面；有給就不預載影片 */
  poster?: string;
  /** 自訂縮圖內容，優先於 src */
  thumb?: ReactNode;
  width?: number;
  height?: number;
}

export interface MediaPickerLabels {
  title: (count: number) => string;
  subtitle: string;
  imageLabel: (index: number) => string;
  videoLabel: (index: number) => string;
  selectAll: string;
  clearAll: string;
  includeText: string;
  downloadTextOnly: string;
  download: (count: number) => string;
  downloadNone: string;
  cancel: string;
}

export const defaultMediaPickerLabels: MediaPickerLabels = {
  title: (n) => `What to download? (${n} total)`,
  subtitle: "Tap to select. One is fine",
  imageLabel: (i) => `Image ${i}`,
  videoLabel: (i) => `Video ${i}`,
  selectAll: "Select all",
  clearAll: "Clear",
  includeText: "Include the post text",
  downloadTextOnly: "Download text only",
  download: (n) => `Download ${n}`,
  downloadNone: "Select something first",
  cancel: "Cancel",
};

/** 只有一個媒體就不用選了，直接下載；沒有媒體回傳 none */
export function resolveMediaPick(items: PickMediaItem[]): "none" | "direct" | "picker" {
  if (items.length === 0) return "none";
  return items.length === 1 ? "direct" : "picker";
}

const INCLUDE_TEXT_KEY = "pickMediaIncludeText";

// 記住上次「連同文字一起下載」的勾選；沒存過時預設勾選
function loadIncludeText(key: string | undefined): boolean {
  if (!key) return true;
  try {
    return localStorage.getItem(key) !== "false";
  } catch {
    return true;
  }
}

function saveIncludeText(key: string | undefined, value: boolean) {
  if (!key) return;
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // 無法儲存就算了，下次回到預設
  }
}

export interface MediaPickerProps {
  open: boolean;
  items: PickMediaItem[];
  /** 貼文沒有文字就不顯示「包含文字」 */
  hasText?: boolean;
  /** 記住「包含文字」勾選的 localStorage key，傳 null 不記 */
  persistKey?: string | null;
  /** 勾選的項目（依原本順序）與是否包含文字 */
  onDownload: (picked: PickMediaItem[], includeText: boolean) => void;
  onClose: () => void;
  /** true 時蓋住整個視窗；false 時蓋住最近的 relative 容器 */
  fixed?: boolean;
  labels?: Partial<MediaPickerLabels>;
  className?: string;
}

export function MediaPicker({
  open,
  items,
  hasText = false,
  persistKey = INCLUDE_TEXT_KEY,
  onDownload,
  onClose,
  fixed = true,
  labels: labelsProp,
  className,
}: MediaPickerProps) {
  const l = { ...defaultMediaPickerLabels, ...labelsProp };
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  // 預設全選：大多數人是要整則存下來，不要的再取消
  const [selected, setSelected] = useState<Set<number>>(() => new Set(items.map((_, i) => i)));
  const [includeText, setIncludeText] = useState(false);

  // 每次打開重置成全選，並讀回上次的「包含文字」
  useEffect(() => {
    if (!open) return;
    setSelected(new Set(items.map((_, i) => i)));
    setIncludeText(hasText && loadIncludeText(persistKey ?? undefined));
    dialogRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, items.length, hasText, persistKey]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const toggle = useCallback((position: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(position)) next.delete(position);
      else next.add(position);
      return next;
    });
  }, []);

  if (!open) return null;

  // 影片與圖片各自編號，跟原本一樣「圖片 2」「影片 1」
  let imageNo = 0;
  let videoNo = 0;
  const numbered = items.map((item) => ({
    item,
    label: item.kind === "image" ? l.imageLabel(++imageNo) : l.videoLabel(++videoNo),
  }));

  const count = selected.size;
  // 沒勾媒體但有勾「包含文字」時，仍可只下載文字
  const nothing = count === 0 && !includeText;
  const allOn = count === items.length;

  const handleDownload = () => {
    if (nothing) return;
    const picked = items.filter((_, i) => selected.has(i));
    onClose();
    onDownload(picked, includeText);
  };

  return (
    // 點遮罩關閉；鍵盤用 Escape（掛在 document 上）
    <div
      role="presentation"
      className={cn(fixed ? "fixed" : "absolute", "inset-0 z-[60] flex items-center justify-center p-5")}
      style={{ background: "rgba(0, 0, 0, 0.7)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "w-full max-w-[420px] max-h-[80vh] overflow-y-auto rounded-xl border p-5 text-sm text-white outline-none",
          className,
        )}
        style={{ background: "rgb(38, 38, 38)", borderColor: "#4b5563", boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)" }}
      >
        <div id={titleId} className="mb-1 text-base font-semibold">
          {l.title(items.length)}
        </div>
        <div className="mb-4 text-xs" style={{ color: "#a3a3a3" }}>
          {l.subtitle}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {numbered.map(({ item, label }, position) => {
            const on = selected.has(position);
            return (
              <button
                key={item.id}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={on}
                onClick={() => toggle(position)}
                className="relative aspect-square cursor-pointer overflow-hidden rounded-lg border-2 p-0 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#262626]"
                style={{
                  background: "#1a1a1a",
                  borderColor: on ? "#ffffff" : "transparent",
                  opacity: on || count === 0 ? 1 : 0.6,
                }}
              >
                <Thumb item={item} />
                {item.kind === "video" && (
                  <>
                    {/* 中間蓋播放鈕跟圖片區分，左下角標第幾支 */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-1/2 top-1/2 -ml-[18px] -mt-[18px] size-9 rounded-full border-2 border-white"
                      style={{ background: "rgba(0, 0, 0, 0.6)" }}
                    >
                      <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true" focusable="false">
                        <path fill="#ffffff" d="M9.5 7.5v9l7.5-4.5z" />
                      </svg>
                    </span>
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute bottom-1.5 left-1.5 rounded px-1.5 text-[11px] leading-4 text-white"
                      style={{ background: "rgba(0, 0, 0, 0.6)" }}
                    >
                      {label}
                    </span>
                  </>
                )}
                {/* 右上角的勾選圈：沒選是半透明空圈，選了是白底打勾 */}
                <span
                  aria-hidden="true"
                  className="absolute right-1.5 top-1.5 box-border size-[22px] rounded-full border-2 border-white text-center text-[13px] font-bold leading-[18px] text-black"
                  style={{ background: on ? "#ffffff" : "rgba(0, 0, 0, 0.45)" }}
                >
                  {on ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>

        {hasText && (
          <label className="mt-3.5 flex cursor-pointer items-center gap-2 text-[13px]" style={{ color: "#d4d4d4" }}>
            <input
              type="checkbox"
              checked={includeText}
              onChange={(e) => {
                setIncludeText(e.target.checked);
                saveIncludeText(persistKey ?? undefined, e.target.checked);
              }}
              className="m-0 size-4 cursor-pointer"
            />
            <span>{l.includeText}</span>
          </label>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setSelected(allOn ? new Set() : new Set(items.map((_, i) => i)))}
            className="flex-none cursor-pointer rounded-lg border bg-transparent px-3.5 py-2.5 text-[13px] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            style={{ color: "#a3a3a3", borderColor: "#4b5563" }}
          >
            {allOn ? l.clearAll : l.selectAll}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={nothing}
            className="min-w-0 flex-auto rounded-lg border-none bg-white px-4 py-2.5 text-sm font-semibold text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#262626]"
            style={{ opacity: nothing ? 0.4 : 1, cursor: nothing ? "default" : "pointer" }}
          >
            {nothing ? l.downloadNone : count === 0 ? l.downloadTextOnly : l.download(count)}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-1 w-full cursor-pointer border-none bg-transparent px-4 py-2.5 text-[13px] hover:text-white focus:outline-none focus-visible:text-white"
          style={{ color: "#a3a3a3" }}
        >
          {l.cancel}
        </button>
      </div>
    </div>
  );
}

/** 縮圖：自訂內容 > 封面 > 圖片 > 影片第一格（載不到就是深色底） */
export function Thumb({ item, className }: { item: PickMediaItem; className?: string }) {
  if (item.thumb) return <span className={cn("absolute inset-0 block [&>svg]:size-full", className)}>{item.thumb}</span>;
  const still = item.kind === "image" ? item.src : item.poster;
  if (still) {
    return <img src={still} alt="" className={cn("absolute inset-0 block size-full object-cover", className)} />;
  }
  if (item.kind === "video" && item.src) {
    return (
      <video
        src={`${item.src}#t=0.1`}
        muted
        preload="metadata"
        playsInline
        className={cn("pointer-events-none absolute inset-0 block size-full object-cover", className)}
      />
    );
  }
  return null;
}
