"use client";

import { useInView } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { useDemoText } from "@/lib/demo-locale";

import {
  Animate,
  emphasisPresets,
  entrancePresets,
  exitPresets,
  type AnimatePreset,
  type EmphasisPreset,
  type ExitPreset,
} from "./animate-presets";

export const copy = {
  en: {
    entrance: "Entrance",
    entranceHint: "Plays once when the tile mounts. Press Replay to see it again.",
    exit: "Exit",
    exitHint: "Plays the exit, then the tile comes back after a short pause.",
    emphasis: "Emphasis",
    emphasisHint: "Loops while on screen. Use trigger hover or click to play on demand.",
    replay: "Replay",
    sample: "Motion",
  },
  "zh-TW": {
    entrance: "進場",
    entranceHint: "格子掛載時播放一次，按「重播」可以再看一次。",
    exit: "退場",
    exitHint: "播完退場後停一下，再回到畫面上。",
    emphasis: "強調",
    emphasisHint: "在畫面內持續循環。改用 hover 或 click 觸發可以按需播放。",
    replay: "重播",
    sample: "動效",
  },
  "zh-CN": {
    entrance: "进场",
    entranceHint: "格子挂载时播放一次，按「重播」可以再看一次。",
    exit: "退场",
    exitHint: "播完退场后停一下，再回到画面上。",
    emphasis: "强调",
    emphasisHint: "在画面内持续循环。改用 hover 或 click 触发可以按需播放。",
    replay: "重播",
    sample: "动效",
  },
  ja: {
    entrance: "登場",
    entranceHint: "タイルの表示時に一度だけ再生します。「再生」で何度でも確認できます。",
    exit: "退場",
    exitHint: "退場を再生したあと、少し待ってから元に戻ります。",
    emphasis: "強調",
    emphasisHint: "画面内にある間ループします。hover や click トリガーで必要なときだけ再生できます。",
    replay: "再生",
    sample: "モーション",
  },
};

export function Subject({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm">
      <svg viewBox="0 0 16 16" className="size-4" fill="currentColor" aria-hidden="true">
        <path d="M8 1.5l1.9 4 4.4.5-3.3 3 .9 4.4L8 11.2l-3.9 2.2.9-4.4-3.3-3 4.4-.5z" />
      </svg>
      {label}
    </span>
  );
}

function Tile({ name, children, onReplay, replayLabel }: { name: string; children: ReactNode; onReplay?: () => void; replayLabel: string }) {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-md border border-border bg-card text-card-foreground">
      {onReplay && (
        <button
          type="button"
          onClick={onReplay}
          aria-label={`${replayLabel}: ${name}`}
          className="absolute right-2 top-2 z-10 grid size-7 place-items-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2.5 8a5.5 5.5 0 1 0 1.6-3.9M2.5 2.5v2.6h2.6" />
          </svg>
        </button>
      )}
      <div className="grid h-36 place-items-center overflow-hidden px-4">{children}</div>
      <p className="border-t border-border px-3 py-2 font-mono text-xs text-muted-foreground">{name}</p>
    </div>
  );
}

function EntranceTile({ preset, label, replay }: { preset: AnimatePreset; label: string; replay: string }) {
  const [run, setRun] = useState(0);
  return (
    <Tile name={preset} onReplay={() => setRun((n) => n + 1)} replayLabel={replay}>
      <Animate key={run} preset={preset}>
        <Subject label={label} />
      </Animate>
    </Tile>
  );
}

/** 退場格：播完後停一下就重新掛載，讓內容回到畫面上；離開畫面時不再重播 */
function ExitTile({ preset, label, replay }: { preset: ExitPreset; label: string; replay: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => setRun((n) => n + 1), preset === "hinge" ? 3600 : 2600);
    return () => clearTimeout(t);
  }, [inView, run, preset]);

  return (
    <div ref={ref}>
      <Tile name={preset} onReplay={() => setRun((n) => n + 1)} replayLabel={replay}>
        <Animate key={run} preset={preset} delay={0.6}>
          <Subject label={label} />
        </Animate>
      </Tile>
    </div>
  );
}

function EmphasisTile({ preset, label, replay }: { preset: EmphasisPreset; label: string; replay: string }) {
  return (
    <Tile name={preset} replayLabel={replay}>
      <Animate preset={preset} trigger="loop" repeatDelay={preset === "spin" || preset === "float" ? 0.2 : 1.2}>
        <Subject label={label} />
      </Animate>
    </Tile>
  );
}

function Section({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

export default function AnimatePresetsDemo() {
  const t = useDemoText(copy);
  return (
    <div className="w-full max-w-5xl space-y-10">
      <Section title={t.entrance} hint={t.entranceHint}>
        {entrancePresets.map((p) => (
          <EntranceTile key={p} preset={p} label={t.sample} replay={t.replay} />
        ))}
      </Section>
      <Section title={t.exit} hint={t.exitHint}>
        {exitPresets.map((p) => (
          <ExitTile key={p} preset={p} label={t.sample} replay={t.replay} />
        ))}
      </Section>
      <Section title={t.emphasis} hint={t.emphasisHint}>
        {emphasisPresets.map((p) => (
          <EmphasisTile key={p} preset={p} label={t.sample} replay={t.replay} />
        ))}
      </Section>
    </div>
  );
}
