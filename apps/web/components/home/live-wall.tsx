"use client";

import { animate, AnimatePresence, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from "framer-motion";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { format } from "@/lib/i18n";
import type { Messages } from "@/lib/messages";
import { EASE_SITE } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Copy = Messages["home"]["hero"]["wall"];

/**
 * 首頁開場的即時元件牆：鋪滿螢幕寬度的一整面小場景，像一家真的店正在運作。
 * 每張卡自己慢慢重複一個動作；滑鼠或焦點進入哪一張，那一張就停下來交給使用者，離開幾秒後才繼續。
 * 牆的下緣被切掉並淡出，表示下面還有。不在畫面上、分頁在背景、reduced motion 時不自動播放。
 * 只用黑白灰。規範見 SITE-MOTION.md §6。這些是網站自己的元件，不進 registry。
 */

const SPRING = { type: "spring", stiffness: 520, damping: 34, mass: 0.8 } as const;
const RESUME_MS = 2600;

const WallActive = createContext(false);

export function LiveWall({ copy, command }: { copy: Copy; command?: ReactNode }) {
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
      { threshold: 0.1 },
    );
    observer.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  const money = (n: number) => `${copy.currency}${n.toLocaleString("en-US")}`;

  return (
    <WallActive.Provider value={active}>
      {/* 滿版：跳出頁面的 max-w 容器，鋪到螢幕兩邊；下緣切掉並淡出 */}
      <div
        ref={ref}
        role="group"
        aria-label={copy.label}
        className="relative mx-[calc(50%-50vw)] max-h-[1280px] overflow-hidden px-4 [mask-image:linear-gradient(to_bottom,#000_72%,transparent)] sm:max-h-[900px] sm:px-5"
      >
        <div className="mx-auto max-w-[2400px] columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 min-[106.25rem]:columns-5">
          <Card>{(auto) => <ProductCard auto={auto} copy={copy} money={money} />}</Card>
          <Card title={copy.steps.join(" · ")} hideTitle>
            {(auto) => <StepsCard auto={auto} items={copy.steps} />}
          </Card>
          <Card title={copy.coupon.label}>{(auto) => <CouponCard auto={auto} copy={copy} money={money} />}</Card>
          <Card title={copy.cart.title}>{(auto) => <CartCard auto={auto} copy={copy} money={money} />}</Card>
          <Card>{(auto) => <ReviewCard auto={auto} copy={copy} />}</Card>
          <Card title={copy.price.caption}>{(auto) => <PriceCard auto={auto} copy={copy} />}</Card>
          <Card title={copy.order.title} note={copy.order.eta}>
            {(auto) => <OrderCard auto={auto} steps={copy.order.steps} />}
          </Card>
          <Card title={copy.size}>{(auto) => <SizeCard auto={auto} />}</Card>
          <Card title={copy.chart.title}>{(auto) => <ChartCard auto={auto} copy={copy} money={money} />}</Card>
          <Card title={copy.notify.title}>{(auto) => <NotifyCard auto={auto} items={copy.notify.items} />}</Card>
          <Card className="grid min-h-28 place-items-center">{(auto) => <IslandCard auto={auto} copy={copy} />}</Card>
          {command && <Card title={copy.install}>{() => command}</Card>}
          <Card title={copy.stock.ends}>{(auto) => <StockCard auto={auto} copy={copy} />}</Card>
          <Card title={copy.dimmer.caption}>{(auto) => <DimmerCard auto={auto} copy={copy} />}</Card>
          <Card title={copy.ship.title}>{(auto) => <ShipCard auto={auto} copy={copy} money={money} />}</Card>
          <Card>{(auto) => <FavCard auto={auto} copy={copy} money={money} />}</Card>
          <Card>{(auto) => <TabsCard auto={auto} copy={copy} />}</Card>
          <Card className="grid min-h-24 place-items-center">{(auto) => <ToastCard auto={auto} copy={copy} />}</Card>
          <Card>{(auto) => <ViewersCard auto={auto} copy={copy} />}</Card>
        </div>
      </div>
    </WallActive.Provider>
  );
}

/** 一張卡：比頁面底色亮一階的表面、可選的小標題、滑鼠接手的邏輯 */
function Card({
  title,
  note,
  hideTitle,
  className,
  children,
}: {
  title?: string;
  note?: string;
  hideTitle?: boolean;
  className?: string;
  children: (auto: boolean) => ReactNode;
}) {
  const active = useContext(WallActive);
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
      className={cn(
        "mb-4 break-inside-avoid rounded-2xl bg-card p-5 shadow-e1 transition-shadow duration-200 hover:shadow-e2 dark:bg-[#151515]",
        className,
      )}
    >
      {title && (
        <div className={cn("mb-4 flex items-baseline justify-between gap-3", hideTitle && "sr-only")}>
          <p className="text-[15px] font-semibold tracking-tight">{title}</p>
          {note && <p className="text-[12px] text-subtle">{note}</p>}
        </div>
      )}
      {children(active && !held && !reduce)}
    </div>
  );
}

/** 自動播放的節拍：auto 為真時每 period 毫秒呼叫一次，第一次先等 offset，讓各張卡錯開 */
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

function Check({ className, draw }: { className?: string; draw?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {draw ? (
        <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.28, delay: 0.06 }} />
      ) : (
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      )}
    </svg>
  );
}

const solidButton = "bg-fg text-bg shadow-btn";

// ---- 商品卡：選顏色、加入購物車 ----
function ProductCard({ auto, copy, money }: { auto: boolean; copy: Copy; money: (n: number) => string }) {
  const [added, setAdded] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [tone, setTone] = useState(0);
  const reset = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(reset.current), []);
  const tones = ["#d9d5cc", "#8c8c8c", "#2b2b2b"];

  const add = () => {
    if (added) return;
    setAdded(true);
    window.clearTimeout(reset.current);
    reset.current = window.setTimeout(() => setAdded(false), 1900);
  };
  useBeat(auto, 4600, 900, () => {
    setTone((t) => (t + 1) % tones.length);
    window.setTimeout(() => setPressed(true), 900);
    window.setTimeout(() => {
      setPressed(false);
      add();
    }, 1050);
  });

  return (
    <div>
      <div className="grid h-44 place-items-center rounded-xl bg-accent-soft">
        <svg viewBox="0 0 64 120" className="h-32" aria-hidden="true">
          <rect x="24" y="4" width="16" height="12" rx="3" fill={tones[tone]} style={{ transition: "fill 300ms" }} opacity="0.75" />
          <path d="M20 22c0-4 4-6 12-6s12 2 12 6v84c0 5-4 8-12 8s-12-3-12-8z" fill={tones[tone]} style={{ transition: "fill 300ms" }} />
          <path d="M24 26v76" stroke="#fff" strokeOpacity="0.25" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold tracking-tight">{copy.product.name}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-subtle">
            <span aria-hidden="true" className="tracking-[0.1em] text-fg">
              ★★★★★
            </span>
            {copy.product.reviews}
          </p>
        </div>
        <p className="text-[15px] font-semibold tabular-nums">{money(1180)}</p>
      </div>
      <div className="mt-4 flex items-center gap-2">
        {tones.map((color, i) => (
          <button
            key={color}
            type="button"
            aria-label={`${i + 1}`}
            aria-pressed={tone === i}
            onClick={() => setTone(i)}
            style={{ backgroundColor: color }}
            className={cn("size-6 rounded-full transition-shadow duration-200", tone === i ? "shadow-[0_0_0_2px_var(--card),0_0_0_3.5px_var(--fg)]" : "shadow-hair")}
          />
        ))}
      </div>
      <motion.button
        type="button"
        onClick={add}
        animate={{ scale: pressed ? 0.97 : 1 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.12, ease: EASE_SITE }}
        className={cn(
          "relative mt-4 h-11 w-full overflow-hidden rounded-lg text-sm font-semibold transition-[background-color,color,box-shadow] duration-200",
          added ? "bg-transparent text-fg shadow-[inset_0_0_0_1px_var(--line-strong)]" : solidButton,
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
            {added && <Check className="size-4" draw />}
            {added ? copy.product.added : copy.product.add}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

// ---- 購物車：數量加減、小計、免運進度 ----
function CartCard({ auto, copy, money }: { auto: boolean; copy: Copy; money: (n: number) => string }) {
  const [qty, setQty] = useState([1, 1]);
  const [dir, setDir] = useState(1);
  const beat = useRef(0);
  const prices = [1180, 590];
  const names = [copy.product.name, copy.cart.second];
  const change = (i: number, d: number) => {
    setDir(d);
    setQty((q) => q.map((v, j) => (j === i ? Math.min(9, Math.max(1, v + d)) : v)));
  };
  // 自動：把小計推過免運門檻，再退回來
  useBeat(auto, 1500, 500, () => {
    const [i, d] = ([[1, 1], [1, 1], [0, 1], [0, -1], [1, -1], [1, -1]] as const)[beat.current++ % 6];
    change(i, d);
  });

  const subtotal = qty[0] * prices[0] + qty[1] * prices[1];
  const threshold = 3000;
  const button = "grid size-7 place-items-center rounded-md text-subtle transition-colors hover:bg-surface-hover hover:text-fg active:scale-[0.94]";

  return (
    <div>
      <ul className="space-y-3">
        {names.map((name, i) => (
          <li key={i} className="flex items-center gap-3">
            <span aria-hidden="true" className="size-10 shrink-0 rounded-lg bg-accent-soft" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{name}</span>
              <span className="block text-[12px] text-subtle tabular-nums">{money(prices[i])}</span>
            </span>
            <span className="flex shrink-0 items-center rounded-lg bg-bg p-0.5 shadow-e1">
              <button type="button" aria-label="−" onClick={() => change(i, -1)} className={button}>
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 12h12" />
                </svg>
              </button>
              <span className="relative grid h-7 w-6 place-items-center overflow-hidden text-sm font-semibold tabular-nums">
                <AnimatePresence mode="popLayout" initial={false} custom={dir}>
                  <motion.span
                    key={qty[i]}
                    custom={dir}
                    variants={{
                      enter: (d: number) => ({ y: d * 14, opacity: 0 }),
                      center: { y: 0, opacity: 1 },
                      exit: (d: number) => ({ y: d * -14, opacity: 0 }),
                    }}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.2, ease: EASE_SITE }}
                  >
                    {qty[i]}
                  </motion.span>
                </AnimatePresence>
              </span>
              <button type="button" aria-label="+" onClick={() => change(i, 1)} className={button}>
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 6v12M6 12h12" />
                </svg>
              </button>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 border-t border-line pt-4">
        <p className="flex items-baseline justify-between">
          <span className="text-sm text-subtle">{copy.cart.subtotal}</span>
          <span aria-live="polite" className="text-xl font-semibold tracking-tight tabular-nums">
            {money(subtotal)}
          </span>
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line-strong">
          <div
            className="h-full origin-left rounded-full bg-fg transition-transform duration-500 ease-site"
            style={{ transform: `scaleX(${Math.min(1, subtotal / threshold)})` }}
          />
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[12px] text-subtle">
          {subtotal >= threshold ? (
            <>
              <Check className="size-3.5 text-fg" />
              <span className="text-fg">{copy.cart.free}</span>
            </>
          ) : (
            format(copy.cart.toFree, { amount: money(threshold - subtotal) })
          )}
        </p>
        <button type="button" className={cn("mt-4 h-10 w-full rounded-lg text-sm font-semibold transition-transform active:scale-[0.97]", solidButton)}>
          {copy.cart.checkout}
        </button>
      </div>
    </div>
  );
}

// ---- 限時價：每一位數各自滾到新數字 ----
function PriceCard({ auto, copy }: { auto: boolean; copy: Copy }) {
  const [sale, setSale] = useState(true);
  useBeat(auto, 3000, 1500, () => setSale((s) => !s));
  const digits = String(sale ? 1180 : 1680).split("");

  return (
    <button type="button" onClick={() => setSale((s) => !s)} aria-pressed={sale} className="flex w-full items-end justify-between gap-3 text-left">
      {/* 每一位數是一個 1em 高的窗口，裡面一條 0 到 9 的直排往上移。全部用 em 與 leading-none，不靠 baseline 對齊 */}
      <span className="flex items-end text-[44px] leading-none font-semibold tracking-tight tabular-nums" aria-label={`${copy.currency}${digits.join("")}`}>
        <span aria-hidden="true" className="mr-1 pb-[0.14em] text-xl leading-none text-subtle">
          {copy.currency}
        </span>
        {digits.map((d, i) => (
          <span key={i} aria-hidden="true" className="flex items-end">
            {i === 1 && <span className="block h-[1em]">,</span>}
            <span className="block h-[1em] w-[0.64em] overflow-hidden">
              <motion.span
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
            className="mb-1 shrink-0 rounded-md bg-fg px-2 py-1 text-[12px] font-semibold text-bg"
          >
            {copy.price.off}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

// ---- 訂單追蹤：直式時間軸，依序點亮 ----
function OrderCard({ auto, steps }: { auto: boolean; steps: string[] }) {
  const [done, setDone] = useState(2);
  useBeat(auto, 1700, 1000, () => setDone((d) => (d >= steps.length ? 1 : d + 1)));

  return (
    <ol>
      {steps.map((label, i) => {
        const reached = i < done;
        const current = i === done - 1;
        return (
          <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
            {i < steps.length - 1 && (
              <span className="absolute top-5 bottom-0 left-[9px] w-px bg-line-strong">
                <span className={cn("block h-full origin-top bg-fg transition-transform duration-500 ease-site", i < done - 1 ? "scale-y-100" : "scale-y-0")} />
              </span>
            )}
            <button
              type="button"
              onClick={() => setDone(i + 1)}
              aria-pressed={reached}
              className={cn(
                "relative grid size-5 shrink-0 place-items-center rounded-full transition-[background-color,box-shadow] duration-300",
                reached ? "bg-fg text-bg" : "bg-card shadow-[inset_0_0_0_1px_var(--line-strong)] dark:bg-[#151515]",
              )}
            >
              {reached && <Check className="size-3" draw={current} />}
            </button>
            <span className={cn("text-sm transition-colors", current ? "font-semibold text-fg" : reached ? "text-fg" : "text-subtle")}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

// ---- 結帳步驟：依序打勾，線跟著填滿 ----
function StepsCard({ auto, items }: { auto: boolean; items: string[] }) {
  const [done, setDone] = useState(1);
  useBeat(auto, 1400, 1200, () => setDone((d) => (d >= items.length ? 0 : d + 1)));

  return (
    <ol className="flex w-full items-center">
      {items.map((label, i) => {
        const checked = i < done;
        return (
          <li key={i} className={cn("flex items-center", i > 0 && "flex-1")}>
            {i > 0 && (
              <span className="mx-2 h-px flex-1 bg-line-strong">
                <span className={cn("block h-px origin-left bg-fg transition-transform duration-500 ease-site", checked ? "scale-x-100" : "scale-x-0")} />
              </span>
            )}
            <button type="button" onClick={() => setDone(checked ? i : i + 1)} aria-pressed={checked} className="flex items-center gap-1.5 text-[13px] font-medium">
              <span
                className={cn(
                  "grid size-6 place-items-center rounded-full transition-[background-color,color,box-shadow] duration-300",
                  checked ? "bg-fg text-bg" : "text-subtle shadow-[inset_0_0_0_1px_var(--line-strong)]",
                )}
              >
                {checked ? <Check className="size-3.5" draw /> : <span className="text-[11px] tabular-nums">{i + 1}</span>}
              </span>
              <span className={cn("transition-colors", checked ? "text-fg" : "text-subtle")}>{label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

// ---- 優惠碼：自己打字、套用、顯示折抵 ----
function CouponCard({ auto, copy, money }: { auto: boolean; copy: Copy; money: (n: number) => string }) {
  const CODE = "DOUBLE11";
  const [typed, setTyped] = useState(CODE.length);
  const [applied, setApplied] = useState(false);
  const timers = useRef<number[]>([]);
  const clear = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);

  useBeat(auto, 5200, 1800, () => {
    clear();
    setApplied(false);
    setTyped(0);
    for (let i = 1; i <= CODE.length; i++) timers.current.push(window.setTimeout(() => setTyped(i), 250 + i * 110));
    timers.current.push(window.setTimeout(() => setApplied(true), 250 + CODE.length * 110 + 500));
  });

  return (
    <div>
      <div className="flex gap-2">
        <div className="flex h-10 min-w-0 flex-1 items-center rounded-lg bg-bg px-3 font-mono text-sm tracking-wider shadow-e1">
          {CODE.slice(0, typed)}
          {!applied && <span aria-hidden="true" className="ml-px h-4 w-px bg-fg motion-safe:animate-[sunui-caret_1s_steps(1)_infinite]" />}
        </div>
        <button
          type="button"
          onClick={() => {
            clear();
            setTyped(CODE.length);
            setApplied((a) => !a);
          }}
          className={cn("h-10 shrink-0 rounded-lg px-4 text-sm font-semibold transition-transform active:scale-[0.97]", solidButton)}
        >
          {copy.coupon.apply}
        </button>
      </div>
      <div className="mt-3 h-5">
        <AnimatePresence initial={false}>
          {applied && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: EASE_SITE }}
              className="flex items-center gap-1.5 text-[13px] font-medium"
            >
              <Check className="size-4" draw />
              {format(copy.coupon.applied, { amount: money(200) })}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      <style>{`@keyframes sunui-caret { 50% { opacity: 0 } }`}</style>
    </div>
  );
}

// ---- 通知開關：把手有重量，按住會被壓寬 ----
function NotifyCard({ auto, items }: { auto: boolean; items: string[] }) {
  const [on, setOn] = useState(items.map((_, i) => i !== 2));
  const turn = useRef(0);
  const flip = (i: number) => setOn((s) => s.map((v, j) => (j === i ? !v : v)));
  useBeat(auto, 2100, 300, () => flip(turn.current++ % items.length));

  return (
    <ul className="space-y-3.5">
      {items.map((label, i) => (
        <li key={i} className="flex items-center justify-between gap-3">
          <span className="min-w-0 text-sm leading-tight">{label}</span>
          <motion.button
            type="button"
            role="switch"
            aria-checked={on[i]}
            aria-label={label}
            onClick={() => flip(i)}
            whileTap="press"
            className={cn("flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200", on[i] ? "justify-end bg-fg" : "justify-start bg-line-strong")}
          >
            <motion.span
              layout
              transition={SPRING}
              variants={{ press: { width: 24 } }}
              className={cn("block h-5 w-5 rounded-full shadow-[0_1px_2px_rgb(0_0_0/0.3)]", on[i] ? "bg-bg" : "bg-card")}
            />
          </motion.button>
        </li>
      ))}
    </ul>
  );
}

// ---- 評價：星星依序點亮 ----
function ReviewCard({ auto, copy }: { auto: boolean; copy: Copy }) {
  const [stars, setStars] = useState(5);
  useBeat(auto, 700, 2400, () => setStars((s) => (s >= 5 ? 1 : s + 1)));

  return (
    <figure>
      <div className="flex gap-1" role="radiogroup" aria-label="★">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n}`} onClick={() => setStars(n)}>
            <motion.svg
              viewBox="0 0 24 24"
              className="size-5"
              animate={{ scale: n === stars ? [1, 1.25, 1] : 1 }}
              transition={{ duration: 0.3 }}
              fill={n <= stars ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.8z" opacity={n <= stars ? 1 : 0.35} />
            </motion.svg>
          </button>
        ))}
      </div>
      <blockquote className="mt-3 text-[17px] leading-snug font-medium tracking-tight text-pretty">{copy.review.text}</blockquote>
      <figcaption className="mt-3 text-[12px] text-subtle">{copy.review.name}</figcaption>
    </figure>
  );
}

// ---- 尺寸：選中的底塊滑過去 ----
function SizeCard({ auto }: { auto: boolean }) {
  const sizes = ["S", "M", "L", "XL"];
  const [picked, setPicked] = useState(1);
  useBeat(auto, 1600, 700, () => setPicked((p) => (p + 1) % sizes.length));

  return (
    <div role="radiogroup" className="grid grid-cols-4 gap-1 rounded-lg bg-accent-soft p-1">
      {sizes.map((size, i) => (
        <button
          key={size}
          type="button"
          role="radio"
          aria-checked={picked === i}
          onClick={() => setPicked(i)}
          className={cn("relative h-9 rounded-md text-sm font-semibold transition-colors", picked === i ? "text-bg" : "text-subtle hover:text-fg")}
        >
          {picked === i && <motion.span layoutId="wall-size" transition={SPRING} className="absolute inset-0 rounded-md bg-fg shadow-btn" />}
          <span className="relative">{size}</span>
        </button>
      ))}
    </div>
  );
}

// ---- 本週銷售：長條換一組數字時各自長高變矮 ----
function ChartCard({ auto, copy, money }: { auto: boolean; copy: Copy; money: (n: number) => string }) {
  const weeks = [
    [42, 58, 49, 71, 64, 92, 80],
    [55, 44, 68, 60, 88, 73, 96],
    [38, 62, 80, 54, 70, 97, 66],
  ];
  const [week, setWeek] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  useBeat(auto, 2600, 1300, () => setWeek((w) => (w + 1) % weeks.length));
  const values = weeks[week];
  const peak = values.indexOf(Math.max(...values));
  const focus = hover ?? peak;

  return (
    <div>
      <p className="text-3xl font-semibold tracking-tight tabular-nums">{money(values[focus] * 420)}</p>
      <div className="mt-4 flex h-28 items-end gap-2" onPointerLeave={() => setHover(null)}>
        {values.map((v, i) => (
          <button
            key={i}
            type="button"
            aria-label={`${copy.chart.days[i]} ${money(v * 420)}`}
            onPointerEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            className="flex h-full flex-1 flex-col justify-end"
          >
            <span
              className={cn("block w-full origin-bottom rounded-md transition-[transform,background-color] duration-700 ease-site", i === focus ? "bg-fg" : "bg-line-strong")}
              style={{ height: "100%", transform: `scaleY(${v / 100})` }}
            />
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-2 text-center text-[11px] text-subtle">
        {copy.chart.days.map((day, i) => (
          <span key={i} className={cn("flex-1", i === focus && "font-semibold text-fg")}>
            {day}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---- 訂單動態：小膠囊展開成一張卡，再收回 ----
function IslandCard({ auto, copy }: { auto: boolean; copy: Copy }) {
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

// ---- 限時庫存：倒數每秒跳一次，剩餘數量慢慢減少 ----
function StockCard({ auto, copy }: { auto: boolean; copy: Copy }) {
  const [seconds, setSeconds] = useState(2 * 3600 + 14 * 60 + 36);
  const [left, setLeft] = useState(7);
  useBeat(auto, 1000, 0, () => setSeconds((s) => (s <= 1 ? 2 * 3600 + 14 * 60 + 36 : s - 1)));
  useBeat(auto, 3800, 2600, () => setLeft((n) => (n <= 2 ? 7 : n - 1)));
  const parts = [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60].map((n) => String(n).padStart(2, "0"));

  return (
    <div>
      <p className="flex items-center gap-1.5 text-[34px] leading-none font-semibold tracking-tight tabular-nums" aria-label={parts.join(":")}>
        {parts.map((part, i) => (
          <span key={i} aria-hidden="true" className="flex items-center gap-1.5">
            {i > 0 && <span className="text-subtle">:</span>}
            <span className="rounded-lg bg-accent-soft px-2 py-1.5">{part}</span>
          </span>
        ))}
      </p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-line-strong">
        <div className="h-full origin-left rounded-full bg-fg transition-transform duration-500 ease-site" style={{ transform: `scaleX(${left / 20})` }} />
      </div>
      <button type="button" onClick={() => setLeft((n) => (n <= 2 ? 7 : n - 1))} className="mt-2 text-[12px] font-medium">
        {format(copy.stock.left, { n: left })}
      </button>
    </div>
  );
}

// ---- 亮度：把手來回，燈跟著變亮變暗。只用明度 ----
function DimmerCard({ auto, copy }: { auto: boolean; copy: Copy }) {
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
    <div className="flex items-center gap-4">
      <div className="grid size-14 shrink-0 place-items-center rounded-full bg-bg shadow-e1">
        <motion.span style={{ opacity: glow }} className="size-8 rounded-full bg-fg" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-semibold tracking-tight tabular-nums">{percent}%</span>
          <span className="text-[12px] text-subtle">{percent < 50 ? copy.dimmer.low : copy.dimmer.high}</span>
        </div>
        <div className="relative mt-2 h-6">
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

// ---- 配送方式：選中的外框跟著移動 ----
function ShipCard({ auto, copy, money }: { auto: boolean; copy: Copy; money: (n: number) => string }) {
  const prices = [0, 120, 0];
  const [picked, setPicked] = useState(0);
  useBeat(auto, 1900, 1100, () => setPicked((p) => (p + 1) % copy.ship.items.length));

  return (
    <div role="radiogroup" className="space-y-2">
      {copy.ship.items.map((item, i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={picked === i}
          onClick={() => setPicked(i)}
          className="relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left shadow-hair"
        >
          {picked === i && <motion.span layoutId="wall-ship" transition={SPRING} className="absolute inset-0 rounded-xl shadow-[inset_0_0_0_1.5px_var(--fg)]" />}
          <span className={cn("grid size-4 shrink-0 place-items-center rounded-full transition-shadow", picked === i ? "shadow-[inset_0_0_0_5px_var(--fg)]" : "shadow-[inset_0_0_0_1px_var(--line-strong)]")} />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">{item.name}</span>
            <span className="block text-[12px] text-subtle">{item.note}</span>
          </span>
          <span className="text-sm font-medium tabular-nums">{prices[i] ? money(prices[i]) : copy.ship.free}</span>
        </button>
      ))}
    </div>
  );
}

// ---- 收藏：愛心彈一下，數字跟著跳 ----
function FavCard({ auto, copy, money }: { auto: boolean; copy: Copy; money: (n: number) => string }) {
  const [on, setOn] = useState(false);
  useBeat(auto, 2400, 1700, () => setOn((v) => !v));
  const count = 127 + (on ? 1 : 0);

  return (
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className="size-12 shrink-0 rounded-xl bg-accent-soft" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{copy.fav.name}</p>
        <p className="text-[12px] text-subtle tabular-nums">
          {money(590)} · {format(copy.fav.saved, { n: count })}
        </p>
      </div>
      <motion.button
        type="button"
        aria-pressed={on}
        aria-label={format(copy.fav.saved, { n: count })}
        onClick={() => setOn((v) => !v)}
        whileTap={{ scale: 0.88 }}
        className="grid size-10 shrink-0 place-items-center rounded-full bg-bg shadow-e1"
      >
        <motion.svg
          key={String(on)}
          viewBox="0 0 24 24"
          className="size-5"
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={SPRING}
          fill={on ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" />
        </motion.svg>
      </motion.button>
    </div>
  );
}

// ---- 分頁：底線滑到選中的那一頁，內容換一行 ----
function TabsCard({ auto, copy }: { auto: boolean; copy: Copy }) {
  const [tab, setTab] = useState(0);
  useBeat(auto, 2300, 1400, () => setTab((t) => (t + 1) % copy.tabs.items.length));

  return (
    <div>
      <div role="tablist" className="flex gap-5 border-b border-line">
        {copy.tabs.items.map((label, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={tab === i}
            onClick={() => setTab(i)}
            className={cn("relative pb-2.5 text-sm font-medium transition-colors", tab === i ? "text-fg" : "text-subtle hover:text-fg")}
          >
            {label}
            {tab === i && <motion.span layoutId="wall-tab" transition={SPRING} className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-fg" />}
          </button>
        ))}
      </div>
      <div className="relative mt-3 h-10 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: EASE_SITE }}
            className="text-[13px] leading-snug text-pretty text-subtle"
          >
            {copy.tabs.body[tab]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---- 通知條：滑進來，按復原後換成確認 ----
function ToastCard({ auto, copy }: { auto: boolean; copy: Copy }) {
  const [state, setState] = useState<"hidden" | "shown" | "restored">("shown");
  const beat = useRef(0);
  useBeat(auto, 1800, 600, () => setState((["restored", "hidden", "shown"] as const)[beat.current++ % 3]));

  return (
    <div className="flex h-11 w-full items-center justify-center">
      <AnimatePresence mode="popLayout" initial={false}>
        {state !== "hidden" && (
          <motion.div
            key={state}
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={SPRING}
            className="flex items-center gap-3 rounded-full bg-fg py-2 pr-2 pl-4 text-[13px] font-medium text-bg shadow-btn"
          >
            {state === "restored" ? (
              <span className="flex items-center gap-1.5 pr-2">
                <Check className="size-4" draw />
                {copy.toast.restored}
              </span>
            ) : (
              <>
                {copy.toast.text}
                <button type="button" onClick={() => setState("restored")} className="rounded-full bg-bg/15 px-2.5 py-1 font-semibold transition-colors hover:bg-bg/25">
                  {copy.toast.undo}
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- 正在看的人：頭像疊在一起，人數慢慢變動 ----
function ViewersCard({ auto, copy }: { auto: boolean; copy: Copy }) {
  const [n, setN] = useState(12);
  const beat = useRef(0);
  useBeat(auto, 2000, 900, () => setN((v) => v + [1, 2, -1, 1, -2, -1][beat.current++ % 6]));
  const shades = ["bg-fg", "bg-subtle", "bg-line-strong", "bg-accent-soft"];

  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        {shades.map((shade, i) => (
          <span key={i} className={cn("size-8 rounded-full shadow-[0_0_0_2px_var(--card)] dark:shadow-[0_0_0_2px_#151515]", shade)} />
        ))}
      </div>
      <p aria-live="off" className="min-w-0 text-[13px] leading-tight font-medium">
        {format(copy.viewers, { n })}
      </p>
    </div>
  );
}
