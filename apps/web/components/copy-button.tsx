"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export function CopyButton({
  value,
  className,
  labels = { copy: "Copy", copied: "Copied" },
}: {
  value: string;
  className?: string;
  labels?: { copy: string; copied: string };
}) {
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
        "shrink-0 rounded-md border whitespace-nowrap border-line bg-card px-2.5 py-1 text-xs font-medium text-subtle transition-colors hover:text-fg",
        className,
      )}
    >
      {copied ? labels.copied : labels.copy}
    </button>
  );
}
