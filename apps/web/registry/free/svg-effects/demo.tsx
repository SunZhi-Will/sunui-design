"use client";

import { useState, type ReactNode } from "react";

import { useDemoText } from "@/lib/demo-locale";

import {
  AnimatedBeam,
  BlobMorph,
  FlowingConnectors,
  Gooey,
  IconMorph,
  LineDraw,
  LiquidFill,
  MotionPath,
  OrbitingCircles,
  RadarSweep,
  type SvgEffectName,
} from "./svg-effects";

type Copy = {
  replay: string;
  tap: string;
  level: string;
  names: Record<SvgEffectName, string>;
  icons: { menu: [string, string]; play: [string, string]; plus: [string, string] };
};

const copy: Record<"en" | "zh-TW" | "zh-CN" | "ja", Copy> = {
  en: {
    replay: "Replay",
    tap: "Tap the icons",
    level: "Fill level",
    names: {
      "line-draw": "Line draw",
      "blob-morph": "Blob morph",
      gooey: "Gooey",
      "orbiting-circles": "Orbiting circles",
      "motion-path": "Motion path",
      "icon-morph": "Icon morph",
      "animated-beam": "Animated beam",
      "flowing-connectors": "Flowing connectors",
      "radar-sweep": "Radar sweep",
      "liquid-fill": "Liquid fill",
    },
    icons: { menu: ["Open menu", "Close menu"], play: ["Play", "Pause"], plus: ["Expand", "Collapse"] },
  },
  "zh-TW": {
    replay: "重播",
    tap: "點按圖示",
    level: "填充比例",
    names: {
      "line-draw": "線條描繪",
      "blob-morph": "有機形變",
      gooey: "黏液融合",
      "orbiting-circles": "環繞軌道",
      "motion-path": "沿路徑移動",
      "icon-morph": "圖示變形",
      "animated-beam": "光束連線",
      "flowing-connectors": "流動連接線",
      "radar-sweep": "雷達掃描",
      "liquid-fill": "液體填充",
    },
    icons: { menu: ["開啟選單", "關閉選單"], play: ["播放", "暫停"], plus: ["展開", "收合"] },
  },
  "zh-CN": {
    replay: "重播",
    tap: "点按图标",
    level: "填充比例",
    names: {
      "line-draw": "线条描绘",
      "blob-morph": "有机形变",
      gooey: "黏液融合",
      "orbiting-circles": "环绕轨道",
      "motion-path": "沿路径移动",
      "icon-morph": "图标变形",
      "animated-beam": "光束连线",
      "flowing-connectors": "流动连接线",
      "radar-sweep": "雷达扫描",
      "liquid-fill": "液体填充",
    },
    icons: { menu: ["打开菜单", "关闭菜单"], play: ["播放", "暂停"], plus: ["展开", "收起"] },
  },
  ja: {
    replay: "もう一度",
    tap: "アイコンをタップ",
    level: "充填率",
    names: {
      "line-draw": "ラインドロー",
      "blob-morph": "ブロブモーフ",
      gooey: "グーイー",
      "orbiting-circles": "軌道を回る円",
      "motion-path": "モーションパス",
      "icon-morph": "アイコンモーフ",
      "animated-beam": "アニメーションビーム",
      "flowing-connectors": "流れるコネクター",
      "radar-sweep": "レーダースイープ",
      "liquid-fill": "リキッドフィル",
    },
    icons: { menu: ["メニューを開く", "メニューを閉じる"], play: ["再生", "一時停止"], plus: ["展開", "折りたたむ"] },
  },
};

function Tile({ name, id, onReplay, replayLabel, children }: { name: string; id: string; onReplay?: () => void; replayLabel?: string; children: ReactNode }) {
  return (
    <div className="relative flex min-h-56 flex-col rounded-lg border border-border bg-card p-4 text-card-foreground">
      {onReplay && (
        <button
          type="button"
          onClick={onReplay}
          className="absolute right-2 top-2 rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {replayLabel}
        </button>
      )}
      <div className="flex flex-1 items-center justify-center py-2">{children}</div>
      <p className="text-sm font-semibold tracking-tight">{name}</p>
      <code className="text-xs text-muted-foreground">{id}</code>
    </div>
  );
}

export default function SvgEffectsDemo() {
  const t = useDemoText(copy);
  const [drawKey, setDrawKey] = useState(0);
  const [level, setLevel] = useState(62);

  return (
    <div className="grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Tile name={t.names["line-draw"]} id="line-draw" onReplay={() => setDrawKey((k) => k + 1)} replayLabel={t.replay}>
        <LineDraw key={drawKey} className="max-w-56 text-foreground" colors={["currentColor"]} />
      </Tile>
      <Tile name={t.names["blob-morph"]} id="blob-morph">
        <BlobMorph className="max-w-32" />
      </Tile>
      <Tile name={t.names.gooey} id="gooey">
        <Gooey className="max-w-32" />
      </Tile>
      <Tile name={t.names["orbiting-circles"]} id="orbiting-circles">
        <OrbitingCircles className="max-w-36" />
      </Tile>
      <Tile name={t.names["motion-path"]} id="motion-path">
        <MotionPath className="max-w-56" />
      </Tile>
      <Tile name={t.names["icon-morph"]} id="icon-morph">
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-3">
            <IconMorph icon="menu-close" labels={t.icons.menu} />
            <IconMorph icon="play-pause" labels={t.icons.play} />
            <IconMorph icon="plus-minus" labels={t.icons.plus} />
          </div>
          <p className="text-xs text-muted-foreground">{t.tap}</p>
        </div>
      </Tile>
      <Tile name={t.names["animated-beam"]} id="animated-beam">
        <AnimatedBeam className="max-w-64" />
      </Tile>
      <Tile name={t.names["flowing-connectors"]} id="flowing-connectors">
        <FlowingConnectors className="max-w-64" />
      </Tile>
      <Tile name={t.names["radar-sweep"]} id="radar-sweep">
        <RadarSweep className="max-w-36" />
      </Tile>
      <Tile name={t.names["liquid-fill"]} id="liquid-fill">
        <div className="flex w-full flex-col items-center gap-3">
          <div className="flex gap-3">
            <LiquidFill value={level} label={t.level} className="w-24" />
            <LiquidFill value={level} shape="drop" label={t.level} showValue={false} className="w-16" />
            <LiquidFill value={level} shape="heart" label={t.level} showValue={false} className="w-16" />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={level}
            aria-label={t.level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="w-40 accent-foreground"
          />
        </div>
      </Tile>
    </div>
  );
}
