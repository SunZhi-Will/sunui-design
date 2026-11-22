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

// Ported from Schedary's components/layout (app-shell.tsx, sidebar.tsx, mobile-nav.tsx).
// Grouping, tabLabel and the sidebar: false option follow ComfyUI's nav-config.ts;
// spliteat-web and voxcpm-video-generator use the same shell.
// Desktop: grouped nav on the left that collapses to an icon rail (Cmd/Ctrl + B); when collapsed, the second level becomes a flyout menu on the right.
// Mobile: top bar (iOS large-title pattern) + bottom tab bar (only pages with a tabLabel) + a "More" drawer.
// Differences from the original: routing, identity and store are props; Popover, Tooltip, DropdownMenu and Sheet are implemented inside the component;
// the switch breakpoint uses a container query by default, so it switches correctly inside a container of any width.

/* ------------------------------------------------------------------ types */

/** Compatible with lucide-react icons: just pass a lucide component */
export type AppShellIcon = ComponentType<{ className?: string; strokeWidth?: number }>;

/** A clickable page (leaf node) */
export interface AppShellNavItem {
  href: string;
  label: string;
  icon: AppShellIcon;
  /** Short label for the mobile bottom tab bar; the page appears there only when set */
  tabLabel?: string;
  /** Count badge (e.g. pending reviews); becomes a small dot when collapsed */
  badge?: number;
  /** false: not listed in the desktop sidebar; the mobile tab bar and "More" still show it */
  sidebar?: false;
}

/** Second level: not a page itself, only groups child pages */
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

/** Props passed to renderLink; in Next.js use `renderLink={(p) => <Link {...p} />}` */
export type AppShellLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export interface AppShellWorkspace {
  /** Name of the current store, project or organization */
  label: string;
  icon?: AppShellIcon;
  /** Becomes a switchable menu with two or more entries */
  options?: { id: string; label: string }[];
  value?: string;
  onChange?: (id: string) => void;
  /** Extra action at the bottom of the menu, e.g. "All stores" */
  action?: { label: string; icon?: AppShellIcon; onSelect: () => void };
}

export interface AppShellAccount {
  name: string;
  /** Role or plan, shown under the name */
  detail?: string;
  /** Shown only in the account menu */
  email?: string;
  /** Avatar initial; defaults to the first character of the name */
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
  /** Current path, e.g. Next.js usePathname() */
  activeHref: string;
  /** Called on any nav link click; with client-side routing, preventDefault here and navigate yourself */
  onNavigate?: (href: string, event: ReactMouseEvent<HTMLAnchorElement>) => void;
  /** Swap in your framework's Link; defaults to <a> */
  renderLink?: (props: AppShellLinkProps) => ReactNode;
  brand: { name: string; logo?: ReactNode; href?: string };
  workspace?: AppShellWorkspace;
  account?: AppShellAccount;
  /** Mobile top bar title; if omitted, it is looked up in the nav from activeHref */
  title?: string;
  /** Back path for the mobile top bar; null forces it hidden, omitted means automatic (shown on sub-pages only) */
  backHref?: string | null;
  /** Title shown in the top bar for a sub-page (e.g. /history/12); the key is the parent page's href */
  detailTitles?: Record<string, string>;
  /** Right side of the mobile top bar */
  mobileAction?: ReactNode;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /**
   * rail (default): collapsing leaves a narrow column of icons with tooltips and flyouts.
   * hidden: collapsing slides the whole sidebar away; the toggle stays where it was, over the content's top-left corner.
   */
  collapseMode?: "rail" | "hidden";
  /**
   * padded (default): desktop content gets page padding and a centred max width.
   * flush: on desktop the content area shares the sidebar's background with no divider, and has no padding or max width,
   * so it can draw its own surfaces (such as tabs joined to a panel). Phones keep the usual layout.
   */
  layout?: "padded" | "flush";
  /** Cmd/Ctrl + B toggles collapse; on by default */
  shortcut?: boolean;
  /** Second-level ids that start expanded; the section containing the current page expands automatically */
  defaultOpenSections?: string[];
  /**
   * container (default): switches on the shell's own width. The shell needs a fixed height (e.g. h-dvh) and the content scrolls inside it.
   * viewport: switches on the window width (md), scrolls the whole page, and pins the bottom tab bar to the bottom of the window.
   */
  breakpoint?: "container" | "viewport";
  locale?: string;
  labels?: AppShellLabels;
  className?: string;
  /** Outer wrapper of the main content; centered with max-w-6xl by default */
  contentClassName?: string;
  children?: ReactNode;
}

/* ------------------------------------------------------------------ copy */

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

/* ------------------------------------------------------------------ utilities */

export function isNavParent(entry: AppShellNavEntry): entry is AppShellNavParent {
  return "children" in entry;
}

/** Flatten into all clickable pages, for the mobile top title and the bottom tab bar */
export function flattenNav(groups: AppShellNavGroup[]): AppShellNavItem[] {
  return groups.flatMap((g) => g.items.flatMap((e) => (isNavParent(e) ? e.children : [e])));
}

export function isActiveHref(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/*
 * Collapse animation (as in the original): the sidebar DOM is identical in both states and icons stay at the same x position (centered at 56px wide);
 * only the width and text opacity change. Text fades out immediately on collapse and fades in after the width has travelled a bit on expand, so squeezed text does not flash.
 */
const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";
const FADE =
  "transition-opacity duration-200 delay-100 group-data-[collapsed=true]/sidebar:pointer-events-none group-data-[collapsed=true]/sidebar:opacity-0 group-data-[collapsed=true]/sidebar:duration-100 group-data-[collapsed=true]/sidebar:delay-0";

const ROW_BASE =
  "group/row relative flex w-full items-center gap-2.5 overflow-hidden rounded-md px-2 text-left text-sm whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50";
const ROW_ACTIVE = "bg-background font-medium text-foreground shadow-[inset_0_0_0_1px_var(--border)]";
const ROW_IDLE = "text-muted-foreground hover:bg-muted hover:text-foreground";
const SIDEBAR_BG = "bg-[color-mix(in_oklab,var(--muted)_45%,var(--background))]";

// Tailwind needs to see complete class strings to generate them, so write one copy for each breakpoint kind
const BP = {
  container: {
    root: "@container/shell relative flex h-full min-h-0 overflow-hidden",
    desktop: "relative hidden h-full shrink-0 @3xl/shell:block",
    mobile: "@3xl/shell:hidden",
    column: "flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain",
    main: "min-w-0 flex-1 px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] @3xl/shell:px-10 @3xl/shell:py-10",
    flushColumn: "@3xl/shell:bg-[color-mix(in_oklab,var(--muted)_45%,var(--background))]",
    flushMain: "flex min-h-0 flex-col @3xl/shell:p-0",
    layer: "absolute",
  },
  viewport: {
    root: "relative flex min-h-screen",
    desktop: "sticky top-0 hidden h-screen shrink-0 self-start md:block",
    mobile: "md:hidden",
    column: "flex min-h-screen min-w-0 flex-1 flex-col",
    main: "min-w-0 flex-1 px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] md:px-10 md:py-10",
    flushColumn: "md:bg-[color-mix(in_oklab,var(--muted)_45%,var(--background))]",
    flushMain: "flex flex-col md:p-0",
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
  /** Convert an element's position to coordinates inside the shell (also correct when the shell is scaled by a transform) */
  measure: (el: HTMLElement) => Rect;
}

const Ctx = createContext<ShellContext | null>(null);
function useShell() {
  const c = useContext(Ctx);
  if (!c) throw new Error("AppShell parts must be rendered inside <AppShell>");
  return c;
}

const defaultLink = ({ children, ...rest }: AppShellLinkProps) => <a {...rest}>{children}</a>;

/* ------------------------------------------------------------------ icons (shapes follow lucide) */

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

/* ------------------------------------------------------------------ overlays */

/** Tooltip while collapsed: there is only one, drawn inside the shell so the sidebar's overflow cannot clip it */
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

/** Dropdown menu: arrow keys move, Esc closes and returns focus to the button, clicking outside closes */
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

/* ------------------------------------------------------------------ navigation */

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

/** While collapsed, the tooltip shows on hover or focus; the DOM is the same in both states */
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

/** Sub-page: no icon, text aligned with the parent's text, a thin line on the left marks the level */
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

  // Collapsed: hovering the parent icon opens a submenu flyout on the right (it closes 120ms after the pointer leaves, so the mouse has time to cross over)
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
  // When collapsed or the section is closed, child pages are not visible, so the parent shows the selected state instead
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
        {/* Fade and rotation live on two layers so the two transitions do not override each other */}
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

      {/* Height animates with grid-template-rows 0fr <-> 1fr, so no height measuring is needed */}
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

/** Flyout menu for the second level while collapsed; drawn in the shell's overlay so the sidebar's overflow cannot clip it */
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

/** Overlay host: flyout menus render from each row but must be drawn at the top of the shell */
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
  // Entering a sub-page expands its section automatically; this only checks on navigation, so a section the user later closes by hand stays closed
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
              // Fixed height: the text title and the divider line shown while collapsed overlap in the same cell and cross-fade, so items do not jump vertically
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

/* ------------------------------------------------------------------ store switcher and identity */

/** With one option, only the name is shown; with two or more (or an extra action) it is a switchable menu */
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

/** Bottom of the desktop sidebar: the whole row is one menu button, and its position is the same in both states */
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

/** Identity row at the bottom of the mobile "More" drawer */
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

/* ------------------------------------------------------------------ overlay host */

/** Send children to the shell's overlay (like createPortal, but the target is a node inside the shell, so positions stay correct when the shell is scaled) */
function LayerOut({ children }: { children: ReactNode }) {
  const host = useContext(LayerCtx);
  return host ? <>{host.portal(children)}</> : null;
}

/* ------------------------------------------------------------------ desktop sidebar */

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
  collapseMode,
  flush,
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
  collapseMode: "rail" | "hidden";
  flush: boolean;
}) {
  const { t, link, navigate } = useShell();
  // Do not play the collapse animation on first load (the collapsed state may have just been read back from storage)
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Same as common tools: Cmd/Ctrl + B toggles the sidebar
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
  const hidden = collapseMode === "hidden";
  // In hidden mode the sidebar slides away whole, so nothing inside it switches to the icon rail
  const rail = collapsed && !hidden;

  return (
    // The outer layer reserves the sidebar's space in the grid and holds the toggle, which is drawn above the sidebar
    <div className={cn(bp.desktop, !ready && "[&,&_*]:transition-none!")}>
      {/* One toggle for every state, pinned at the brand row's spacer (sidebar padding 12px + 2px, row top 20px + 2px).
          It never moves, so a second press lands on it again. First in the DOM so it is also first in tab order. */}
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? t.expand : t.collapse}
        title={`${collapsed ? t.expand : t.collapse}${shortcut ? " (⌘B)" : ""}`}
        aria-expanded={!collapsed}
        className="absolute top-[22px] left-[14px] z-30 flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {/* The two icons cross-fade in place */}
        <PanelLeftClose
          className={cn(
            "absolute size-4 transition-opacity duration-150 motion-reduce:transition-none",
            collapsed ? "opacity-0" : "opacity-100",
          )}
        />
        <PanelLeftOpen
          className={cn(
            "absolute size-4 transition-opacity duration-150 motion-reduce:transition-none",
            collapsed ? "opacity-100" : "opacity-0",
          )}
        />
      </button>
      {/* hidden mode: this clip animates its width to 0 while the sidebar keeps its full width, so nothing reflows */}
      <div
        inert={hidden && collapsed}
        className={cn(
          "h-full",
          hidden && "overflow-hidden transition-[width] duration-300 motion-reduce:transition-none",
          hidden && EASE,
          hidden && (collapsed ? "w-0" : "w-56"),
        )}
      >
        <aside
          data-collapsed={rail ? "true" : "false"}
          className={cn(
            "group/sidebar flex h-full flex-col overflow-hidden px-3 py-5 transition-[width] duration-300 motion-reduce:transition-none",
            !flush && "border-r border-border",
            SIDEBAR_BG,
            EASE,
            rail ? "w-14" : "w-56",
          )}
        >
          {/* Brand row. The toggle is drawn outside the sidebar (below), over this spacer, on the same centre line as the nav
              icons, so it stays at the same spot whether the sidebar is open, a rail or hidden. The brand follows it and fades
              out with the other labels when the sidebar collapses. */}
          <div className="flex h-8 items-center gap-2">
            <span aria-hidden="true" className="ml-0.5 size-7 shrink-0" />
            <div className={cn("flex min-w-0 flex-1 items-center gap-2.5", FADE)}>
              {link({
                href: brand.href ?? "/",
                onClick: (e) => navigate(brand.href ?? "/", e),
                "aria-label": t.home(brand.name),
                tabIndex: rail ? -1 : undefined,
                className:
                  "flex size-7 shrink-0 items-center justify-center rounded-md bg-foreground text-background outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                children: logo,
              })}
              <span className="min-w-0 flex-1 truncate text-sm font-semibold whitespace-nowrap text-foreground">
                {brand.name}
              </span>
            </div>
          </div>

          {workspace ? (
            <div className="mt-4">
              <WorkspaceSwitcher workspace={workspace} collapsed={rail} size="sm" />
            </div>
          ) : null}

          <div className="-mx-3 mt-4 flex-1 overflow-x-hidden overflow-y-auto px-3">
            <NavList groups={groups} collapsed={rail} size="sm" sections={sections} inSidebar />
          </div>

          {account ? (
            <div className="border-t border-border pt-3">
              <SidebarAccount account={account} collapsed={rail} />
            </div>
          ) : null}
        </aside>
      </div>

    </div>
  );
}

/* ------------------------------------------------------------------ mobile top bar and tab bar */

/**
 * Mobile top bar, using the iOS large-title pattern: at the top of the page the large title in the content area is in charge, and only after scrolling down does the title fade into the top bar together with a divider line,
 * so the same title never appears twice on screen. Sub-pages always show a back button on the left.
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

/** Mobile bottom tab bar: frequent pages sit where the thumb reaches easily; the other pages and the identity switcher go into the "More" drawer */
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

/** "More" bottom drawer: all pages, store switcher and identity row; Esc, tapping the backdrop or dragging down closes it */
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
    // Keep focus inside the drawer
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

/* ------------------------------------------------------------------ shell */

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
  collapseMode = "rail",
  layout = "padded",
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

  // Collapse state: controlled or uncontrolled
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

  // Top bar title: fades in after scrolling past 44px
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
  // Close the drawer on navigation
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

  // Overlay host: tooltips, flyout menus and dropdown menus are all drawn here
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
              collapseMode={collapseMode}
              flush={layout === "flush"}
            />
            <div ref={columnRef} className={cn(bp.column, layout === "flush" && bp.flushColumn)}>
              <MobileTopBar
                title={pageTitle}
                backHref={pageBack}
                brand={brand}
                scrolled={scrolled}
                action={mobileAction}
                bp={bp}
              />
              <main className={cn(bp.main, layout === "flush" && bp.flushMain)}>
                <div
                  className={cn(
                    layout === "flush" ? "flex min-h-0 w-full min-w-0 flex-1 flex-col" : "mx-auto w-full max-w-6xl min-w-0",
                    contentClassName,
                  )}
                >
                  {children}
                </div>
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
            {/* Overlay: absolutely positioned at the shell's top-left corner, coordinates converted by measure */}
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

/** Created only once (the API uses only the stable measure and setState) */
function useStableValue<T>(factory: () => T): T {
  const ref = useRef<T | null>(null);
  if (ref.current === null) ref.current = factory();
  return ref.current;
}

function LayerPortal({ target, children }: { target: HTMLElement; children: ReactNode }) {
  return createPortal(children, target);
}
