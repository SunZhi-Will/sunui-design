"use client";

import { BrowserFrame, PhoneFrame, Stage, WindowFrame } from "./window-frame";

function DocIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

export default function WindowFrameDemo() {
  return (
    <article className="w-full max-w-[52rem] space-y-6">
      <header>
        <p className="text-[11px] font-bold tracking-[0.16em] text-amber-700 uppercase dark:text-yellow-300">Interactive</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">Same request, two prompts</h2>
        <p className="mt-1 text-sm text-muted-foreground">One prompt guesses the format, the other names it. Compare what comes back.</p>
      </header>

      <Stage className="p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <WindowFrame title="prompt-v1.md" icon={<DocIcon />} tone="danger" right={<span className="text-[11px] text-red-600 dark:text-red-400">vague</span>}>
            <div className="space-y-2 p-4 font-mono text-[13px] leading-relaxed">
              <p>Summarise last week&apos;s orders.</p>
              <p className="text-[var(--wf-fg-muted)]">&gt; Last week was busy, with many orders across several categories...</p>
            </div>
          </WindowFrame>
          <WindowFrame title="prompt-v2.md" icon={<DocIcon />} tone="success" right={<span className="text-[11px] text-emerald-600 dark:text-emerald-400">clear</span>}>
            <div className="space-y-2 p-4 font-mono text-[13px] leading-relaxed">
              <p>Summarise last week&apos;s orders as 3 bullets: total, top product, refunds.</p>
              <p className="text-[var(--wf-fg-muted)]">&gt; 412 orders, $18.2k. Top: Stoneware Mug. 6 refunds.</p>
            </div>
          </WindowFrame>
        </div>
      </Stage>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,1fr)_auto]">
        <BrowserFrame url="shop.example.com/admin/orders" title="Orders" badge="Simulated" className="min-w-0">
          <div className="divide-y divide-[var(--wf-line)] text-sm">
            {[
              ["SU-20481", "Mia Chen", "$128.00"],
              ["SU-20480", "Leo Park", "$64.50"],
              ["SU-20479", "Ana Ruiz", "$219.00"],
            ].map(([id, name, total]) => (
              <div key={id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="font-mono text-xs text-[var(--wf-fg-muted)]">{id}</span>
                <span className="min-w-0 flex-1 truncate">{name}</span>
                <span className="tabular-nums">{total}</span>
              </div>
            ))}
          </div>
        </BrowserFrame>

        <PhoneFrame url="shop.example.com/cart" width={260} height={420} label="Buyer's phone" className="mx-auto">
          <div className="space-y-3 p-4 text-sm">
            <p className="font-semibold">Cart</p>
            {[
              ["Stoneware Mug", "$36.00"],
              ["Canvas Tote", "$24.00"],
            ].map(([name, price]) => (
              <div key={name} className="flex items-center gap-2">
                <span aria-hidden="true" className="size-9 shrink-0 rounded-lg bg-[var(--wf-sunken)]" />
                <span className="min-w-0 flex-1 truncate">{name}</span>
                <span className="tabular-nums">{price}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-[var(--wf-line)] pt-2 font-semibold">
              <span>Total</span>
              <span className="tabular-nums">$60.00</span>
            </div>
            <span className="block rounded-xl bg-[var(--wf-fg)] py-2.5 text-center font-semibold text-[var(--wf-surface)]">Pay $60.00</span>
          </div>
        </PhoneFrame>
      </div>
    </article>
  );
}
