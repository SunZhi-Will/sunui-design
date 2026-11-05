"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/* ---------- 圖示（形狀照原版 heroicons 路徑） ---------- */

const icon = (d: string) => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);

export const toolbarIcons = {
  back: icon("M10 19l-7-7m0 0l7-7m-7 7h18"),
  generate: icon("M13 10V3L4 14h7v7l9-11h-7z"),
  enhance: icon(
    "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
  ),
  analyze: icon(
    "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  ),
  transform: icon("M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"),
  select: icon(
    "M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122",
  ),
  text: icon("M4 6h16M4 12h16M4 18h7"),
  image: icon(
    "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  ),
  link: icon(
    "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
  ),
  draw: icon("M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"),
  reset: icon("M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"),
};

const spinner = (
  <svg className="cf-ft-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

/* ---------- 浮動工具列 ---------- */

export type ToolbarTool = {
  id: string;
  label: string;
  shortcut?: string;
  icon: ReactNode;
  /** true：點了執行 onAction（非同步，期間顯示轉圈），不會變成選取狀態 */
  action?: boolean;
  /** 選取時的底色、字色與滑過底色，預設藍色；沒有 hover 時滑過沿用一般的藍色 hover（同原版） */
  accent?: { soft: string; strong: string; hover?: string };
};

export type ToolbarEntry = ToolbarTool | "divider";

export type FloatingToolbarLabels = {
  toolbar: string;
  back: string;
  busy: string;
  /** 內建 AI 工具的名稱（只在沒傳 tools 時使用） */
  generate: string;
  enhance: string;
  analyze: string;
  transform: string;
};

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, FloatingToolbarLabels> = {
  en: {
    toolbar: "AI tools",
    back: "Back to main toolbar (ESC)",
    busy: "working",
    generate: "Generate",
    enhance: "Enhance",
    analyze: "Analyze",
    transform: "Transform",
  },
  "zh-TW": {
    toolbar: "AI 工具",
    back: "返回主工具列 (ESC)",
    busy: "處理中",
    generate: "生成內容",
    enhance: "優化",
    analyze: "分析",
    transform: "轉換",
  },
  "zh-CN": {
    toolbar: "AI 工具",
    back: "返回主工具栏 (ESC)",
    busy: "处理中",
    generate: "生成内容",
    enhance: "优化",
    analyze: "分析",
    transform: "转换",
  },
  ja: {
    toolbar: "AI ツール",
    back: "メインツールバーに戻る (ESC)",
    busy: "処理中",
    generate: "生成",
    enhance: "改善",
    analyze: "分析",
    transform: "変換",
  },
};

const buildAiTools = (t: Pick<FloatingToolbarLabels, "generate" | "enhance" | "analyze" | "transform">): ToolbarEntry[] => [
  { id: "generate", label: t.generate, shortcut: "G", icon: toolbarIcons.generate, action: true },
  { id: "enhance", label: t.enhance, shortcut: "E", icon: toolbarIcons.enhance },
  { id: "analyze", label: t.analyze, shortcut: "A", icon: toolbarIcons.analyze },
  { id: "transform", label: t.transform, shortcut: "T", icon: toolbarIcons.transform },
];

/** 原版 AIToolbar 的四個工具（英文）；「生成內容」是動作 */
export const aiTools: ToolbarEntry[] = buildAiTools(MESSAGES.en);

const defaultAccent = { soft: "rgba(59, 130, 246, 0.3)", strong: "#2563eb", hover: "rgba(59, 130, 246, 0.4)" };

export type FloatingToolbarProps = {
  tools?: ToolbarEntry[];
  selectedTool?: string | null;
  /** 選一般工具時呼叫；動作完成後會呼叫 onSelectTool(null) 清除選取 */
  onSelectTool?: (id: string | null) => void;
  /** 動作工具（例如 AI 生成）的非同步呼叫，錯誤請在 callback 內自行處理 */
  onAction?: (id: string) => Promise<void> | void;
  /** 有傳才顯示返回鈕，Escape 也會呼叫 */
  onClose?: () => void;
  /** 顯示或滑出畫面，300ms ease-in-out，與原版切換工具列相同 */
  open?: boolean;
  /** 原版為 fixed 貼齊視窗左側；放在相對容器裡時設 false */
  fixed?: boolean;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<FloatingToolbarLabels>;
  className?: string;
  style?: CSSProperties;
};

export function FloatingToolbar({
  tools: toolsProp,
  selectedTool = null,
  onSelectTool,
  onAction,
  onClose,
  open = true,
  fixed = true,
  locale = "en",
  labels,
  className,
  style,
}: FloatingToolbarProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const tools = toolsProp ?? buildAiTools(t);
  const [pending, setPending] = useState<string | null>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
  const backLabel = t.back;

  // 原版在 AI 模式按 Escape 回主工具列
  useEffect(() => {
    if (!open || !onClose) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key !== "Escape" || el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable) return;
      closeRef.current?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const press = async (tool: ToolbarTool) => {
    if (!tool.action) return onSelectTool?.(tool.id);
    if (pending) return;
    setPending(tool.id);
    try {
      await onAction?.(tool.id);
    } catch {
      // 錯誤交給呼叫端
    } finally {
      setPending(null);
      onSelectTool?.(null);
    }
  };

  return (
    <div
      className={cn("cf-ft-wrap left-4 top-1/2 z-50", fixed ? "fixed" : "absolute", className)}
      style={{
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
        transform: open ? "translateY(-50%)" : "translate(-120%, -50%)",
        ...style,
      }}
      inert={!open}
    >
      <div role="toolbar" aria-orientation="vertical" aria-label={t.toolbar} className="cf-ft-glass flex flex-col gap-0.5 rounded-xl p-1.5">
        {onClose && (
          <>
            <button type="button" onClick={onClose} className="cf-ft-btn" aria-label={backLabel} title={backLabel}>
              {toolbarIcons.back}
              <span className="cf-ft-tip" aria-hidden="true">
                {backLabel}
              </span>
            </button>
            <div className="my-0.5 h-px bg-white/20" />
          </>
        )}

        {tools.map((tool, i) => {
          if (tool === "divider") return <div key={`d${i}`} className="my-0.5 h-px bg-white/20" />;
          const isSelected = !tool.action && selectedTool === tool.id;
          const busy = pending === tool.id;
          const accent = tool.accent ?? defaultAccent;
          const label = tool.shortcut ? `${tool.label} (${tool.shortcut})` : tool.label;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => press(tool)}
              className="cf-ft-btn"
              data-selected={isSelected || undefined}
              data-accent-hover={(isSelected && accent.hover) || undefined}
              aria-pressed={tool.action ? undefined : isSelected}
              aria-busy={busy || undefined}
              aria-label={busy ? `${tool.label}, ${t.busy}` : tool.label}
              aria-keyshortcuts={tool.shortcut}
              disabled={busy}
              title={label}
              style={{ "--cf-ft-soft": accent.soft, "--cf-ft-strong": accent.strong, "--cf-ft-hover": accent.hover } as CSSProperties}
            >
              {busy ? spinner : tool.icon}
              <span className="cf-ft-tip" aria-hidden="true">
                {label}
              </span>
            </button>
          );
        })}
      </div>

      <style>{`
        .cf-ft-wrap { transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1); }
        .cf-ft-glass {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.08),
            0 2px 8px rgba(0, 0, 0, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 0 rgba(255, 255, 255, 0.5);
        }
        .cf-ft-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          color: #374151;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: auto;
          outline: none;
          border: none;
          background: transparent;
        }
        .cf-ft-btn[data-selected] { background: var(--cf-ft-soft); color: var(--cf-ft-strong); }
        .cf-ft-btn:hover:not(:disabled), .cf-ft-btn:focus-visible {
          background: rgba(59, 130, 246, 0.15);
          color: #2563eb;
          transform: scale(1.05);
        }
        .cf-ft-btn[data-accent-hover]:hover, .cf-ft-btn[data-accent-hover]:focus-visible {
          background: var(--cf-ft-hover);
          color: var(--cf-ft-strong);
        }
        .cf-ft-btn:disabled { cursor: progress; color: #2563eb; }
        .cf-ft-btn:active { transform: scale(0.95); }
        .cf-ft-tip {
          position: absolute;
          left: calc(100% + 8px);
          background: rgba(17, 24, 39, 0.95);
          backdrop-filter: blur(8px);
          color: white;
          font-size: 10px;
          font-weight: 500;
          padding: 4px 8px;
          border-radius: 6px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1;
        }
        .cf-ft-btn:hover .cf-ft-tip, .cf-ft-btn:focus-visible .cf-ft-tip { opacity: 1; }
        .cf-ft-tip::before {
          content: '';
          position: absolute;
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          border: 5px solid transparent;
          border-right-color: rgba(17, 24, 39, 0.95);
        }
        .cf-ft-spin { animation: cf-ft-spin 1s linear infinite; }
        @keyframes cf-ft-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .cf-ft-wrap, .cf-ft-btn, .cf-ft-tip { transition: none; }
          .cf-ft-btn:hover:not(:disabled), .cf-ft-btn:focus-visible, .cf-ft-btn:active { transform: none; }
          .cf-ft-spin { animation-duration: 2.4s; }
        }
      `}</style>
    </div>
  );
}
