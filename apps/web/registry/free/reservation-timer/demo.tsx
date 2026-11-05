"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ReservationExpiredPanel, ReservationTimer } from "./reservation-timer";

const text1 = "text-[#3B2A26] dark:text-[#F6EBE3]";
const text2 = "text-[#6F574F] dark:text-[#C9B5AA]";
const accentButton =
  "inline-flex items-center justify-center rounded-full bg-[#B4586C] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B4586C] dark:bg-[#E896A6] dark:text-[#2A1418]";

const copy = {
  en: { section: "Checkout", back: "Back to the item", item: "Momo the Study Cat, exclusive license", pay: "Go to payment" },
  "zh-TW": { section: "結帳", back: "回到商品頁", item: "讀書貓 Momo，獨家授權", pay: "前往付款" },
  "zh-CN": { section: "结账", back: "返回商品页", item: "读书猫 Momo，独家授权", pay: "前往付款" },
  ja: { section: "お会計", back: "商品ページに戻る", item: "勉強ネコ Momo、独占ライセンス", pay: "お支払いへ進む" },
};

export default function ReservationTimerDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  // 獨家授權的保留時間，進頁面時已經剩最後幾分鐘
  const [expiresAt] = useState(() => Date.now() + (2 * 60 + 30) * 1000);
  const [expired, setExpired] = useState(false);

  return (
    <section
      aria-label={t.section}
      className="flex w-full max-w-md min-w-0 flex-col gap-2 rounded-[12px] border border-[#F0E4D8] bg-[#FFFDF9] p-6 dark:border-[rgba(246,235,227,0.07)] dark:bg-[#271E1B]"
    >
      {expired ? (
        <ReservationExpiredPanel
          locale={locale}
          action={
            <a href="#shop" className={`${accentButton} h-10 px-4 text-[14px]`}>
              {t.back}
            </a>
          }
        />
      ) : (
        <>
          <div className="mb-4">
            <ReservationTimer locale={locale} expiresAt={expiresAt} onExpire={() => setExpired(true)} />
          </div>
          <div className="flex min-w-0 items-baseline justify-between gap-3">
            <span className={`truncate text-[15px] ${text2}`}>{t.item}</span>
            <span className={`shrink-0 text-[18px] font-bold tabular-nums ${text1}`}>NT$12,800</span>
          </div>
          <button type="button" className={`${accentButton} mt-4 h-12 w-full text-[15px]`}>
            {t.pay} NT$12,800
          </button>
        </>
      )}
    </section>
  );
}
