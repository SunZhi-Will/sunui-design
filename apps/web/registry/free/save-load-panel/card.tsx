"use client";

import { useState } from "react";

import { SaveLoadPanel, type SaveSlot } from "./save-load-panel";

/** 型錄卡片：存檔面板，空欄直接寫入，有存檔的欄位要先在面板內確認覆蓋。 */
export default function SaveLoadPanelCard() {
  const [open, setOpen] = useState(true);
  const [slots, setSlots] = useState<(SaveSlot | undefined)[]>([
    { id: "m1", chapter: "第一章・青石鎮", scene: "鎮口・老槐樹下", savedAt: "2026-11-04T22:40:12", playTimeSeconds: 2460 },
    undefined,
  ]);

  return (
    <div className="relative mx-auto h-[220px] w-72 overflow-hidden rounded-[4px] bg-[#08090c] text-[#eae4d6]">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="absolute top-3 left-4 border-b border-[rgb(201_160_99/0.22)] px-1 py-1.5 text-sm tracking-[0.18em] outline-none hover:text-[#e7c489] focus-visible:text-[#e7c489]"
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
