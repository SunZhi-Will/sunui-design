"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState, type CSSProperties } from "react";

import { Result } from "@/components/ui/stamp";
import type { Messages } from "@/lib/messages";
import { spotKeys, spotSwatches, type SpotKey } from "@/lib/spot";
import { cn } from "@/lib/utils";

type CompareMessages = Messages["home"]["compare"];

/**
 * 首頁主視覺：同一張優惠券，左邊是 AI 工具最常產出的樣子，右邊是 SunUI 的質感版本。
 * 拖動中線比較。用原生 range input 當控制項，鍵盤、觸控、讀屏都直接可用。
 * 只在使用者拖動時改變，不自動播放（DESIGN.md：不做常駐循環）。
 * 下方的色票把右邊的券換成買家的品牌色：SunUI 不替你選顏色，顏色是你的（reports/網站灰階單調診斷-2026-11-08.md）。
 */
export function HeroCompare({ m }: { m: CompareMessages }) {
  const [pos, setPos] = useState(50);
  const [spot, setSpot] = useState<SpotKey>("ink");
  const spotStyle =
    spot === "ink"
      ? undefined
      : ({ "--sunui-spot": spotSwatches[spot].light, "--spot-dark": spotSwatches[spot].dark, "--sunui-spot-foreground": "#ffffff" } as CSSProperties);

  return (
    <figure className="w-full">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-line bg-stage select-none sm:aspect-[5/4]">
        {/* 右邊（After）：SunUI 質感版，墊在底層 */}
        <div
          style={spotStyle}
          className={cn(
            "absolute inset-0 flex items-center justify-center p-6",
            spotStyle && "dark:[--sunui-spot-foreground:#0a0a0a] dark:[--sunui-spot:var(--spot-dark)]",
          )}
        >
          <CraftCoupon m={m} />
        </div>

        {/* 左邊（Before）：常見 AI 樣貌，依滑桿位置裁切 */}
        <div
          className="absolute inset-0 flex items-center justify-center bg-[#0b0618] p-6"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
          aria-hidden="true"
        >
          <SlopCoupon m={m} />
        </div>

        <span className="pointer-events-none absolute top-3 left-3 rounded-sm bg-white px-2 py-0.5 text-xs font-medium text-[#0a0a0a]">
          {m.before}
        </span>
        <span className="pointer-events-none absolute top-3 right-3 rounded-sm bg-fg px-2 py-0.5 text-xs font-medium text-bg">
          {m.after}
        </span>

        {/* 分隔線與把手（純視覺，操作交給下面的 range input） */}
        <div
          className="pointer-events-none absolute inset-y-0 w-px bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.15)]"
          style={{ left: `${pos}%` }}
          aria-hidden="true"
        >
          <span className="absolute top-1/2 left-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white text-[#0a0a0a]">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 7-5 5 5 5M15 7l5 5-5 5" />
            </svg>
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label={m.label}
          aria-valuetext={`${pos}%`}
          // 只有把手那一條接收指標事件，其餘穿透，右邊優惠券的按鈕才點得到
          className="peer pointer-events-none absolute inset-0 h-full w-full appearance-none bg-transparent opacity-0 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-[2000px] [&::-moz-range-thumb]:w-10 [&::-moz-range-thumb]:cursor-ew-resize [&::-moz-range-thumb]:border-0 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-[2000px] [&::-webkit-slider-thumb]:w-10 [&::-webkit-slider-thumb]:cursor-ew-resize [&::-webkit-slider-thumb]:appearance-none"
        />
        <div className="pointer-events-none absolute inset-0 rounded-lg ring-fg ring-offset-2 ring-offset-bg peer-focus-visible:ring-2" aria-hidden="true" />
      </div>
      <div className="mt-3 flex items-center gap-2 text-sm text-subtle">
        <span>{m.spotLabel}</span>
        <div role="radiogroup" aria-label={m.spotLabel} className="flex items-center gap-1">
          {spotKeys.map((key) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={spot === key}
              aria-label={m.spotColors[key]}
              title={m.spotColors[key]}
              onClick={() => setSpot(key)}
              className={cn(
                "grid size-6 place-items-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-accent",
                spot === key ? "border-fg" : "border-transparent hover:border-line",
              )}
            >
              <span
                aria-hidden="true"
                className={cn("size-3.5 rounded-full", key === "ink" && "bg-fg")}
                style={key === "ink" ? undefined : { background: spotSwatches[key].light }}
              />
            </button>
          ))}
        </div>
      </div>
      <figcaption className="mt-2 text-sm text-pretty text-subtle">{m.caption}</figcaption>
    </figure>
  );
}

/** 刻意示範的反例：紫粉漸層、光暈、emoji、大圓角、空泛文案。只用在這張對照圖 */
function SlopCoupon({ m }: { m: CompareMessages }) {
  return (
    <div className="relative w-full max-w-[300px] rounded-3xl bg-gradient-to-br from-fuchsia-500 via-purple-600 to-indigo-600 p-6 text-white shadow-[0_0_60px_rgb(168_85_247/0.55)]">
      <div className="absolute -top-3 -right-3 flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-pink-500 text-xl shadow-[0_0_24px_rgb(236_72_153/0.7)]">
        ✨
      </div>
      <p className="text-xs font-semibold tracking-[0.2em] text-white/80 uppercase">{m.slop.eyebrow}</p>
      <p className="mt-2 bg-gradient-to-r from-white to-pink-200 bg-clip-text text-4xl font-black text-transparent">
        {m.slop.amount}
      </p>
      <p className="mt-1 text-sm text-white/85">{m.slop.body}</p>
      <div className="mt-5 rounded-full bg-gradient-to-r from-pink-400 to-orange-300 py-2.5 text-center text-sm font-bold text-white shadow-[0_8px_30px_rgb(244_114_182/0.6)]">
        {m.slop.cta}
      </div>
    </div>
  );
}

/**
 * SunUI 的做法：有厚度的表面（hairline 加極淡多層陰影，深色用頂邊高光），同心圓角，
 * 按鈕有內高光與按下的重量，領取後結果用 Result 在按鈕原位落定，外框不換。
 */
function CraftCoupon({ m }: { m: CompareMessages }) {
  const [claimed, setClaimed] = useState(false);
  const reduce = useReducedMotion();
  return (
    <div
      className={cn(
        "relative flex w-full max-w-[340px] rounded-xl bg-card p-1 text-foreground",
        "shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.04),0_8px_16px_-8px_rgb(0_0_0/0.10),0_24px_40px_-16px_rgb(0_0_0/0.12)]",
        "dark:bg-[#1f1f1f] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.07),0_0_0_1px_rgb(255_255_255/0.09),0_24px_40px_-16px_rgb(0_0_0/0.6)]",
      )}
    >
      <div className="min-w-0 flex-1 px-4 py-4">
        <p className="text-xs font-medium text-muted-foreground">{m.coupon.eyebrow}</p>
        <p className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-[40px] leading-none font-semibold tracking-[-0.03em] text-[color:var(--sunui-spot,var(--primary))] tabular-nums">
            {m.coupon.amount}
          </span>
          <span className="text-sm font-medium">{m.coupon.unit}</span>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{m.coupon.condition}</p>
      </div>
      {/* 右側是凹面：比表面低一階，放代碼與動作；同心圓角 12 − 4 = 8 */}
      <div className="flex w-[118px] shrink-0 flex-col items-center justify-center gap-2.5 rounded-lg bg-muted/70 px-2 py-3 shadow-[inset_0_1px_2px_rgb(0_0_0/0.06)] dark:bg-white/[0.04] dark:shadow-[inset_0_1px_2px_rgb(0_0_0/0.4)]">
        <p className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground">{m.coupon.code}</p>
        <div className="grid h-8 place-items-center">
          <AnimatePresence mode="popLayout" initial={false}>
            {claimed ? (
              <motion.span key="done" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.1, delay: 0.06 }}>
                <Result shape="tick" size="sm">{m.coupon.claimed}</Result>
              </motion.span>
            ) : (
              <motion.button
                key="claim"
                type="button"
                onClick={() => setClaimed(true)}
                whileTap={reduce ? undefined : { scale: 0.97 }}
                exit={reduce ? undefined : { opacity: 0, transition: { duration: 0.1 } }}
                transition={{ type: "spring", stiffness: 520, damping: 34 }}
                className={cn(
                  "h-8 rounded-md px-4 text-sm font-medium",
                  "bg-[color:var(--sunui-spot,var(--primary))] text-[color:var(--sunui-spot-foreground,var(--primary-foreground))]",
                  "shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_1px_2px_rgb(0_0_0/0.16),0_0_0_1px_rgb(0_0_0/0.08)]",
                  "transition-[filter] duration-150 hover:brightness-110 hover:duration-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--sunui-spot,var(--primary))]",
                )}
              >
                {m.coupon.cta}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        {/* Result 是 aria-hidden，結果另外用 status 告訴讀屏 */}
        <span role="status" className="sr-only">{claimed ? m.coupon.claimed : ""}</span>
      </div>
    </div>
  );
}
