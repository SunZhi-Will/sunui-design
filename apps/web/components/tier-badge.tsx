import type { Tier } from "@/lib/registry";
import { cn } from "@/lib/utils";

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        tier === "pro" ? "bg-accent text-accent-fg" : "bg-stage text-muted",
      )}
    >
      {tier}
    </span>
  );
}
