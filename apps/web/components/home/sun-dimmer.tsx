"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { commitSiteTheme, isSiteDark } from "@/components/theme-menu";
import { EASE_SITE } from "@/lib/motion";

/**
 * 首頁開場的光源：一顆可以拖的太陽。
 * - 拖它：光跟著走。它把位置寫到開場那一段的 --sun-x / --sun-y，並替每張 [data-lit] 卡片算出光的相對位置與影子偏移
 *   （hero-scene.tsx 用這些變數畫亮面、邊緣反光和影子）。
 * - 按一下：光從太陽擴到整個頁面，蓋滿的那一幀切換成真的主題。光圈是一個白色圓加 mix-blend-mode: difference：
 *   全站只有黑白灰，差值反相就等於另一個主題，所以整頁（含頁首與預覽 iframe）不用畫兩次。淺色時同一顆圓是黑的。
 * 起始位置是場景格線裡空出來的那一格（hero-scene.tsx 的 [data-sun-home]），沒人碰過時在自己那一格裡慢慢繞。規範見 SITE-MOTION.md §6。
 */

type Copy = { label: string; toDay: string; toNight: string };

const POP = { type: "spring", stiffness: 420, damping: 30 } as const;
/** 沒人碰過時的軌道：半徑（px）與一圈的秒數 */
const ORBIT = { rx: 30, ry: 12, seconds: 14 };

const BOX = {
  left: "calc(var(--sun-x) - var(--sun-d) / 2)",
  top: "calc(var(--sun-y) - var(--sun-d) / 2)",
  width: "var(--sun-d)",
  height: "var(--sun-d)",
} as const;

export function SunDimmer({ copy }: { copy: Copy }) {
  const reduce = useReducedMotion();
  const button = useRef<HTMLButtonElement>(null);
  const section = useRef<HTMLElement | null>(null);
  const home = useRef({ x: 0, y: 0 });
  const at = useRef({ x: 0, y: 0 });
  /** 0 是原本的主題，1 是光蓋滿整個畫面 */
  const progress = useMotionValue(0);
  /** 切換後圓從 0 彈回原本大小 */
  const pop = useMotionValue(1);
  /** 蓋滿畫面需要放大幾倍，按下時量一次 */
  const cover = useRef(10);
  const drag = useRef<{ dx: number; dy: number; x: number; y: number } | null>(null);
  const moved = useRef(false);
  const skipClick = useRef(false);
  const busy = useRef(false);
  const touchedRef = useRef(false);
  const [touched, setTouched] = useState(false);
  const [held, setHeld] = useState(false);

  /** 按住時微微縮小，放開彈回 */
  const press = useMotionValue(1);

  const scale = useTransform(() => (1 + (cover.current - 1) * progress.get() ** 2) * pop.get() * press.get());
  /** 球面的明暗只在圓是原本大小時出現：光擴出去時淡掉，彈回來時跟著放大 */
  const shadeScale = useTransform(() => pop.get() * press.get());
  const shadeOpacity = useTransform(progress, [0, 0.12], [1, 0]);

  /** 把太陽放到開場座標 (x, y)，並重算每張卡的光 */
  const place = useCallback((x: number, y: number) => {
    const el = section.current;
    if (!el) return;
    at.current = { x, y };
    el.style.setProperty("--sun-x", `${x}px`);
    el.style.setProperty("--sun-y", `${y}px`);
    const base = el.getBoundingClientRect();
    if (base.bottom < 0 || base.top > window.innerHeight) return;
    for (const card of el.querySelectorAll<HTMLElement>("[data-lit]")) {
      const rect = card.getBoundingClientRect();
      if (rect.width === 0) continue;
      const left = rect.left - base.left;
      const top = rect.top - base.top;
      const dx = left + rect.width / 2 - x;
      const dy = top + rect.height / 2 - y;
      const dist = Math.hypot(dx, dy) || 1;
      // 影子往光的反方向落；離桌面越高、離光越遠，影子越長
      const length = 14 * (0.5 + Math.min(dist / 420, 1.2));
      card.style.setProperty("--lx", `${x - left}px`);
      card.style.setProperty("--ly", `${y - top}px`);
      card.style.setProperty("--shx", `${((dx / dist) * length).toFixed(1)}px`);
      card.style.setProperty("--shy", `${((dy / dist) * length).toFixed(1)}px`);
    }
  }, []);

  /** 起始位置：場景格線裡留給太陽的那一格（[data-sun-home]）的中心 */
  const readHome = useCallback(() => {
    const el = section.current;
    const slot = el?.querySelector<HTMLElement>("[data-sun-home]")?.getBoundingClientRect();
    if (!el || !slot || slot.width === 0) return;
    const base = el.getBoundingClientRect();
    home.current = { x: slot.left + slot.width / 2 - base.left, y: slot.top + slot.height / 2 - base.top - 12 };
  }, []);

  useEffect(() => {
    section.current = button.current?.closest("section") ?? null;
    const sync = () => {
      const el = section.current;
      if (!el) return;
      if (!touchedRef.current) {
        readHome();
        place(home.current.x, home.current.y);
      } else {
        const base = el.getBoundingClientRect();
        place(Math.min(at.current.x, base.width), Math.min(at.current.y, base.height));
      }
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [place, readHome]);

  // 沒人碰過時繞著起始位置慢慢轉：光掃過卡片，第一眼就看得到材質在變
  useEffect(() => {
    if (touched || reduce) return;
    const controls = animate(0, 1, {
      duration: ORBIT.seconds,
      repeat: Infinity,
      ease: "linear",
      onUpdate: (t) => {
        const angle = t * Math.PI * 2 - Math.PI / 2;
        place(home.current.x + Math.cos(angle) * ORBIT.rx, home.current.y + Math.sin(angle) * ORBIT.ry);
      },
    });
    return () => controls.stop();
  }, [touched, reduce, place]);

  function touch() {
    touchedRef.current = true;
    setTouched(true);
  }

  function measureCover() {
    const rect = button.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const far = Math.max(
      Math.hypot(cx, cy),
      Math.hypot(window.innerWidth - cx, cy),
      Math.hypot(cx, window.innerHeight - cy),
      Math.hypot(window.innerWidth - cx, window.innerHeight - cy),
    );
    cover.current = (far / (rect.width / 2)) * 1.03;
  }

  function commit() {
    commitSiteTheme(isSiteDark() ? "light" : "dark");
    progress.set(0);
    pop.set(reduce ? 1 : 0);
    if (!reduce) animate(pop, 1, POP);
    busy.current = false;
  }

  function reveal() {
    if (busy.current) return;
    busy.current = true;
    touch();
    measureCover();
    if (reduce) return commit();
    animate(progress, 1, { duration: 0.7, ease: EASE_SITE }).then(commit);
  }

  function onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (busy.current || event.button !== 0) return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* 指標已經不在了：照樣能點 */
    }
    const rect = event.currentTarget.getBoundingClientRect();
    drag.current = {
      dx: event.clientX - (rect.left + rect.width / 2),
      dy: event.clientY - (rect.top + rect.height / 2),
      x: event.clientX,
      y: event.clientY,
    };
    moved.current = false;
    setHeld(true);
    if (!reduce) animate(press, 0.94, { duration: 0.12, ease: EASE_SITE });
  }

  function onPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const state = drag.current;
    const el = section.current;
    if (!state || !el) return;
    if (!moved.current && Math.hypot(event.clientX - state.x, event.clientY - state.y) < 4) return;
    if (!moved.current) {
      moved.current = true;
      touch();
    }
    const base = el.getBoundingClientRect();
    place(
      Math.min(base.width, Math.max(0, event.clientX - state.dx - base.left)),
      Math.min(base.height, Math.max(0, event.clientY - state.dy - base.top)),
    );
  }

  function onPointerUp() {
    drag.current = null;
    setHeld(false);
    animate(press, 1, POP);
    if (moved.current) {
      // 拖曳放開後瀏覽器可能補一個 click（滑鼠會、觸控不會）：只擋這一個，不留到下一次
      moved.current = false;
      skipClick.current = true;
      window.setTimeout(() => (skipClick.current = false), 0);
    }
  }

  function onClick() {
    if (skipClick.current) {
      skipClick.current = false;
      return;
    }
    reveal();
  }

  return (
    <>
      {/* 光圈：畫在所有東西上面，反相底下的整個頁面。不接事件 */}
      <motion.div aria-hidden="true" style={{ ...BOX, scale }} className="pointer-events-none absolute z-50 rounded-full bg-white mix-blend-difference" />
      <button
        ref={button}
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onClick}
        style={BOX}
        className={`absolute z-[51] touch-none rounded-full outline-offset-8 select-none focus-visible:outline-2 focus-visible:outline-accent ${held ? "cursor-grabbing" : "cursor-grab"}`}
      >
        {/* 球面：右下暗、左上亮，讓它是一顆球而不是一個平的圓。淺色時圓是黑的，只留左上一點反光 */}
        <motion.span
          aria-hidden="true"
          style={{ scale: shadeScale, opacity: shadeOpacity }}
          className="absolute inset-0 rounded-full shadow-[inset_10px_12px_26px_rgb(255_255_255/0.2)] dark:shadow-[inset_-16px_-20px_40px_rgb(0_0_0/0.26),inset_8px_10px_18px_rgb(255_255_255/0.95)]"
        />
        <span className="sr-only">{copy.label}</span>
      </button>
      <p
        aria-hidden="true"
        style={{ left: "var(--sun-x)", top: "calc(var(--sun-y) + var(--sun-d) / 2 + 14px)" }}
        className={`pointer-events-none absolute z-20 -translate-x-1/2 rounded-full bg-bg/85 px-2.5 py-1 font-mono text-[11px] whitespace-nowrap text-subtle shadow-e1 transition-opacity duration-300 ${held ? "opacity-0" : ""}`}
      >
        <span className="hidden dark:inline">{copy.toDay}</span>
        <span className="dark:hidden">{copy.toNight}</span>
      </p>
    </>
  );
}
