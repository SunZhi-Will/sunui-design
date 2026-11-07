"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useId, type ReactNode } from "react";

import { Stamp } from "@/components/ui/stamp";
import { cn } from "@/lib/utils";

export interface MembershipTier {
  id: string;
  name: string;
  /** 達到這個等級所需的累積點數 */
  min: number;
  /** 這個等級的福利，顯示在「下一級可解鎖」 */
  perks?: string[];
}

export interface TierProgressLabels {
  eyebrow?: ReactNode;
  points?: string;
  toNext?: (points: string, tier: string) => ReactNode;
  unlocks?: (tier: string) => ReactNode;
  topTier?: ReactNode;
  topStamp?: ReactNode;
  valueText?: (points: string, target: string, tier: string) => string;
}

export interface TierProgressProps {
  /** 由低到高排列；第一級的 min 通常是 0 */
  tiers: MembershipTier[];
  points: number;
  /** 介面語言與數字格式：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 例如 "Points reset on Dec 31" */
  footnote?: ReactNode;
  /** 覆寫內建字串，優先於 locale */
  labels?: TierProgressLabels;
  className?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, Required<TierProgressLabels>> = {
  en: {
    eyebrow: "Membership",
    points: "pts",
    toNext: (pts, tier) => (
      <>
        <span className="font-semibold tabular-nums">{pts}</span> pts to {tier}
      </>
    ),
    unlocks: (tier) => <>Unlocks at {tier}</>,
    topTier: "You have reached the top tier.",
    topStamp: "Top tier",
    valueText: (pts, target, tier) => `${pts} of ${target} points toward ${tier}`,
  },
  "zh-TW": {
    eyebrow: "會員等級",
    points: "點",
    toNext: (pts, tier) => (
      <>
        再 <span className="font-semibold tabular-nums">{pts}</span> 點升級 {tier}
      </>
    ),
    unlocks: (tier) => <>升級 {tier} 可解鎖</>,
    topTier: "你已達到最高等級。",
    topStamp: "最高等級",
    valueText: (pts, target, tier) => `升級 ${tier} 進度：${pts} / ${target} 點`,
  },
  "zh-CN": {
    eyebrow: "会员等级",
    points: "积分",
    toNext: (pts, tier) => (
      <>
        再攒 <span className="font-semibold tabular-nums">{pts}</span> 积分升级 {tier}
      </>
    ),
    unlocks: (tier) => <>升级 {tier} 可解锁</>,
    topTier: "你已达到最高等级。",
    topStamp: "最高等级",
    valueText: (pts, target, tier) => `升级 ${tier} 进度：${pts} / ${target} 积分`,
  },
  ja: {
    eyebrow: "会員ランク",
    points: "pt",
    toNext: (pts, tier) => (
      <>
        {tier}まであと <span className="font-semibold tabular-nums">{pts}</span> pt
      </>
    ),
    unlocks: (tier) => <>{tier}で解放される特典</>,
    topTier: "最上位ランクに到達しました。",
    topStamp: "最上位",
    valueText: (pts, target, tier) => `${tier}まで ${pts} / ${target} pt`,
  },
};

// 設計語言（DESIGN.md）：紙、紙邊、墨、朱紅
const paper = "bg-[#f7f7f7] dark:bg-[#1c1c1c]";
const edge = "border-[#e2e2e2] dark:border-[#333333]";
const ink = "text-[#171717] dark:text-[#ededed]";
const inkMuted = "text-[#171717]/60 dark:text-[#ededed]/60";
/** 品牌專色：預設跟著主題的 --primary，買家設 --sunui-spot 就換成自己的品牌色。只用在選中、優惠、目前進度 */
const spot = "text-[color:var(--sunui-spot,var(--primary))]";

const springs = {
  gentle: { type: "spring", stiffness: 240, damping: 30 },
} as const;

// 半圓弧：圓心 (100, 100)，半徑 84
const ARC = "M 16 100 A 84 84 0 0 1 184 100";

export function TierProgress({ tiers, points, locale = "en-US", footnote, labels, className }: TierProgressProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const reduce = useReducedMotion() ?? false;
  const id = useId();
  const titleId = `${id}-tier`;
  const descId = `${id}-desc`;

  const fmt = (n: number) => new Intl.NumberFormat(locale).format(n);
  const currentIndex = Math.max(0, tiers.findLastIndex((tier) => points >= tier.min));
  const current = tiers[currentIndex];
  const next = tiers[currentIndex + 1];
  const isTop = !next;
  const fraction = isTop ? 1 : Math.min(1, Math.max(0, (points - current.min) / (next.min - current.min)));
  // 指針端點位置（角度從左 180° 到右 0°）
  const angle = Math.PI * (1 - fraction);
  const tip = { x: 100 + 84 * Math.cos(angle), y: 100 - 84 * Math.sin(angle) };
  const move = reduce ? { duration: 0 } : springs.gentle;

  return (
    <div className={cn("relative w-full max-w-xs rounded-md border p-5 font-sans", paper, edge, ink, className)}>
      <p className={cn("text-[11px] font-medium tracking-[0.14em] uppercase", inkMuted)}>{t.eyebrow}</p>

      <div className="relative mx-auto mt-3 w-full max-w-[15rem]">
        <svg
          viewBox="0 0 200 108"
          className="w-full overflow-visible"
          role="progressbar"
          aria-labelledby={titleId}
          aria-describedby={descId}
          aria-valuemin={isTop ? 0 : current.min}
          aria-valuemax={isTop ? points : next.min}
          aria-valuenow={points}
          aria-valuetext={isTop ? String(t.topTier) : t.valueText(fmt(points), fmt(next.min), next.name)}
        >
          {/* 底線用虛線，像未打孔的點數格 */}
          <path d={ARC} fill="none" stroke="currentColor" strokeOpacity={0.18} strokeWidth={10} strokeDasharray="2 5" />
          <motion.path
            d={ARC}
            className={spot}
            fill="none"
            stroke="currentColor"
            strokeWidth={10}
            strokeLinecap="butt"
            initial={false}
            animate={{ pathLength: fraction }}
            transition={move}
          />
          <motion.circle r={5} className={spot} fill="currentColor" initial={false} animate={{ cx: tip.x, cy: tip.y }} transition={move} />
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <p id={titleId} className="text-2xl leading-none font-semibold tracking-tight">
            {current.name}
          </p>
          <p className={cn("mt-1 text-xs tabular-nums", inkMuted)}>
            {fmt(points)} {t.points}
          </p>
        </div>
      </div>

      <p id={descId} className="mt-4 text-center text-sm">
        {isTop ? t.topTier : t.toNext(fmt(next.min - points), next.name)}
      </p>

      <ol className={cn("mt-4 flex border-t border-dashed pt-3", edge)}>
        {tiers.map((tier, i) => {
          const reached = i <= currentIndex;
          return (
            <li
              key={tier.id}
              aria-current={i === currentIndex ? "step" : undefined}
              className={cn("min-w-0 flex-1 text-center", !reached && inkMuted)}
            >
              <span aria-hidden="true" className={cn("mx-auto mb-1 grid size-4 place-items-center", reached && spot)}>
                {reached ? <CheckIcon /> : <span className="size-1.5 rounded-full bg-current" />}
              </span>
              <span className={cn("block truncate text-xs", i === currentIndex && "font-semibold")}>{tier.name}</span>
              <span className={cn("block text-[11px] tabular-nums", inkMuted)}>{fmt(tier.min)}</span>
            </li>
          );
        })}
      </ol>

      {next?.perks && next.perks.length > 0 && (
        <div className={cn("mt-3 border-t border-dashed pt-3", edge)}>
          <p className={cn("text-xs", inkMuted)}>{t.unlocks(next.name)}</p>
          <ul className="mt-1.5 space-y-1 text-sm">
            {next.perks.map((perk) => (
              <li key={perk} className="flex gap-2">
                <span aria-hidden="true" className={cn("mt-2 h-px w-2 shrink-0 bg-current", inkMuted)} />
                {perk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {footnote && <p className={cn("mt-3 text-[11px]", inkMuted)}>{footnote}</p>}

      <AnimatePresence initial={false}>
        {isTop && (
          <Stamp key="stamp" shape="seal" size="sm" seed="tier-top" className="absolute top-4 right-4">
            {t.topStamp}
          </Stamp>
        )}
      </AnimatePresence>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-3.5">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}
