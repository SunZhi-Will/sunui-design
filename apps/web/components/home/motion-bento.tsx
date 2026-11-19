"use client";

import { useInView, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { AnimatedNumber } from "@/registry/free/animated-number/animated-number";
import { EffectBackground, type BackgroundEffect } from "@/registry/free/background-effects/background-effects";
import { EffectButton } from "@/registry/free/button-effects/button-effects";
import { ChartEffect } from "@/registry/free/chart-effects/chart-effects";
import { PointCloud } from "@/registry/free/point-cloud/point-cloud";
import { OrbitingCircles } from "@/registry/free/svg-effects/svg-effects";
import { TextEffect } from "@/registry/free/text-effects/text-effects";
import { cn } from "@/lib/utils";

/**
 * 首頁用到的 SunUI 動效庫：全部直接引入免費區塊的元件，不是截圖也不是 iframe。規範見 SITE-MOTION.md §6。
 * 外殼只有黑白灰，所以每個效果都傳一組由前景色混出來的灰階，不用它們預設的主題色。
 */
const MONO = ["var(--fg)", "color-mix(in oklch, var(--fg) 58%, var(--bg))", "color-mix(in oklch, var(--fg) 28%, var(--bg))"];

export type MotionLib = { name: string; title: string };
type Copy = { prefix: string; words: string[]; buttons: string[]; chart: string; days: string[] };

const BACKGROUNDS: BackgroundEffect[] = ["waves", "particles", "ripple-rings", "starfield", "meteors"];

/** 動效庫格子：上排一大一小，下排三張。每一格是一套動效庫正在跑，下面一行名稱連到區塊頁 */
export function MotionBento({ libs, note, copy }: { libs: Record<string, MotionLib | undefined>; note: string; copy: Copy }) {
  const reduce = useReducedMotion();
  const [bg, setBg] = useState(0);
  // svg-effects 的軌道位置在伺服器和瀏覽器算出來的小數位數不同，所以那一格等掛載後才畫
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (reduce) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setBg((i) => (i + 1) % BACKGROUNDS.length);
    }, 4600);
    return () => window.clearInterval(timer);
  }, [reduce]);

  return (
    <ul className="mt-10 grid gap-x-4 gap-y-8 md:grid-cols-6">
      <Tile lib={libs["background-effects"]} note={note} className="md:col-span-4" frame="h-[320px] md:h-[440px]" night>
        <EffectBackground key={BACKGROUNDS[bg]} effect={BACKGROUNDS[bg]} colors={MONO} className="absolute inset-0" />
        <span className="absolute bottom-4 left-4 rounded-full bg-bg/70 px-2.5 py-1 font-mono text-[11px] text-subtle shadow-e1">{BACKGROUNDS[bg]}</span>
      </Tile>
      <Tile lib={libs["text-effects"]} note={note} className="md:col-span-2" frame="h-[320px] md:h-[440px]">
        <div className="grid h-full place-items-center px-6 text-center">
          <div className="space-y-7">
            <TextEffect text={copy.prefix} effect="word-rotate" words={copy.words} className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl" />
            <TextEffect text="SunUI motion" effect="scramble" trigger="loop" className="block font-mono text-sm text-subtle" />
            <TextEffect text={copy.words[1] ?? copy.words[0]} effect="shimmer" colors={MONO} className="block text-2xl font-semibold tracking-[-0.02em]" />
          </div>
        </div>
      </Tile>
      <Tile lib={libs["chart-effects"]} note={note} className="md:col-span-2" frame="h-[320px]">
        <div className="grid h-full place-items-center p-7">
          <ChartEffect
            variant="bar-grow"
            trigger="loop"
            label={copy.chart}
            colors={MONO}
            data={copy.days.map((label, i) => ({ label, value: [38, 52, 44, 67, 58, 86, 73][i % 7] }))}
            className="w-full"
          />
        </div>
      </Tile>
      <Tile lib={libs["button-effects"]} note={note} className="md:col-span-2" frame="h-[320px]">
        <div className="grid h-full grid-cols-2 place-items-center gap-4 p-7">
          <EffectButton effect="shine-sweep">{copy.buttons[0]}</EffectButton>
          <EffectButton effect="rotating-border">{copy.buttons[1]}</EffectButton>
          <EffectButton effect="press-3d">{copy.buttons[2]}</EffectButton>
          <EffectButton effect="direction-fill">{copy.buttons[3]}</EffectButton>
        </div>
      </Tile>
      <Tile lib={libs["svg-effects"]} note={note} className="md:col-span-2" frame="h-[320px]">
        <div className="grid h-full place-items-center p-6">
          {mounted && <OrbitingCircles colors={MONO} className="aspect-square h-full max-h-[260px]" />}
        </div>
      </Tile>
    </ul>
  );
}

/** night：這一格不管網站主題都用深色（.dark 套在元素上，裡面的 token 跟著變） */
function Tile({ lib, note, className, frame, night, children }: { lib?: MotionLib; note: string; className?: string; frame: string; night?: boolean; children: ReactNode }) {
  if (!lib) return null;
  return (
    <li className={className}>
      <div className={cn("relative overflow-hidden rounded-2xl shadow-e1", night ? "dark bg-[#0d0d0d] text-fg" : "bg-[#f4f4f4] dark:bg-[#131313]", frame)}>{children}</div>
      <div className="mt-3.5 flex items-center justify-between gap-4 text-sm">
        <Link href={`/blocks/${lib.name}`} className="truncate font-medium underline-offset-4 hover:underline">
          {lib.title}
        </Link>
        <span className="shrink-0 text-subtle">{note}</span>
      </div>
    </li>
  );
}

/** 數字：捲進畫面時從 0 滾到目標值（animated-number 區塊） */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.6 });
  return (
    <span ref={ref} className={className}>
      <AnimatedNumber value={seen ? value : 0} stagger={0.06} />
    </span>
  );
}

/** 收尾：點雲拼出 SunUI，和開場呼應。可以拖 */
export function ClosingCloud({ label }: { label: string }) {
  return <PointCloud shape="text" text="SunUI" count={3000} pointSize={1.6} label={label} className="mx-auto aspect-[5/2] max-w-3xl text-fg" />;
}
