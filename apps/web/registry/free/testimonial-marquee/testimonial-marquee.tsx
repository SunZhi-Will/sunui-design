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

/* ───────── 型別 ───────── */

export type TestimonialAuthor = {
  name?: string | null;
  avatarUrl?: string | null;
};

/** 卡片與展開視窗都會顯示的純文字事實列（課程名稱、角色等） */
export type TestimonialMetaRow = { label: string; value: string };

/** 只在展開視窗顯示的數值細項（整體滿意度、教學品質等） */
export type TestimonialRatingRow = { label: string; value: number };

export type TestimonialTagTone =
  | "neutral"
  | "free"
  | "danger"
  | "discount"
  | "refunded"
  | "info";

/** 單一彩色徽章（推薦程度、已購買標記等） */
export type TestimonialTag = {
  label: string;
  tone: TestimonialTagTone;
  icon?: ReactNode;
};

export type Testimonial = {
  id: string;
  author: TestimonialAuthor;
  /** 0 到 5，可小數 */
  rating: number;
  /** 主要回饋文字。空字串合法，卡面改顯示只有星等的預設面 */
  quote: string;
  ratingBreakdown?: TestimonialRatingRow[];
  meta?: TestimonialMetaRow[];
  tag?: TestimonialTag;
};

export interface TestimonialMarqueeLabels {
  anonymous?: string;
  /** 卡片右下角的展開提示 */
  expandHint?: string;
  /** 沒有文字時卡面中央的說明 */
  ratingOnly?: (rating: string) => string;
  /** 沒有文字時的展開提示 */
  viewFull?: string;
  /** 卡片按鈕的無障礙名稱 */
  openCard?: (name: string) => string;
  /** 對話框的無障礙名稱 */
  dialog?: (name: string) => string;
  close?: string;
  stars?: (rating: string) => string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
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
  /** 1、2 或 3 列，預設 2 */
  rows?: 1 | 2 | 3;
  /** 點擊展開詳情視窗與 3D 傾斜 hover，預設 true */
  expandable?: boolean;
  /** 唯一強調色（星等、評分條、hover 邊框），必須是 hex 色碼（內部會接透明度尾碼），預設琥珀金 #d4a24c */
  accentColor?: string;
  cardWidth?: number;
  /** 卡片不足時補到這個數量，避免一圈太短看起來原地打轉 */
  minCardsPerRow?: number;
  /** 左右邊緣淡出寬度（px） */
  fadeWidth?: number;
  /** 對話框是否以 fixed 蓋滿視窗；false 時以 absolute 蓋滿最近的 relative 父層 */
  fixed?: boolean;
  emptyFallback?: ReactNode;
  /** 介面語言與數字格式：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: TestimonialMarqueeLabels;
  className?: string;
}

/* ───────── 暗色 token（元件自帶，不依賴網站主題） ───────── */

const THEME = {
  "--tm-text-primary": "#f5f5f4",
  "--tm-text-secondary": "#d6d3d1",
  "--tm-text-muted": "#a8a29e",
  "--tm-text-dim": "#78716c",
  "--tm-card-subtle": "#161412",
  "--tm-card": "#1c1a17",
  "--tm-card-raised": "#1c1a17",
  "--tm-border-subtle": "rgb(255 255 255 / 0.08)",
  "--tm-border": "rgb(255 255 255 / 0.12)",
  "--tm-border-hover": "rgb(255 255 255 / 0.16)",
  "--tm-dropdown-bg": "#161412",
  "--tm-backdrop": "rgba(12,10,9,0.82)",
  "--tm-gold": "#d4a24c",
} as CSSProperties;

/** 徽章一律是中性膠囊，狀態只上在 6px 的點上；refunded、info、neutral 不上色 */
const TONE_DOT: Record<TestimonialTagTone, string | null> = {
  neutral: null,
  free: "#34d399",
  danger: "#f87171",
  discount: "var(--tm-gold)",
  refunded: null,
  info: null,
};

const DEFAULT_ACCENT = "#d4a24c";

/** 依名字雜湊出低彩度的暖灰底色，頭像不用強調色 */
function avatarTone(name?: string | null) {
  const key = name?.trim() || "?";
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360} 14% 24%)`;
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

/* ───────── 圖示（形狀照 lucide） ───────── */

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

/* ───────── 小零件（內嵌原站 StarRating / Badge / InitialAvatar） ───────── */

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

/* ───────── 分列 ───────── */

function padCards<T>(cards: T[], minCount: number): T[] {
  if (!cards.length) return [];
  const result = [...cards];
  while (result.length < minCount) {
    result.push(...cards.slice(0, minCount - result.length));
  }
  return result;
}

/** rows=2 時第二列刻意倒序，不是隨機打亂 */
function distributeRows(list: Testimonial[], rows: 1 | 2 | 3, min: number): Testimonial[][] {
  if (rows === 1) return [padCards(list, min)];
  if (rows === 2) return [padCards(list, min), padCards([...list].reverse(), min)];
  const chunks: Testimonial[][] = [[], [], []];
  list.forEach((t, i) => chunks[i % 3].push(t));
  return chunks.map((c) => padCards(c, min));
}

/* ───────── 單張卡片（3D 視差與點擊展開） ───────── */

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
    boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
    outlineColor: accentColor,
    ["--tw-ring-color" as string]: accentColor,
  };

  const content = (
    <>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <StarRating value={t.rating} size={13} label={labels.stars(formatRating(t.rating))} />
          <span className="text-[12px] font-semibold tabular-nums" style={{ color: "var(--tm-text-muted)" }}>
            {formatRating(t.rating)}
          </span>
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
          color="#e7e5e4"
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

/* ───────── 展開視窗（內嵌原站 Modal 的焦點鎖、Escape、鎖捲動） ───────── */

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

  // 開啟時焦點移進面板，關閉時還給觸發的卡片
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
              color="#e7e5e4"
              border="1px solid var(--tm-border-subtle)"
            />
            <div className="min-w-0 flex-1">
              <div className="mb-1 text-[15px] font-semibold" style={{ color: "var(--tm-text-primary)" }}>
                {name}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <StarRating value={t.rating} size={12} label={labels.stars(formatRating(t.rating))} />
                <span className="text-[12px] font-semibold tabular-nums" style={{ color: "var(--tm-text-secondary)" }}>
                  {formatRating(t.rating)}
                </span>
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

/* ───────── 主元件 ───────── */

/**
 * 多列學員留言跑馬燈：列與列方向交錯、hover 或鍵盤聚焦時暫停、左右邊緣淡出，
 * 點卡片開啟詳情對話框。手機寬度與 reduced motion 時改為各列獨立的靜態橫捲。
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
          // JS 驅動暫停：鍵盤使用者 Tab 進卡片時也要停
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
        // 手機與 reduced motion：每列獨立靜態橫捲，不重複內容
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
