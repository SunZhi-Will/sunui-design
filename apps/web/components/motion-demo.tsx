"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import type { DemoKey } from "@/content/motion-dictionary";
import { cn } from "@/lib/utils";
import { listItem, panel, press, roll, scrim, springs, stamp, useShake } from "@/registry/lib/sunui-motion/motion";

// 動效辭典的小示範：只有使用者按「播放」或直接操作時才動，符合 DESIGN.md 第 4 節。
// 全部用 sunui-motion 本身實作，順便驗證這個 lib。

const paper = "bg-[#f7f7f7] dark:bg-[#1c1c1c] border-[#e2e2e2] dark:border-[#333333] text-[#171717] dark:text-[#ededed]";

export function MotionDemo({ demo, playLabel }: { demo: DemoKey; playLabel: string }) {
  const [run, setRun] = useState(0);
  const Demo = demos[demo];
  return (
    <div className="mt-3 flex items-center gap-3 rounded-md border border-line bg-stage p-3">
      <div className="flex min-h-16 min-w-0 flex-1 items-center justify-center">
        <Demo run={run} />
      </div>
      {demo !== "press" && (
        <button
          type="button"
          onClick={() => setRun((r) => r + 1)}
          className="shrink-0 rounded-md border border-line bg-card px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-stage focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {playLabel}
        </button>
      )}
    </div>
  );
}

type DemoProps = { run: number };

function PressDemo() {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      {...press(reduce)}
      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      Add to cart
    </motion.button>
  );
}

function StampDemo({ run }: DemoProps) {
  const reduce = useReducedMotion();
  return (
    <div className={cn("relative w-full max-w-60 rounded-md border px-3 py-2.5", paper)}>
      <p className="text-[11px] tracking-[0.12em] uppercase opacity-60">Coupon</p>
      <p className="text-lg font-semibold tracking-tight tabular-nums">NT$150 off</p>
      <AnimatePresence>
        {run > 0 && (
          <motion.span
            key={run}
            aria-hidden="true"
            variants={stamp}
            initial={reduce ? false : "lifted"}
            animate="pressed"
            exit="gone"
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium"
          >
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
            Claimed
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function ShakeDemo({ run }: DemoProps) {
  const [ref, shake] = useShake<HTMLDivElement>();
  useEffect(() => {
    if (run > 0) shake();
  }, [run, shake]);
  return (
    <div className="grid gap-1">
      <div ref={ref} className="rounded-md border border-line bg-card px-3 py-1.5 font-mono text-sm tracking-[0.12em] text-fg">
        SAVE20X
      </div>
      <p aria-live="polite" className={cn("min-h-4 text-xs", run > 0 ? "text-destructive" : "invisible")}>
        Code not found
      </p>
    </div>
  );
}

function RollDemo({ run }: DemoProps) {
  const values = [1280, 1340, 1295, 1410];
  const value = values[run % values.length];
  const prev = values[(run + values.length - 1) % values.length];
  const dir = run === 0 ? 1 : Math.sign(value - prev);
  const reduce = useReducedMotion();
  return (
    <span className="relative inline-flex h-9 items-center overflow-hidden text-2xl font-semibold tracking-tight text-fg tabular-nums">
      <AnimatePresence custom={dir} initial={false} mode="popLayout">
        <motion.span
          key={value}
          custom={dir}
          variants={roll}
          initial={reduce ? false : "enter"}
          animate="center"
          exit={reduce ? undefined : "exit"}
        >
          NT${value.toLocaleString("en-US")}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function PanelDemo({ run }: DemoProps) {
  const reduce = useReducedMotion();
  const open = run % 2 === 1;
  return (
    <div className="relative h-20 w-full max-w-60 overflow-hidden rounded-md border border-line bg-card">
      <div className="space-y-1.5 p-2.5">
        <div className="h-2 w-2/3 rounded-sm bg-stage" />
        <div className="h-2 w-1/2 rounded-sm bg-stage" />
      </div>
      <AnimatePresence>
        {open && (
          <>
            <motion.div key="scrim" variants={scrim} initial="closed" animate="open" exit="closed" className="absolute inset-0 bg-black/20" />
            <motion.div
              key="panel"
              variants={panel("right", reduce)}
              initial="closed"
              animate="open"
              exit="closed"
              className={cn("absolute inset-y-0 right-0 w-1/2 border-l p-2.5 text-xs", paper)}
            >
              Cart · 2
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ListDemo({ run }: DemoProps) {
  const reduce = useReducedMotion();
  const [hidden, setHidden] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (run === 0) return;
    setHidden(true);
    timer.current = setTimeout(() => setHidden(false), 1200);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [run]);
  const rows = ["Linen tote", "Ceramic mug", "Notebook"];
  return (
    <ul className="w-full max-w-60 overflow-hidden rounded-md border border-line bg-card text-sm text-fg">
      <AnimatePresence initial={false}>
        {rows.map((row, i) =>
          i === 1 && hidden ? null : (
            <motion.li
              key={row}
              variants={listItem(reduce)}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              transition={springs.gentle}
              className="overflow-hidden"
            >
              <span className="block border-b border-line px-3 py-1.5 last:border-b-0">{row}</span>
            </motion.li>
          ),
        )}
      </AnimatePresence>
    </ul>
  );
}

const demos: Record<DemoKey, (props: DemoProps) => React.ReactNode> = {
  press: PressDemo,
  stamp: StampDemo,
  shake: ShakeDemo,
  roll: RollDemo,
  panel: PanelDemo,
  list: ListDemo,
};
