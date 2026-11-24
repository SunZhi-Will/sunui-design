"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ConfirmButton } from "./confirm-button";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const copy = {
  en: {
    rows: [
      { email: "test+qa@example.com", meta: "Presale signup · yesterday · Looks like test data" },
      { email: "mei.lin@northbound.studio", meta: "Presale signup · 2 days ago" },
      { email: "kai@workroom.goods", meta: "Waitlist · last week" },
    ],
    confirm: "Remove signup",
    removed: "Signup removed",
    remove: "Remove",
  },
  "zh-TW": {
    rows: [
      { email: "test+qa@example.com", meta: "預購登記 · 昨天 · 看起來是測試資料" },
      { email: "mei.lin@northbound.studio", meta: "預購登記 · 2 天前" },
      { email: "kai@workroom.goods", meta: "候補名單 · 上週" },
    ],
    confirm: "移除登記",
    removed: "已移除登記",
    remove: "移除",
  },
  "zh-CN": {
    rows: [
      { email: "test+qa@example.com", meta: "预购登记 · 昨天 · 看起来是测试数据" },
      { email: "mei.lin@northbound.studio", meta: "预购登记 · 2 天前" },
      { email: "kai@workroom.goods", meta: "候补名单 · 上周" },
    ],
    confirm: "移除登记",
    removed: "已移除登记",
    remove: "移除",
  },
  ja: {
    rows: [
      { email: "test+qa@example.com", meta: "予約登録 · 昨日 · テストデータのようです" },
      { email: "mei.lin@northbound.studio", meta: "予約登録 · 2日前" },
      { email: "kai@workroom.goods", meta: "ウェイトリスト · 先週" },
    ],
    confirm: "登録を削除",
    removed: "登録を削除しました",
    remove: "削除",
  },
};

export default function ConfirmButtonDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [removed, setRemoved] = useState<number[]>([]);

  // Three rows so the steel keys read as a set at catalog size; the first row is the one the card video presses
  return (
    <ul className="w-full max-w-md min-w-0 divide-y divide-border rounded-xl border border-border bg-card text-card-foreground">
      {t.rows.map((row, i) => {
        const gone = removed.includes(i);
        return (
          <li key={row.email} className="flex items-start justify-between gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-medium ${gone ? "text-muted-foreground line-through" : ""}`}>{row.email}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{row.meta}</p>
            </div>
            <ConfirmButton
              locale={locale}
              confirmLabel={t.confirm}
              disabled={gone}
              action={async () => {
                await wait(500);
                setRemoved((r) => [...r, i]);
                return { ok: true, message: t.removed };
              }}
            >
              {t.remove}
            </ConfirmButton>
          </li>
        );
      })}
    </ul>
  );
}
