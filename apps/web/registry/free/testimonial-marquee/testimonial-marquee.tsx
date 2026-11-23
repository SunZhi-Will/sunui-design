"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

/* ───────── Types ───────── */

export type TestimonialAuthor = {
  name?: string | null;
  avatarUrl?: string | null;
};

/** Plain-text fact row shown on the card and in the dialog (course name, role, etc.) */
export type TestimonialMetaRow = { label: string; value: string };

/** Numeric details shown only in the dialog (overall satisfaction, teaching quality, etc.) */
export type TestimonialRatingRow = { label: string; value: number };

export type TestimonialTagTone =
  | "neutral"
  | "free"
  | "danger"
  | "discount"
  | "refunded"
  | "info";

/** A single coloured badge (recommendation level, verified purchase, etc.) */
export type TestimonialTag = {
  label: string;
  tone: TestimonialTagTone;
  icon?: ReactNode;
};

export type Testimonial = {
  id: string;
  author: TestimonialAuthor;
  /** 0 to 5, decimals allowed */
  rating: number;
  /** Main feedback text. An empty string is valid; the card then shows a default face with only the stars */
  quote: string;
  ratingBreakdown?: TestimonialRatingRow[];
  meta?: TestimonialMetaRow[];
  tag?: TestimonialTag;
};

export interface TestimonialMarqueeLabels {
  anonymous?: string;
  /** Expand hint at the card's bottom right */
  expandHint?: string;
  /** Caption in the card centre when there is no text */
  ratingOnly?: (rating: string) => string;
  /** Expand hint when there is no text */
  viewFull?: string;
  /** Accessible name of the card button */
  openCard?: (name: string) => string;
  /** Accessible name of the dialog */
  dialog?: (name: string) => string;
  close?: string;
  stars?: (rating: string) => string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Map any language tag to one of the four built-in languages; everything else uses English */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, Required<TestimonialMarqueeLabels>> = {
  en: {
    anonymous: "Anonymous",
    expandHint: "Tap to expand →",
    ratingOnly: (r) => `Gave a ${r} star rating`,
    viewFull: "Tap to read the full review →",
    openCard: (name) => `Read ${name}'s full feedback`,
    dialog: (name) => `${name}'s full feedback`,
    close: "Close feedback details",
    stars: (r) => `Rated ${r} out of 5`,
  },
  "zh-TW": {
    anonymous: "匿名學員",
    expandHint: "點擊展開 →",
    ratingOnly: (r) => `給了 ${r} 星評價`,
    viewFull: "點擊查看完整評價 →",
    openCard: (name) => `查看 ${name} 的完整回饋`,
    dialog: (name) => `${name} 的完整回饋`,
    close: "關閉回饋詳情",
    stars: (r) => `評分 ${r} / 5`,
  },
  "zh-CN": {
    anonymous: "匿名学员",
    expandHint: "点击展开 →",
    ratingOnly: (r) => `给出了 ${r} 星评价`,
    viewFull: "点击查看完整评价 →",
    openCard: (name) => `查看 ${name} 的完整反馈`,
    dialog: (name) => `${name} 的完整反馈`,
    close: "关闭反馈详情",
    stars: (r) => `评分 ${r} / 5`,
  },
  ja: {
    anonymous: "匿名の受講者",
    expandHint: "タップで開く →",
    ratingOnly: (r) => `星 ${r} の評価`,
    viewFull: "タップしてレビュー全文を読む →",
    openCard: (name) => `${name}のレビュー全文を読む`,
    dialog: (name) => `${name}のレビュー全文`,
    close: "レビューの詳細を閉じる",
    stars: (r) => `5 点中 ${r} 点`,
  },
};

export interface TestimonialMarqueeProps {
  testimonials: Testimonial[];
  /** 1, 2 or 3 rows, default 2 */
  rows?: 1 | 2 | 3;
  /** Click to open the detail dialog, plus 3D tilt on hover; default true */
  expandable?: boolean;
  /** The single accent colour (stars, rating bars, hover border). Must be a hex colour (an alpha suffix is appended internally); default the SunUI rating amber #e8a020 */
  accentColor?: string;
  cardWidth?: number;
  /** Pad cards up to this count so a short loop does not look like it is spinning in place */
  minCardsPerRow?: number;
  /** Width of the left and right edge fade (px) */
  fadeWidth?: number;
  /** Whether the dialog covers the viewport with fixed; when false it covers the nearest relative parent with absolute */
  fixed?: boolean;
  emptyFallback?: ReactNode;
  /** UI language and number format: en, zh-TW, zh-CN, ja; also accepts tags like zh-Hant-HK or ja-JP */
  locale?: string;
  /** Overrides built-in strings, takes precedence over locale */
  labels?: TestimonialMarqueeLabels;
  className?: string;
}

/* ───────── Dark tokens (built in, independent of the site theme) ───────── */

const THEME = {
  "--tm-text-primary": "#f5f5f5",
  "--tm-text-secondary": "#d4d4d4",
  "--tm-text-muted": "#a3a3a3",
  "--tm-text-dim": "#737373",
  "--tm-card-subtle": "#141414",
  "--tm-card": "#1a1a1a",
  "--tm-card-raised": "#1a1a1a",
  "--tm-border-subtle": "rgb(255 255 255 / 0.08)",
  "--tm-border": "rgb(255 255 255 / 0.12)",
  "--tm-border-hover": "rgb(255 255 255 / 0.16)",
  "--tm-dropdown-bg": "#141414",
  "--tm-backdrop": "rgba(12,10,9,0.82)",
  "--tm-gold": "#e8a020",
} as CSSProperties;

/** Badges are always neutral pills; status colour goes only on the 6px dot. refunded, info and neutral are uncoloured */
const TONE_DOT: Record<TestimonialTagTone, string | null> = {
  neutral: null,
  free: "#4cd68a",
  danger: "#ff6b70",
  discount: "var(--tm-gold)",
  refunded: null,
  info: null,
};

const DEFAULT_ACCENT = "#e8a020";

/** Avatar background: a shade of the brand spot colour over the dark card, picked by a hash of the name, so avatars follow the buyer's brand */
function avatarTone(name?: string | null) {
  const key = name?.trim() || "?";
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return `color-mix(in oklch, var(--sunui-spot, var(--primary)) ${[18, 26, 34][h % 3]}%, #1a1a1a)`;
}

/* Rating plate: the score sits on a small raised plate of brand-colour foil (light from above, a diagonal sheen, fine grain) */
const FOIL: CSSProperties = {
  backgroundColor: "var(--sunui-spot, var(--primary))",
  backgroundImage:
    "linear-gradient(180deg, rgb(255 255 255 / 0.3), rgb(255 255 255 / 0) 45%, rgb(0 0 0 / 0.16)), linear-gradient(115deg, transparent 34%, rgb(255 255 255 / 0.3) 47%, transparent 60%), repeating-linear-gradient(90deg, rgb(255 255 255 / 0.05) 0 1px, transparent 1px 3px)",
  backgroundSize: "100% 100%, 260% 100%, auto",
  backgroundPosition: "0 0, 70% 0, 0 0",
  color: "var(--sunui-spot-foreground, var(--primary-foreground))",
  boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.4), inset 0 -1px 0 rgb(0 0 0 / 0.18), 0 1px 2px rgb(0 0 0 / 0.3)",
};

function RatingPlate({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-5 items-center rounded-md px-1.5 text-[11px] leading-none font-semibold tracking-tight tabular-nums" style={FOIL}>
      {children}
    </span>
  );
}
const ROW_DURATIONS_SEC = [26, 34, 30];
const COMPACT_MAX = 767;
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

const KEYFRAMES = `
@keyframes tm-marquee-left { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes tm-marquee-right { from { transform: translateX(-50%); } to { transform: translateX(0); } }
@keyframes tm-lightbox-in {
  from { opacity: 0; transform: scale(0.93) translateY(12px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.tm-viewport {
  overflow: hidden;
  padding-top: 14px;
  padding-bottom: 30px;
  mask-image: linear-gradient(to right, transparent, black var(--tm-fade, 48px), black calc(100% - var(--tm-fade, 48px)), transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, black var(--tm-fade, 48px), black calc(100% - var(--tm-fade, 48px)), transparent);
}
.tm-track { display: flex; gap: 12px; width: max-content; }
@media (prefers-reduced-motion: reduce) {
  .tm-panel { animation: none !important; }
  .tm-card { transition: none !important; }
}
`;

/* ───────── Icons (shapes from lucide) ───────── */

const STAR_PATH =
  "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z";

function StarIcon({ size, fill, style }: { size: number; fill?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ?? "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <path d={STAR_PATH} />
    </svg>
  );
}

function QuoteIcon({ size, style }: { size: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z" />
      <path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z" />
    </svg>
  );
}

function XIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

/* ───────── Small parts (inlined from the original site's StarRating / Badge / InitialAvatar) ───────── */

function StarRating({ value, size = 13, label }: { value: number; size?: number; label: string }) {
  const clamped = Math.max(0, Math.min(5, value));
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={label}>
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = Math.max(0, Math.min(1, clamped - i));
        return (
          <span key={i} style={{ position: "relative", width: size, height: size, display: "inline-block" }} aria-hidden="true">
            <StarIcon size={size} style={{ color: "var(--tm-text-dim)", position: "absolute", inset: 0 }} />
            {fill > 0 && (
              <span style={{ position: "absolute", inset: 0, overflow: "hidden", width: `${fill * 100}%` }}>
                <StarIcon size={size} fill="var(--tm-gold)" style={{ color: "var(--tm-gold)" }} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

function TagBadge({ tag }: { tag: TestimonialTag }) {
  const dot = TONE_DOT[tag.tone];
  return (
    <span
      className="inline-flex h-5 items-center gap-1 px-1.5 align-middle text-[10px] font-medium whitespace-nowrap"
      style={{ color: "var(--tm-text-secondary)", background: "var(--tm-card)", border: "1px solid var(--tm-border-subtle)", borderRadius: 999 }}
    >
      {dot ? <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: dot }} /> : null}
      {tag.icon}
      {tag.label}
    </span>
  );
}

function InitialAvatar({
  name,
  avatarUrl,
  size,
  fontSize,
  weight = "bold",
  background,
  color,
  border,
}: {
  name?: string | null;
  avatarUrl?: string | null;
  size: number;
  fontSize: number;
  weight?: "bold" | "black";
  background: string;
  color: string;
  border?: string;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatarUrl} alt="" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size, border }} />
    );
  }
  const initial = (name?.trim() || "?")[0]?.toUpperCase() ?? "?";
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-full", weight === "black" ? "font-black" : "font-bold")}
      style={{ width: size, height: size, fontSize, background, color, border }}
    >
      {initial}
    </div>
  );
}

/* ───────── Rows ───────── */

function padCards<T>(cards: T[], minCount: number): T[] {
  if (!cards.length) return [];
  const result = [...cards];
  while (result.length < minCount) {
    result.push(...cards.slice(0, minCount - result.length));
  }
  return result;
}

/** With rows=2 the second row is deliberately reversed, not shuffled */
function distributeRows(list: Testimonial[], rows: 1 | 2 | 3, min: number): Testimonial[][] {
  if (rows === 1) return [padCards(list, min)];
  if (rows === 2) return [padCards(list, min), padCards([...list].reverse(), min)];
  const chunks: Testimonial[][] = [[], [], []];
  list.forEach((t, i) => chunks[i % 3].push(t));
  return chunks.map((c) => padCards(c, min));
}

/* ───────── Single card (3D parallax and click to expand) ───────── */

function TestimonialCard({
  t,
  accentColor,
  expandable,
  width,
  labels,
  formatRating,
  onClick,
}: {
  t: Testimonial;
  accentColor: string;
  expandable: boolean;
  width: number;
  labels: Required<TestimonialMarqueeLabels>;
  formatRating: (n: number) => string;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const hasQuote = Boolean(t.quote.trim());
  const name = t.author.name ?? labels.anonymous;

  const onMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const rx = -(y / r.height - 0.5) * 16;
    const ry = (x / r.width - 0.5) * 16;
    el.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02,1.02,1.02)`;
    el.style.borderColor = `${accentColor}50`;
  };
  const onMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(700px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
    el.style.borderColor = "var(--tm-border-subtle)";
  };

  const className = cn(
    "tm-card flex shrink-0 select-none flex-col text-left",
    expandable && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
  );
  const style: CSSProperties = {
    width,
    padding: 20,
    background: "var(--tm-card-subtle)",
    border: "1px solid var(--tm-border-subtle)",
    borderRadius: 16,
    minHeight: 168,
    transition: "transform 0.12s ease-out, border-color 0.2s ease, box-shadow 0.2s ease",
    transformStyle: "preserve-3d",
    willChange: expandable ? "transform" : undefined,
    // Top-edge highlight so the card reads as a raised object on the dark stage
    boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.06), 0 8px 20px rgba(0,0,0,0.2)",
    outlineColor: accentColor,
    ["--tw-ring-color" as string]: accentColor,
  };

  const content = (
    <>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <RatingPlate>{formatRating(t.rating)}</RatingPlate>
          <StarRating value={t.rating} size={13} label={labels.stars(formatRating(t.rating))} />
        </div>
        {t.tag ? <TagBadge tag={t.tag} /> : null}
      </div>

      {hasQuote ? (
        <div className="mb-4 min-h-[70px] flex-1">
          <p
            className="text-[13px] leading-relaxed"
            style={{
              color: "var(--tm-text-secondary)",
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {t.quote}
          </p>
        </div>
      ) : (
        <div className="mb-4 flex min-h-[70px] flex-1 flex-col items-center justify-center gap-1.5 text-center">
          <QuoteIcon size={20} style={{ color: accentColor, opacity: 0.5 }} />
          <p className="text-[12px] leading-relaxed" style={{ color: "var(--tm-text-dim)" }}>
            {labels.ratingOnly(formatRating(t.rating))}
          </p>
          {expandable ? (
            <span className="text-[12px] font-medium" style={{ color: accentColor, opacity: 0.85 }}>
              {labels.viewFull}
            </span>
          ) : null}
        </div>
      )}

      <div className="mt-auto flex items-center gap-2">
        <InitialAvatar
          name={t.author.name}
          avatarUrl={t.author.avatarUrl}
          size={28}
          fontSize={12}
          background={avatarTone(t.author.name)}
          color="#e5e5e5"
          border="1px solid var(--tm-border-subtle)"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-semibold" style={{ color: "var(--tm-text-primary)" }}>
            {name}
          </div>
          {t.meta?.[0] ? (
            <div className="truncate text-[12px]" style={{ color: "var(--tm-text-dim)" }}>
              {t.meta[0].value}
            </div>
          ) : null}
        </div>
        {expandable ? (
          <span className="shrink-0 text-[12px]" style={{ color: "var(--tm-text-dim)" }}>
            {labels.expandHint}
          </span>
        ) : null}
      </div>
    </>
  );

  if (expandable) {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        aria-label={labels.openCard(name)}
        className={className}
        style={style}
      >
        {content}
      </button>
    );
  }
  return (
    <div className={className} style={style}>
      {content}
    </div>
  );
}

/* ───────── Dialog (inlines the original site's Modal focus trap, Escape and scroll lock) ───────── */

function ExpandedDialog({
  t,
  accentColor,
  fixed,
  labels,
  formatRating,
  onClose,
}: {
  t: Testimonial;
  accentColor: string;
  fixed: boolean;
  labels: Required<TestimonialMarqueeLabels>;
  formatRating: (n: number) => string;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const name = t.author.name ?? labels.anonymous;

  useEffect(() => {
    if (!fixed) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fixed]);

  // Move focus into the panel on open, return it to the triggering card on close
  useEffect(() => {
    const restore = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    (panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel)?.focus();
    return () => restore?.focus?.();
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  const node = (
    <div
      className={cn(fixed ? "fixed" : "absolute", "inset-0 z-[100] flex items-end justify-center sm:items-center")}
      style={{
        ...THEME,
        ["--tm-gold" as string]: accentColor,
        background: "var(--tm-backdrop)",
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={onKeyDown}
    >
      <style>{KEYFRAMES}</style>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={labels.dialog(name)}
        tabIndex={-1}
        className={cn(
          "tm-panel relative w-full overflow-y-auto rounded-t-3xl outline-none sm:rounded-3xl",
          fixed ? "max-h-[88vh]" : "max-h-full",
        )}
        style={{
          maxWidth: 420,
          background: "var(--tm-dropdown-bg)",
          border: "1px solid var(--tm-border)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.45)",
          animation: "tm-lightbox-in .22s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-8 rounded-full" style={{ background: "var(--tm-border)" }} />
        </div>

        <div className="relative px-6 pt-5 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: "var(--tm-card-raised)", color: "var(--tm-text-muted)", border: "1px solid var(--tm-border-subtle)" }}
            aria-label={labels.close}
          >
            <XIcon size={14} />
          </button>

          <div className="mb-5 flex items-center gap-3 pr-10">
            <InitialAvatar
              name={t.author.name}
              avatarUrl={t.author.avatarUrl}
              size={44}
              fontSize={16}
              background={avatarTone(t.author.name)}
              color="#e5e5e5"
              border="1px solid var(--tm-border-subtle)"
            />
            <div className="min-w-0 flex-1">
              <div className="mb-1 text-[15px] font-semibold" style={{ color: "var(--tm-text-primary)" }}>
                {name}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <RatingPlate>{formatRating(t.rating)}</RatingPlate>
                <StarRating value={t.rating} size={12} label={labels.stars(formatRating(t.rating))} />
                {t.tag ? (
                  <>
                    <span className="text-[12px]" style={{ color: "var(--tm-text-dim)" }}>·</span>
                    <TagBadge tag={t.tag} />
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {t.ratingBreakdown?.length ? (
            <div className="mb-4 space-y-2.5">
              {t.ratingBreakdown.map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-[12px]" style={{ color: "var(--tm-text-muted)" }}>
                    {row.label}
                  </span>
                  <div className="h-1 flex-1 overflow-hidden rounded-full" style={{ background: "var(--tm-border-hover)" }}>
                    <div className="h-full rounded-full" style={{ width: `${(row.value / 5) * 100}%`, background: accentColor }} />
                  </div>
                  <span className="w-4 shrink-0 text-right text-[12px] font-semibold tabular-nums" style={{ color: "var(--tm-text-primary)" }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          {t.quote.trim() ? (
            <p className="mb-2 text-[13px] leading-relaxed" style={{ color: "var(--tm-text-secondary)" }}>
              {t.quote}
            </p>
          ) : null}

          {t.meta?.length ? (
            <div style={{ borderTop: "1px solid var(--tm-border-subtle)", marginTop: 12, paddingTop: 12 }}>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {t.meta.map((row) => (
                  <div key={row.label} className="flex items-center gap-2 text-[12px]">
                    <span style={{ color: "var(--tm-text-dim)" }}>{row.label}</span>
                    <span className="font-semibold" style={{ color: "var(--tm-text-muted)" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  return fixed ? createPortal(node, document.body) : node;
}

/* ───────── Cover wall mode (CoverMarquee) ───────── */

export type CoverMarqueeItem = {
  key: string;
  /** Cover image URL, fills 16:9 with object-cover */
  src?: string;
  /** Custom content drawn when there is no image */
  content?: ReactNode;
};

export interface CoverMarqueeProps {
  covers: CoverMarqueeItem[];
  /** Number of rows, default 3 */
  rows?: number;
  /** Tilt angle of the whole wall (degrees), default -8 */
  angle?: number;
  /** Width of one cover (px), default 280 */
  tileWidth?: number;
  /** Seconds for the first row to complete one loop, each later row adds 8 seconds; default 60 */
  duration?: number;
  className?: string;
}

/**
 * A tilted cover wall behind a hero as a content background: 16:9 covers in several rows moving in alternating directions,
 * using the same -50% seamless loop as the testimonial marquee. Fully aria-hidden and ignores the mouse; pauses off screen or in a hidden tab,
 * static with reduced motion. The parent needs relative and overflow-hidden.
 */
export function CoverMarquee({ covers, rows = 3, angle = -8, tileWidth = 280, duration = 60, className }: CoverMarqueeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => setReduce(mq.matches);
    const onVisibility = () => setTabVisible(document.visibilityState === "visible");
    onMotion();
    onVisibility();
    mq.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", onVisibility);
    const el = rootRef.current;
    const io = el ? new IntersectionObserver(([entry]) => setInView(entry.isIntersecting)) : null;
    if (el) io?.observe(el);
    return () => {
      mq.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVisibility);
      io?.disconnect();
    };
  }, []);

  if (!covers.length) return null;

  // Offset each row's start, pad enough to cover the view widened by the tilt, then duplicate once for the -50% loop
  const perRow = Math.max(8, covers.length);
  const lines = Array.from({ length: rows }, (_, r) => {
    const off = (r * 3) % covers.length;
    return padCards([...covers.slice(off), ...covers.slice(0, off)], perRow);
  });
  const running = inView && tabVisible;

  return (
    <div ref={rootRef} aria-hidden="true" className={cn("pointer-events-none absolute inset-0 select-none overflow-hidden", className)}>
      <style>{KEYFRAMES}</style>
      <div className="absolute flex flex-col justify-center gap-4" style={{ inset: "-30% -20%", transform: `rotate(${angle}deg)` }}>
        {lines.map((line, r) => (
          <div
            key={r}
            className="tm-track"
            style={{
              gap: 16,
              // Reduced motion: static, odd rows shifted left by half a cover so the wall does not form a neat grid
              transform: reduce ? `translateX(${r % 2 ? -tileWidth / 2 : 0}px)` : undefined,
              animation: reduce ? "none" : `${r % 2 === 0 ? "tm-marquee-left" : "tm-marquee-right"} ${duration + r * 8}s linear infinite`,
              animationPlayState: running ? "running" : "paused",
            }}
          >
            {[...line, ...line].map((c, i) => (
              <div
                key={`${c.key}-${i}`}
                className="relative shrink-0 overflow-hidden rounded-xl bg-muted shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(255_255_255/0.08)]"
                style={{ width: tileWidth, aspectRatio: "16 / 9" }}
              >
                {c.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.src} alt="" draggable={false} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  c.content
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── Main component ───────── */

/**
 * Multi-row student testimonial marquee: rows alternate direction, pause on hover or keyboard focus, edges fade,
 * and clicking a card opens a detail dialog. On phone widths and with reduced motion each row becomes its own static horizontal scroller.
 */
export function TestimonialMarquee({
  testimonials,
  rows = 2,
  expandable = true,
  accentColor = DEFAULT_ACCENT,
  cardWidth = 288,
  minCardsPerRow = 5,
  fadeWidth = 48,
  fixed = true,
  emptyFallback = null,
  locale = "en",
  labels: labelsProp,
  className,
}: TestimonialMarqueeProps) {
  const labels = { ...MESSAGES[resolveLocale(locale)], ...labelsProp };
  const formatRating = (n: number) => new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);
  const [expanded, setExpanded] = useState<Testimonial | null>(null);
  const [paused, setPaused] = useState(false);
  const [allowAnimation, setAllowAnimation] = useState(true);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compactScreen = window.matchMedia(`(max-width: ${COMPACT_MAX}px)`);
    const update = () => setAllowAnimation(!(reduceMotion.matches || compactScreen.matches));
    update();
    reduceMotion.addEventListener("change", update);
    compactScreen.addEventListener("change", update);
    return () => {
      reduceMotion.removeEventListener("change", update);
      compactScreen.removeEventListener("change", update);
    };
  }, []);

  if (!testimonials.length) return <>{emptyFallback}</>;

  const themed = { ...THEME, ["--tm-gold" as string]: accentColor } as CSSProperties;

  const groups = distributeRows(testimonials, rows, minCardsPerRow);
  const renderCards = (cards: Testimonial[]) =>
    cards.map((t, ci) => (
      <TestimonialCard
        key={`${t.id}-${ci}`}
        t={t}
        accentColor={accentColor}
        expandable={expandable}
        width={cardWidth}
        labels={labels}
        formatRating={formatRating}
        onClick={expandable ? () => setExpanded(t) : undefined}
      />
    ));

  return (
    <>
      <style>{KEYFRAMES}</style>
      {allowAnimation ? (
        <div
          className={className}
          style={themed}
          // JS-driven pause: it must also stop when keyboard users Tab into a card
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          {groups.map((cards, ri) => {
            const items = renderCards(cards);
            return (
              <div key={ri} className="tm-viewport" style={{ ["--tm-fade" as string]: `${fadeWidth}px` }}>
                <div
                  className="tm-track"
                  style={{
                    animation: `${ri % 2 === 0 ? "tm-marquee-left" : "tm-marquee-right"} ${ROW_DURATIONS_SEC[ri] ?? 30}s linear infinite`,
                    animationPlayState: paused ? "paused" : "running",
                  }}
                >
                  {[...items, ...items].map((item, ii) => (
                    <div key={ii} className="shrink-0" aria-hidden={ii >= items.length ? true : undefined} inert={ii >= items.length ? true : undefined}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Phones and reduced motion: each row is its own static horizontal scroller, no duplicated content
        <div className={className} style={themed}>
          {groups.map((cards, ri) => (
            <div key={ri} className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ paddingBottom: 8 }}>
              <div className="flex w-max gap-3">
                {renderCards(cards).map((item, ii) => (
                  <div key={ii} className="shrink-0">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {expandable && expanded ? (
        <ExpandedDialog t={expanded} accentColor={accentColor} fixed={fixed} labels={labels} formatRating={formatRating} onClose={() => setExpanded(null)} />
      ) : null}
    </>
  );
}

export default TestimonialMarquee;
