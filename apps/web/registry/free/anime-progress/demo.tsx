"use client";

import { useEffect, useRef, useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { AnimeProgress } from "./anime-progress";

const copy = {
  en: { label: "Uploading episode art", done: "Uploaded", start: "Upload", again: "Upload again" },
  "zh-TW": { label: "上傳本集插圖", done: "已上傳", start: "上傳", again: "再上傳一次" },
  "zh-CN": { label: "上传本集插图", done: "已上传", start: "上传", again: "再上传一次" },
  ja: { label: "エピソード画像をアップロード中", done: "アップロード完了", start: "アップロード", again: "もう一度" },
};

const steps = [18, 34, 52, 71, 86, 100];

export default function AnimeProgressDemo() {
  const t = useDemoText(copy);
  const [value, setValue] = useState(0);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const run = () => {
    timers.current.forEach(clearTimeout);
    setValue(0);
    // Uploads arrive in surges, not a smooth line
    timers.current = steps.map((v, i) => window.setTimeout(() => setValue(v), 400 + i * 420));
  };

  return (
    <div className="w-full max-w-sm px-2 py-16">
      <AnimeProgress value={value} label={t.label} doneLabel={t.done} />
      <button type="button" onClick={run} className="mt-4 text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground">
        {value === 0 ? t.start : t.again}
      </button>
    </div>
  );
}
