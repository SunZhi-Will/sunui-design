"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState, type RefObject } from "react";

import { pixelRecipes, type AnimatedPixelIconName } from "@/registry/icons/sunui-animated-pixel-icons";
import { motionKindOf, type AnimatedIconName } from "@/registry/icons/sunui-animated-icons";
import { twoToneMotionKindOf, type AnimatedTwoToneIconName } from "@/registry/icons/sunui-animated-twotone-icons";

// /icons 畫布的自動播放：所有有動態版的圖示一起錯開播放。
// 圖示庫本身不變（hover 類仍是滑過才播），這裡只從外部定時切換 active。
// 規劃：reports/150 動態圖示同屏深度分析-2026-11-22.md 第 5 節。

export type PlayStyle = "line" | "pixel" | "twotone";

// 每格播放多久（毫秒）：hover 播完一次，toggle 留時間看到兩種狀態，loop 轉幾圈
function playMs(style: PlayStyle, name: string): number {
  if (style !== "pixel") {
    const kind = style === "twotone" ? twoToneMotionKindOf(name as AnimatedTwoToneIconName) : motionKindOf(name as AnimatedIconName);
    return kind === "toggle" ? 1400 : kind === "loop" ? 2200 : 900;
  }
  const recipe = pixelRecipes[name as AnimatedPixelIconName];
  if (recipe.kind === "toggle") return 1400;
  if (recipe.kind === "loop") return 2200;
  return Math.max(600, (recipe.frames.length / recipe.fps) * 1000 + 150);
}

const restMs = () => 1600 + Math.random() * 2400;

/**
 * 回傳每個名稱目前是否 active。一個共用計時器排全部格子：先依序掃過一次，
 * 之後每格播完休息一段隨機時間再播。看不到畫布、分頁在背景、暫停或減少動態時全部停下。
 */
export function useStaggerPlay(
  names: readonly string[],
  style: PlayStyle,
  ref: RefObject<HTMLElement | null>,
  paused: boolean,
): Record<string, boolean> {
  const reduce = useReducedMotion() ?? false;
  const [visible, setVisible] = useState(false);
  const [pageShown, setPageShown] = useState(true);
  const [active, setActive] = useState<Record<string, boolean>>({});
  const running = !paused && visible && pageShown && !reduce;
  const key = names.join(",");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    const onVis = () => setPageShown(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [ref]);

  useEffect(() => {
    if (!running) {
      setActive({});
      return;
    }
    const list = key ? key.split(",") : [];
    const start = performance.now();
    const next = list.map((_, i) => start + i * 45);
    const until = list.map(() => 0);
    let state: Record<string, boolean> = {};
    const id = setInterval(() => {
      const now = performance.now();
      let draft: Record<string, boolean> | null = null;
      list.forEach((name, i) => {
        const on = Boolean(state[name]);
        if (on && now >= until[i]) {
          draft ??= { ...state };
          draft[name] = false;
          next[i] = now + restMs();
        } else if (!on && now >= next[i]) {
          draft ??= { ...state };
          draft[name] = true;
          until[i] = now + playMs(style, name);
        }
      });
      if (draft) {
        state = draft;
        setActive(draft);
      }
    }, 50);
    return () => clearInterval(id);
  }, [running, key, style]);

  return active;
}
