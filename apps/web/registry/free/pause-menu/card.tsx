"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { PauseMenu } from "./pause-menu";

const copy = {
  en: { open: "Open menu", reopen: "Click to reopen the menu", autosave: "Chapter 2: Cold Water Ferry · Ferry Landing, Counting House" },
  "zh-TW": { open: "開啟選單", reopen: "點此重新開啟選單", autosave: "第二章・寒水渡 · 渡口・帳房" },
  "zh-CN": { open: "打开菜单", reopen: "点此重新打开菜单", autosave: "第二章・寒水渡 · 渡口・账房" },
  ja: { open: "メニューを開く", reopen: "クリックしてメニューを再表示", autosave: "第二章・寒水渡 · 渡し場・帳場" },
};

/** 型錄卡片：暫停選單直接開著，滑過選項看筆刷掃過，點返回主選單看兩段確認。 */
export default function PauseMenuCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [open, setOpen] = useState(true);
  const close = () => setOpen(false);

  return (
    <div
      className="relative mx-auto h-[240px] w-[300px] overflow-hidden rounded-[4px]"
      style={{ color: "#eae4d6", fontFamily: '"Noto Serif TC", "Songti TC", serif', background: "#0f1116" }}
    >
      <button
        type="button"
        aria-label={t.open}
        onClick={() => setOpen(true)}
        className="absolute inset-0 flex items-center justify-center text-sm outline-none hover:text-[#e7c489] focus-visible:text-[#e7c489]"
        style={{ color: "#b3aa97" }}
      >
        {t.reopen}
      </button>
      <PauseMenu
        open={open}
        locale={locale}
        onResume={close}
        onOpenSave={close}
        onOpenLoad={close}
        onOpenSettings={close}
        onExitToMenu={close}
        lastAutosave={t.autosave}
      />
    </div>
  );
}
