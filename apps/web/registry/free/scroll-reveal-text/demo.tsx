"use client";

import { useRef } from "react";

import { ScrollRevealText } from "./scroll-reveal-text";

export default function ScrollRevealTextDemo() {
  const scroller = useRef<HTMLDivElement>(null);

  return (
    <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
      <div ref={scroller} className="h-[440px] overflow-y-auto px-6 sm:px-10">
        <div className="flex h-[300px] items-end justify-center pb-8">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            Scroll inside this panel
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M6 13l6 6 6-6" />
            </svg>
          </p>
        </div>

        <ScrollRevealText
          container={scroller}
          text="Good interfaces do not shout. They reveal what matters at the exact moment you are ready to read it, one word at a time."
          accentWords={["reveal", "ready"]}
        />

        <div className="h-40" />

        <ScrollRevealText
          container={scroller}
          lang="zh-Hant"
          text="好的介面不需要大聲說話。它在你準備好的那一刻，才把重要的內容一個字一個字地點亮，連 React 與 CJK 混排也一樣自然。"
          accentWords={["點", "亮"]}
          accentClassName="text-amber-600 dark:text-amber-400"
          className="tracking-wide"
        />

        <div className="h-[320px]" />
      </div>
    </div>
  );
}
