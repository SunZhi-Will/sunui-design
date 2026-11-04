"use client";

import { useEffect, useState } from "react";

import { JobRow, JobStatusDot } from "./job-row";

// Vozmira 控制台：一支影片專案從擷取網址到合成，進度依階段推進
const stages = [
  { until: 20, label: "Reading the page" },
  { until: 45, label: "Writing the script" },
  { until: 80, label: "Composing voice and visuals" },
  { until: 100, label: "Rendering" },
];

export default function JobRowDemo() {
  const [progress, setProgress] = useState(4);

  useEffect(() => {
    if (progress >= 100) return;
    const id = setTimeout(() => setProgress((p) => Math.min(100, p + 6)), 1200);
    return () => clearTimeout(id);
  }, [progress]);

  const done = progress >= 100;
  const label = done ? "Ready" : (stages.find((s) => progress < s.until) ?? stages[stages.length - 1]).label;

  return (
    <section aria-labelledby="active-heading" className="w-full max-w-xl min-w-0 overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h3 id="active-heading" className="text-sm font-semibold">
          In progress
        </h3>
        <JobStatusDot state={done ? "completed" : "running"}>{done ? "1 ready" : "1 running"}</JobStatusDot>
      </div>
      <JobRow title="Refero Styles: design systems for AI" source={{ kind: "url", label: "URL" }} progress={progress} label={label} href="#project-1" />
    </section>
  );
}
