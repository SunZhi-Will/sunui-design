"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// 移植自 DeathsBlessing／山河未歸 reward-notice-layer、reward-notice-card、bond-notice-layer
// ink 預設＝山河未歸的金墨 token；moon＝DeathsBlessing 的月光藍 token
export const storyThemes = {
  ink: {
    "--story-bg": "#08090c",
    "--story-panel": "rgba(8, 9, 12, 0.92)",
    "--story-panel-hover": "rgba(13, 15, 19, 0.96)",
    "--story-line": "rgba(234, 228, 214, 0.14)",
    "--story-text": "#eae4d6",
    "--story-muted": "#837d6f",
    "--story-accent": "#c9a063",
    "--story-accent-bright": "#e7c489",
    "--story-accent-dim": "rgba(201, 160, 99, 0.38)",
    "--story-glow": "201 160 99",
    "--story-glow-bright": "231 196 137",
    "--story-shine": "255 238 200",
    "--story-well": "rgba(4, 5, 7, 0.72)",
    "--story-shadow": "rgba(0, 0, 0, 0.48)",
    "--story-danger": "#c04a3d",
    "--story-font": '"Noto Serif TC", "Songti TC", "PingFang TC", "Microsoft JhengHei", "Heiti TC", serif',
  },
  moon: {
    "--story-bg": "#070a12",
    "--story-panel": "rgba(8, 9, 12, 0.92)",
    "--story-panel-hover": "rgba(13, 15, 19, 0.96)",
    "--story-line": "rgba(233, 237, 245, 0.12)",
    "--story-text": "#e9edf5",
    "--story-muted": "#808ba1",
    "--story-accent": "#a3b8d9",
    "--story-accent-bright": "#d5e1f5",
    "--story-accent-dim": "rgba(163, 184, 217, 0.38)",
    "--story-glow": "117 141 183",
    "--story-glow-bright": "157 177 211",
    "--story-shine": "216 224 239",
    "--story-well": "rgba(4, 5, 7, 0.72)",
    "--story-shadow": "rgba(0, 0, 0, 0.48)",
    "--story-danger": "#cb5579",
    "--story-font": '"PingFang TC", "Noto Sans TC", "Microsoft JhengHei", "Heiti TC", sans-serif',
  },
  rice: {
    "--story-bg": "#f4efe3",
    "--story-panel": "rgba(250, 246, 236, 0.94)",
    "--story-panel-hover": "rgba(255, 252, 244, 0.98)",
    "--story-line": "rgba(60, 48, 32, 0.18)",
    "--story-text": "#2a2219",
    "--story-muted": "rgba(42, 34, 25, 0.6)",
    "--story-accent": "#9a6b2a",
    "--story-accent-bright": "#7a4f17",
    "--story-accent-dim": "rgba(154, 107, 42, 0.38)",
    "--story-glow": "154 107 42",
    "--story-glow-bright": "154 107 42",
    "--story-shine": "255 250 236",
    "--story-well": "rgba(236, 228, 210, 0.9)",
    "--story-shadow": "rgba(60, 48, 32, 0.18)",
    "--story-danger": "#a33a26",
    "--story-font": '"Noto Serif TC", "Songti TC", serif',
  },
} as const;

export type StoryTheme = keyof typeof storyThemes;

export interface StoryNotice {
  id: string;
  /** card：取得提示卡（線索、物品、修練）；line：羈絆式的一行字，不可點 */
  variant?: "card" | "line";
  /** card：左側方框裡的單字圖示，例如「物」「書」「心」 */
  glyph?: ReactNode;
  /** card：縮圖（優先於 glyph），會套上原作的褪色濾鏡 */
  image?: string;
  /** card：小字前綴，例如「發現線索」 */
  kicker?: ReactNode;
  title: ReactNode;
  /** card：右側小字分類，例如「物證」 */
  category?: ReactNode;
  /** 標題掃過一道光；只有長進才加，下滑不慶祝 */
  shimmer?: boolean;
  /** line：亮色的人名 */
  name?: ReactNode;
  /** line：第二行，例如「關係變化：願意同行」 */
  detail?: ReactNode;
  /** line：前綴一枚歪斜印記，例如成就的「燈譜」 */
  seal?: ReactNode;
  /** card：可點時顯示右側 › */
  openable?: boolean;
  /** 按鈕的無障礙名稱 */
  label?: string;
}

/** 先進先出的佇列；畫面上一次只顯示最前面那一則 */
export function useNoticeQueue(initial: StoryNotice[] = []) {
  const [notices, setNotices] = useState<StoryNotice[]>(initial);
  const push = useCallback((notice: StoryNotice) => {
    setNotices((prev) => [...prev.filter((n) => n.id !== notice.id), notice]);
  }, []);
  const dismiss = useCallback((id: string) => setNotices((prev) => prev.filter((n) => n.id !== id)), []);
  return { notices, push, dismiss };
}

export interface NoticeQueueLabels {
  region?: string;
  /** 「還有 N 則待查看」 */
  more?: (n: number) => string;
  dismiss?: (notice: StoryNotice) => string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

// dismiss 沒有內建字串：卡片按鈕預設直接念出通知內容
const MESSAGES: Record<SunLocale, Required<Pick<NoticeQueueLabels, "region" | "more">>> = {
  en: { region: "New discoveries", more: (n) => `${n} more waiting` },
  "zh-TW": { region: "新發現", more: (n) => `還有 ${n} 則待查看` },
  "zh-CN": { region: "新发现", more: (n) => `还有 ${n} 条待查看` },
  ja: { region: "新しい発見", more: (n) => `ほかに ${n} 件あります` },
};

export interface NoticeQueueProps {
  notices: StoryNotice[];
  onDismiss: (id: string) => void;
  /** 點擊可開啟的通知；例如打開線索詳情。通知會保留到你呼叫 onDismiss */
  onOpen?: (notice: StoryNotice) => void;
  /** 詳情開著時設 true：暫停倒數，Esc 也交給詳情面板 */
  holding?: boolean;
  /** 總停留時間（ms），退場動畫擠在最後一段，不會拉長 */
  duration?: number;
  /** 退場（墨色收回）時間 */
  leaveDuration?: number;
  theme?: StoryTheme;
  /** true 時貼著視窗；預設 absolute 疊在最近的 relative 容器右上 */
  fixed?: boolean;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: NoticeQueueLabels;
  className?: string;
}

const css = `
.snq-stack{display:flex;flex-direction:column;align-items:flex-end;pointer-events:none}
.snq-card{position:relative;isolation:isolate;overflow:hidden;display:inline-flex;align-items:center;gap:.6rem;min-width:0;max-width:min(30rem,100%);min-height:2.7rem;box-sizing:border-box;padding:.38rem .68rem;color:var(--story-text);text-align:left;letter-spacing:.08em;cursor:pointer;background:var(--story-panel);border:1px solid var(--story-accent-dim);border-radius:4px;box-shadow:0 5px 18px var(--story-shadow);pointer-events:auto;animation:snq-ink-in 440ms cubic-bezier(.2,.8,.2,1) backwards;transition:border-color 160ms ease,background 160ms ease,transform 160ms ease;font:inherit}
.snq-card:hover,.snq-card:focus-visible{background:var(--story-panel-hover);border-color:var(--story-accent);outline:none}
.snq-card:active{transform:translateY(1px)}
.snq-card.snq-leaving,.snq-line.snq-leaving{animation:snq-ink-out 280ms ease-in both;pointer-events:none}
.snq-art{display:inline-flex;width:2rem;height:2rem;flex:0 0 2rem;align-items:center;justify-content:center;overflow:hidden;color:var(--story-accent-bright);background:var(--story-well);border:1px solid var(--story-accent-dim);border-radius:3px;font-size:1.2rem;line-height:1}
.snq-art img{display:block;width:100%;height:100%;object-fit:cover;filter:saturate(.72) sepia(.12) contrast(.96)}
.snq-copy{display:inline-flex;min-width:0;align-items:baseline;gap:.52rem;white-space:nowrap}
.snq-kicker{flex:0 0 auto;color:var(--story-muted);font-size:.72rem;letter-spacing:.08em}
.snq-title{max-width:17rem;overflow:hidden;color:var(--story-accent-bright);font-size:.92rem;letter-spacing:.08em;text-overflow:ellipsis;white-space:nowrap}
.snq-small{flex:0 0 auto;color:var(--story-muted);font-size:.68rem;letter-spacing:.06em;white-space:nowrap}
.snq-arrow{flex:0 0 auto;color:var(--story-accent);font-size:1.15rem;line-height:1}
.snq-shimmer{position:relative;display:inline-block;overflow:hidden;vertical-align:bottom}
.snq-shimmer::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(100deg,transparent 0 30%,rgb(var(--story-shine) / .55) 45%,rgb(var(--story-glow-bright) / .2) 55%,transparent 70%);mix-blend-mode:screen;transform:translateX(-110%);animation:snq-shimmer 1100ms ease-in-out 320ms both}
.snq-line{position:relative;isolation:isolate;overflow:hidden;padding:.7rem 1.2rem;background:var(--story-panel);border:1px solid var(--story-accent-dim);border-radius:3px;font-size:.95rem;letter-spacing:.04em;color:var(--story-text);box-shadow:0 2px 14px var(--story-shadow);white-space:nowrap;text-align:right;animation:snq-ink-in 440ms cubic-bezier(.2,.8,.2,1) backwards}
.snq-seal{display:inline-block;margin-right:.6em;padding:.05rem .5rem;border:1px solid var(--story-accent);border-radius:2px;color:var(--story-accent);font-size:.72em;letter-spacing:.08em;transform:rotate(-4deg);vertical-align:middle}
@keyframes snq-ink-in{0%{opacity:0;transform:translateX(1.4rem);filter:blur(3px)}60%{opacity:1;filter:blur(0)}100%{opacity:1;transform:none;filter:none}}
@keyframes snq-ink-out{from{opacity:1;transform:none;filter:none}to{opacity:0;transform:translateX(.9rem);filter:blur(3px)}}
@keyframes snq-shimmer{from{transform:translateX(-110%)}to{transform:translateX(110%)}}
@media (prefers-reduced-motion:reduce){.snq-card,.snq-card.snq-leaving,.snq-line,.snq-line.snq-leaving{animation:none;transition-duration:1ms}.snq-shimmer::after{display:none}}
`;

function prefersReducedMotion() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
}

function isEditable(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
}

export function NoticeQueue({
  notices,
  onDismiss,
  onOpen,
  holding = false,
  duration = 4200,
  leaveDuration = 280,
  theme = "ink",
  fixed = false,
  locale = "en",
  labels,
  className,
}: NoticeQueueProps) {
  const current = notices[0];
  const [paused, setPaused] = useState(false);
  const [leavingId, setLeavingId] = useState<string>();
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  // 懸停或聚焦時暫停；離開後從完整的時長重新起算，而不是接續剩餘時間
  useEffect(() => {
    if (!current || holding || paused) return;
    const id = current.id;
    const leaveTimer = prefersReducedMotion()
      ? undefined
      : window.setTimeout(() => setLeavingId(id), duration - leaveDuration);
    const timer = window.setTimeout(() => dismissRef.current(id), duration);
    return () => {
      if (leaveTimer !== undefined) window.clearTimeout(leaveTimer);
      window.clearTimeout(timer);
      // 中途被打斷的退場要回到完整顯示，不停在半透明
      setLeavingId(undefined);
    };
  }, [current, holding, paused, duration, leaveDuration]);

  // Esc 收起目前這一則；詳情開著時讓詳情先關
  useEffect(() => {
    if (!current || holding) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || isEditable(e.target)) return;
      dismissRef.current(current.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, holding]);

  if (!current) return null;

  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const leaving = leavingId === current.id;
  const vars = storyThemes[theme] as unknown as CSSProperties;
  const canOpen = Boolean(onOpen && current.openable);
  const queueCount = notices.length;

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label={t.region}
      className={cn(
        fixed ? "fixed" : "absolute",
        "z-[57] top-[clamp(1rem,15%,10.5rem)] right-[clamp(1rem,5%,4rem)] max-w-[calc(100%-2rem)]",
        className,
      )}
      style={{ ...vars, fontFamily: "var(--story-font)", pointerEvents: "none" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <style>{css}</style>
      <div className="snq-stack">
        {current.variant === "line" ? (
          <div key={current.id} role="status" className={cn("snq-line", leaving && "snq-leaving")}>
            {current.seal && (
              <span className="snq-seal" aria-hidden="true">
                {current.seal}
              </span>
            )}
            {current.name && <span style={{ color: "var(--story-accent-bright)" }}>{current.name}</span>}
            <span
              className={cn(current.shimmer && "snq-shimmer")}
              style={{ marginLeft: current.name ? "0.6em" : undefined, color: current.name ? undefined : "var(--story-accent-bright)" }}
            >
              {current.title}
            </span>
            {current.detail && (
              <span style={{ display: "block", marginTop: "0.35rem", fontSize: "0.85rem", color: "var(--story-accent)" }}>
                {current.detail}
              </span>
            )}
          </div>
        ) : (
          <button
            key={current.id}
            type="button"
            className={cn("snq-card", leaving && "snq-leaving")}
            aria-label={current.label ?? (t.dismiss ? t.dismiss(current) : undefined)}
            onClick={() => (canOpen ? onOpen!(current) : onDismiss(current.id))}
          >
            <span className="snq-art" aria-hidden="true">
              {current.image ? <img src={current.image} alt="" /> : current.glyph}
            </span>
            <span className="snq-copy">
              {current.kicker && <span className="snq-kicker">{current.kicker}</span>}
              <span className={cn("snq-title", current.shimmer && "snq-shimmer")}>{current.title}</span>
            </span>
            {current.category && (
              <span className="snq-small" aria-hidden="true">
                {current.category}
              </span>
            )}
            {queueCount > 1 && (
              <span className="snq-small" aria-label={t.more(queueCount - 1)}>
                +{queueCount - 1}
              </span>
            )}
            {canOpen && (
              <span className="snq-arrow" aria-hidden="true">
                ›
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
