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
/** The cloth hangs first and the wind rises slowly; on first appearance it must already be a drawn curtain. */
const BREEZE_RISE_SECONDS = 2.5;
const OPEN_FOLLOW = 0.075;
const OPEN_DAMPING = 0.72;
/** The cloth edges extend past the frame so no gap without cloth shows while it sways. */
const BLEED = 0.14;

export interface ClothCurtainProps {
  /** single: one piece, gathers to the right. pair: two pieces, part from the middle. */
  layout?: "single" | "pair";
  /** 0 is drawn shut, 1 is fully gathered off screen. */
  open: number;
  /** How see-through the cloth is. Use 0 for a transition that covers the whole screen, so the scene change behind it is not revealed. */
  sheer?: number;
  breeze?: number;
  /** A strong gust that lifts the curtain, 0 to 1. */
  gust?: number;
  /** Minimum seconds from fully closed to fully open. Neither wind nor hand should snatch the cloth away instantly. */
  openSeconds?: number;
  /** Hand position (viewport coordinates), undefined when released. */
  handRef?: MutableRefObject<{ clientX: number; clientY: number } | undefined>;
  /** Static curtain shown when the simulation does not run: reduced motion, or a device without WebGL. Falls back to the built-in striped curtain. */
  fallback?: ReactNode;
  /** Skip the simulation. When omitted, follows prefers-reduced-motion. */
  still?: boolean;
  /** Cel-shaded palette, a thick dark wine-red curtain by default. */
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

/** Static curtain for reduced motion: a single piece uses wide translucent stripes, a pair uses thin opaque stripes, and opening switches directly. */
function StaticCurtain({ layout, open, className }: { layout: "single" | "pair"; open: number; className?: string }) {
  if (layout === "single") {
    return (
      <div
        aria-hidden="true"
        className={cn("pointer-events-none absolute inset-0", className)}
        style={{
          transform: `translateX(${open * 100}%)`,
          background: "repeating-linear-gradient(90deg, rgb(115 46 38 / 92%) 0 5rem, rgb(92 37 31 / 92%) 5rem 9rem)",
        }}
      />
    );
  }
  const stripes = "repeating-linear-gradient(90deg, #7a3127 0 34px, #8a3a2e 34px 70px, #682a21 70px 96px)";
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

/** A real-cloth curtain simulated in WebGL: a Verlet particle grid hung on a rod, blown by wind, pushed by hand, and gathering into folds when opened. */
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

    // Pause the simulation while off screen or the tab is in the background; resume from the current state on return.
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
    // The simulation is rebuilt only when the layout or cloth changes; open/breeze/gust go through liveRef and do not rebuild.
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
