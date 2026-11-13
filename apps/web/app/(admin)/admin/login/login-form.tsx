"use client";

import { useActionState } from "react";

import { loginWithToken, requestLoginLink, type LoginState } from "./actions";

const INPUT = "w-full rounded-md border border-line bg-card px-3 py-2 text-sm outline-none focus:border-fg";
const BUTTON =
  "w-full rounded-md bg-fg px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-50";

export function LoginForm() {
  const [linkState, requestLink, sending] = useActionState<LoginState, FormData>(requestLoginLink, {});
  const [tokenState, submitToken, checking] = useActionState<LoginState, FormData>(loginWithToken, {});

  return (
    <div className="mt-6">
      {linkState.sent ? (
        <div role="status" className="rounded-xl border border-line bg-card p-4 text-sm">
          <p className="font-medium">請到信箱收信</p>
          <p className="mt-1 text-subtle">
            如果這個 email 有後台權限，登入連結已經寄出（15 分鐘內有效）。請用這個瀏覽器打開信裡的連結。沒收到的話看一下垃圾郵件。
          </p>
        </div>
      ) : (
        <form action={requestLink} className="grid gap-3">
          <label className="grid gap-1.5 text-sm">
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" required className={INPUT} />
          </label>
          {linkState.error && (
            <p role="alert" className="text-sm text-destructive">
              {linkState.error}
            </p>
          )}
          <button type="submit" disabled={sending} className={BUTTON}>
            {sending ? "寄送中…" : "寄登入連結"}
          </button>
        </form>
      )}

      <details className="mt-8 text-sm">
        <summary className="cursor-pointer text-subtle hover:text-fg">改用權杖登入</summary>
        <form action={submitToken} className="mt-3 grid gap-3">
          <input
            name="token"
            type="password"
            autoComplete="current-password"
            required
            aria-label="SUNUI_ADMIN_TOKEN"
            placeholder="SUNUI_ADMIN_TOKEN"
            className={INPUT}
          />
          {tokenState.error && (
            <p role="alert" className="text-sm text-destructive">
              {tokenState.error}
            </p>
          )}
          <button type="submit" disabled={checking} className="rounded-md border border-line px-4 py-2 transition-colors hover:bg-muted disabled:opacity-50">
            {checking ? "登入中…" : "登入"}
          </button>
        </form>
      </details>
    </div>
  );
}
