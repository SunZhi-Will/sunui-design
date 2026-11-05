"use client";

import { useEffect, useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { JobPanel, type Job } from "./job-panel";

type Frame = Pick<Job, "status" | "step" | "total" | "queuePosition" | "etaSeconds">;

// 排隊、理解描述、載入模型、取樣 28 步、輸出、檢查、完成
const timeline: Frame[] = [
  { status: "queued", queuePosition: 3, etaSeconds: 48 },
  { status: "queued", queuePosition: 2, etaSeconds: 40 },
  { status: "queued", queuePosition: 1, etaSeconds: 32 },
  { status: "planning", etaSeconds: 28 },
  { status: "loading", etaSeconds: 24 },
  ...Array.from({ length: 7 }, (_, i): Frame => ({ status: "sampling", step: (i + 1) * 4, total: 28, etaSeconds: 20 - i * 2.5 })),
  { status: "decoding", etaSeconds: 3 },
  { status: "checking", etaSeconds: 1 },
  { status: "done" },
];

const copy = {
  en: { prompt: "Girl in a yellow raincoat on a rooftop at dusk, soft film grain, warm city lights", meta: ["Just now", "Soft anime"], heading: "Your prompt" },
  "zh-TW": { prompt: "黃昏的屋頂上穿黃色雨衣的女孩，柔和的底片顆粒，溫暖的城市燈火", meta: ["剛剛", "柔和動漫"], heading: "你的描述" },
  "zh-CN": { prompt: "黄昏的屋顶上穿黄色雨衣的女孩，柔和的胶片颗粒，温暖的城市灯火", meta: ["刚刚", "柔和动漫"], heading: "你的描述" },
  ja: { prompt: "夕暮れの屋上に立つ黄色いレインコートの少女、やわらかなフィルムグレイン、あたたかな街の灯り", meta: ["たった今", "やわらかアニメ"], heading: "プロンプト" },
};
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function JobPanelDemo() {
  const locale = useDemoLocale();
  const { prompt, meta, heading } = useDemoText(copy);
  const [i, setI] = useState(0);
  const [canceled, setCanceled] = useState(false);

  useEffect(() => {
    if (canceled || i >= timeline.length - 1) return;
    const id = setTimeout(() => setI((n) => n + 1), 1400);
    return () => clearTimeout(id);
  }, [i, canceled]);

  const frame = timeline[i];
  const done = frame.status === "done";
  const job: Job = canceled
    ? { id: "job_8f2a", prompt, status: "canceled", durationSeconds: 6, meta }
    : { id: "job_8f2a", prompt, ...frame, durationSeconds: done ? 52 : null, images: done ? 2 : 0, meta };

  return (
    <div className="w-full max-w-sm min-w-0 rounded-xl border border-border bg-card p-5">
      <JobPanel
        job={job}
        locale={locale}
        onCancel={async () => {
          await wait(500);
          setCanceled(true);
        }}
        onEdit={() => undefined}
        onRerun={async () => {
          await wait(500);
          setCanceled(false);
          setI(0);
        }}
      >
        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-medium text-muted-foreground">{heading}</h3>
          <p className="text-sm text-pretty">{prompt}</p>
        </section>
      </JobPanel>
    </div>
  );
}
