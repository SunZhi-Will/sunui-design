"use client";

import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type CanvasContextMenuLabels = {
  menu: string;
  selected: (count: number) => string;
  empty: string;
  group: string;
  ungroup: string;
  layout: string;
  duplicate: string;
  delete: string;
};

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, CanvasContextMenuLabels> = {
  en: {
    menu: "Canvas actions",
    selected: (n) => `${n} ${n === 1 ? "object" : "objects"} selected`,
    empty: "No actions available",
    group: "Group",
    ungroup: "Ungroup",
    layout: "Layout",
    duplicate: "Duplicate",
    delete: "Delete",
  },
  "zh-TW": {
    menu: "畫布操作",
    selected: (n) => `已選取 ${n} 個物件`,
    empty: "沒有可用的操作",
    group: "組成群組",
    ungroup: "解散群組",
    layout: "佈局",
    duplicate: "複製",
    delete: "刪除",
  },
  "zh-CN": {
    menu: "画布操作",
    selected: (n) => `已选中 ${n} 个对象`,
    empty: "没有可用的操作",
    group: "编组",
    ungroup: "取消编组",
    layout: "布局",
    duplicate: "复制",
    delete: "删除",
  },
  ja: {
    menu: "キャンバス操作",
    selected: (n) => `${n} 個のオブジェクトを選択中`,
    empty: "使用できる操作はありません",
    group: "グループ化",
    ungroup: "グループ解除",
    layout: "レイアウト",
    duplicate: "複製",
    delete: "削除",
  },
};

export type CanvasContextMenuProps = {
  /** 選單左上角座標（fixed 時為視窗座標，否則相對最近的定位容器） */
  x: number;
  y: number;
  onClose: () => void;
  selectedCount: number;
  hasGroup: boolean;
  onGroup: () => void;
  onUngroup: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  /** 有傳才顯示「佈局」 */
  onSnapToGrid?: () => void;
  /** 原版為 fixed；放在相對容器裡時設 false */
  fixed?: boolean;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<CanvasContextMenuLabels>;
  className?: string;
};

/* 原版用 emoji 當圖示，改成 1.5px 線條圖示，形狀對應原意 */
const glyph = (children: ReactNode) => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const icons = {
  group: glyph(<><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" /><path d="M7 11v4a2 2 0 0 0 2 2h4M17 13V9a2 2 0 0 0-2-2h-4" /></>),
  ungroup: glyph(<><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" /><path d="M15 5h4v4M9 19H5v-4" /></>),
  layout: glyph(<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>),
  duplicate: glyph(<><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>),
  delete: glyph(<><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /><path d="M10 11v6M14 11v6" /></>),
};

type Item = {
  key: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  shortcut?: string;
  danger?: boolean;
  disabled: boolean;
};

export function CanvasContextMenu({
  x,
  y,
  onClose,
  selectedCount,
  hasGroup,
  onGroup,
  onUngroup,
  onDelete,
  onDuplicate,
  onSnapToGrid,
  fixed = true,
  locale = "en",
  labels: labelsProp,
  className,
}: CanvasContextMenuProps) {
  const labels = { ...MESSAGES[resolveLocale(locale)], ...labelsProp };
  const menuRef = useRef<HTMLDivElement>(null);

  // 點外面或按 Escape 關閉
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // 開啟時把焦點放到第一個可用項目，方便鍵盤操作
  // 關閉時若焦點還在選單內，還給原本的元素
  useEffect(() => {
    const menu = menuRef.current;
    const prev = document.activeElement as HTMLElement | null;
    menu?.querySelector<HTMLButtonElement>('[role="menuitem"]:not([disabled])')?.focus({ preventScroll: true });
    return () => {
      if (menu?.contains(document.activeElement) || document.activeElement === document.body) prev?.focus?.({ preventScroll: true });
    };
  }, []);

  const run = (fn: () => void) => () => {
    fn();
    onClose();
  };

  const items: Item[] = [
    ...(selectedCount > 1 && !hasGroup
      ? [{ key: "group", label: labels.group, icon: icons.group, onClick: run(onGroup), disabled: false }]
      : []),
    ...(hasGroup ? [{ key: "ungroup", label: labels.ungroup, icon: icons.ungroup, onClick: run(onUngroup), disabled: false }] : []),
    ...(onSnapToGrid
      ? [{ key: "layout", label: labels.layout, icon: icons.layout, onClick: run(onSnapToGrid), shortcut: "Ctrl+Shift+L", disabled: false }]
      : []),
    { key: "duplicate", label: labels.duplicate, icon: icons.duplicate, onClick: run(onDuplicate), shortcut: "Ctrl+C", disabled: selectedCount === 0 },
    { key: "delete", label: labels.delete, icon: icons.delete, onClick: run(onDelete), shortcut: "Delete", danger: true, disabled: selectedCount === 0 },
  ];

  // 上下鍵在可用項目間移動
  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const list = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])') ?? []);
    if (!list.length) return;
    e.preventDefault();
    const i = list.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      e.key === "Home" ? 0 : e.key === "End" ? list.length - 1 : e.key === "ArrowDown" ? (i + 1) % list.length : (i - 1 + list.length) % list.length;
    list[next]?.focus();
  };

  return (
    <div
      ref={menuRef}
      role="menu"
      tabIndex={-1}
      aria-label={labels.menu}
      onKeyDown={onKeyDown}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        "cf-menu z-[100] min-w-[180px] overflow-hidden rounded-lg border border-border bg-card text-foreground shadow-md",
        fixed ? "fixed" : "absolute",
        className,
      )}
      style={{ left: x, top: y }}
    >
      {selectedCount > 0 && (
        <div className="border-b border-border px-3 py-2">
          <span className="text-xs font-medium text-muted-foreground tabular-nums">{labels.selected(selectedCount)}</span>
        </div>
      )}
      <div className="py-1">
        {items.length === 0 ? (
          <div className="px-3 py-2 text-center text-sm text-muted-foreground">{labels.empty}</div>
        ) : (
          items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={item.disabled ? undefined : item.onClick}
              disabled={item.disabled}
              aria-keyshortcuts={item.shortcut?.replace("Ctrl", "Control")}
              className={cn(
                "flex w-full items-center justify-between px-3 py-2 text-left text-sm outline-none transition-colors",
                item.disabled
                  ? "cursor-not-allowed text-muted-foreground opacity-50"
                  : item.danger
                    ? "text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10"
                    : "text-foreground hover:bg-muted focus-visible:bg-muted",
              )}
            >
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className={item.danger ? "" : "text-muted-foreground"}>{item.icon}</span>
                <span>{item.label}</span>
              </span>
              {item.shortcut && <span className="font-mono text-[11px] text-muted-foreground">{item.shortcut}</span>}
            </button>
          ))
        )}
      </div>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .cf-menu button { transition: none; }
        }
      `}</style>
    </div>
  );
}
