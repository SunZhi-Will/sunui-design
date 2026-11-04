"use client";

import { useState } from "react";

import { MediaPicker, type MediaItem } from "./media-picker";

// 中性的線條示意圖，不依賴外部圖片
function Thumb({ shade, shape }: { shade: string; shape: "mug" | "tote" | "plant" | "lamp" | "chair" | "clip" }) {
  const paths: Record<typeof shape, string> = {
    mug: "M18 20h18v18a6 6 0 0 1-6 6h-6a6 6 0 0 1-6-6V20Zm18 4h4a4 4 0 0 1 0 8h-4",
    tote: "M16 24h32l-3 22H19l-3-22Zm8 0v-4a8 8 0 0 1 16 0v4",
    plant: "M32 46V30m0 0c-6-8-12-6-14-2 6 2 10 2 14 2Zm0 0c6-8 12-6 14-2-6 2-10 2-14 2ZM24 46h16l-2 6H26l-2-6Z",
    lamp: "M24 18h16l6 14H18l6-14Zm8 14v14m-8 0h16",
    chair: "M22 16v30m20-30v30M22 30h20M22 16h20",
    clip: "M20 18h24v28H20V18Zm6 8 10 6-10 6V26Z",
  };
  return (
    <svg viewBox="0 0 64 64" className="size-full" style={{ backgroundColor: shade }} aria-hidden="true">
      <path d={paths[shape]} fill="none" stroke="#52525b" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

const items: MediaItem[] = [
  { id: "m1", kind: "image", thumb: <Thumb shade="#f4f4f5" shape="mug" />, alt: "Stoneware mug on a shelf" },
  { id: "m2", kind: "video", duration: "0:42", thumb: <Thumb shade="#e4e4e7" shape="clip" />, alt: "Glazing the mugs, video" },
  { id: "m3", kind: "image", thumb: <Thumb shade="#fafafa" shape="tote" />, alt: "Canvas tote" },
  { id: "m4", kind: "image", thumb: <Thumb shade="#ececee" shape="plant" />, alt: "Plant in a ceramic pot" },
  { id: "m5", kind: "video", duration: "1:08", thumb: <Thumb shade="#e4e4e7" shape="lamp" />, alt: "Studio lamp, video" },
  { id: "m6", kind: "image", thumb: <Thumb shade="#f4f4f5" shape="chair" />, alt: "Oak chair" },
];

export default function MediaPickerDemo() {
  const [done, setDone] = useState<string | null>(null);

  return (
    <div className="flex w-full max-w-3xl flex-col items-start gap-6 md:flex-row">
      <article className="w-full max-w-sm rounded-xl border border-border bg-card p-4 text-sm text-card-foreground">
        <p className="font-medium">Clay & Co. Studio</p>
        <p className="text-xs text-muted-foreground">2h</p>
        <p className="mt-2">New glaze batch is in. Six pieces from this week, two short clips of the kiln opening.</p>
      </article>

      <div className="w-full max-w-md space-y-2">
        <MediaPicker
          items={items}
          defaultValue={["m1", "m2"]}
          persistKey="sunui-media-picker-include-text"
          lockedOptions={[{ label: "Stitch into one image", reason: "Combine picks into a single tall image with the Pro plan." }]}
          onDownload={(ids, { includeText }) =>
            setDone(
              ids.length === 1
                ? `Downloading 1 file${includeText ? " with caption" : ""}.`
                : `Preparing a ZIP of ${ids.length} files${includeText ? " and caption.txt" : ""}.`,
            )
          }
        />
        {done && (
          <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            {done}
          </p>
        )}
      </div>
    </div>
  );
}
