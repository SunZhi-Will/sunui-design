"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { previewUrl } from "@/lib/demo-locale";
import type { Locale } from "@/lib/i18n";
import type { SpotKey } from "@/lib/spot";
import { cn } from "@/lib/utils";

// 卡片進入預載範圍後等多久才掛載 iframe（毫秒）
const MOUNT_DELAY = 150;

/**
 * 型錄卡片的即時預覽：block 以原尺寸在 iframe 裡跑，可以直接操作。
 * 只在接近畫面時掛載，離開就卸載，避免一百多個 iframe 同時存在。
 * 點卡片裡元件以外的空白處，iframe 會通知這裡展開成面板（見 FitStage）。
 */
export function LivePreview({
  name,
  variant,
  spot,
  poster,
  title,
  locale,
  onExpand,
}: {
  name: string;
  variant?: string;
  /** 示範品牌色，預覽頁的 layout 腳本讀 ?spot= 套上 */
  spot?: SpotKey;
  /** iframe 載入前的底圖（區塊的分享圖），淺色主題才顯示；深色主題用骨架，避免一張白圖閃過 */
  poster?: string;
  title: string;
  locale: Locale;
  onExpand?: () => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [near, setNear] = useState(false);
  // 記住哪個語言載入完成；換語言時 iframe 重掛，淡入重來一次
  const [loadedLocale, setLoadedLocale] = useState<Locale | null>(null);
  const loaded = loadedLocale === locale;
  const expandRef = useRef(onExpand);
  expandRef.current = onExpand;

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    // 每個 iframe 都是一份完整的 React（約 550 KB JS 要解析執行），所以：
    // 預載範圍只留上下 300px（約一列卡片），而且要在範圍內停留一下才掛載，快速捲過的卡片不會白白啟動
    let timer: number | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        window.clearTimeout(timer);
        if (entry.isIntersecting) {
          timer = window.setTimeout(() => setNear(true), MOUNT_DELAY);
        } else {
          setNear(false);
          setLoadedLocale(null);
        }
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(frame);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.type === "sunui:expand") expandRef.current?.();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div ref={frameRef} className="absolute inset-0">
      {/* 載入前的佔位：淺色是分享圖，深色是緩慢呼吸的骨架；iframe 淡入蓋上後一起淡出 */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 transition-opacity duration-500",
          loaded ? "opacity-0" : "opacity-100",
        )}
      >
        <div className="absolute inset-0 animate-pulse bg-stage/60 motion-reduce:animate-none" />
        {poster && (
          <Image src={poster} alt="" fill sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw" className="object-cover dark:hidden" />
        )}
      </div>
      {near && (
        <iframe
          key={locale}
          ref={iframeRef}
          src={previewUrl(variant ? `/preview/${name}/v/${encodeURIComponent(variant)}` : `/preview/${name}/card`, locale) + (spot ? `&spot=${spot}` : "")}
          title={title}
          onLoad={() => setLoadedLocale(locale)}
          className={cn("relative size-full border-0 transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0")}
        />
      )}
    </div>
  );
}
