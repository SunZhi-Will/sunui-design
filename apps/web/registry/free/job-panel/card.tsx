"use client";

import { useEffect, useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { JobPanel, type Job } from "./job-panel";

type Frame = Pick<Job, "status" | "step" | "total" | "queuePosition" | "etaSeconds">;

// 排隊、理解描述、載入模型、取樣、輸出、檢查、完成
const timeline: Frame[] = [
  { status: "queued", queuePosition: 2, etaSeconds: 40 },
  { status: "queued", queuePosition: 1, etaSeconds: 32 },
  { status: "planning", etaSeconds: 28 },
  { status: "loading", etaSeconds: 24 },
  ...Array.from({ length: 7 }, (_, i): Frame => ({ status: "sampling", step: (i + 1) * 4, total: 28, etaSeconds: 20 - i * 2.5 })),
  { status: "decoding", etaSeconds: 3 },
  { status: "checking", etaSeconds: 1 },
  { status: "done" },
];

const prompts = {
  en: "Girl in a yellow raincoat on a rooftop at dusk",
  "zh-TW": "黃昏的屋頂上穿黃色雨衣的女孩",
  "zh-CN": "黄昏的屋顶上穿黄色雨衣的女孩",
  ja: "夕暮れの屋上に立つ黄色いレインコートの少女",
};
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 型錄卡片：一個生圖任務面板自己往前跑，可取消再重跑。 */
export default function JobPanelCard() {
  const locale = useDemoLocale();
  const prompt = useDemoText(prompts);
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
    ? { id: "job_8f2a", prompt, status: "canceled", durationSeconds: 6 }
    : { id: "job_8f2a", prompt, ...frame, durationSeconds: done ? 52 : null, images: done ? 2 : 0 };

  return (
    <div className="mx-auto w-72">
      <JobPanel
        job={job}
        locale={locale}
        onCancel={async () => {
          await wait(500);
          setCanceled(true);
        }}
        // 完成後按 Edit 從頭再跑一次
        onEdit={() => {
          setCanceled(false);
          setI(0);
        }}
        onRerun={async () => {
          await wait(500);
          setCanceled(false);
          setI(0);
        }}
      />
    </div>
  );
}
