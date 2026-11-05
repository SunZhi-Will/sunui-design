"use client";

import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from "react";

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

type Item = {
  key: string;
  label: string;
  icon: string;
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
      ? [{ key: "group", label: labels.group, icon: "👥", onClick: run(onGroup), disabled: false }]
      : []),
    ...(hasGroup ? [{ key: "ungroup", label: labels.ungroup, icon: "💔", onClick: run(onUngroup), disabled: false }] : []),
    ...(onSnapToGrid
      ? [{ key: "layout", label: labels.layout, icon: "🖼️", onClick: run(onSnapToGrid), shortcut: "Ctrl+Shift+L", disabled: false }]
      : []),
    { key: "duplicate", label: labels.duplicate, icon: "📋", onClick: run(onDuplicate), shortcut: "Ctrl+C", disabled: selectedCount === 0 },
    { key: "delete", label: labels.delete, icon: "🗑️", onClick: run(onDelete), shortcut: "Delete", danger: true, disabled: selectedCount === 0 },
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
        "cf-glass-menu z-[100] min-w-[180px] overflow-hidden rounded-xl shadow-2xl",
        fixed ? "fixed" : "absolute",
        className,
      )}
      style={{ left: x, top: y }}
    >
      {selectedCount > 0 && (
        <div className="border-b border-gray-200/50 bg-gray-50/50 px-3 py-2">
          <span className="text-xs font-medium text-gray-600">{labels.selected(selectedCount)}</span>
        </div>
      )}
      <div className="py-1">
        {items.length === 0 ? (
          <div className="px-3 py-2 text-center text-sm text-gray-400">{labels.empty}</div>
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
                  ? "cursor-not-allowed text-gray-400 opacity-50"
                  : item.danger
                    ? "text-red-600 hover:bg-red-50/50 focus-visible:bg-red-50/50"
                    : "text-gray-700 hover:bg-blue-50/50 focus-visible:bg-blue-50/50",
              )}
            >
              <span className="flex items-center gap-2">
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </span>
              {item.shortcut && <span className="text-xs text-gray-400">{item.shortcut}</span>}
            </button>
          ))
        )}
      </div>

      <style>{`
        .cf-glass-menu {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow:
            0 10px 40px rgba(0, 0, 0, 0.15),
            0 2px 8px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }
        @media (prefers-reduced-motion: reduce) {
          .cf-glass-menu button { transition: none; }
        }
      `}</style>
    </div>
  );
}
