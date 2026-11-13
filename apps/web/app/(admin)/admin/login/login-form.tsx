"use client";

import { useActionState } from "react";

import { Icon } from "../icons";
import { loginWithToken, requestLoginLink, type LoginState } from "./actions";
import { GoogleButton } from "./google-button";

const LABEL = "text-xs font-medium text-subtle";
const INPUT =
  "h-10 w-full rounded-md border border-line bg-card px-3 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-subtle/60 focus:border-fg focus:shadow-[0_0_0_3px_var(--muted)]";
const BUTTON =
  "inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-fg px-4 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-50";
// 有 Google 按鈕時，email 是次要選項
const BUTTON_SECONDARY =
  "inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-line px-4 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50";

export function LoginForm({ googleClientId }: { googleClientId?: string }) {
  const [linkState, requestLink, sending] = useActionState<LoginState, FormData>(requestLoginLink, {});
  const [tokenState, submitToken, checking] = useActionState<LoginState, FormData>(loginWithToken, {});

  return (
    <div className="space-y-6">
      {googleClientId && (
        <>
          <GoogleButton clientId={googleClientId} />
          <div className="flex items-center gap-3 text-xs text-subtle">
            <span className="h-px flex-1 bg-line" />
            或用 email 收登入連結
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      {linkState.sent ? (
        <div role="status" className="flex gap-3 rounded-xl border border-line bg-card p-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Icon name="check" />
          </span>
          <div className="text-sm">
            <p className="font-medium">請到信箱收信</p>
            <p className="mt-1 text-subtle">
              如果這個 email 有後台權限，登入連結已經寄出，15 分鐘內有效。請用這個瀏覽器打開信裡的連結；沒收到的話看一下垃圾郵件。
            </p>
          </div>
        </div>
      ) : (
        <form action={requestLink} className="space-y-3">
          <label className="block space-y-1.5">
            <span className={LABEL}>Email</span>
            <input name="email" type="email" autoComplete="email" required placeholder="you@example.com" className={INPUT} />
          </label>
          {linkState.error && (
            <p role="alert" className="text-sm text-destructive">
              {linkState.error}
            </p>
          )}
          <button type="submit" disabled={sending} className={googleClientId ? BUTTON_SECONDARY : BUTTON}>
            {sending ? "寄送中…" : "寄登入連結"}
          </button>
        </form>
      )}

      <details className="group text-sm">
        <summary className="flex cursor-pointer list-none items-center gap-1 text-subtle hover:text-fg">
          <Icon name="arrow" className="size-3.5 transition-transform group-open:rotate-90" />
          改用權杖登入
        </summary>
        <form action={submitToken} className="mt-3 space-y-3">
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
          <button type="submit" disabled={checking} className="h-9 rounded-md border border-line px-4 transition-colors hover:bg-muted disabled:opacity-50">
            {checking ? "登入中…" : "用權杖登入"}
          </button>
        </form>
      </details>
    </div>
  );
}
