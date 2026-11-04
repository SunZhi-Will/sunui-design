"use client";

import { ContentGate } from "./content-gate";

export default function ContentGateDemo() {
  return (
    <div className="w-full max-w-xl min-w-0 overflow-hidden rounded-2xl border border-black/[0.06] dark:border-white/10">
      {/* 課程頁頂部：已登入但這個帳號沒有購買 */}
      <div className="flex min-w-0 items-center justify-between gap-3 border-b border-black/[0.06] px-4 py-3 text-sm dark:border-white/10">
        <span className="min-w-0 truncate font-semibold">
          Claude, Not Just Chat
        </span>
        <span className="shrink-0 text-xs opacity-60">12 lessons</span>
      </div>
      <ContentGate
        title="Claude, Not Just Chat"
        subtitle="Hands-on workshop"
        state="no-access"
        signInHref="#"
        contactHref="#"
      />
    </div>
  );
}
