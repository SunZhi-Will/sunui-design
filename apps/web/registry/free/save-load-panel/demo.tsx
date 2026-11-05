"use client";

import { useState, type CSSProperties } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { SaveLoadPanel, storyThemes, type SaveSlot } from "./save-load-panel";

// 山河未歸 的章節與場景名稱
const story = {
  en: { open: "Save", ch1: "Chapter 1 · Bluestone Town", scene1: "Town gate · Under the old locust tree", ch2: "Chapter 2 · Cold Water Ferry", scene2: "Ferry landing · Counting house" },
  "zh-TW": { open: "存檔", ch1: "第一章・青石鎮", scene1: "鎮口・老槐樹下", ch2: "第二章・寒水渡", scene2: "渡口・帳房" },
  "zh-CN": { open: "存档", ch1: "第一章・青石镇", scene1: "镇口・老槐树下", ch2: "第二章・寒水渡", scene2: "渡口・账房" },
  ja: { open: "セーブ", ch1: "第一章・青石鎮", scene1: "町の入口・古い槐の木の下", ch2: "第二章・寒水渡", scene2: "渡し場・帳場" },
};

// 暫停選單選了「存檔」：空欄直接寫入，已有存檔的欄位要先確認覆蓋
export default function SaveLoadPanelDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(story);
  const [open, setOpen] = useState(true);
  const [slots, setSlots] = useState<(SaveSlot | undefined)[]>([
    { id: "m1", chapter: t.ch1, scene: t.scene1, savedAt: "2026-11-04T22:40:12", playTimeSeconds: 2460 },
    undefined,
    undefined,
  ]);

  return (
    <div
      className="relative h-[34rem] w-full max-w-3xl min-w-0 overflow-hidden rounded-[4px]"
      style={{ ...(storyThemes.ink as unknown as CSSProperties), color: "var(--story-text)", background: "var(--story-bg)" }}
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="absolute top-4 left-5 border-b px-1 py-2 text-sm tracking-[0.18em] outline-none hover:text-(--story-accent-bright) focus-visible:text-(--story-accent-bright)"
        style={{ borderColor: "var(--story-line)", fontFamily: '"Noto Serif TC", "Songti TC", serif' }}
      >
        {t.open}
      </button>

      {open && (
        <SaveLoadPanel
          mode="save"
          locale={locale}
          manualSlots={slots}
          onClose={() => setOpen(false)}
          onSave={(n) =>
            setSlots((s) => s.map((slot, i) => (i === n - 1 ? { id: `m${n}-${Date.now()}`, chapter: t.ch2, scene: t.scene2, savedAt: new Date(), playTimeSeconds: 4500 } : slot)))
          }
          onDelete={(n) => setSlots((s) => s.map((slot, i) => (i === n - 1 ? undefined : slot)))}
        />
      )}
    </div>
  );
}
