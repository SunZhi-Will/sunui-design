"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

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
  { id: "v1", kind: "video", thumb: <Shot from="#0ea5e9" to="#0f172a" /> },
];

const copy = {
  en: { download: "Download", saved: (n: number) => `Saved ${n} files` },
  "zh-TW": { download: "下載", saved: (n: number) => `已儲存 ${n} 個檔案` },
  "zh-CN": { download: "下载", saved: (n: number) => `已保存 ${n} 个文件` },
  ja: { download: "ダウンロード", saved: (n: number) => `${n} 件のファイルを保存しました` },
};

/** 型錄卡片：直接打開挑選視窗，點縮圖勾選或取消，下載鈕上的數量跟著變。 */
export default function MediaPickerCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [open, setOpen] = useState(true);
  const [saved, setSaved] = useState<string | null>(null);

  return (
    <div className="relative mx-auto grid h-[240px] w-[300px] place-items-center overflow-hidden rounded-xl bg-black text-white">
      <div className="flex flex-col items-center gap-2 text-sm">
        {saved && <span className="text-[#d4d4d4]">{saved}</span>}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full border border-[#404040] px-3.5 py-1.5 text-[13px] font-medium hover:border-[#737373] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          {t.download}
        </button>
      </div>
      <MediaPicker
        fixed={false}
        locale={locale}
        open={open}
        items={post}
        persistKey={null}
        className="max-h-full p-3"
        onClose={() => setOpen(false)}
        onDownload={(picked) => setSaved(t.saved(picked.length))}
      />
    </div>
  );
}
