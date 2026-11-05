"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { LoadingButton } from "./loading-button";

const copy = {
  en: { subscribe: "Subscribe", subscribed: "Subscribed", email: "Email for restock news", pay: "Pay $68.00", paid: "Paid", apply: "Apply code", invalid: "Code expired", loading: "Working", hint: "This code fails on purpose so you can see the error state." },
  "zh-TW": { subscribe: "訂閱", subscribed: "已訂閱", email: "補貨通知的 Email", pay: "付款 NT$1,980", paid: "已付款", apply: "套用折扣碼", invalid: "折扣碼已過期", loading: "處理中", hint: "這組折扣碼會刻意失敗，展示錯誤狀態。" },
  "zh-CN": { subscribe: "订阅", subscribed: "已订阅", email: "到货通知的 Email", pay: "支付 ¥468", paid: "已支付", apply: "使用优惠码", invalid: "优惠码已过期", loading: "处理中", hint: "这个优惠码会故意失败，用来展示错误状态。" },
  ja: { subscribe: "登録する", subscribed: "登録しました", email: "再入荷のお知らせ用メール", pay: "¥9,900 を支払う", paid: "支払い完了", apply: "コードを適用", invalid: "期限切れのコード", loading: "処理中", hint: "このコードは失敗する設定です。エラー状態を確認できます。" },
};

const wait = (ms: number, fail = false) => new Promise<void>((resolve, reject) => setTimeout(fail ? reject : resolve, ms));

export default function LoadingButtonDemo() {
  const t = useDemoText(copy);
  const [email, setEmail] = useState("");
  return (
    <div className="w-full max-w-md space-y-6 rounded-lg border bg-background p-6">
      <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.email}
          aria-label={t.email}
          className="h-10 min-w-0 flex-1 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <LoadingButton onClick={() => wait(1400)} successLabel={t.subscribed} loadingLabel={t.loading}>
          {t.subscribe}
        </LoadingButton>
      </form>

      <LoadingButton className="w-full tabular-nums" loadingStyle="inline" onClick={() => wait(1800)} successLabel={t.paid} loadingLabel={t.loading} resetAfter={0}>
        {t.pay}
      </LoadingButton>

      <div className="flex items-center gap-3">
        <span className="rounded-md border border-dashed border-[#e2e2e2] px-3 py-2 font-mono text-sm tracking-[0.12em] dark:border-[#333333]">SUMMER24</span>
        <LoadingButton variant="paper" onClick={() => wait(1000, true)} errorLabel={t.invalid} loadingLabel={t.loading}>
          {t.apply}
        </LoadingButton>
      </div>
      <p className="text-xs text-muted-foreground">{t.hint}</p>
    </div>
  );
}
