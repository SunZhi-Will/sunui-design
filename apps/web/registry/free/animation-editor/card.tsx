"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { AnimationEditor, type AnimationElement, type AnimationKeyframe, type CanvasSnapshot } from "./animation-editor";

const copy = {
  en: { note: "Q3 plan", keyframe: "Keyframe" },
  "zh-TW": { note: "Q3 計畫", keyframe: "關鍵影格" },
  "zh-CN": { note: "Q3 计划", keyframe: "关键帧" },
  ja: { note: "Q3 計画", keyframe: "キーフレーム" },
};

const note = (data: string, x: number, y: number, w: number, h: number): AnimationElement<string> => ({
  id: "note",
  type: "text",
  position: { x, y },
  size: { width: w, height: h },
  zIndex: 1,
  data,
});

const makeInitial = (t: (typeof copy)["en"]): AnimationKeyframe<string>[] => [
  { id: "kf-1", name: `${t.keyframe} 1`, timestamp: 0, elements: [note(t.note, 16, 14, 80, 44)], offset: { x: 0, y: 0 }, scale: 1 },
  { id: "kf-2", name: `${t.keyframe} 2`, timestamp: 1, elements: [note(t.note, 170, 22, 100, 52)], offset: { x: 0, y: 0 }, scale: 1 },
];

/** 型錄卡片：只放時間軸，點選、拖動或新增關鍵影格。 */
export default function AnimationEditorCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [keyframes, setKeyframes] = useState(() => makeInitial(t));
  const [canvas, setCanvas] = useState<CanvasSnapshot<string>>(keyframes[0]);

  return (
    <div className="mx-auto flex w-[300px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
      <AnimationEditor
        fixed={false}
        locale={locale}
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
