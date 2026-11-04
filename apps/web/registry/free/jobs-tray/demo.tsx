"use client";

import { useEffect } from "react";

import { JobsTray, useJobs, type Job } from "./jobs-tray";

const exports: { id: string; label: string; detail: string; speed: number; failAt?: number }[] = [
  { id: "orders", label: "Export orders.csv", detail: "October, 1,284 rows", speed: 0.07 },
  { id: "invoices", label: "Build invoice PDFs", detail: "212 invoices", speed: 0.04, failAt: 0.62 },
  { id: "images", label: "Resize product images", detail: "86 of 140 photos", speed: 0.025 },
];

export default function JobsTrayDemo() {
  const { jobs, setJobs, update, remove } = useJobs(
    exports.map<Job>((e) => ({ id: e.id, label: e.label, detail: e.detail, state: "running", progress: 0 })),
  );
  // 每個匯出依自己的速度前進，發票那一個會在中途失敗
  useEffect(() => {
    const timer = setInterval(() => {
      setJobs((prev) =>
        prev.map((job) => {
          if (job.state !== "running") return job;
          const spec = exports.find((e) => e.id === job.id)!;
          const next = Math.min(1, (job.progress ?? 0) + spec.speed);
          if (spec.failAt && next >= spec.failAt && !job.detail?.toString().startsWith("Retry")) {
            return { ...job, state: "failed", error: "Invoice #4471 has no billing address. Add it and retry." };
          }
          return next >= 1 ? { ...job, state: "done", progress: 1 } : { ...job, progress: next };
        }),
      );
    }, 400);
    return () => clearInterval(timer);
  }, [setJobs]);

  return (
    <div className="relative h-[28rem] w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-background">
      <div className="border-b border-border px-5 py-4">
        <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">Reports</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">Month end close</h2>
      </div>
      <div className="space-y-3 p-5 text-sm">
        {["Orders", "Invoices", "Product media", "Payouts"].map((row) => (
          <div key={row} className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
            <span>{row}</span>
            <span className="text-xs text-muted-foreground">Keep working while exports run</span>
          </div>
        ))}
      </div>

      <JobsTray
        fixed={false}
        jobs={jobs}
        onRetry={(id) => update(id, { state: "running", progress: 0.62, detail: "Retrying with the fixed address", error: undefined })}
        onDismiss={remove}
      />
    </div>
  );
}
