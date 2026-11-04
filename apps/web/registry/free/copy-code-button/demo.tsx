"use client";

import { useState } from "react";

import { CopyCodeButton } from "./copy-code-button";

export default function CopyCodeButtonDemo() {
  const [log, setLog] = useState<string | null>(null);

  return (
    <div className="w-full max-w-lg space-y-6 rounded-2xl border border-border bg-card p-6 text-card-foreground">
      <div>
        <p className="text-base font-semibold">Welcome gift</p>
        <p className="text-sm text-muted-foreground">Use this code at checkout for 20% off your first order.</p>
      </div>
      <div className="flex flex-wrap items-end gap-4 pt-6">
        <CopyCodeButton code="SUNNY20" caption="20% off" size="lg" onCopy={(c) => setLog(c)} />
        <CopyCodeButton code="FREESHIP" size="sm" onCopy={(c) => setLog(c)} />
      </div>
      <p className="text-xs text-muted-foreground" aria-hidden="true">
        {log ? `Last copied: ${log}` : "Tab to a copy button and press Enter or Space."}
      </p>
    </div>
  );
}
