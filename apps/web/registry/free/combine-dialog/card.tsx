"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { CombineDialog, type PickMediaItem } from "./combine-dialog";

// 與 demo 相同：同一片山景切成三段
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
  en: { open: "Combine 3 photos", panorama: "Panorama", columns: (n: number) => `${n} cols`, row: "Row" },
  "zh-TW": { open: "合併 3 張照片", panorama: "全景", columns: (n: number) => `${n} 欄`, row: "一排" },
  "zh-CN": { open: "合并 3 张照片", panorama: "全景", columns: (n: number) => `${n} 列`, row: "一排" },
  ja: { open: "3 枚の写真を結合", panorama: "パノラマ", columns: (n: number) => `${n} 列`, row: "横一列" },
};

/** 型錄卡片：只留預覽、版型選項與縮圖，點選即看三張圖即時拼成一張。 */
export default function CombineDialogCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [open, setOpen] = useState(true);

  return (
    <div className="relative mx-auto grid h-60 w-72 place-items-center overflow-hidden rounded-xl bg-black text-white">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-[#404040] px-4 py-2 text-sm font-medium hover:border-[#737373]"
      >
        {t.open}
      </button>

      {/* 卡片裡收掉標題、說明文字、間距勾選與底部按鈕列，只看拼圖本身 */}
      <CombineDialog
        fixed={false}
        open={open}
        locale={locale}
        images={photos}
        panorama
        onClose={() => setOpen(false)}
        onSaveImages={() => setOpen(false)}
        labels={{ panorama: t.panorama, columns: t.columns, row: t.row }}
        className="w-[94%] [&>div:first-child]:gap-2 [&>div:first-child]:p-2.5 [&>div:last-child]:hidden [&_h2]:hidden [&_label]:hidden [&_p]:hidden"
      />
    </div>
  );
}
