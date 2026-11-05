"use client";

import { useEffect, useRef, useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { JobPanel, JobRow, JobStatusDot, JobTile } from "./job-views";
import { JobsTray, isActive, toBackgroundJob, useBackgroundJobs, type Job } from "./jobs-tray";

// 生圖工作室的控制台：右側是正在看的那一張（JobPanel），左側是佇列（JobRow）與最近的格子（JobTile），
// 匯出與同步在背景跑，收在右下角的工作匣（JobsTray）。所有版面吃同一個 Job 型別。

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
// 完成後停留 4 拍再從頭跑
const LOOP = timeline.length + 4;
const frameAt = (n: number) => timeline[Math.min(((n % LOOP) + LOOP) % LOOP, timeline.length - 1)];
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 參考圖用內嵌 SVG 畫一張簡單的人像剪影，不用外部圖片
const reference =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"><rect width="200" height="300" fill="#e7e5e4"/><circle cx="150" cy="60" r="26" fill="#fafaf9"/><path d="M0 230 Q60 190 110 220 T200 210 V300 H0Z" fill="#a8a29e"/><circle cx="100" cy="130" r="34" fill="#475569"/><path d="M48 300 Q50 190 100 180 Q150 190 152 300Z" fill="#334155"/></svg>`,
  );

const copy = {
  en: {
    studio: "Studio",
    queue: "Queue",
    recent: "Recent",
    exports: "Exports keep running while you work",
    running: (n: number) => `${n} running`,
    failed: (n: number) => `${n} failed`,
    text: "Text",
    panel: "Girl in a yellow raincoat on a rooftop at dusk, soft film grain, warm city lights",
    meta: ["Just now", "Soft anime"],
    yourPrompt: "Your prompt",
    rows: ["Ceramic mug on linen, morning window light", "Night market poster, hand-lettered neon signs", "Lighthouse keeper's cabin in a storm"],
    tiles: ["Portrait in a train window, rain streaks", "Cat asleep on a stack of library books", "Botanical study of a fern, ink and wash"],
    error: "The model server timed out",
    hint: "Your quota was refunded. Try again in a minute.",
    upscale: "Upscale · rooftop-dusk.png",
    sync: "Sync to shared drive",
  },
  "zh-TW": {
    studio: "工作室",
    queue: "佇列",
    recent: "最近",
    exports: "匯出在背景繼續跑，不影響你工作",
    running: (n: number) => `${n} 項進行中`,
    failed: (n: number) => `${n} 項失敗`,
    text: "文字",
    panel: "黃昏的屋頂上穿黃色雨衣的女孩，柔和的底片顆粒，溫暖的城市燈火",
    meta: ["剛剛", "柔和動漫"],
    yourPrompt: "你的描述",
    rows: ["亞麻布上的陶瓷杯，清晨窗光", "夜市海報，手寫霓虹招牌", "暴風雨中的燈塔守護人小屋"],
    tiles: ["火車窗邊的人像，雨痕", "睡在圖書館書堆上的貓", "蕨類的植物學素描，墨與淡彩"],
    error: "模型伺服器逾時",
    hint: "額度已退還，請一分鐘後再試。",
    upscale: "放大 · rooftop-dusk.png",
    sync: "同步到共用雲端硬碟",
  },
  "zh-CN": {
    studio: "工作室",
    queue: "队列",
    recent: "最近",
    exports: "导出在后台继续进行，不影响你工作",
    running: (n: number) => `${n} 项进行中`,
    failed: (n: number) => `${n} 项失败`,
    text: "文字",
    panel: "黄昏的屋顶上穿黄色雨衣的女孩，柔和的胶片颗粒，温暖的城市灯火",
    meta: ["刚刚", "柔和动漫"],
    yourPrompt: "你的描述",
    rows: ["亚麻布上的陶瓷杯，清晨窗光", "夜市海报，手写霓虹招牌", "暴风雨中的灯塔看守人小屋"],
    tiles: ["火车窗边的人像，雨痕", "睡在图书馆书堆上的猫", "蕨类的植物学素描，墨与淡彩"],
    error: "模型服务器超时",
    hint: "额度已退还，请一分钟后再试。",
    upscale: "放大 · rooftop-dusk.png",
    sync: "同步到共享云盘",
  },
  ja: {
    studio: "スタジオ",
    queue: "キュー",
    recent: "最近",
    exports: "書き出しは作業中も裏で続きます",
    running: (n: number) => `${n} 件実行中`,
    failed: (n: number) => `${n} 件失敗`,
    text: "テキスト",
    panel: "夕暮れの屋上に立つ黄色いレインコートの少女、やわらかなフィルムグレイン、あたたかな街の灯り",
    meta: ["たった今", "やわらかアニメ"],
    yourPrompt: "プロンプト",
    rows: ["リネンの上の陶器のマグ、朝の窓の光", "夜市のポスター、手描きのネオン看板", "嵐の中の灯台守の小屋"],
    tiles: ["雨の筋が残る列車の窓辺の肖像", "図書館の本の山で眠る猫", "シダの植物画、墨と淡彩"],
    error: "モデルサーバーがタイムアウトしました",
    hint: "利用枠は返却済みです。1 分ほどしてから再試行してください。",
    upscale: "高解像度化 · rooftop-dusk.png",
    sync: "共有ドライブへ同期",
  },
};

/** 只在畫面內、分頁可見時前進一拍（1.4 秒） */
function useTick() {
  const ref = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => {
      if (!document.hidden) setTick((n) => n + 1);
    }, 1400);
    return () => clearInterval(id);
  }, [visible]);
  return { ref, tick };
}

export default function JobsTrayDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const { ref, tick } = useTick();

  // 右側面板：可取消，取消後可重跑
  const [panelStart, setPanelStart] = useState(0);
  const [panelCanceled, setPanelCanceled] = useState(false);
  const panelFrame = frameAt(tick - panelStart);
  const panelDone = panelFrame.status === "done";
  const panelJob: Job = panelCanceled
    ? { id: "job_8f2a", prompt: t.panel, status: "canceled", durationSeconds: 6, meta: t.meta }
    : { id: "job_8f2a", prompt: t.panel, ...panelFrame, durationSeconds: panelDone ? 52 : null, images: panelDone ? 2 : 0, meta: t.meta };

  // 格子：生成中那一格可取消，取消後移除紀錄就重新送出
  const [tileStart, setTileStart] = useState(-5);
  const [tileCanceled, setTileCanceled] = useState(false);
  const [errorRemoved, setErrorRemoved] = useState(false);
  const tileFrame = frameAt(tick - tileStart);
  const tileJob: Job = { id: "job_31c0", prompt: t.tiles[0], sourceSrc: reference, aspect: "2 / 3", ...tileFrame, ...(tileCanceled ? { status: "canceled" } : null) };

  const rows: Job[] = [
    { id: "job_a1", prompt: t.rows[0], ...frameAt(tick + 7) },
    { id: "job_a2", prompt: t.rows[1], ...frameAt(tick + 1) },
    { id: "job_a3", prompt: t.rows[2], status: "error", error: t.error },
  ];
  const runningCount = [panelJob, tileJob, ...rows].filter(isActive).length;
  const failedCount = rows.filter((r) => r.status === "error").length + (errorRemoved ? 0 : 1);

  // 工作匣：背景放大（可取消）與一個失敗的同步（留到使用者關閉），再加上右側那張生成
  const { jobs, startJob, updateJob, finishJob, dismissJob, cancelJob } = useBackgroundJobs();
  useEffect(() => {
    let p = 0;
    let timer: ReturnType<typeof setInterval> | undefined;
    const up = startJob("export", t.upscale, {
      onCancel: () => {
        clearInterval(timer);
        cancelJob(up);
      },
    });
    timer = setInterval(() => {
      p = Math.min(1, p + 0.03);
      updateJob(up, { progress: p });
      if (p >= 1) {
        clearInterval(timer);
        finishJob(up);
      }
    }, 600);
    const sync = startJob("sync", t.sync);
    const fail = setTimeout(() => finishJob(sync, { success: false, errorCode: "DRIVE_QUOTA_EXCEEDED" }), 2400);
    return () => {
      clearInterval(timer);
      clearTimeout(fail);
      dismissJob(up);
      dismissJob(sync);
    };
  }, [cancelJob, dismissJob, finishJob, startJob, t.sync, t.upscale, updateJob]);
  const trayJobs = isActive(panelJob) ? [toBackgroundJob(panelJob), ...jobs] : jobs;

  return (
    <div ref={ref} className="relative w-full max-w-5xl min-w-0 overflow-hidden rounded-xl border border-border bg-background text-foreground">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">{t.studio}</h3>
        <div className="flex items-center gap-3">
          <JobStatusDot state={runningCount ? "running" : "waiting"}>{t.running(runningCount)}</JobStatusDot>
          {failedCount ? <JobStatusDot state="failed">{t.failed(failedCount)}</JobStatusDot> : null}
        </div>
      </header>

      <div className="grid min-w-0 md:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-5 py-4">
          <section aria-labelledby="jt-queue" className="min-w-0">
            <h4 id="jt-queue" className="px-4 pb-1 text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {t.queue}
            </h4>
            <div className="divide-y divide-border">
              {rows.map((job, i) => (
                <JobRow key={job.id} job={job} locale={locale} source={i === 1 ? { kind: "url", label: "URL" } : { kind: "text", label: t.text }} href={`#${job.id}`} />
              ))}
            </div>
          </section>

          <section aria-labelledby="jt-recent" className="min-w-0 px-4">
            <h4 id="jt-recent" className="pb-2 text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {t.recent}
            </h4>
            <div className="grid grid-cols-2 items-start gap-2 sm:grid-cols-3">
              {tileJob.status === "done" ? (
                <img src={reference} alt={tileJob.prompt} className="aspect-[2/3] w-full rounded-lg object-cover" />
              ) : (
                <JobTile
                  job={tileJob}
                  locale={locale}
                  onCancel={async () => {
                    await wait(500);
                    setTileCanceled(true);
                  }}
                  onRemove={async () => {
                    await wait(400);
                    setTileCanceled(false);
                    setTileStart(tick);
                  }}
                />
              )}
              {errorRemoved ? null : (
                <JobTile
                  job={{ id: "job_77e1", prompt: t.tiles[1], status: "error", error: t.error }}
                  locale={locale}
                  onRemove={async () => {
                    await wait(400);
                    setErrorRemoved(true);
                  }}
                />
              )}
              <JobTile job={{ id: "job_09bd", prompt: t.tiles[2], status: "done", images: 0, held: true }} locale={locale} />
            </div>
          </section>
        </div>

        <aside className="min-w-0 border-t border-border p-4 md:border-t-0 md:border-l">
          <JobPanel
            job={panelJob}
            locale={locale}
            onCancel={async () => {
              await wait(500);
              setPanelCanceled(true);
            }}
            onEdit={() => undefined}
            onRerun={async () => {
              await wait(500);
              setPanelCanceled(false);
              setPanelStart(tick);
            }}
          >
            <section className="flex flex-col gap-2">
              <h5 className="text-xs font-medium text-muted-foreground">{t.yourPrompt}</h5>
              <p className="text-sm text-pretty">{t.panel}</p>
            </section>
          </JobPanel>
        </aside>
      </div>

      {/* 工作匣在這一條裡定位；真實產品用預設的 fixed 貼在視窗右下 */}
      <div className="relative h-40 border-t border-border bg-muted/40">
        <p className="px-4 pt-3 text-xs text-muted-foreground">{t.exports}</p>
        <JobsTray fixed={false} locale={locale} jobs={trayJobs} onDismiss={dismissJob} />
      </div>
    </div>
  );
}
