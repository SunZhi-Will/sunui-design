"use client";

import { useRef, useState } from "react";

import { FloatingButton, type SocialButtonConfig } from "./classic-floating-button";

// 原版 Storybook 的社群按鈕配色
const socialButtons: SocialButtonConfig[] = [
  { type: "github", href: "https://github.com", className: "bg-gradient-to-r from-gray-600 to-gray-800 hover:shadow-gray-500/50" },
  { type: "twitter", href: "https://twitter.com", className: "bg-gradient-to-r from-blue-400 to-blue-600 hover:shadow-blue-500/50" },
  { type: "linkedin", href: "https://linkedin.com", className: "bg-gradient-to-r from-blue-700 to-blue-900 hover:shadow-blue-600/50" },
];

export default function ClassicFloatingButtonDemo() {
  const dragArea = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  return (
    <div ref={dragArea} className="relative isolate h-[380px] w-full max-w-md min-w-0 overflow-hidden rounded-xl bg-gray-50 text-gray-800">
      <div className="p-5">
        <p className="text-xs font-medium tracking-wide text-gray-400 uppercase">Portfolio</p>
        <h3 className="mt-1 text-lg font-semibold text-gray-900">Mira Chen</h3>
        <p className="mt-1 text-sm text-gray-500">Product designer based in Taipei. Say hi on any of the links below.</p>
      </div>
      <FloatingButton
        fixed={false}
        buttons={socialButtons}
        position="bottom-right"
        variant="petal"
        draggable
        dragConstraints={dragArea}
        defaultPosition={pos}
        onPositionChange={(x, y) => setPos({ x, y })}
      />
    </div>
  );
}
