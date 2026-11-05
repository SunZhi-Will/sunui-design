"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import { type FxDefinition, type FxInstance, Painter, clearFrame, composite, createFrame, fit } from "./pixel-fx-core";

export { collectBurst, confetti, pixelDissolve, pixelReveal, GOLD_RAMP, PAPER_CONFETTI } from "./pixel-fx-effects";
export type { FxDefinition } from "./pixel-fx-core";

export interface PixelFxProps {
  /** Which effect: collectBurst, confetti, pixelDissolve, pixelReveal, or your own FxDefinition. */
  effect: FxDefinition;
  /** Change it to play the effect again; 0 or undefined waits. Each play uses the next seed. */
  trigger?: number;
  /** Play once on mount. */
  autoPlay?: boolean;
  /** Screen pixels per art pixel. 3 reads as pixel art on phones and desktops alike. */
  pixelSize?: number;
  /** Dark-to-bright hex ramp (confetti: any list of colors). Resampled to what the effect needs. */
  palette?: readonly string[];
  /** Where the effect's origin sits, as fractions of the box. Defaults to the effect's own. */
  origin?: readonly [number, number];
  /** Strength of the additive light (glow). 0 turns it off. */
  light?: number;
  seed?: number;
  /** Show the first frame before playing (pixelReveal uses this to start covered). */
  holdFirstFrame?: boolean;
  /** Called when a play ends, or at once under reduced motion. */
  onDone?: () => void;
  className?: string;
}

/**
 * A canvas that plays one pixel effect over its parent (give the parent `position: relative`). It renders at
 * a low art resolution and scales up with crisp pixels, ignores the pointer, and runs only while playing.
 */
export function PixelFx({
  effect,
  trigger,
  autoPlay = false,
  pixelSize = 3,
  palette,
  origin,
  light = 0.8,
  seed = 1,
  holdFirstFrame = false,
  onDone,
  className,
}: PixelFxProps) {
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const plays = useRef(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const shouldPlay = autoPlay || (trigger !== undefined && trigger !== 0);
  const paletteKey = (palette ?? effect.palette).join(",");
  const originKey = (origin ?? effect.origin).join(",");

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const box = canvas.getBoundingClientRect();
    const w = Math.max(8, Math.ceil(box.width / pixelSize)), h = Math.max(8, Math.ceil(box.height / pixelSize));
    canvas.width = w;
    canvas.height = h;
    const [ox, oy] = originKey.split(",").map(Number);
    const frame = createFrame(w, h), img = ctx.createImageData(w, h), painter = new Painter(frame).place(Math.round(ox * w), Math.round(oy * h));
    const make = (n: number): FxInstance => effect.create({ w, h, palette: fit(paletteKey.split(","), effect.steps), seed: seed + n });
    const paint = (fx: FxInstance) => {
      clearFrame(frame);
      fx.draw(painter);
      composite(frame, img.data, light);
      ctx.putImageData(img, 0, 0);
    };

    if (!shouldPlay || reduced) {
      // a still first frame is not motion, so a reveal stays covered under reduced motion until it plays
      if (holdFirstFrame && !shouldPlay) paint(make(0));
      else ctx.clearRect(0, 0, w, h);
      if (shouldPlay && reduced) doneRef.current?.();
      return;
    }

    const fx = make(plays.current++);
    let raf = 0, last = performance.now(), t = 0;
    const tick = (now: number) => {
      // a hidden tab pauses the loop; cap the step so it resumes where it was instead of jumping, but keep
      // the cap above slow devices' frame time so they stay in real time instead of slow motion
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      t += dt;
      const steps = Math.max(1, Math.ceil(dt * 120 - 1e-9));
      for (let i = 0; i < steps; i++) fx.update(dt / steps);
      if (t >= fx.duration) {
        ctx.clearRect(0, 0, w, h);
        doneRef.current?.();
        return;
      }
      paint(fx);
      raf = requestAnimationFrame(tick);
    };
    paint(fx);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [effect, trigger, shouldPlay, reduced, pixelSize, paletteKey, originKey, light, seed, holdFirstFrame]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
