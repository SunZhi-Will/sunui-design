"use client";

import { useState } from "react";

import { ReservationExpiredPanel, ReservationTimer } from "./reservation-timer";

const holdButton =
  "inline-flex h-9 items-center justify-center rounded-full bg-[#B4586C] px-4 text-[13px] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B4586C] dark:bg-[#E896A6] dark:text-[#2A1418]";

/** 型錄卡片：只剩 30 秒的保留倒數，歸零後換成已逾期面板，可重新保留再看一次。 */
export default function ReservationTimerCard() {
  const [expiresAt, setExpiresAt] = useState(() => Date.now() + 30 * 1000);
  const [expired, setExpired] = useState(false);

  return (
    <div className="mx-auto w-72">
      {expired ? (
        <ReservationExpiredPanel
          title="Order expired"
          action={
            <button
              type="button"
              className={holdButton}
              onClick={() => {
                setExpiresAt(Date.now() + 30 * 1000);
                setExpired(false);
              }}
            >
              Hold it again
            </button>
          }
        >
          The hold has ended and the item is back on sale.
        </ReservationExpiredPanel>
      ) : (
        <ReservationTimer key={expiresAt} expiresAt={expiresAt} onExpire={() => setExpired(true)} />
      )}
    </div>
  );
}
