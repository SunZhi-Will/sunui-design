"use client";

import { useState } from "react";

import { ConfirmButton } from "./confirm-button";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function ConfirmButtonDemo() {
  const [removed, setRemoved] = useState(false);

  return (
    <div className="flex w-full max-w-md min-w-0 items-start justify-between gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground">
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${removed ? "text-muted-foreground line-through" : ""}`}>test+qa@example.com</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">Presale signup · yesterday · Looks like test data</p>
      </div>
      <ConfirmButton
        variant="ghost"
        size="xs"
        confirmLabel="Remove signup"
        disabled={removed}
        action={async () => {
          await wait(500);
          setRemoved(true);
          return { ok: true, message: "Signup removed" };
        }}
      >
        Remove
      </ConfirmButton>
    </div>
  );
}
