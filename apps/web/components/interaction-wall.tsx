"use client";

import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from "framer-motion";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";

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
import {
  LoadingButton,
  type LoadingButtonState,
} from "@/registry/free/loading-button/loading-button";
import {
  AnimatedCheckbox,
  HoldToConfirm,
  SendPlaneButton,
  SuccessCheck,
  ToggleSwitch,
} from "@/registry/free/micro-interactions/micro-interactions";
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
function useScript(
  auto: boolean,
  offset: number,
  script: (wait: Wait) => Promise<void>,
) {
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
async function typeOut(
  text: string,
  set: (v: string) => void,
  wait: Wait,
  ms = 70,
) {
  const chars = Array.from(text);
  for (let i = 1; i <= chars.length; i++) {
    set(chars.slice(0, i).join(""));
    await wait(ms);
  }
}

/** 對一個只接受真實操作的輸入框寫值（React 的受控輸入要走原生 setter 再送 input 事件） */
function setNativeValue(el: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

type TileProps = { auto: boolean; offset: number; t: WallCopy; locale: string };

/**
 * 牆上的顏色：參考影片是白卡加少量彩色（藍色的狀態、紅色愛心、彩色頭像）。外殼仍是黑白灰，
 * 顏色只透過區塊自己的 --sunui-spot（micro-interactions 與 button-effects 讀 --primary）注入，跟首頁預覽一樣只出現在區塊身上。
 */
const BLUE = "#3b6cf6";
/** 漸層頭像（參考影片的彩色圓），用 SVG data URI 當 src，不需要外部圖片 */
const gradient = (a: string, b: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="40" height="40" fill="url(#g)"/></svg>`)}`;
/** 卡片裡的字級：跟參考一樣小，標題 15px、說明 11px */
const TITLE = "text-[15px] font-semibold tracking-tight";
const SUB = "text-[11px] leading-snug text-muted-foreground";
const tone = (spot: string, fg = "#ffffff", primary = false): CSSProperties =>
  ({
    "--sunui-spot": spot,
    "--sunui-spot-foreground": fg,
    ...(primary
      ? {
          "--primary": spot,
          "--color-primary": spot,
          "--primary-foreground": fg,
          "--color-primary-foreground": fg,
        }
      : {}),
  }) as CSSProperties;

/* ------------------------------------------------------------------ */
/* 二十格 */

function PricingTile({ auto, offset, t }: TileProps) {
  const [period, setPeriod] = useState("m");
  useScript(auto, offset, async (wait) => {
    await wait(2400);
    setPeriod((p) => (p === "m" ? "y" : "m"));
  });
  const yearly = period === "y";
  return (
    <div className="flex w-full flex-col gap-3">
      <SlidingTabs
        variant="segment"
        size="sm"
        fullWidth
        aria-label={t.pro}
        items={[
          { value: "m", label: t.monthly },
          { value: "y", label: t.yearly },
        ]}
        value={period}
        onValueChange={setPeriod}
      />
      <div>
        <div className="flex items-center justify-between">
          <p className={TITLE}>{t.pro}</p>
          <span
            aria-hidden={!yearly}
            className={cn(
              "rounded-full bg-[#3b6cf6]/12 px-2 py-0.5 text-[10px] font-medium text-[#3b6cf6] transition-[opacity,scale] duration-200 ease-out motion-reduce:transition-none",
              yearly ? "scale-100 opacity-100" : "scale-90 opacity-0",
            )}
          >
            {t.save}
          </span>
        </div>
        <p className="mt-1 flex items-baseline gap-1 text-[28px] leading-none font-semibold tracking-tight">
          <AnimatedNumber
            value={yearly ? 16 : 20}
            currency="USD"
            formatOptions={{ maximumFractionDigits: 0 }}
          />
          <span className="text-xs font-normal text-muted-foreground">
            {t.perMonth}
          </span>
        </p>
        <p className={cn(SUB, "mt-1.5")}>
          {yearly ? t.billedYearly : t.billedMonthly}
        </p>
      </div>
      <ul className="flex flex-col gap-1">
        {t.features.map((f, i) => (
          <li
            key={f}
            className={cn(
              "flex items-center gap-1.5 text-[12px] transition-opacity duration-200 motion-reduce:transition-none",
              i === 2 && !yearly && "opacity-0",
            )}
            aria-hidden={i === 2 && !yearly}
          >
            <span
              className={cn(
                "grid size-3.5 place-items-center rounded-full",
                i === 2
                  ? "bg-[#3b6cf6] text-white"
                  : "bg-foreground/[0.08] text-foreground/60",
              )}
            >
              <svg
                viewBox="0 0 16 16"
                className="size-2.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 8.5l2.5 2.5L12 5.5" />
              </svg>
            </span>
            {f}
          </li>
        ))}
      </ul>
      <span className="grid h-8 place-items-center rounded-lg bg-foreground text-[12px] font-medium text-background">
        {t.upgrade}
      </span>
    </div>
  );
}

const NOTE_COLORS = [
  gradient("#7c83ff", "#3b6cf6"),
  gradient("#ffb36b", "#ff6f61"),
  gradient("#5eead4", "#22a06b"),
];

function ToggleTile({ auto, offset, t }: TileProps) {
  const [on, setOn] = useState(false);
  useScript(auto, offset, async (wait) => {
    await wait(2200);
    setOn((v) => !v);
  });
  return (
    <div className="flex h-full w-full flex-col">
      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        <AnimatePresence initial={false} mode="popLayout">
          {!on ? (
            <motion.ul
              key="list"
              className="flex w-full flex-col gap-2.5"
              exit={{
                opacity: 0,
                scale: 0.92,
                y: 10,
                transition: { duration: 0.22 },
              }}
            >
              {t.notes.map(([who, what, when], i) => (
                <motion.li
                  key={who}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                      delay: i * 0.06,
                      type: "spring",
                      stiffness: 420,
                      damping: 32,
                    },
                  }}
                  className="flex items-center gap-2.5"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={NOTE_COLORS[i]}
                    alt=""
                    className="size-6 shrink-0 rounded-full"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-semibold leading-tight">
                      {who}
                    </span>
                    <span className="block truncate text-[11px] leading-tight text-muted-foreground">
                      {what}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {when}
                  </span>
                </motion.li>
              ))}
            </motion.ul>
          ) : (
            <motion.p
              key="silenced"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{
                opacity: 1,
                scale: 1,
                transition: { delay: 0.12, duration: 0.2 },
              }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              className="text-[12px] text-muted-foreground"
            >
              {t.silenced}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[13px] font-medium">
          <span className="grid size-7 place-items-center rounded-full bg-foreground/[0.06]">
            <svg
              viewBox="0 0 24 24"
              className="size-3.5"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
            </svg>
          </span>
          {t.focus}
        </span>
        <ToggleSwitch
          label={t.focus}
          showLabel={false}
          checked={on}
          onChange={setOn}
        />
      </div>
    </div>
  );
}

const PEOPLE = [
  { id: "a", name: "Mina P.", src: gradient("#ff8a65", "#f4436c") },
  { id: "b", name: "Leo K.", src: gradient("#4facfe", "#2f5bea") },
  { id: "c", name: "Ava S.", src: gradient("#ffb36b", "#ff6f61") },
  { id: "d", name: "Noah T.", src: gradient("#c084fc", "#6d5dfc") },
  { id: "e", name: "Iris W.", src: gradient("#5eead4", "#22a06b") },
];

function AvatarTile({ auto, offset, t, locale }: TileProps) {
  const [n, setN] = useState(4);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<LoadingButtonState>("idle");
  useScript(auto, offset, async (wait) => {
    await wait(1000);
    await typeOut(t.email, setEmail, wait, 70);
    await wait(350);
    setState("loading");
    await wait(900);
    setState("success");
    setN(5);
    await wait(1700);
    setState("idle");
    setEmail("");
    await wait(1400);
    setN(4);
  });
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <p className={TITLE}>{t.shareTitle}</p>
        <p className={SUB}>{format(t.people, { n })}</p>
      </div>
      <AvatarStack people={PEOPLE.slice(0, n)} max={5} locale={locale} />
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-8 min-w-0 flex-1 items-center truncate rounded-lg bg-foreground/[0.05] px-2.5 text-[12px]",
            !email && "text-muted-foreground",
          )}
        >
          {email || "name@company.com"}
        </span>
        <LoadingButton
          state={state}
          successLabel={t.sent}
          loadingStyle="inline"
          className="h-8 px-3 text-[12px]"
        >
          {t.invite}
        </LoadingButton>
      </div>
    </div>
  );
}

function RatingTile({ auto, offset, t, locale }: TileProps) {
  const [v, setV] = useState(0);
  useScript(auto, offset, async (wait) => {
    await wait(900);
    for (let i = 1; i <= 5; i++) {
      setV(i);
      await wait(240);
    }
    await wait(2000);
    setV(0);
    await wait(600);
  });
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={gradient("#efe6d8", "#d6c3a5")}
          alt=""
          className="size-11 shrink-0 rounded-lg"
        />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold">{t.item}</p>
          <p className={SUB}>{t.delivered}</p>
        </div>
      </div>
      <div>
        <p
          className={cn(
            SUB,
            "mb-1.5 transition-colors duration-200",
            v === 5 && "text-foreground",
          )}
        >
          {v === 5 ? t.thanks : t.rating}
        </p>
        <StarRating
          value={v}
          onValueChange={setV}
          locale={locale}
          showLabel={false}
        />
      </div>
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
  return (
    <FavoriteButton
      pressed={on}
      onPressedChange={setOn}
      count={on ? 1285 : 1284}
      locale={locale}
    />
  );
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
      <span>
        <span className="block text-sm font-medium">{t.guests}</span>
        <span className={SUB}>{t.guestsNote}</span>
      </span>
      <QuantityStepper
        value={v}
        onValueChange={setV}
        min={1}
        max={8}
        size="sm"
        locale={locale}
      />
    </div>
  );
}

function OtpTile({ auto, offset, t, locale }: TileProps) {
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
    <div className="flex w-full flex-col items-center">
      <p className={cn(SUB, "text-center")}>
        {t.codeSent}{" "}
        <span className="font-medium text-foreground">{t.codeEmail}</span>
      </p>
      <div className="-my-3 flex w-full justify-center">
        <OtpInput
          value={v}
          onChange={(x) => {
            setV(x);
            setStatus("idle");
          }}
          status={status}
          locale={locale}
          className="shrink-0 origin-center scale-[0.56]"
        />
      </div>
    </div>
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
  return (
    <div className="flex w-full flex-col gap-2.5">
      <FloatingField
        label={t.postLabel}
        multiline
        rows={3}
        maxLength={max}
        counter="ring"
        value={v}
        onValueChange={setV}
        locale={locale}
        className="w-full"
      />
      <div className="flex justify-end">
        <span
          className={cn(
            "rounded-full bg-foreground px-3.5 py-1.5 text-[12px] font-medium text-background transition-opacity duration-200",
            !v && "opacity-30",
          )}
        >
          {t.postButton}
        </span>
      </div>
    </div>
  );
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
        <span className="text-xs tabular-nums text-muted-foreground">
          {format(t.done, { n })}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {t.todos.map((label, i) => (
          <AnimatedCheckbox
            key={label}
            label={<span className="text-[13px]">{label}</span>}
            checked={done[i]}
            onChange={(c) => setDone((d) => d.map((x, j) => (j === i ? c : x)))}
          />
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
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d={d} />
    </svg>
  );
  return (
    <div
      ref={ref}
      className="w-full max-w-64 [&_[role=search]]:shadow-none [&_[role=search]>div:nth-child(3)]:hidden [&_[role=search]>div:nth-child(2)]:max-h-[118px]"
    >
      <CommandPalette
        inline
        placeholder={t.search}
        groups={[
          {
            id: "go",
            heading: t.search,
            items: [
              {
                id: "new",
                label: t.commands[0],
                icon: icon("M12 5v14M5 12h14"),
                shortcut: ["N"],
              },
              {
                id: "profile",
                label: t.commands[1],
                icon: icon(
                  "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20c1.2-3.2 3.8-5 7-5s5.8 1.8 7 5",
                ),
                shortcut: ["P"],
              },
              {
                id: "projects",
                label: t.commands[2],
                icon: icon("M4 6.5h6l2 2h8V18H4z"),
                shortcut: ["O"],
              },
              {
                id: "pricing",
                label: t.commands[3],
                icon: icon("M4 12l8-8h8v8l-8 8z"),
                shortcut: ["$"],
              },
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
  return (
    <FloatingField
      label={t.password}
      strength
      value={v}
      onValueChange={setV}
      locale={locale}
      autoComplete="off"
      className="w-full"
    />
  );
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
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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
    el.dispatchEvent(
      new PointerEvent("pointerenter", {
        pointerType: "mouse",
        isPrimary: true,
      }),
    );
    await wait(1400);
    el.dispatchEvent(
      new PointerEvent("pointerleave", {
        pointerType: "mouse",
        isPrimary: true,
      }),
    );
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
    el.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        pointerType: "mouse",
        isPrimary: true,
      }),
    );
    await wait(3600);
  });
  return (
    <div ref={ref}>
      <HoldToConfirm
        label={t.hold}
        doneLabel={t.holdDone}
        duration={1.4}
        resetAfter={1600}
      />
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
  return (
    <RangeSlider
      value={v}
      onValueChange={setV}
      min={0}
      max={100}
      ticks={[0, 25, 50, 75, 100]}
      label={<span className="text-xs text-muted-foreground">{t.volume}</span>}
      className="w-full max-w-60"
    />
  );
}

function BadgeTile({ auto, offset, t }: TileProps) {
  const [n, setN] = useState(2);
  useScript(auto, offset, async (wait) => {
    await wait(1300);
    setN((x) => (x >= 7 ? 2 : x + 1));
  });
  return (
    <div className="flex flex-col items-center gap-3">
      <NotifyBadge count={n} tone="accent" label={(c) => `${t.inbox}: ${c}`}>
        <span className="grid size-12 place-items-center rounded-full bg-foreground/[0.05]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5"
            aria-hidden="true"
          >
            <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" />
          </svg>
        </span>
      </NotifyBadge>
      <p className={cn(SUB, "tabular-nums")}>{format(t.unread, { n })}</p>
    </div>
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
    push({
      title: t.toasts[i.current % t.toasts.length],
      tone: "success",
      duration: 3600,
    });
    i.current++;
  });
  return (
    <div className="relative h-full w-full">
      <ToastStack
        toasts={toasts}
        onDismiss={dismiss}
        fixed={false}
        locale={locale}
        visibleCount={3}
        className="inset-x-3 bottom-3 w-auto"
      />
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

type TileDef = {
  block: string;
  Tile: (p: TileProps) => ReactNode;
  fill?: boolean;
  style?: CSSProperties;
};

/** 順序就是版面順序（5 欄 × 4 列）。block 是型錄裡的區塊名稱 */
const TILES: TileDef[] = [
  { block: "sliding-tabs", Tile: PricingTile, style: tone(BLUE) },
  {
    block: "micro-interactions",
    Tile: ToggleTile,
    style: tone(BLUE, "#ffffff", true),
  },
  { block: "avatar-stack", Tile: AvatarTile },
  { block: "star-rating", Tile: RatingTile, style: tone("#f5a524") },
  { block: "loading-button", Tile: LoadingTile, style: tone(BLUE) },
  { block: "favorite-button", Tile: FavoriteTile, style: tone("#f43f5e") },
  { block: "quantity-stepper", Tile: StepperTile },
  { block: "otp-input", Tile: OtpTile, style: tone(BLUE) },
  { block: "floating-field", Tile: PostTile, style: tone("#f97316") },
  {
    block: "micro-interactions",
    Tile: TodoTile,
    style: tone(BLUE, "#ffffff", true),
  },
  { block: "command-palette", Tile: CommandTile, style: tone(BLUE) },
  { block: "floating-field", Tile: PasswordTile, style: tone(BLUE) },
  { block: "sliding-tabs", Tile: DockTile, style: tone(BLUE) },
  { block: "button-effects", Tile: ArrowTile },
  {
    block: "micro-interactions",
    Tile: HoldTile,
    style: tone(BLUE, "#ffffff", true),
  },
  {
    block: "range-slider",
    Tile: SliderTile,
    style: tone("var(--foreground)", "var(--background)"),
  },
  { block: "notify-badge", Tile: BadgeTile, style: tone("#f43f5e") },
  {
    block: "micro-interactions",
    Tile: SendTile,
    style: tone(BLUE, "#ffffff", true),
  },
  { block: "toast-stack", Tile: ToastTile, fill: true, style: tone("#22a06b") },
  {
    block: "micro-interactions",
    Tile: CheckTile,
    style: tone("#22a06b", "#ffffff", true),
  },
];

function Cell({
  def,
  index,
  wallOn,
  t,
  locale,
}: {
  def: TileDef;
  index: number;
  wallOn: boolean;
  t: WallCopy;
  locale: string;
}) {
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
      style={def.style}
      className={cn("group/cell relative flex h-[17rem] flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04),0_0_0_1px_rgb(0_0_0/0.025)] dark:bg-[#161616] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]",
        // 首頁上：手機只放前 6 格，平板 3 欄放 18 格，4 欄以上才放滿 20 格，免得頁面太長
        index >= 6 && "hidden md:flex",
        index >= 18 && "md:hidden lg:flex",
      )}
    >
      <div
        className={cn(
          "flex min-h-0 flex-1 items-center justify-center",
          def.fill ? "p-0" : "p-4",
        )}
      >
        <Tile
          auto={wallOn && !held}
          offset={index * 180}
          t={t}
          locale={locale}
        />
      </div>
      <Link
        href={`/blocks/${def.block}`}
        aria-label={format(t.open, { name: def.block })}
        className="absolute bottom-2.5 left-3.5 z-10 rounded-md px-1.5 py-0.5 font-mono text-[11px] text-subtle opacity-0 transition-opacity duration-150 group-hover/cell:opacity-100 hover:text-fg focus-visible:opacity-100 focus-visible:text-fg"
      >
        {def.block}
      </Link>
    </div>
  );
}

export function InteractionWall({
  copy,
  locale,
}: {
  copy: WallCopy;
  locale: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(ref as RefObject<HTMLElement | null>);
  const reduce = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const wallOn = onScreen && !paused && !reduce;

  return (
    <MotionConfig reducedMotion="user">
      <div>
        <div
          ref={ref}
          role="region"
          aria-label={copy.label}
          className="grid grid-cols-1 gap-2.5 rounded-[28px] bg-[#ececec] p-2.5 min-[480px]:grid-cols-2 sm:gap-3 sm:p-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 dark:bg-[#0b0b0b] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.06)]"
        >
          {TILES.map((def, i) => (
            <Cell
              key={i}
              def={def}
              index={i}
              wallOn={wallOn}
              t={copy}
              locale={locale}
            />
          ))}
        </div>
        {!reduce && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-pressed={paused}
              className="h-8 rounded-md px-3 text-[13px] text-subtle transition-colors duration-150 hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
            >
              {paused ? copy.play : copy.pause}
            </button>
          </div>
        )}
      </div>
    </MotionConfig>
  );
}
