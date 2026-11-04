"use client";

import { useState } from "react";

import { CardFlowLoader } from "./cardflow-loader";

const tints = ["#b6e3f4", "#c0aede", "#d1d4f9"];

export default function CardFlowLoaderDemo() {
  const [ready, setReady] = useState(false);

  return (
    <div className="relative h-[420px] w-full min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
      {ready && (
        // 載入完成後的畫布：點點背景與頭像
        <div
          className="grid h-full grid-cols-4 place-items-center gap-4 p-6 sm:grid-cols-6"
          style={{ backgroundColor: "#fafafa", backgroundImage: "radial-gradient(circle, #d1d5db 1px, transparent 1px)", backgroundSize: "20px 20px" }}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} aria-hidden="true" className="size-14 rounded-full border-2 border-gray-200 shadow-md" style={{ backgroundColor: tints[i % tints.length] }} />
          ))}
        </div>
      )}
      <CardFlowLoader onComplete={() => setReady(true)} />
    </div>
  );
}
