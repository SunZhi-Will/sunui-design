"use client";

import { memo, useEffect, useMemo, useState, type CSSProperties } from "react";

import { lineIconTone } from "@/lib/line-icon-colors";
import {
  AnimatedPixelIcon,
  animatedPixelIconNames,
  pixelRecipes,
  type AnimatedPixelIconName,
} from "@/registry/icons/sunui-animated-pixel-icons";
import { AnimatedIcon, animatedIconNames, motionKindOf, type AnimatedIconName } from "@/registry/icons/sunui-animated-icons";
import {
  AnimatedTwoToneIcon,
  animatedTwoToneIconNames,
  twoToneMotionKindOf,
  type AnimatedTwoToneIconName,
} from "@/registry/icons/sunui-animated-twotone-icons";
import { Icon, iconNames, type IconName } from "@/registry/icons/sunui-icons";

type Reel = "pixel" | "twotone" | "line";
type Scene = "black" | "intro" | Reel | "outro";

// 每一幕的開始時間（毫秒），全長 12.6 秒
const TIMELINE: [Scene, number][] = [
  ["intro", 0],
  ["pixel", 2200],
  ["twotone", 5000],
  ["line", 7800],
  ["outro", 9800],
];

const lineAnimated = new Set<string>(animatedIconNames);
const COUNTS = { pixel: animatedPixelIconNames.length, twotone: animatedTwoToneIconNames.length, line: iconNames.length };
const CAPTION: Record<Reel, string> = {
  pixel: "Pixel · object colours · every icon moves",
  twotone: "Two-tone · solid light body · every icon moves",
  line: "Line · the stroke set blocks use",
};

function playMs(set: Reel, name: string) {
  if (set === "pixel") {
    const r = pixelRecipes[name as AnimatedPixelIconName];
    return r.kind === "hover" ? Math.max(600, (r.frames.length / r.fps) * 1000 + 120) : 1300;
  }
  const kind = set === "twotone" ? twoToneMotionKindOf(name as AnimatedTwoToneIconName) : motionKindOf(name as AnimatedIconName);
  return kind === "hover" ? 900 : 1300;
}

/** 影片用的自動播放：比網站更密，進場後 0.7 秒內每格都動過一次 */
function useBusyPlay(set: Reel, names: readonly string[], running: boolean) {
  const [active, setActive] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (!running) {
      setActive({});
      return;
    }
    const now0 = performance.now();
    const next = names.map(() => now0 + Math.random() * 700);
    const until = names.map(() => 0);
    let state: Record<string, boolean> = {};
    const id = setInterval(() => {
      const now = performance.now();
      let draft: Record<string, boolean> | null = null;
      names.forEach((name, i) => {
        const on = Boolean(state[name]);
        if (on && now >= until[i]) {
          draft ??= { ...state };
          draft[name] = false;
          next[i] = now + 600 + Math.random() * 1100;
        } else if (!on && now >= next[i]) {
          draft ??= { ...state };
          draft[name] = true;
          until[i] = now + playMs(set, name);
        }
      });
      if (draft) {
        state = draft;
        setActive(draft);
      }
    }, 40);
    return () => clearInterval(id);
  }, [set, names, running]);
  return active;
}

const Cell = memo(function Cell({ set, name, on, size }: { set: Reel; name: string; on: boolean; size: number }) {
  if (set === "pixel") return <AnimatedPixelIcon name={name as AnimatedPixelIconName} size={size} active={on} tone="pigment" />;
  if (set === "twotone")
    return (
      <AnimatedTwoToneIcon
        name={name as AnimatedTwoToneIconName}
        size={size}
        active={on}
        style={lineIconTone(name) as CSSProperties}
      />
    );
  return lineAnimated.has(name) ? (
    <AnimatedIcon name={name as AnimatedIconName} size={size} active={on} />
  ) : (
    <Icon name={name as IconName} size={size} />
  );
});

function Wall({ set, shown }: { set: Reel; shown: boolean }) {
  const names = useMemo<readonly string[]>(
    () => (set === "pixel" ? animatedPixelIconNames : set === "twotone" ? animatedTwoToneIconNames : iconNames),
    [set],
  );
  const playable = useMemo(() => (set === "line" ? names.filter((n) => lineAnimated.has(n)) : names), [set, names]);
  const active = useBusyPlay(set, playable, shown);
  const cols = set === "pixel" ? 25 : 20;
  const cell = set === "pixel" ? 72 : 92;
  const size = set === "pixel" ? 48 : 52;
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center transition-[opacity,transform] duration-500 ease-out"
      style={{ opacity: shown ? 1 : 0, transform: shown ? "scale(1)" : "scale(0.97)" }}
    >
      <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gridAutoRows: `${cell}px` }}>
        {names.map((name) => (
          <div key={name} className="grid place-items-center text-white">
            <Cell set={set} name={name} on={Boolean(active[name])} size={size} />
          </div>
        ))}
      </div>
      <div className="mt-14 flex items-baseline gap-5 font-mono text-[22px] tracking-wide text-white/55">
        <span className="text-[40px] font-semibold tracking-tight text-white tabular-nums">{COUNTS[set]}</span>
        <span>{CAPTION[set]}</span>
      </div>
    </div>
  );
}

function Marquee({ set, reverse }: { set: Reel; reverse?: boolean }) {
  const names = (set === "pixel" ? animatedPixelIconNames : animatedTwoToneIconNames).slice(0, 40);
  const row = [...names, ...names];
  return (
    <div className="relative w-full overflow-hidden">
      <div
        className="flex w-max gap-10"
        style={{ animation: `reel-marquee 14s linear infinite${reverse ? " reverse" : ""}` }}
      >
        {row.map((name, i) => (
          <div key={`${name}-${i}`} className="grid size-[72px] shrink-0 place-items-center rounded-2xl bg-white/[0.06] text-white">
            <Cell set={set} name={name} on={false} size={set === "pixel" ? 48 : 44} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function IconReel() {
  const [scene, setScene] = useState<Scene>("black");

  useEffect(() => {
    // ?wait 時等錄影腳本呼叫 window.__reelGo()，否則載入後 0.6 秒自動開始
    const timers: number[] = [];
    const go = () => {
      (window as unknown as { __reelStartedAt?: number }).__reelStartedAt = Date.now();
      for (const [s, at] of TIMELINE) timers.push(window.setTimeout(() => setScene(s), at));
    };
    (window as unknown as { __reelGo?: () => void }).__reelGo = go;
    if (!new URLSearchParams(location.search).has("wait")) timers.push(window.setTimeout(go, 600));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="relative h-[1080px] w-[1920px] overflow-hidden bg-[#0a0a0a] font-sans text-white">
      {/* 開發模式左下角的 Next 徽章會被錄進去 */}
      <style>{`@keyframes reel-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}nextjs-portal{display:none!important}`}</style>

      {/* 一句賣點 */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center transition-[opacity,transform] duration-500 ease-out"
        style={{ opacity: scene === "intro" ? 1 : 0, transform: scene === "intro" ? "translateY(0)" : "translateY(16px)" }}
      >
        <p className="font-mono text-[24px] tracking-[0.2em] text-white/50 uppercase">SunUI Icons</p>
        <h1 className="mt-6 text-[96px] leading-none font-semibold tracking-tight">One standard. Three sets.</h1>
        <p className="mt-8 text-[30px] text-white/60">Pixel · Two-tone · Line</p>
      </div>

      <Wall set="pixel" shown={scene === "pixel"} />
      <Wall set="twotone" shown={scene === "twotone"} />
      <Wall set="line" shown={scene === "line"} />

      {/* 跑馬燈夾標題 */}
      <div
        className="absolute inset-0 flex flex-col justify-center gap-16 transition-opacity duration-500 ease-out"
        style={{ opacity: scene === "outro" ? 1 : 0 }}
      >
        {scene === "outro" && <Marquee set="pixel" />}
        <div className="text-center">
          <h2 className="text-[112px] leading-none font-semibold tracking-tight">SunUI Icons</h2>
          <p className="mt-7 font-mono text-[30px] text-white/70">sunui.synvize.com/icons</p>
          <p className="mt-4 text-[26px] text-white/45">
            {COUNTS.pixel + COUNTS.twotone + COUNTS.line} icons · free · MIT · one shadcn command
          </p>
        </div>
        {scene === "outro" && <Marquee set="twotone" reverse />}
      </div>
    </div>
  );
}
