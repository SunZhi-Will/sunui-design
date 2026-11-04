"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export function CopyButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "rounded-md border border-line bg-card px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:text-fg",
        className,
      )}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
