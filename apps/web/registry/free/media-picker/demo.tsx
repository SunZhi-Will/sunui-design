"use client";

import { useEffect, useState } from "react";

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
  { id: "p3", kind: "image", thumb: <Shot from="#f97316" to="#1f2937" /> },
  { id: "v1", kind: "video", thumb: <Shot from="#0ea5e9" to="#0f172a" /> },
];

const copy = {
  en: {
    caption: "Sunrise at the ridge. Clip at the end.",
    download: "Download",
    savedText: "Saved the post text",
    saved: (n: number, withText: boolean) => `Saved ${n} files${withText ? " and the text" : ""}`,
  },
  "zh-TW": {
    caption: "山脊上的日出，影片在最後。",
    download: "下載",
    savedText: "已儲存貼文文字",
    saved: (n: number, withText: boolean) => `已儲存 ${n} 個檔案${withText ? "與文字" : ""}`,
  },
  "zh-CN": {
    caption: "山脊上的日出，视频在最后。",
    download: "下载",
    savedText: "已保存帖子文字",
    saved: (n: number, withText: boolean) => `已保存 ${n} 个文件${withText ? "和文字" : ""}`,
  },
  ja: {
    caption: "尾根から見た日の出。最後に動画もあります。",
    download: "ダウンロード",
    savedText: "投稿のテキストを保存しました",
    saved: (n: number, withText: boolean) => `${n} 件のファイル${withText ? "とテキスト" : ""}を保存しました`,
  },
};

export default function MediaPickerDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
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
        <p className="mt-2 text-sm leading-relaxed text-[#d4d4d4]">{t.caption}</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 rounded-full border border-[#404040] px-3.5 py-1.5 text-[13px] font-medium hover:border-[#737373] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          {t.download}
        </button>
      </article>

      <MediaPicker
        fixed={false}
        locale={locale}
        open={open}
        items={post}
        hasText
        onClose={() => setOpen(false)}
        onDownload={(picked, withText) =>
          setToast(picked.length === 0 ? t.savedText : t.saved(picked.length, withText))
        }
      />

      <div role="status" aria-live="polite" className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
        {toast && <span className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black shadow-lg">{toast}</span>}
      </div>
    </div>
  );
}
