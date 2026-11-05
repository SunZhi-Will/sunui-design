"use client";

import { useEffect, useMemo, useState } from "react";

import { useDemoText } from "@/lib/demo-locale";
import { cn } from "@/lib/utils";

import { getWordSize, processText } from "./speed-reader";

const copy = {
  en: { sample: "Show one word at a time in the same spot, and your eyes stop jumping across the line.", region: "Flash reader", play: "Play", pause: "Pause", playing: "Playing", idle: "Tap to play" },
  "zh-TW": { sample: "每次只在同一個位置顯示一個字，視線就不必來回跳動。", region: "閃字閱讀器", play: "播放", pause: "暫停", playing: "播放中", idle: "點一下播放" },
  "zh-CN": { sample: "每次只在同一个位置显示一个字，视线就不必来回跳动。", region: "闪字阅读器", play: "播放", pause: "暂停", playing: "播放中", idle: "点一下播放" },
  ja: { sample: "同じ位置に一語ずつ表示すれば、視線が行き来しなくなります。", region: "フラッシュリーダー", play: "再生", pause: "一時停止", playing: "再生中", idle: "タップで再生" },
};

/** 型錄卡片：點畫面逐字閃讀，用區塊本身的斷字與字級規則，縮成卡片尺寸。 */
export default function SpeedReaderCard() {
  const t = useDemoText(copy);
  const words = useMemo(() => processText(t.sample, false), [t.sample]);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [prevSample, setPrevSample] = useState(t.sample);
  // 換語言時從頭開始
  if (prevSample !== t.sample) {
    setPrevSample(t.sample);
    setI(0);
    setPlaying(false);
  }

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
    <div role="region" aria-label={t.region} className="mx-auto w-72 overflow-hidden rounded-xl border border-neutral-200 bg-white font-sans text-black dark:border-neutral-800">
      <button
        type="button"
        aria-label={playing ? t.pause : t.play}
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
        <span className={cn("rounded px-2 py-0.5", playing ? "bg-red-600 text-white" : "bg-neutral-200")}>{playing ? t.playing : t.idle}</span>
        <span className="ml-auto rounded bg-neutral-200 px-2 py-0.5">
          {i + 1} / {words.length} <span className="font-medium text-red-500">{pct}%</span>
        </span>
      </div>
    </div>
  );
}
