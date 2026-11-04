"use client";

import { useRef } from "react";

import { useCanvasZoom, ZoomControls } from "./zoom-controls";

const cards = [
  { id: "brief", title: "Campaign brief", body: "Spring drop, three hero looks, launch on the 14th.", x: 24, y: 28, w: 150, h: 104 },
  { id: "shots", title: "Shot list", body: "Flat lay, on model, detail macro.", x: 190, y: 120, w: 150, h: 92 },
];

export default function ZoomControlsDemo() {
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
      <ZoomControls fixed={false} scale={scale} onZoomIn={zoomIn} onZoomOut={zoomOut} />
    </div>
  );
}
