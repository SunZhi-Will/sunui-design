"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ConfirmButton } from "./confirm-button";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const copy = {
  en: { meta: "Presale signup · yesterday · Looks like test data", confirm: "Remove signup", removed: "Signup removed", remove: "Remove" },
  "zh-TW": { meta: "預購登記 · 昨天 · 看起來是測試資料", confirm: "移除登記", removed: "已移除登記", remove: "移除" },
  "zh-CN": { meta: "预购登记 · 昨天 · 看起来是测试数据", confirm: "移除登记", removed: "已移除登记", remove: "移除" },
  ja: { meta: "予約登録 · 昨日 · テストデータのようです", confirm: "登録を削除", removed: "登録を削除しました", remove: "削除" },
};

export default function ConfirmButtonDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [removed, setRemoved] = useState(false);

  return (
    <div className="flex w-full max-w-md min-w-0 items-start justify-between gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground">
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${removed ? "text-muted-foreground line-through" : ""}`}>test+qa@example.com</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{t.meta}</p>
      </div>
      <ConfirmButton
        variant="ghost"
        size="xs"
        locale={locale}
        confirmLabel={t.confirm}
        disabled={removed}
        action={async () => {
          await wait(500);
          setRemoved(true);
          return { ok: true, message: t.removed };
        }}
      >
        {t.remove}
      </ConfirmButton>
    </div>
  );
}
