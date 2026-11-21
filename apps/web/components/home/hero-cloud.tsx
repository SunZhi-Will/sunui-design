"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { PointCloud, type PointCloudShape } from "@/registry/free/point-cloud/point-cloud";

/**
 * 首頁開場的主視覺：SunUI 自己的免費區塊 point-cloud，放到比標題大很多，當成標題後面的一整團點雲。
 * 它自己慢慢轉，每隔幾秒換一個形狀（每一顆點從原位移到新位置）；拖曳可以轉動，滑鼠靠近點會被推開。
 * 這不是另外做的裝飾：裝得到的就是這個元件。reduced motion 時不轉也不換形狀。規範見 SITE-MOTION.md §6。
 */
// 方塊試過：點是隨機灑在六個面上，放大後看起來是一片雜點，所以不用
const SHAPES: PointCloudShape[] = ["torus", "sphere", "wave"];
const HOLD_MS = 5200;

export function HeroCloud({ label }: { label: string }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  // 窄螢幕點數減半：手機上點雲大半被文字後面的暗區擋住，4200 顆在慢的手機上會掉到 40fps 左右
  const [count, setCount] = useState(4200);
  useEffect(() => {
    if (window.matchMedia("(max-width: 639px)").matches) setCount(2200);
  }, []);

  useEffect(() => {
    if (reduce) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % SHAPES.length);
    }, HOLD_MS);
    return () => window.clearInterval(timer);
  }, [reduce]);

  return <PointCloud shape={SHAPES[index]} count={count} pointSize={1.7} label={label} className="size-full text-accent" />;
}
