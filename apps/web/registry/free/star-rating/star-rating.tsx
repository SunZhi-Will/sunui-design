"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type StarRatingSize = "sm" | "md" | "lg";

export interface StarRatingProps {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** 星星數量 */
  max?: number;
  /** 0.5 支援半星 */
  precision?: 0.5 | 1;
  /** 唯讀顯示模式，支援任意小數（例如 4.3） */
  readOnly?: boolean;
  disabled?: boolean;
  size?: StarRatingSize;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串；傳陣列時視為每個整數分數的文字（長度等於 max） */
  labels?: string[] | Partial<StarRatingLabels>;
  /** 是否在右側顯示文字標籤 */
  showLabel?: boolean;
  /** 再次點擊目前分數時清除為 0 */
  allowClear?: boolean;
  /** 搭配表單送出時的欄位名稱 */
  name?: string;
  /** 整組的無障礙名稱 */
  "aria-label"?: string;
  className?: string;
  /** 選定分數後在下方長出的理由標籤；分數 <= threshold 用 low，否則用 high。也可傳函式依分數回傳 */
  reasons?: { low: string[]; high: string[] } | ((value: number) => string[]);
  /** low 與 high 的分界，預設 3 */
  threshold?: number;
  selectedReasons?: string[];
  defaultSelectedReasons?: string[];
  onReasonsChange?: (reasons: string[]) => void;
  /** 各分數的人數，index 0 是 1 星；選定後顯示「和 N% 的買家一樣」 */
  distribution?: number[];
}

export interface StarRatingLabels {
  /** 每個整數分數對應的文字 */
  levels: string[];
  /** 整組預設的無障礙名稱 */
  group: string;
  rated: (value: number, max: number) => string;
  stars: (value: number) => string;
  /** 低分時的理由提問 */
  askLow: string;
  /** 高分時的理由提問 */
  askHigh: string;
  /** 跟你給一樣分數的人佔多少 */
  same: (pct: number) => ReactNode;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, StarRatingLabels> = {
  en: {
    levels: ["Terrible", "Poor", "Okay", "Good", "Great"],
    group: "Rating",
    rated: (v, max) => `Rated ${v} out of ${max}`,
    stars: (v) => `${v} ${v === 1 ? "star" : "stars"}`,
    askLow: "What went wrong?", askHigh: "What did you like?",
    same: (p) => `Same as ${p}% of buyers`,
  },
  "zh-TW": {
    levels: ["很差", "不太好", "普通", "不錯", "很棒"],
    group: "評分",
    rated: (v, max) => `評分 ${v} / ${max}`,
    stars: (v) => `${v} 顆星`,
    askLow: "哪裡不太好？", askHigh: "喜歡哪裡？",
    same: (p) => `和 ${p}% 的買家給一樣的分數`,
  },
  "zh-CN": {
    levels: ["很差", "较差", "一般", "不错", "很棒"],
    group: "评分",
    rated: (v, max) => `评分 ${v} / ${max}`,
    stars: (v) => `${v} 颗星`,
    askLow: "哪里不太好？", askHigh: "喜欢哪里？",
    same: (p) => `和 ${p}% 的买家打了一样的分`,
  },
  ja: {
    levels: ["最悪", "いまいち", "ふつう", "良い", "最高"],
    group: "評価",
    rated: (v, max) => `${max} 点中 ${v} 点`,
    stars: (v) => `星 ${v}`,
    askLow: "どこが気になりましたか？", askHigh: "どこが良かったですか？",
    same: (p) => `${p}% の購入者と同じ評価`,
  },
};

// 設計語言（DESIGN.md）：墨線星星，不用金色
const ink = "text-[#171717] dark:text-[#ededed]";
/** 品牌專色：預設跟著主題的 --primary，買家設 --sunui-spot 就換成自己的品牌色。只用在選中、優惠、目前進度 */
const spot = "text-[color:var(--sunui-spot,var(--primary))]";
const spotBorder = "border-[color:var(--sunui-spot,var(--primary))]";
const spotFill = "bg-[color:var(--sunui-spot,var(--primary))] text-[color:var(--sunui-spot-foreground,var(--primary-foreground))]";
const snappy = { type: "spring", stiffness: 520, damping: 34 } as const;
const gentle = { type: "spring", stiffness: 240, damping: 30 } as const;
const instant = { duration: 0 } as const;

const starSize: Record<StarRatingSize, string> = { sm: "size-4", md: "size-6", lg: "size-8" };
const labelSize: Record<StarRatingSize, string> = { sm: "text-xs", md: "text-sm", lg: "text-base" };

const STAR = "M12 3.2l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6-4.4-4.2 6-.8z";

/** 一顆星：底層墨線外框，上層依 fill 比例裁出實心；可點的選分器裡，實心部分用品牌專色 */
function Star({ fill, className, fillClassName }: { fill: number; className?: string; fillClassName?: string }) {
  return (
    <span aria-hidden="true" className={cn("relative block", className)}>
      <svg viewBox="0 0 24 24" className="absolute inset-0 size-full" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
        <path d={STAR} className="opacity-45" />
      </svg>
      <span className={cn("absolute inset-0 overflow-hidden", fillClassName)} style={{ width: `${fill * 100}%` }}>
        <svg viewBox="0 0 24 24" className={cn("block", className)} fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
          <path d={STAR} />
        </svg>
      </span>
    </span>
  );
}

const round = (n: number, precision: number) => Math.round(n / precision) * precision;

// 文字標籤朝分數變動的方向滾：加分往上滾，減分往下滾
const roll = {
  enter: (d: number) => ({ y: d > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (d: number) => ({ y: d > 0 ? "-100%" : "100%", opacity: 0 }),
};

export function StarRating({
  value: valueProp,
  defaultValue = 0,
  onValueChange,
  max = 5,
  precision = 1,
  readOnly = false,
  disabled = false,
  size = "md",
  locale = "en",
  labels: labelsProp,
  showLabel = true,
  allowClear = true,
  name,
  "aria-label": ariaLabelProp,
  className,
  reasons,
  threshold = 3,
  selectedReasons,
  defaultSelectedReasons = [],
  onReasonsChange,
  distribution,
}: StarRatingProps) {
  const t = {
    ...MESSAGES[resolveLocale(locale)],
    ...(Array.isArray(labelsProp) ? { levels: labelsProp } : labelsProp),
  };
  const labels = t.levels;
  const ariaLabel = ariaLabelProp ?? t.group;
  const reduce = useReducedMotion() ?? false;
  const labelId = useId();
  const askId = useId();
  const [inner, setInner] = useState(defaultValue);
  const value = valueProp ?? inner;
  const [hover, setHover] = useState<number | null>(null);
  const [pressed, setPressed] = useState<number | null>(null);
  const [innerPicked, setInnerPicked] = useState(defaultSelectedReasons);
  const picked = selectedReasons ?? innerPicked;
  const refs = useRef(new Map<number, HTMLElement>());
  const interactive = !readOnly && !disabled;
  const shown = interactive && hover !== null ? hover : value;
  const fillOf = (i: number) => Math.min(1, Math.max(0, shown - i));
  const labelFor = (v: number) => (v > 0 ? (labels[Math.min(Math.ceil(v), labels.length) - 1] ?? "") : "");

  // 記住上一個顯示的分數，算出滾動方向（render 期間的衍生 state）
  const [rolled, setRolled] = useState({ v: shown, d: 1 });
  if (rolled.v !== shown) setRolled({ v: shown, d: shown > rolled.v ? 1 : -1 });

  // 下方理由區的高度跟著內容走，用 gentle 彈簧變形，下方內容一起滑動
  const bodyRef = useRef<HTMLDivElement>(null);
  // 首次渲染用 auto，已選定的狀態直接出現，不做進場動畫
  const [bodyH, setBodyH] = useState<number | "auto">("auto");
  const hasBody = !readOnly && (!!reasons || !!distribution);
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBodyH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasBody]);

  if (readOnly) {
    const fixed = Math.round(value * 10) / 10;
    return (
      <div role="img" aria-label={t.rated(fixed, max)} className={cn("inline-flex items-center gap-0.5", ink, className)}>
        {Array.from({ length: max }, (_, i) => (
          <Star key={i} fill={fillOf(i)} className={starSize[size]} />
        ))}
      </div>
    );
  }

  const low = (v: number) => v <= threshold;
  const reasonsFor = (v: number) => (v <= 0 || !reasons ? [] : typeof reasons === "function" ? reasons(v) : low(v) ? reasons.low : reasons.high);
  const setPicked = (next: string[]) => {
    if (selectedReasons === undefined) setInnerPicked(next);
    onReasonsChange?.(next);
  };

  const commit = (next: number) => {
    if (!interactive) return;
    const v = Math.min(max, Math.max(0, round(next, precision)));
    if (valueProp === undefined) setInner(v);
    onValueChange?.(v);
    // 換到另一組理由時，上一組選過的標籤一併清掉
    const list = reasonsFor(v);
    const kept = picked.filter((r) => list.includes(r));
    if (kept.length !== picked.length) setPicked(kept);
  };

  // 所有可選分數，例如 0.5、1、1.5 …；roving tabindex 停在目前分數
  const steps = Array.from({ length: Math.round(max / precision) }, (_, i) => round((i + 1) * precision, precision));
  const tabStop = steps.includes(value) ? value : steps[0];

  const onKeyDown = (e: KeyboardEvent<HTMLElement>, v: number) => {
    if (e.key === " " || e.key === "Enter") return (e.preventDefault(), commit(v));
    if ((e.key === "Backspace" || e.key === "Delete") && allowClear) return (e.preventDefault(), commit(0));
    const c = value || 0;
    const up = Math.min(max, c + precision);
    const down = Math.max(precision, c - precision);
    const next = { ArrowRight: up, ArrowUp: up, ArrowLeft: down, ArrowDown: down, Home: precision, End: max }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const r = round(next, precision);
    commit(r);
    refs.current.get(r)?.focus();
  };

  const radioLabel = (v: number) => `${t.stars(v)}${labelFor(v) ? `, ${labelFor(v)}` : ""}`;
  const list = reasonsFor(value);
  const setKey = typeof reasons === "function" ? list.join("|") : low(value) ? "low" : "high";
  const total = distribution?.reduce((s, n) => s + n, 0) ?? 0;
  const pct = value > 0 && total > 0 ? Math.round(((distribution?.[Math.ceil(value) - 1] ?? 0) / total) * 100) : null;
  const toggle = (r: string) => setPicked(picked.includes(r) ? picked.filter((x) => x !== r) : [...picked, r]);
  const release = () => setPressed(null);
  // 主文先到，標籤依序晚約 60ms 進場
  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0 },
    transition: reduce ? instant : { ...snappy, delay },
  });

  return (
    <div className={cn("inline-flex max-w-full flex-col", ink, className)}>
      {/* 容器太窄時文字標籤換到星星下方，不撐出父層 */}
      <div className="flex max-w-full flex-wrap items-center gap-x-3 gap-y-1.5">
        <div
          role="radiogroup"
          aria-label={ariaLabel}
          aria-describedby={showLabel ? labelId : undefined}
          aria-disabled={disabled || undefined}
          onPointerLeave={() => (setHover(null), release())}
          className={cn("flex items-center gap-0.5", disabled && "cursor-not-allowed opacity-50")}
        >
          {Array.from({ length: max }, (_, i) => {
            const whole = i + 1;
            const hits = precision === 0.5 ? [whole - 0.5, whole] : [whole];
            return (
              <span key={i} className={cn("relative block", starSize[size])}>
                {/* 按下時輕壓一下再回來，不做蓋章回彈 */}
                <motion.span className="absolute inset-0 block" animate={{ scale: pressed === i && !reduce ? 0.92 : 1 }} transition={snappy}>
                  <Star fill={fillOf(i)} className={starSize[size]} fillClassName={spot} />
                </motion.span>
                {hits.map((v, k) => (
                  <span
                    key={v}
                    role="radio"
                    aria-checked={value === v}
                    aria-label={radioLabel(v)}
                    aria-disabled={disabled || undefined}
                    tabIndex={disabled ? -1 : tabStop === v ? 0 : -1}
                    ref={(el) => void (el ? refs.current.set(v, el) : refs.current.delete(v))}
                    onPointerEnter={() => interactive && setHover(v)}
                    onPointerDown={() => interactive && setPressed(i)}
                    onPointerUp={release}
                    onPointerCancel={release}
                    onClick={() => commit(allowClear && value === v ? 0 : v)}
                    onKeyDown={(e) => onKeyDown(e, v)}
                    className={cn(
                      "absolute inset-y-0 cursor-pointer rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      hits.length === 2 ? (k === 0 ? "left-0 w-1/2" : "right-0 w-1/2") : "inset-x-0",
                      disabled && "cursor-not-allowed",
                    )}
                  />
                ))}
              </span>
            );
          })}
        </div>
        {showLabel && (
          <span id={labelId} className={cn("relative inline-flex min-w-[6.5em] overflow-hidden py-0.5 leading-tight whitespace-nowrap", labelSize[size])}>
            <AnimatePresence initial={false} custom={rolled.d} mode="popLayout">
              <motion.span
                key={shown}
                custom={rolled.d}
                variants={roll}
                initial={reduce ? false : "enter"}
                animate="center"
                exit={reduce ? undefined : "exit"}
                transition={reduce ? instant : { duration: 0.18, ease: [0.2, 0, 0, 1] }}
                className="inline-block"
              >
                {shown > 0 && <span className="font-mono tabular-nums">{shown.toFixed(precision === 0.5 ? 1 : 0)}</span>}
                <span className="ml-1.5 text-current/60">{labelFor(shown)}</span>
              </motion.span>
            </AnimatePresence>
          </span>
        )}
      </div>
      {hasBody && (
        // 同一個外框往下長：高度用 gentle 彈簧，星星是不動的錨點
        <motion.div initial={false} animate={{ height: bodyH }} transition={reduce ? instant : gentle} className="overflow-hidden">
          <div ref={bodyRef}>
            {value > 0 && (list.length > 0 || pct !== null) && (
              <div className="px-0.5 pt-3 pb-0.5">
                <AnimatePresence initial={false} mode="wait">
                  {list.length > 0 && (
                    <motion.div key={setKey} exit={reduce ? undefined : { opacity: 0, transition: { duration: 0.1 } }}>
                      <motion.p id={askId} {...rise(0)} className="text-sm font-medium">
                        {low(value) ? t.askLow : t.askHigh}
                      </motion.p>
                      <div role="group" aria-labelledby={askId} className="mt-2 flex flex-wrap gap-1.5">
                        {list.map((r, i) => {
                          const on = picked.includes(r);
                          return (
                            <motion.button
                              key={r}
                              type="button"
                              aria-pressed={on}
                              onClick={() => toggle(r)}
                              {...rise(0.06 * Math.min(i + 1, 5))}
                              className={cn(
                                "rounded-md border px-2.5 py-1 text-xs leading-tight transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                on
                                  ? cn(spotBorder, spotFill)
                                  : "border-[#e2e2e2] text-current/80 hover:border-[#a3a3a3] dark:border-[#333333] dark:hover:border-[#737373]",
                              )}
                            >
                              {r}
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {pct !== null && <p className={cn("text-xs text-current/60 tabular-nums", list.length > 0 && "mt-2.5")}>{t.same(pct)}</p>}
              </div>
            )}
          </div>
        </motion.div>
      )}
      {name && <input type="hidden" name={name} value={value} />}
    </div>
  );
}
