"use client";

import { useRef, useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { PaymentStatusBanner } from "./payment-status-banner";

const copy = {
  en: { pending: "Confirming your payment…", success: "Payment received!", successLink: "Start →", course: "Build small tools with AI", replay: "Replay" },
  "zh-TW": { pending: "正在確認付款…", success: "付款成功！", successLink: "開始 →", course: "用 AI 打造小工具", replay: "重播" },
  "zh-CN": { pending: "正在确认支付…", success: "支付成功！", successLink: "开始 →", course: "用 AI 打造小工具", replay: "重播" },
  ja: { pending: "お支払いを確認中…", success: "お支払い完了！", successLink: "始める →", course: "AI で小さなツールを作る", replay: "もう一度" },
};

/** 型錄卡片：付款確認中的橫幅自己輪詢，第二次查詢開通後切成成功。 */
export default function PaymentStatusBannerCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [run, setRun] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const refreshes = useRef(0);

  // 重播：重新掛載橫幅並把模擬的 webhook 歸零
  const replay = () => {
    refreshes.current = 0;
    setUnlocked(false);
    setRun((r) => r + 1);
  };

  return (
    <div className="relative mx-auto w-[300px] overflow-hidden rounded-[12px] border border-white/10 bg-black text-[14px] text-white/90">
      <div className="flex h-11 items-center gap-2 border-b border-white/5 px-4">
        <span className="size-2 rounded-full bg-[#F5C045]" aria-hidden />
        <span className="text-[13px] font-bold">AI Studio Class</span>
      </div>
      <PaymentStatusBanner
        key={run}
        fixed={false}
        status="pending"
        unlocked={unlocked}
        interval={1500}
        className="px-4"
        locale={locale}
        labels={{ pending: t.pending, success: t.success, successLink: t.successLink }}
        onRefresh={() => {
          refreshes.current += 1;
          if (refreshes.current >= 2) setUnlocked(true);
        }}
        onDismiss={replay}
        successHref="#lesson-1"
      />
      <div className="flex items-center justify-between gap-3 p-4">
        <p className="text-[15px] leading-snug font-black">{t.course}</p>
        <button type="button" onClick={replay} className="shrink-0 text-xs text-white/60 underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none">
          {t.replay}
        </button>
      </div>
    </div>
  );
}
