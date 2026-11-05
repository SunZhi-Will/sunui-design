"use client";

import { useEffect, useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { JobTile, type Job } from "./job-tile";

// 參考圖用內嵌 SVG 畫一張簡單的人像剪影，不用外部圖片
const reference =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7e5e4"/><stop offset="1" stop-color="#d6d3d1"/></linearGradient></defs><rect width="200" height="300" fill="url(#g)"/><circle cx="150" cy="60" r="26" fill="#fafaf9"/><path d="M0 230 Q60 190 110 220 T200 210 V300 H0Z" fill="#a8a29e"/><circle cx="100" cy="130" r="34" fill="#475569"/><path d="M48 300 Q50 190 100 180 Q150 190 152 300Z" fill="#334155"/></svg>`,
  );

type Frame = Pick<Job, "status" | "step" | "total" | "queuePosition" | "etaSeconds">;

// 排隊、理解描述、載入模型、取樣 28 步、輸出、檢查、完成
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

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const prompts = {
  en: "Girl in a yellow raincoat on a rooftop at dusk, soft film grain, warm city lights",
  "zh-TW": "黃昏的屋頂上穿黃色雨衣的女孩，柔和底片顆粒，溫暖的城市燈光",
  "zh-CN": "黄昏的屋顶上穿黄色雨衣的女孩，柔和胶片颗粒，温暖的城市灯光",
  ja: "夕暮れの屋上に立つ黄色いレインコートの少女、やわらかなフィルムグレイン、温かな街の灯り",
};

export default function JobTileDemo() {
  const locale = useDemoLocale();
  const prompt = useDemoText(prompts);
  const [i, setI] = useState(0);
  const [canceled, setCanceled] = useState(false);

  useEffect(() => {
    if (canceled) return;
    // 完成後停留一下再重新開始一次生成
    const id = setTimeout(() => setI((n) => (n + 1) % timeline.length), timeline[i].status === "done" ? 3000 : 1400);
    return () => clearTimeout(id);
  }, [i, canceled]);

  const job: Job = { id: "job_8f2a", prompt, sourceSrc: reference, aspect: "2 / 3", count: 2, ...timeline[i], ...(canceled ? { status: "canceled" } : null) };

  return (
    <div className="w-full max-w-[12rem] min-w-0">
      {job.status === "done" ? (
        // 完成後格子換成成品圖
        <img src={reference} alt={prompt} className="aspect-[2/3] w-full rounded-lg object-cover" />
      ) : (
        <JobTile
          locale={locale}
          job={job}
          onCancel={async () => {
            await wait(500);
            setCanceled(true);
          }}
          // 移除取消的紀錄後，重新送出同一個描述
          onRemove={async () => {
            await wait(400);
            setCanceled(false);
            setI(0);
          }}
        />
      )}
    </div>
  );
}
