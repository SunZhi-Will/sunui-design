"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";

import { ShoplineCardForm } from "@/components/shopline-card-form";

import { cancelRenewal, requestAccountLink, resumeRenewal, updateCard, type LinkState } from "./actions";

type LinkLabels = {
  email: string;
  placeholder: string;
  send: string;
  sending: string;
  sent: string;
  sentTitle: string;
  sentNote: string;
  resend: string;
};

export function LinkForm({ labels }: { labels: LinkLabels }) {
  // 換 key 重掛表單，「再寄一次」才能回到空白狀態
  const [round, setRound] = useState(0);
  return <LinkFormInner key={round} labels={labels} onAgain={() => setRound((n) => n + 1)} />;
}

function LinkFormInner({ labels, onAgain }: { labels: LinkLabels; onAgain: () => void }) {
  const [state, action, pending] = useActionState<LinkState, FormData>(requestAccountLink, {});
  if (state.sent) {
    return (
      <div role="status" className="rounded-xl bg-card p-5 shadow-e1">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-fg text-bg shadow-[inset_0_1px_0_rgb(255_255_255/0.15)]">
            <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium">{labels.sentTitle}</p>
            <p className="text-sm text-subtle">{labels.sent}</p>
            <p className="text-xs text-subtle">{labels.sentNote}</p>
          </div>
        </div>
        {state.devLink && (
          <a href={state.devLink} className="mt-3 block break-all font-mono text-xs underline underline-offset-2">
            {state.devLink}
          </a>
        )}
        <button type="button" onClick={onAgain} className="mt-4 text-sm font-medium underline underline-offset-4 hover:text-subtle">
          {labels.resend}
        </button>
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
          placeholder={labels.placeholder}
          required
          className="h-11 w-full rounded-md bg-card px-3.5 text-[15px] shadow-e1 outline-none transition-shadow placeholder:text-subtle/60 focus:shadow-[0_0_0_1px_var(--color-fg)]"
        />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="h-11 w-full rounded-md px-4 text-[15px] font-medium disabled:opacity-50 btn-primary">
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
  cancelConfirm: string;
  cancelConfirmYes: string;
  keep: string;
};

export function RenewalActions({
  token,
  autoRenew,
  canResume,
  pastDue,
  card,
  portal,
  labels,
}: {
  token: string;
  autoRenew: boolean;
  canResume: boolean;
  /** 扣款失敗：換卡是最重要的動作，排到最前面 */
  pastDue: boolean;
  card: { config: { clientKey: string; merchantId: string; sandbox: boolean }; language: string } | null;
  portal: string | null;
  labels: Labels;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [showCard, setShowCard] = useState(false);
  const [confirming, setConfirming] = useState(false);

  function run(action: (token: string) => Promise<{ ok?: boolean; error?: string }>, done: string) {
    setError(undefined);
    setMessage(undefined);
    startTransition(async () => {
      const result = await action(token);
      setConfirming(false);
      if (result.error) setError(result.error);
      else {
        setMessage(done);
        router.refresh();
      }
    });
  }

  const secondary = "inline-flex h-10 items-center rounded-md px-4 text-sm font-medium disabled:opacity-50 btn-secondary";
  const primary = "inline-flex h-10 items-center rounded-md px-4 text-sm font-medium disabled:opacity-50 btn-primary";

  const renewal = autoRenew ? (
    confirming ? (
      <div key="renewal" className="space-y-3 rounded-lg bg-bg p-4 shadow-hair">
        <p className="text-sm font-medium">{labels.cancelConfirm}</p>
        <p className="text-xs text-subtle">{labels.cancelNote}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={pending} onClick={() => run(cancelRenewal, labels.canceled)} className={secondary}>
            {labels.cancelConfirmYes}
          </button>
          <button type="button" disabled={pending} onClick={() => setConfirming(false)} className={primary}>
            {labels.keep}
          </button>
        </div>
      </div>
    ) : (
      <div key="renewal">
        <button type="button" onClick={() => setConfirming(true)} className="text-sm text-subtle underline underline-offset-4 hover:text-fg">
          {labels.cancel}
        </button>
      </div>
    )
  ) : canResume ? (
    <div key="renewal">
      <button type="button" disabled={pending} onClick={() => run(resumeRenewal, labels.resumed)} className={primary}>
        {labels.resume}
      </button>
    </div>
  ) : null;

  const billing = (portal || card) && (
    <div key="billing" className="space-y-3">
      {portal && (
        <div className="space-y-2">
          <a href={portal} className={pastDue ? primary : secondary}>
            {labels.portal}
          </a>
          <p className="text-xs text-subtle">{labels.portalLead}</p>
        </div>
      )}
      {card &&
        (showCard ? (
          <div className="space-y-3">
            <p className="text-xs text-subtle">{labels.updateCardLead}</p>
            <ShoplineCardForm
              config={card.config}
              amountMinor={100}
              language={card.language}
              doneUrl={`/account?t=${token}&card=1`}
              labels={{ loading: labels.loading, loadError: labels.loadError, submit: labels.saveCard, pending: labels.pending, failed: labels.cardFailed }}
              onPaySession={(paySession) => updateCard(token, paySession)}
            />
          </div>
        ) : (
          <button type="button" onClick={() => setShowCard(true)} className={pastDue ? primary : secondary}>
            {labels.updateCard}
          </button>
        ))}
    </div>
  );

  // 平常：管理帳單在前，取消續扣是低調的文字連結放最後。恢復續扣（已取消時）是主要動作，排前面。
  const order = !autoRenew && canResume && !pastDue ? [renewal, billing] : [billing, renewal];

  return (
    <div className="space-y-6">
      {(message || error) && (
        <p role={error ? "alert" : "status"} className={error ? "text-sm text-destructive" : "text-sm"}>
          {error ?? message}
        </p>
      )}
      {order}
    </div>
  );
}
