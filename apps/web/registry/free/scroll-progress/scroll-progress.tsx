"use client";

import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  type MotionValue,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import { cn } from "@/lib/utils";

export type ScrollSection = {
  /** 對應章節元素的 id */
  id: string;
  label: string;
};

export interface ScrollProgressProps {
  /** 捲動容器；省略時追蹤 window */
  container?: RefObject<HTMLElement | null>;
  /** 章節標記，點擊可跳轉 */
  sections?: ScrollSection[];
  /** fixed 固定在視窗頂端；sticky 黏在容器頂端；static 由父層排版 */
  position?: "fixed" | "sticky" | "static";
  /** 進度條粗細（px） */
  thickness?: number;
  /** 進度條顏色 class */
  barClassName?: string;
  /** 顯示百分比數字 */
  showPercent?: boolean;
  /** 平滑跟隨；減少動態時自動關閉 */
  smooth?: boolean;
  labels?: {
    progress?: string;
    jumpTo?: (label: string) => string;
  };
  className?: string;
}

const defaultLabels = {
  progress: "Reading progress",
  jumpTo: (label: string) => `Jump to ${label}`,
};

type Marker = ScrollSection & { at: number; top: number };

export function ScrollProgress({
  container,
  sections = [],
  position = "fixed",
  thickness = 4,
  barClassName,
  showPercent = false,
  smooth = true,
  labels,
  className,
}: ScrollProgressProps) {
  const reduceMotion = useReducedMotion();
  const text = { ...defaultLabels, ...labels };
  const { scrollYProgress } = useScroll(container ? { container } : undefined);
  const spring = useSpring(scrollYProgress, { stiffness: 220, damping: 32, restDelta: 0.001 });
  const value: MotionValue<number> = smooth && !reduceMotion ? spring : scrollYProgress;

  // 只在整數百分比變化時更新 state，避免每個 scroll frame 都重繪
  const [percent, setPercent] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = Math.round(Math.min(Math.max(v, 0), 1) * 100);
    setPercent((p) => (p === next ? p : next));
  });

  const [markers, setMarkers] = useState<Marker[]>([]);
  // sections 常是 inline 陣列，用 id 串成 key 判斷是否需要重新量測
  const sectionKey = sections.map((s) => `${s.id}:${s.label}`).join("|");
  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;

  const measure = useCallback(() => {
    const root = container?.current ?? null;
    const max = root
      ? root.scrollHeight - root.clientHeight
      : document.documentElement.scrollHeight - window.innerHeight;
    const rootTop = root ? root.getBoundingClientRect().top - root.scrollTop : -window.scrollY;
    const next: Marker[] = [];
    for (const s of sectionsRef.current) {
      const el = root
        ? root.querySelector<HTMLElement>(`#${CSS.escape(s.id)}`)
        : document.getElementById(s.id);
      if (!el) continue;
      const top = el.getBoundingClientRect().top - rootTop;
      next.push({ ...s, top, at: max > 0 ? Math.min(Math.max(top / max, 0), 1) : 0 });
    }
    setMarkers(next);
  }, [container, sectionKey]);

  useEffect(() => {
    if (sections.length === 0) return;
    measure();
    const root = container?.current;
    const ro = new ResizeObserver(measure);
    ro.observe(root ?? document.documentElement);
    if (root?.firstElementChild) ro.observe(root.firstElementChild);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, container, sections.length]);

  const jump = (m: Marker) => {
    const target = container?.current ?? window;
    target.scrollTo({ top: m.top, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <div
      className={cn(
        "inset-x-0 top-0 z-40 w-full",
        position === "fixed" && "fixed",
        position === "sticky" && "sticky",
        position === "static" && "relative",
        className,
      )}
    >
      <div
        role="progressbar"
        aria-label={text.progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${percent}%`}
        className="relative w-full bg-muted"
        style={{ height: thickness }}
      >
        <motion.div
          className={cn("absolute inset-0 origin-left bg-primary", barClassName)}
          style={{ scaleX: value }}
        />
      </div>

      {markers.length > 0 && (
        <nav aria-label={text.progress} className="pointer-events-none absolute inset-x-0" style={{ top: thickness / 2 }}>
          <ul>
            {markers.map((m) => {
              const passed = percent / 100 >= m.at - 0.001;
              return (
                <li key={m.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${m.at * 100}%` }}>
                  <button
                    type="button"
                    onClick={() => jump(m)}
                    aria-label={text.jumpTo(m.label)}
                    className="group pointer-events-auto relative grid size-6 place-items-center rounded-full outline-none"
                  >
                    <span
                      className={cn(
                        "block size-2.5 rounded-full border-2 transition-colors duration-200",
                        passed ? "border-primary bg-primary" : "border-muted-foreground/50 bg-background",
                        "group-hover:scale-125 group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-1 motion-reduce:group-hover:scale-100",
                      )}
                    />
                    <span
                      aria-hidden="true"
                      className={cn(
                        "pointer-events-none absolute top-full mt-1 whitespace-nowrap rounded-md border border-border bg-card px-2 py-0.5 text-xs text-card-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
                        m.at < 0.1 ? "left-0" : m.at > 0.9 ? "right-0" : "left-1/2 -translate-x-1/2",
                      )}
                    >
                      {m.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      {showPercent && (
        <span
          aria-hidden="true"
          className="absolute right-2 mt-1.5 rounded-full border border-border bg-background/90 px-2 py-0.5 text-xs tabular-nums text-muted-foreground backdrop-blur"
          style={{ top: thickness }}
        >
          {percent}%
        </span>
      )}
    </div>
  );
}
