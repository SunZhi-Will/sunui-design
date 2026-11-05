"use client";

import { useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ImageRating = "general" | "sensitive" | "explicit";

export interface SensitiveImageLabels {
  rating?: Partial<Record<ImageRating, string>>;
  /** 分級說明，用在標籤 title 與大圖的說明文字 */
  ratingDesc?: Partial<Record<ImageRating, string>>;
  /** 遮住時的中性 alt */
  blurredAlt?: (ratingLabel: string) => string;
  coveredAlt?: string;
  show?: string;
  showAria?: (ratingLabel: string) => string;
  /** 大圖檢視時的說明，接在分級說明後面 */
  fullHint?: string;
  curtainOn?: string;
  curtainOff?: string;
  /** 分級說明與 fullHint 之間的分隔 */
  descSeparator?: string;
}

export interface SensitiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  rating?: ImageRating;
  /** 這個分級要不要先模糊；預設非全年齡就模糊 */
  blur?: boolean;
  /** 給了就跨元件共享「這次瀏覽已顯示」：縮圖點開後，大圖也不再模糊 */
  revealKey?: string;
  /** 隱私遮罩：遮住所有圖片（不論分級） */
  curtain?: boolean;
  onCurtainOff?: () => void;
  onReveal?: () => void;
  /** 有 onOpen 時整張圖是可點的按鈕，「顯示」按鈕疊在上面 */
  onOpen?: () => void;
  openLabel?: string;
  /** tile：縮圖（小遮罩）；full：大圖檢視 */
  size?: "tile" | "full";
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: SensitiveImageLabels;
  className?: string;
  imgClassName?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

type ResolvedLabels = Required<Omit<SensitiveImageLabels, "rating" | "ratingDesc">> & {
  rating: Record<ImageRating, string>;
  ratingDesc: Record<ImageRating, string>;
};

const MESSAGES: Record<SunLocale, ResolvedLabels> = {
  en: {
    rating: { general: "All ages", sensitive: "Sensitive", explicit: "18+" },
    ratingDesc: {
      general: "No nudity or suggestive content",
      sensitive: "Underwear, suggestive poses, nudity without explicit detail",
      explicit: "Explicit nudity or sexual content",
    },
    blurredAlt: (r) => `Blurred ${r} image`,
    coveredAlt: "Covered image",
    show: "Show",
    showAria: (r) => `Show this ${r} image`,
    fullHint: "Blurred by your settings. Use the button below to show it.",
    curtainOn: "Privacy curtain is on",
    curtainOff: "Lift curtain",
    descSeparator: ". ",
  },
  "zh-TW": {
    rating: { general: "全年齡", sensitive: "敏感", explicit: "18+" },
    ratingDesc: {
      general: "沒有裸露或性暗示內容",
      sensitive: "內衣、性感姿勢，或不含露骨細節的裸露",
      explicit: "露骨裸露或性內容",
    },
    blurredAlt: (r) => `已模糊的${r}圖片`,
    coveredAlt: "已遮住的圖片",
    show: "顯示",
    showAria: (r) => `顯示這張${r}圖片`,
    fullHint: "依你的設定已模糊處理，可用下方按鈕顯示。",
    curtainOn: "隱私遮罩已開啟",
    curtainOff: "拉開遮罩",
    descSeparator: "。",
  },
  "zh-CN": {
    rating: { general: "全年龄", sensitive: "敏感", explicit: "18+" },
    ratingDesc: {
      general: "没有裸露或性暗示内容",
      sensitive: "内衣、性感姿势，或不含露骨细节的裸露",
      explicit: "露骨裸露或色情内容",
    },
    blurredAlt: (r) => `已模糊的${r}图片`,
    coveredAlt: "已遮挡的图片",
    show: "显示",
    showAria: (r) => `显示这张${r}图片`,
    fullHint: "已按你的设置模糊处理，可用下方按钮显示。",
    curtainOn: "隐私遮罩已开启",
    curtainOff: "拉开遮罩",
    descSeparator: "。",
  },
  ja: {
    rating: { general: "全年齢", sensitive: "センシティブ", explicit: "18+" },
    ratingDesc: {
      general: "裸や性的なほのめかしはありません",
      sensitive: "下着、性的なポーズ、露骨な描写のない裸",
      explicit: "露骨な裸や性的な内容",
    },
    blurredAlt: (r) => `ぼかし済みの${r}画像`,
    coveredAlt: "隠された画像",
    show: "表示",
    showAria: (r) => `この${r}画像を表示`,
    fullHint: "設定によりぼかしています。下のボタンで表示できます。",
    curtainOn: "プライバシーカーテンがオンです",
    curtainOff: "カーテンを外す",
    descSeparator: "。",
  },
};

// 單張點開只存在記憶體，重新整理後恢復模糊
let revealedKeys: ReadonlySet<string> = new Set();
const listeners = new Set<() => void>();
const store = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  get: () => revealedKeys,
};
export function revealImage(key: string, on = true) {
  const next = new Set(revealedKeys);
  if (on) next.add(key);
  else next.delete(key);
  revealedKeys = next;
  listeners.forEach((l) => l());
}

/** 分級標籤：性感用琥珀色、18+ 用紅色，全年齡不顯示 */
export function RatingBadge({
  rating,
  locale = "en",
  labels,
  className,
}: {
  rating?: ImageRating;
  locale?: string;
  labels?: SensitiveImageLabels;
  className?: string;
}) {
  if (!rating || rating === "general") return null;
  const m = MESSAGES[resolveLocale(locale)];
  const label = labels?.rating?.[rating] ?? m.rating[rating];
  const desc = labels?.ratingDesc?.[rating] ?? m.ratingDesc[rating];
  return (
    <span
      title={desc}
      className={cn(
        "inline-flex h-5 items-center rounded-md px-1.5 text-[11px] font-semibold tracking-wide tabular-nums",
        rating === "explicit"
          ? "bg-[#DC2626] text-[#FAFAFA] dark:bg-[#F87171] dark:text-[#09090B]"
          : "bg-[#B45309] text-[#FAFAFA] dark:bg-[#FBBF24] dark:text-[#09090B]",
        className,
      )}
    >
      {label}
    </span>
  );
}

function Eye({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

const pill =
  "pointer-events-auto rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur transition-colors hover:bg-white/25 focus-visible:ring-3 focus-visible:ring-white/50 focus-visible:outline-none";

/**
 * 依分級顯示的圖片。遮住時從第一個畫格就套用模糊（不會先閃出原圖），
 * alt 也改成中性文字；點「顯示」只在這次瀏覽有效。
 * 有 onOpen 時整張圖是可點的按鈕，「顯示」按鈕疊在上面（避免按鈕包按鈕）。
 */
export function SensitiveImage({
  src,
  alt,
  width,
  height,
  rating,
  blur,
  revealKey,
  curtain = false,
  onCurtainOff,
  onReveal,
  onOpen,
  openLabel,
  size = "tile",
  locale = "en",
  labels,
  className,
  imgClassName,
  style,
  children,
}: SensitiveImageProps) {
  const m = MESSAGES[resolveLocale(locale)];
  const t = {
    ...m,
    ...labels,
    rating: { ...m.rating, ...labels?.rating },
    ratingDesc: { ...m.ratingDesc, ...labels?.ratingDesc },
  };
  const shared = useSyncExternalStore(store.subscribe, store.get, store.get);
  const [localShown, setLocalShown] = useState(false);
  const mature = !!rating && rating !== "general";
  const shouldBlur = blur ?? mature;
  const shown = revealKey ? shared.has(revealKey) : localShown;
  const covered = curtain || (shouldBlur && !shown);
  const ratingLabel = rating ? t.rating[rating] : "";

  const reveal = () => {
    if (revealKey) revealImage(revealKey);
    else setLocalShown(true);
    onReveal?.();
  };

  return (
    <div className={cn("group/rated relative overflow-hidden bg-muted", className)} style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={covered ? (mature ? t.blurredAlt(ratingLabel) : t.coveredAlt) : alt}
        width={width}
        height={height}
        loading={size === "tile" ? "lazy" : undefined}
        draggable={!covered}
        className={cn(
          "transition-[filter,transform] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
          size === "tile" && "size-full object-cover",
          imgClassName,
          covered && "scale-110 blur-2xl saturate-50 select-none",
        )}
      />
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          aria-label={openLabel}
          className="absolute inset-0 z-[1] outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
        />
      ) : null}

      {covered ? (
        // 遮罩本身也做背景模糊，萬一圖片的模糊失效仍看不到原圖
        <div className="pointer-events-none absolute inset-0 z-[2] flex flex-col items-center justify-center gap-2 bg-black/35 p-3 text-center text-white backdrop-blur-2xl">
          {curtain ? (
            <>
              <EyeOff className={size === "full" ? "size-6" : "size-4"} />
              {size === "full" ? <p className="text-sm font-medium">{t.curtainOn}</p> : null}
              {onCurtainOff ? (
                <button type="button" onClick={onCurtainOff} className={pill}>
                  {t.curtainOff}
                </button>
              ) : null}
            </>
          ) : (
            <>
              <RatingBadge rating={rating} locale={locale} labels={t} />
              {size === "full" && rating ? (
                <p className="max-w-xs text-sm text-white/90">
                  {t.ratingDesc[rating]}
                  {t.descSeparator}
                  {t.fullHint}
                </p>
              ) : null}
              <button type="button" onClick={reveal} aria-label={t.showAria(ratingLabel)} className={cn(pill, "inline-flex items-center gap-1")}>
                <Eye className="size-3.5" /> {t.show}
              </button>
            </>
          )}
        </div>
      ) : mature ? (
        <RatingBadge rating={rating} locale={locale} labels={t} className="pointer-events-none absolute top-2 left-2 z-[2] shadow-sm" />
      ) : null}

      {children}
    </div>
  );
}
