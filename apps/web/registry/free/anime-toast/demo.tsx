"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { AnimeToast } from "./anime-toast";

const copy = {
  en: { save: "Save loadout", title: "Loadout saved", description: "Swordsman · slot 2", undo: "Undo", close: "Dismiss" },
  "zh-TW": { save: "儲存配裝", title: "配裝已儲存", description: "劍士 · 第 2 組", undo: "復原", close: "關閉" },
  "zh-CN": { save: "保存配装", title: "配装已保存", description: "剑士 · 第 2 组", undo: "撤销", close: "关闭" },
  ja: { save: "装備を保存", title: "装備を保存しました", description: "剣士 · スロット 2", undo: "元に戻す", close: "閉じる" },
};

export default function AnimeToastDemo() {
  const t = useDemoText(copy);
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-56 w-full max-w-sm items-center justify-center px-2 py-14">
      <button type="button" onClick={() => setOpen(true)} className="rounded-[12px] border-[3px] border-foreground bg-card px-5 py-2.5 text-[15px] font-extrabold italic outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--sunui-spot,var(--primary))]">
        {t.save}
      </button>
      <AnimeToast open={open} onOpenChange={setOpen} title={t.title} description={t.description} action={{ label: t.undo, onClick: () => {} }} closeLabel={t.close} />
    </div>
  );
}
