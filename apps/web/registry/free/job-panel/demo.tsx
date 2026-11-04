"use client";

import { useEffect, useState } from "react";

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

const prompt = "Girl in a yellow raincoat on a rooftop at dusk, soft film grain, warm city lights";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function JobPanelDemo() {
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
    ? { id: "job_8f2a", prompt, status: "canceled", durationSeconds: 6, meta: ["Just now", "Soft anime"] }
    : { id: "job_8f2a", prompt, ...frame, durationSeconds: done ? 52 : null, images: done ? 2 : 0, meta: ["Just now", "Soft anime"] };

  return (
    <div className="w-full max-w-sm min-w-0 rounded-xl border border-border bg-card p-5">
      <JobPanel
        job={job}
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
          <h3 className="text-xs font-medium text-muted-foreground">Your prompt</h3>
          <p className="text-sm text-pretty">{prompt}</p>
        </section>
      </JobPanel>
    </div>
  );
}
