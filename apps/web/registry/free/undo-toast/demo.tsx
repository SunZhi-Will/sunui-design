"use client";

import { useState } from "react";

import { UndoToaster, useToaster, useUndoable } from "./undo-toast";

type Member = { id: string; name: string };
type Bill = { members: Member[]; items: { id: string; name: string; eaters: string[] }[]; payerId: string | null };

const sample: Bill = {
  members: [
    { id: "m1", name: "Amy" },
    { id: "m2", name: "Ben" },
    { id: "m3", name: "Chloe" },
    { id: "m4", name: "Dev" },
  ],
  items: [
    { id: "i1", name: "Beef noodles", eaters: ["m1"] },
    { id: "i2", name: "Carbonara", eaters: ["m2"] },
    { id: "i3", name: "Bubble tea", eaters: ["m3", "m4"] },
    { id: "i4", name: "Fries", eaters: ["m1", "m2", "m3", "m4"] },
  ],
  payerId: "m1",
};

// 成員識別色（照 spliteat-web 的色盤，從第 2 色開始）
const colors = [
  { bg: "#DCFCE7", fg: "#16A34A" },
  { bg: "#FEF3C7", fg: "#D97706" },
  { bg: "#FCE7F3", fg: "#DB2777" },
  { bg: "#EDE9FE", fg: "#7C3AED" },
];

export default function UndoToastDemo() {
  const [bill, setBill] = useState(sample);
  const toaster = useToaster();
  const undoable = useUndoable(bill, setBill, toaster, { isEmpty: (b) => !b.members.length && !b.items.length });

  const remove = (m: Member) =>
    undoable((b) => {
      const members = b.members.filter((x) => x.id !== m.id);
      return {
        ...b,
        members,
        items: b.items.map((it) => ({ ...it, eaters: it.eaters.filter((x) => x !== m.id) })),
        payerId: b.payerId === m.id ? (members[0]?.id ?? null) : b.payerId,
      };
    }, `Removed ${m.name}`);

  const hasData = bill.members.length > 0 || bill.items.length > 0;

  return (
    <div className="relative w-full max-w-2xl min-w-0 pt-20">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Members</h2>
          <p className="text-sm text-muted-foreground">List order decides who covers leftover cents.</p>
        </div>
        <button
          type="button"
          disabled={!hasData}
          onClick={() => undoable(() => ({ members: [], items: [], payerId: null }), "Bill cleared")}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-all hover:bg-muted active:translate-y-px disabled:pointer-events-none disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Clear
        </button>
      </div>

      <section aria-labelledby="members-title" className="overflow-hidden rounded-xl border border-border bg-card text-sm">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h3 id="members-title" className="text-sm font-semibold">
            Who&apos;s eating
          </h3>
          <span className="text-xs text-muted-foreground tabular-nums">{bill.members.length} people</span>
        </div>
        {bill.members.length ? (
          <ol className="divide-y divide-border" aria-label="Members">
            {bill.members.map((m, i) => {
              const c = colors[i % colors.length];
              const n = bill.items.filter((it) => it.eaters.includes(m.id)).length;
              return (
                <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium" style={{ backgroundColor: c.bg, color: c.fg }}>
                    {m.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      {m.name}
                      {m.id === bill.payerId && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Paid</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      #{i + 1} · {n ? `ate ${n} ${n === 1 ? "dish" : "dishes"}` : "no dishes yet"}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${m.name}`}
                    onClick={() => remove(m)}
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:size-8"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      <line x1="10" x2="10" y1="11" y2="17" />
                      <line x1="14" x2="14" y1="11" y2="17" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-medium">No one yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Use Undo on the toast above to bring everyone back.</p>
          </div>
        )}
      </section>

      <UndoToaster toaster={toaster} fixed={false} />
    </div>
  );
}
