"use client";

import { useState, type MouseEvent } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { AppShell, flattenNav } from "./app-shell";
import { buildAccount, buildGroups, buildWorkspace, shellCopy, type ShellCopy } from "./demo-data";

const pageCopy = {
  en: {
    wide: "Desktop width",
    phone: "Phone width",
    hint: "Same component in both frames. It switches on its own width, so the narrow frame shows the tab bar.",
    intro: "This week at a glance. Tap a shift to see who is on it.",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    shifts: ["Open", "Mid", "Close"],
    rows: ["Updated 2 hours ago", "Updated yesterday", "Updated last week", "Updated 2 weeks ago"],
    version: (n: number) => `Version ${n}`,
    detailBody: "This is a detail page. On phones the top bar shows Back and the page title.",
  },
  "zh-TW": {
    wide: "桌面寬度",
    phone: "手機寬度",
    hint: "兩個框是同一個元件，依自身寬度切換，所以窄的那個會出現底部分頁列。",
    intro: "本週班表一覽，點班次可以看當班人員。",
    days: ["一", "二", "三", "四", "五", "六", "日"],
    shifts: ["早班", "中班", "晚班"],
    rows: ["2 小時前更新", "昨天更新", "上週更新", "兩週前更新"],
    version: (n: number) => `第 ${n} 版`,
    detailBody: "這是子頁面。手機頂部列會出現「返回」與頁面標題。",
  },
  "zh-CN": {
    wide: "桌面宽度",
    phone: "手机宽度",
    hint: "两个框是同一个组件，按自身宽度切换，所以窄的那个会出现底部标签栏。",
    intro: "本周班表一览，点班次可以看当班人员。",
    days: ["一", "二", "三", "四", "五", "六", "日"],
    shifts: ["早班", "中班", "晚班"],
    rows: ["2 小时前更新", "昨天更新", "上周更新", "两周前更新"],
    version: (n: number) => `第 ${n} 版`,
    detailBody: "这是子页面。手机顶部栏会出现“返回”和页面标题。",
  },
  ja: {
    wide: "デスクトップ幅",
    phone: "スマホ幅",
    hint: "どちらも同じコンポーネントです。自身の幅で切り替わるので、狭い方にはタブバーが出ます。",
    intro: "今週のシフト一覧。シフトをタップすると担当者が見られます。",
    days: ["月", "火", "水", "木", "金", "土", "日"],
    shifts: ["早番", "中番", "遅番"],
    rows: ["2 時間前に更新", "昨日更新", "先週更新", "2 週間前に更新"],
    version: (n: number) => `バージョン ${n}`,
    detailBody: "詳細ページです。スマホではトップバーに「戻る」とページタイトルが出ます。",
  },
};
type PageCopy = (typeof pageCopy)["en"];

// 每格排了幾個人：中性色塊，缺人的格子留白
const FILL = [
  [2, 2, 2, 2, 3, 3, 2],
  [1, 1, 1, 1, 2, 2, 1],
  [2, 2, 1, 2, 3, 3, 2],
];

export function PageBody({
  href,
  t,
  p,
  navigate,
  compact = false,
}: {
  href: string;
  t: ShellCopy;
  p: PageCopy;
  navigate: (href: string) => void;
  compact?: boolean;
}) {
  const groups = buildGroups(t, 3);
  const isDetail = href.startsWith("/history/");
  const title = isDetail ? t.detail : (flattenNav(groups).find((i) => i.href === href)?.label ?? t.schedule);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[26px] leading-tight font-bold tracking-tight">{title}</h1>
        {href === "/" ? <p className="mt-1 text-sm text-muted-foreground">{p.intro}</p> : null}
      </div>

      {href === "/" ? (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] border-b border-border text-xs text-muted-foreground">
            <span />
            {p.days.map((d) => (
              <span key={d} className="py-2 text-center">
                {d}
              </span>
            ))}
          </div>
          {p.shifts.map((s, r) => (
            <div key={s} className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] border-b border-border last:border-b-0">
              <span className="flex items-center px-2 text-xs text-muted-foreground">{s}</span>
              {FILL[r].map((n, c) => (
                <span key={c} className="flex flex-col gap-1 p-1.5">
                  {Array.from({ length: n }, (_, k) => (
                    <span key={k} className="h-2 rounded-full bg-muted-foreground/25" />
                  ))}
                </span>
              ))}
            </div>
          ))}
        </div>
      ) : isDetail ? (
        <p className="text-sm text-muted-foreground">{p.detailBody}</p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {p.rows.slice(0, compact ? 3 : 4).map((row, i) => {
            const n = 12 - i;
            const body = (
              <>
                <span className="size-8 shrink-0 rounded-md bg-muted" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {href === "/history" ? p.version(n) : `${title} ${i + 1}`}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{row}</span>
                </span>
              </>
            );
            return (
              <li key={row}>
                {href === "/history" ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/history/${n}`)}
                    className="flex w-full items-center gap-3 px-3 py-3 text-left outline-none hover:bg-muted focus-visible:bg-muted"
                  >
                    {body}
                  </button>
                ) : (
                  <div className="flex items-center gap-3 px-3 py-3">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* 撐出可捲動的高度，讓手機頂部列的標題淡入看得到 */}
      {!compact ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg border border-border bg-card p-3">
              <div className="h-2 w-1/3 rounded-full bg-muted-foreground/25" />
              <div className="mt-3 h-2 w-2/3 rounded-full bg-muted" />
              <div className="mt-2 h-2 w-1/2 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function AppShellDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(shellCopy);
  const p = useDemoText(pageCopy);
  const [href, setHref] = useState("/");
  const [store, setStore] = useState("s0");

  const groups = buildGroups(t, 3);
  const workspace = buildWorkspace(t, store, setStore);
  const account = buildAccount(t);
  const onNavigate = (next: string, e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setHref(next);
  };
  const shared = {
    groups,
    activeHref: href,
    onNavigate,
    brand: { name: t.brand },
    workspace,
    account,
    detailTitles: { "/history": t.detail },
    locale,
  };

  return (
    <div className="flex w-full max-w-6xl min-w-0 flex-col gap-3">
      <p className="text-sm text-muted-foreground">{p.hint}</p>
      <div className="flex min-w-0 flex-col gap-6">
        <figure className="flex min-w-0 flex-col gap-2">
          <figcaption className="text-xs text-muted-foreground">{p.wide}</figcaption>
          <div className="h-[560px] min-w-0 overflow-hidden rounded-xl border border-border">
            <AppShell key={`wide-${locale}`} {...shared}>
              <PageBody href={href} t={t} p={p} navigate={setHref} />
            </AppShell>
          </div>
        </figure>
        <figure className="mx-auto flex w-full max-w-[375px] flex-col gap-2">
          <figcaption className="text-xs text-muted-foreground">{p.phone}</figcaption>
          <div className="h-[640px] overflow-hidden rounded-[28px] border border-border">
            <AppShell key={`phone-${locale}`} {...shared} shortcut={false}>
              <PageBody href={href} t={t} p={p} navigate={setHref} />
            </AppShell>
          </div>
        </figure>
      </div>
    </div>
  );
}
