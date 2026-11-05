"use client";

// SunUI 的動態節奏。數值與 DESIGN.md 第 4 節、現有 block 完全一致，改這裡等於改整套手感。
//
// 刻意沒有的東西：fadeUp、blurIn、bounceIn、pulse、confetti。
// SunUI 只在回應使用者動作或資料改變時動，不做進場淡入與常駐循環，慶祝只有蓋章。
// 完整對照見 /docs/motion。

import { useAnimate, useReducedMotion, type Transition, type Variants } from "framer-motion";
import { useCallback } from "react";

/** 三種彈簧，整套只用這三種 */
export const springs = {
  /** 按壓回饋、小元件位移 */
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  /** 狀態切換、展開收合 */
  gentle: { type: "spring", stiffness: 240, damping: 30 },
  /** 蓋章、落下這類有重量的瞬間 */
  stamp: { type: "spring", stiffness: 620, damping: 20, mass: 0.8 },
} as const satisfies Record<string, Transition>;

/** 減少動態時用的立即切換 */
export const instant: Transition = { duration: 0 };

/**
 * 按壓：按鈕、卡片被按下時輕微內縮。
 * 用法：<motion.button {...press(reduce)} />
 */
export function press(reduce?: boolean | null) {
  return reduce ? {} : { whileTap: { scale: 0.97 }, transition: springs.snappy };
}

/**
 * 蓋章：從上方壓下、略轉、落定。用於已領取、已兌換、已售完這類結果。
 * 用法：<motion.span variants={stamp} initial={reduce ? false : "lifted"} animate="pressed" exit="gone" />
 */
export const stamp: Variants = {
  lifted: { scale: 1.6, opacity: 0, rotate: -4 },
  pressed: { scale: 1, opacity: 0.9, rotate: -10, transition: springs.stamp },
  gone: { opacity: 0, transition: { duration: 0.15 } },
};

/** 錯誤輕搖的關鍵影格，像紙被推回來 */
export const shakeKeyframes = { x: [0, -6, 5, -3, 2, 0] };
export const shakeTransition: Transition = { duration: 0.32, ease: "easeOut" };

/**
 * 錯誤輕搖：回傳 [ref, shake]。輸入錯誤時呼叫 shake()；減少動態時不搖，錯誤訊息照常顯示。
 */
export function useShake<T extends HTMLElement | SVGElement = HTMLDivElement>() {
  const [scope, animate] = useAnimate<T>();
  const reduce = useReducedMotion();
  const shake = useCallback(() => {
    if (reduce || !scope.current) return;
    void animate(scope.current as HTMLElement, shakeKeyframes, shakeTransition);
  }, [animate, reduce, scope]);
  return [scope, shake] as const;
}

export type PanelSide = "left" | "right" | "bottom";

/**
 * 抽屜與底部面板：從邊緣滑入、滑回邊緣。不淡入，紙是被推進來的。
 * 用法：<motion.aside variants={panel("right")} initial="closed" animate="open" exit="closed" />
 */
export function panel(side: PanelSide, reduce?: boolean | null): Variants {
  const offscreen = side === "bottom" ? { y: "100%" } : { x: side === "left" ? "-100%" : "100%" };
  const settle = side === "bottom" ? { y: 0 } : { x: 0 };
  const transition = reduce ? instant : springs.gentle;
  return {
    closed: { ...offscreen, transition },
    open: { ...settle, transition },
  };
}

/** 面板後的遮罩：只調不透明度，不模糊 */
export const scrim: Variants = {
  closed: { opacity: 0, transition: { duration: 0.18 } },
  open: { opacity: 1, transition: { duration: 0.22 } },
};

/**
 * 清單項目的增刪：高度收合，讓下面的項目自然補位。搭配 AnimatePresence 與 layout。
 * 用法：<motion.li variants={listItem(reduce)} initial="collapsed" animate="expanded" exit="collapsed" />
 */
export function listItem(reduce?: boolean | null): Variants {
  if (reduce) {
    return { collapsed: { opacity: 0, transition: instant }, expanded: { opacity: 1, transition: instant } };
  }
  return {
    collapsed: { opacity: 0, height: 0, transition: springs.gentle },
    expanded: { opacity: 1, height: "auto", transition: springs.gentle },
  };
}

/**
 * 數字換值：舊值往變動方向離開、新值從另一側進來。direction 1 為增加，-1 為減少。
 * 用法：<AnimatePresence custom={dir} initial={false}><motion.span key={value} variants={roll} custom={dir} initial="enter" animate="center" exit="exit" /></AnimatePresence>
 */
export const roll: Variants = {
  enter: (direction: number) => ({ y: direction >= 0 ? "60%" : "-60%", opacity: 0 }),
  center: { y: 0, opacity: 1, transition: springs.snappy },
  exit: (direction: number) => ({ y: direction >= 0 ? "-60%" : "60%", opacity: 0, transition: { duration: 0.12 } }),
};
