"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRef, useState, type KeyboardEvent } from "react";

import { Result } from "@/components/ui/stamp";
import { cn } from "@/lib/utils";

export interface WalletCoupon {
  id: string;
  /** Face value, for example "$10" or "15%" */
  amount: string;
  title: string;
  /** Conditions of use, for example "Orders over $60" */
  condition?: string;
  expires?: string;
  /** When set, this coupon cannot be selected and the reason is shown (for example how much more to spend to qualify) */
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
  /** Controlled: id of the selected coupon, null means no coupon */
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (id: string | null) => void;
  /** UI language: en, zh-TW, zh-CN, ja. Tags such as zh-Hant-HK or ja-JP are also accepted */
  locale?: string;
  /** Override built-in strings; takes precedence over locale */
  labels?: CouponWalletLabels;
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

// Design language (DESIGN.md): craft surfaces, edges, text colour, one accent
const surface = "bg-card shadow-[0_1px_2px_rgb(0_0_0/0.05),0_4px_12px_-6px_rgb(0_0_0/0.06)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]";
const edge = "border-foreground/10";
const ink = "text-foreground";
const inkMuted = "text-muted-foreground";
/** Brand accent: follows the theme's --primary by default; buyers set --sunui-spot to use their own brand colour. Used only for selection, offers and current progress */
const spotBorder = "border-[color:var(--sunui-spot,var(--primary))]";

const springs = {
  gentle: { type: "spring", stiffness: 240, damping: 30 },
} as const;

/** Width of the concave face-value area on the left */
const STUB = 76;

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
  // Keep the fan's total width within about 1.5 times the card width so it fits at 375px
  const spread = n > 1 ? Math.min(22, 54 / (n - 1)) : 0;
  const selectedIndex = coupons.findIndex((c) => c.id === selected);
  // When stacked, the selected coupon goes on top
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
    // On touch, the first tap expands and the second tap selects
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
              className="absolute inset-x-0 top-5 mx-auto block h-[6.5rem] w-[13.5rem] rounded-xl text-left focus-visible:outline-none [&:focus-visible>span]:ring-2 [&:focus-visible>span]:ring-ring motion-safe:active:scale-[0.97] transition-[color,background-color,border-color,opacity,scale]"
            >
              <span
                className={cn(
                  "relative flex h-full gap-1 overflow-hidden rounded-xl border p-1 shadow-[0_1px_2px_rgb(0_0_0/0.05),0_4px_12px_-6px_rgb(0_0_0/0.06)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]",
                  surface,
                  isOn ? spotBorder : edge,
                )}
              >
                {/* The face value sits inside the concave area (concentric radii 12 - 4 = 8). When unavailable only the content is dimmed and the surface stays opaque, so coupons behind do not show through when the fan opens */}
                {/* Face value on a raised foil plate in the brand colour (2026-11-23). The sheen sits at a different spot on each coupon
                    and slides as the fan opens, like light on tilted metal. Unavailable coupons get plain steel instead */}
                <span
                  className={cn(
                    "flex shrink-0 flex-col items-center justify-center rounded-lg shadow-[inset_0_1px_0_rgb(255_255_255/0.4),inset_0_-1px_0_rgb(0_0_0/0.18),0_1px_2px_rgb(0_0_0/0.12)]",
                    c.unavailableReason ? "text-foreground/60" : "text-[color:var(--sunui-spot-foreground,var(--primary-foreground))]",
                  )}
                  style={{
                    width: STUB,
                    backgroundColor: c.unavailableReason ? "color-mix(in oklch, var(--foreground) 14%, var(--card))" : "var(--sunui-spot, var(--primary))",
                    backgroundImage:
                      "linear-gradient(180deg, rgb(255 255 255 / 0.3), rgb(255 255 255 / 0) 45%, rgb(0 0 0 / 0.16)), linear-gradient(115deg, transparent 34%, rgb(255 255 255 / 0.3) 47%, transparent 60%), repeating-linear-gradient(90deg, rgb(255 255 255 / 0.05) 0 1px, transparent 1px 3px)",
                    backgroundSize: "100% 100%, 260% 100%, auto",
                    backgroundPosition: `0 0, ${open ? 50 - d * 22 + (lifted ? -12 : 0) : 70 - r * 8}% 0, 0 0`,
                    transition: "background-position 500ms cubic-bezier(0.23, 1, 0.32, 1)",
                  }}
                >
                  <span className="text-2xl leading-none font-semibold tracking-tight tabular-nums">{c.amount}</span>
                  <span className="mt-1 text-[10px] font-medium tracking-[0.14em] opacity-80">{t.off}</span>
                </span>
                <span className={cn("flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3", c.unavailableReason && "opacity-55")}>
                  <span className="truncate text-sm font-medium">{c.title}</span>
                  {c.condition && <span className={cn("truncate text-xs tabular-nums", inkMuted)}>{c.condition}</span>}
                  {c.expires && <span className={cn("truncate text-[11px] tabular-nums", inkMuted)}>{c.expires}</span>}
                </span>
                <AnimatePresence initial={false}>
                  {isOn && (
                    <Result key="stamp" size="sm" seed={c.id} className="absolute right-2 bottom-2">
                      {t.applied}
                    </Result>
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
