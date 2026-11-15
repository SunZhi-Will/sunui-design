"use client";

import { useActionState } from "react";

import { reissue, type ReissueState } from "./actions";

export function ReissueButton({ licenseId, label }: { licenseId: string; label: string }) {
  const [state, action, pending] = useActionState<ReissueState, FormData>(reissue, {});
  if (state.key) {
    return (
      <div role="status" className="max-w-56 text-xs">
        <p className="text-emerald-700 dark:text-emerald-400">已重發{state.emailed ? "並寄給購買人" : "（寄信失敗，請手動轉交）"}</p>
        <code className="mt-1 block font-mono break-all select-all">{state.key}</code>
      </div>
    );
  }
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`撤銷 ${label} 並發一把新的？舊的授權碼會立刻不能再安裝。`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="licenseId" value={licenseId} />
      <button
        type="submit"
        disabled={pending}
        className="h-7 rounded-md border border-line px-2.5 text-xs whitespace-nowrap transition-colors hover:bg-muted disabled:opacity-50"
      >
        {pending ? "處理中…" : "重發"}
      </button>
      {state.error && (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
