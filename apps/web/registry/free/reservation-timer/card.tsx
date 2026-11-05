"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ReservationExpiredPanel, ReservationTimer } from "./reservation-timer";

const holdButton =
  "inline-flex h-9 items-center justify-center rounded-full bg-[#B4586C] px-4 text-[13px] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B4586C] dark:bg-[#E896A6] dark:text-[#2A1418]";

/** 型錄卡片：只剩 30 秒的保留倒數，歸零後換成已逾期面板，可重新保留再看一次。 */
const copy = {
  en: { again: "Hold it again", body: "The hold has ended and the item is back on sale." },
  "zh-TW": { again: "重新保留", body: "保留時間已結束，商品重新開放購買。" },
  "zh-CN": { again: "重新保留", body: "保留时间已结束，商品重新开放购买。" },
  ja: { again: "もう一度取り置く", body: "お取り置き期間が終了し、商品は再び販売中です。" },
};

export default function ReservationTimerCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [expiresAt, setExpiresAt] = useState(() => Date.now() + 30 * 1000);
  const [expired, setExpired] = useState(false);

  return (
    <div className="mx-auto w-72">
      {expired ? (
        <ReservationExpiredPanel
          locale={locale}
          action={
            <button
              type="button"
              className={holdButton}
              onClick={() => {
                setExpiresAt(Date.now() + 30 * 1000);
                setExpired(false);
              }}
            >
              {t.again}
            </button>
          }
        >
          {t.body}
        </ReservationExpiredPanel>
      ) : (
        <ReservationTimer key={expiresAt} locale={locale} expiresAt={expiresAt} onExpire={() => setExpired(true)} />
      )}
    </div>
  );
}
