"use client";

import { useEffect, useState } from "react";

import { MediaPicker, type PickMediaItem } from "./media-picker";

// 內嵌示意縮圖，不用外部圖片
function Shot({ from, to }: { from: string; to: string }) {
  return (
    <svg viewBox="0 0 80 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="80" height="100" fill={from} />
      <path d="M0 80 L30 50 L80 74 V100 H0Z" fill={to} />
    </svg>
  );
}

const post: PickMediaItem[] = [
  { id: "p1", kind: "image", thumb: <Shot from="#f59e0b" to="#1f2937" /> },
  { id: "p2", kind: "image", thumb: <Shot from="#fb923c" to="#111827" /> },
  { id: "p3", kind: "image", thumb: <Shot from="#f97316" to="#1f2937" /> },
  { id: "v1", kind: "video", thumb: <Shot from="#0ea5e9" to="#0f172a" /> },
];

export default function MediaPickerDemo() {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <div className="relative grid min-h-[560px] w-full place-items-center overflow-hidden rounded-xl bg-black p-4 text-white">
      <article className="w-full min-w-0 max-w-sm rounded-2xl border border-[#262626] p-4">
        <p className="text-sm font-semibold">mei.outdoors</p>
        <p className="mt-2 text-sm leading-relaxed text-[#d4d4d4]">Sunrise at the ridge. Clip at the end.</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 rounded-full border border-[#404040] px-3.5 py-1.5 text-[13px] font-medium hover:border-[#737373] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          Download
        </button>
      </article>

      <MediaPicker
        fixed={false}
        open={open}
        items={post}
        hasText
        onClose={() => setOpen(false)}
        onDownload={(picked, withText) =>
          setToast(picked.length === 0 ? "Saved the post text" : `Saved ${picked.length} files${withText ? " and the text" : ""}`)
        }
      />

      <div role="status" aria-live="polite" className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
        {toast && <span className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black shadow-lg">{toast}</span>}
      </div>
    </div>
  );
}
