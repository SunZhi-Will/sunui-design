"use client";

import { useActionState } from "react";

import { testShopline, type TestState } from "./actions";

export function TestConnection() {
  const [state, action, pending] = useActionState<TestState>(testShopline, {});
  return (
    <div className="space-y-3 text-sm">
      <p className="text-subtle">
        用目前的金鑰向 SHOPLINE 建立一個 Pro 的結帳，確認請求被接受。只建立付款頁，不付款就不會扣款，付款頁 60 分鐘後失效。這筆訂單會標成測試，不算進統計。
      </p>
      <form action={action}>
        <button type="submit" disabled={pending} className="h-9 rounded-md border border-line px-4 transition-colors hover:bg-muted disabled:opacity-50">
          {pending ? "建立中…" : "測試 SHOPLINE 連線"}
        </button>
      </form>
      {state.error && (
        <p role="alert" className="text-destructive">
          {state.error}
        </p>
      )}
      {state.url && (
        <div role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5">
          <p className="font-medium text-emerald-700 dark:text-emerald-400">連線成功，SHOPLINE 已建立付款頁（NT${state.amount?.toLocaleString("en-US")}）。</p>
          <p className="mt-1 text-subtle">
            可以打開看金額與商品名稱是否正確，<strong>不要輸入卡號</strong>：{" "}
            <a href={state.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              開啟付款頁
            </a>
          </p>
          <p className="mt-1 font-mono text-xs text-subtle">{state.orderId}</p>
        </div>
      )}
    </div>
  );
}
