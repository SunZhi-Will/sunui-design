"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRef, useState, type CSSProperties, type KeyboardEvent } from "react";

import { Stamp } from "@/components/ui/stamp";
import { cn } from "@/lib/utils";

export interface WalletCoupon {
  id: string;
  /** 面額，例如 "$10" 或 "15%" */
  amount: string;
  title: string;
  /** 使用條件，例如 "Orders over $60" */
  condition?: string;
  expires?: string;
  /** 有值時這張券不能選，並顯示原因（例如差多少才達門檻） */
  unavailableReason?: string;
}

export interface CouponWalletLabels {
  group?: string;
  applied?: string;
  off?: string;
  hint?: string;
  appliedAnnouncement?: (title: string) => string;
  removedAnnouncement?: string;
}

export interface CouponWalletProps {
  coupons: WalletCoupon[];
  /** 受控：目前選用的券 id，null 表示不用券 */
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (id: string | null) => void;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: CouponWalletLabels;
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

const MESSAGES: Record<SunLocale, Required<CouponWalletLabels>> = {
  en: {
    group: "Your coupons",
    applied: "Applied",
    off: "OFF",
    hint: "Hover or tab through your coupons to compare them.",
    appliedAnnouncement: (title) => `${title} applied to this order.`,
    removedAnnouncement: "Coupon removed from this order.",
  },
  "zh-TW": {
    group: "你的優惠券",
    applied: "已套用",
    off: "折抵",
    hint: "滑過或用 Tab 逐張比較你的優惠券。",
    appliedAnnouncement: (title) => `已將「${title}」套用到這筆訂單。`,
    removedAnnouncement: "已從這筆訂單移除優惠券。",
  },
  "zh-CN": {
    group: "你的优惠券",
    applied: "已使用",
    off: "立减",
    hint: "悬停或用 Tab 逐张比较你的优惠券。",
    appliedAnnouncement: (title) => `已将“${title}”用于本订单。`,
    removedAnnouncement: "已从本订单移除优惠券。",
  },
  ja: {
    group: "お持ちのクーポン",
    applied: "適用中",
    off: "OFF",
    hint: "ホバーまたは Tab キーでクーポンを見比べられます。",
    appliedAnnouncement: (title) => `「${title}」をこの注文に適用しました。`,
    removedAnnouncement: "この注文からクーポンを外しました。",
  },
};

// 設計語言（DESIGN.md）：紙、紙邊、墨、朱紅
const paper = "bg-[#f7f7f7] dark:bg-[#1c1c1c]";
const edge = "border-[#e2e2e2] dark:border-[#333333]";
const ink = "text-[#171717] dark:text-[#ededed]";
const inkMuted = "text-[#171717]/60 dark:text-[#ededed]/60";
/** 品牌專色：預設跟著主題的 --primary，買家設 --sunui-spot 就換成自己的品牌色。只用在選中、優惠、目前進度 */
const spot = "text-[color:var(--sunui-spot,var(--primary))]";
const spotBorder = "border-[color:var(--sunui-spot,var(--primary))]";

const springs = {
  gentle: { type: "spring", stiffness: 240, damping: 30 },
} as const;

/** 票根寬度與打孔缺口半徑 */
const STUB = 76;
const NOTCH = 8;
const notches: CSSProperties = (() => {
  const mask = `radial-gradient(circle ${NOTCH}px at ${STUB}px 0, #0000 97%, #000), radial-gradient(circle ${NOTCH}px at ${STUB}px 100%, #0000 97%, #000)`;
  return { maskImage: mask, WebkitMaskImage: mask, maskComposite: "intersect", WebkitMaskComposite: "source-in" };
})();

export function CouponWallet({ coupons, value, defaultValue = null, onChange, locale = "en", labels, className }: CouponWalletProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const reduce = useReducedMotion() ?? false;
  const [inner, setInner] = useState<string | null>(defaultValue);
  const selected = value !== undefined ? value : inner;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const pointer = useRef<string>("mouse");

  const n = coupons.length;
  const mid = (n - 1) / 2;
  // 扇形總寬控制在卡寬約 1.5 倍內，375px 也放得下
  const spread = n > 1 ? Math.min(22, 54 / (n - 1)) : 0;
  const selectedIndex = coupons.findIndex((c) => c.id === selected);
  // 疊放時，已選用的券放最上面
  const rank = (i: number) => (selectedIndex < 0 ? i : i === selectedIndex ? 0 : i < selectedIndex ? i + 1 : i);
  const tabIndexFor = (i: number) => (i === (active ?? (selectedIndex < 0 ? 0 : selectedIndex)) ? 0 : -1);
  const detail = coupons[active ?? selectedIndex] ?? null;

  function choose(i: number) {
    const c = coupons[i];
    if (c.unavailableReason) return;
    const next = c.id === selected ? null : c.id;
    if (value === undefined) setInner(next);
    onChange?.(next);
    setAnnouncement(next ? t.appliedAnnouncement(c.title) : t.removedAnnouncement);
    if (pointer.current !== "mouse") setOpen(false);
  }

  function onCardClick(i: number) {
    // 觸控第一下先展開，第二下才選用
    if (!open) {
      setOpen(true);
      setActive(i);
      return;
    }
    choose(i);
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    const jump = e.key === "Home" ? 0 : e.key === "End" ? n - 1 : null;
    if (!step && jump === null) return;
    e.preventDefault();
    const from = active ?? Math.max(selectedIndex, 0);
    const to = jump ?? (from + step + n) % n;
    setOpen(true);
    setActive(to);
    refs.current[to]?.focus();
  }

  return (
    <div className={cn("w-full max-w-sm font-sans", ink, className)}>
      <div
        role="radiogroup"
        aria-label={t.group}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => (pointer.current = e.pointerType)}
        onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
        onPointerLeave={(e) => {
          if (e.pointerType !== "mouse") return;
          setOpen(false);
          setActive(null);
        }}
        onFocus={(e) => {
          if (e.target.matches(":focus-visible")) setOpen(true);
        }}
        onBlur={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
          setOpen(false);
          setActive(null);
        }}
        className="relative h-[9.5rem] w-full"
      >
        {coupons.map((c, i) => {
          const d = i - mid;
          const r = rank(i);
          const isOn = c.id === selected;
          const lifted = open && active === i;
          const target = open
            ? { x: `${d * spread}%`, y: Math.abs(d) * 6 + (lifted ? -12 : 0), rotate: d * 5, scale: 1 }
            : { x: "0%", y: r * 7, rotate: r * -1.5, scale: 1 - r * 0.03 };
          return (
            <motion.button
              key={c.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isOn}
              aria-disabled={!!c.unavailableReason}
              aria-label={[`${c.amount} ${t.off}`, c.title, c.condition, c.expires, c.unavailableReason].filter(Boolean).join(", ")}
              tabIndex={tabIndexFor(i)}
              onClick={() => onCardClick(i)}
              onPointerEnter={(e) => e.pointerType === "mouse" && setActive(i)}
              onFocus={() => setActive(i)}
              initial={false}
              animate={target}
              transition={reduce ? { duration: 0 } : springs.gentle}
              style={{ zIndex: lifted ? n + 1 : open ? i : n - r, transformOrigin: "50% 120%" }}
              className="absolute inset-x-0 top-5 mx-auto block h-[6.5rem] w-[13.5rem] rounded-md text-left focus-visible:outline-none [&:focus-visible>span]:ring-2 [&:focus-visible>span]:ring-ring"
            >
              <span
                style={notches}
                className={cn(
                  "relative flex h-full overflow-hidden rounded-md border shadow-[0_1px_0_rgb(0_0_0/0.04)]",
                  paper,
                  isOn ? spotBorder : edge,
                )}
              >
                {/* 不可用時只淡化內容，紙面保持不透明，扇形展開時後面的券才不會透出來 */}
                <span
                  className={cn("flex shrink-0 flex-col items-center justify-center border-r border-dashed", edge, c.unavailableReason && "opacity-55")}
                  style={{ width: STUB }}
                >
                  <span className={cn("text-2xl leading-none font-semibold tracking-tight tabular-nums", spot)}>{c.amount}</span>
                  <span className={cn("mt-1 text-[10px] font-medium tracking-[0.14em]", inkMuted)}>{t.off}</span>
                </span>
                <span className={cn("flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3", c.unavailableReason && "opacity-55")}>
                  <span className="truncate text-sm font-medium">{c.title}</span>
                  {c.condition && <span className={cn("truncate text-xs tabular-nums", inkMuted)}>{c.condition}</span>}
                  {c.expires && <span className={cn("truncate text-[11px] tabular-nums", inkMuted)}>{c.expires}</span>}
                </span>
                <AnimatePresence initial={false}>
                  {isOn && (
                    <Stamp key="stamp" size="sm" seed={c.id} className="absolute right-2 bottom-2">
                      {t.applied}
                    </Stamp>
                  )}
                </AnimatePresence>
              </span>
            </motion.button>
          );
        })}
      </div>

      <p aria-hidden="true" className={cn("mt-1 min-h-10 text-center text-xs leading-5 tabular-nums", inkMuted)}>
        {detail ? (
          <>
            <span className={cn("font-medium", ink)}>{detail.title}</span>
            {detail.unavailableReason ? <span className="block text-destructive">{detail.unavailableReason}</span> : detail.condition && <span className="block">{detail.condition}</span>}
          </>
        ) : (
          t.hint
        )}
      </p>

      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}
