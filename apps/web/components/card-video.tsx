"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * 卡片影片（public/cards/<name>.mp4，scripts/record-cards.mjs 錄的）：疊在靜態圖上，捲進畫面才載入與播放，
 * 離開畫面、分頁在背景時暫停。reduced motion 時不放影片，只留靜態圖。影片還沒開始播之前是透明的，看到的是靜態圖。
 */
export function CardVideo({ name, av1, className }: { name: string; av1?: boolean; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const video = ref.current;
    if (!video || reduce) return;
    // 選檔：手機（視窗 640 以下）或開了省流量用 480 寬的版本，省約六成流量，會動的畫面糊一點看不太出來；
    // 桌機三欄和手機一欄的卡片 CSS 寬度差不多（約 360px），所以用視窗寬判斷，不用卡片寬。支援 AV1 就用 AV1（同畫質小三到四成）
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    const small = saveData || window.matchMedia("(max-width: 639px)").matches;
    const useAv1 = av1 && video.canPlayType('video/mp4; codecs="av01.0.05M.08"') !== "";
    const src = `/cards/${name}${small ? "-480" : ""}${useAv1 ? ".av1" : ""}.mp4`;
    if (video.getAttribute("src") !== src) video.setAttribute("src", src);
    let visible = false;
    let retry = 0;
    const sync = () => {
      window.clearTimeout(retry);
      if (visible && !document.hidden) {
        if (video.preload !== "auto") video.preload = "auto";
        // 瀏覽器有時會拒絕播放（例如分頁剛從背景切回來）：還在畫面裡就一秒後再試
        video.play().catch(() => {
          retry = window.setTimeout(sync, 1000);
        });
      } else video.pause();
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }, { rootMargin: "120px" });
    io.observe(video);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.clearTimeout(retry);
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [reduce, name, av1]);
  if (reduce) return null;
  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      onPlaying={() => setReady(true)}
      className={cn(
        "absolute inset-0 size-full object-cover transition-[opacity,scale] duration-700 ease-site motion-reduce:transition-none",
        ready ? "opacity-100" : "opacity-0",
        className,
      )}
    />
  );
}
