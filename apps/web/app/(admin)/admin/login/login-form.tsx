"use client";

import { useActionState } from "react";

import { Icon } from "../icons";
import { requestLoginLink, type LoginState } from "./actions";
import { GoogleButton } from "./google-button";

const INPUT =
  "h-10 w-full rounded-md border border-line bg-bg px-3 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-subtle/60 focus:border-fg focus:shadow-[0_0_0_3px_var(--muted)]";
const PRIMARY =
  "inline-flex h-10 w-full items-center justify-center rounded-md bg-fg px-4 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-50";
const SECONDARY =
  "inline-flex h-10 w-full items-center justify-center rounded-md border border-line px-4 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50";

/** 主要是 Google；email 登入連結是第二選項。 */
export function LoginForm({ googleClientId }: { googleClientId?: string }) {
  const [linkState, requestLink, sending] = useActionState<LoginState, FormData>(requestLoginLink, {});

  if (linkState.sent) {
    return (
      <div role="status" className="flex gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Icon name="check" />
        </span>
        <div className="text-sm">
          <p className="font-medium">請到信箱收信</p>
          <p className="mt-1 text-subtle">如果這個 email 有權限，登入連結已經寄出（15 分鐘內有效）。請用這個瀏覽器開啟；沒收到的話看一下垃圾郵件。</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {googleClientId && (
        <>
          <GoogleButton clientId={googleClientId} />
          <div className="my-5 flex items-center gap-3 text-xs text-subtle">
            <span className="h-px flex-1 bg-line" />或<span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      <form action={requestLink} className="space-y-2.5">
        <input name="email" type="email" autoComplete="email" required aria-label="Email" placeholder="輸入 email 收登入連結" className={INPUT} />
        {linkState.error && (
          <p role="alert" className="text-sm text-destructive">
            {linkState.error}
          </p>
        )}
        <button type="submit" disabled={sending} className={googleClientId ? SECONDARY : PRIMARY}>
          {sending ? "寄送中…" : "寄登入連結"}
        </button>
      </form>
    </div>
  );
}
