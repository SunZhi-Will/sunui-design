"use client";

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, type Transition } from "framer-motion";
import { useEffect, useRef, useState, type ElementType, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  gentle: { type: "spring", stiffness: 240, damping: 30 },
} as const;

/** 只在有滑鼠的裝置啟用；觸控裝置上這些效果自動關閉 */
function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFine(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return fine;
}

/* ───────────── Magnetic ───────────── */

export interface MagneticProps {
  children: ReactNode;
  /** 跟隨游標的比例，0.35 表示移動游標距離的 35% */
  strength?: number;
  /** 感應範圍，元件邊緣往外多少 px 就開始吸 */
  radius?: number;
  className?: string;
}

/** 磁吸：游標靠近時元件被輕輕拉過去，離開後彈回原位。包住一顆按鈕使用。 */
export function Magnetic({ children, strength = 0.35, radius = 48, className }: MagneticProps) {
  const reduce = useReducedMotion();
  const fine = useFinePointer();
  const ref = useRef<HTMLSpanElement>(null);
  const x = useSpring(0, springs.gentle);
  const y = useSpring(0, springs.gentle);
  const active = fine && !reduce;

  useEffect(() => {
    if (!active) return;
    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const inside = e.clientX > r.left - radius && e.clientX < r.right + radius && e.clientY > r.top - radius && e.clientY < r.bottom + radius;
      x.set(inside ? (e.clientX - cx) * strength : 0);
      y.set(inside ? (e.clientY - cy) * strength : 0);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [active, radius, strength, x, y]);

  return (
    <motion.span ref={ref} style={{ x, y }} className={cn("inline-block", className)}>
      {children}
    </motion.span>
  );
}

/* ───────────── InkUnderline ───────────── */

export interface InkUnderlineProps {
  children: ReactNode;
  /** 預設是 a；也可以傳 "button" 或自己的 Link 元件 */
  as?: ElementType;
  href?: string;
  /** 目前所在頁面：底線常駐 */
  active?: boolean;
  /** 底線顏色：ink 墨色、accent 朱紅 */
  tone?: "ink" | "accent";
  className?: string;
  [key: string]: unknown;
}

/** 墨線底線：滑入時從左畫出，滑出時往右收走。 */
export function InkUnderline({ children, as: Tag = "a", active = false, tone = "ink", className, ...rest }: InkUnderlineProps) {
  return (
    <Tag
      {...rest}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group/ink relative inline-block py-0.5 outline-offset-4 focus-visible:outline-2",
        "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-right after:scale-x-0 after:transition-transform after:duration-300 after:ease-out motion-reduce:after:transition-none",
        "hover:after:origin-left hover:after:scale-x-100 focus-visible:after:origin-left focus-visible:after:scale-x-100",
        active && "after:scale-x-100",
        // 目前頁的底線用品牌專色，其餘維持墨色
        active ? "after:bg-[color:var(--sunui-spot,var(--primary))]" : tone === "ink" ? "after:bg-[#171717] dark:after:bg-[#ededed]" : "after:bg-[#171717] dark:after:bg-[#ededed]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/* ───────────── TextRoll ───────────── */

export interface TextRollProps {
  /** 只接受文字，才能逐字滾動 */
  children: string;
  /** 每個字之間的延遲（秒） */
  stagger?: number;
  /** 滾入的那一層用的 class，例如換成朱紅 */
  rollClassName?: string;
  /** 由父層控制是否處於 hover；不傳時自己偵測 */
  hovered?: boolean;
  className?: string;
}

/** 文字滾動：滑入時每個字往上滾出，同一個字從下方滾入。放在選單連結或按鈕裡。 */
export function TextRoll({ children, stagger = 0.025, rollClassName, hovered, className }: TextRollProps) {
  const reduce = useReducedMotion();
  const [self, setSelf] = useState(false);
  const on = hovered ?? self;
  const chars = Array.from(children);
  const transition = (i: number): Transition => (reduce ? { duration: 0 } : { ...springs.snappy, delay: i * stagger });

  return (
    <span
      className={cn("relative inline-flex overflow-hidden whitespace-pre leading-[1.2]", className)}
      onPointerEnter={() => setSelf(true)}
      onPointerLeave={() => setSelf(false)}
      onFocus={() => setSelf(true)}
      onBlur={() => setSelf(false)}
    >
      <span className="sr-only">{children}</span>
      {chars.map((c, i) => (
        <span key={i} aria-hidden="true" className="relative inline-block">
          <motion.span className="inline-block" initial={false} animate={{ y: on ? "-110%" : "0%" }} transition={transition(i)}>
            {c}
          </motion.span>
          <motion.span className={cn("absolute left-0 top-0 inline-block", rollClassName)} initial={false} animate={{ y: on ? "0%" : "110%" }} transition={transition(i)}>
            {c}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/* ───────────── HoverPreviewList ───────────── */

export interface HoverPreviewItem {
  id: string;
  title: ReactNode;
  /** 右側的次要資訊，例如價格或年份 */
  meta?: ReactNode;
  /** 游標旁浮出的預覽，通常是一張圖 */
  preview: ReactNode;
  href?: string;
}

export interface HoverPreviewListProps {
  items: HoverPreviewItem[];
  /** 預覽框尺寸（px） */
  previewSize?: { width: number; height: number };
  className?: string;
}

/** 文字清單：滑到哪一列，那一列的圖就出現在游標旁並跟著走。觸控裝置不顯示預覽。 */
export function HoverPreviewList({ items, previewSize = { width: 200, height: 250 }, className }: HoverPreviewListProps) {
  const reduce = useReducedMotion();
  const fine = useFinePointer();
  const listRef = useRef<HTMLUListElement>(null);
  const [hover, setHover] = useState<string | null>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, reduce ? { stiffness: 10000, damping: 1000 } : springs.gentle);
  const y = useSpring(my, reduce ? { stiffness: 10000, damping: 1000 } : springs.gentle);
  const current = items.find((i) => i.id === hover);

  const move = (e: ReactPointerEvent) => {
    const r = listRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(e.clientX - r.left + 24);
    my.set(e.clientY - r.top - previewSize.height / 2);
  };

  return (
    <ul ref={listRef} className={cn("relative", className)} onPointerMove={move} onPointerLeave={() => setHover(null)}>
      {items.map((item) => {
        const Row = item.href ? "a" : "div";
        return (
          <li key={item.id} className="border-b border-[#e2e2e2] first:border-t dark:border-[#333333]">
            <Row
              href={item.href}
              tabIndex={item.href ? undefined : 0}
              onPointerEnter={() => setHover(item.id)}
              onFocus={() => setHover(item.id)}
              onBlur={() => setHover(null)}
              className={cn(
                "flex items-baseline justify-between gap-4 py-4 outline-offset-2 transition-colors focus-visible:outline-2",
                hover && hover !== item.id ? "text-[#171717]/35 dark:text-[#ededed]/35" : "text-[#171717] dark:text-[#ededed]",
              )}
            >
              <span className="text-lg font-medium tracking-tight sm:text-2xl">{item.title}</span>
              {item.meta && <span className="shrink-0 text-sm tabular-nums opacity-60">{item.meta}</span>}
            </Row>
          </li>
        );
      })}
      {fine && (
        <motion.div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 z-10" style={{ x, y, width: previewSize.width, height: previewSize.height }}>
          <AnimatePresence>
            {current && (
              <motion.div
                key={current.id}
                className="absolute inset-0 overflow-hidden rounded-md border border-[#e2e2e2] bg-[#f7f7f7] dark:border-[#333333] dark:bg-[#1c1c1c]"
                initial={{ opacity: 0, scale: reduce ? 1 : 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.18, ease: "easeOut" }}
              >
                {current.preview}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </ul>
  );
}
