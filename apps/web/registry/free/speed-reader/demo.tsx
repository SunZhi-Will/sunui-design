"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { SpeedReader } from "./speed-reader";

const copy = {
  en: {
    sample:
      "Speed reading works best in short bursts. Show one word at a time in the same spot, and your eyes stop jumping across the line. Start around 240 words per minute, then raise the pace by 50 every few sessions. 閃字閱讀把文章拆成一個個字，固定在畫面中央顯示，讓視線不必來回移動。",
    heading: "Flash reader",
    intro: "Shows your text one word at a time to help you read faster and stay focused.",
    inputLabel: "Text to read",
    placeholder: "Type or paste the article you want to read...",
    stats: (chars: number, units: number) => `${chars} characters, split into ${units} reading units`,
    idle: "Flash words appear as soon as you type",
  },
  "zh-TW": {
    sample:
      "閃字閱讀最適合短時間集中練習。每次只在同一個位置顯示一個字，視線就不必在行與行之間來回跳動。先從每分鐘 240 字開始，每練習幾次再加快 50 字。Show one word at a time in the same spot.",
    heading: "閃字閱讀器",
    intro: "把文字一個一個顯示出來，幫你讀得更快、更專注。",
    inputLabel: "要閱讀的文字",
    placeholder: "輸入或貼上想閱讀的文章...",
    stats: (chars: number, units: number) => `共 ${chars} 個字元，分割為 ${units} 個閱讀單位`,
    idle: "一輸入文字，閃字就會出現",
  },
  "zh-CN": {
    sample:
      "闪字阅读最适合短时间集中练习。每次只在同一个位置显示一个字，视线就不必在行与行之间来回跳动。先从每分钟 240 字开始，每练习几次再加快 50 字。Show one word at a time in the same spot.",
    heading: "闪字阅读器",
    intro: "把文字一个一个显示出来，帮你读得更快、更专注。",
    inputLabel: "要阅读的文字",
    placeholder: "输入或粘贴想阅读的文章...",
    stats: (chars: number, units: number) => `共 ${chars} 个字符，拆分为 ${units} 个阅读单位`,
    idle: "一输入文字，闪字就会出现",
  },
  ja: {
    sample:
      "速読は短い時間で集中して練習するのが効果的です。同じ位置に一度に一語ずつ表示すれば、視線が行の間を行き来しなくなります。まずは毎分 240 語から始め、数回ごとに 50 語ずつ速くしましょう。Show one word at a time in the same spot.",
    heading: "フラッシュリーダー",
    intro: "テキストを一語ずつ表示して、速く集中して読めるようにします。",
    inputLabel: "読みたいテキスト",
    placeholder: "読みたい文章を入力または貼り付け...",
    stats: (chars: number, units: number) => `${chars} 文字、${units} 個の読書単位に分割`,
    idle: "入力するとすぐにフラッシュ表示が始まります",
  },
};

export default function SpeedReaderDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [text, setText] = useState(t.sample);
  const [units, setUnits] = useState(0);
  const [prevSample, setPrevSample] = useState(t.sample);
  // 切換語言時換成該語言的範例文
  if (prevSample !== t.sample) {
    setPrevSample(t.sample);
    setText(t.sample);
  }

  return (
    <div className="w-full max-w-3xl min-w-0 space-y-6 text-neutral-900 dark:text-neutral-100">
      <div>
        <h2 className="mb-2 text-2xl font-medium tracking-tight">{t.heading}</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{t.intro}</p>
      </div>

      <div>
        <label htmlFor="flash-reader-input" className="sr-only">
          {t.inputLabel}
        </label>
        <textarea
          id="flash-reader-input"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.placeholder}
          className="w-full rounded-lg border border-neutral-200 bg-white p-4 font-sans text-black shadow-sm transition-colors focus:ring-2 focus:ring-neutral-400 focus:outline-none dark:border-neutral-800 dark:bg-neutral-800 dark:text-white dark:focus:ring-neutral-600"
        />
        <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          {text ? t.stats(text.length, units) : t.idle}
        </p>
      </div>

      <SpeedReader locale={locale} text={text} onWordsChange={setUnits} showTips={false} className="rounded-xl border border-neutral-200 dark:border-neutral-800" />
    </div>
  );
}
