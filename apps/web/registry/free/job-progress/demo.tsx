"use client";

import { useEffect, useState } from "react";

import { JobPanel, JobRow, JobStatusDot, JobTile, type Job } from "./job-progress";

// 參考圖用內嵌 SVG 畫一張簡單的人像剪影，不用外部圖片
const reference =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c7d2fe"/><stop offset="1" stop-color="#f5d0fe"/></linearGradient></defs><rect width="200" height="300" fill="url(#g)"/><circle cx="150" cy="60" r="26" fill="#fef3c7"/><path d="M0 230 Q60 190 110 220 T200 210 V300 H0Z" fill="#a5b4fc"/><circle cx="100" cy="130" r="34" fill="#475569"/><path d="M48 300 Q50 190 100 180 Q150 190 152 300Z" fill="#334155"/></svg>`,
  );

type Frame = Pick<Job, "status" | "step" | "total" | "queuePosition" | "etaSeconds">;

// 依原本的狀態流程推進：排隊、理解描述、載入模型、取樣 28 步、輸出、檢查、完成
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

const base: Job = {
  id: "job_8f2a",
  prompt: "Girl in a yellow raincoat on a rooftop at dusk, soft film grain, warm city lights",
  status: "queued",
  sourceSrc: reference,
  aspect: "2 / 3",
  count: 2,
  meta: ["Just now", "Soft anime", "With reference"],
};

const failed: Job = {
  id: "job_71cd",
  prompt: "Two cats playing chess in a sunlit library",
  status: "error",
  error: "The GPU ran out of memory.",
  hint: "Try again in a moment. Your quota was not used.",
};

export default function JobProgressDemo() {
  const [i, setI] = useState(0);
  const [canceled, setCanceled] = useState(false);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (canceled || i >= timeline.length - 1) return;
    const id = setTimeout(() => setI((n) => n + 1), 1400);
    return () => clearTimeout(id);
  }, [i, canceled, run]);

  const frame = timeline[i];
  const job: Job = canceled ? { ...base, status: "canceled", durationSeconds: 6 } : { ...base, ...frame, durationSeconds: frame.status === "done" ? 52 : null, images: frame.status === "done" ? 2 : 0 };
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  return (
    <div className="flex w-full max-w-3xl min-w-0 flex-col gap-6">
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid min-w-0 grid-cols-2 gap-3">
          {job.status === "done" ? (
            // 完成後格子換成成品圖
            <img src={reference} alt={base.prompt} className="aspect-[2/3] w-full rounded-lg object-cover" />
          ) : (
            <JobTile
              job={job}
              onCancel={async () => {
                await wait(500);
                setCanceled(true);
              }}
            />
          )}
          <JobTile job={failed} onRemove={() => wait(400)} />
        </div>
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
            setRun((r) => r + 1);
          }}
        >
          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-medium text-muted-foreground">Your prompt</h3>
            <p className="text-sm text-pretty">{base.prompt}</p>
          </section>
        </JobPanel>
      </div>

      <section aria-labelledby="active-heading" className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h3 id="active-heading" className="text-sm font-semibold">
            In progress
          </h3>
          <JobStatusDot state="running">2 running</JobStatusDot>
        </div>
        <div className="divide-y divide-border">
          <JobRow title="Refero Styles: design systems for AI" source={{ kind: "url", label: "URL" }} progress={62} label="Composing voice and visuals" href="#project-1" />
          <JobRow title="Perfect matcha latte ratio" source={{ kind: "text", label: "Text" }} progress={0} label="" failed href="#project-2" />
        </div>
      </section>
    </div>
  );
}
