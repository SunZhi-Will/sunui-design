"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { ClothCurtain } from "./cloth-curtain";

const copy = {
  en: {
    chapter: "Chapter one",
    title: "The night he first came to the window",
    opened: "The curtain is drawn aside.",
    closed: "A heavy wine-red curtain hangs over the window.",
    close: "Close curtain",
    open: "Open curtain",
  },
  "zh-TW": {
    chapter: "第一章",
    title: "他第一次來到窗邊的那一夜",
    opened: "簾子被拉開了。",
    closed: "酒紅色的厚簾垂在窗前。",
    close: "拉上簾子",
    open: "拉開簾子",
  },
  "zh-CN": {
    chapter: "第一章",
    title: "他第一次来到窗边的那一夜",
    opened: "帘子被拉开了。",
    closed: "酒红色的厚帘垂在窗前。",
    close: "拉上帘子",
    open: "拉开帘子",
  },
  ja: {
    chapter: "第一章",
    title: "彼がはじめて窓辺に来た夜",
    opened: "カーテンが開かれた。",
    closed: "ワインレッドの厚いカーテンが窓にかかっている。",
    close: "カーテンを閉める",
    open: "カーテンを開ける",
  },
};

export default function ClothCurtainDemo() {
  const [open, setOpen] = useState(false);
  const t = useDemoText(copy);

  return (
    <div className="w-full max-w-xl min-w-0 overflow-hidden rounded-lg border border-white/10 bg-[#0b0d13] text-[#e8e4f0]">
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        {/* 簾子後面：月光下的窗景，用漸層代替插畫 */}
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 50% 30%, #2a3040 0%, #0b0d13 80%)" }}
        />
        <div className="absolute left-[64%] top-[18%] size-12 rounded-full bg-[#f2eedc] shadow-[0_0_40px_12px_rgba(242,238,220,0.25)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#141824] to-transparent" />
        <div className="absolute inset-x-0 bottom-[14%] flex flex-col items-center gap-1 px-4 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[#9aa3b8]">{t.chapter}</p>
          <p className="text-lg tracking-wide">{t.title}</p>
        </div>

        <ClothCurtain layout="pair" open={open ? 1 : 0} sheer={0.1} breeze={0.5} gust={open ? 1 : 0} openSeconds={1.5} />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
        <p className="min-w-0 truncate text-sm text-[#9aa3b8]">{open ? t.opened : t.closed}</p>
        <button
          type="button"
          aria-pressed={open}
          onClick={() => setOpen((value) => !value)}
          className="shrink-0 rounded-md border border-[#d9a17a]/40 bg-[#d9a17a]/10 px-3 py-1.5 text-sm text-[#ecd2bd] transition-colors hover:bg-[#d9a17a]/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d9a17a]"
        >
          {open ? t.close : t.open}
        </button>
      </div>
    </div>
  );
}
