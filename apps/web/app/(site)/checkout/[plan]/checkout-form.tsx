"use client";

import { useActionState } from "react";

import { startCheckout, type CheckoutState } from "../actions";

export function CheckoutForm({
  plan,
  t,
}: {
  plan: string;
  t: { emailLabel: string; emailHint: string; pay: string; paying: string };
}) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(startCheckout, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="plan" value={plan} />
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">{t.emailLabel}</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-11 w-full rounded-md border border-line bg-bg px-3 text-sm outline-none focus:border-fg"
        />
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
  );
}
