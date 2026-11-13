"use client";

import { useEffect, useRef } from "react";

/** 頁面真的顯示時回報一次瀏覽（/admin 漏斗用）。只送事件名稱，不送任何識別資料，也沒有 cookie。 */
export function ViewBeacon({ event }: { event: "pricing_view" }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const body = JSON.stringify({ event });
    if (!navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) {
      fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
    }
  }, [event]);
  return null;
}
