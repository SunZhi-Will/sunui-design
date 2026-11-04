"use client";

import { StatusBadge } from "./work-badge";

export default function WorkBadgeDemo() {
  return (
    <article className="w-full max-w-md rounded-xl border border-[rgba(212,175,55,0.14)] bg-[#08080a] p-5 text-[#f7f5f0]">
      <header className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[0.6875rem] tracking-[0.04em] text-[#a8a296]">Reading tool, 2026</p>
          <h3 className="truncate text-lg font-medium">Lumen Reader</h3>
        </div>
        <StatusBadge status="public-beta" help="Open to everyone, features may still change" />
      </header>
    </article>
  );
}
