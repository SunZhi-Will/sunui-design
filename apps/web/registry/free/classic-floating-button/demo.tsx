"use client";

import { useRef, useState } from "react";

import { FloatingButton, type SocialButtonConfig } from "./classic-floating-button";

// 原版 Storybook 的社群按鈕配色
const socialButtons: SocialButtonConfig[] = [
  { type: "github", href: "https://github.com", className: "bg-gradient-to-r from-gray-600 to-gray-800 hover:shadow-gray-500/50" },
  { type: "twitter", href: "https://twitter.com", className: "bg-gradient-to-r from-blue-400 to-blue-600 hover:shadow-blue-500/50" },
  { type: "facebook", href: "https://facebook.com", className: "bg-gradient-to-r from-blue-600 to-blue-800 hover:shadow-blue-500/50" },
  { type: "linkedin", href: "https://linkedin.com", className: "bg-gradient-to-r from-blue-700 to-blue-900 hover:shadow-blue-600/50" },
  { type: "instagram", href: "https://instagram.com", className: "bg-gradient-to-r from-pink-500 to-purple-600 hover:shadow-purple-500/50" },
];

const names = { github: "GitHub", twitter: "Twitter", facebook: "Facebook", linkedin: "LinkedIn", instagram: "Instagram" };

export default function ClassicFloatingButtonDemo() {
  const dragArea = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
      <div ref={dragArea} className="relative isolate h-[380px] min-w-0 overflow-hidden rounded-xl bg-gray-50 text-gray-800">
        <div className="p-5">
          <p className="text-xs font-medium tracking-wide text-gray-400 uppercase">Portfolio</p>
          <h3 className="mt-1 text-lg font-semibold text-gray-900">Mira Chen</h3>
          <p className="mt-1 text-sm text-gray-500">Product designer. Drag the button anywhere in this card; it remembers where you left it.</p>
          <p className="mt-3 text-xs text-gray-400 tabular-nums">
            x={Math.round(pos.x)}, y={Math.round(pos.y)}
          </p>
        </div>
        <FloatingButton
          fixed={false}
          buttons={socialButtons.slice(0, 3)}
          position="bottom-right"
          variant="petal"
          draggable
          dragConstraints={dragArea}
          defaultPosition={pos}
          onPositionChange={(x, y) => setPos({ x, y })}
        />
      </div>

      <div className="relative isolate h-[380px] min-w-0 overflow-hidden rounded-xl bg-gray-900 text-gray-300">
        <div className="p-5 pl-24">
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">Blog</p>
          <h3 className="mt-1 text-lg font-semibold text-white">Shipping a design system</h3>
          <p className="mt-1 text-sm text-gray-400">Share links stack straight down from the corner button.</p>
        </div>
        <FloatingButton
          fixed={false}
          buttons={socialButtons.map((b) => ({ ...b, title: `Share on ${names[b.type!]}`, titleDisplay: "hover" as const, titlePosition: "right" as const }))}
          position="top-left"
          variant="vertical"
          labels={{ open: "Open share links", close: "Close share links", menu: "Share links" }}
        />
      </div>
    </div>
  );
}
