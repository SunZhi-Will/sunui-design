"use client";

import { useState } from "react";

import { ConfirmButton } from "./confirm-button";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

type Signup = { id: string; email: string; source: string; when: string; note?: string };

const initial: Signup[] = [
  { id: "ps_81f2", email: "mika.tan@example.com", source: "landing", when: "2 hours ago" },
  { id: "ps_7c09", email: "test+qa@example.com", source: "-", when: "yesterday", note: "Looks like test data" },
  { id: "ps_66ad", email: "o.ruiz@example.org", source: "newsletter", when: "3 days ago" },
];

export default function ConfirmButtonDemo() {
  const [rows, setRows] = useState(initial);
  const [exportedAt, setExportedAt] = useState<string>();

  return (
    <section aria-labelledby="presale-heading" className="w-full max-w-2xl rounded-xl border border-border bg-card text-card-foreground">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4">
        <div className="min-w-0">
          <h2 id="presale-heading" className="font-semibold tracking-tight">
            Presale signups
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Remove a signup only when the person asks, or it is clearly test data. Only the id stays in the audit log.
          </p>
        </div>
        <ConfirmButton
          variant="secondary"
          armedVariant="default"
          confirmLabel="Export and email CSV"
          action={async () => {
            await wait(600);
            setExportedAt("just now");
            return { ok: true, message: `Sent ${rows.length} rows to your inbox` };
          }}
        >
          Export
        </ConfirmButton>
      </header>

      <ul className="divide-y divide-border">
        {rows.map((r) => (
          <li key={r.id} className="flex items-start justify-between gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{r.email}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {r.source} · {r.when}
                {r.note ? ` · ${r.note}` : ""}
              </p>
            </div>
            <ConfirmButton
              variant="ghost"
              size="xs"
              confirmLabel="Remove signup"
              action={async () => {
                await wait(500);
                // 有一筆會被伺服器拒絕，示範失敗訊息
                if (r.id === "ps_66ad") return { ok: false, message: "Still in a paid order, can't remove" };
                setRows((list) => list.filter((x) => x.id !== r.id));
                return { ok: true, message: "Signup removed" };
              }}
            >
              Remove
            </ConfirmButton>
          </li>
        ))}
        {!rows.length && <li className="p-6 text-center text-sm text-muted-foreground">No signups yet.</li>}
      </ul>

      <footer className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground">
        <span className="tabular-nums">{rows.length} signups</span>
        <span>{exportedAt ? `Last export ${exportedAt}` : "Not exported yet"}</span>
      </footer>
    </section>
  );
}
