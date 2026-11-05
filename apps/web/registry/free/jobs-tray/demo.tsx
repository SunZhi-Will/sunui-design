"use client";

import { useEffect } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { JobsTray, useBackgroundJobs } from "./jobs-tray";

export default function JobsTrayDemo() {
  const locale = useDemoLocale();
  const exportLabel = useDemoText({
    en: "Export · intro-take-3.mp4",
    "zh-TW": "匯出 · intro-take-3.mp4",
    "zh-CN": "导出 · intro-take-3.mp4",
    ja: "書き出し · intro-take-3.mp4",
  });
  const { jobs, startJob, updateJob, finishJob, dismissJob, cancelJob } = useBackgroundJobs();

  // 停止錄影後，編輯器立刻可用，匯出在背景跑
  useEffect(() => {
    let p = 0;
    let timer: ReturnType<typeof setInterval> | undefined;
    const exp = startJob("export", exportLabel, {
      onCancel: () => {
        clearInterval(timer);
        cancelJob(exp);
      },
    });
    timer = setInterval(() => {
      p = Math.min(1, p + 0.03);
      updateJob(exp, { progress: p });
      if (p >= 1) {
        clearInterval(timer);
        finishJob(exp);
      }
    }, 600);
    return () => {
      clearInterval(timer);
      dismissJob(exp);
    };
  }, [cancelJob, dismissJob, exportLabel, finishJob, startJob, updateJob]);

  return (
    <div className="relative h-80 w-full max-w-3xl overflow-hidden rounded-[14px] border border-white/5 bg-[#111111]">
      {/* 編輯器示意：預覽與時間軸 */}
      <div className="flex h-full min-w-0 flex-col gap-3 p-4">
        <div className="grid min-h-0 flex-1 place-items-center rounded-[14px] bg-[#1c1c1c]">
          <div className="aspect-video w-3/5 rounded-lg bg-[#0a0a0a]" />
        </div>
        <div className="space-y-1.5 rounded-[14px] bg-[#1c1c1c] p-3">
          <div className="h-5 w-[86%] rounded bg-[#eab308]/25" />
          <div className="h-5 w-[64%] rounded bg-white/10" />
        </div>
      </div>

      <JobsTray fixed={false} locale={locale} jobs={jobs} onDismiss={dismissJob} />
    </div>
  );
}
