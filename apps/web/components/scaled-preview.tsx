"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { previews } from "@/registry/__generated__/previews";

/** 以固定寬度渲染 block，再等比縮小塞進卡片。 */
export function ScaledPreview({ name, width = 960 }: { name: string; width?: number }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  // 型錄有幾十張卡，只在接近畫面時才掛載 block，避免同時跑幾十組動畫
  const [near, setNear] = useState(false);
  const Preview = previews[name];

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setNear(true), {
      rootMargin: "300px",
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const content = contentRef.current;
    if (!frame || !content) return;

    const update = () => {
      // 依 block 實際寬度縮放，窄的 block（按鈕、數字）才不會縮得太小
      const child = content.firstElementChild as HTMLElement | null;
      const blockWidth = Math.min(Math.max(child?.offsetWidth ?? width, 1), width);
      const byWidth = (frame.clientWidth * 0.9) / blockWidth;
      const byHeight = (frame.clientHeight * 0.9) / Math.max(content.offsetHeight, 1);
      setScale(Math.min(byWidth, byHeight, 1));
    };

    const observer = new ResizeObserver(update);
    observer.observe(frame);
    observer.observe(content);
    update();
    return () => observer.disconnect();
  }, [width]);

  return (
    <div ref={frameRef} className="stage-dots relative flex aspect-[16/10] items-center justify-center overflow-hidden">
      <div
        ref={contentRef}
        className="pointer-events-none flex shrink-0 justify-center"
        style={{ width, transform: `scale(${scale})`, opacity: scale ? 1 : 0 }}
        aria-hidden="true"
        inert
      >
        {near && Preview ? <Preview /> : null}
      </div>
    </div>
  );
}
