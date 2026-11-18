"use client";

import { animate, AnimatePresence, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from "framer-motion";
import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import type { Messages } from "@/lib/messages";
import { EASE_SITE } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Copy = Messages["home"]["hero"]["specimens"];

/**
 * 首頁開場右邊的「標本桌」：七個專門為首頁做的小元件，同一套黑白灰材質，各自慢慢重複自己最好的那一個動作。
 * 滑鼠移到哪一格，那一格就停止自動播放、交給使用者；移開幾秒後才繼續。
 * 不在畫面上、分頁在背景、reduced motion 時都不自動播放（元件照樣可以操作）。
 * 規範見 SITE-MOTION.md §6。這些是網站自己的元件，不進 registry。
 */

const SPRING = { type: "spring", stiffness: 520, damping: 34, mass: 0.8 } as const;
const RESUME_MS = 2600;

// 整張桌子是否在畫面上
const TableActive = createContext(false);

export function SpecimenTable({ copy, links }: { copy: Copy; links: Partial<Record<SpecimenKey, string>> }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let visible = false;
    const sync = () => setActive(visible && document.visibilityState === "visible");
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <TableActive.Provider value={active}>
      <div ref={ref} role="group" aria-label={copy.label} className="specimens grid grid-cols-6 gap-3">
        <Cell className="col-span-6 h-40 sm:col-span-4" caption={copy.cart.caption} href={links.cart}>
          {(auto) => <CartSpecimen auto={auto} copy={copy} />}
        </Cell>
        <Cell className="col-span-3 h-40 sm:col-span-2" caption={copy.toggle.caption} href={links.toggle}>
          {(auto) => <ToggleSpecimen auto={auto} copy={copy} />}
        </Cell>
        <Cell className="col-span-3 h-40 sm:col-span-2" caption={copy.stepper.caption} href={links.stepper}>
          {(auto) => <StepperSpecimen auto={auto} copy={copy} />}
        </Cell>
        <Cell className="col-span-6 h-40 sm:col-span-4" caption={copy.dimmer.caption} href={links.dimmer}>
          {(auto) => <DimmerSpecimen auto={auto} copy={copy} />}
        </Cell>
        <Cell className="col-span-6 h-36 sm:col-span-3" caption={copy.price.caption} href={links.price}>
          {(auto) => <PriceSpecimen auto={auto} copy={copy} />}
        </Cell>
        <Cell className="col-span-6 h-36 sm:col-span-3" caption={copy.island.caption} href={links.island}>
          {(auto) => <IslandSpecimen auto={auto} copy={copy} />}
        </Cell>
        <Cell className="col-span-6 h-28" caption={copy.steps.caption} href={links.steps}>
          {(auto) => <StepsSpecimen auto={auto} copy={copy} />}
        </Cell>
      </div>
    </TableActive.Provider>
  );
}

export type SpecimenKey = "cart" | "toggle" | "stepper" | "dimmer" | "price" | "island" | "steps";

/** 一格：材質、左上角的名稱、滑鼠接手的邏輯 */
function Cell({
  className,
  caption,
  href,
  children,
}: {
  className: string;
  caption: string;
  href?: string;
  children: (auto: boolean) => ReactNode;
}) {
  const active = useContext(TableActive);
  const reduce = useReducedMotion();
  const [held, setHeld] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const hold = () => {
    window.clearTimeout(timer.current);
    setHeld(true);
  };
  const release = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setHeld(false), RESUME_MS);
  };

  return (
    <div
      onPointerEnter={hold}
      onPointerLeave={release}
      onFocus={hold}
      onBlur={release}
      className={cn("relative flex flex-col overflow-hidden rounded-xl bg-card p-4 shadow-e1 transition-shadow duration-200 hover:shadow-e2", className)}
    >
      <p className="text-[12px] font-medium text-subtle">
        {href ? (
          <Link href={href} className="transition-colors hover:text-fg">
            {caption}
          </Link>
        ) : (
          caption
        )}
      </p>
      <div className="flex min-h-0 flex-1 items-center justify-center">{children(active && !held && !reduce)}</div>
    </div>
  );
}

/** 自動播放的節拍：auto 為真時每 period 毫秒呼叫一次，第一次先等 offset，讓各格錯開 */
function useBeat(auto: boolean, period: number, offset: number, fn: () => void) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!auto) return;
    let interval: number | undefined;
    const first = window.setTimeout(() => {
      ref.current();
      interval = window.setInterval(() => ref.current(), period);
    }, offset);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
    };
  }, [auto, period, offset]);
}

// ---- 1. 加入購物車：按下、變成勾（按鈕從實心落定成描邊）、購物車數字加一 ----
function CartSpecimen({ auto, copy }: { auto: boolean; copy: Copy }) {
  const [added, setAdded] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [count, setCount] = useState(2);
  const reset = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(reset.current), []);

  const add = () => {
    if (added) return;
    setAdded(true);
    setCount((c) => (c >= 9 ? 1 : c + 1));
    window.clearTimeout(reset.current);
    reset.current = window.setTimeout(() => setAdded(false), 1900);
  };
  useBeat(auto, 4400, 900, () => {
    setPressed(true);
    window.setTimeout(() => {
      setPressed(false);
      add();
    }, 150);
  });

  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="truncate text-[15px] font-medium">{copy.cart.product}</p>
        <p className="mt-0.5 text-sm text-subtle tabular-nums">{copy.currency}1,180</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <motion.button
          type="button"
          onClick={add}
          animate={{ scale: pressed ? 0.95 : 1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.12, ease: EASE_SITE }}
          className={cn(
            "relative h-10 min-w-[8.5rem] overflow-hidden rounded-lg px-4 text-sm font-semibold transition-[background-color,color,box-shadow] duration-200",
            added ? "bg-card text-fg shadow-e1" : "bg-fg text-bg shadow-btn",
          )}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={added ? "added" : "add"}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ duration: 0.22, ease: EASE_SITE }}
              className="flex items-center justify-center gap-1.5"
            >
              {added && (
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.08 }} />
                </svg>
              )}
              {added ? copy.cart.added : copy.cart.add}
            </motion.span>
          </AnimatePresence>
        </motion.button>
        <div className="relative grid size-10 place-items-center rounded-lg bg-accent-soft text-subtle">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 4h2.5l2.2 10.5h9.8L20 7H7" />
            <circle cx="9.5" cy="19" r="1.3" />
            <circle cx="16.5" cy="19" r="1.3" />
          </svg>
          <motion.span
            key={count}
            initial={{ scale: 0.4 }}
            animate={{ scale: 1 }}
            transition={SPRING}
            className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-fg text-[11px] font-semibold text-bg tabular-nums"
          >
            {count}
          </motion.span>
        </div>
      </div>
    </div>
  );
}

// ---- 2. 開關：把手有重量，按住會被壓寬 ----
function ToggleSpecimen({ auto, copy }: { auto: boolean; copy: Copy }) {
  const [on, setOn] = useState([true, false]);
  const turn = useRef(0);
  const flip = (i: number) => setOn((s) => s.map((v, j) => (j === i ? !v : v)));
  useBeat(auto, 2300, 300, () => flip(turn.current++ % 2));

  return (
    <div className="flex w-full flex-col gap-3.5">
      {[copy.toggle.a, copy.toggle.b].map((label, i) => (
        <label key={i} className="flex cursor-pointer items-center justify-between gap-2">
          <span className="min-w-0 text-[13px] leading-tight text-pretty">{label}</span>
          <motion.button
            type="button"
            role="switch"
            aria-checked={on[i]}
            aria-label={label}
            onClick={() => flip(i)}
            whileTap="press"
            className={cn(
              "flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200",
              on[i] ? "justify-end bg-fg" : "justify-start bg-line-strong",
            )}
          >
            <motion.span
              layout
              transition={SPRING}
              variants={{ press: { width: 24 } }}
              className={cn("block h-5 w-5 rounded-full shadow-[0_1px_2px_rgb(0_0_0/0.3)]", on[i] ? "bg-bg" : "bg-card")}
            />
          </motion.button>
        </label>
      ))}
    </div>
  );
}

// ---- 3. 數量：數字依方向滑進滑出 ----
function StepperSpecimen({ auto, copy }: { auto: boolean; copy: Copy }) {
  const [qty, setQty] = useState(2);
  const [dir, setDir] = useState(1);
  const beat = useRef(0);
  const change = (d: number) => {
    setDir(d);
    setQty((q) => Math.min(9, Math.max(1, q + d)));
  };
  useBeat(auto, 1500, 600, () => change([1, 1, -1, 1, -1, -1][beat.current++ % 6]));

  const button = "grid size-9 place-items-center rounded-md text-subtle transition-colors hover:bg-surface-hover hover:text-fg active:scale-[0.94]";
  return (
    <div className="flex items-center gap-1 rounded-lg bg-bg p-1 shadow-e1">
      <button type="button" aria-label={copy.stepper.decrease} onClick={() => change(-1)} className={button}>
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 12h12" />
        </svg>
      </button>
      <span aria-live="polite" className="relative grid h-9 w-8 place-items-center overflow-hidden text-lg font-semibold tabular-nums">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.span
            key={qty}
            custom={dir}
            variants={{
              enter: (d: number) => ({ y: d * 18, opacity: 0 }),
              center: { y: 0, opacity: 1 },
              exit: (d: number) => ({ y: d * -18, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: EASE_SITE }}
          >
            {qty}
          </motion.span>
        </AnimatePresence>
      </span>
      <button type="button" aria-label={copy.stepper.increase} onClick={() => change(1)} className={button}>
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M12 6v12M6 12h12" />
        </svg>
      </button>
    </div>
  );
}

// ---- 4. 亮度：把手來回，燈跟著變亮變暗。只用明度，不用顏色 ----
function DimmerSpecimen({ auto, copy }: { auto: boolean; copy: Copy }) {
  const v = useMotionValue(0.3);
  const [percent, setPercent] = useState(30);
  const glow = useTransform(v, [0, 1], [0.12, 1]);
  const left = useTransform(v, (x) => `${x * 100}%`);
  const fill = useTransform(v, (x) => `${x * 100}%`);
  useMotionValueEvent(v, "change", (x) => setPercent(Math.round(x * 100)));

  useEffect(() => {
    if (!auto) return;
    let stopped = false;
    let control: { stop: () => void } | undefined;
    const swing = (to: number) => {
      if (stopped) return;
      control = animate(v, to, { duration: 2.8, ease: [0.45, 0, 0.55, 1], onComplete: () => swing(to > 0.5 ? 0.12 : 0.92) });
    };
    swing(v.get() > 0.5 ? 0.12 : 0.92);
    return () => {
      stopped = true;
      control?.stop();
    };
  }, [auto, v]);

  return (
    <div className="flex w-full items-center gap-5">
      <div className="relative grid size-16 shrink-0 place-items-center rounded-full bg-bg shadow-e1">
        <motion.span style={{ opacity: glow }} className="size-9 rounded-full bg-fg" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-semibold tracking-tight tabular-nums">{percent}%</span>
          <span className="text-[12px] text-subtle">{percent < 50 ? copy.dimmer.low : copy.dimmer.high}</span>
        </div>
        <div className="relative mt-3 h-6">
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-line-strong">
            <motion.div style={{ width: fill }} className="h-full bg-fg" />
          </div>
          <div className="absolute inset-x-2.5 top-0 h-full">
            <motion.span
              style={{ left }}
              className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.12),0_2px_4px_rgb(0_0_0/0.3)]"
            />
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            aria-label={copy.dimmer.caption}
            aria-valuetext={`${percent}%`}
            defaultValue={0.3}
            onChange={(e) => v.set(Number(e.currentTarget.value))}
            className="absolute inset-0 w-full cursor-ew-resize opacity-0"
          />
        </div>
      </div>
    </div>
  );
}

// ---- 5. 價格滾動：每一位數各自滾到新數字，折扣標籤彈出 ----
function PriceSpecimen({ auto, copy }: { auto: boolean; copy: Copy }) {
  const [sale, setSale] = useState(false);
  useBeat(auto, 3000, 1500, () => setSale((s) => !s));
  const digits = String(sale ? 1180 : 1680).split("");

  return (
    <button type="button" onClick={() => setSale((s) => !s)} aria-pressed={sale} className="flex w-full items-center justify-between gap-3 text-left">
      {/* 每一位數是一個 1em 高的窗口，裡面一條 0 到 9 的直排往上移。全部用 em 與 leading-none，
          不靠 baseline 對齊（overflow-hidden 的盒子沒有文字基線，會和逗號、幣別錯開） */}
      <span className="flex items-end text-3xl leading-none font-semibold tracking-tight tabular-nums" aria-label={`${copy.currency}${digits.join("")}`}>
        <span aria-hidden="true" className="mr-1 pb-[0.12em] text-lg leading-none text-subtle">
          {copy.currency}
        </span>
        {digits.map((d, i) => (
          <span key={i} aria-hidden="true" className="flex items-end">
            {i === 1 && <span className="block h-[1em]">,</span>}
            <span className="block h-[1em] w-[0.64em] overflow-hidden">
              <motion.span
                // 第一幀就停在正確的數字上，不要從 0 滾上來
                initial={false}
                animate={{ y: `${-Number(d)}em` }}
                transition={{ duration: 0.7, ease: EASE_SITE, delay: (digits.length - 1 - i) * 0.05 }}
                className="block"
              >
                {Array.from({ length: 10 }, (_, n) => (
                  <span key={n} className="block h-[1em] text-center">
                    {n}
                  </span>
                ))}
              </motion.span>
            </span>
          </span>
        ))}
      </span>
      <AnimatePresence initial={false}>
        {sale && (
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={SPRING}
            className="shrink-0 rounded-md bg-fg px-2 py-1 text-[12px] font-semibold text-bg"
          >
            {copy.price.off}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

// ---- 6. 訂單動態：小膠囊展開成一張卡，再收回 ----
function IslandSpecimen({ auto, copy }: { auto: boolean; copy: Copy }) {
  const [open, setOpen] = useState(false);
  useBeat(auto, 3200, 2100, () => setOpen((o) => !o));

  return (
    <motion.button
      type="button"
      layout
      onClick={() => setOpen((o) => !o)}
      aria-expanded={open}
      transition={SPRING}
      style={{ borderRadius: open ? 14 : 999 }}
      className={cn("overflow-hidden bg-fg text-left text-bg", open ? "w-full px-4 py-3" : "px-3.5 py-2")}
    >
      <motion.span layout="position" className="flex items-center gap-2 text-[13px] font-semibold">
        <span className="size-1.5 rounded-full bg-bg" />
        {open ? copy.island.title : copy.island.pill}
      </motion.span>
      <AnimatePresence initial={false}>
        {open && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.12, duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
            className="mt-1.5 block"
          >
            <span className="block text-[12px] opacity-70">{copy.island.eta}</span>
            <span className="mt-2.5 block h-1 overflow-hidden rounded-full bg-bg/20">
              <motion.span
                initial={{ scaleX: 0.15 }}
                animate={{ scaleX: 0.68 }}
                transition={{ duration: 0.9, ease: EASE_SITE, delay: 0.15 }}
                className="block h-full origin-left rounded-full bg-bg"
              />
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ---- 7. 結帳步驟：依序打勾，線跟著填滿 ----
function StepsSpecimen({ auto, copy }: { auto: boolean; copy: Copy }) {
  const items = copy.steps.items;
  const [done, setDone] = useState(1);
  useBeat(auto, 1400, 1200, () => setDone((d) => (d >= items.length ? 0 : d + 1)));

  return (
    <ol className="flex w-full items-center">
      {items.map((label, i) => {
        const checked = i < done;
        return (
          <li key={i} className={cn("flex items-center", i > 0 && "flex-1")}>
            {i > 0 && (
              <span className="mx-3 h-px flex-1 bg-line-strong">
                <span
                  className={cn("block h-px origin-left transition-transform duration-500 ease-site", "bg-fg", checked ? "scale-x-100" : "scale-x-0")}
                />
              </span>
            )}
            <button type="button" onClick={() => setDone(checked ? i : i + 1)} aria-pressed={checked} className="flex items-center gap-2 text-[13px] font-medium">
              <span
                className={cn(
                  "grid size-6 place-items-center rounded-full transition-[background-color,color,box-shadow] duration-300",
                  checked ? "bg-fg text-bg" : "text-subtle shadow-[inset_0_0_0_1px_var(--line-strong)]",
                )}
              >
                {checked ? (
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.25 }} />
                  </svg>
                ) : (
                  <span className="text-[11px] tabular-nums">{i + 1}</span>
                )}
              </span>
              <span className={cn("hidden transition-colors sm:inline", checked ? "text-fg" : "text-subtle")}>{label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
