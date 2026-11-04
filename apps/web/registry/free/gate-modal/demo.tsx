"use client";

import { useState } from "react";

import { ContentGateModal } from "./gate-modal";

export default function GateModalDemo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex min-h-[42rem] w-full max-w-xl min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e0e] p-5 text-white/90">
      <p className="text-[12px] font-bold tracking-[0.2em] text-[#da7756] uppercase">
        Lesson 3 of 12
      </p>
      <p className="mt-2 text-lg font-bold">
        Writing prompts that name the format
      </p>
      <div className="mt-4 flex aspect-video min-w-0 items-center justify-center rounded-xl bg-white/[0.04]">
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
