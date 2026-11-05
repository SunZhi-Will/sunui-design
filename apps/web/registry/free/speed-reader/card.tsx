"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

import { getWordSize, processText } from "./speed-reader";

const sample = "Show one word at a time in the same spot, and your eyes stop jumping across the line.";

/** 型錄卡片：點畫面逐字閃讀，用區塊本身的斷字與字級規則，縮成卡片尺寸。 */
export default function SpeedReaderCard() {
  const words = useMemo(() => processText(sample, false), []);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setI((p) => {
        if (p >= words.length - 1) {
          setPlaying(false);
          return p;
        }
        return p + 1;
      });
    }, 250);
    return () => window.clearInterval(id);
  }, [playing, words.length]);

  // 原本字級以 rem 計，卡片裡縮成四成
  const size = getWordSize(words[i]);
  const fontSize = `calc(${size.fontSize} * 0.4)`;
  const pct = Math.round((i / (words.length - 1)) * 100);

  return (
    <div role="region" aria-label="Flash reader" className="mx-auto w-72 overflow-hidden rounded-xl border border-neutral-200 bg-white font-sans text-black dark:border-neutral-800">
      <button
        type="button"
        aria-label={playing ? "Pause" : "Play"}
        onClick={() => {
          if (!playing && i >= words.length - 1) setI(0);
          setPlaying((p) => !p);
        }}
        className="flex h-36 w-full items-center justify-center font-bold outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
      >
        <span style={{ fontSize, lineHeight: 1 }}>{words[i]}</span>
      </button>
      <div className="h-1 bg-neutral-600">
        <div className="h-full bg-red-600 transition-all duration-200 motion-reduce:transition-none" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center gap-2 px-3 py-2 text-xs tabular-nums">
        <span className={cn("rounded px-2 py-0.5", playing ? "bg-red-600 text-white" : "bg-neutral-200")}>{playing ? "Playing" : "Tap to play"}</span>
        <span className="ml-auto rounded bg-neutral-200 px-2 py-0.5">
          {i + 1} / {words.length} <span className="font-medium text-red-500">{pct}%</span>
        </span>
      </div>
    </div>
  );
}
