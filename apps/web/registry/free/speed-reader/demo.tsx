"use client";

import { useState } from "react";

import { SpeedReader } from "./speed-reader";

const sample =
  "Speed reading works best in short bursts. Show one word at a time in the same spot, and your eyes stop jumping across the line. Start around 240 words per minute, then raise the pace by 50 every few sessions. 閃字閱讀把文章拆成一個個字，固定在畫面中央顯示，讓視線不必來回移動。";

export default function SpeedReaderDemo() {
  const [text, setText] = useState(sample);
  const [units, setUnits] = useState(0);

  return (
    <div className="w-full max-w-3xl min-w-0 space-y-6 text-neutral-900 dark:text-neutral-100">
      <div>
        <h2 className="mb-2 text-2xl font-medium tracking-tight">Flash reader</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Shows your text one word at a time to help you read faster and stay focused.</p>
      </div>

      <div>
        <label htmlFor="flash-reader-input" className="sr-only">
          Text to read
        </label>
        <textarea
          id="flash-reader-input"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste the article you want to read..."
          className="w-full rounded-lg border border-neutral-200 bg-white p-4 font-sans text-black shadow-sm transition-colors focus:ring-2 focus:ring-neutral-400 focus:outline-none dark:border-neutral-800 dark:bg-neutral-800 dark:text-white dark:focus:ring-neutral-600"
        />
        <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          {text ? `${text.length} characters, split into ${units} reading units` : "Flash words appear as soon as you type"}
        </p>
      </div>

      <SpeedReader text={text} onWordsChange={setUnits} showTips={false} className="rounded-xl border border-neutral-200 dark:border-neutral-800" />
    </div>
  );
}
