"use client";

import { useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

import { useOnScreen } from "@/components/home/live-wall";
import { format } from "@/lib/i18n";
import type { Messages } from "@/lib/messages";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/registry/free/animated-number/animated-number";
import { AvatarStack } from "@/registry/free/avatar-stack/avatar-stack";
import { EffectButton } from "@/registry/free/button-effects/button-effects";
import { CommandPalette } from "@/registry/free/command-palette/command-palette";
import { FavoriteButton } from "@/registry/free/favorite-button/favorite-button";
import { FloatingField } from "@/registry/free/floating-field/floating-field";
import { LoadingButton, type LoadingButtonState } from "@/registry/free/loading-button/loading-button";
import { AnimatedCheckbox, HoldToConfirm, SendPlaneButton, SuccessCheck, ToggleSwitch } from "@/registry/free/micro-interactions/micro-interactions";
import { NotifyBadge } from "@/registry/free/notify-badge/notify-badge";
import { OtpInput, type OtpStatus } from "@/registry/free/otp-input/otp-input";
import { QuantityStepper } from "@/registry/free/quantity-stepper/quantity-stepper";
import { RangeSlider } from "@/registry/free/range-slider/range-slider";
import { SlidingTabs } from "@/registry/free/sliding-tabs/sliding-tabs";
import { StarRating } from "@/registry/free/star-rating/star-rating";
import { ToastStack, useToasts } from "@/registry/free/toast-stack/toast-stack";

/**
 * 同屏微互動牆（/interactions）：二十格，每一格直接引入一個真的免費區塊，各自重複一小段「人會做的事」。
 * 由來與規劃：reports/微互動同屏牆深度分析-2026-11-22.md。這是網站頁面，不進 registry，不算新的免費項目。
 * 自動播放只在牆看得到、分頁在前景、沒有被暫停、沒有 reduced motion 時跑；滑鼠或焦點進入哪一格，那一格停下來交給使用者，離開 2.6 秒後繼續。
 * 外殼只用黑白灰，顏色只出現在區塊自己身上。
 */

export type WallCopy = Messages["wall"];

const RESUME_MS = 2600;

/** 可取消的等待：腳本停下時（滑鼠接手、離開畫面）丟出例外，整段腳本就此結束 */
type Wait = (ms: number) => Promise<void>;

/**
 * 自動播放腳本：auto 為真時從頭重複執行 script，第一次先等 offset 讓各格錯開。
 * auto 變成假時立刻中止，元件停在當下的狀態交給使用者。
 */
function useScript(auto: boolean, offset: number, script: (wait: Wait) => Promise<void>) {
  const ref = useRef(script);
  ref.current = script;
  useEffect(() => {
    if (!auto) return;
    const ctrl = new AbortController();
    const wait: Wait = (ms) =>
      new Promise((resolve, reject) => {
        if (ctrl.signal.aborted) return reject(new Error("stop"));
        const t = window.setTimeout(resolve, ms);
        ctrl.signal.addEventListener("abort", () => {
          window.clearTimeout(t);
          reject(new Error("stop"));
        });
      });
    void (async () => {
      try {
        await wait(offset);
        for (;;) await ref.current(wait);
      } catch {
        // 中止
      }
    })();
    return () => ctrl.abort();
  }, [auto, offset]);
}

/** 逐字打字：每一個字呼叫一次 set */
async function typeOut(text: string, set: (v: string) => void, wait: Wait, ms = 70) {
  const chars = Array.from(text);
  for (let i = 1; i <= chars.length; i++) {
    set(chars.slice(0, i).join(""));
    await wait(ms);
  }
}

/** 對一個只接受真實操作的輸入框寫值（React 的受控輸入要走原生 setter 再送 input 事件） */
function setNativeValue(el: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

type TileProps = { auto: boolean; offset: number; t: WallCopy; locale: string };

/* ------------------------------------------------------------------ */
/* 二十格 */

function PricingTile({ auto, offset, t }: TileProps) {
  const [period, setPeriod] = useState("m");
  useScript(auto, offset, async (wait) => {
    await wait(2200);
    setPeriod((p) => (p === "m" ? "y" : "m"));
  });
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <SlidingTabs
        variant="segment"
        size="sm"
        aria-label={t.monthly}
        items={[
          { value: "m", label: t.monthly },
          { value: "y", label: t.yearly },
        ]}
        value={period}
        onValueChange={setPeriod}
      />
      <p className="flex items-baseline gap-1 text-3xl font-semibold tracking-tight">
        <AnimatedNumber value={period === "m" ? 20 : 16} currency="USD" formatOptions={{ maximumFractionDigits: 0 }} />
        <span className="text-sm font-normal text-muted-foreground">{t.perMonth}</span>
      </p>
    </div>
  );
}

function ToggleTile({ auto, offset, t }: TileProps) {
  const [on, setOn] = useState(false);
  useScript(auto, offset, async (wait) => {
    await wait(1800);
    setOn((v) => !v);
  });
  return <ToggleSwitch label={t.focus} checked={on} onChange={setOn} />;
}

const PEOPLE = [
  { id: "a", name: "Mina P." },
  { id: "b", name: "Leo K." },
  { id: "c", name: "Ava S." },
  { id: "d", name: "Noah T." },
  { id: "e", name: "Iris W." },
];

function AvatarTile({ auto, offset, locale }: TileProps) {
  const [n, setN] = useState(3);
  useScript(auto, offset, async (wait) => {
    await wait(1600);
    setN((v) => (v >= 5 ? 3 : v + 1));
  });
  return <AvatarStack people={PEOPLE.slice(0, n)} max={5} locale={locale} />;
}

function RatingTile({ auto, offset, t, locale }: TileProps) {
  const [v, setV] = useState(0);
  useScript(auto, offset, async (wait) => {
    for (let i = 1; i <= 5; i++) {
      setV(i);
      await wait(260);
    }
    await wait(1800);
    setV(0);
    await wait(700);
  });
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs text-muted-foreground">{t.rating}</p>
      <StarRating value={v} onValueChange={setV} locale={locale} />
    </div>
  );
}

function LoadingTile({ auto, offset, t }: TileProps) {
  const [state, setState] = useState<LoadingButtonState>("idle");
  useScript(auto, offset, async (wait) => {
    await wait(1400);
    setState("loading");
    await wait(1300);
    setState("success");
    await wait(1600);
    setState("idle");
  });
  return (
    <LoadingButton state={state} successLabel={t.saved} loadingStyle="shrink">
      {t.submit}
    </LoadingButton>
  );
}

function FavoriteTile({ auto, offset, locale }: TileProps) {
  const [on, setOn] = useState(false);
  useScript(auto, offset, async (wait) => {
    await wait(1900);
    setOn((v) => !v);
  });
  return <FavoriteButton pressed={on} onPressedChange={setOn} count={on ? 1285 : 1284} locale={locale} />;
}

function StepperTile({ auto, offset, t, locale }: TileProps) {
  const [v, setV] = useState(2);
  const dir = useRef(1);
  useScript(auto, offset, async (wait) => {
    await wait(700);
    setV((x) => {
      if (x >= 6) dir.current = -1;
      if (x <= 1) dir.current = 1;
      return x + dir.current;
    });
  });
  return (
    <div className="flex w-full max-w-56 items-center justify-between gap-3">
      <span className="text-sm font-medium">{t.guests}</span>
      <QuantityStepper value={v} onValueChange={setV} min={1} max={8} size="sm" locale={locale} />
    </div>
  );
}

function OtpTile({ auto, offset, locale }: TileProps) {
  const [v, setV] = useState("");
  const [status, setStatus] = useState<OtpStatus>("idle");
  useScript(auto, offset, async (wait) => {
    await wait(900);
    await typeOut("482916", setV, wait, 180);
    setStatus("success");
    await wait(2200);
    setStatus("idle");
    setV("");
  });
  return (
    <OtpInput
      value={v}
      onChange={(x) => {
        setV(x);
        setStatus("idle");
      }}
      status={status}
      locale={locale}
      className="shrink-0 origin-center scale-[0.6]"
    />
  );
}

function PostTile({ auto, offset, t, locale }: TileProps) {
  const [v, setV] = useState("");
  useScript(auto, offset, async (wait) => {
    await wait(600);
    await typeOut(t.post, setV, wait, locale === "en" ? 55 : 120);
    await wait(2000);
    setV("");
    await wait(500);
  });
  const max = Array.from(t.post).length + 2;
  return <FloatingField label={t.postLabel} multiline rows={2} maxLength={max} counter="ring" value={v} onValueChange={setV} locale={locale} className="w-full" />;
}

function TodoTile({ auto, offset, t }: TileProps) {
  const [done, setDone] = useState<boolean[]>([false, false, false, false]);
  useScript(auto, offset, async (wait) => {
    for (let i = 0; i < 4; i++) {
      await wait(750);
      setDone((d) => d.map((x, j) => (j === i ? true : x)));
    }
    await wait(1600);
    setDone([false, false, false, false]);
    await wait(500);
  });
  const n = done.filter(Boolean).length;
  return (
    <div className="w-full max-w-60">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-semibold">{t.today}</span>
        <span className="text-xs tabular-nums text-muted-foreground">{format(t.done, { n })}</span>
      </div>
      <div className="flex flex-col gap-1">
        {t.todos.map((label, i) => (
          <AnimatedCheckbox key={label} label={<span className="text-[13px]">{label}</span>} checked={done[i]} onChange={(c) => setDone((d) => d.map((x, j) => (j === i ? c : x)))} />
        ))}
      </div>
    </div>
  );
}

function CommandTile({ auto, offset, t }: TileProps) {
  const ref = useRef<HTMLDivElement>(null);
  useScript(auto, offset, async (wait) => {
    const input = ref.current?.querySelector("input");
    if (!input) return wait(1000);
    await wait(900);
    await typeOut(t.query, (v) => setNativeValue(input, v), wait, 220);
    await wait(2200);
    setNativeValue(input, "");
    await wait(900);
  });
  const icon = (d: string) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-4">
      <path d={d} />
    </svg>
  );
  return (
    <div ref={ref} className="w-full max-w-64 [&_[role=search]]:shadow-none [&_[role=search]>div:nth-child(3)]:hidden [&_[role=search]>div:nth-child(2)]:max-h-[118px]">
      <CommandPalette
        inline
        placeholder={t.search}
        groups={[
          {
            id: "go",
            heading: t.search,
            items: [
              { id: "new", label: t.commands[0], icon: icon("M12 5v14M5 12h14"), shortcut: ["N"] },
              { id: "profile", label: t.commands[1], icon: icon("M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20c1.2-3.2 3.8-5 7-5s5.8 1.8 7 5"), shortcut: ["P"] },
              { id: "projects", label: t.commands[2], icon: icon("M4 6.5h6l2 2h8V18H4z"), shortcut: ["O"] },
              { id: "pricing", label: t.commands[3], icon: icon("M4 12l8-8h8v8l-8 8z"), shortcut: ["$"] },
            ],
          },
        ]}
      />
    </div>
  );
}

function PasswordTile({ auto, offset, t, locale }: TileProps) {
  const [v, setV] = useState("");
  useScript(auto, offset, async (wait) => {
    await wait(800);
    await typeOut(t.passwordTyped, setV, wait, 150);
    await wait(2200);
    setV("");
    await wait(500);
  });
  return <FloatingField label={t.password} strength value={v} onValueChange={setV} locale={locale} autoComplete="off" className="w-full" />;
}

const DOCK_ICONS = [
  "M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z",
  "M11 17a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM20 20l-4.2-4.2",
  "M7 4.5h10a1 1 0 0 1 1 1V20l-6-3.8L6 20V5.5a1 1 0 0 1 1-1z",
  "M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 19.5c1.2-3.2 3.8-5 7-5s5.8 1.8 7 5",
];

function DockTile({ auto, offset, t }: TileProps) {
  const [v, setV] = useState("0");
  useScript(auto, offset, async (wait) => {
    await wait(1500);
    setV((x) => String((Number(x) + 1) % 4));
  });
  return (
    <SlidingTabs
      variant="dock"
      size="sm"
      aria-label={t.dock.join(", ")}
      value={v}
      onValueChange={setV}
      items={t.dock.map((label, i) => ({
        value: String(i),
        label,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d={DOCK_ICONS[i]} />
          </svg>
        ),
      }))}
    />
  );
}

/** 只有滑過才會動的按鈕：送 pointerenter / pointerleave 給 framer-motion 的 whileHover */
function ArrowTile({ auto, offset, t }: TileProps) {
  const ref = useRef<HTMLButtonElement>(null);
  useScript(auto, offset, async (wait) => {
    const el = ref.current;
    if (!el) return wait(1000);
    await wait(1400);
    el.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse", isPrimary: true }));
    await wait(1400);
    el.dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse", isPrimary: true }));
  });
  return (
    <EffectButton ref={ref} effect="icon-slide">
      {t.getStarted}
    </EffectButton>
  );
}

/** 按住才會完成的按鈕：送 pointerdown，讓它自己跑完進度 */
function HoldTile({ auto, offset, t }: TileProps) {
  const ref = useRef<HTMLDivElement>(null);
  useScript(auto, offset, async (wait) => {
    const el = ref.current?.querySelector("button");
    if (!el) return wait(1000);
    await wait(1200);
    el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "mouse", isPrimary: true }));
    await wait(3600);
  });
  return (
    <div ref={ref}>
      <HoldToConfirm label={t.hold} doneLabel={t.holdDone} duration={1.4} resetAfter={1600} />
    </div>
  );
}

function SliderTile({ auto, offset, t }: TileProps) {
  const [v, setV] = useState(30);
  const stops = [30, 72, 48, 90, 20];
  const i = useRef(0);
  useScript(auto, offset, async (wait) => {
    await wait(1300);
    i.current = (i.current + 1) % stops.length;
    setV(stops[i.current]);
  });
  return <RangeSlider value={v} onValueChange={setV} min={0} max={100} ticks={[0, 25, 50, 75, 100]} label={<span className="text-xs text-muted-foreground">{t.volume}</span>} className="w-full max-w-60" />;
}

function BadgeTile({ auto, offset, t }: TileProps) {
  const [n, setN] = useState(2);
  useScript(auto, offset, async (wait) => {
    await wait(1300);
    setN((x) => (x >= 7 ? 2 : x + 1));
  });
  return (
    <NotifyBadge count={n} tone="ink" label={(c) => `${t.inbox}: ${c}`}>
      <span className="grid size-11 place-items-center rounded-full border border-foreground/10 bg-background">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden="true">
          <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" />
        </svg>
      </span>
    </NotifyBadge>
  );
}

function SendTile({ auto, offset, t }: TileProps) {
  const ref = useRef<HTMLDivElement>(null);
  useScript(auto, offset, async (wait) => {
    await wait(1500);
    ref.current?.querySelector("button")?.click();
    await wait(3200);
  });
  return (
    <div ref={ref}>
      <SendPlaneButton label={t.send} sentLabel={t.sent} resetAfter={1600} />
    </div>
  );
}

function ToastTile({ auto, offset, t, locale }: TileProps) {
  const { toasts, push, dismiss } = useToasts({ max: 3 });
  const i = useRef(0);
  useScript(auto, offset, async (wait) => {
    await wait(1400);
    push({ title: t.toasts[i.current % t.toasts.length], tone: "success", duration: 3600 });
    i.current++;
  });
  return (
    <div className="relative h-full w-full">
      <ToastStack toasts={toasts} onDismiss={dismiss} fixed={false} locale={locale} visibleCount={3} className="inset-x-3 bottom-3 w-auto" />
    </div>
  );
}

function CheckTile({ auto, offset, t }: TileProps) {
  const [round, setRound] = useState(0);
  useScript(auto, offset, async (wait) => {
    await wait(3400);
    setRound((r) => r + 1);
  });
  return <SuccessCheck key={round} message={t.paid} size={52} />;
}

/* ------------------------------------------------------------------ */

type TileDef = { block: string; Tile: (p: TileProps) => ReactNode; fill?: boolean };

/** 順序就是版面順序（5 欄 × 4 列）。block 是型錄裡的區塊名稱 */
const TILES: TileDef[] = [
  { block: "sliding-tabs", Tile: PricingTile },
  { block: "micro-interactions", Tile: ToggleTile },
  { block: "avatar-stack", Tile: AvatarTile },
  { block: "star-rating", Tile: RatingTile },
  { block: "loading-button", Tile: LoadingTile },
  { block: "favorite-button", Tile: FavoriteTile },
  { block: "quantity-stepper", Tile: StepperTile },
  { block: "otp-input", Tile: OtpTile },
  { block: "floating-field", Tile: PostTile },
  { block: "micro-interactions", Tile: TodoTile },
  { block: "command-palette", Tile: CommandTile },
  { block: "floating-field", Tile: PasswordTile },
  { block: "sliding-tabs", Tile: DockTile },
  { block: "button-effects", Tile: ArrowTile },
  { block: "micro-interactions", Tile: HoldTile },
  { block: "range-slider", Tile: SliderTile },
  { block: "notify-badge", Tile: BadgeTile },
  { block: "micro-interactions", Tile: SendTile },
  { block: "toast-stack", Tile: ToastTile, fill: true },
  { block: "micro-interactions", Tile: CheckTile },
];

function Cell({ def, index, wallOn, t, locale }: { def: TileDef; index: number; wallOn: boolean; t: WallCopy; locale: string }) {
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
  const { Tile } = def;
  return (
    <div
      role="group"
      aria-label={def.block}
      onPointerEnter={hold}
      onPointerLeave={release}
      onFocus={hold}
      onBlur={release}
      className="group/cell relative flex h-52 flex-col sm:h-64 overflow-hidden rounded-2xl bg-[#f4f4f4] shadow-e1 transition-shadow duration-200 hover:shadow-e2 dark:bg-[#151515]"
    >
      <div className={cn("flex min-h-0 flex-1 items-center justify-center", def.fill ? "p-0" : "px-5 pt-5")}>
        <Tile auto={wallOn && !held} offset={index * 180} t={t} locale={locale} />
      </div>
      <Link
        href={`/blocks/${def.block}`}
        aria-label={format(t.open, { name: def.block })}
        className="relative z-10 shrink-0 px-5 pt-2 pb-3.5 font-mono text-[11px] text-subtle transition-colors duration-150 hover:text-fg focus-visible:text-fg"
      >
        {def.block}
      </Link>
    </div>
  );
}

export function InteractionWall({ copy, locale }: { copy: WallCopy; locale: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(ref as RefObject<HTMLElement | null>);
  const reduce = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const wallOn = onScreen && !paused && !reduce;

  return (
    <div>
      {!reduce && (
        <div className="mb-4 flex justify-end">
          <button type="button" onClick={() => setPaused((p) => !p)} aria-pressed={paused} className="btn-secondary h-9 px-4 text-sm">
            {paused ? copy.play : copy.pause}
          </button>
        </div>
      )}
      <div ref={ref} role="region" aria-label={copy.label} className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {TILES.map((def, i) => (
          <Cell key={i} def={def} index={i} wallOn={wallOn} t={copy} locale={locale} />
        ))}
      </div>
    </div>
  );
}
