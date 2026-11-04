"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface ScrollStoryStep {
  id: string;
  title: ReactNode;
  body?: ReactNode;
  /** active 為 true 時播放動畫；false 時應直接畫出最終畫面（伺服器端與 reduced motion 也用這個） */
  visual: (active: boolean) => ReactNode;
}

export interface ScrollStoryProps {
  steps: ScrollStoryStep[];
  /** 舞台長寬比，例如 "4 / 3" */
  stageAspect?: string;
  labels?: { step?: (n: number, total: number) => string };
  className?: string;
}

const defaultLabels = { step: (n: number, total: number) => `Step ${n} of ${total}` };
const ease = [0.23, 1, 0.32, 1] as const;
const pad = (n: number) => String(n).padStart(2, "0");

/** 桌面版判斷；伺服器端與掛載前一律視為行動版，避免 hydration 不一致 */
function useDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return desktop;
}

function useInView<T extends Element>(rootMargin = "0px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin, threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  return [ref, inView] as const;
}

function StepText({ step, n, total, muted, label }: { step: ScrollStoryStep; n: number; total: number; muted: boolean; label: string }) {
  return (
    <div className={cn("transition-opacity duration-300", muted && "opacity-40")}>
      <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase tabular-nums">
        <span aria-hidden="true">
          {pad(n)} / {pad(total)}
        </span>
        <span className="sr-only">{label}</span>
      </p>
      <h3 className="mt-2 text-xl font-semibold tracking-tight">{step.title}</h3>
      {step.body && <div className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">{step.body}</div>}
    </div>
  );
}

function InlineStep({ step, n, total, label, stageAspect, reduce }: { step: ScrollStoryStep; n: number; total: number; label: string; stageAspect: string; reduce: boolean }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  // 每段只播一次，之後停在最終畫面
  const [played, setPlayed] = useState(false);
  useEffect(() => {
    if (!inView || played) return;
    const id = setTimeout(() => setPlayed(true), 1200);
    return () => clearTimeout(id);
  }, [inView, played]);
  return (
    <li className="space-y-4">
      <StepText step={step} n={n} total={total} muted={false} label={label} />
      <div ref={ref} className="overflow-hidden rounded-xl border border-border bg-card" style={{ aspectRatio: stageAspect }}>
        {step.visual(!reduce && inView && !played)}
      </div>
    </li>
  );
}

export function ScrollStory({ steps, stageAspect = "4 / 3", labels, className }: ScrollStoryProps) {
  const t = { ...defaultLabels, ...labels };
  const reduce = useReducedMotion() ?? false;
  const desktop = useDesktop();
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);

  // 以視窗中線決定目前步驟，不監聽 scroll
  useEffect(() => {
    if (!desktop) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = stepRefs.current.indexOf(e.target as HTMLLIElement);
          if (i >= 0) setActive(i);
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    stepRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [desktop, steps.length]);

  if (!desktop) {
    return (
      <ol className={cn("space-y-12", className)}>
        {steps.map((s, i) => (
          <InlineStep key={s.id} step={s} n={i + 1} total={steps.length} label={t.step(i + 1, steps.length)} stageAspect={stageAspect} reduce={reduce} />
        ))}
      </ol>
    );
  }

  const current = steps[active];
  return (
    <div className={cn("grid grid-cols-2 gap-12", className)}>
      <ol>
        {steps.map((s, i) => (
          <li
            key={s.id}
            ref={(el) => {
              stepRefs.current[i] = el;
            }}
            aria-current={i === active ? "step" : undefined}
            className="flex min-h-[70vh] items-center"
          >
            <StepText step={s} n={i + 1} total={steps.length} muted={i !== active} label={t.step(i + 1, steps.length)} />
          </li>
        ))}
      </ol>
      <div className="relative">
        <div className="sticky top-[15vh]">
          <div className="relative overflow-hidden rounded-xl border border-border bg-card" style={{ aspectRatio: stageAspect }} aria-hidden="true">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={current?.id}
                className="absolute inset-0"
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -12 }}
                transition={{ duration: 0.36, ease }}
              >
                {current?.visual(!reduce)}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
