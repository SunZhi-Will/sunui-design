"use client";

import { useEffect, useState } from "react";

import { CombineDialog } from "./combine-dialog";
import { MediaPicker, resolveMediaPick, type PickMediaItem } from "./media-picker";

// 內嵌的示意照片：同一片山景切成幾段，排起來才看得出全景
function Slice({ from, to, peak }: { from: string; to: string; peak: number }) {
  return (
    <svg viewBox="0 0 80 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`sky-${peak}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="80" height="100" fill={`url(#sky-${peak})`} />
      <path d={`M0 78 L${peak} ${40 + (peak % 17)} L80 70 V100 H0Z`} fill="#1f2937" opacity="0.85" />
      <path d={`M0 88 L${80 - peak} 66 L80 84 V100 H0Z`} fill="#111827" />
    </svg>
  );
}

const photos: (PickMediaItem & { width: number; height: number })[] = [
  { id: "p1", kind: "image", width: 1080, height: 1350, thumb: <Slice from="#f59e0b" to="#fde68a" peak={22} /> },
  { id: "p2", kind: "image", width: 1080, height: 1350, thumb: <Slice from="#fb923c" to="#fcd34d" peak={48} /> },
  { id: "p3", kind: "image", width: 1080, height: 1350, thumb: <Slice from="#f97316" to="#fbbf24" peak={61} /> },
  { id: "p4", kind: "image", width: 1080, height: 1350, thumb: <Slice from="#ea580c" to="#f59e0b" peak={35} /> },
];
const clip: PickMediaItem = { id: "v1", kind: "video", thumb: <Slice from="#0ea5e9" to="#bae6fd" peak={40} /> };
const post: PickMediaItem[] = [...photos, clip];

function Avatar({ letter }: { letter: string }) {
  return <span className="grid size-9 shrink-0 place-items-center rounded-full bg-neutral-700 text-sm font-semibold text-white">{letter}</span>;
}

export default function MediaPickerDemo() {
  const [picking, setPicking] = useState(false);
  const [combining, setCombining] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  const downloadSingle = () => {
    if (resolveMediaPick([clip]) === "direct") setToast("Saved hike-reel.mp4");
  };

  return (
    <div className="relative w-full min-h-[680px] overflow-hidden rounded-xl bg-black p-3 text-white sm:p-6">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <article className="min-w-0 rounded-2xl border border-[#262626] p-4">
          <header className="flex items-center gap-3">
            <Avatar letter="M" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">mei.outdoors</p>
              <p className="text-xs text-[#a3a3a3]">3h</p>
            </div>
          </header>
          <p className="mt-3 text-sm leading-relaxed">Sunrise at the ridge, swipe for the whole panorama. Clip at the end.</p>
          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
            {post.map((m) => (
              <div key={m.id} className="relative h-36 w-28 shrink-0 overflow-hidden rounded-lg bg-[#1a1a1a] [&_svg]:size-full">
                {m.thumb}
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPicking(true)}
              className="rounded-full border border-[#404040] px-3.5 py-1.5 text-[13px] font-medium hover:border-[#737373] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              Choose what to download
            </button>
            <button
              type="button"
              onClick={() => setCombining(true)}
              className="rounded-full border border-[#404040] px-3.5 py-1.5 text-[13px] font-medium hover:border-[#737373] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              Combine into one image
            </button>
          </div>
        </article>

        <article className="min-w-0 rounded-2xl border border-[#262626] p-4">
          <header className="flex items-center gap-3">
            <Avatar letter="K" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">kai.trails</p>
              <p className="text-xs text-[#a3a3a3]">5h</p>
            </div>
            <button
              type="button"
              onClick={downloadSingle}
              className="rounded-full border border-[#404040] px-3 py-1.5 text-[13px] font-medium hover:border-[#737373] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              Download
            </button>
          </header>
          <p className="mt-3 text-sm text-[#d4d4d4]">One video only, so it downloads straight away.</p>
        </article>
      </div>

      <MediaPicker
        fixed={false}
        open={picking}
        items={post}
        hasText
        onClose={() => setPicking(false)}
        onDownload={(picked, withText) => {
          if (picked.length === 0) setToast("Saved the post text");
          else if (picked.length === 1 && !withText) setToast(`Saved ${picked[0].kind === "video" ? "the video" : "1 image"}`);
          else setToast(`Packed ${picked.length} files${withText ? " and the text" : ""} into a ZIP`);
        }}
      />

      <CombineDialog
        fixed={false}
        open={combining}
        images={photos}
        panorama
        panoramaLocked
        hasVideos
        onClose={() => setCombining(false)}
        onSaveImages={async (choice, sheets) => {
          await new Promise((r) => setTimeout(r, 900));
          setToast(`Saved ${sheets.length > 1 ? `${sheets.length} images` : `${choice.layout} image`}`);
        }}
        onSavePdf={async (include) => {
          await new Promise((r) => setTimeout(r, 700));
          setToast(`Saved a ${include.length}-page PDF`);
        }}
      />

      <div role="status" aria-live="polite" className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
        {toast && <span className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black shadow-lg">{toast}</span>}
      </div>
    </div>
  );
}
