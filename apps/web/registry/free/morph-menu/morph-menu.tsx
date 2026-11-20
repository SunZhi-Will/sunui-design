"use client";

import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { springs } from "@/lib/sunui-motion";
import { cn } from "@/lib/utils";

export interface MorphMenuItem {
  id: string;
  label: ReactNode;
  /** 16px inline SVG, follows currentColor */
  icon?: ReactNode;
  /** Small text on the right, e.g. a shortcut or count */
  hint?: ReactNode;
  /** Destructive action, e.g. remove */
  danger?: boolean;
  disabled?: boolean;
  /** Draw a separator above this item */
  separator?: boolean;
  onSelect?: () => void;
}

export interface MorphMenuProps {
  items: MorphMenuItem[];
  /** Accessible name of the trigger; defaults to "More actions" per locale */
  label?: string;
  /** Icon inside the trigger, defaults to three dots */
  icon?: ReactNode;
  onSelect?: (id: string) => void;
  onOpenChange?: (open: boolean) => void;
  /** Called after the collapse animation ends and the menu unmounts; inside an overflow-hidden row, use it to restore the row's clipping */
  onClosed?: () => void;
  /** UI language: en, zh-TW, zh-CN, ja; also accepts tags like zh-Hant-HK or ja-JP */
  locale?: string;
  className?: string;
  menuClassName?: string;
  /**
   * list (default): the trigger expands into the full menu.
   * radial: a floating corner action button; actions fan out from its centre along an arc. separator and hint are not shown, label appears on hover and focus
   */
  layout?: "list" | "radial";
  /** For radial, the corner the trigger sits in; the arc opens toward the inside of the screen. Set the position itself with className, e.g. fixed bottom-6 right-6 */
  corner?: RadialCorner;
}

export type RadialCorner = "bottom-right" | "bottom-left" | "top-right" | "top-left";

/** Which menu corner the trigger lands on; the menu grows from this corner */
type Corner = { x: "left" | "right"; y: "top" | "bottom" };
/** Start clip: top, right, bottom, left insets and corner radius; the end is all 0 with radius RADIUS */
type Inset = [number, number, number, number, number];

const RADIUS = 10;
const LABELS = { en: "More actions", "zh-TW": "更多動作", "zh-CN": "更多操作", ja: "その他の操作" } as const;

function defaultLabel(tag?: string) {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? LABELS["zh-TW"] : LABELS["zh-CN"];
  return t.startsWith("ja") ? LABELS.ja : LABELS.en;
}

/** Visible area: intersection of the viewport and all clipping ancestors, so flipping works inside drawers and scroll lists */
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

/** Horizontally grow toward the side with more space (a button at the end of a row covers back over its own row); vertically down by default, up only when needed */
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

/** Start is a circle the size of the trigger at the matching corner; end is the full menu */
function insetFor({ x, y }: Corner, w: number, h: number, tw: number, th: number): Inset {
  const dx = Math.max(0, w - tw);
  const dy = Math.max(0, h - th);
  return [y === "top" ? 0 : dy, x === "left" ? dx : 0, y === "top" ? dy : 0, x === "left" ? 0 : dx, th / 2];
}

/** Progress 0 is the trigger shape, 1 is the full menu; may slightly exceed 0 to 1 on spring overshoot */
function clipAt(start: Inset, p: number) {
  const [t, r, b, l, rad] = start.map((v, i) => v + ((i === 4 ? RADIUS : 0) - v) * p);
  return `inset(${t}px ${r}px ${b}px ${l}px round ${Math.max(0, rad)}px)`;
}

/** Arc start and end angles (screen coordinates, y down), always the quarter circle facing the inside of the screen */
const ARC: Record<RadialCorner, [number, number]> = {
  "bottom-right": [180, 270],
  "bottom-left": [0, -90],
  "top-right": [180, 90],
  "top-left": [0, 90],
};

/** Items 40px with at least 8px gap: radius is derived from the count so the chord is at least 48px */
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
  /** Current expand progress and content and icon opacity; a mid-way reversal continues from here */
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

  // Both open and close are handled before paint: measure, pick the corner, set the start clip, so the first frame is the trigger shape
  useLayoutEffect(() => {
    const menu = menuRef.current;
    const trigger = triggerRef.current;
    if (!mounted || !menu || !trigger) return;
    // For radial, AnimatePresence handles enter and exit; here we only move focus to the first item
    if (radial) {
      if (open) enabled()[0]?.focus({ preventScroll: true });
      return;
    }
    running.current.forEach((a) => a.stop());
    running.current = [];
    const content = menu.querySelector<HTMLElement>("[data-content]")!;
    const ghost = menu.querySelector<HTMLElement>("[data-ghost]")!;
    // Tween numbers only and write style each frame, not WAAPI: when WAAPI finishes one frame falls back to the old inline value,
    // so the menu would flash the start shape after every open and close
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
      // In order: the frame grows from the corner first, the icon exits in 100ms, the content enters about 60ms later
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
    // stop() also resolves the promise; do not unmount when interrupted by reopening
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
                // Start from the trigger centre at 0.96, staggered by 30ms; on collapse, reverse back to the centre
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
          {/* The default plus turns into a cross, the same icon saying "press again to close" */}
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
          {/* The trigger icon stays in place and exits only as the frame grows, giving the eye an anchor */}
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
