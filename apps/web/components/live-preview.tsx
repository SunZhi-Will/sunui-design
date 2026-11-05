"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * 型錄卡片的即時預覽：block 以原尺寸在 iframe 裡跑，可以直接操作。
 * 只在接近畫面時掛載，離開很遠就卸載，避免一百多個 iframe 同時存在。
 */
export function LivePreview({ name, title }: { name: string; title: string }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setNear(entry.isIntersecting);
        if (!entry.isIntersecting) setLoaded(false);
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={frameRef} className="absolute inset-0">
      {near && (
        <iframe
          src={`/preview/${name}/card`}
          title={`${title} live preview`}
          onLoad={() => setLoaded(true)}
          className={cn(
            "size-full border-0 transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      )}
    </div>
  );
}
