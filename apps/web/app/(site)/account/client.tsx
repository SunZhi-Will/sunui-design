"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";

import { ShoplineCardForm } from "@/components/shopline-card-form";

import { cancelRenewal, requestAccountLink, resumeRenewal, updateCard, type LinkState } from "./actions";

export function LinkForm({ labels }: { labels: { email: string; send: string; sending: string; sent: string } }) {
  const [state, action, pending] = useActionState<LinkState, FormData>(requestAccountLink, {});
  if (state.sent) {
    return (
      <div className="space-y-2">
        <p className="text-sm">{labels.sent}</p>
        {state.devLink && (
          <a href={state.devLink} className="block break-all font-mono text-xs underline underline-offset-2">
            {state.devLink}
          </a>
        )}
      </div>
    );
  }
  return (
    <form action={action} className="space-y-3">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">{labels.email}</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-11 w-full rounded-md border border-line bg-bg px-3 text-sm outline-none focus:border-fg"
        />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="h-11 w-full rounded-md px-4 text-sm font-medium disabled:opacity-50 btn-primary">
        {pending ? labels.sending : labels.send}
      </button>
    </form>
  );
}

type Labels = {
  cancel: string;
  cancelNote: string;
  canceled: string;
  resume: string;
  resumed: string;
  updateCard: string;
  updateCardLead: string;
  saveCard: string;
  cardSaved: string;
  portal: string;
  portalLead: string;
  failed: string;
  loading: string;
  loadError: string;
  pending: string;
  cardFailed: string;
};

export function RenewalActions({
  token,
  autoRenew,
  canResume,
  card,
  portal,
  labels,
}: {
  token: string;
  autoRenew: boolean;
  canResume: boolean;
  card: { config: { clientKey: string; merchantId: string; sandbox: boolean }; language: string } | null;
  portal: string | null;
  labels: Labels;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [showCard, setShowCard] = useState(false);

  function run(action: (token: string) => Promise<{ ok?: boolean; error?: string }>, done: string) {
    setError(undefined);
    setMessage(undefined);
    startTransition(async () => {
      const result = await action(token);
      if (result.error) setError(result.error);
      else {
        setMessage(done);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {autoRenew ? (
        <div className="space-y-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => run(cancelRenewal, labels.canceled)}
            className="h-10 rounded-md border border-line px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            {labels.cancel}
          </button>
          <p className="text-xs text-subtle">{labels.cancelNote}</p>
        </div>
      ) : (
        canResume && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(resumeRenewal, labels.resumed)}
            className="h-10 rounded-md px-4 text-sm font-medium disabled:opacity-50 btn-primary"
          >
            {labels.resume}
          </button>
        )
      )}

      {message && <p className="text-sm">{message}</p>}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {portal && (
        <div className="space-y-2">
          <a href={portal} className="inline-flex h-10 items-center rounded-md border border-line px-4 text-sm font-medium hover:bg-muted">
            {labels.portal}
          </a>
          <p className="text-xs text-subtle">{labels.portalLead}</p>
        </div>
      )}

      {card && (
        <div className="space-y-3">
          {showCard ? (
            <>
              <p className="text-xs text-subtle">{labels.updateCardLead}</p>
              <ShoplineCardForm
                config={card.config}
                amountMinor={100}
                language={card.language}
                doneUrl={`/account?t=${token}&card=1`}
                labels={{ loading: labels.loading, loadError: labels.loadError, submit: labels.saveCard, pending: labels.pending, failed: labels.cardFailed }}
                onPaySession={(paySession) => updateCard(token, paySession)}
              />
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowCard(true)}
              className="h-10 rounded-md border border-line px-4 text-sm font-medium hover:bg-muted"
            >
              {labels.updateCard}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
