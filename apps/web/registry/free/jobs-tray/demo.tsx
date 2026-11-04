"use client";

import { useEffect, useState } from "react";

import { JobsTray, UpdateBanner, useBackgroundJobs, type UpdaterEvent } from "./jobs-tray";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function JobsTrayDemo() {
  const { jobs, startJob, updateJob, finishJob, dismissJob, cancelJob, runJob } = useBackgroundJobs();
  const [event, setEvent] = useState<UpdaterEvent>({ type: "idle" });

  // 停止錄影後，編輯器立刻可用，寫檔、波形、匯出都在背景跑
  useEffect(() => {
    let alive = true;
    const ids: string[] = [];
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    runJob("media-write", "Saving camera track", async (report) => {
      if (!alive) throw new Error("unmounted");
      for (let p = 0; p <= 1.001 && alive; p += 0.08) {
        report(p);
        await wait(450);
      }
    }).catch(() => {});

    const mic = startJob("media-write", "Saving microphone track");
    timeouts.push(setTimeout(() => finishJob(mic, { success: false, errorCode: "DISK_FULL: 0 bytes left on Recordings volume" }), 2600));

    const wave = startJob("waveform", "Building waveform");
    timeouts.push(setTimeout(() => finishJob(wave), 5200));

    let timer: ReturnType<typeof setInterval> | undefined;
    const exp = startJob("export", "Export · intro-take-3.mp4", {
      onCancel: () => {
        clearInterval(timer);
        cancelJob(exp);
      },
    });
    let p = 0;
    timer = setInterval(() => {
      p = Math.min(1, p + 0.03);
      updateJob(exp, { progress: p });
      if (p >= 1) {
        clearInterval(timer);
        finishJob(exp);
      }
    }, 600);

    ids.push(mic, wave, exp);
    timeouts.push(setTimeout(() => setEvent({ type: "available", version: "2.4.0" }), 900));
    // 卸載時收掉計時器與這輪登記的工作
    return () => {
      alive = false;
      clearInterval(timer);
      timeouts.forEach(clearTimeout);
      ids.forEach(dismissJob);
    };
  }, [cancelJob, dismissJob, finishJob, runJob, startJob, updateJob]);

  // 模擬 updater：下載後持續推 progress，最後 downloaded
  const download = async () => {
    for (let pct = 8; pct <= 100; pct += 12) {
      await wait(350);
      setEvent({ type: "progress", percent: Math.min(100, pct) });
    }
    await wait(300);
    setEvent({ type: "downloaded" });
    return { success: true };
  };

  return (
    <div className="relative h-[26rem] w-full max-w-3xl overflow-hidden rounded-[14px] border border-white/5 bg-[#111111] text-[#e5e5e5]">
      <UpdateBanner fixed={false} event={event} onDownload={download} onInstall={() => wait(60_000)} />

      {/* 編輯器示意：預覽與時間軸 */}
      <div className="flex h-full min-w-0 flex-col gap-3 p-4 pt-14">
        <div className="grid min-h-0 flex-1 place-items-center rounded-[14px] bg-[#1c1c1c]">
          <div className="aspect-video w-3/5 rounded-lg bg-[#0a0a0a]" />
        </div>
        <div className="space-y-1.5 rounded-[14px] bg-[#1c1c1c] p-3">
          <div className="h-5 w-[86%] rounded bg-[#eab308]/25" />
          <div className="h-5 w-[64%] rounded bg-white/10" />
          <div className="h-5 w-[72%] rounded bg-white/5" />
        </div>
      </div>

      <JobsTray fixed={false} jobs={jobs} onDismiss={dismissJob} />
    </div>
  );
}
