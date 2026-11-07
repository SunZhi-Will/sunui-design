"use client";

import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

import { cn } from "@/lib/utils";

const springs = {
  gentle: { type: "spring", stiffness: 240, damping: 30 },
  stamp: { type: "spring", stiffness: 620, damping: 20, mass: 0.8 },
} as const;

export interface TimelineItem {
  id: string;
  /** 左側的小字，例如年份、日期或時間 */
  time?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
}

export interface ScrollTimelineProps {
  items: TimelineItem[];
  /**
   * scroll：線條隨捲動往下畫，經過的節點填滿（品牌故事、活動流程）。
   * progress：由 current 決定進度，不看捲動（訂單追蹤、申請進度）。
   */
  mode?: "scroll" | "progress";
  /** progress 模式：已完成到第幾個（從 0 起算）；-1 表示都還沒開始 */
  current?: number;
  /** scroll 模式在可捲動容器裡時傳入 */
  container?: RefObject<HTMLElement | null>;
  /** scroll 模式：線頭停在捲動區的哪個高度（0 頂端、1 底端） */
  anchor?: number;
  className?: string;
}

/** 品牌專色：預設跟著主題的 --primary，買家設 --sunui-spot 就換成自己的品牌色。只用在選中、優惠、目前進度 */
const spotBg = "bg-[color:var(--sunui-spot,var(--primary))]";

function Dot({ reached, current, reduce }: { reached: boolean; current: boolean; reduce: boolean | null }) {
  return (
    <span className="absolute left-0 top-1 grid size-4 -translate-x-1/2 place-items-center">
      <span className="absolute inset-0 rounded-full border-[1.5px] border-[#171717]/25 bg-[#f7f7f7] dark:border-[#ededed]/25 dark:bg-[#1c1c1c]" />
      <motion.span
        className={cn("absolute inset-0 rounded-full", current ? spotBg : "bg-[#a3a3a3] dark:bg-[#737373]")}
        initial={false}
        animate={{ scale: reached ? 1 : 0 }}
        transition={reduce ? { duration: 0 } : springs.stamp}
      />
    </span>
  );
}

export function ScrollTimeline({ items, mode = "scroll", current = -1, container, anchor = 0.6, className }: ScrollTimelineProps) {
  const reduce = useReducedMotion();
  const listRef = useRef<HTMLOListElement>(null);
  const dotRefs = useRef<(HTMLLIElement | null)[]>([]);
  const { scrollYProgress } = useScroll({
    target: listRef,
    container,
    offset: [`start ${anchor}`, `end ${anchor}`],
    // 讓父層的 container ref 先掛上，否則在容器裡會讀成視窗捲動
    layoutEffect: false,
  });
  const smooth = useSpring(scrollYProgress, reduce ? { stiffness: 10000, damping: 1000 } : springs.gentle);
  const [reachedCount, setReachedCount] = useState(0);
  // progress 模式要量節點位置，掛載後再算一次
  const [, setMeasured] = useState(false);
  useEffect(() => setMeasured(true), []);

  // 換算每個節點的位置比例，線頭經過就算到達
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (mode !== "scroll") return;
    const list = listRef.current;
    if (!list) return;
    const h = list.offsetHeight || 1;
    let n = 0;
    dotRefs.current.forEach((el) => {
      if (el && (el.offsetTop + 8) / h <= p + 0.001) n++;
    });
    setReachedCount(n);
  });

  const progressFraction = (() => {
    if (mode !== "progress" || current < 0) return 0;
    const el = dotRefs.current[Math.min(current, items.length - 1)];
    const h = listRef.current?.offsetHeight;
    return el && h ? (el.offsetTop + 8) / h : current / Math.max(1, items.length - 1);
  })();


  return (
    <ol ref={listRef} className={cn("relative ml-2 space-y-8 pl-8", className)}>
      <span aria-hidden="true" className="absolute bottom-2 left-0 top-2 w-px bg-[#e2e2e2] dark:bg-[#333333]" />
      {mode === "scroll" ? (
        <motion.span aria-hidden="true" className={cn("absolute bottom-2 left-0 top-2 w-px origin-top", spotBg)} style={{ scaleY: smooth }} />
      ) : (
        <motion.span
          aria-hidden="true"
          className={cn("absolute bottom-2 left-0 top-2 w-px origin-top", spotBg)}
          initial={false}
          animate={{ scaleY: progressFraction }}
          transition={reduce ? { duration: 0 } : springs.gentle}
        />
      )}
      {items.map((item, i) => {
        const reached = mode === "scroll" ? i < reachedCount : i <= current;
        const isCurrent = mode === "progress" && i === current;
        return (
          <li
            key={item.id}
            ref={(el) => {
              dotRefs.current[i] = el;
            }}
            aria-current={isCurrent ? "step" : undefined}
            className="relative"
          >
            <span className="absolute -left-8 top-0 h-full">
              <Dot reached={reached} current={isCurrent} reduce={reduce} />
            </span>
            <motion.div
              initial={false}
              animate={{ opacity: reached || mode === "progress" ? 1 : 0.45 }}
              transition={{ duration: reduce ? 0 : 0.2 }}
            >
              {item.time && <p className="text-xs tabular-nums text-[#171717]/60 dark:text-[#ededed]/60">{item.time}</p>}
              <p className={cn("mt-0.5 font-medium tracking-tight", mode === "progress" && !reached && "text-[#171717]/45 dark:text-[#ededed]/45")}>{item.title}</p>
              {item.description && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>}
            </motion.div>
          </li>
        );
      })}
    </ol>
  );
}
