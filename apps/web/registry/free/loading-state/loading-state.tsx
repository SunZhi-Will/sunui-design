"use client";

import { cn } from "@/lib/utils";

/* ---------- Loading ---------- */

export interface LoadingStateProps {
  rows?: number;
  label?: string;
  className?: string;
}

export function LoadingState({ rows = 4, label = "Loading", className }: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)} role="status" aria-label={label}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-11 w-full animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
      ))}
    </div>
  );
}
