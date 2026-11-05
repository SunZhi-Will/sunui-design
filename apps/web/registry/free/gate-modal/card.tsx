"use client";

import { useState } from "react";

import { ContentGateModal } from "./gate-modal";

/** 型錄卡片：一顆上鎖課程的按鈕，點了在卡片內跳出權限檢查彈窗（可捲動）。 */
export default function GateModalCard() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative mx-auto flex h-56 w-72 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e0e] p-4 text-white/90">
      <p className="text-[11px] font-bold tracking-[0.2em] text-[#da7756] uppercase">Lesson 3 of 12</p>
      <div className="mt-3 flex min-w-0 flex-1 items-center justify-center rounded-xl bg-white/[0.04]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-xl bg-[#da7756] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Watch lesson 3
        </button>
      </div>
      <ContentGateModal
        title="Claude, Not Just Chat"
        subtitle="Hands-on workshop"
        open={open}
        onClose={() => setOpen(false)}
        fixed={false}
        signInHref="#"
        contactHref="#"
      />
    </div>
  );
}
