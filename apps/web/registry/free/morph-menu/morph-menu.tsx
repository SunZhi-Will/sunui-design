"use client";

import { animate, useReducedMotion } from "framer-motion";
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
}

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

function Dots() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="currentColor" aria-hidden="true">
      <circle cx="3.5" cy="8" r="1.25" />
      <circle cx="8" cy="8" r="1.25" />
      <circle cx="12.5" cy="8" r="1.25" />
    </svg>
  );
}

export function MorphMenu({ items, label, icon, onSelect, onOpenChange, onClosed, locale, className, menuClassName }: MorphMenuProps) {
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
  }, [open, mounted, reduce]);

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
    if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i - 1);
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
