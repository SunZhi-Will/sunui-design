"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { commitSiteTheme, isSiteDark } from "@/components/theme-menu";
import { EASE_SITE } from "@/lib/motion";

/**
 * 首頁開場的招牌：一顆可以拖的太陽。往上拖，光從太陽往外擴到整個頁面；拖到底（或放手時超過一半）就真的切換主題。
 * 光是一個白色圓加 mix-blend-mode: difference：全站只有黑白灰，差值反相就等於另一個主題，所以整頁（含頁首與預覽 iframe）
 * 不用畫兩次。圓蓋滿畫面的那一幀換成真的主題並把圓收回原本大小，淺色時同一顆圓看起來是黑的，往上拖就是天黑。
 * 位置與大小由外層的 --sun-x / --sun-y / --sun-d 決定（home-hero.tsx）。規範見 SITE-MOTION.md §6。
 */

type Copy = { label: string; toDay: string; toNight: string };

const POP = { type: "spring", stiffness: 420, damping: 30 } as const;
const BACK = { type: "spring", stiffness: 380, damping: 34 } as const;
/** 放手時超過這個比例就完成切換 */
const COMMIT_AT = 0.4;

const BOX = {
  left: "calc(var(--sun-x) - var(--sun-d) / 2)",
  top: "calc(var(--sun-y) - var(--sun-d) / 2)",
  width: "var(--sun-d)",
  height: "var(--sun-d)",
} as const;

export function SunDimmer({ copy }: { copy: Copy }) {
  const reduce = useReducedMotion();
  const button = useRef<HTMLButtonElement>(null);
  /** 0 是原本的主題，1 是光蓋滿整個畫面 */
  const progress = useMotionValue(0);
  /** 切換後圓從 0 彈回原本大小 */
  const pop = useMotionValue(1);
  /** 還沒人碰過時慢慢呼吸，提示這個東西是活的 */
  const breath = useMotionValue(1);
  /** 蓋滿畫面需要放大幾倍，按下時量一次 */
  const cover = useRef(10);
  const drag = useRef<{ y: number; travel: number; moved: boolean } | null>(null);
  const moved = useRef(false);
  const skipClick = useRef(false);
  const busy = useRef(false);
  const [touched, setTouched] = useState(false);
  const [held, setHeld] = useState(false);

  const scale = useTransform(() => (1 + (cover.current - 1) * progress.get() ** 2) * pop.get() * breath.get());
  const lift = useTransform(progress, (v) => -v * 40);
  const readout = useTransform(progress, (v) => String(Math.round(v * 100)).padStart(2, "0"));

  useEffect(() => {
    if (touched || reduce) return;
    const controls = animate(breath, [1, 1.05, 1], { duration: 4.2, repeat: Infinity, ease: "easeInOut" });
    return () => {
      controls.stop();
      animate(breath, 1, { duration: 0.2 });
    };
  }, [touched, reduce, breath]);

  function measure() {
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
    // 圓會跟著往上移一點，多留一些才蓋得滿
    cover.current = ((far + 48) / (rect.width / 2)) * 1.02;
  }

  function commit() {
    commitSiteTheme(isSiteDark() ? "light" : "dark");
    progress.set(0);
    pop.set(reduce ? 1 : 0);
    if (!reduce) animate(pop, 1, POP);
    busy.current = false;
  }

  function finish() {
    if (busy.current) return;
    busy.current = true;
    setTouched(true);
    measure();
    if (reduce) return commit();
    const left = 1 - progress.get();
    animate(progress, 1, { duration: 0.25 + 0.4 * left, ease: EASE_SITE }).then(commit);
  }

  function onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (busy.current || event.button !== 0) return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* 指標已經不在了：照樣能點 */
    }
    measure();
    progress.stop();
    drag.current = { y: event.clientY + progress.get() * 300, travel: Math.min(320, window.innerHeight * 0.4), moved: false };
    moved.current = false;
    setTouched(true);
    setHeld(true);
  }

  function onPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const state = drag.current;
    if (!state) return;
    const dy = state.y - event.clientY;
    if (Math.abs(dy) > 4) state.moved = moved.current = true;
    if (!state.moved) return;
    const value = Math.min(1, Math.max(0, dy / state.travel));
    progress.set(value);
    if (value >= 1) {
      // 拖到底：當下就切換，這次拖曳結束
      drag.current = null;
      setHeld(false);
      busy.current = true;
      commit();
    }
  }

  function onPointerUp() {
    const state = drag.current;
    drag.current = null;
    setHeld(false);
    if (moved.current) {
      // 拖曳放開後瀏覽器可能補一個 click（滑鼠會、觸控不會）：只擋這一個，不留到下一次
      moved.current = false;
      skipClick.current = true;
      window.setTimeout(() => (skipClick.current = false), 0);
    }
    if (!state || !state.moved) return;
    if (progress.get() >= COMMIT_AT) finish();
    else animate(progress, 0, BACK);
  }

  function onClick() {
    if (skipClick.current) {
      skipClick.current = false;
      return;
    }
    finish();
  }

  return (
    <>
      {/* 光圈：畫在所有東西上面，反相底下的整個頁面。不接事件 */}
      <motion.div
        aria-hidden="true"
        style={{ ...BOX, scale, y: lift }}
        className="pointer-events-none absolute z-50 rounded-full bg-white mix-blend-difference"
      />
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
        <span className="sr-only">{copy.label}</span>
      </button>
      {/* 讀數與提示：在光圈下面，光擴出來時會被反相，仍然讀得到 */}
      <p
        aria-hidden="true"
        style={{ left: "var(--sun-x)", top: "calc(var(--sun-y) + var(--sun-d) / 2 + 22px)" }}
        className="pointer-events-none absolute flex -translate-x-1/2 items-center gap-2.5 font-mono text-[12px] whitespace-nowrap text-subtle"
      >
        <motion.span className="text-fg tabular-nums">{readout}</motion.span>
        <span className="h-px w-5 bg-line-strong" />
        <span className="hidden dark:inline">{copy.toDay}</span>
        <span className="dark:hidden">{copy.toNight}</span>
      </p>
    </>
  );
}
