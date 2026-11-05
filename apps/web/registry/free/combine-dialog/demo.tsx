"use client";

import { useEffect, useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

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

const copy = {
  en: {
    open: "Combine 3 photos into one image",
    savedImages: (n: number) => `Saved ${n} images`,
    savedImage: (layout: string) => `Saved ${layout} image`,
    savedPdf: (n: number) => `Saved a ${n}-page PDF`,
  },
  "zh-TW": {
    open: "把 3 張照片合成一張圖",
    savedImages: (n: number) => `已儲存 ${n} 張圖片`,
    savedImage: (layout: string) => `已儲存${layout}圖片`,
    savedPdf: (n: number) => `已儲存 ${n} 頁的 PDF`,
  },
  "zh-CN": {
    open: "把 3 张照片合成一张图",
    savedImages: (n: number) => `已保存 ${n} 张图片`,
    savedImage: (layout: string) => `已保存${layout}图片`,
    savedPdf: (n: number) => `已保存 ${n} 页的 PDF`,
  },
  ja: {
    open: "3 枚の写真を 1 枚に結合",
    savedImages: (n: number) => `${n} 枚の画像を保存しました`,
    savedImage: (layout: string) => `${layout}の画像を保存しました`,
    savedPdf: (n: number) => `${n} ページの PDF を保存しました`,
  },
};

const layoutNames = {
  en: { grid: "grid", row: "row", panorama: "panorama" },
  "zh-TW": { grid: "格狀", row: "橫排", panorama: "全景" },
  "zh-CN": { grid: "网格", row: "横排", panorama: "全景" },
  ja: { grid: "グリッド", row: "横一列", panorama: "パノラマ" },
};

export default function CombineDialogDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const names = useDemoText(layoutNames);
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
        {t.open}
      </button>

      <CombineDialog
        fixed={false}
        open={open}
        locale={locale}
        images={photos}
        panorama
        onClose={() => setOpen(false)}
        onSaveImages={async (choice, sheets) => {
          await new Promise((r) => setTimeout(r, 900));
          setToast(sheets.length > 1 ? t.savedImages(sheets.length) : t.savedImage(names[choice.layout]));
        }}
        onSavePdf={async (include) => {
          await new Promise((r) => setTimeout(r, 700));
          setToast(t.savedPdf(include.length));
        }}
      />

      <div role="status" aria-live="polite" className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
        {toast && <span className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black shadow-lg">{toast}</span>}
      </div>
    </div>
  );
}
