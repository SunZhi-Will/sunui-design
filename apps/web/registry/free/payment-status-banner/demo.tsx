"use client";

import { useRef, useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { PaymentStatusBanner } from "./payment-status-banner";

const copy = {
  en: { eyebrow: "COURSE", title: "Build small tools with AI in one hour", body: "12 lessons, about 3 hours. Watch at your own pace and replay any time." },
  "zh-TW": { eyebrow: "課程", title: "一小時用 AI 打造小工具", body: "12 堂課，約 3 小時。依自己的步調觀看，隨時都能重看。" },
  "zh-CN": { eyebrow: "课程", title: "一小时用 AI 打造小工具", body: "12 节课，约 3 小时。按自己的节奏观看，随时可以回看。" },
  ja: { eyebrow: "講座", title: "1 時間で AI を使って小さなツールを作る", body: "全 12 回、約 3 時間。自分のペースで視聴でき、いつでも見返せます。" },
};

export default function PaymentStatusBannerDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  // 模擬 webhook：第二次重新整理時課程已開通
  const [unlocked, setUnlocked] = useState(false);
  const refreshes = useRef(0);

  return (
    <div className="relative w-full max-w-xl min-w-0 overflow-hidden rounded-[12px] border border-white/10 bg-black text-[15px] text-white/90">
      <div className="flex h-14 items-center gap-2 border-b border-white/5 bg-black/85 px-6">
        <span className="size-2 rounded-full bg-[#F5C045]" aria-hidden />
        <span className="text-[13px] font-bold">AI Studio Class</span>
      </div>
      <PaymentStatusBanner
        fixed={false}
        locale={locale}
        status="pending"
        unlocked={unlocked}
        onRefresh={() => {
          refreshes.current += 1;
          if (refreshes.current >= 2) setUnlocked(true);
        }}
        successHref="#lesson-1"
      />
      <div className="flex flex-col gap-3 p-6">
        <p className="text-[12px] font-black tracking-[0.22em] text-[#F5C045]">{t.eyebrow}</p>
        <h3 className="text-[22px] leading-snug font-black">{t.title}</h3>
        <p className="text-white/60">{t.body}</p>
      </div>
    </div>
  );
}
