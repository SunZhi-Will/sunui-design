"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** 品牌專色：預設跟著主題的 --primary，買家設 --sunui-spot 就換成自己的品牌色。只用在選中、優惠、目前進度 */
const spotBorder = "border-[color:var(--sunui-spot,var(--primary))]";
const spotFill = "bg-[color:var(--sunui-spot,var(--primary))] text-[color:var(--sunui-spot-foreground,var(--primary-foreground))]";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  gentle: { type: "spring", stiffness: 240, damping: 30 },
} as const;

export interface Hotspot {
  id: string;
  /** 水平位置，0 到 100（%） */
  x: number;
  /** 垂直位置，0 到 100（%） */
  y: number;
  title: ReactNode;
  description?: ReactNode;
  /** 說明卡底部的動作，例如價格或「加入購物車」 */
  action?: ReactNode;
  /** 給螢幕閱讀器的按鈕名稱；不給時用 title */
  label?: string;
}

export interface HotspotsProps {
  /** 底圖，通常是一張 img；容器會依它的尺寸撐開 */
  children: ReactNode;
  spots: Hotspot[];
  /** 受控：目前打開哪一個 */
  active?: string | null;
  defaultActive?: string | null;
  onActiveChange?: (id: string | null) => void;
  /** number：顯示編號；dot：只有圓點 */
  marker?: "number" | "dot";
  /** 說明卡寬度（px） */
  cardWidth?: number;
  className?: string;
}

export function Hotspots({ children, spots, active: activeProp, defaultActive = null, onActiveChange, marker = "number", cardWidth = 224, className }: HotspotsProps) {
  const reduce = useReducedMotion();
  const uid = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [inner, setInner] = useState<string | null>(defaultActive);
  const active = activeProp !== undefined ? activeProp : inner;
  const open = spots.find((s) => s.id === active) ?? null;

  const set = (id: string | null) => {
    if (activeProp === undefined) setInner(id);
    onActiveChange?.(id);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && set(null);
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) set(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open?.id]);

  // 說明卡放在點的哪一側：靠右的點往左開、靠下的點往上開
  const place = (s: Hotspot) => ({
    side: s.x > 55 ? "left" : "right",
    vertical: s.y > 60 ? "up" : "down",
  });

  return (
    <div ref={rootRef} className={cn("relative isolate", className)}>
      {children}
      {spots.map((s, i) => {
        const on = s.id === active;
        return (
          <motion.button
            key={s.id}
            type="button"
            aria-expanded={on}
            aria-controls={on ? `${uid}-card` : undefined}
            aria-label={s.label ?? (typeof s.title === "string" ? s.title : `${i + 1}`)}
            onClick={() => set(on ? null : s.id)}
            whileTap={reduce ? undefined : { scale: 0.9 }}
            transition={springs.snappy}
            className={cn(
              "absolute z-10 -ml-3.5 -mt-3.5 grid size-7 place-items-center rounded-full border-[1.5px] text-xs font-semibold tabular-nums outline-offset-2 transition-colors focus-visible:outline-2",
              on
                ? cn(spotBorder, spotFill)
                : "border-[#171717] bg-[#f7f7f7] text-[#171717] hover:bg-[#e2e2e2] dark:border-[#ededed] dark:bg-[#1c1c1c] dark:text-[#ededed]",
            )}
            style={{ left: `${s.x}%`, top: `${s.y}%` }}
          >
            <motion.span initial={false} animate={{ rotate: on ? 45 : 0 }} transition={reduce ? { duration: 0 } : springs.snappy} className="grid place-items-center">
              {on || marker === "dot" ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-3.5" aria-hidden="true">
                  <path d="M12 6v12M6 12h12" />
                </svg>
              ) : (
                i + 1
              )}
            </motion.span>
          </motion.button>
        );
      })}
      <AnimatePresence>
        {open && (
          <div
            key={open.id}
            className="pointer-events-none absolute z-20"
            style={{
              left: `${open.x}%`,
              top: `${open.y}%`,
              width: cardWidth,
              maxWidth: "calc(100% - 1rem)",
              transform: `translate(${place(open).side === "left" ? "calc(-100% - 22px)" : "22px"}, ${place(open).vertical === "up" ? "calc(-100% + 14px)" : "-14px"})`,
            }}
          >
            <motion.div
              id={`${uid}-card`}
              role="region"
              aria-label={typeof open.title === "string" ? open.title : undefined}
              className="pointer-events-auto rounded-md border border-[#e2e2e2] bg-[#f7f7f7] p-3.5 text-[#171717] shadow-[0_1px_0_rgb(0_0_0/0.04)] dark:border-[#333333] dark:bg-[#1c1c1c] dark:text-[#ededed]"
              style={{ originX: place(open).side === "left" ? 1 : 0, originY: place(open).vertical === "up" ? 1 : 0 }}
              initial={{ opacity: 0, scale: reduce ? 1 : 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              transition={reduce ? { duration: 0 } : springs.gentle}
            >
              <p className="text-sm font-semibold tracking-tight">{open.title}</p>
              {open.description && <p className="mt-1 text-xs leading-relaxed text-[#171717]/70 dark:text-[#ededed]/70">{open.description}</p>}
              {open.action && <div className="mt-3 border-t border-dashed border-[#e2e2e2] pt-3 dark:border-[#333333]">{open.action}</div>}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
