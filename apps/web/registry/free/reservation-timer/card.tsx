"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ReservationTimer } from "./reservation-timer";

const HOUR = 3_600_000;

/** Catalog card: limited-edition sneakers held for 4 hours with 1 hour elapsed. The calm state shows only the time and roughly how many hours remain. */
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
