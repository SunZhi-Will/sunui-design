"use client";

import { useState, type MouseEvent } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { AppShell } from "./app-shell";
import { buildAccount, buildGroups, buildWorkspace, shellCopy } from "./demo-data";

const listCopy = {
  en: { rows: ["Open 07:00", "Mid 11:00", "Close 16:00"] },
  "zh-TW": { rows: ["早班 07:00", "中班 11:00", "晚班 16:00"] },
  "zh-CN": { rows: ["早班 07:00", "中班 11:00", "晚班 16:00"] },
  ja: { rows: ["早番 07:00", "中番 11:00", "遅番 16:00"] },
};

/** 型錄卡片：手機寬度的外殼，點底部分頁切頁，點「更多」拉出所有頁面的抽屜。 */
export default function AppShellCard() {
  const locale = useDemoLocale();
  const t = useDemoText(shellCopy);
  const l = useDemoText(listCopy);
  const [href, setHref] = useState("/");
  const [store, setStore] = useState("s0");
  const groups = buildGroups(t, 3);
  const label = groups[0].items.flatMap((e) => ("children" in e ? e.children : [e])).find((i) => i.href === href)?.label;

  return (
    <div className="mx-auto h-[420px] w-[340px] overflow-hidden rounded-[24px] border border-border">
      <AppShell
        key={locale}
        locale={locale}
        groups={groups}
        activeHref={href}
        onNavigate={(next: string, e: MouseEvent<HTMLAnchorElement>) => {
          e.preventDefault();
          setHref(next);
        }}
        brand={{ name: t.brand }}
        workspace={buildWorkspace(t, store, setStore)}
        account={buildAccount(t)}
        shortcut={false}
      >
        <h1 className="text-[26px] leading-tight font-bold tracking-tight">{label ?? t.schedule}</h1>
        <ul className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {l.rows.map((row) => (
            <li key={row} className="flex items-center gap-3 px-3 py-2.5">
              <span className="size-7 shrink-0 rounded-md bg-muted" />
              <span className="text-sm">{row}</span>
            </li>
          ))}
        </ul>
      </AppShell>
    </div>
  );
}
