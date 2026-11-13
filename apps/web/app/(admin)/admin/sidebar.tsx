"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { RAIL_COOKIE } from "@/lib/admin-session";
import { cn } from "@/lib/utils";

import { Icon, type IconName } from "./icons";

// 分組照 reports/Admin 統計系統規劃-2026-11-13.md 第 5.2 節：先看結果（營收），再看使用，再看成長來源，最後是系統。
// 還沒做的頁面也列出來（標「規劃中」，不能點），導覽列本身就是路線圖。
// 版面沿用作者其他後台的側欄：224 / 56px 可收合、⌘B 切換、狀態存在 cookie（伺服器先讀，第一個畫面就不會閃）。
type NavItem = { label: string; icon: IconName; href?: string; phase?: string; badge?: number };
type NavGroup = { title?: string; items: NavItem[] };


function groups(badges: { dormant: number }): NavGroup[] {
  return [
    { items: [{ label: "總覽", icon: "overview", href: "/admin" }] },
    { title: "營收", items: [{ label: "訂單", icon: "orders", href: "/admin/orders" }] },
    {
      title: "使用",
      items: [
        { label: "授權使用", icon: "license", href: "/admin/licenses", badge: badges.dormant },
        { label: "Pro 區塊", icon: "block", href: "/admin/licenses#pro-blocks" },
        { label: "免費安裝", icon: "download", href: "/admin#free-installs" },
      ],
    },
    {
      title: "成長",
      items: [
        { label: "購買漏斗", icon: "funnel", href: "/admin#funnel" },
        { label: "AI 通路", icon: "spark", phase: "P1" },
      ],
    },
    { title: "系統", items: [{ label: "系統健康", icon: "pulse", phase: "P2" }] },
  ];
}

export type SourceStatus = { label: string; ok: boolean; detail?: string };

function isActive(pathname: string, href: string) {
  // 錨點項目（/admin#funnel）只是頁內捷徑，不搶頁面本身的選取狀態
  return !href.includes("#") && pathname === href;
}

const ROW = "relative flex h-8 items-center gap-2.5 rounded-md px-2 text-sm whitespace-nowrap transition-colors";
const ROW_ACTIVE = "bg-card font-medium text-fg shadow-[inset_0_0_0_1px_var(--line)]";
const ROW_IDLE = "text-subtle hover:bg-muted hover:text-fg";

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
  badges: { dormant: number };
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const toggle = useCallback(() => {
    setCollapsed((value) => {
      document.cookie = `${RAIL_COOKIE}=${value ? "0" : "1"}; path=/admin; max-age=31536000; samesite=strict`;
      return !value;
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

  // 收合時文字淡出但不卸載，圖示位置不動
  const fade = cn("transition-opacity duration-200", collapsed ? "lg:pointer-events-none lg:opacity-0" : "opacity-100");
  const nav = groups(badges);
  const problems = sources.filter((s) => !s.ok).length;

  return (
    <>
      {/* 手機：頂部一列 + 可橫向捲動的選單 */}
      <div className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex size-6 items-center justify-center rounded-md bg-fg text-[11px] text-bg">S</span>
            Admin
          </Link>
          <div className="flex items-center gap-4 text-xs text-subtle">
            <span>{countdown}</span>
            <form action={logout}>
              <button type="submit" className="hover:text-fg">
                登出
              </button>
            </form>
          </div>
        </div>
        <nav aria-label="後台" className="overflow-x-auto px-3 pb-2">
          <ul className="flex gap-1">
            {nav.flatMap((g) => g.items).filter((item) => item.href).map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href!}
                  aria-current={isActive(pathname, item.href!) ? "page" : undefined}
                  className={cn(ROW, isActive(pathname, item.href!) ? ROW_ACTIVE : ROW_IDLE)}
                >
                  <Icon name={item.icon} />
                  {item.label}
                  {!!item.badge && <span className="rounded-full bg-amber-500/15 px-1.5 text-[11px] text-amber-700 tabular-nums dark:text-amber-300">{item.badge}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* 桌機：左側可收合欄 */}
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col overflow-hidden border-r border-line bg-muted/40 px-3 py-5 transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] lg:flex",
          collapsed ? "w-14" : "w-56",
        )}
      >
        <div className="flex h-8 items-center gap-2.5 px-0.5">
          <Link href="/admin" title="SunUI Admin" className="flex size-7 shrink-0 items-center justify-center rounded-md bg-fg text-xs font-semibold text-bg">
            S
          </Link>
          <span className={cn("min-w-0", fade)}>
            <span className="block text-sm leading-tight font-semibold">SunUI Admin</span>
            <span className="block text-[11px] leading-tight text-subtle">{countdown}</span>
          </span>
        </div>

        <nav aria-label="後台" className="mt-6 flex-1 overflow-x-hidden overflow-y-auto">
          {nav.map((group, g) => (
            <div key={g} className={g > 0 ? "mt-4" : undefined}>
              {group.title && (
                <div className="relative mb-1 h-5">
                  <p className={cn("px-2 text-xs font-medium text-subtle", fade)}>{group.title}</p>
                  <span
                    aria-hidden="true"
                    className={cn("absolute inset-x-2 top-1/2 h-px bg-line transition-opacity", collapsed ? "opacity-100" : "opacity-0")}
                  />
                </div>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = item.href ? isActive(pathname, item.href) : false;
                  const inner = (
                    <>
                      <Icon name={item.icon} className="size-4 shrink-0" />
                      <span className={cn("flex-1", fade)}>{item.label}</span>
                      {item.phase && (
                        <span className={cn("rounded border border-line px-1 text-[10px] text-subtle", fade)}>{item.phase}</span>
                      )}
                      {!!item.badge &&
                        (collapsed ? (
                          <span aria-hidden="true" className="absolute top-1.5 left-5 size-1.5 rounded-full bg-amber-500 ring-2 ring-muted" />
                        ) : (
                          <span className="rounded-full bg-amber-500/15 px-1.5 text-[11px] text-amber-700 tabular-nums dark:text-amber-300">
                            {item.badge}
                          </span>
                        ))}
                    </>
                  );
                  const tip = collapsed ? `${item.label}${item.phase ? `（${item.phase === "P1" ? "第 1 階段" : "第 2 階段"}）` : ""}` : undefined;
                  return (
                    <li key={item.label}>
                      {item.href ? (
                        <Link href={item.href} title={tip} aria-current={active ? "page" : undefined} className={cn(ROW, active ? ROW_ACTIVE : ROW_IDLE)}>
                          {inner}
                        </Link>
                      ) : (
                        <span title={tip ?? (item.phase === "P1" ? "第 1 階段才會做" : "第 2 階段才會做")} aria-disabled="true" className={cn(ROW, "cursor-default text-subtle/50")}>
                          {inner}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-4 space-y-0.5 border-t border-line pt-4">
          <div className={cn(ROW, "h-auto items-start py-1.5 text-subtle")} title={collapsed ? sources.map((s) => `${s.label}：${s.ok ? "正常" : "未設定"}`).join("\n") : undefined}>
            <span className="relative mt-0.5 size-4 shrink-0">
              <Icon name="pulse" className="size-4" />
              <span aria-hidden="true" className={cn("absolute -top-0.5 -right-0.5 size-1.5 rounded-full ring-2 ring-muted", problems ? "bg-amber-500" : "bg-emerald-500")} />
            </span>
            <ul className={cn("min-w-0 flex-1 space-y-1 text-xs", fade)}>
              {sources.map((s) => (
                <li key={s.label}>
                  <span className="flex items-center gap-1.5">
                    <span aria-hidden="true" className={cn("size-1.5 rounded-full", s.ok ? "bg-emerald-500" : "bg-subtle/40")} />
                    <span className={s.ok ? "text-fg" : undefined}>{s.label}</span>
                    {!s.ok && <span>未設定</span>}
                  </span>
                  {s.ok && s.detail && <span className="block truncate pl-3 text-[11px]">{s.detail}</span>}
                </li>
              ))}
            </ul>
          </div>
          <button type="button" onClick={toggle} title={collapsed ? "展開側欄（⌘B）" : undefined} className={cn(ROW, ROW_IDLE, "w-full")}>
            <Icon name="rail" className="size-4 shrink-0" />
            <span className={cn("flex-1 text-left", fade)}>收合側欄</span>
            <kbd className={cn("rounded border border-line px-1 font-sans text-[10px]", fade)}>⌘B</kbd>
          </button>
          <form action={logout}>
            <button type="submit" title={collapsed ? "登出" : undefined} className={cn(ROW, ROW_IDLE, "w-full")}>
              <Icon name="logout" className="size-4 shrink-0" />
              <span className={cn("flex-1 text-left", fade)}>登出</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
