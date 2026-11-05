"use client";

import { useRef } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { useCanvasZoom, ZoomControls } from "./zoom-controls";

const layout = [
  { id: "brief", x: 24, y: 28, w: 150, h: 104 },
  { id: "shots", x: 190, y: 120, w: 150, h: 92 },
] as const;

const copy = {
  en: {
    brief: { title: "Campaign brief", body: "Spring drop, three hero looks, launch on the 14th." },
    shots: { title: "Shot list", body: "Flat lay, on model, detail macro." },
  },
  "zh-TW": {
    brief: { title: "活動企劃", body: "春季新品，三套主打造型，14 日上線。" },
    shots: { title: "拍攝清單", body: "平拍、模特兒上身、細節微距。" },
  },
  "zh-CN": {
    brief: { title: "活动策划", body: "春季上新，三套主打造型，14 日上线。" },
    shots: { title: "拍摄清单", body: "平铺拍摄、模特上身、细节微距。" },
  },
  ja: {
    brief: { title: "キャンペーン概要", body: "春の新作、主役ルック 3 点、14 日に公開。" },
    shots: { title: "撮影リスト", body: "平置き、モデル着用、ディテールのマクロ。" },
  },
};

export default function ZoomControlsDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const cards = layout.map((c) => ({ ...c, ...t[c.id] }));
  const canvasRef = useRef<HTMLDivElement>(null);
  const { scale, offset, zoomIn, zoomOut } = useCanvasZoom(canvasRef);

  return (
    <div
      ref={canvasRef}
      className="relative h-[320px] w-full max-w-xl min-w-0 touch-none overflow-hidden rounded-xl border border-gray-200 bg-gray-50 select-none"
      style={{
        backgroundImage: "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
        backgroundSize: `${20 * scale}px ${20 * scale}px`,
        backgroundPosition: `${offset.x}px ${offset.y}px`,
      }}
    >
      <div className="absolute inset-0" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: "0 0" }}>
        {cards.map((c) => (
          <div key={c.id} className="absolute rounded-lg bg-white p-3 shadow-lg" style={{ left: c.x, top: c.y, width: c.w, height: c.h }}>
            <p className="text-xs font-semibold text-gray-800">{c.title}</p>
            <p className="mt-1 text-[11px] leading-snug text-gray-600">{c.body}</p>
          </div>
        ))}
      </div>
      <ZoomControls fixed={false} locale={locale} scale={scale} onZoomIn={zoomIn} onZoomOut={zoomOut} />
    </div>
  );
}
