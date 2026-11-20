"use client";

// 後台左側選單，做法照 VideoAligner（萬寶箱）後台的側邊欄：
// 收合時 DOM 結構不變，圖示固定在同一個 x 座標（寬 56px 時剛好置中），只有寬度與文字透明度在變；
// 分區（銷售、使用）可以展開收起，收合時改成右側浮出；底部是帳號選單，資料來源狀態也收在裡面。
// 收合狀態存在 cookie（伺服器先讀，第一個畫面就不會閃），分區開關存在 localStorage。

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactElement, type RefObject } from "react";

import { SunMark } from "@/components/sun-mark";
import { RAIL_COOKIE } from "@/lib/admin-session";
import { cn } from "@/lib/utils";

import { Icon, type IconName } from "./icons";

const SECTIONS_KEY = "sunui_admin_sections";

type Badges = { dormant: number };
type NavItem = { href: string; label: string; icon: IconName; badge?: (b: Badges) => number };
type NavParent = { id: string; label: string; icon: IconName; children: NavItem[] };
type NavEntry = NavItem | NavParent;

const NAV: NavEntry[] = [
  { href: "/admin", label: "總覽", icon: "overview" },
  {
    id: "sales",
    label: "銷售",
    icon: "sales",
    children: [
      { href: "/admin/orders", label: "訂單", icon: "orders" },
      { href: "/admin#funnel", label: "購買漏斗", icon: "funnel" },
    ],
  },
  {
    id: "usage",
    label: "使用",
    icon: "license",
    children: [
      { href: "/admin/licenses", label: "授權使用", icon: "license", badge: (b) => b.dormant },
      { href: "/admin/licenses#pro-blocks", label: "Pro 區塊", icon: "block" },
      { href: "/admin#free-installs", label: "免費安裝", icon: "download" },
    ],
  },
];

function isParent(entry: NavEntry): entry is NavParent {
  return "children" in entry;
}

// 攤平成所有頁面，手機底部分頁用
const NAV_ITEMS: NavItem[] = NAV.flatMap((entry) => (isParent(entry) ? entry.children : [entry]));

function isActive(pathname: string, href: string) {
  // 錨點項目（/admin#funnel）只是頁內捷徑，不搶頁面本身的選取狀態
  return !href.includes("#") && pathname === href;
}

export type SourceStatus = { label: string; ok: boolean; detail?: string };

const ROW = "group/row relative flex h-8 w-full items-center gap-2.5 overflow-hidden rounded-md px-2 text-left text-sm whitespace-nowrap transition-colors";
const ROW_ACTIVE = "bg-card font-medium text-fg shadow-[inset_0_0_0_1px_var(--line-strong)]";
const ROW_IDLE = "text-subtle hover:bg-card hover:text-fg";
// 收起時立刻淡出，展開時等寬度走了一段再淡入，文字才不會被擠壓
const FADE = "a-fade-label";

function RowIcon({ name, active, dot }: { name: IconName; active: boolean; dot: boolean }) {
  return (
    <span className="relative flex size-4 shrink-0 items-center justify-center">
      <Icon name={name} className={cn("size-4", active ? "text-fg" : "text-subtle group-hover/row:text-fg")} />
      <span
        aria-hidden="true"
        className={cn(
          "absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-[var(--warn)] ring-2 ring-[var(--rail)] transition-opacity duration-200",
          dot ? "opacity-100" : "opacity-0",
        )}
      />
    </span>
  );
}

function CountBadge({ count, className = FADE }: { count: number; className?: string }) {
  if (!count) return null;
  return (
    <span
      aria-label={`${count} 件待處理`}
      className={cn(
        "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--warn-soft)] px-1 text-[11px] font-semibold text-[var(--warn)] tabular-nums",
        className,
      )}
    >
      {count}
    </span>
  );
}

// 側邊欄 overflow-hidden 會擋住浮層，所以用 fixed 依觸發元素的位置擺放
function anchorOf(el: HTMLElement | null) {
  const r = el?.getBoundingClientRect();
  return r ? { top: r.top, left: r.right + 10 } : { top: 0, left: 0 };
}

function useOutsideClose(open: boolean, refs: RefObject<HTMLElement | null>[], close: () => void) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!refs.some((r) => r.current?.contains(e.target as Node))) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, refs, close]);
}

// 收合時才出現的文字提示
function CollapsedTip({ collapsed, label, children }: { collapsed: boolean; label: string; children: ReactElement }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const show = () => setPos(anchorOf(ref.current));
  const hide = () => setPos(null);
  return (
    <span ref={ref} className="block" onPointerEnter={show} onPointerLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      {collapsed && pos && (
        <span role="tooltip" className="a-pop fixed z-50 flex h-7 items-center rounded-md px-2 text-xs whitespace-nowrap text-fg" style={{ top: pos.top + 2, left: pos.left }}>
          {label}
        </span>
      )}
    </span>
  );
}

function NavLinkRow({ item, collapsed, badges }: { item: NavItem; collapsed: boolean; badges: Badges }) {
  const active = isActive(usePathname() || "", item.href);
  const n = item.badge ? item.badge(badges) : 0;
  return (
    <CollapsedTip collapsed={collapsed} label={n ? `${item.label}（${n} 件待處理）` : item.label}>
      <Link href={item.href} aria-current={active ? "page" : undefined} aria-label={collapsed ? item.label : undefined} className={cn(ROW, active ? ROW_ACTIVE : ROW_IDLE)}>
        <RowIcon name={item.icon} active={active} dot={collapsed && n > 0} />
        <span className={FADE}>{item.label}</span>
        <CountBadge count={n} />
      </Link>
    </CollapsedTip>
  );
}

function NavChildLink({ item, badges, onNavigate }: { item: NavItem; badges: Badges; onNavigate?: () => void }) {
  const active = isActive(usePathname() || "", item.href);
  const n = item.badge ? item.badge(badges) : 0;
  return (
    <Link href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={cn(ROW, active ? ROW_ACTIVE : ROW_IDLE)}>
      <span>{item.label}</span>
      <CountBadge count={n} className="" />
    </Link>
  );
}

function NavParentRow({
  entry,
  collapsed,
  open,
  setOpen,
  badges,
}: {
  entry: NavParent;
  collapsed: boolean;
  open: boolean;
  setOpen: (id: string, open: boolean) => void;
  badges: Badges;
}) {
  const pathname = usePathname() || "";
  const expanded = open && !collapsed;
  const childActive = entry.children.some((c) => isActive(pathname, c.href));
  const childCount = entry.children.reduce((sum, c) => sum + (c.badge ? c.badge(badges) : 0), 0);

  // 進入某個子頁面時展開它所在的分區；只在換頁時檢查，之後手動收起就尊重使用者的選擇
  useEffect(() => {
    if (childActive && !open) setOpen(entry.id, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // 收合狀態：滑過分區圖示時，在右側浮出子選單
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [flyout, setFlyout] = useState<{ top: number; left: number } | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const openFlyout = () => {
    window.clearTimeout(closeTimer.current);
    setFlyout(anchorOf(trigger.current));
  };
  const closeFlyoutSoon = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setFlyout(null), 120);
  };
  const closeFlyout = useCallback(() => setFlyout(null), []);
  const [outsideRefs] = useState(() => [trigger, panel]);
  useOutsideClose(!!flyout, outsideRefs, closeFlyout);
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const contentId = `nav-section-${entry.id}`;
  // 收合、或分區收起時看不到子頁面，改由分區本身顯示選取狀態
  const showActive = childActive && !expanded;

  return (
    <div className="flex flex-col">
      <button
        ref={trigger}
        type="button"
        aria-expanded={collapsed ? !!flyout : open}
        aria-controls={collapsed ? undefined : contentId}
        aria-label={collapsed ? entry.label : undefined}
        onClick={() => (collapsed ? openFlyout() : setOpen(entry.id, !open))}
        onPointerEnter={collapsed ? openFlyout : undefined}
        onPointerLeave={collapsed ? closeFlyoutSoon : undefined}
        className={cn(ROW, showActive ? ROW_ACTIVE : ROW_IDLE, childActive && "text-fg")}
      >
        <RowIcon name={entry.icon} active={childActive} dot={collapsed && childCount > 0} />
        <span className={FADE}>{entry.label}</span>
        {!open && <CountBadge count={childCount} />}
        {/* 淡出與旋轉分在兩層，兩個 transition 才不會互相覆蓋 */}
        <span aria-hidden="true" className={cn("flex shrink-0", (open || !childCount) && "ml-auto", FADE)}>
          <Icon
            name="arrow"
            className={cn("size-3.5 text-[var(--faint)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]", open && "rotate-90")}
          />
        </span>
      </button>

      {collapsed && flyout && (
        <div
          ref={panel}
          className="a-pop fixed z-50 flex w-48 flex-col gap-0.5 rounded-lg p-1"
          style={{ top: flyout.top - 4, left: flyout.left }}
          onPointerEnter={openFlyout}
          onPointerLeave={closeFlyoutSoon}
        >
          <p className="px-2 pt-1 pb-1.5 text-xs font-medium text-subtle">{entry.label}</p>
          {entry.children.map((child) => (
            <NavChildLink key={child.href} item={child} badges={badges} onNavigate={closeFlyout} />
          ))}
        </div>
      )}

      {/* 高度用 grid-template-rows 0fr ↔ 1fr 做動畫，不用量測高度 */}
      <div
        id={contentId}
        inert={!expanded}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <ul className="relative flex list-none flex-col gap-0.5 pt-0.5 pl-[1.625rem]">
            <span aria-hidden="true" className="absolute top-1.5 bottom-1 left-4 w-px bg-line" />
            {entry.children.map((child) => (
              <li key={child.href}>
                <NavChildLink item={child} badges={badges} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** 底部帳號選單：整列是一個按鈕，收合前後位置不變。資料來源狀態、回網站、登出都在選單裡。 */
function SidebarIdentity({
  collapsed,
  countdown,
  sources,
  logout,
}: {
  collapsed: boolean;
  countdown: string;
  sources: SourceStatus[];
  logout: () => Promise<void>;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<{ left: number; bottom: number } | null>(null);
  const close = useCallback(() => setMenu(null), []);
  const [outsideRefs] = useState(() => [trigger, panel]);
  useOutsideClose(!!menu, outsideRefs, close);
  const problems = sources.filter((s) => !s.ok).length;

  const toggleMenu = () => {
    if (menu) return close();
    const r = trigger.current?.getBoundingClientRect();
    if (!r) return;
    setMenu(collapsed ? { left: r.right + 10, bottom: window.innerHeight - r.bottom } : { left: r.left, bottom: window.innerHeight - r.top + 6 });
  };

  const item = "flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-[13.5px] text-fg transition-colors hover:bg-[var(--raised-2)]";
  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-label="管理員，開啟帳號選單"
        aria-haspopup="menu"
        aria-expanded={!!menu}
        onClick={toggleMenu}
        className={cn(
          "flex h-10 w-full items-center gap-2.5 overflow-hidden rounded-md px-0.5 text-left whitespace-nowrap transition-colors hover:bg-card",
          menu && "bg-card",
        )}
      >
        <span className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--raised-2)] text-xs font-medium ring-1 ring-[var(--line-strong)]">
          <Icon name="user" className="size-3.5 text-subtle" />
          <span
            aria-hidden="true"
            className={cn("absolute -top-0.5 -right-0.5 size-2 rounded-full ring-2 ring-[var(--rail)]", problems ? "bg-[var(--warn)]" : "bg-[var(--ok)]")}
          />
        </span>
        <span className={cn("min-w-0 flex-1 leading-tight", FADE)}>
          <span className="block truncate text-[13px] font-medium">管理員</span>
          <span className="block text-xs text-subtle">{countdown}</span>
        </span>
        <Icon name="updown" className={cn("mr-1.5 size-3.5 text-[var(--faint)]", FADE)} />
      </button>
      {menu && (
        <div ref={panel} role="menu" className="a-pop fixed z-50 w-64 rounded-lg p-1" style={{ left: menu.left, bottom: menu.bottom }}>
          <div className="px-2 py-1.5">
            <p className="text-[13px] font-medium">SunUI · 管理員</p>
            <p className="text-xs text-subtle">{countdown}</p>
          </div>
          <div className="my-1 h-px bg-line" />
          <p className="px-2 pt-1 pb-1 text-xs font-medium text-subtle">資料來源</p>
          <ul className="space-y-1.5 px-2 pb-2">
            {sources.map((s) => (
              <li key={s.label} className="text-xs">
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true" className={cn("size-1.5 rounded-full", s.ok ? "bg-[var(--ok)]" : "bg-[var(--faint)]")} />
                  <span className={s.ok ? "text-fg" : "text-subtle"}>{s.label}</span>
                  <span className="ml-auto text-[var(--faint)]">{s.ok ? "正常" : "未設定"}</span>
                </span>
                {s.ok && s.detail && <span className="mt-0.5 block pl-3 text-[11px] leading-snug text-[var(--faint)]">{s.detail}</span>}
              </li>
            ))}
          </ul>
          <div className="my-1 h-px bg-line" />
          <Link href="/" role="menuitem" className={item} onClick={close}>
            <Icon name="globe" className="size-[15px] text-subtle" />
            回網站
          </Link>
          <form action={logout}>
            <button type="submit" role="menuitem" className={item}>
              <Icon name="logout" className="size-[15px] text-subtle" />
              登出
            </button>
          </form>
        </div>
      )}
    </>
  );
}

const QUIET_ICON = "flex size-7 shrink-0 items-center justify-center rounded-md text-subtle transition-colors hover:bg-card hover:text-fg";

export function AdminSidebar({
  sources,
  countdown,
  logout,
  initialCollapsed,
  badges,
}: {
  sources: SourceStatus[];
  countdown: string;
  logout: () => Promise<void>;
  initialCollapsed: boolean;
  badges: Badges;
}) {
  const pathname = usePathname() || "";
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [closedSections, setClosedSections] = useState<string[]>([]);

  useEffect(() => {
    // 分區開關記在瀏覽器裡，只能在載入後讀
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(SECTIONS_KEY) || "[]");
      if (Array.isArray(saved)) setClosedSections(saved.filter((v): v is string => typeof v === "string"));
    } catch {
      // 讀不到就全部展開
    }
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((value) => {
      document.cookie = `${RAIL_COOKIE}=${value ? "0" : "1"}; path=/admin; max-age=31536000; samesite=strict`;
      return !value;
    });
  }, []);

  // 只記被收起的分區，沒記錄的一律展開
  const setSectionOpen = useCallback((id: string, open: boolean) => {
    setClosedSections((closed) => {
      const next = closed.filter((v) => v !== id);
      if (!open) next.push(id);
      try {
        localStorage.setItem(SECTIONS_KEY, JSON.stringify(next));
      } catch {
        // 存不了就只在這次有效
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return (
    <>
      {/* 手機：頂端列 */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-[var(--rail)]/90 px-4 backdrop-blur md:hidden">
        <Link href="/admin" className="flex items-center gap-2 text-sm font-semibold">
          <SunMark />
          SunUI 後台
        </Link>
        <span className="text-xs text-subtle">{countdown}</span>
      </header>

      {/* 手機：底部分頁 */}
      <nav
        aria-label="後台選單"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-line bg-[var(--rail)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const n = item.badge ? item.badge(badges) : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn("relative flex h-16 flex-col items-center justify-center gap-1 text-[11px]", active ? "text-fg" : "text-subtle")}
            >
              <Icon name={item.icon} className="size-5" />
              {item.label}
              {n > 0 && <span aria-label={`${n} 件待處理`} className="absolute top-2.5 left-[calc(50%+6px)] size-2 rounded-full bg-[var(--warn)]" />}
            </Link>
          );
        })}
      </nav>

      {/* 桌機：外層負責 sticky 與寬度佔位；展開按鈕掛在外層右緣之外，落在內容區的左上角 */}
      <div className="sticky top-0 z-40 hidden h-dvh shrink-0 self-start md:block">
        <aside
          data-collapsed={collapsed}
          className={cn("a-rail flex h-full flex-col overflow-hidden border-r border-line bg-[var(--rail)] px-3 py-5", collapsed ? "w-14" : "w-56")}
        >
          {/* 品牌列：logo 跟選單圖示在同一條中線上，收合按鈕在右側 */}
          <div className="flex h-8 items-center gap-2.5">
            <Link href="/admin" aria-label="SunUI 後台首頁" className="ml-0.5 flex size-7 shrink-0 items-center justify-center rounded-md">
              <SunMark />
            </Link>
            <span className={cn("min-w-0 flex-1 text-sm font-semibold whitespace-nowrap", FADE)}>SunUI 後台</span>
            <button
              type="button"
              aria-label="收合側邊欄"
              title="收合側邊欄（⌘B）"
              onClick={toggle}
              tabIndex={collapsed ? -1 : undefined}
              aria-hidden={collapsed || undefined}
              className={cn(QUIET_ICON, FADE)}
            >
              <Icon name="rail" className="size-4" />
            </button>
          </div>

          <div className="-mx-3 mt-5 flex-1 overflow-x-hidden overflow-y-auto px-3">
            <nav aria-label="後台選單" className="flex flex-col gap-0.5">
              {NAV.map((entry) =>
                isParent(entry) ? (
                  <NavParentRow
                    key={entry.id}
                    entry={entry}
                    collapsed={collapsed}
                    open={!closedSections.includes(entry.id)}
                    setOpen={setSectionOpen}
                    badges={badges}
                  />
                ) : (
                  <NavLinkRow key={entry.href} item={entry} collapsed={collapsed} badges={badges} />
                ),
              )}
            </nav>
          </div>

          <div className="border-t border-line pt-3">
            <SidebarIdentity collapsed={collapsed} countdown={countdown} sources={sources} logout={logout} />
          </div>
        </aside>

        {/* 展開按鈕：收合後出現在內容區左上角，跟收合按鈕同高；等寬度縮得差不多才淡入 */}
        <button
          type="button"
          aria-label="展開側邊欄"
          title="展開側邊欄（⌘B）"
          onClick={toggle}
          tabIndex={collapsed ? undefined : -1}
          aria-hidden={collapsed ? undefined : true}
          className={cn(
            QUIET_ICON,
            "absolute top-[1.375rem] left-full z-30 ml-2 transition-opacity",
            collapsed ? "opacity-100 delay-150 duration-200" : "pointer-events-none opacity-0 delay-0 duration-100",
          )}
        >
          <Icon name="rail" className="size-4" />
        </button>
      </div>
    </>
  );
}

