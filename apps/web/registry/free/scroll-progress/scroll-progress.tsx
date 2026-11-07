"use client";

import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, type MotionValue } from "framer-motion";
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
  /** 章節刻度，點擊可跳轉 */
  sections?: ScrollSection[];
  /** fixed 固定在視窗頂端；sticky 黏在容器頂端；static 由父層排版。fixed 時刻度不印文字 */
  position?: "fixed" | "sticky" | "static";
  /** 墨線粗細（px） */
  thickness?: number;
  /** 墨線顏色 class */
  barClassName?: string;
  /** 在尺規右上方印出百分比 */
  showPercent?: boolean;
  /** 平滑跟隨；減少動態時自動關閉 */
  smooth?: boolean;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<ScrollProgressLabels>;
  className?: string;
}

export interface ScrollProgressLabels {
  progress: string;
  jumpTo: (label: string) => string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, ScrollProgressLabels> = {
  en: { progress: "Reading progress", jumpTo: (label) => `Jump to ${label}` },
  "zh-TW": { progress: "閱讀進度", jumpTo: (label) => `跳到「${label}」` },
  "zh-CN": { progress: "阅读进度", jumpTo: (label) => `跳到“${label}”` },
  ja: { progress: "読書の進捗", jumpTo: (label) => `「${label}」へ移動` },
};

// 設計語言（DESIGN.md）：紙邊作底線，品牌專色作進度
const edgeLine = "bg-[#e2e2e2] dark:bg-[#333333]";
/** 品牌專色：預設跟著主題的 --primary，買家設 --sunui-spot 就換成自己的品牌色。只用在選中、優惠、目前進度 */
const spotBg = "bg-[color:var(--sunui-spot,var(--primary))]";
const ink = "text-[#171717] dark:text-[#ededed]";
const inkMuted = "text-[#171717]/50 dark:text-[#ededed]/50";

type Marker = ScrollSection & { at: number; top: number };

export function ScrollProgress({
  container,
  sections = [],
  position = "fixed",
  thickness = 2,
  barClassName,
  showPercent = false,
  smooth = true,
  locale = "en",
  labels,
  className,
}: ScrollProgressProps) {
  const reduceMotion = useReducedMotion();
  const text = { ...MESSAGES[resolveLocale(locale)], ...labels };
  // layoutEffect: false，等父層的 container ref 掛上後才綁定，否則會退回追蹤 window
  const { scrollYProgress } = useScroll(container ? { container, layoutEffect: false } : undefined);
  const spring = useSpring(scrollYProgress, { stiffness: 240, damping: 30, restDelta: 0.001 });
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
    const max = root ? root.scrollHeight - root.clientHeight : document.documentElement.scrollHeight - window.innerHeight;
    const rootTop = root ? root.getBoundingClientRect().top - root.scrollTop : -window.scrollY;
    const next: Marker[] = [];
    for (const s of sectionsRef.current) {
      const el = root ? root.querySelector<HTMLElement>(`#${CSS.escape(s.id)}`) : document.getElementById(s.id);
      if (!el) continue;
      // 尊重 scroll-margin-top，跳轉後標題不會貼齊邊緣
      const top = el.getBoundingClientRect().top - rootTop - (parseFloat(getComputedStyle(el).scrollMarginTop) || 0);
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

  const printLabels = position !== "fixed" && markers.length > 0;

  return (
    <div
      className={cn(
        "inset-x-0 top-0 z-40 w-full",
        position === "fixed" && "fixed",
        position === "sticky" && "sticky",
        position === "static" && "relative",
        printLabels && "pb-5",
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
        className="relative flex w-full items-end"
        style={{ height: thickness }}
      >
        <span aria-hidden="true" className={cn("absolute inset-x-0 bottom-0 h-px", edgeLine)} />
        <motion.span
          aria-hidden="true"
          className={cn("absolute inset-0 origin-left", spotBg, barClassName)}
          style={{ scaleX: value }}
        />
      </div>

      {markers.length > 0 && (
        <nav aria-label={text.progress} className="absolute inset-x-0 top-0">
          <ul>
            {markers.map((m, i) => {
              // percent 已四捨五入到整數，容許 1% 誤差，跳轉後該刻度立即算已讀
              const passed = percent / 100 >= m.at - 0.01;
              // 靠近尾端的刻度把字印在刻痕左側，並與前一格平分空間，避免擠成一點
              const flip = (k: number) => k > 0 && k < markers.length && (markers[k + 1]?.at ?? 1) - markers[k].at < 0.15;
              const room = flip(i)
                ? (m.at - markers[i - 1].at) / 2
                : ((markers[i + 1]?.at ?? 1) - m.at) / (flip(i + 1) ? 2 : 1);
              return (
                <li
                  key={m.id}
                  className="@container absolute top-0 flex"
                  style={{
                    [flip(i) ? "right" : "left"]: `${(flip(i) ? 1 - m.at : m.at) * 100}%`,
                    width: `${room * 100}%`,
                    justifyContent: flip(i) ? "flex-end" : "flex-start",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => jump(m)}
                    aria-label={text.jumpTo(m.label)}
                    title={printLabels ? undefined : m.label}
                    className={cn(
                      "group flex max-w-full items-start gap-1.5 rounded-[2px] outline-none transition-colors focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-current",
                      flip(i) ? "flex-row-reverse pl-2 text-right" : "pr-2 text-left",
                      passed ? ink : inkMuted,
                    )}
                    style={{ height: thickness + 18 }}
                  >
                    {/* 刻度：像尺規上的一道刻痕 */}
                    <span aria-hidden="true" className="h-[9px] w-px shrink-0 bg-current" style={{ marginTop: thickness }} />
                    {/* 空間不夠時只留刻痕，不印被截成一兩個字母的標籤 */}
                    {printLabels && (
                      <span
                        aria-hidden="true"
                        className="mt-[3px] hidden truncate text-[11px] @min-[4rem]:block leading-[14px] tracking-[0.04em] decoration-1 underline-offset-[3px] group-hover:underline group-focus-visible:underline"
                        style={{ paddingTop: thickness }}
                      >
                        {m.label}
                      </span>
                    )}
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
          className={cn("absolute right-0 bottom-full mb-1.5 text-[11px] leading-none tabular-nums", inkMuted)}
        >
          {percent}%
        </span>
      )}
    </div>
  );
}
