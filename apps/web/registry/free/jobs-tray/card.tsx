"use client";

import { useEffect, useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { JobRow } from "./job-views";
import { JobsTray, useBackgroundJobs, type Job } from "./jobs-tray";

type Frame = Pick<Job, "status" | "step" | "total" | "queuePosition" | "etaSeconds">;

// 排隊、理解描述、載入模型、取樣 28 步、輸出、完成；完成後停 3 拍再從頭
const timeline: Frame[] = [
  { status: "queued", queuePosition: 2, etaSeconds: 40 },
  { status: "queued", queuePosition: 1, etaSeconds: 32 },
  { status: "planning", etaSeconds: 28 },
  { status: "loading", etaSeconds: 24 },
  ...Array.from({ length: 7 }, (_, i): Frame => ({ status: "sampling", step: (i + 1) * 4, total: 28, etaSeconds: 20 - i * 2.5 })),
  { status: "decoding", etaSeconds: 3 },
  { status: "done" },
];
const LOOP = timeline.length + 3;
const frameAt = (n: number) => timeline[Math.min(n % LOOP, timeline.length - 1)];

const copy = {
  en: { queue: "Queue", rows: ["Ceramic mug on linen, morning light", "Night market poster, neon signs"], upscale: "Upscale · rooftop-dusk.png", sync: "Sync to shared drive" },
  "zh-TW": { queue: "佇列", rows: ["亞麻布上的陶瓷杯，清晨窗光", "夜市海報，手寫霓虹招牌"], upscale: "放大 · rooftop-dusk.png", sync: "同步到共用雲端硬碟" },
  "zh-CN": { queue: "队列", rows: ["亚麻布上的陶瓷杯，清晨窗光", "夜市海报，手写霓虹招牌"], upscale: "放大 · rooftop-dusk.png", sync: "同步到共享云盘" },
  ja: { queue: "キュー", rows: ["リネンの上の陶器のマグ、朝の光", "夜市のポスター、ネオン看板"], upscale: "高解像度化 · rooftop-dusk.png", sync: "共有ドライブへ同期" },
};

/** 型錄卡片：佇列裡兩張圖一路從排隊跑到完成，右下角的工作匣同時在背景放大，另一個同步失敗留著等你關。 */
export default function JobsTrayCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [tick, setTick] = useState(6);
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!document.hidden) setTick((n) => n + 1);
    }, 1400);
    return () => window.clearInterval(id);
  }, []);

  const { jobs, startJob, updateJob, finishJob, dismissJob, cancelJob } = useBackgroundJobs();
  useEffect(() => {
    let p = 0.35;
    let timer: ReturnType<typeof setInterval> | undefined;
    const up = startJob("export", t.upscale, {
      onCancel: () => {
        clearInterval(timer);
        cancelJob(up);
      },
    });
    updateJob(up, { progress: p });
    timer = setInterval(() => {
      p = Math.min(1, p + 0.03);
      updateJob(up, { progress: p });
      if (p >= 1) {
        clearInterval(timer);
        finishJob(up);
      }
    }, 600);
    const sync = startJob("sync", t.sync);
    const fail = setTimeout(() => finishJob(sync, { success: false, errorCode: "DRIVE_QUOTA_EXCEEDED" }), 1200);
    return () => {
      clearInterval(timer);
      clearTimeout(fail);
      dismissJob(up);
      dismissJob(sync);
    };
  }, [cancelJob, dismissJob, finishJob, startJob, t.sync, t.upscale, updateJob]);

  const rows: Job[] = [
    { id: "job_a1", prompt: t.rows[0], ...frameAt(tick + 5), images: 1 },
    { id: "job_a2", prompt: t.rows[1], ...frameAt(tick), images: 1 },
  ];

  return (
    <div className="relative mx-auto h-[17.5rem] w-[21rem] overflow-hidden rounded-xl border border-border bg-background text-foreground">
      <h4 className="px-4 pt-3 pb-1 text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">{t.queue}</h4>
      <div className="divide-y divide-border">
        {rows.map((job) => (
          <JobRow key={job.id} job={job} locale={locale} href={`#${job.id}`} />
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-24 border-t border-border bg-muted/40">
        <JobsTray fixed={false} locale={locale} jobs={jobs} onDismiss={dismissJob} className="bottom-3 right-3" />
      </div>
    </div>
  );
}
