"use client";

import { useRef, useState, type ReactNode } from "react";

import { PaymentStatusBanner } from "./payment-status-banner";

// 原站的暗色頁面：黑底、半透明卡片、白字分層
function Page({ title, meta, banner, children }: { title: string; meta: string; banner: ReactNode; children: ReactNode }) {
  return (
    <div className="relative min-w-0 overflow-hidden rounded-[12px] border border-white/10 bg-black text-[15px] text-white/90">
      <div className="flex h-14 items-center gap-2 border-b border-white/5 bg-black/85 px-6">
        <span className="size-2 rounded-full bg-[#F5C045]" aria-hidden />
        <span className="text-[13px] font-bold">AI Studio Class</span>
      </div>
      {banner}
      <div className="flex flex-col gap-3 p-6">
        <p className="text-[12px] font-black tracking-[0.22em] text-[#F5C045]">{meta}</p>
        <h3 className="text-[22px] leading-snug font-black">{title}</h3>
        {children}
      </div>
    </div>
  );
}

export default function PaymentStatusBannerDemo() {
  // 模擬 webhook：第二次重新整理時課程已開通
  const [unlocked, setUnlocked] = useState(false);
  const refreshes = useRef(0);

  return (
    <div className="grid w-full max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2">
      <Page
        title="Build small tools with AI in one hour"
        meta="COURSE"
        banner={
          <PaymentStatusBanner
            fixed={false}
            status="pending"
            unlocked={unlocked}
            onRefresh={() => {
              refreshes.current += 1;
              if (refreshes.current >= 2) setUnlocked(true);
            }}
            successHref="#lesson-1"
          />
        }
      >
        <p className="text-white/60">12 lessons, about 3 hours. Watch at your own pace and replay any time.</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {["Lesson 1: Your first prompt", "Lesson 2: Checking what AI made"].map((l) => (
            <div key={l} className="min-w-0 rounded-[10px] border border-white/5 bg-white/5 px-4 py-3 text-[13px]">
              {l}
            </div>
          ))}
        </div>
      </Page>

      <Page
        title="Starter bundle: 3 courses"
        meta="BUNDLE"
        banner={<PaymentStatusBanner fixed={false} status="failed" unlocked={false} />}
      >
        <p className="text-white/60">You have not been charged. Pick a payment method below to try again.</p>
        <button type="button" className="h-11 rounded-[10px] bg-[#F5C045] px-5 text-[14px] font-bold text-black sm:self-start">
          Buy bundle NT$2,490
        </button>
      </Page>
    </div>
  );
}
