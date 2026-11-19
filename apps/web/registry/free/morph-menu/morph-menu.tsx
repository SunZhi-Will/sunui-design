"use client";

import { animate, useReducedMotion } from "framer-motion";
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { springs } from "@/lib/sunui-motion";
import { cn } from "@/lib/utils";

export interface MorphMenuItem {
  id: string;
  label: ReactNode;
  /** 16px inline SVG, follows currentColor */
  icon?: ReactNode;
  /** Small text on the right, for example a shortcut or a count */
  hint?: ReactNode;
  /** Destructive action, for example remove */
  danger?: boolean;
  disabled?: boolean;
  /** Draws a divider above this item */
  separator?: boolean;
  onSelect?: () => void;
}

export interface MorphMenuProps {
  items: MorphMenuItem[];
  /** Accessible name of the trigger button; when omitted, uses "More actions" in the current locale */
  label?: string;
  /** Icon inside the trigger button, defaults to three dots */
  icon?: ReactNode;
  onSelect?: (id: string) => void;
  onOpenChange?: (open: boolean) => void;
  /** Called after the collapse animation ends and the menu unmounts; when placed in a row with overflow hidden, use it to restore the row's clipping */
  onClosed?: () => void;
  /** UI language: en, zh-TW, zh-CN, ja. Tags like zh-Hant-HK and ja-JP are also accepted */
  locale?: string;
  className?: string;
  menuClassName?: string;
}

/** Which corner of the menu the trigger sits in; the menu grows out from that corner */
type Corner = { x: "left" | "right"; y: "top" | "bottom" };
/** Starting clip: top, right, bottom, left insets and corner radius; the end is all 0 with corner radius RADIUS */
type Inset = [number, number, number, number, number];

const RADIUS = 10;
const LABELS = { en: "More actions", "zh-TW": "更多動作", "zh-CN": "更多操作", ja: "その他の操作" } as const;

function defaultLabel(tag?: string) {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? LABELS["zh-TW"] : LABELS["zh-CN"];
  return t.startsWith("ja") ? LABELS.ja : LABELS.en;
}

/** Visible area: the intersection of the viewport and every clipping ancestor, so flipping works inside drawers and scrolling lists too */
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

/** Horizontally grows toward the side with more room (a button at the end of a row covers its own row, extending left); vertically grows down by default, up only when there is not enough room */
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

/** The start is a circle the size of the trigger, at the matching corner; the end is the whole menu */
function insetFor({ x, y }: Corner, w: number, h: number, tw: number, th: number): Inset {
  const dx = Math.max(0, w - tw);
  const dy = Math.max(0, h - th);
  return [y === "top" ? 0 : dy, x === "left" ? dx : 0, y === "top" ? dy : 0, x === "left" ? 0 : dx, th / 2];
}

/** Progress 0 is the trigger shape, 1 is the whole menu; spring overshoot may go slightly outside 0 to 1 */
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
  /** Current expansion progress and the opacity of content and icon; a mid-way reversal continues from here */
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

  // Both opening and closing are handled before paint: measure the size, pick the corner and set the start clip, so the first frame is the trigger shape
  useLayoutEffect(() => {
    const menu = menuRef.current;
    const trigger = triggerRef.current;
    if (!mounted || !menu || !trigger) return;
    running.current.forEach((a) => a.stop());
    running.current = [];
    const content = menu.querySelector<HTMLElement>("[data-content]")!;
    const ghost = menu.querySelector<HTMLElement>("[data-ghost]")!;
    // Only tween numbers and write style each frame ourselves instead of using WAAPI: when WAAPI finishes, one frame falls back to the old inline value,
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
      // In order: the frame grows from the corner first, the icon leaves in 100ms, and the content enters about 60ms later
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
    // stop() also resolves the promise, so we must not unmount when interrupted by a reopen
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
          {/* The trigger icon stays in place and only leaves once the frame has grown, giving the eye an anchor */}
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
