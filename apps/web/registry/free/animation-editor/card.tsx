"use client";

import { useState } from "react";

import { AnimationEditor, type AnimationElement, type AnimationKeyframe, type CanvasSnapshot } from "./animation-editor";

const note = (x: number, y: number, w: number, h: number): AnimationElement<string> => ({
  id: "note",
  type: "text",
  position: { x, y },
  size: { width: w, height: h },
  zIndex: 1,
  data: "Q3 plan",
});

const initial: AnimationKeyframe<string>[] = [
  { id: "kf-1", name: "Keyframe 1", timestamp: 0, elements: [note(16, 14, 80, 44)], offset: { x: 0, y: 0 }, scale: 1 },
  { id: "kf-2", name: "Keyframe 2", timestamp: 1, elements: [note(170, 22, 100, 52)], offset: { x: 0, y: 0 }, scale: 1 },
];

/** 型錄卡片：只放時間軸，點選、拖動或新增關鍵影格。 */
export default function AnimationEditorCard() {
  const [keyframes, setKeyframes] = useState(initial);
  const [canvas, setCanvas] = useState<CanvasSnapshot<string>>(initial[0]);

  return (
    <div className="mx-auto flex w-[300px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
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
