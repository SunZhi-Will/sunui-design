"use client";

import { useRef } from "react";

import { useDemoLocale } from "@/lib/demo-locale";

import { FloatingButton, type SocialButtonConfig } from "./classic-floating-button";

// 與 demo 相同的社群按鈕，沿用元件的中性預設樣式
const socialButtons: SocialButtonConfig[] = [
  { type: "github", href: "https://github.com" },
  { type: "twitter", href: "https://twitter.com" },
  { type: "linkedin", href: "https://linkedin.com" },
];

/** 型錄卡片：一顆可拖曳的浮動按鈕，點開後社群按鈕以花瓣狀展開。 */
export default function ClassicFloatingButtonCard() {
  const locale = useDemoLocale();
  const dragArea = useRef<HTMLDivElement>(null);

  return (
    <div ref={dragArea} className="relative isolate mx-auto h-56 w-72 overflow-hidden rounded-xl border border-border bg-muted/40">
      <FloatingButton
        fixed={false}
        locale={locale}
        buttons={socialButtons}
        position="bottom-right"
        variant="petal"
        draggable
        dragConstraints={dragArea}
      />
    </div>
  );
}
