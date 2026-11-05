"use client";

import { useState } from "react";

import { PauseMenu } from "./pause-menu";

/** 型錄卡片：暫停選單直接開著，滑過選項看筆刷掃過，點返回主選單看兩段確認。 */
export default function PauseMenuCard() {
  const [open, setOpen] = useState(true);
  const close = () => setOpen(false);

  return (
    <div
      className="relative mx-auto h-[240px] w-[300px] overflow-hidden rounded-[4px]"
      style={{ color: "#eae4d6", fontFamily: '"Noto Serif TC", "Songti TC", serif', background: "#0f1116" }}
    >
      <button
        type="button"
        aria-label="開啟選單"
        onClick={() => setOpen(true)}
        className="absolute inset-0 flex items-center justify-center text-sm outline-none hover:text-[#e7c489] focus-visible:text-[#e7c489]"
        style={{ color: "#b3aa97" }}
      >
        點此重新開啟選單
      </button>
      <PauseMenu
        open={open}
        onResume={close}
        onOpenSave={close}
        onOpenLoad={close}
        onOpenSettings={close}
        onExitToMenu={close}
        lastAutosave="第二章・寒水渡 · 渡口・帳房"
      />
    </div>
  );
}
