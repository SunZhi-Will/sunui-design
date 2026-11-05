"use client";

import { useEffect, useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { JobRow, JobStatusDot } from "./job-row";

// Vozmira 控制台：一支影片專案從擷取網址到合成，進度依階段推進
const until = [20, 45, 80, 100];

const copy = {
  en: {
    stages: ["Reading the page", "Writing the script", "Composing voice and visuals", "Rendering"],
    ready: "Ready",
    heading: "In progress",
    readyCount: "1 ready",
    runningCount: "1 running",
    title: "Refero Styles: design systems for AI",
  },
  "zh-TW": {
    stages: ["讀取網頁", "撰寫腳本", "合成配音與畫面", "輸出影片"],
    ready: "完成",
    heading: "進行中",
    readyCount: "1 支完成",
    runningCount: "1 支進行中",
    title: "Refero Styles：給 AI 的設計系統",
  },
  "zh-CN": {
    stages: ["读取网页", "撰写脚本", "合成配音与画面", "导出视频"],
    ready: "完成",
    heading: "进行中",
    readyCount: "1 个完成",
    runningCount: "1 个进行中",
    title: "Refero Styles：给 AI 的设计系统",
  },
  ja: {
    stages: ["ページを読み込み中", "台本を作成中", "音声と映像を合成中", "レンダリング中"],
    ready: "完成",
    heading: "進行中",
    readyCount: "1 件完成",
    runningCount: "1 件実行中",
    title: "Refero Styles：AI のためのデザインシステム",
  },
};

export default function JobRowDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [progress, setProgress] = useState(4);

  useEffect(() => {
    if (progress >= 100) return;
    const id = setTimeout(() => setProgress((p) => Math.min(100, p + 6)), 1200);
    return () => clearTimeout(id);
  }, [progress]);

  const done = progress >= 100;
  const stage = until.findIndex((u) => progress < u);
  const label = done ? t.ready : t.stages[stage === -1 ? until.length - 1 : stage];

  return (
    <section aria-labelledby="active-heading" className="w-full max-w-xl min-w-0 overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h3 id="active-heading" className="text-sm font-semibold">
          {t.heading}
        </h3>
        <JobStatusDot state={done ? "completed" : "running"}>{done ? t.readyCount : t.runningCount}</JobStatusDot>
      </div>
      <JobRow locale={locale} title={t.title} source={{ kind: "url", label: "URL" }} progress={progress} label={label} href="#project-1" />
    </section>
  );
}
