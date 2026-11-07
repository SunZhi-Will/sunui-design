"use client";

import { useRef, useState } from "react";

import { useDemoAutoplay } from "@/lib/demo-autoplay";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ReservationTimer } from "./reservation-timer";

const MIN = 60_000;

const copy = {
  en: {
    section: "Checkout",
    seat: "Floor standing, block B, row 12",
    show: "Taipei Arena, Sat 11/21, 19:30",
    ticket: "1 ticket",
    fee: "Service fee",
    total: "Total",
    pay: "Pay",
    extend: "Need more time? Add 5 minutes",
    again: "Pick seats again",
  },
  "zh-TW": {
    section: "結帳",
    seat: "搖滾站區 B 區 12 排",
    show: "台北小巨蛋，11/21（六）19:30",
    ticket: "票券 1 張",
    fee: "手續費",
    total: "合計",
    pay: "付款",
    extend: "需要更多時間？延長 5 分鐘",
    again: "重新選位",
  },
  "zh-CN": {
    section: "结账",
    seat: "内场站区 B 区 12 排",
    show: "台北小巨蛋，11/21（六）19:30",
    ticket: "门票 1 张",
    fee: "手续费",
    total: "合计",
    pay: "付款",
    extend: "需要更多时间？延长 5 分钟",
    again: "重新选座",
  },
  ja: {
    section: "お会計",
    seat: "アリーナスタンディング B ブロック 12 列",
    show: "台北アリーナ、11/21（土）19:30",
    ticket: "チケット 1 枚",
    fee: "手数料",
    total: "合計",
    pay: "支払う",
    extend: "時間が足りない場合は 5 分延長",
    again: "座席を選び直す",
  },
};

// 票券的中性線稿，線寬 1.5
function TicketArt() {
  return (
    <svg viewBox="0 0 48 48" className="size-full p-2.5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" aria-hidden>
      <path d="M6 15a3 3 0 0 0 3-3h30a3 3 0 0 0 3 3v4a5 5 0 0 0 0 10v4a3 3 0 0 0-3 3H9a3 3 0 0 0-3-3v-4a5 5 0 0 0 0-10z" />
      <path d="M31 13v22" strokeDasharray="2 3" />
    </svg>
  );
}

/** 售票結帳的側欄：座位保留了 20 分鐘，進頁面時已過 15 分多，最後幾分鐘會顯示秒數 */
export default function ReservationTimerDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [startedAt] = useState(() => Date.now() - (15 * MIN + 50_000));
  const [expiresAt, setExpiresAt] = useState(() => startedAt + 20 * MIN);
  const [released, setReleased] = useState(false);
  const ref = useRef<HTMLElement>(null);
  // 預覽自己演：剩 4 分多鐘時按延長，分鐘往上滾，超過 5 分鐘秒數就收起來
  const cursor = useDemoAutoplay(ref, async (d) => {
    await d.wait(2600);
    await d.click(() => d.find("button", t.extend));
  });

  return (
    <aside ref={ref} aria-label={t.section} className="relative flex w-full max-w-sm min-w-0 flex-col gap-4">
      <ReservationTimer
        locale={locale}
        startedAt={startedAt}
        expiresAt={expiresAt}
        item={{ name: t.seat, detail: t.show, image: <TicketArt /> }}
        onExpire={() => setReleased(true)}
        onExtend={() => setExpiresAt((e) => e + 5 * MIN)}
        extendLabel={t.extend}
      />
      <dl className="flex flex-col gap-1.5 px-1 text-[13px] text-muted-foreground">
        <div className="flex justify-between gap-3">
          <dt>{t.ticket}</dt>
          <dd className="tabular-nums">NT$4,800</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>{t.fee}</dt>
          <dd className="tabular-nums">NT$20</dd>
        </div>
        <div className="flex justify-between gap-3 text-[15px] font-semibold text-foreground">
          <dt>{t.total}</dt>
          <dd className="tabular-nums">NT$4,820</dd>
        </div>
      </dl>
      {released ? (
        <a
          href="#seats"
          className="inline-flex h-11 items-center justify-center rounded-md border border-border text-[14px] font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {t.again}
        </a>
      ) : (
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary text-[14px] font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {t.pay} NT$4,820
        </button>
      )}
      {cursor}
    </aside>
  );
}
