"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useId, type ReactNode } from "react";

import { Result } from "@/components/ui/stamp";
import { cn } from "@/lib/utils";

export interface MembershipTier {
  id: string;
  name: string;
  /** Accumulated points needed to reach this tier */
  min: number;
  /** Perks of this tier, shown under "Unlocks at the next tier" */
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
  /** Ordered from low to high; the first tier's min is usually 0 */
  tiers: MembershipTier[];
  points: number;
  /** UI language and number format: en, zh-TW, zh-CN, ja. Tags such as zh-Hant-HK or ja-JP are accepted too */
  locale?: string;
  /** e.g. "Points reset on Dec 31" */
  footnote?: ReactNode;
  /** Override the built-in strings; takes priority over locale */
  labels?: TierProgressLabels;
  className?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Map any language tag to one of the four built-in languages; everything else falls back to English */
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

// Design language (DESIGN.md, craft quality): surface, hairline, text colour, brand accent
const surface = "bg-card shadow-[0_1px_2px_rgb(0_0_0/0.05),0_4px_12px_-6px_rgb(0_0_0/0.06)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]";
const edge = "border-foreground/10";
const ink = "text-foreground";
const inkMuted = "text-muted-foreground";
/** Brand accent: follows the theme's --primary by default; set --sunui-spot to use your own brand colour. Used only for selected state, deals and current progress */
const spot = "text-[color:var(--sunui-spot,var(--primary))]";

const springs = {
  gentle: { type: "spring", stiffness: 240, damping: 30 },
} as const;

// Half-ring arc: centre (100, 100), radius 84
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
  // Needle tip position (angle from 180° on the left to 0° on the right)
  const angle = Math.PI * (1 - fraction);
  const tip = { x: 100 + 84 * Math.cos(angle), y: 100 - 84 * Math.sin(angle) };
  const move = reduce ? { duration: 0 } : springs.gentle;

  return (
    <div className={cn("relative w-full max-w-xs rounded-xl border p-5 font-sans", surface, edge, ink, className)}>
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
          {/* The baseline is dashed, like an unpunched points card */}
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

      <ol className={cn("mt-4 flex border-t pt-3", edge)}>
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
        <div className={cn("mt-3 border-t pt-3", edge)}>
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
          <Result key="stamp" shape="seal" size="sm" seed="tier-top" className="absolute top-4 right-4">
            {t.topStamp}
          </Result>
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
