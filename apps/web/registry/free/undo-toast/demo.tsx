"use client";

import { useState } from "react";

import { UndoToaster, useToaster, useUndoable } from "./undo-toast";

type Member = { id: string; name: string; dishes: number };

const sample: Member[] = [
  { id: "m1", name: "Amy", dishes: 2 },
  { id: "m2", name: "Ben", dishes: 1 },
  { id: "m3", name: "Chloe", dishes: 3 },
];

export default function UndoToastDemo() {
  const [members, setMembers] = useState(sample);
  const toaster = useToaster();
  const undoable = useUndoable(members, setMembers, toaster);

  return (
    <div className="relative w-full max-w-2xl min-w-0 pt-20">
      <section aria-labelledby="members-title" className="overflow-hidden rounded-xl border border-border bg-card text-sm">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h3 id="members-title" className="text-sm font-semibold">Who&apos;s eating</h3>
          <span className="text-xs text-muted-foreground tabular-nums">{members.length} people</span>
        </div>
        <ol className="divide-y divide-border" aria-label="Members">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-4 py-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7] text-xs font-medium text-[#16A34A]">{m.name[0]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{m.name}</p>
                <p className="text-xs text-muted-foreground tabular-nums">ate {m.dishes} {m.dishes === 1 ? "dish" : "dishes"}</p>
              </div>
              <button
                type="button"
                aria-label={`Remove ${m.name}`}
                onClick={() => undoable((list) => list.filter((x) => x.id !== m.id), `Removed ${m.name}`)}
                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground md:size-8"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4">
                  <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            </li>
          ))}
        </ol>
        {!members.length && <p className="px-4 py-10 text-center text-sm text-muted-foreground">No one yet. Use Undo on the toast.</p>}
      </section>
      <UndoToaster toaster={toaster} fixed={false} />
    </div>
  );
}
