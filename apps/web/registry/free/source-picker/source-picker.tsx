"use client";

import { useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/*
 * 錄製來源挑選：來源卡片（螢幕或視窗縮圖）與底部的 Screen／Window／Region 分頁 + 搜尋列。
 * 移植自 KapZoom 的 Preflight.tsx。
 */

/* ---------- 主題 token（KapZoom 暗色，數值照原本的 index.css） ---------- */

export function preflightTheme(accent = "#eab308", accentHover = "#facc15"): CSSProperties {
  return {
    "--pf-accent": accent,
    "--pf-accent-hover": accentHover,
    "--pf-accent-fg": "#111111",
    "--pf-bg-app": "#111111",
    "--pf-surface": "#1c1c1c",
    "--pf-elevated": "#252525",
    "--pf-sunken": "#0a0a0a",
    "--pf-text": "#e5e5e5",
    "--pf-text-2": "#a3a3a3",
    "--pf-muted": "#8a8a8a",
    "--pf-border": "rgba(255, 255, 255, 0.06)",
    "--pf-success": "#22c55e",
    "--pf-warning": "#f59e0b",
    "--pf-danger": "#dc2626",
  } as CSSProperties;
}

export const PF_FOCUS = "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pf-accent)]";

/* ---------- lucide 圖示的 inline 版本 ---------- */

type IconProps = { className?: string; style?: CSSProperties };
const icon = (children: ReactNode) =>
  function Icon({ className, style }: IconProps) {
    return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={style}
    >
      {children}
    </svg>
    );
  };

export const Icons = {
  Monitor: icon(
    <>
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </>,
  ),
  AppWindow: icon(
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M10 4v4M2 8h20M6 4v4" />
    </>,
  ),
  Crop: icon(<path d="M6 2v14a2 2 0 0 0 2 2h14M18 22V8a2 2 0 0 0-2-2H2" />),
  Search: icon(
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </>,
  ),
  RefreshCw: icon(
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5" />,
  ),
};

/* ---------- 來源卡片 ---------- */

export interface PreflightSource {
  id: string;
  name: string;
  kind: "screen" | "window";
  /** 縮圖內容（img 或 inline SVG） */
  thumbnail: ReactNode;
  appIcon?: ReactNode;
}

export function SourceCard({ source, selected, onSelect }: { source: PreflightSource; selected: boolean; onSelect: (id: string) => void }) {
  const isScreen = source.kind === "screen";
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(source.id)}
      title={source.name}
      className={cn(
        "group relative w-full bg-[var(--pf-surface)] overflow-hidden border rounded-[14px] transition-all duration-150 motion-reduce:transition-none motion-reduce:transform-none",
        PF_FOCUS,
        selected
          ? "border-[var(--pf-accent)] border-2 shadow-[0_0_0_3px_color-mix(in_srgb,var(--pf-accent)_25%,transparent),0_8px_24px_color-mix(in_srgb,var(--pf-accent)_20%,transparent)] -translate-y-0.5"
          : "border-[var(--pf-border)] hover:border-[color-mix(in_srgb,var(--pf-accent-hover)_60%,transparent)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.18)]",
      )}
    >
      {/* 固定 16:9 */}
      <div className={cn("w-full aspect-video bg-black [&>svg]:size-full [&>img]:size-full", isScreen ? "[&>img]:object-cover" : "[&>img]:object-contain")}>
        {source.thumbnail}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
      {selected && (
        <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[var(--pf-accent)] flex items-center justify-center shadow-lg ring-2 ring-white/20">
          <svg aria-hidden="true" className="w-3.5 h-3.5 text-[var(--pf-accent-fg)]" fill="none" viewBox="0 0 12 12">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 flex items-center gap-2">
        {source.appIcon ? (
          <span className="w-5 h-5 rounded shrink-0 overflow-hidden [&>svg]:size-full">{source.appIcon}</span>
        ) : isScreen ? (
          <Icons.Monitor className="w-5 h-5 text-[var(--pf-accent)] shrink-0" />
        ) : (
          <Icons.AppWindow className="w-5 h-5 text-[var(--pf-text-2)] shrink-0" />
        )}
        <span className="text-[13px] font-semibold text-white truncate flex-1 text-left drop-shadow">{source.name}</span>
      </div>
    </button>
  );
}

/* ---------- 底部來源類型 + 搜尋 ---------- */

export type SourceKind = "screen" | "window" | "region";

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

export interface SourceKindBarLabels {
  toggle: string;
  screen: string;
  window: string;
  region: string;
  search: string;
  refresh: string;
}

const MESSAGES: Record<SunLocale, SourceKindBarLabels> = {
  en: { toggle: "Toggle Screen/Window/Region", screen: "Screen", window: "Window", region: "Region", search: "Search windows...", refresh: "Refresh" },
  "zh-TW": { toggle: "切換螢幕／視窗／區域", screen: "螢幕", window: "視窗", region: "區域", search: "搜尋視窗...", refresh: "重新整理" },
  "zh-CN": { toggle: "切换屏幕／窗口／区域", screen: "屏幕", window: "窗口", region: "区域", search: "搜索窗口...", refresh: "刷新" },
  ja: { toggle: "画面／ウィンドウ／範囲を切り替え", screen: "画面", window: "ウィンドウ", region: "範囲", search: "ウィンドウを検索...", refresh: "更新" },
};

export interface SourceKindBarProps {
  value: SourceKind;
  onChange: (kind: SourceKind) => void;
  query: string;
  onQueryChange: (q: string) => void;
  loading?: boolean;
  onRefresh?: () => void;
  /** tabpanel 的 id，用於 aria-controls */
  panelId: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<SourceKindBarLabels>;
}

const KIND_TABS = [
  { value: "screen", icon: Icons.Monitor },
  { value: "window", icon: Icons.AppWindow },
  { value: "region", icon: Icons.Crop },
] as const;

export function SourceKindBar({ value, onChange, query, onQueryChange, loading, onRefresh, panelId, locale = "en", labels }: SourceKindBarProps) {
  const l = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = KIND_TABS.findIndex((t) => t.value === value);

  // 方向鍵在三個分頁間移動（roving tabindex）
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    let next = -1;
    if (e.key === "ArrowRight") next = (current + 1) % KIND_TABS.length;
    else if (e.key === "ArrowLeft") next = (current - 1 + KIND_TABS.length) % KIND_TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = KIND_TABS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    onChange(KIND_TABS[next].value);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="px-4 pt-2 pb-1.5 flex flex-wrap items-center gap-3 border-b border-[color-mix(in_srgb,var(--pf-border)_60%,transparent)]">
      <div role="tablist" tabIndex={-1} aria-label={l.toggle} className="flex items-center gap-1 shrink-0" onKeyDown={onKeyDown}>
        {KIND_TABS.map(({ value: v, icon: Icon }, i) => {
          const selected = value === v;
          return (
            <button
              key={v}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${panelId}-tab-${v}`}
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(v)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-medium transition-colors",
                PF_FOCUS,
                selected ? "bg-[var(--pf-accent)] text-[var(--pf-accent-fg)]" : "text-[var(--pf-muted)] hover:text-[var(--pf-text)] hover:bg-[var(--pf-elevated)]",
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{l[v]}</span>
            </button>
          );
        })}
      </div>
      <div className="relative flex-1 min-w-[8rem] max-w-xs">
        <Icons.Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--pf-muted)] pointer-events-none" />
        <input
          type="text"
          aria-label={l.search}
          placeholder={l.search}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="w-full bg-[var(--pf-elevated)] border border-[var(--pf-border)] rounded-full focus:border-[var(--pf-accent)] text-xs text-[var(--pf-text)] placeholder:text-[var(--pf-muted)] pl-8 pr-2.5 py-1.5 focus:outline-none transition-colors"
        />
      </div>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          title={l.refresh}
          aria-label={l.refresh}
          className={cn("shrink-0 flex items-center justify-center w-7 h-7 rounded-[8px] text-[var(--pf-muted)] hover:text-[var(--pf-text)] hover:bg-[var(--pf-elevated)] transition-colors", PF_FOCUS)}
        >
          <Icons.RefreshCw className={cn("w-3.5 h-3.5", loading && "motion-safe:animate-spin")} />
        </button>
      )}
    </div>
  );
}
