"use client";

import { useEffect, useState, type CSSProperties } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { PauseMenu, storyThemes } from "./pause-menu";

const copy = {
  en: {
    open: "Open menu",
    scene: "Only one lamp is still burning in the counting house. You tuck the torn half page back into the ledger, and the rain suddenly sounds closer.",
    objective: "Find out who tore the half page from the ledger",
    autosave: "Chapter 2: Cold Water Ferry · Ferry Landing, Counting House · 2026/11/5 21:14:03",
  },
  "zh-TW": {
    open: "開啟選單",
    scene: "帳房裡只剩一盞燈。你把撕下的那半頁夾回簿子裡，雨聲忽然近了。",
    objective: "查出帳簿那半頁是誰撕走的",
    autosave: "第二章・寒水渡 · 渡口・帳房 · 2026/11/5 21:14:03",
  },
  "zh-CN": {
    open: "打开菜单",
    scene: "账房里只剩一盏灯。你把撕下的那半页夹回簿子里，雨声忽然近了。",
    objective: "查出账簿那半页是谁撕走的",
    autosave: "第二章・寒水渡 · 渡口・账房 · 2026/11/5 21:14:03",
  },
  ja: {
    open: "メニューを開く",
    scene: "帳場に残る灯りはひとつだけ。破り取られた半ページを帳簿に挟み戻すと、雨音がふいに近づいた。",
    objective: "帳簿の半ページを破り取ったのは誰か突き止める",
    autosave: "第二章・寒水渡 · 渡し場・帳場 · 2026/11/5 21:14:03",
  },
};

// 探索畫面：右上的選單鍵或 Esc 開關暫停選單；離開前要兩段確認
export default function PauseMenuDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
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
        ...(storyThemes.ink as unknown as CSSProperties),
        color: "var(--story-text)",
        fontFamily: '"Noto Serif TC", "Songti TC", serif',
        background: "var(--story-bg)",
      }}
    >
      <button
        type="button"
        aria-label={t.open}
        onClick={() => setOpen(true)}
        className="absolute top-2 right-3 flex size-11 items-center justify-center rounded-full outline-none hover:text-(--story-accent-bright) focus-visible:text-(--story-accent-bright)"
        style={{ color: "var(--story-secondary)" }}
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <path d="M4.5 7h15M4.5 12h15M4.5 17h15" />
        </svg>
      </button>
      <p className="absolute right-5 bottom-6 left-5 max-w-[34em] text-[15px] leading-[1.8]">{t.scene}</p>

      <PauseMenu
        open={open}
        locale={locale}
        onResume={() => setOpen(false)}
        onOpenSave={() => setOpen(false)}
        onOpenLoad={() => setOpen(false)}
        onOpenSettings={() => setOpen(false)}
        onExitToMenu={() => setOpen(false)}
        objective={t.objective}
        lastAutosave={t.autosave}
      />
    </div>
  );
}
