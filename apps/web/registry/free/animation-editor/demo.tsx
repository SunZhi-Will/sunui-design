"use client";

import { useState } from "react";

import { AnimationEditor, getCanvasStyle, type AnimationElement, type AnimationKeyframe, type CanvasSnapshot } from "./animation-editor";

const note = (x: number, y: number, w: number, h: number): AnimationElement<string> => ({
  id: "note",
  type: "text",
  position: { x, y },
  size: { width: w, height: h },
  zIndex: 1,
  data: "Q3 launch plan",
});

const initial: AnimationKeyframe<string>[] = [
  { id: "kf-1", name: "Keyframe 1", timestamp: 0, elements: [note(24, 40, 150, 96)], offset: { x: 0, y: 0 }, scale: 1 },
  { id: "kf-2", name: "Keyframe 2", timestamp: 1, elements: [note(110, 64, 180, 116)], offset: { x: 0, y: 0 }, scale: 1 },
];

export default function AnimationEditorDemo() {
  const [keyframes, setKeyframes] = useState(initial);
  const [canvas, setCanvas] = useState<CanvasSnapshot<string>>(initial[0]);

  return (
    <div className="flex w-full max-w-xl min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
      {/* 畫布顯示目前套用的關鍵影格 */}
      <div
        className="relative h-56 overflow-hidden"
        style={{ backgroundImage: "radial-gradient(circle, #d1d5db 1px, transparent 1px)", backgroundSize: "20px 20px" }}
      >
        <div className="absolute inset-0" style={getCanvasStyle(canvas)}>
          {canvas.elements.map((el) => (
            <div
              key={el.id}
              className="absolute rounded-lg bg-white p-3 text-sm font-semibold text-gray-800 shadow-lg transition-all duration-300 motion-reduce:transition-none"
              style={{ left: el.position.x, top: el.position.y, width: el.size.width, height: el.size.height }}
            >
              {el.data}
            </div>
          ))}
        </div>
      </div>
      <AnimationEditor
        fixed={false}
        shortcutScope="panel"
        value={keyframes}
        onChange={setKeyframes}
        snapshot={canvas}
        onApplyKeyframe={setCanvas}
        defaultSelectedKeyframeId="kf-1"
      />
    </div>
  );
}
