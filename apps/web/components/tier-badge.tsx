import { getI18n } from "@/lib/i18n-server";
import type { Tier } from "@/lib/registry";
import { cn } from "@/lib/utils";

export async function TierBadge({ tier }: { tier: Tier }) {
  const { m } = await getI18n();
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        tier === "pro" ? "bg-accent text-accent-fg" : "bg-stage text-subtle",
      )}
    >
      {m.tier[tier]}
    </span>
  );
}
