"use client";

import { useEffect, useRef, useState } from "react";

import { previewUrl } from "@/lib/demo-locale";
import type { Locale } from "@/lib/i18n";
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
  title,
  locale,
  onExpand,
}: {
  name: string;
  variant?: string;
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
      {near && (
        <iframe
          key={locale}
          ref={iframeRef}
          src={previewUrl(variant ? `/preview/${name}/v/${encodeURIComponent(variant)}` : `/preview/${name}/card`, locale)}
          title={title}
          onLoad={() => setLoadedLocale(locale)}
          className={cn("size-full border-0 transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0")}
        />
      )}
    </div>
  );
}
