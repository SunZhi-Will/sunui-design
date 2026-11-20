"use client";

import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { springs } from "@/lib/sunui-motion";
import { cn } from "@/lib/utils";

export interface MorphMenuItem {
  id: string;
  label: ReactNode;
  /** 16px inline SVG，跟隨 currentColor */
  icon?: ReactNode;
  /** 右側小字，例如快捷鍵或數量 */
  hint?: ReactNode;
  /** 破壞性動作，例如移除 */
  danger?: boolean;
  disabled?: boolean;
  /** 在這一項上方畫一條分隔線 */
  separator?: boolean;
  onSelect?: () => void;
}

export interface MorphMenuProps {
  items: MorphMenuItem[];
  /** 觸發按鈕的無障礙名稱，未提供時依 locale 用「更多動作」 */
  label?: string;
  /** 觸發按鈕裡的圖示，預設是三個點 */
  icon?: ReactNode;
  onSelect?: (id: string) => void;
  onOpenChange?: (open: boolean) => void;
  /** 收合動畫結束、選單卸載後呼叫；放在 overflow hidden 的列裡時，用它把列的裁切還原 */
  onClosed?: () => void;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  className?: string;
  menuClassName?: string;
  /**
   * list（預設）：觸發鈕撐開成整張選單。
   * radial：角落的浮動動作鈕，動作從觸發鈕中心沿弧線散開；separator 與 hint 不顯示，label 在懸停與聚焦時出現
   */
  layout?: "list" | "radial";
  /** radial 時觸發鈕所在的角，弧線往畫面內側展開；位置本身用 className 定，例如 fixed bottom-6 right-6 */
  corner?: RadialCorner;
}

export type RadialCorner = "bottom-right" | "bottom-left" | "top-right" | "top-left";

/** 觸發鈕落在選單的哪個角；選單從這個角長出來 */
type Corner = { x: "left" | "right"; y: "top" | "bottom" };
/** 起點裁切：上、右、下、左的內縮與圓角半徑；終點是全部 0、圓角 RADIUS */
type Inset = [number, number, number, number, number];

const RADIUS = 10;
const LABELS = { en: "More actions", "zh-TW": "更多動作", "zh-CN": "更多操作", ja: "その他の操作" } as const;

function defaultLabel(tag?: string) {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? LABELS["zh-TW"] : LABELS["zh-CN"];
  return t.startsWith("ja") ? LABELS.ja : LABELS.en;
}

/** 可見範圍：視窗與所有會裁切的祖先取交集，抽屜、捲動清單裡也能正確翻面 */
function visibleBounds(el: HTMLElement) {
  const root = document.documentElement;
  let b = { top: 0, left: 0, right: root.clientWidth, bottom: root.clientHeight };
  for (let p = el.parentElement; p; p = p.parentElement) {
    const s = getComputedStyle(p);
    if (/(hidden|auto|scroll|clip)/.test(s.overflowX + s.overflowY)) {
      const r = p.getBoundingClientRect();
      b = { top: Math.max(b.top, r.top), left: Math.max(b.left, r.left), right: Math.min(b.right, r.right), bottom: Math.min(b.bottom, r.bottom) };
    }
  }
  return b;
}

/** 橫向往空間大的一側長（列尾的按鈕會往左蓋回自己那一列）；縱向預設往下，不夠才往上 */
function pickCorner(trigger: DOMRect, h: number, b: ReturnType<typeof visibleBounds>): Corner {
  const right = b.right - trigger.left;
  const left = trigger.right - b.left;
  const down = b.bottom - trigger.top;
  const up = trigger.bottom - b.top;
  return {
    x: right >= left ? "left" : "right",
    y: down >= h || down >= up ? "top" : "bottom",
  };
}

/** 起點是觸發鈕大小、落在對應角的圓；終點是整張選單 */
function insetFor({ x, y }: Corner, w: number, h: number, tw: number, th: number): Inset {
  const dx = Math.max(0, w - tw);
  const dy = Math.max(0, h - th);
  return [y === "top" ? 0 : dy, x === "left" ? dx : 0, y === "top" ? dy : 0, x === "left" ? 0 : dx, th / 2];
}

/** 進度 0 是觸發鈕形狀，1 是整張選單；彈簧過衝時可略超出 0 到 1 */
function clipAt(start: Inset, p: number) {
  const [t, r, b, l, rad] = start.map((v, i) => v + ((i === 4 ? RADIUS : 0) - v) * p);
  return `inset(${t}px ${r}px ${b}px ${l}px round ${Math.max(0, rad)}px)`;
}

/** 弧線起訖角度（螢幕座標，y 向下），一律朝畫面內側的四分之一圓 */
const ARC: Record<RadialCorner, [number, number]> = {
  "bottom-right": [180, 270],
  "bottom-left": [0, -90],
  "top-right": [180, 90],
  "top-left": [0, 90],
};

/** 項目 40px、間隔至少 8px：依數量算出半徑，弦長不小於 48px */
function radialOffsets(count: number, corner: RadialCorner) {
  const [from, to] = ARC[corner];
  const step = count > 1 ? Math.abs(to - from) / (count - 1) : 90;
  const r = Math.max(68, 48 / (2 * Math.sin((step * Math.PI) / 360)));
  return Array.from({ length: count }, (_, i) => {
    const a = ((count > 1 ? from + ((to - from) * i) / (count - 1) : (from + to) / 2) * Math.PI) / 180;
    return { x: Math.round(Math.cos(a) * r), y: Math.round(Math.sin(a) * r) };
  });
}

function Plus() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}

function Dots() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="currentColor" aria-hidden="true">
      <circle cx="3.5" cy="8" r="1.25" />
      <circle cx="8" cy="8" r="1.25" />
      <circle cx="12.5" cy="8" r="1.25" />
    </svg>
  );
}

export function MorphMenu({ items, label, icon, onSelect, onOpenChange, onClosed, locale, className, menuClassName, layout = "list", corner = "bottom-right" }: MorphMenuProps) {
  const radial = layout === "radial";
  const reduce = useReducedMotion() ?? false;
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const geo = useRef<Inset | null>(null);
  /** 目前的展開進度、內容與圖示的不透明度；中途反向時從這裡接續 */
  const now = useRef({ p: 0, content: 0, ghost: 1 });
  const running = useRef<{ stop: () => void }[]>([]);
  const returnFocus = useRef(false);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const enabled = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? []);

  function setOpenState(next: boolean, focusTrigger = false) {
    returnFocus.current = focusTrigger;
    if (next) setMounted(true);
    setOpen(next);
    onOpenChange?.(next);
  }

  // 開與關都在繪製前處理：先量尺寸、定角落、設好起點裁切，第一格畫面就是觸發鈕的形狀
  useLayoutEffect(() => {
    const menu = menuRef.current;
    const trigger = triggerRef.current;
    if (!mounted || !menu || !trigger) return;
    // radial 由 AnimatePresence 負責進出場，這裡只把焦點交給第一項
    if (radial) {
      if (open) enabled()[0]?.focus({ preventScroll: true });
      return;
    }
    running.current.forEach((a) => a.stop());
    running.current = [];
    const content = menu.querySelector<HTMLElement>("[data-content]")!;
    const ghost = menu.querySelector<HTMLElement>("[data-ghost]")!;
    // 只補間數字、每格自己寫 style，不交給 WAAPI：WAAPI 結束時會有一格退回 inline 的舊值，
    // 選單每次開完、關完都會閃一下起點形狀
    const v = now.current;
    const paint = () => {
      if (geo.current) menu.style.clipPath = clipAt(geo.current, v.p);
      content.style.opacity = String(v.content);
      ghost.style.opacity = String(v.ghost);
    };
    const tween = (key: keyof typeof v, to: number, options: object) =>
      animate(v[key], to, { ...options, onUpdate: (n: number) => { v[key] = n; paint(); } });

    if (open) {
      const t = trigger.getBoundingClientRect();
      const corner = pickCorner(t, menu.offsetHeight, visibleBounds(trigger));
      Object.assign(menu.style, { left: "", right: "", top: "", bottom: "", [corner.x]: "0px", [corner.y]: "0px" });
      Object.assign(ghost.style, { left: "", right: "", top: "", bottom: "", width: `${t.width}px`, height: `${t.height}px`, [corner.x]: "0px", [corner.y]: "0px" });
      geo.current = insetFor(corner, menu.offsetWidth, menu.offsetHeight, t.width, t.height);
      enabled()[0]?.focus({ preventScroll: true });
      if (reduce) {
        Object.assign(v, { p: 1, content: 1, ghost: 0 });
        return paint();
      }
      paint();
      // 依序：外框先從角落長開，圖示 100ms 退場，內容晚約 60ms 進場
      running.current = [
        tween("p", 1, springs.gentle),
        tween("ghost", 0, { duration: 0.1 }),
        tween("content", 1, { duration: 0.15, delay: 0.06 }),
      ];
      return;
    }

    const done = () => {
      Object.assign(v, { p: 0, content: 0, ghost: 1 });
      setMounted(false);
    };
    if (reduce || !geo.current) return done();
    const shrink = tween("p", 0, { ...springs.snappy, restDelta: 0.005, restSpeed: 0.05 });
    running.current = [tween("content", 0, { duration: 0.08 }), tween("ghost", 1, { duration: 0.12, delay: 0.1 }), shrink];
    // stop() 也會讓 promise 完成，被重新打開打斷時不能卸載
    void shrink.then(() => {
      if (running.current.includes(shrink)) done();
    });
  }, [open, mounted, reduce, radial]);

  const wasMounted = useRef(false);
  useEffect(() => {
    if (mounted) wasMounted.current = true;
    else if (wasMounted.current) {
      wasMounted.current = false;
      if (returnFocus.current) triggerRef.current?.focus();
      onClosed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      const n = e.target as Node;
      if (!menuRef.current?.contains(n) && !triggerRef.current?.contains(n)) setOpenState(false);
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function onMenuKey(e: KeyboardEvent<HTMLDivElement>) {
    const list = enabled();
    const i = list.indexOf(document.activeElement as HTMLElement);
    const go = (n: number) => list[(n + list.length) % list.length]?.focus();
    if (e.key === "ArrowDown" || (radial && e.key === "ArrowRight")) go(i + 1);
    else if (e.key === "ArrowUp" || (radial && e.key === "ArrowLeft")) go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(list.length - 1);
    else if (e.key === "Escape") setOpenState(false, true);
    else if (e.key === "Tab") return setOpenState(false);
    else return;
    e.preventDefault();
  }

  function choose(item: MorphMenuItem) {
    if (item.disabled) return;
    item.onSelect?.();
    onSelect?.(item.id);
    setOpenState(false, true);
  }

  const name = label ?? defaultLabel(locale);

  if (radial) {
    const offsets = radialOffsets(items.length, corner);
    const tipLeft = corner.endsWith("right");
    const n = items.length;
    return (
      <div className={cn("relative inline-flex", className)}>
        <AnimatePresence onExitComplete={() => setMounted(false)}>
          {open && (
            <div ref={menuRef} id={id} role="menu" aria-label={name} onKeyDown={onMenuKey} className={cn("absolute inset-0", menuClassName)}>
              {items.map((item, i) => {
                const { x, y } = offsets[i];
                // 從觸發鈕中心出發，0.96 起跳，依序錯開 30ms；收合時反向回到中心
                const fly = reduce ? { duration: 0 } : { ...springs.snappy, delay: i * 0.03, opacity: { duration: 0.12, delay: i * 0.03 } };
                const back = reduce ? { duration: 0 } : { ...springs.snappy, delay: (n - 1 - i) * 0.02, opacity: { duration: 0.1, delay: (n - 1 - i) * 0.02 } };
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    tabIndex={-1}
                    aria-label={typeof item.label === "string" ? item.label : undefined}
                    aria-disabled={item.disabled || undefined}
                    onClick={() => choose(item)}
                    initial={{ x: 0, y: 0, scale: 0.96, opacity: 0 }}
                    animate={{ x, y, scale: 1, opacity: 1, transition: fly }}
                    exit={{ x: 0, y: 0, scale: 0.96, opacity: 0, transition: back }}
                    whileTap={reduce || item.disabled ? undefined : { scale: 0.97, transition: springs.snappy }}
                    className={cn(
                      "group absolute left-1/2 top-1/2 -ml-5 -mt-5 flex size-10 items-center justify-center rounded-full bg-card outline-none transition-colors duration-150 hover:bg-muted hover:duration-0 focus-visible:ring-2 focus-visible:ring-ring",
                      "shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_4px_8px_-4px_rgb(0_0_0/0.06),0_12px_20px_-8px_rgb(0_0_0/0.08)] dark:bg-muted dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(255_255_255/0.08)]",
                      item.danger ? "text-destructive" : "text-card-foreground",
                      item.disabled && "pointer-events-none opacity-50",
                    )}
                  >
                    <span aria-hidden="true" className="flex size-4 items-center justify-center [&>svg]:size-4">{item.icon}</span>
                    <span
                      aria-hidden={typeof item.label === "string" || undefined}
                      className={cn(
                        "pointer-events-none absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-card px-2 py-1 text-xs font-medium text-card-foreground opacity-0 transition-opacity duration-150",
                        "shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(255_255_255/0.08)]",
                        "group-hover:opacity-100 group-hover:duration-0 group-focus-visible:opacity-100 group-focus-visible:duration-0",
                        tipLeft ? "right-[calc(100%+0.5rem)]" : "left-[calc(100%+0.5rem)]",
                      )}
                    >
                      {item.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}
        </AnimatePresence>
        <motion.button
          ref={triggerRef}
          type="button"
          aria-label={name}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={mounted ? id : undefined}
          onClick={() => setOpenState(!open)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setOpenState(true);
            }
          }}
          whileTap={reduce ? undefined : { scale: 0.97, transition: springs.snappy }}
          className="relative inline-flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground outline-none shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_0_0_1px_rgb(0_0_0/0.06),0_4px_8px_-4px_rgb(0_0_0/0.06),0_12px_20px_-8px_rgb(0_0_0/0.08)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:size-5"
        >
          {/* 預設的加號轉成叉，同一個圖示說明「再按一次收起」 */}
          <motion.span className="flex" animate={{ rotate: open && !icon ? 45 : 0 }} transition={reduce ? { duration: 0 } : springs.snappy}>
            {icon ?? <Plus />}
          </motion.span>
        </motion.button>
      </div>
    );
  }

  return (
    <div className={cn("relative inline-flex", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={name}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={mounted ? id : undefined}
        onClick={() => setOpenState(!open)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpenState(true);
          }
        }}
        className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-card text-card-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        {icon ?? <Dots />}
      </button>

      {mounted && (
        <div
          ref={menuRef}
          id={id}
          role="menu"
          aria-label={name}
          onKeyDown={onMenuKey}
          className={cn(
            "absolute z-50 w-max min-w-48 max-w-[min(18rem,calc(100vw-2rem))] rounded-[10px] border border-border bg-card p-1 text-sm text-card-foreground shadow-[0_1px_0_rgb(0_0_0/0.04)]",
            menuClassName,
          )}
        >
          {/* 觸發鈕的圖示留在原位，外框長開時才退場，視線有錨點 */}
          <span data-ghost aria-hidden="true" className="pointer-events-none absolute flex items-center justify-center opacity-0">
            {icon ?? <Dots />}
          </span>
          <div data-content>
            {items.map((item) => (
              <div key={item.id}>
                {item.separator && <div role="separator" className="-mx-1 my-1 h-px bg-border" />}
                <button
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  aria-disabled={item.disabled || undefined}
                  onClick={() => choose(item)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left outline-none transition-colors hover:bg-muted focus-visible:bg-muted",
                    item.danger ? "text-destructive" : "text-card-foreground",
                    item.disabled && "pointer-events-none opacity-50",
                  )}
                >
                  {item.icon && <span className={cn("flex size-4 shrink-0 items-center justify-center [&>svg]:size-4", !item.danger && "text-muted-foreground")}>{item.icon}</span>}
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.hint && <span className="shrink-0 pl-4 text-xs text-muted-foreground tabular-nums">{item.hint}</span>}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
