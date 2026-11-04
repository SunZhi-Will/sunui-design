"use client";

import { useRef, useState, type PointerEvent } from "react";

import { AnimationEditor, getCanvasStyle, type AnimationElement, type AnimationKeyframe, type CanvasSnapshot } from "./animation-editor";
import { AnimationPreview } from "./animation-preview";

type CardData = { kind: "note" | "tag"; title: string; body?: string };

const note = (x: number, y: number, w: number, h: number): AnimationElement<CardData> => ({
  id: "note",
  type: "text",
  position: { x, y },
  size: { width: w, height: h },
  zIndex: 1,
  data: { kind: "note", title: "Q3 launch plan", body: "Beta invites, pricing page, onboarding emails" },
});

const tag = (x: number, y: number): AnimationElement<CardData> => ({
  id: "tag",
  type: "text",
  position: { x, y },
  size: { width: 160, height: 36 },
  zIndex: 2,
  data: { kind: "tag", title: "Ships Nov 20" },
});

const initialKeyframes: AnimationKeyframe<CardData>[] = [
  { id: "kf-1", name: "Keyframe 1", timestamp: 0, elements: [note(24, 40, 150, 96)], offset: { x: 0, y: 0 }, scale: 1 },
  { id: "kf-2", name: "Keyframe 2", timestamp: 1, elements: [note(96, 64, 180, 116)], offset: { x: 0, y: 0 }, scale: 1 },
  {
    id: "kf-3",
    name: "Keyframe 3",
    timestamp: 2,
    elements: [note(96, 40, 180, 116), tag(106, 170)],
    offset: { x: 16, y: 8 },
    scale: 0.9,
  },
];

function CardContent({ data }: { data?: CardData }) {
  if (!data) return null;
  if (data.kind === "tag") {
    return (
      <div className="flex h-full items-center gap-2 px-3 text-xs font-medium text-gray-700">
        <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
        <span className="truncate">{data.title}</span>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col gap-1.5 p-3">
      <p className="truncate text-sm font-semibold text-gray-800">{data.title}</p>
      <p className="line-clamp-2 text-xs leading-snug text-gray-500">{data.body}</p>
      <div className="mt-auto flex gap-1">
        <span className="h-1.5 w-8 rounded-full bg-blue-200" />
        <span className="h-1.5 w-5 rounded-full bg-gray-200" />
      </div>
    </div>
  );
}

export default function AnimationEditorDemo() {
  const [keyframes, setKeyframes] = useState(initialKeyframes);
  const [selectedId, setSelectedId] = useState<string | null>("kf-1");
  const [canvas, setCanvas] = useState<CanvasSnapshot<CardData>>({
    elements: initialKeyframes[0].elements,
    offset: initialKeyframes[0].offset,
    scale: initialKeyframes[0].scale,
  });
  const [previewRun, setPreviewRun] = useState(0);
  const drag = useRef<{ id: string; x: number; y: number } | null>(null);

  // 畫布上拖動卡片，之後可按勾勾存回關鍵影格
  const onPointerDown = (e: PointerEvent<HTMLDivElement>, id: string) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id, x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.x) / canvas.scale;
    const dy = (e.clientY - d.y) / canvas.scale;
    drag.current = { ...d, x: e.clientX, y: e.clientY };
    setCanvas((c) => ({
      ...c,
      elements: c.elements.map((el) =>
        el.id === d.id ? { ...el, position: { x: el.position.x + dx, y: el.position.y + dy } } : el,
      ),
    }));
  };

  return (
    <div className="grid w-full max-w-5xl grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
        <div
          className="relative h-64 overflow-hidden"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px)",
            backgroundSize: `${20 * canvas.scale}px ${20 * canvas.scale}px`,
            backgroundPosition: `${canvas.offset.x}px ${canvas.offset.y}px`,
          }}
        >
          <div className="absolute inset-0" style={getCanvasStyle(canvas)}>
            {canvas.elements.map((el) => (
              <div
                key={el.id}
                className="absolute cursor-move touch-none select-none"
                style={{ left: el.position.x, top: el.position.y, width: el.size.width, height: el.size.height, zIndex: el.zIndex }}
                onPointerDown={(e) => onPointerDown(e, el.id)}
                onPointerMove={onPointerMove}
                onPointerUp={() => (drag.current = null)}
              >
                <div className="relative h-full w-full overflow-hidden rounded-lg bg-white shadow-lg">
                  <CardContent data={el.data} />
                </div>
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
          selectedKeyframeId={selectedId}
          onSelectedKeyframeIdChange={setSelectedId}
          onPreview={() => setPreviewRun((n) => n + 1)}
        />
      </div>

      <div className="relative h-[22rem] min-w-0 overflow-hidden rounded-xl border border-gray-200 lg:h-auto lg:min-h-[22rem]">
        <AnimationPreview
          key={previewRun}
          fixed={false}
          keyframes={keyframes}
          renderElement={(el) => <CardContent data={el.data} />}
        />
      </div>
    </div>
  );
}
