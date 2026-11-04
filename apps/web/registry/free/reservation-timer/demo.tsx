"use client";

import { useState } from "react";

import { ReservationExpiredPanel, ReservationTimer } from "./reservation-timer";

const card = "rounded-[12px] border border-[#F0E4D8] bg-[#FFFDF9] dark:border-[rgba(246,235,227,0.07)] dark:bg-[#271E1B]";
const text1 = "text-[#3B2A26] dark:text-[#F6EBE3]";
const text2 = "text-[#6F574F] dark:text-[#C9B5AA]";
const accentButton =
  "inline-flex items-center justify-center rounded-full bg-[#B4586C] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B4586C] dark:bg-[#E896A6] dark:text-[#2A1418]";

// 商品封面：用 CSS 漸層與 inline SVG 代替角色圖
function Cover() {
  return (
    <div className="grid aspect-[4/3] w-full place-items-center bg-[radial-gradient(120%_80%_at_80%_0%,rgba(242,201,138,0.35),transparent_60%),linear-gradient(180deg,#FDF8F2_0%,#FBF5EE_100%)] dark:bg-[radial-gradient(120%_80%_at_80%_0%,rgba(226,178,108,0.14),transparent_60%),linear-gradient(180deg,#211917_0%,#1C1513_100%)]">
      <svg viewBox="0 0 120 120" className="h-3/5" aria-hidden>
        <path d="M30 52 38 22l18 20M90 52l-8-30-18 20" className="fill-[#F6E1E3] stroke-[#B4586C] dark:fill-[#3A2328] dark:stroke-[#E896A6]" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="60" cy="66" r="34" className="fill-[#F6E1E3] stroke-[#B4586C] dark:fill-[#3A2328] dark:stroke-[#E896A6]" strokeWidth="3" />
        <circle cx="48" cy="64" r="4" className="fill-[#3B2A26] dark:fill-[#F6EBE3]" />
        <circle cx="72" cy="64" r="4" className="fill-[#3B2A26] dark:fill-[#F6EBE3]" />
        <path d="M54 76q6 5 12 0" fill="none" className="stroke-[#3B2A26] dark:stroke-[#F6EBE3]" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function ReservationTimerDemo() {
  // 獨家授權的保留時間，進頁面時已經剩最後幾分鐘
  const [expiresAt] = useState(() => Date.now() + (2 * 60 + 30) * 1000);
  const [expired, setExpired] = useState(false);

  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <article className={`${card} min-w-0 overflow-hidden`}>
        <Cover />
        <div className="flex flex-col gap-3 p-5">
          <h2 className={`text-[22px] tracking-[0.02em] ${text1}`}>Momo the Study Cat</h2>
          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            <span className={`rounded-full border border-[#F0E4D8] px-2.5 py-0.5 dark:border-[rgba(246,235,227,0.07)] ${text2}`}>Ready to stream</span>
            <span className="rounded-full border border-[#3D6A86]/30 bg-[#E3EEF4] px-2.5 py-0.5 text-[#3D6A86] dark:bg-[rgba(159,195,217,0.12)] dark:text-[#9FC3D9]">
              Exclusive license
            </span>
          </div>
          <p className={`text-[13px] ${text2}`}>Exclusive license: this character is licensed to one buyer only.</p>
          <div className="flex items-baseline justify-between gap-3 border-t border-[#F0E4D8] dark:border-[rgba(246,235,227,0.07)]">
            <span className="pt-3 text-[13px] text-[#7E655C] dark:text-[#A99288]">Total</span>
            <span className={`pt-3 text-[22px] font-bold tabular-nums ${text1}`}>NT$12,800</span>
          </div>
        </div>
      </article>

      <section aria-label="Checkout" className={`${card} flex h-fit min-w-0 flex-col gap-2 p-6`}>
        {expired ? (
          <ReservationExpiredPanel
            action={
              <a href="#shop" className={`${accentButton} h-10 px-4 text-[14px]`}>
                Back to the item
              </a>
            }
          />
        ) : (
          <>
            <div className="mb-4">
              <ReservationTimer expiresAt={expiresAt} onExpire={() => setExpired(true)} />
            </div>
            <div className="flex flex-col gap-5">
              <h2 className={`text-[22px] tracking-[0.02em] ${text1}`}>Payment</h2>
              <button type="button" className={`${accentButton} h-12 w-full text-[15px]`}>
                Go to payment NT$12,800
              </button>
            </div>
            <div className="mt-4 flex justify-end border-t border-[#F0E4D8] pt-4 dark:border-[rgba(246,235,227,0.07)]">
              <button type="button" className={`rounded-[10px] px-3 py-1.5 text-[13px] font-semibold ${text2}`}>
                Cancel order
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
