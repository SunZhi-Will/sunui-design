"use client";

import { useEffect, useState } from "react";

import { PauseMenu } from "./pause-menu";
import { SaveLoadPanel, saveSlotOneLineLabel, type SaveSlot } from "./save-load-panel";

// 探索畫面：右上 HUD 的選單鍵或 Esc 開關暫停選單；離開前要兩段確認，並可先去存檔
const autosave: SaveSlot = { id: "auto", chapter: "第二章・寒水渡", scene: "渡口・帳房", savedAt: "2026-11-05T21:14:03", playTimeSeconds: 4320 };

export default function PauseMenuDemo() {
  const [open, setOpen] = useState(true);
  const [panel, setPanel] = useState<"save" | "load" | null>(null);
  const [slots, setSlots] = useState<(SaveSlot | undefined)[]>([
    { id: "m1", chapter: "第一章・青石鎮", scene: "鎮口・老槐樹下", savedAt: "2026-11-04T22:40:12", playTimeSeconds: 2460 },
    undefined,
    undefined,
  ]);
  const [left, setLeft] = useState(false);

  // 同一個鍵開關暫停；選單開著時由選單自己處理 Esc
  useEffect(() => {
    if (open || panel || left) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, panel, left]);

  return (
    <div
      className="relative h-[30rem] w-full max-w-3xl min-w-0 overflow-hidden rounded-[4px]"
      style={{
        color: "#eae4d6",
        fontFamily: '"Noto Serif TC", "Songti TC", serif',
        background: "radial-gradient(ellipse at 25% 30%, rgb(231 196 137 / 0.16), transparent 40%), linear-gradient(180deg, #1a1d24, #08090c)",
      }}
    >
      {left ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-2xl tracking-[0.5em]" style={{ color: "#e7c489" }}>
            寒水渡
          </p>
          <button
            type="button"
            onClick={() => setLeft(false)}
            className="border-b px-5 py-2 tracking-[0.18em] outline-none hover:text-[#e7c489] focus-visible:text-[#e7c489]"
            style={{ borderColor: "rgb(201 160 99 / 0.22)" }}
          >
            讀取自動存檔
          </button>
        </div>
      ) : (
        <>
          <p className="absolute top-4 left-5 text-xs tracking-[0.25em]" style={{ color: "#b3aa97" }}>
            寒水渡・帳房
          </p>
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
        </>
      )}

      <PauseMenu
        open={open && !left}
        onResume={() => setOpen(false)}
        onOpenJournal={() => setOpen(false)}
        onOpenSave={() => {
          setOpen(false);
          setPanel("save");
        }}
        onOpenLoad={() => {
          setOpen(false);
          setPanel("load");
        }}
        onOpenSettings={() => setOpen(false)}
        onExitToMenu={() => {
          setOpen(false);
          setLeft(true);
        }}
        objective="查出帳簿那半頁是誰撕走的"
        lastAutosave={saveSlotOneLineLabel(autosave)}
        saveError="儲存空間已滿，無法寫入自動存檔。原有存檔未被覆蓋。"
      />

      {panel && (
        <SaveLoadPanel
          mode={panel}
          autosave={autosave}
          manualSlots={slots}
          onClose={() => {
            setPanel(null);
            setOpen(true);
          }}
          onSave={(n) =>
            setSlots((s) => s.map((slot, i) => (i === n - 1 ? { id: `m${n}-${Date.now()}`, chapter: "第二章・寒水渡", scene: "渡口・帳房", savedAt: new Date(), playTimeSeconds: 4500 } : slot)))
          }
          onLoad={() => {
            setPanel(null);
          }}
          onDelete={(n) => setSlots((s) => s.map((slot, i) => (i === n - 1 ? undefined : slot)))}
        />
      )}
    </div>
  );
}
