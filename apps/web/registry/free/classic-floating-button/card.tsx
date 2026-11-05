"use client";

import { useRef } from "react";

import { useDemoLocale } from "@/lib/demo-locale";

import { FloatingButton, type SocialButtonConfig } from "./classic-floating-button";

// 與 demo 相同的社群按鈕配色
const socialButtons: SocialButtonConfig[] = [
  { type: "github", href: "https://github.com", className: "bg-gradient-to-r from-gray-600 to-gray-800 hover:shadow-gray-500/50" },
  { type: "twitter", href: "https://twitter.com", className: "bg-gradient-to-r from-blue-400 to-blue-600 hover:shadow-blue-500/50" },
  { type: "linkedin", href: "https://linkedin.com", className: "bg-gradient-to-r from-blue-700 to-blue-900 hover:shadow-blue-600/50" },
];

/** 型錄卡片：一顆可拖曳的浮動按鈕，點開後社群按鈕以花瓣狀展開。 */
export default function ClassicFloatingButtonCard() {
  const locale = useDemoLocale();
  const dragArea = useRef<HTMLDivElement>(null);

  return (
    <div ref={dragArea} className="relative isolate mx-auto h-56 w-72 overflow-hidden rounded-xl bg-gray-50">
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
