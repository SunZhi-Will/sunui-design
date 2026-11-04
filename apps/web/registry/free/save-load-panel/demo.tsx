"use client";

import { useState } from "react";

import { SaveLoadPanel, type SaveSlot } from "./save-load-panel";

// 暫停選單選了「存檔」：空欄直接寫入，已有存檔的欄位要先確認覆蓋
export default function SaveLoadPanelDemo() {
  const [open, setOpen] = useState(true);
  const [slots, setSlots] = useState<(SaveSlot | undefined)[]>([
    { id: "m1", chapter: "第一章・青石鎮", scene: "鎮口・老槐樹下", savedAt: "2026-11-04T22:40:12", playTimeSeconds: 2460 },
    undefined,
    undefined,
  ]);

  return (
    <div
      className="relative h-[34rem] w-full max-w-3xl min-w-0 overflow-hidden rounded-[4px]"
      style={{ color: "#eae4d6", background: "linear-gradient(180deg, #1a1d24, #08090c)" }}
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="absolute top-4 left-5 border-b px-1 py-2 text-sm tracking-[0.18em] outline-none hover:text-[#e7c489] focus-visible:text-[#e7c489]"
        style={{ borderColor: "rgb(201 160 99 / 0.22)", fontFamily: '"Noto Serif TC", "Songti TC", serif' }}
      >
        存檔
      </button>

      {open && (
        <SaveLoadPanel
          mode="save"
          manualSlots={slots}
          onClose={() => setOpen(false)}
          onSave={(n) =>
            setSlots((s) => s.map((slot, i) => (i === n - 1 ? { id: `m${n}-${Date.now()}`, chapter: "第二章・寒水渡", scene: "渡口・帳房", savedAt: new Date(), playTimeSeconds: 4500 } : slot)))
          }
          onDelete={(n) => setSlots((s) => s.map((slot, i) => (i === n - 1 ? undefined : slot)))}
        />
      )}
    </div>
  );
}
