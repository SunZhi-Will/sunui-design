"use client";

import { useEffect, useState } from "react";

import { PauseMenu } from "./pause-menu";

// 探索畫面：右上的選單鍵或 Esc 開關暫停選單；離開前要兩段確認
export default function PauseMenuDemo() {
  const [open, setOpen] = useState(true);

  // 同一個鍵開關暫停；選單開著時由選單自己處理 Esc
  useEffect(() => {
    if (open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div
      className="relative h-[30rem] w-full max-w-3xl min-w-0 overflow-hidden rounded-[4px]"
      style={{
        color: "#eae4d6",
        fontFamily: '"Noto Serif TC", "Songti TC", serif',
        background: "radial-gradient(ellipse at 25% 30%, rgb(231 196 137 / 0.16), transparent 40%), linear-gradient(180deg, #1a1d24, #08090c)",
      }}
    >
      <button
        type="button"
        aria-label="開啟選單"
        onClick={() => setOpen(true)}
        className="absolute top-2 right-3 flex size-11 items-center justify-center rounded-full outline-none hover:text-[#e7c489] focus-visible:text-[#e7c489]"
        style={{ color: "#b3aa97" }}
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <path d="M4.5 7h15M4.5 12h15M4.5 17h15" />
        </svg>
      </button>
      <p className="absolute right-5 bottom-6 left-5 max-w-[34em] text-[15px] leading-[1.8]">
        帳房裡只剩一盞燈。你把撕下的那半頁夾回簿子裡，雨聲忽然近了。
      </p>

      <PauseMenu
        open={open}
        onResume={() => setOpen(false)}
        onOpenSave={() => setOpen(false)}
        onOpenLoad={() => setOpen(false)}
        onOpenSettings={() => setOpen(false)}
        onExitToMenu={() => setOpen(false)}
        objective="查出帳簿那半頁是誰撕走的"
        lastAutosave="第二章・寒水渡 · 渡口・帳房 · 2026/11/5 21:14:03"
      />
    </div>
  );
}
