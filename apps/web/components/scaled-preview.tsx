"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { previews } from "@/registry/previews";

/** 以固定寬度渲染 block，再等比縮小塞進卡片。 */
export function ScaledPreview({ name, width = 960 }: { name: string; width?: number }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const Preview = previews[name];

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const content = contentRef.current;
    if (!frame || !content) return;

    const update = () => {
      const byWidth = (frame.clientWidth * 0.9) / width;
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
      >
        {Preview ? <Preview /> : null}
      </div>
    </div>
  );
}
