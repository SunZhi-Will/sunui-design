"use client";

import { useMemo, useState, type ReactNode } from "react";

import { useDemoText } from "@/lib/demo-locale";
import { cn } from "@/lib/utils";

import { CommandPalette, Kbd, useModKey, type CommandGroup, type CommandPaletteProps } from "./command-palette";

type Page = "dashboard" | "projects" | "billing" | "settings";

type Copy = {
  app: string;
  search: string;
  placeholder: string;
  pages: Record<Page, string>;
  goTo: Record<Page, string>;
  navigation: string;
  actions: string;
  newProject: string;
  invite: string;
  copyLink: string;
  exportCsv: string;
  stats: [string, string][];
  labels: NonNullable<CommandPaletteProps["labels"]>;
};

const copy: { en: Copy; "zh-TW": Copy; "zh-CN": Copy; ja: Copy } = {
  en: {
    app: "Northwind",
    search: "Search or jump to…",
    placeholder: "Type a command or search…",
    pages: { dashboard: "Dashboard", projects: "Projects", billing: "Billing", settings: "Settings" },
    goTo: { dashboard: "Go to Dashboard", projects: "Go to Projects", billing: "Go to Billing", settings: "Open Settings" },
    navigation: "Navigation",
    actions: "Actions",
    newProject: "Create new project",
    invite: "Invite teammate",
    copyLink: "Copy share link",
    exportCsv: "Export as CSV",
    stats: [["Active projects", "12"], ["Open tasks", "48"], ["Members", "9"]],
    labels: {
      dialog: "Command palette",
      recent: "Recent",
      empty: (q) => <>No results for &ldquo;{q}&rdquo;</>,
      navigate: "Navigate",
      select: "Select",
      close: "Close",
      results: (n) => (n === 1 ? "1 result" : `${n} results`),
    },
  },
  "zh-TW": {
    app: "Northwind",
    search: "搜尋或前往…",
    placeholder: "輸入指令或搜尋…",
    pages: { dashboard: "總覽", projects: "專案", billing: "帳單", settings: "設定" },
    goTo: { dashboard: "前往總覽", projects: "前往專案", billing: "前往帳單", settings: "開啟設定" },
    navigation: "導覽",
    actions: "動作",
    newProject: "建立新專案",
    invite: "邀請成員",
    copyLink: "複製分享連結",
    exportCsv: "匯出 CSV",
    stats: [["進行中的專案", "12"], ["待辦任務", "48"], ["成員", "9"]],
    labels: {
      dialog: "指令面板",
      recent: "最近使用",
      empty: (q) => <>找不到「{q}」</>,
      navigate: "移動",
      select: "選取",
      close: "關閉",
      results: (n) => `${n} 筆結果`,
    },
  },
  "zh-CN": {
    app: "Northwind",
    search: "搜索或跳转…",
    placeholder: "输入命令或搜索…",
    pages: { dashboard: "概览", projects: "项目", billing: "账单", settings: "设置" },
    goTo: { dashboard: "前往概览", projects: "前往项目", billing: "前往账单", settings: "打开设置" },
    navigation: "导航",
    actions: "操作",
    newProject: "新建项目",
    invite: "邀请成员",
    copyLink: "复制分享链接",
    exportCsv: "导出 CSV",
    stats: [["进行中的项目", "12"], ["待办任务", "48"], ["成员", "9"]],
    labels: {
      dialog: "命令面板",
      recent: "最近使用",
      empty: (q) => <>没有找到「{q}」</>,
      navigate: "移动",
      select: "选择",
      close: "关闭",
      results: (n) => `${n} 条结果`,
    },
  },
  ja: {
    app: "Northwind",
    search: "検索または移動…",
    placeholder: "コマンドを入力または検索…",
    pages: { dashboard: "ダッシュボード", projects: "プロジェクト", billing: "請求", settings: "設定" },
    goTo: { dashboard: "ダッシュボードへ移動", projects: "プロジェクトへ移動", billing: "請求へ移動", settings: "設定を開く" },
    navigation: "ナビゲーション",
    actions: "アクション",
    newProject: "新規プロジェクトを作成",
    invite: "メンバーを招待",
    copyLink: "共有リンクをコピー",
    exportCsv: "CSV で書き出す",
    stats: [["進行中のプロジェクト", "12"], ["未完了のタスク", "48"], ["メンバー", "9"]],
    labels: {
      dialog: "コマンドパレット",
      recent: "最近使った項目",
      empty: (q) => <>「{q}」に一致する項目はありません</>,
      navigate: "移動",
      select: "選択",
      close: "閉じる",
      results: (n) => `${n} 件`,
    },
  },
};

const ICONS: Record<Page | "new" | "invite" | "link" | "export", string> = {
  dashboard: "M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z",
  projects: "M3 7h6l2 2h10v10H3z",
  billing: "M3 6h18v12H3zM3 10h18",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12h2M3 12h2M12 3v2M12 19v2",
  new: "M12 5v14M5 12h14",
  invite: "M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 8v6M22 11h-6",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  export: "M12 4v11M7 10l5 5 5-5M5 20h14",
};

function Icon({ d }: { d: string }): ReactNode {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const PAGES: Page[] = ["dashboard", "projects", "billing", "settings"];
const NAV_KEYS: Record<Page, string> = { dashboard: "D", projects: "P", billing: "B", settings: "," };

/** Sample data: nav items really switch the current page on the left */
export function useDemoGroups(t: Copy, mod: string, go: (page: Page) => void): CommandGroup[] {
  return useMemo(
    () => [
      {
        id: "navigation",
        heading: t.navigation,
        items: PAGES.map((page) => ({
          id: page,
          label: t.goTo[page],
          keywords: [t.pages[page], page],
          icon: <Icon d={ICONS[page]} />,
          shortcut: page === "settings" ? [mod, ","] : ["G", NAV_KEYS[page]],
          onSelect: () => go(page),
        })),
      },
      {
        id: "actions",
        heading: t.actions,
        items: [
          { id: "new-project", label: t.newProject, keywords: ["new", "create"], icon: <Icon d={ICONS.new} />, shortcut: [mod, "N"] },
          { id: "invite", label: t.invite, keywords: ["member", "user"], icon: <Icon d={ICONS.invite} /> },
          { id: "copy-link", label: t.copyLink, keywords: ["share", "url"], icon: <Icon d={ICONS.link} />, shortcut: [mod, "⇧", "C"] },
          { id: "export", label: t.exportCsv, keywords: ["download"], icon: <Icon d={ICONS.export} />, disabled: true },
        ],
      },
    ],
    [t, mod, go],
  );
}

export { copy as demoCopy };

const E1 =
  "shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(255_255_255/0.08)]";

/** Demo: an admin app frame with a real search button in the top bar (click or ⌘K opens the dialog), and an open command palette above the content. */
export default function CommandPaletteDemo() {
  const t = useDemoText(copy);
  const mod = useModKey();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState<Page>("dashboard");
  const groups = useDemoGroups(t, mod, setPage);

  return (
    <div className="flex h-[32rem] w-full max-w-[52rem] overflow-hidden rounded-xl bg-background text-foreground shadow-[0_0_0_1px_rgb(0_0_0/0.06)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.08)]">
      <aside className="hidden w-48 shrink-0 flex-col gap-1 border-r border-foreground/10 p-3 sm:flex">
        <p className="px-2 pt-1 pb-3 text-sm font-semibold tracking-tight">{t.app}</p>
        {PAGES.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPage(p)}
            aria-current={page === p ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-[background-color,color,scale] duration-150 hover:bg-foreground/[0.05] hover:duration-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-safe:active:scale-[0.97] [&_svg]:size-4",
              page === p ? "bg-foreground/[0.06] font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            <Icon d={ICONS[p]} />
            {t.pages[p]}
          </button>
        ))}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-foreground/10 px-4">
          <p className="truncate text-sm font-medium">{t.pages[page]}</p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-keyshortcuts="Meta+K Control+K"
            className={cn(
              "flex h-8 w-full max-w-56 items-center gap-2 rounded-md bg-card px-2.5 text-sm text-muted-foreground transition-[background-color,scale] duration-150 hover:bg-muted hover:duration-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-safe:active:scale-[0.97]",
              E1,
            )}
          >
            <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <span className="flex-1 truncate text-left">{t.search}</span>
            <span className="flex gap-1" aria-hidden="true">
              <Kbd>{mod}</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>
        </header>

        <main className="relative min-h-0 flex-1 overflow-hidden p-4">
          <div aria-hidden="true" className="grid grid-cols-3 gap-3">
            {t.stats.map(([label, value]) => (
              <div key={label} className="rounded-xl bg-card p-3 shadow-[0_0_0_1px_rgb(0_0_0/0.06)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.08)]">
                <p className="truncate text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-xl font-semibold tracking-tight tabular-nums">{value}</p>
              </div>
            ))}
          </div>
          <div aria-hidden="true" className="mt-3 h-40 rounded-xl bg-muted/60" />
          {/* Palette floats over the content: the content steps back one level, the palette stays fully usable */}
          <div aria-hidden="true" className="absolute inset-0 bg-background/60" />
          <div className="absolute inset-x-4 top-4 bottom-4 flex justify-center">
            <CommandPalette
              inline
              hotkey={false}
              groups={groups}
              placeholder={t.placeholder}
              labels={t.labels}
              defaultRecent={["new-project", "dashboard"]}
              className="h-full max-w-md"
            />
          </div>
        </main>
      </div>

      <CommandPalette
        groups={groups}
        open={open}
        onOpenChange={setOpen}
        placeholder={t.placeholder}
        labels={t.labels}
        defaultRecent={["new-project", "dashboard"]}
      />
    </div>
  );
}
