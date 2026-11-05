"use client";

import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef, useState, type ReactNode } from "react";

import { useDemoText } from "@/lib/demo-locale";

import {
  CameraLayer,
  CameraStage,
  cameraMoves,
  useCameraStage,
  type CameraMove,
  type CameraTrigger,
} from "./camera-moves";

type Names = Record<CameraMove, string>;

const copy: Record<"en" | "zh-TW" | "zh-CN" | "ja", {
  loop: string;
  click: string;
  hover: string;
  entrance: string;
  scroll: string;
  replay: string;
  scrollName: string;
  scene: string;
  names: Names;
}> = {
  en: {
    loop: "Loop",
    click: "Click",
    hover: "Hover",
    entrance: "Entrance",
    scroll: "Scroll",
    replay: "Replay",
    scrollName: "Dolly zoom on scroll",
    scene: "A city street with a person, mountains behind and a flower in front",
    names: {
      pan: "Pan",
      tilt: "Tilt",
      "dolly-in": "Dolly in",
      "zoom-in": "Zoom in",
      tracking: "Tracking shot",
      orbit: "Orbit",
      "crane-up": "Crane up",
      "dolly-zoom": "Dolly zoom",
      "rack-focus": "Rack focus",
      handheld: "Handheld",
      fpv: "FPV drone",
      "dutch-angle": "Dutch angle",
      pedestal: "Pedestal",
      "barrel-roll": "Barrel roll",
      steadicam: "Steadicam",
      "fly-through": "Fly-through",
      "low-angle": "Low angle",
      "high-angle": "High angle",
      establishing: "Establishing shot",
      "extreme-close-up": "Extreme close-up",
      "bullet-time": "Bullet time",
    },
  },
  "zh-TW": {
    loop: "循環",
    click: "點擊",
    hover: "滑過",
    entrance: "進場",
    scroll: "捲動",
    replay: "重播",
    scrollName: "隨捲動的滑動變焦",
    scene: "城市街道上的人，後方是山，前景有一朵花",
    names: {
      pan: "水平搖鏡",
      tilt: "垂直搖鏡",
      "dolly-in": "推軌前進",
      "zoom-in": "變焦拉近",
      tracking: "跟拍橫移",
      orbit: "環繞",
      "crane-up": "升降鏡頭",
      "dolly-zoom": "滑動變焦",
      "rack-focus": "移焦",
      handheld: "手持",
      fpv: "穿越機",
      "dutch-angle": "傾斜鏡頭",
      pedestal: "垂直升降",
      "barrel-roll": "桶滾",
      steadicam: "穩定器",
      "fly-through": "穿越",
      "low-angle": "仰角",
      "high-angle": "俯角",
      establishing: "建立鏡頭",
      "extreme-close-up": "大特寫",
      "bullet-time": "子彈時間",
    },
  },
  "zh-CN": {
    loop: "循环",
    click: "点击",
    hover: "悬停",
    entrance: "进场",
    scroll: "滚动",
    replay: "重播",
    scrollName: "随滚动的滑动变焦",
    scene: "城市街道上的人，后方是山，前景有一朵花",
    names: {
      pan: "水平摇镜",
      tilt: "垂直摇镜",
      "dolly-in": "推轨前进",
      "zoom-in": "变焦拉近",
      tracking: "跟拍横移",
      orbit: "环绕",
      "crane-up": "升降镜头",
      "dolly-zoom": "滑动变焦",
      "rack-focus": "移焦",
      handheld: "手持",
      fpv: "穿越机",
      "dutch-angle": "倾斜镜头",
      pedestal: "垂直升降",
      "barrel-roll": "桶滚",
      steadicam: "稳定器",
      "fly-through": "穿越",
      "low-angle": "仰角",
      "high-angle": "俯角",
      establishing: "建立镜头",
      "extreme-close-up": "大特写",
      "bullet-time": "子弹时间",
    },
  },
  ja: {
    loop: "ループ",
    click: "クリック",
    hover: "ホバー",
    entrance: "登場",
    scroll: "スクロール",
    replay: "再生",
    scrollName: "スクロールでドリーズーム",
    scene: "街の通りに立つ人、奥に山、手前に花",
    names: {
      pan: "パン",
      tilt: "ティルト",
      "dolly-in": "ドリーイン",
      "zoom-in": "ズームイン",
      tracking: "トラッキング",
      orbit: "オービット",
      "crane-up": "クレーンアップ",
      "dolly-zoom": "ドリーズーム",
      "rack-focus": "ラックフォーカス",
      handheld: "手持ち",
      fpv: "FPV ドローン",
      "dutch-angle": "ダッチアングル",
      pedestal: "ペデスタル",
      "barrel-roll": "バレルロール",
      steadicam: "ステディカム",
      "fly-through": "フライスルー",
      "low-angle": "ローアングル",
      "high-angle": "ハイアングル",
      establishing: "エスタブリッシュ",
      "extreme-close-up": "超クローズアップ",
      "bullet-time": "バレットタイム",
    },
  },
};

type Kind = "loop" | "click" | "hover" | "entrance";
const kinds: Partial<Record<CameraMove, Kind>> = {
  "rack-focus": "click",
  "extreme-close-up": "hover",
  "fly-through": "entrance",
  establishing: "entrance",
  "zoom-in": "hover",
};
const triggerOf: Record<Kind, CameraTrigger> = { loop: "loop", click: "click", hover: "hover", entrance: "inView" };

// 所有圖層共用同一個 viewBox，用 slice 對齊；顏色只用主題 token，亮暗模式都看得清楚
const VB = "0 0 160 90";
const svgProps = {
  viewBox: VB,
  preserveAspectRatio: "xMidYMid slice",
  className: "absolute inset-0 size-full",
  "aria-hidden": true,
} as const;

function Sky() {
  return (
    <svg {...svgProps}>
      <defs>
        <linearGradient id="cm-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--muted)" />
          <stop offset="1" stopColor="var(--background)" />
        </linearGradient>
      </defs>
      <rect x="-40" y="-40" width="240" height="170" fill="url(#cm-sky)" />
      <circle cx="118" cy="24" r="9" fill="var(--ring)" opacity="0.55" />
      <circle cx="118" cy="24" r="15" fill="var(--ring)" opacity="0.12" />
      <g fill="var(--muted-foreground)" opacity="0.18">
        <ellipse cx="40" cy="20" rx="14" ry="3.5" />
        <ellipse cx="50" cy="17" rx="8" ry="3" />
        <ellipse cx="140" cy="38" rx="11" ry="2.6" />
      </g>
    </svg>
  );
}

function Mountains() {
  return (
    <svg {...svgProps}>
      <path d="M-30 66 L10 38 L32 52 L58 30 L86 54 L112 34 L140 50 L190 40 V120 H-30Z" fill="var(--muted-foreground)" opacity="0.28" />
    </svg>
  );
}

function City() {
  const blocks = [
    [8, 44, 14],
    [24, 36, 11],
    [37, 48, 16],
    [104, 40, 12],
    [118, 30, 13],
    [133, 46, 15],
  ];
  return (
    <svg {...svgProps}>
      <g fill="var(--foreground)" opacity="0.32">
        {blocks.map(([x, y, w]) => (
          <rect key={x} x={x} y={y} width={w} height={66 - y} />
        ))}
      </g>
      <g fill="var(--background)" opacity="0.7">
        {blocks.flatMap(([x, y, w]) =>
          [0, 1, 2].map((r) => <rect key={`${x}-${r}`} x={x + 3} y={y + 4 + r * 7} width={w - 6} height={2} />),
        )}
      </g>
      <rect x="-40" y="66" width="240" height="60" fill="var(--muted-foreground)" opacity="0.22" />
      <g stroke="var(--muted-foreground)" strokeOpacity="0.3" strokeWidth="0.4">
        <line x1="-40" y1="66" x2="200" y2="66" />
        <line x1="80" y1="66" x2="20" y2="100" />
        <line x1="80" y1="66" x2="140" y2="100" />
      </g>
    </svg>
  );
}

function Person({ lift }: { lift?: MotionValue<number> }) {
  return (
    <svg {...svgProps}>
      <motion.g fill="var(--foreground)" style={lift ? { y: lift } : undefined}>
        <circle cx="80" cy="46.5" r="3" />
        <path d="M76.2 51 Q80 49.4 83.8 51 L84.6 60 H82.6 L82 66 H80.6 L80 61 L79.4 66 H78 L77.4 60 H75.4Z" />
      </motion.g>
      <circle cx="81" cy="46" r="0.6" fill="var(--background)" />
    </svg>
  );
}

function Flower() {
  return (
    <svg {...svgProps}>
      <path d="M22 92 Q24 76 21 66" stroke="var(--foreground)" strokeOpacity="0.6" strokeWidth="1.1" fill="none" />
      <path d="M22 82 Q15 78 13 72 Q20 74 22 80Z" fill="var(--foreground)" opacity="0.5" />
      <g fill="var(--ring)">
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="21" cy="61" rx="2.4" ry="4.4" transform={`rotate(${a} 21 65)`} />
        ))}
      </g>
      <circle cx="21" cy="65" r="2" fill="var(--foreground)" opacity="0.75" />
    </svg>
  );
}

function Wall() {
  return (
    <svg {...svgProps}>
      <path
        fillRule="evenodd"
        d="M-60 -60 H220 V150 H-60Z M66 32 H94 V69 H66Z"
        fill="var(--muted)"
        stroke="var(--muted-foreground)"
        strokeOpacity="0.5"
        strokeWidth="0.6"
      />
      <line x1="80" y1="32" x2="80" y2="69" stroke="var(--muted-foreground)" strokeOpacity="0.4" strokeWidth="0.5" />
    </svg>
  );
}

/** bullet-time：人物用片中時間跳躍，運鏡時幾乎停在空中 */
function JumpingPerson() {
  const { footage } = useCameraStage();
  const lift = useTransform(footage, (s) => -Math.abs(Math.sin(s * 1.6)) * 9);
  return <Person lift={lift} />;
}

function Scene({ move }: { move: CameraMove }) {
  return (
    <>
      <CameraLayer depth={0}>
        <Sky />
      </CameraLayer>
      <CameraLayer depth={0.15}>
        <Mountains />
      </CameraLayer>
      <CameraLayer depth={0.4}>
        <City />
      </CameraLayer>
      <CameraLayer depth={0.6} subject focus="far">
        {move === "bullet-time" ? <JumpingPerson /> : <Person />}
      </CameraLayer>
      <CameraLayer depth={0.92} focus="near">
        <Flower />
      </CameraLayer>
      {move === "fly-through" && (
        <CameraLayer depth={1} bleed={0}>
          <Wall />
        </CameraLayer>
      )}
    </>
  );
}

function Tile({ name, label, hint, replay, children }: { name: string; label: string; hint: string; replay?: string; children: ReactNode }) {
  const [run, setRun] = useState(0);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="font-mono text-xs font-medium">{name}</span>
          <span className="truncate text-xs text-muted-foreground">{label}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-muted-foreground">{hint}</span>
          {replay && (
            <button
              type="button"
              onClick={() => setRun((r) => r + 1)}
              className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {replay}
            </button>
          )}
        </div>
      </div>
      <div key={run}>{children}</div>
    </div>
  );
}

function ScrollTile({ label }: { label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const progress = useTransform(scrollYProgress, [0.2, 0.8], [0, 1], { clamp: true });
  return (
    <div ref={ref}>
      <CameraStage move="dolly-zoom" progress={progress} label={label}>
        <Scene move="dolly-zoom" />
      </CameraStage>
    </div>
  );
}

export default function CameraMovesDemo() {
  const t = useDemoText(copy);

  return (
    <div className="grid w-full max-w-5xl grid-cols-1 gap-x-6 gap-y-10 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {cameraMoves.map((move) => {
        const kind = kinds[move] ?? "loop";
        return (
          <Tile
            key={move}
            name={move}
            label={t.names[move]}
            hint={t[kind]}
            replay={kind === "entrance" ? t.replay : undefined}
          >
            <CameraStage
              move={move}
              trigger={triggerOf[kind]}
              label={t.scene}
              focusPoint={move === "extreme-close-up" || move === "zoom-in" ? { x: 50, y: 52 } : undefined}
            >
              <Scene move={move} />
            </CameraStage>
          </Tile>
        );
      })}
      <Tile name="dolly-zoom + progress" label={t.scrollName} hint={t.scroll}>
        <ScrollTile label={t.scene} />
      </Tile>
    </div>
  );
}
