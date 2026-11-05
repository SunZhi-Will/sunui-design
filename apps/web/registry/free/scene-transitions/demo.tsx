"use client";

import { useDemoText } from "@/lib/demo-locale";

import { SceneSlideshow, sceneTransitions, type SceneDirection, type SceneTransitionName } from "./scene-transitions";

const copy = {
  en: { day: "Day", night: "Night", dusk: "Dusk", next: "Next scene", previous: "Previous scene", hint: "Plays while in view. Use the arrows to step." },
  "zh-TW": { day: "白天", night: "夜晚", dusk: "黃昏", next: "下一個畫面", previous: "上一個畫面", hint: "進入畫面時自動播放，也可以用箭頭切換。" },
  "zh-CN": { day: "白天", night: "夜晚", dusk: "黄昏", next: "下一个画面", previous: "上一个画面", hint: "进入画面时自动播放，也可以用箭头切换。" },
  ja: { day: "昼", night: "夜", dusk: "夕暮れ", next: "次のシーン", previous: "前のシーン", hint: "画面に入ると再生します。矢印でも切り替えられます。" },
};

// 三個示範畫面：白天、夜晚、黃昏（純 SVG，不讀外部圖片）
function Day({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" className="block size-full" role="img" aria-label={label}>
      <rect width="320" height="180" fill="#bfe3f5" />
      <circle cx="70" cy="58" r="22" fill="#ffd166" />
      <path d="M0 130 L70 80 L130 120 L200 70 L320 125 V180 H0Z" fill="#7fb77e" />
      <path d="M0 150 L90 118 L180 148 L260 120 L320 140 V180 H0Z" fill="#4f8a5b" />
      <text x="16" y="168" fontSize="12" fontWeight="700" fill="#1f3b2b">{label}</text>
    </svg>
  );
}

function Night({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" className="block size-full" role="img" aria-label={label}>
      <rect width="320" height="180" fill="#1d2647" />
      <circle cx="250" cy="52" r="18" fill="#f1f0e8" />
      <circle cx="258" cy="46" r="16" fill="#1d2647" />
      {[30, 80, 120, 180, 210, 290].map((x, i) => (
        <circle key={x} cx={x} cy={20 + ((i * 23) % 50)} r="1.4" fill="#f1f0e8" />
      ))}
      <path d="M0 140 L60 100 L120 132 L190 96 L320 138 V180 H0Z" fill="#2c3a63" />
      <g fill="#ffd166">
        <rect x="200" y="120" width="40" height="44" fill="#141a33" />
        <rect x="208" y="128" width="8" height="8" />
        <rect x="224" y="140" width="8" height="8" />
      </g>
      <text x="16" y="168" fontSize="12" fontWeight="700" fill="#f1f0e8">{label}</text>
    </svg>
  );
}

function Dusk({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" className="block size-full" role="img" aria-label={label}>
      <rect width="320" height="180" fill="#f4a261" />
      <rect y="90" width="320" height="90" fill="#e76f51" />
      <circle cx="160" cy="100" r="30" fill="#ffe8a3" />
      <rect y="112" width="320" height="68" fill="#264653" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={120 + i * 6} y={122 + i * 9} width={80 - i * 12} height="2" fill="#ffe8a3" opacity={0.7 - i * 0.15} />
      ))}
      <text x="16" y="168" fontSize="12" fontWeight="700" fill="#ffe8a3">{label}</text>
    </svg>
  );
}

const options: Partial<Record<SceneTransitionName, { direction?: SceneDirection; origin?: { x: number; y: number }; colors?: string[] }>> = {
  wipe: { direction: "right" },
  blinds: { direction: "left" },
  "circle-reveal": { origin: { x: 22, y: 32 } },
  "star-reveal": { origin: { x: 78, y: 29 } },
  "zoom-through": { origin: { x: 50, y: 56 } },
  shatter: { origin: { x: 58, y: 45 } },
  bands: { colors: ["#e76f51", "#f4a261", "#2a9d8f", "#264653"] },
  liquid: { colors: ["#2a9d8f"] },
};

export default function SceneTransitionsDemo() {
  const t = useDemoText(copy);
  const scenes = [<Day key="d" label={t.day} />, <Night key="n" label={t.night} />, <Dusk key="k" label={t.dusk} />];
  return (
    <div className="w-full max-w-5xl p-4">
      <p className="mb-6 text-sm text-muted-foreground">{t.hint}</p>
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {sceneTransitions.map((name) => (
          <div key={name} className="flex flex-col gap-2">
            <span className="font-mono text-xs font-medium">{name}</span>
            <SceneSlideshow
              scenes={scenes}
              transition={name}
              interval={2600}
              controls
              labels={{ next: t.next, previous: t.previous }}
              className="aspect-video overflow-hidden rounded-md border"
              {...options[name]}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
