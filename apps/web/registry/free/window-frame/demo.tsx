"use client";

import { Stage, WindowFrame } from "./window-frame";

function DocIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

export default function WindowFrameDemo() {
  return (
    <Stage className="w-full max-w-xl p-4 sm:p-6">
      <WindowFrame
        title="prompt-v2.md"
        icon={<DocIcon />}
        tone="success"
        right={
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
            clear
          </span>
        }
      >
        <div className="space-y-2 p-4 font-mono text-[13px] leading-relaxed">
          <p>
            Summarise last week&apos;s orders as 3 bullets: total, top product,
            refunds.
          </p>
          <p className="text-[var(--wf-fg-muted)]">
            &gt; 412 orders, $18.2k. Top: Stoneware Mug. 6 refunds.
          </p>
        </div>
      </WindowFrame>
    </Stage>
  );
}
