"use client";

import { useRef, useState } from "react";

import { PaymentStatusBanner } from "./payment-status-banner";

export default function PaymentStatusBannerDemo() {
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
        status="pending"
        unlocked={unlocked}
        onRefresh={() => {
          refreshes.current += 1;
          if (refreshes.current >= 2) setUnlocked(true);
        }}
        successHref="#lesson-1"
      />
      <div className="flex flex-col gap-3 p-6">
        <p className="text-[12px] font-black tracking-[0.22em] text-[#F5C045]">COURSE</p>
        <h3 className="text-[22px] leading-snug font-black">Build small tools with AI in one hour</h3>
        <p className="text-white/60">12 lessons, about 3 hours. Watch at your own pace and replay any time.</p>
      </div>
    </div>
  );
}
