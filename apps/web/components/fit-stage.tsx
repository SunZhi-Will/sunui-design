"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

const GUTTER = 20;

/**
 * 型錄卡片 iframe 內的舞台：block 以原尺寸置中顯示。
 * 只有內容比卡片大時才等比縮小，放得下就維持 1:1，不放大。
 */
export function FitStage({ children }: { children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const update = () => {
      // 寬度用 scrollWidth 抓出撐破版面的固定寬元素；高度用版面高度，
      // 避免 hover 浮層或內部捲動區被裁掉的部分也算進去而無故縮小
      const width = Math.max(content.scrollWidth, 1);
      const height = Math.max(content.offsetHeight, 1);
      const byWidth = (window.innerWidth - GUTTER * 2) / width;
      const byHeight = (window.innerHeight - GUTTER * 2) / height;
      setScale(Math.min(byWidth, byHeight, 1));
    };

    const observer = new ResizeObserver(update);
    observer.observe(content);
    window.addEventListener("resize", update);
    update();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-card">
      <div
        ref={contentRef}
        className="w-full shrink-0 origin-center"
        style={{
          maxWidth: `calc(100vw - ${GUTTER * 2}px)`,
          transform: `scale(${scale})`,
          opacity: scale ? 1 : 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}
