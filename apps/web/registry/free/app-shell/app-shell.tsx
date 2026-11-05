"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ComponentType,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

// 移植自 Schedary 的 components/layout（app-shell.tsx、sidebar.tsx、mobile-nav.tsx）。
// 分組、tabLabel 與 sidebar: false 的設定方式對照 ComfyUI 的 nav-config.ts；
// spliteat-web、voxcpm-video-generator 用的也是同一套外殼。
// 桌面：左側分組導覽列，可收合成圖示列（Cmd/Ctrl + B），收合時第二層改成右側浮出選單。
// 手機：頂部列（iOS 大標題做法）＋底部分頁列（只放有 tabLabel 的頁面）＋「更多」抽屜。
// 與原版不同的地方：路由、身分、門市都改成 props；Popover、Tooltip、DropdownMenu、Sheet 改為元件內實作；
// 切換斷點預設用 container query，放在任何寬度的容器裡都會正確切換。

/* ------------------------------------------------------------------ 型別 */

/** 跟 lucide-react 的 icon 相容：直接傳 lucide 元件即可 */
export type AppShellIcon = ComponentType<{ className?: string; strokeWidth?: number }>;

/** 可點擊的頁面（葉節點） */
export interface AppShellNavItem {
  href: string;
  label: string;
  icon: AppShellIcon;
  /** 手機底部分頁列的短標籤；有設定才會出現在底部分頁列 */
  tabLabel?: string;
  /** 數量徽章（例如待審核件數）；收合時改成小圓點 */
  badge?: number;
  /** false：桌面側邊欄不列出，手機分頁列與「更多」照常顯示 */
  sidebar?: false;
}

/** 第二層：本身不是頁面，只負責收納子頁面 */
export interface AppShellNavParent {
  id: string;
  label: string;
  icon: AppShellIcon;
  children: AppShellNavItem[];
}

export type AppShellNavEntry = AppShellNavItem | AppShellNavParent;

export interface AppShellNavGroup {
  label?: string;
  items: AppShellNavEntry[];
}

/** renderLink 收到的屬性；Next.js 可直接 `renderLink={(p) => <Link {...p} />}` */
export type AppShellLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export interface AppShellWorkspace {
  /** 目前所在的門市、專案或組織名稱 */
  label: string;
  icon?: AppShellIcon;
  /** 兩個以上才會變成可切換的選單 */
  options?: { id: string; label: string }[];
  value?: string;
  onChange?: (id: string) => void;
  /** 選單最下方的額外動作，例如「所有門市」 */
  action?: { label: string; icon?: AppShellIcon; onSelect: () => void };
}

export interface AppShellAccount {
  name: string;
  /** 角色或方案，顯示在名字下方 */
  detail?: string;
  /** 只出現在帳號選單裡 */
  email?: string;
  /** 頭像字首，預設取名字第一個字 */
  initial?: string;
  actions?: { label: string; icon?: AppShellIcon; onSelect: () => void }[];
}

export interface AppShellLabels {
  nav?: string;
  more?: string;
  allPages?: string;
  back?: string;
  home?: (brand: string) => string;
  collapse?: string;
  expand?: string;
  accountMenu?: (name: string, detail?: string) => string;
  switchWorkspace?: (current: string) => string;
  workspaceMenu?: string;
  badge?: (label: string, count: number) => string;
  close?: string;
}

export interface AppShellProps {
  groups: AppShellNavGroup[];
  /** 目前路徑，例如 Next.js 的 usePathname() */
  activeHref: string;
  /** 點任何導覽連結時呼叫；用 client 路由的話在這裡 preventDefault 再自己換頁 */
  onNavigate?: (href: string, event: ReactMouseEvent<HTMLAnchorElement>) => void;
  /** 換成框架的 Link，預設是 <a> */
  renderLink?: (props: AppShellLinkProps) => ReactNode;
  brand: { name: string; logo?: ReactNode; href?: string };
  workspace?: AppShellWorkspace;
  account?: AppShellAccount;
  /** 手機頂部列標題；不給就依 activeHref 從導覽裡找 */
  title?: string;
  /** 手機頂部列的返回路徑；null 強制不顯示，不給就自動判斷（子頁面才出現） */
  backHref?: string | null;
  /** 子頁面（例如 /history/12）在頂部列顯示的標題，key 是上層頁面的 href */
  detailTitles?: Record<string, string>;
  /** 手機頂部列右側 */
  mobileAction?: ReactNode;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Cmd/Ctrl + B 切換收合，預設開啟 */
  shortcut?: boolean;
  /** 一開始就展開的第二層 id；含有目前頁面的分區會自動展開 */
  defaultOpenSections?: string[];
  /**
   * container（預設）：依外殼本身的寬度切換，外殼要有固定高度（例如 h-dvh），內容在外殼裡捲動。
   * viewport：依視窗寬度（md）切換，用整頁捲動，底部分頁列固定在視窗底部。
   */
  breakpoint?: "container" | "viewport";
  locale?: string;
  labels?: AppShellLabels;
  className?: string;
  /** 主內容外層，預設置中、最大寬 max-w-6xl */
  contentClassName?: string;
  children?: ReactNode;
}

/* ------------------------------------------------------------------ 文案 */

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, Required<AppShellLabels>> = {
  en: {
    nav: "Main navigation",
    more: "More",
    allPages: "All pages",
    back: "Back",
    home: (b) => `${b} home`,
    collapse: "Collapse sidebar",
    expand: "Expand sidebar",
    accountMenu: (n, d) => `${n}${d ? ` (${d})` : ""}, open account menu`,
    switchWorkspace: (c) => `Current: ${c}, switch`,
    workspaceMenu: "Switch to",
    badge: (l, n) => `${l} (${n} pending)`,
    close: "Close",
  },
  "zh-TW": {
    nav: "主要導覽",
    more: "更多",
    allPages: "所有頁面",
    back: "返回",
    home: (b) => `${b} 首頁`,
    collapse: "收合側邊欄",
    expand: "展開側邊欄",
    accountMenu: (n, d) => `${n}${d ? `（${d}）` : ""}，開啟帳號選單`,
    switchWorkspace: (c) => `目前：${c}，切換`,
    workspaceMenu: "切換到",
    badge: (l, n) => `${l}（${n} 件待處理）`,
    close: "關閉",
  },
  "zh-CN": {
    nav: "主导航",
    more: "更多",
    allPages: "所有页面",
    back: "返回",
    home: (b) => `${b} 首页`,
    collapse: "收起侧边栏",
    expand: "展开侧边栏",
    accountMenu: (n, d) => `${n}${d ? `（${d}）` : ""}，打开账号菜单`,
    switchWorkspace: (c) => `当前：${c}，切换`,
    workspaceMenu: "切换到",
    badge: (l, n) => `${l}（${n} 件待处理）`,
    close: "关闭",
  },
  ja: {
    nav: "メインナビゲーション",
    more: "その他",
    allPages: "すべてのページ",
    back: "戻る",
    home: (b) => `${b} ホーム`,
    collapse: "サイドバーを閉じる",
    expand: "サイドバーを開く",
    accountMenu: (n, d) => `${n}${d ? `（${d}）` : ""}、アカウントメニューを開く`,
    switchWorkspace: (c) => `現在：${c}、切り替え`,
    workspaceMenu: "切り替え先",
    badge: (l, n) => `${l}（未処理 ${n} 件）`,
    close: "閉じる",
  },
};

/* ------------------------------------------------------------------ 工具 */

export function isNavParent(entry: AppShellNavEntry): entry is AppShellNavParent {
  return "children" in entry;
}

/** 攤平成所有可點擊的頁面，供手機頂部標題與底部分頁列使用 */
export function flattenNav(groups: AppShellNavGroup[]): AppShellNavItem[] {
  return groups.flatMap((g) => g.items.flatMap((e) => (isNavParent(e) ? e.children : [e])));
}

export function isActiveHref(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/*
 * 收合動畫（照原版）：側邊欄在兩種狀態下 DOM 完全相同，圖示固定在同一個 x 座標（寬 56px 時剛好置中），
 * 只有寬度與文字透明度在變。文字收起時立刻淡出，展開時等寬度走了一段再淡入，避免被擠壓的文字閃一下。
 */
const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";
const FADE =
  "transition-opacity duration-200 delay-100 group-data-[collapsed=true]/sidebar:pointer-events-none group-data-[collapsed=true]/sidebar:opacity-0 group-data-[collapsed=true]/sidebar:duration-100 group-data-[collapsed=true]/sidebar:delay-0";

const ROW_BASE =
  "group/row relative flex w-full items-center gap-2.5 overflow-hidden rounded-md px-2 text-left text-sm whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50";
const ROW_ACTIVE = "bg-background font-medium text-foreground shadow-[inset_0_0_0_1px_var(--border)]";
const ROW_IDLE = "text-muted-foreground hover:bg-muted hover:text-foreground";
const SIDEBAR_BG = "bg-[color-mix(in_oklab,var(--muted)_45%,var(--background))]";

// Tailwind 要看到完整的 class 字串才會產生，兩種斷點各寫一份
const BP = {
  container: {
    root: "@container/shell relative flex h-full min-h-0 overflow-hidden",
    desktop: "relative hidden h-full shrink-0 @3xl/shell:block",
    mobile: "@3xl/shell:hidden",
    column: "flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain",
    main: "min-w-0 flex-1 px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] @3xl/shell:px-10 @3xl/shell:py-10",
    layer: "absolute",
  },
  viewport: {
    root: "relative flex min-h-screen",
    desktop: "sticky top-0 hidden h-screen shrink-0 self-start md:block",
    mobile: "md:hidden",
    column: "flex min-h-screen min-w-0 flex-1 flex-col",
    main: "min-w-0 flex-1 px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] md:px-10 md:py-10",
    layer: "fixed",
  },
} as const;

type Rect = { top: number; left: number; right: number; bottom: number };

interface ShellContext {
  activeHref: string;
  t: Required<AppShellLabels>;
  link: (props: AppShellLinkProps) => ReactNode;
  navigate: (href: string, e: ReactMouseEvent<HTMLAnchorElement>) => void;
  rootRef: RefObject<HTMLDivElement | null>;
  /** 把元素位置換算成外殼內的座標（外殼被 transform 縮放時也對） */
  measure: (el: HTMLElement) => Rect;
}

const Ctx = createContext<ShellContext | null>(null);
function useShell() {
  const c = useContext(Ctx);
  if (!c) throw new Error("AppShell parts must be rendered inside <AppShell>");
  return c;
}

const defaultLink = ({ children, ...rest }: AppShellLinkProps) => <a {...rest}>{children}</a>;

/* ------------------------------------------------------------------ 圖示（形狀照 lucide） */

function Svg({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {children}
    </svg>
  );
}
const ChevronRight = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="m9 18 6-6-6-6" />
  </Svg>
);
const ChevronLeft = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="m15 18-6-6 6-6" />
  </Svg>
);
const ChevronsUpDown = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="m7 15 5 5 5-5" />
    <path d="m7 9 5-5 5 5" />
  </Svg>
);
const PanelLeftClose = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M9 3v18" />
    <path d="m16 15-3-3 3-3" />
  </Svg>
);
const PanelLeftOpen = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M9 3v18" />
    <path d="m14 9 3 3-3 3" />
  </Svg>
);
const Ellipsis = ({ className, strokeWidth }: { className?: string; strokeWidth?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth ?? 2} strokeLinecap="round" aria-hidden className={className}>
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);
const Check = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M20 6 9 17l-5-5" />
  </Svg>
);

/* ------------------------------------------------------------------ 浮層 */

/** 收合時的 tooltip：只有一個，畫在外殼裡，不受側邊欄 overflow 裁切 */
interface TipState {
  label: string;
  top: number;
  left: number;
}

const TipCtx = createContext<{ show: (el: HTMLElement, label: string) => void; hide: () => void } | null>(null);

interface MenuItemDef {
  key: string;
  label: ReactNode;
  icon?: AppShellIcon;
  checked?: boolean;
  separatorBefore?: boolean;
  onSelect: () => void;
}

type Placement = "below" | "above" | "right" | "right-end";

/** 下拉選單：方向鍵移動、Esc 關閉並把焦點還給按鈕、點外面關閉 */
function FloatingMenu({
  anchor,
  open,
  onClose,
  placement,
  heading,
  items,
}: {
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  placement: Placement;
  heading?: ReactNode;
  items: MenuItemDef[];
}) {
  const { measure, rootRef } = useShell();
  const reduce = useReducedMotion() ?? false;
  const menuRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchor || !rootRef.current) return;
    const a = measure(anchor);
    const h = rootRef.current.offsetHeight;
    if (placement === "below") setStyle({ top: a.bottom + 6, left: a.left, minWidth: Math.max(208, a.right - a.left) });
    else if (placement === "above") setStyle({ bottom: h - a.top + 6, left: a.left, minWidth: Math.max(208, a.right - a.left) });
    else if (placement === "right") setStyle({ top: a.top, left: a.right + 10, minWidth: 208 });
    else setStyle({ bottom: h - a.bottom, left: a.right + 10, minWidth: 208 });
  }, [open, anchor, placement, measure, rootRef]);

  useEffect(() => {
    if (!open) return;
    const first = menuRef.current?.querySelector<HTMLElement>("[role^=menuitem]");
    first?.focus();
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || anchor?.contains(target)) return;
      onClose();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, anchor, onClose]);

  const onKeyDown = (e: ReactKeyboardEvent) => {
    const list = Array.from(menuRef.current?.querySelectorAll<HTMLElement>("[role^=menuitem]") ?? []);
    const i = list.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      list[(i + 1) % list.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      list[(i - 1 + list.length) % list.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      list[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      list[list.length - 1]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onClose();
      anchor?.focus();
    } else if (e.key === "Tab") {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && style ? (
        <motion.div
          ref={menuRef}
          role="menu"
          onKeyDown={onKeyDown}
          initial={reduce ? false : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          style={style}
          className="absolute z-[60] flex flex-col gap-0.5 rounded-lg border border-border bg-card p-1 text-sm text-foreground shadow-lg"
        >
          {heading ? <div className="px-2 pt-1 pb-1.5 text-xs text-muted-foreground">{heading}</div> : null}
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.key} className="contents">
                {item.separatorBefore ? <div role="separator" className="my-1 h-px bg-border" /> : null}
                <button
                  type="button"
                  role={item.checked === undefined ? "menuitem" : "menuitemradio"}
                  aria-checked={item.checked}
                  tabIndex={-1}
                  onClick={() => {
                    onClose();
                    item.onSelect();
                  }}
                  className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left outline-none hover:bg-muted focus-visible:bg-muted"
                >
                  {Icon ? <Icon className="size-4 shrink-0 text-muted-foreground" /> : null}
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.checked ? <Check className="size-4 shrink-0" /> : null}
                </button>
              </div>
            );
          })}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ 導覽列 */

function RowIcon({ icon: Icon, active, dot }: { icon: AppShellIcon; active: boolean; dot: boolean }) {
  return (
    <span className="relative flex size-4 shrink-0 items-center justify-center">
      <Icon
        className={cn("size-4", active ? "text-foreground" : "text-muted-foreground group-hover/row:text-foreground")}
      />
      <span
        aria-hidden
        className={cn(
          "absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-primary opacity-0 ring-2 ring-background transition-opacity duration-200",
          dot && "opacity-100",
        )}
      />
    </span>
  );
}

function CountBadge({ count }: { count?: number | null }) {
  if (!count) return null;
  return (
    <span
      className={cn(
        "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-medium text-primary-foreground tabular-nums",
        FADE,
      )}
    >
      {count}
    </span>
  );
}

/** 收合時滑過或聚焦才顯示 tooltip；DOM 在兩種狀態下一致 */
function TipTarget({ collapsed, label, children }: { collapsed: boolean; label: string; children: ReactNode }) {
  const tip = useContext(TipCtx);
  const ref = useRef<HTMLDivElement>(null);
  const show = () => {
    if (collapsed && ref.current) tip?.show(ref.current, label);
  };
  return (
    <div
      ref={ref}
      onPointerEnter={show}
      onPointerLeave={() => tip?.hide()}
      onFocusCapture={show}
      onBlurCapture={() => tip?.hide()}
    >
      {children}
    </div>
  );
}

function NavLinkRow({
  item,
  collapsed,
  size,
  onNavigate,
}: {
  item: AppShellNavItem;
  collapsed: boolean;
  size: "sm" | "lg";
  onNavigate?: () => void;
}) {
  const { activeHref, link, navigate, t } = useShell();
  const active = isActiveHref(activeHref, item.href);
  const badge = item.badge && item.badge > 0 ? item.badge : null;
  return (
    <TipTarget collapsed={collapsed} label={badge ? t.badge(item.label, badge) : item.label}>
      {link({
        href: item.href,
        onClick: (e) => {
          navigate(item.href, e);
          onNavigate?.();
        },
        "aria-current": active ? "page" : undefined,
        "aria-label": collapsed ? (badge ? t.badge(item.label, badge) : item.label) : undefined,
        className: cn(ROW_BASE, size === "lg" ? "h-10" : "h-8", active ? ROW_ACTIVE : ROW_IDLE),
        children: (
          <>
            <RowIcon icon={item.icon} active={active} dot={collapsed && badge !== null} />
            <span className={FADE}>{item.label}</span>
            <CountBadge count={badge} />
          </>
        ),
      })}
    </TipTarget>
  );
}

/** 子頁面：不放圖示，文字與父項目的文字對齊，左側一條細線表示層級 */
function NavChildLink({
  item,
  size,
  onNavigate,
}: {
  item: AppShellNavItem;
  size: "sm" | "lg";
  onNavigate?: () => void;
}) {
  const { activeHref, link, navigate } = useShell();
  const active = isActiveHref(activeHref, item.href);
  return link({
    href: item.href,
    onClick: (e) => {
      navigate(item.href, e);
      onNavigate?.();
    },
    "aria-current": active ? "page" : undefined,
    className: cn(ROW_BASE, size === "lg" ? "h-10" : "h-8", active ? ROW_ACTIVE : ROW_IDLE),
    children: (
      <>
        <span>{item.label}</span>
        <CountBadge count={item.badge} />
      </>
    ),
  });
}

function NavParentRow({
  entry,
  collapsed,
  size,
  open,
  setOpen,
  onNavigate,
}: {
  entry: AppShellNavParent;
  collapsed: boolean;
  size: "sm" | "lg";
  open: boolean;
  setOpen: (id: string, open: boolean) => void;
  onNavigate?: () => void;
}) {
  const { activeHref, measure, t } = useShell();
  const expanded = open && !collapsed;
  const childActive = entry.children.some((c) => isActiveHref(activeHref, c.href));
  const childBadge = entry.children.reduce((sum, c) => sum + (c.badge && c.badge > 0 ? c.badge : 0), 0) || null;

  // 收合狀態：滑過父項目圖示時，在右側浮出子選單（離開 120ms 後才收，讓滑鼠來得及移過去）
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [flyout, setFlyout] = useState<{ top: number; left: number } | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const openFlyout = () => {
    window.clearTimeout(closeTimer.current);
    if (buttonRef.current) {
      const r = measure(buttonRef.current);
      setFlyout({ top: r.top - 4, left: r.right + 10 });
    }
  };
  const closeFlyoutSoon = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setFlyout(null), 120);
  };
  useEffect(() => {
    if (!collapsed) setFlyout(null);
  }, [collapsed]);
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const contentId = `shell-section-${entry.id}`;
  // 收合、或分區收起時看不到子頁面，改由父項目顯示選取狀態
  const showActive = childActive && !expanded;

  return (
    <div className="flex flex-col">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={collapsed ? flyout !== null : open}
        aria-controls={collapsed ? undefined : contentId}
        aria-label={collapsed ? (childBadge ? t.badge(entry.label, childBadge) : entry.label) : undefined}
        onClick={() => (collapsed ? openFlyout() : setOpen(entry.id, !open))}
        onPointerEnter={collapsed ? openFlyout : undefined}
        onPointerLeave={collapsed ? closeFlyoutSoon : undefined}
        onKeyDown={(e) => {
          if (e.key === "Escape" && flyout) {
            e.stopPropagation();
            setFlyout(null);
          }
        }}
        className={cn(
          ROW_BASE,
          size === "lg" ? "h-10" : "h-8",
          showActive ? ROW_ACTIVE : ROW_IDLE,
          childActive && "text-foreground",
        )}
      >
        <RowIcon icon={entry.icon} active={childActive} dot={collapsed && childBadge !== null} />
        <span className={FADE}>{entry.label}</span>
        {open ? null : <CountBadge count={childBadge} />}
        {/* 淡出與旋轉分在兩層，避免兩個 transition 互相覆蓋 */}
        <span aria-hidden className={cn("flex shrink-0", (open || !childBadge) && "ml-auto", FADE)}>
          <ChevronRight
            className={cn(
              "size-3.5 text-muted-foreground transition-transform duration-300",
              EASE,
              open ? "rotate-90" : "rotate-0",
            )}
          />
        </span>
      </button>

      {collapsed && flyout ? (
        <FlyoutLayer
          entry={entry}
          position={flyout}
          onEnter={openFlyout}
          onLeave={closeFlyoutSoon}
          onDone={() => {
            setFlyout(null);
            onNavigate?.();
          }}
        />
      ) : null}

      {/* 高度用 grid-template-rows 0fr ↔ 1fr 做動畫，不需要量測高度 */}
      <div
        id={contentId}
        inert={!expanded}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 motion-reduce:transition-none",
          EASE,
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <ul className="relative flex flex-col gap-0.5 pt-0.5 pl-[1.625rem]">
            <span aria-hidden className="absolute top-1.5 bottom-1 left-4 w-px bg-border" />
            {entry.children.map((child) => (
              <li key={child.href}>
                <NavChildLink item={child} size={size} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** 收合時第二層的浮出選單；畫在外殼的浮層裡，不受側邊欄 overflow 裁切 */
function FlyoutLayer({
  entry,
  position,
  onEnter,
  onLeave,
  onDone,
}: {
  entry: AppShellNavParent;
  position: { top: number; left: number };
  onEnter: () => void;
  onLeave: () => void;
  onDone: () => void;
}) {
  const host = useContext(LayerCtx);
  if (!host) return null;
  return host.portal(
    <div
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      style={position}
      className="absolute z-[60] flex w-48 flex-col gap-0.5 rounded-lg border border-border bg-card p-1 shadow-lg"
    >
      <p className="px-2 pt-1 pb-1.5 text-xs font-medium text-muted-foreground">{entry.label}</p>
      {entry.children.map((child) => (
        <NavChildLink key={child.href} item={child} size="sm" onNavigate={onDone} />
      ))}
    </div>,
  );
}

/** 浮層宿主：浮出選單從各列 render，但要畫在外殼最上層 */
const LayerCtx = createContext<{ portal: (node: ReactNode) => ReactNode } | null>(null);

function useSections(groups: AppShellNavGroup[], activeHref: string, defaults?: string[]) {
  const [open, setOpenState] = useState<Set<string>>(() => new Set(defaults ?? []));
  const setOpen = useCallback((id: string, value: boolean) => {
    setOpenState((prev) => {
      const next = new Set(prev);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);
  // 進入某個子頁面時自動展開它所在的分區；只在換頁時檢查，使用者之後手動收起就尊重他的選擇
  useEffect(() => {
    for (const g of groups)
      for (const e of g.items)
        if (isNavParent(e) && e.children.some((c) => isActiveHref(activeHref, c.href))) setOpen(e.id, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHref]);
  return { isOpen: (id: string) => open.has(id), setOpen };
}

function NavList({
  groups,
  collapsed,
  size,
  sections,
  inSidebar,
  onNavigate,
}: {
  groups: AppShellNavGroup[];
  collapsed: boolean;
  size: "sm" | "lg";
  sections: ReturnType<typeof useSections>;
  inSidebar: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useShell();
  return (
    <nav className="flex flex-col gap-5" aria-label={t.nav}>
      {groups.map((group, index) => {
        const entries = inSidebar ? group.items.filter((e) => isNavParent(e) || e.sidebar !== false) : group.items;
        if (!entries.length) return null;
        return (
          <div key={group.label ?? index} className="flex flex-col gap-0.5">
            {group.label ? (
              // 固定高度：文字標題與收合時的分隔線疊在同一格交叉淡化，項目不會上下跳
              <div className="relative mb-0.5 h-6">
                <p
                  className={cn(
                    "absolute inset-0 flex items-center px-2 text-xs font-medium whitespace-nowrap text-muted-foreground",
                    FADE,
                  )}
                >
                  {group.label}
                </p>
                <div
                  aria-hidden
                  className={cn(
                    "absolute inset-x-2 top-1/2 h-px bg-border opacity-0 transition-opacity duration-200",
                    collapsed && "opacity-100",
                  )}
                />
              </div>
            ) : null}
            {entries.map((entry) =>
              isNavParent(entry) ? (
                <NavParentRow
                  key={entry.id}
                  entry={entry}
                  collapsed={collapsed}
                  size={size}
                  open={sections.isOpen(entry.id)}
                  setOpen={sections.setOpen}
                  onNavigate={onNavigate}
                />
              ) : (
                <NavLinkRow key={entry.href} item={entry} collapsed={collapsed} size={size} onNavigate={onNavigate} />
              ),
            )}
          </div>
        );
      })}
    </nav>
  );
}

/* ------------------------------------------------------------------ 門市切換與身分 */

/** 只有一個選項時只顯示名稱；兩個以上（或有額外動作）才是可切換的選單 */
function WorkspaceSwitcher({
  workspace,
  collapsed,
  size,
  onSwitched,
}: {
  workspace: AppShellWorkspace;
  collapsed: boolean;
  size: "sm" | "lg";
  onSwitched?: () => void;
}) {
  const { t } = useShell();
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const Icon = workspace.icon;
  const rowClass = cn(
    "flex w-full items-center gap-2.5 overflow-hidden rounded-md border border-border bg-background px-2 text-left whitespace-nowrap",
    size === "lg" ? "h-10" : "h-8",
  );
  const label = (
    <>
      <span className="flex size-4 shrink-0 items-center justify-center">
        {Icon ? <Icon className="size-4 text-muted-foreground" /> : <span className="size-2 rounded-full bg-muted-foreground/60" />}
      </span>
      <span className={cn("min-w-0 flex-1 truncate text-sm font-medium text-foreground", FADE)}>{workspace.label}</span>
    </>
  );

  const options = workspace.options ?? [];
  if (options.length <= 1 && !workspace.action) {
    return (
      <TipTarget collapsed={collapsed} label={workspace.label}>
        <div className={rowClass} title={workspace.label}>
          {label}
        </div>
      </TipTarget>
    );
  }

  const items: MenuItemDef[] = options.map((o) => ({
    key: o.id,
    label: o.label,
    checked: o.id === workspace.value,
    onSelect: () => {
      if (o.id !== workspace.value) workspace.onChange?.(o.id);
      onSwitched?.();
    },
  }));
  if (workspace.action) {
    const a = workspace.action;
    items.push({
      key: "__action",
      label: a.label,
      icon: a.icon,
      separatorBefore: items.length > 0,
      onSelect: () => {
        a.onSelect();
        onSwitched?.();
      },
    });
  }

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.switchWorkspace(workspace.label)}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          rowClass,
          "outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50",
          open && "bg-muted",
        )}
      >
        {label}
        <ChevronsUpDown className={cn("size-3.5 shrink-0 text-muted-foreground", FADE)} />
      </button>
      <LayerOut>
        <FloatingMenu
          anchor={ref.current}
          open={open}
          onClose={close}
          placement={collapsed ? "right" : "below"}
          heading={t.workspaceMenu}
          items={items}
        />
      </LayerOut>
    </>
  );
}

function initialOf(account: AppShellAccount) {
  return account.initial ?? Array.from(account.name.trim())[0]?.toUpperCase() ?? "?";
}

function Avatar({ account, ring }: { account: AppShellAccount; ring?: boolean }) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground",
        ring && "ring-1 ring-border",
      )}
    >
      {initialOf(account)}
    </span>
  );
}

/** 桌面側邊欄底部：整列是一個選單按鈕，兩種狀態下位置都不變 */
function SidebarAccount({ account, collapsed }: { account: AppShellAccount; collapsed: boolean }) {
  const { t } = useShell();
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const items: MenuItemDef[] = (account.actions ?? []).map((a, i) => ({
    key: `${i}-${a.label}`,
    label: a.label,
    icon: a.icon,
    onSelect: a.onSelect,
  }));
  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.accountMenu(account.name, account.detail)}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-10 w-full items-center gap-2.5 overflow-hidden rounded-md px-0.5 text-left whitespace-nowrap outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50",
          open && "bg-muted",
        )}
      >
        <Avatar account={account} ring />
        <span className={cn("min-w-0 flex-1 leading-tight", FADE)}>
          <span className="block truncate text-sm font-medium text-foreground">{account.name}</span>
          {account.detail ? <span className="block truncate text-xs text-muted-foreground">{account.detail}</span> : null}
        </span>
        <ChevronsUpDown className={cn("mr-1.5 size-3.5 shrink-0 text-muted-foreground", FADE)} />
      </button>
      <LayerOut>
        <FloatingMenu
          anchor={ref.current}
          open={open}
          onClose={close}
          placement={collapsed ? "right-end" : "above"}
          heading={
            <>
              <p className="truncate text-sm font-medium text-foreground">{account.name}</p>
              {account.detail ? <p className="truncate">{account.detail}</p> : null}
              {account.email ? <p className="truncate">{account.email}</p> : null}
            </>
          }
          items={items}
        />
      </LayerOut>
    </>
  );
}

/** 手機「更多」抽屜底部的身分列 */
function SheetAccount({ account, onDone }: { account: AppShellAccount; onDone: () => void }) {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <Avatar account={account} />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-medium text-foreground">{account.name}</p>
        {account.detail ? <p className="truncate text-xs text-muted-foreground">{account.detail}</p> : null}
      </div>
      {(account.actions ?? []).map((a) => {
        const Icon = a.icon;
        return (
          <button
            key={a.label}
            type="button"
            aria-label={Icon ? a.label : undefined}
            title={Icon ? a.label : undefined}
            onClick={() => {
              onDone();
              a.onSelect();
            }}
            className="flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {Icon ? <Icon className="size-4" /> : a.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ 浮層宿主 */

/** 把子元素送到外殼的浮層（跟 createPortal 一樣，但目標是外殼裡的節點，外殼被縮放時位置也對） */
function LayerOut({ children }: { children: ReactNode }) {
  const host = useContext(LayerCtx);
  return host ? <>{host.portal(children)}</> : null;
}

/* ------------------------------------------------------------------ 桌面側邊欄 */

function Sidebar({
  groups,
  brand,
  workspace,
  account,
  collapsed,
  toggle,
  sections,
  shortcut,
  bp,
}: {
  groups: AppShellNavGroup[];
  brand: AppShellProps["brand"];
  workspace?: AppShellWorkspace;
  account?: AppShellAccount;
  collapsed: boolean;
  toggle: () => void;
  sections: ReturnType<typeof useSections>;
  shortcut: boolean;
  bp: (typeof BP)[keyof typeof BP];
}) {
  const { t, link, navigate } = useShell();
  // 首次載入時不要播收合動畫（收合狀態可能是剛從儲存讀回來的）
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // 與常見工具一致：Cmd/Ctrl + B 切換側邊欄
  useEffect(() => {
    if (!shortcut) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "b" && (e.metaKey || e.ctrlKey) && !e.altKey) {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle, shortcut]);

  const logo = brand.logo ?? <span className="text-xs font-semibold">{Array.from(brand.name)[0]}</span>;

  return (
    // 外層負責佔位；展開按鈕掛在外層右緣之外，落在右側內容區的左上角
    <div className={cn(bp.desktop, !ready && "[&,&_*]:transition-none!")}>
      <aside
        data-collapsed={collapsed ? "true" : "false"}
        className={cn(
          "group/sidebar flex h-full flex-col overflow-hidden border-r border-border px-3 py-5 transition-[width] duration-300 motion-reduce:transition-none",
          SIDEBAR_BG,
          EASE,
          collapsed ? "w-14" : "w-56",
        )}
      >
        {/* 品牌列：logo 固定在與導覽圖示同一條中線上，收合按鈕在右側 */}
        <div className="flex h-8 items-center gap-2.5">
          {link({
            href: brand.href ?? "/",
            onClick: (e) => navigate(brand.href ?? "/", e),
            "aria-label": t.home(brand.name),
            className:
              "ml-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-foreground text-background outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            children: logo,
          })}
          <span className={cn("min-w-0 flex-1 truncate text-sm font-semibold whitespace-nowrap text-foreground", FADE)}>
            {brand.name}
          </span>
          <button
            type="button"
            onClick={toggle}
            aria-label={t.collapse}
            title={shortcut ? `${t.collapse} (⌘B)` : t.collapse}
            aria-expanded
            tabIndex={collapsed ? -1 : undefined}
            aria-hidden={collapsed || undefined}
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
              FADE,
            )}
          >
            <PanelLeftClose className="size-4" />
          </button>
        </div>

        {workspace ? (
          <div className="mt-4">
            <WorkspaceSwitcher workspace={workspace} collapsed={collapsed} size="sm" />
          </div>
        ) : null}

        <div className="-mx-3 mt-4 flex-1 overflow-x-hidden overflow-y-auto px-3">
          <NavList groups={groups} collapsed={collapsed} size="sm" sections={sections} inSidebar />
        </div>

        {account ? (
          <div className="border-t border-border pt-3">
            <SidebarAccount account={account} collapsed={collapsed} />
          </div>
        ) : null}
      </aside>

      {/* 展開按鈕：收合後出現在內容區左上角，與收合按鈕同一高度；等寬度縮得差不多才淡入，展開時立刻淡出 */}
      <button
        type="button"
        onClick={toggle}
        aria-label={t.expand}
        title={shortcut ? `${t.expand} (⌘B)` : t.expand}
        aria-expanded={false}
        tabIndex={collapsed ? undefined : -1}
        aria-hidden={collapsed ? undefined : true}
        className={cn(
          "absolute top-[1.375rem] left-full z-30 ml-2 flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none transition-opacity hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
          collapsed ? "opacity-100 delay-150 duration-200" : "pointer-events-none opacity-0 delay-0 duration-100",
        )}
      >
        <PanelLeftOpen className="size-4" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ 手機頂部列與分頁列 */

/**
 * 手機頂部列，採 iOS 大標題的做法：頁面頂端時由內容區的大標題負責，往下捲動後標題才淡入頂部列並出現分隔線，
 * 避免同一個標題在畫面上重複出現。子頁面左側固定顯示返回按鈕。
 */
function MobileTopBar({
  title,
  backHref,
  brand,
  scrolled,
  action,
  bp,
}: {
  title: string;
  backHref: string | null;
  brand: AppShellProps["brand"];
  scrolled: boolean;
  action?: ReactNode;
  bp: (typeof BP)[keyof typeof BP];
}) {
  const { t, link, navigate } = useShell();
  const logo = brand.logo ?? <span className="text-[11px] font-semibold">{Array.from(brand.name)[0]}</span>;
  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur transition-colors",
        bp.mobile,
        scrolled ? "border-border" : "border-transparent",
      )}
    >
      <div className="grid h-11 grid-cols-[4rem_1fr_4rem] items-center px-2">
        <div className="flex items-center">
          {backHref
            ? link({
                href: backHref,
                onClick: (e) => navigate(backHref, e),
                "aria-label": t.back,
                className: "-ml-1 flex h-9 items-center gap-0.5 rounded-md pr-2 text-sm text-foreground outline-none active:opacity-60 focus-visible:ring-2 focus-visible:ring-ring/50",
                children: (
                  <>
                    <ChevronLeft className="size-5" />
                    {t.back}
                  </>
                ),
              })
            : link({
                href: brand.href ?? "/",
                onClick: (e) => navigate(brand.href ?? "/", e),
                "aria-label": t.home(brand.name),
                className:
                  "ml-1 flex size-7 items-center justify-center rounded-md bg-foreground text-background outline-none active:opacity-70 focus-visible:ring-2 focus-visible:ring-ring/50",
                children: logo,
              })}
        </div>
        <p
          aria-hidden={!(scrolled || backHref)}
          className={cn(
            "truncate text-center text-[15px] font-semibold text-foreground transition-opacity duration-200",
            scrolled || backHref ? "opacity-100" : "opacity-0",
          )}
        >
          {title}
        </p>
        <div className="flex items-center justify-end">{action}</div>
      </div>
    </header>
  );
}

/** 手機底部分頁列：常用頁面放在拇指容易點到的位置，其餘頁面與身分切換收進「更多」抽屜 */
function MobileTabBar({
  items,
  showMore,
  moreActive,
  moreOpen,
  onMore,
  moreRef,
  bp,
  layer,
}: {
  items: AppShellNavItem[];
  showMore: boolean;
  moreActive: boolean;
  moreOpen: boolean;
  onMore: () => void;
  moreRef: RefObject<HTMLButtonElement | null>;
  bp: (typeof BP)[keyof typeof BP];
  layer: string;
}) {
  const { activeHref, link, navigate, t } = useShell();
  return (
    <nav
      aria-label={t.nav}
      className={cn(
        layer,
        "inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur",
        bp.mobile,
      )}
    >
      <ul className="flex h-14 items-stretch">
        {items.map((item) => {
          const active = isActiveHref(activeHref, item.href);
          const Icon = item.icon;
          const badge = item.badge && item.badge > 0 ? item.badge : null;
          return (
            <li key={item.href} className="min-w-0 flex-1">
              {link({
                href: item.href,
                onClick: (e) => navigate(item.href, e),
                "aria-current": active ? "page" : undefined,
                "aria-label": badge ? t.badge(item.tabLabel ?? item.label, badge) : undefined,
                className: cn(
                  "relative flex h-full flex-col items-center justify-center gap-0.5 text-xs outline-none transition-colors active:opacity-60 focus-visible:bg-muted",
                  active ? "font-medium text-foreground" : "text-muted-foreground",
                ),
                children: (
                  <>
                    <span className="relative">
                      <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
                      {badge ? (
                        <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground tabular-nums">
                          {badge}
                        </span>
                      ) : null}
                    </span>
                    <span className="max-w-full truncate px-0.5">{item.tabLabel}</span>
                  </>
                ),
              })}
            </li>
          );
        })}
        {showMore ? (
          <li className="min-w-0 flex-1">
            <button
              ref={moreRef}
              type="button"
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              onClick={onMore}
              className={cn(
                "flex h-full w-full flex-col items-center justify-center gap-0.5 text-xs outline-none transition-colors active:opacity-60 focus-visible:bg-muted",
                moreActive ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              <Ellipsis className="size-5" strokeWidth={moreActive ? 2.2 : 1.8} />
              {t.more}
            </button>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}

/** 「更多」底部抽屜：所有頁面、門市切換、身分列；Esc、點遮罩或往下拖都能關閉 */
function MoreSheet({
  open,
  onClose,
  groups,
  workspace,
  account,
  sections,
  layer,
}: {
  open: boolean;
  onClose: () => void;
  groups: AppShellNavGroup[];
  workspace?: AppShellWorkspace;
  account?: AppShellAccount;
  sections: ReturnType<typeof useSections>;
  layer: string;
}) {
  const { t } = useShell();
  const reduce = useReducedMotion() ?? false;
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useRef(`shell-more-${Math.random().toString(36).slice(2, 8)}`).current;

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    // 焦點留在抽屜裡
    if (e.key === "Tab" && panelRef.current) {
      const list = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>("a[href],button:not([disabled]),[tabindex]:not([tabindex='-1'])"),
      ).filter((el) => !el.closest("[inert]"));
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <div className={cn(layer, "inset-0 z-50")}>
          <motion.div
            aria-hidden
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            className="absolute inset-0 bg-black/40"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            onKeyDown={onKeyDown}
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 40 }}
            drag={reduce ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 || info.velocity.y > 500) onClose();
            }}
            className="absolute inset-x-0 bottom-0 flex max-h-[85%] flex-col rounded-t-2xl border-t border-border bg-background px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl outline-none"
          >
            <div aria-hidden className="mx-auto mb-2 h-1 w-9 shrink-0 rounded-full bg-muted" />
            <div className="flex items-center justify-between px-2 pb-2">
              <h2 id={titleId} className="text-sm font-semibold text-foreground">
                {t.allPages}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-2 py-1 text-sm text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {t.close}
              </button>
            </div>
            {workspace ? (
              <div className="px-2 pb-3">
                <WorkspaceSwitcher workspace={workspace} collapsed={false} size="lg" onSwitched={onClose} />
              </div>
            ) : null}
            <div className="min-h-0 overflow-y-auto" onPointerDownCapture={(e) => e.stopPropagation()}>
              <NavList groups={groups} collapsed={false} size="lg" sections={sections} inSidebar={false} onNavigate={onClose} />
            </div>
            {account ? (
              <div className="mt-4 border-t border-border pt-4">
                <SheetAccount account={account} onDone={onClose} />
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ 外殼 */

function usePageTitle(
  groups: AppShellNavGroup[],
  activeHref: string,
  fallback: string,
  detailTitles?: Record<string, string>,
): { title: string; backHref: string | null } {
  const items = flattenNav(groups);
  const exact = items.find((item) => item.href === activeHref);
  if (exact) return { title: exact.label, backHref: null };
  const parent = items
    .filter((item) => item.href !== "/" && isActiveHref(activeHref, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
  if (parent) return { title: detailTitles?.[parent.href] ?? parent.label, backHref: parent.href };
  return { title: fallback, backHref: null };
}

export function AppShell({
  groups,
  activeHref,
  onNavigate,
  renderLink,
  brand,
  workspace,
  account,
  title,
  backHref,
  detailTitles,
  mobileAction,
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  shortcut = true,
  defaultOpenSections,
  breakpoint = "container",
  locale,
  labels,
  className,
  contentClassName,
  children,
}: AppShellProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels } as Required<AppShellLabels>;
  const bp = BP[breakpoint];
  const rootRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);

  // 收合：受控或非受控
  const [innerCollapsed, setInnerCollapsed] = useState(defaultCollapsed);
  const collapsed = collapsedProp ?? innerCollapsed;
  const collapsedRef = useRef(collapsed);
  collapsedRef.current = collapsed;
  const toggle = useCallback(() => {
    const next = !collapsedRef.current;
    if (collapsedProp === undefined) setInnerCollapsed(next);
    onCollapsedChange?.(next);
  }, [collapsedProp, onCollapsedChange]);

  const sections = useSections(groups, activeHref, defaultOpenSections);
  const auto = usePageTitle(groups, activeHref, brand.name, detailTitles);
  const pageTitle = title ?? auto.title;
  const pageBack = backHref === undefined ? auto.backHref : backHref;

  // 頂部列標題：捲過 44px 才淡入
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const target: HTMLElement | Window | null = breakpoint === "container" ? columnRef.current : window;
    if (!target) return;
    const read = () =>
      setScrolled((breakpoint === "container" ? (columnRef.current?.scrollTop ?? 0) : window.scrollY) > 44);
    read();
    target.addEventListener("scroll", read, { passive: true });
    return () => target.removeEventListener("scroll", read);
  }, [breakpoint]);

  const [moreOpen, setMoreOpen] = useState(false);
  const closeMore = useCallback(() => {
    setMoreOpen(false);
    moreRef.current?.focus();
  }, []);
  // 換頁就收起抽屜
  useEffect(() => setMoreOpen(false), [activeHref]);

  const all = flattenNav(groups);
  const tabs = all.filter((item) => item.tabLabel);
  const moreActive = all.some((item) => !item.tabLabel && isActiveHref(activeHref, item.href));
  const showMore = all.length > tabs.length || Boolean(workspace) || Boolean(account);

  const measure = useCallback((el: HTMLElement): Rect => {
    const root = rootRef.current;
    if (!root) return { top: 0, left: 0, right: 0, bottom: 0 };
    const r = root.getBoundingClientRect();
    const a = el.getBoundingClientRect();
    const s = r.width / (root.offsetWidth || 1) || 1;
    return {
      top: (a.top - r.top) / s,
      left: (a.left - r.left) / s,
      right: (a.right - r.left) / s,
      bottom: (a.bottom - r.top) / s,
    };
  }, []);

  const navigate = useCallback(
    (href: string, e: ReactMouseEvent<HTMLAnchorElement>) => onNavigate?.(href, e),
    [onNavigate],
  );

  // 浮層宿主：tooltip、浮出選單、下拉選單都畫在這裡
  const [layerEl, setLayerEl] = useState<HTMLDivElement | null>(null);
  const portal = useCallback(
    (node: ReactNode) => (layerEl ? <LayerPortal target={layerEl}>{node}</LayerPortal> : null),
    [layerEl],
  );

  const [tip, setTip] = useState<TipState | null>(null);
  const tipApi = useCallback(
    () => ({
      show: (el: HTMLElement, label: string) => {
        const r = measure(el);
        setTip({ label, top: (r.top + r.bottom) / 2, left: r.right + 10 });
      },
      hide: () => setTip(null),
    }),
    [measure],
  );
  const tipValue = useStableValue(tipApi);
  useEffect(() => {
    if (!collapsed) setTip(null);
  }, [collapsed]);

  const ctx: ShellContext = {
    activeHref,
    t,
    link: renderLink ?? defaultLink,
    navigate,
    rootRef,
    measure,
  };

  return (
    <Ctx.Provider value={ctx}>
      <LayerCtx.Provider value={{ portal }}>
        <TipCtx.Provider value={tipValue}>
          <div ref={rootRef} className={cn(bp.root, "bg-background text-foreground", className)}>
            <Sidebar
              groups={groups}
              brand={brand}
              workspace={workspace}
              account={account}
              collapsed={collapsed}
              toggle={toggle}
              sections={sections}
              shortcut={shortcut}
              bp={bp}
            />
            <div ref={columnRef} className={bp.column}>
              <MobileTopBar
                title={pageTitle}
                backHref={pageBack}
                brand={brand}
                scrolled={scrolled}
                action={mobileAction}
                bp={bp}
              />
              <main className={bp.main}>
                <div className={cn("mx-auto w-full max-w-6xl min-w-0", contentClassName)}>{children}</div>
              </main>
            </div>
            <MobileTabBar
              items={tabs}
              showMore={showMore}
              moreActive={moreActive}
              moreOpen={moreOpen}
              onMore={() => setMoreOpen(true)}
              moreRef={moreRef}
              bp={bp}
              layer={bp.layer}
            />
            <MoreSheet
              open={moreOpen}
              onClose={closeMore}
              groups={groups}
              workspace={workspace}
              account={account}
              sections={sections}
              layer={bp.layer}
            />
            {/* 浮層：絕對定位在外殼左上角，座標由 measure 換算 */}
            <div ref={setLayerEl} className="pointer-events-none absolute inset-0 z-[60] overflow-visible [&>*]:pointer-events-auto">
              {tip ? (
                <div
                  role="tooltip"
                  style={{ top: tip.top, left: tip.left }}
                  className="pointer-events-none! absolute -translate-y-1/2 rounded-md bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background shadow-md"
                >
                  {tip.label}
                </div>
              ) : null}
            </div>
          </div>
        </TipCtx.Provider>
      </LayerCtx.Provider>
    </Ctx.Provider>
  );
}

/** 只建立一次的物件（API 內只用到穩定的 measure 與 setState） */
function useStableValue<T>(factory: () => T): T {
  const ref = useRef<T | null>(null);
  if (ref.current === null) ref.current = factory();
  return ref.current;
}

function LayerPortal({ target, children }: { target: HTMLElement; children: ReactNode }) {
  return createPortal(children, target);
}
