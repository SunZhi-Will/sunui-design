"use client";

import { useActionState, useState } from "react";

import { GoogleButton } from "@/components/google-button";

import { googleCheckoutEmail, startCheckout, type CheckoutState } from "../actions";

type GoogleCopy = { button: string; pending: string; loadError: string; failed: string; divider: string; filled: string; change: string };

export function CheckoutForm({
  plan,
  currency,
  googleClientId,
  locale,
  t,
}: {
  plan: string;
  currency: "twd" | "usd";
  /** 有設定 GOOGLE_CLIENT_ID 才顯示「用 Google 繼續」 */
  googleClientId?: string;
  locale: string;
  t: { emailLabel: string; emailHint: string; pay: string; paying: string; google: GoogleCopy };
}) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(startCheckout, {});
  const [email, setEmail] = useState("");
  // Google 驗證過的 email；使用者改了欄位內容就不再標示為已驗證
  const [verified, setVerified] = useState<string>();
  const fromGoogle = verified !== undefined && verified === email;

  return (
    <div className="space-y-3">
      {googleClientId && (
        <>
          <GoogleButton
            clientId={googleClientId}
            locale={locale}
            className="rounded-md border border-line bg-card text-fg hover:bg-muted"
            labels={{ idle: t.google.button, pending: t.google.pending, loadError: t.google.loadError }}
            onCredential={async (credential) => {
              const result = await googleCheckoutEmail(credential);
              if (!result.email) return result.error ?? t.google.failed;
              setEmail(result.email);
              setVerified(result.email);
              return undefined;
            }}
          />
          <div className="flex items-center gap-3 text-xs text-subtle">
            <span className="h-px flex-1 bg-line" />
            {t.google.divider}
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      <form action={action} className="space-y-3">
        <input type="hidden" name="plan" value={plan} />
        <input type="hidden" name="currency" value={currency} />
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{t.emailLabel}</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-md border border-line bg-bg px-3 text-sm outline-none focus:border-fg"
          />
          {fromGoogle ? (
            <span className="flex items-center gap-2 text-xs text-subtle">
              <span className="text-emerald-700 dark:text-emerald-400">✓ {t.google.filled}</span>
              <button
                type="button"
                onClick={() => {
                  setEmail("");
                  setVerified(undefined);
                }}
                className="underline underline-offset-2 hover:text-fg"
              >
                {t.google.change}
              </button>
            </span>
          ) : null}
          <span className="block text-xs text-subtle">{t.emailHint}</span>
        </label>
        {state.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="h-11 w-full rounded-md bg-accent px-4 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? t.paying : t.pay}
        </button>
      </form>
    </div>
  );
}
