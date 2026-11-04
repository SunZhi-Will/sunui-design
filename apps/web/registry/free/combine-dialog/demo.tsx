"use client";

import { useEffect, useState } from "react";

import { CombineDialog, type PickMediaItem } from "./combine-dialog";

// 同一片山景切成幾段，排起來才看得出全景
function Slice({ from, to, peak }: { from: string; to: string; peak: number }) {
  return (
    <svg viewBox="0 0 80 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="80" height="100" fill={from} />
      <path d={`M0 78 L${peak} ${40 + (peak % 17)} L80 70 V100 H0Z`} fill={to} opacity="0.85" />
      <path d={`M0 88 L${80 - peak} 66 L80 84 V100 H0Z`} fill="#111827" />
    </svg>
  );
}

const photos: (PickMediaItem & { width: number; height: number })[] = [
  { id: "p1", kind: "image", width: 1080, height: 1350, thumb: <Slice from="#f59e0b" to="#1f2937" peak={22} /> },
  { id: "p2", kind: "image", width: 1080, height: 1350, thumb: <Slice from="#fb923c" to="#1f2937" peak={48} /> },
  { id: "p3", kind: "image", width: 1080, height: 1350, thumb: <Slice from="#f97316" to="#1f2937" peak={61} /> },
];

export default function CombineDialogDemo() {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <div className="relative grid min-h-[640px] w-full place-items-center overflow-hidden rounded-xl bg-black p-4 text-white">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-[#404040] px-4 py-2 text-sm font-medium hover:border-[#737373] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        Combine 3 photos into one image
      </button>

      <CombineDialog
        fixed={false}
        open={open}
        images={photos}
        panorama
        onClose={() => setOpen(false)}
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
