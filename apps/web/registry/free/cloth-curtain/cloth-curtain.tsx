"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type MutableRefObject, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { createClothRenderer, DEFAULT_CLOTH_TONES, type ClothTones } from "./cloth-renderer";
import { createClothPanel, type ClothHand, type ClothPanel } from "./cloth-simulation";

export type { ClothTones } from "./cloth-renderer";

const MAX_PIXEL_RATIO = 2;
const SETTLE_STEPS = 45;
const MAX_STEPS_PER_FRAME = 2;
const STEP_MS = 1000 / 60;
/** 布先垂好，風才慢慢起來，一出現就要是拉好的簾子。 */
const BREEZE_RISE_SECONDS = 2.5;
const OPEN_FOLLOW = 0.075;
const OPEN_DAMPING = 0.72;
/** 布邊要超出畫面，晃動時才不會露出沒有布的縫。 */
const BLEED = 0.14;

export interface ClothCurtainProps {
  /** single：一整片，往右收。pair：左右兩片，從中間分開。 */
  layout?: "single" | "pair";
  /** 0 是拉上，1 是完全收到畫面外。 */
  open: number;
  /** 布有多透。整片蓋住畫面的轉場要用 0，後面換場景才不會露餡。 */
  sheer?: number;
  breeze?: number;
  /** 一陣掀起簾子的強風，0 到 1。 */
  gust?: number;
  /** 從全關到全開至少要花幾秒。風和手都不該把布瞬間抽走。 */
  openSeconds?: number;
  /** 手的位置（視窗座標），放開時是 undefined。 */
  handRef?: MutableRefObject<{ clientX: number; clientY: number } | undefined>;
  /** 不跑模擬時顯示的靜態簾子：減量動作，或裝置沒有 WebGL。不給就用內建的條紋簾。 */
  fallback?: ReactNode;
  /** 不跑模擬。不給時跟著 prefers-reduced-motion。 */
  still?: boolean;
  /** 賽璐璐配色，預設是原本的粉紅簾布。 */
  tones?: ClothTones;
  className?: string;
}

function createPanels(layout: "single" | "pair", aspect: number): ClothPanel[] {
  if (layout === "single") {
    return [createClothPanel({ gatherSide: 1, leadX: -aspect - BLEED, edgeX: aspect + BLEED, aspect })];
  }
  return [
    createClothPanel({ gatherSide: -1, leadX: 0.16, edgeX: -aspect - BLEED, aspect }),
    createClothPanel({ gatherSide: 1, leadX: -0.16, edgeX: aspect + BLEED, aspect }),
  ];
}

/** 原作減量動作時的靜態簾子：單片用半透明寬條紋，雙片用不透明細條紋，拉開時直接切換。 */
function StaticCurtain({ layout, open, className }: { layout: "single" | "pair"; open: number; className?: string }) {
  if (layout === "single") {
    return (
      <div
        aria-hidden="true"
        className={cn("pointer-events-none absolute inset-0", className)}
        style={{
          transform: `translateX(${open * 100}%)`,
          background: "repeating-linear-gradient(90deg, rgb(232 160 186 / 78%) 0 5rem, rgb(214 134 164 / 78%) 5rem 9rem)",
        }}
      />
    );
  }
  const stripes = "repeating-linear-gradient(90deg, #eab0c4 0 34px, #f4c8d6 34px 70px, #dd97b0 70px 96px)";
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div
        className="absolute inset-y-0 left-0 w-[52%] origin-top-left"
        style={{ background: stripes, transform: `translateX(${-104 * open}%) skewX(${4 * open}deg)` }}
      />
      <div
        className="absolute inset-y-0 right-0 w-[52%] origin-top-right"
        style={{ background: stripes, transform: `translateX(${104 * open}%) skewX(${-4 * open}deg)` }}
      />
    </div>
  );
}

/** 用 WebGL 算真布的簾子：Verlet 質點網格掛在橫桿上，被風吹、被手撥、拉開時收成皺褶。 */
export function ClothCurtain({
  layout = "single",
  open,
  sheer = 0.1,
  breeze = 0.5,
  gust = 0,
  openSeconds = 1.5,
  handRef,
  fallback,
  still,
  tones = DEFAULT_CLOTH_TONES,
  className,
}: ClothCurtainProps) {
  const reduce = useReducedMotion();
  const isStill = still ?? reduce ?? false;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [unavailable, setUnavailable] = useState(false);
  const liveRef = useRef({ open, breeze, gust });
  liveRef.current = { open, breeze, gust };
  const tonesRef = useRef(tones);
  tonesRef.current = tones;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isStill) return;
    const renderer = createClothRenderer(canvas, sheer, tonesRef.current);
    if (!renderer) {
      setUnavailable(true);
      return;
    }

    let panels: ClothPanel[] = [];
    let aspect = 1;
    let shownWidth = 0;
    let shownHeight = 0;
    let shownOpen = liveRef.current.open;
    let openVelocity = 0;
    let time = 0;
    let settleSeconds = 0;

    const stepAll = (hand?: ClothHand) => {
      const live = liveRef.current;
      const fastest = STEP_MS / 1000 / openSeconds;
      openVelocity = (openVelocity + (live.open - shownOpen) * OPEN_FOLLOW) * OPEN_DAMPING;
      openVelocity = Math.max(-fastest * 2, Math.min(fastest, openVelocity));
      shownOpen += openVelocity;
      time += STEP_MS / 1000;
      for (const panel of panels) {
        const breeze = live.breeze * Math.min(1, Math.max(0, time - settleSeconds) / BREEZE_RISE_SECONDS);
        panel.step(Math.max(0, shownOpen), { breeze, gust: live.gust, time, hand });
      }
    };

    const layoutToCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (width === 0 || height === 0 || (width === shownWidth && height === shownHeight)) return;
      shownWidth = width;
      shownHeight = height;
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      aspect = width / height;
      renderer.resize(Math.round(width * ratio), Math.round(height * ratio), aspect);
      panels = createPanels(layout, aspect);
      settleSeconds = time + (SETTLE_STEPS * STEP_MS) / 1000;
      for (let index = 0; index < SETTLE_STEPS; index += 1) stepAll();
    };

    const handInWorld = (): ClothHand | undefined => {
      const hand = handRef?.current;
      if (!hand) return undefined;
      const rect = canvas.getBoundingClientRect();
      return {
        x: (((hand.clientX - rect.left) / rect.width) * 2 - 1) * aspect,
        y: 1 - ((hand.clientY - rect.top) / rect.height) * 2,
      };
    };

    layoutToCanvas();
    renderer.draw(panels);

    // 畫面外或分頁在背景時停下模擬，回來時從當下接著算。
    let onScreen = true;
    let frame = 0;
    let last = performance.now();
    let owed = 0;
    const tick = (now: number) => {
      owed = Math.min(owed + now - last, STEP_MS * MAX_STEPS_PER_FRAME);
      last = now;
      const hand = handInWorld();
      while (owed >= STEP_MS) {
        stepAll(hand);
        owed -= STEP_MS;
      }
      renderer.draw(panels);
      frame = requestAnimationFrame(tick);
    };
    const run = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (!onScreen || document.hidden) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };
    run();

    const observer = new ResizeObserver(layoutToCanvas);
    observer.observe(canvas);
    const visibility = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? true;
      run();
    });
    visibility.observe(canvas);
    document.addEventListener("visibilitychange", run);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibility.disconnect();
      document.removeEventListener("visibilitychange", run);
      renderer.dispose();
    };
    // 模擬只在版型或布料變了才重建；open／breeze／gust 走 liveRef，改變時不重建。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStill, layout, sheer, openSeconds]);

  if (isStill || unavailable) {
    return <>{fallback ?? <StaticCurtain layout={layout} open={open} className={className} />}</>;
  }
  return (
    <canvas
      ref={canvasRef}
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      aria-hidden="true"
    />
  );
}
