"use client";

import { useEffect, useState } from "react";

import { JobProgress, type JobStatus } from "./job-progress";

const printSteps = [
  { id: "proof", label: "Checking your artwork" },
  { id: "color", label: "Matching colors to paper" },
  { id: "print", label: "Printing" },
  { id: "trim", label: "Trimming and inspecting" },
  { id: "pack", label: "Packing in a tube" },
];

// 模擬一張海報從排隊到完成；一律依時間推進，不放測試按鈕
const timeline: JobStatus[] = [
  { state: "queued", queuePosition: 2 },
  { state: "queued", queuePosition: 1 },
  { state: "running", step: 0, eta: "6 min" },
  { state: "running", step: 1, eta: "5 min", reason: "Matte paper takes an extra color pass." },
  { state: "running", step: 2, eta: "3 min", reason: "Matte paper takes an extra color pass." },
  { state: "running", step: 3, eta: "1 min" },
  { state: "running", step: 4, eta: "1 min" },
  { state: "running", step: 5 },
  { state: "done" },
];

const exportSteps = [
  { id: "a", label: "Preparing files" },
  { id: "b", label: "Rendering" },
  { id: "c", label: "Uploading" },
];

export default function JobProgressDemo() {
  const [i, setI] = useState(0);
  const [retried, setRetried] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (cancelled || i >= timeline.length - 1) return;
    const id = setTimeout(() => setI((n) => n + 1), 1800);
    return () => clearTimeout(id);
  }, [i, cancelled]);

  const live: JobStatus = cancelled
    ? { state: "failed", step: timeline[i].step ?? 0, error: "Order cancelled. You haven't been charged." }
    : timeline[i];

  return (
    <section aria-labelledby="orders-heading" className="w-full max-w-[52rem] space-y-5">
      <div>
        <h2 id="orders-heading" className="text-xl font-semibold tracking-tight">
          Your print orders
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Custom posters are printed to order. We'll email you when each one ships.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <JobProgress
          jobId="PR-20931"
          steps={printSteps}
          status={live}
          onCancel={() => setCancelled(true)}
          onRetry={() => {
            setCancelled(false);
            setI(0);
          }}
          result={{ label: "Track delivery", href: "#" }}
        />
        <JobProgress jobId="PR-20874" steps={printSteps} status={{ state: "done" }} result={{ label: "Track delivery", href: "#" }} />
      </div>

      <div className="rounded-md border border-border bg-card px-4 text-card-foreground">
        <div className="divide-y divide-border">
          <JobProgress compact jobId="PR-20940" steps={printSteps} status={{ state: "queued", queuePosition: 3 }} />
          <JobProgress compact jobId="EX-1182" steps={exportSteps} status={{ state: "running", step: 1 }} />
          <JobProgress
            compact
            jobId="EX-1179"
            steps={exportSteps}
            status={retried ? { state: "running", step: 2 } : { state: "failed", step: 2, error: "Upload timed out" }}
            onRetry={() => setRetried(true)}
          />
        </div>
      </div>
    </section>
  );
}
