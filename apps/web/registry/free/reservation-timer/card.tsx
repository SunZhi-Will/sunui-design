"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ReservationTimer } from "./reservation-timer";

const HOUR = 3_600_000;

/** 型錄卡片：限量球鞋保留 4 小時、已過 1 小時，安靜的狀態只顯示時刻與大約剩幾小時。 */
const copy = {
  en: { name: "Court Low, chalk white", detail: "Size US 9, limited release" },
  "zh-TW": { name: "Court Low 粉筆白", detail: "US 9 號，限量發售" },
  "zh-CN": { name: "Court Low 粉笔白", detail: "US 9 码，限量发售" },
  ja: { name: "Court Low チョークホワイト", detail: "US 9、限定発売" },
};

export default function ReservationTimerCard() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [startedAt] = useState(() => Date.now() - HOUR);

  return (
    <div className="mx-auto w-72">
      <ReservationTimer locale={locale} startedAt={startedAt} holdMs={4 * HOUR} expiresAt={startedAt + 4 * HOUR} item={{ name: t.name, detail: t.detail }} />
    </div>
  );
}
