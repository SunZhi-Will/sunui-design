import type { RegistryItem, Series } from "@/lib/registry";

export const seriesLabels: Record<Series, string> = {
  paper: "Paper",
  product: "Product UI",
  story: "Story",
  classic: "Classic SunUI",
  cardflow: "CardFlow",
};

export const seriesDescriptions: Record<Series, string> = {
  paper: "Paper, ink and vermilion stamps for storefronts and campaigns.",
  product: "Quiet tool UI: neutral surfaces, one accent, status on dots.",
  story: "Ink and lantern UI for narrative games, themeable with CSS variables.",
  classic: "The original SunUI packages: gradients, glass and glow, ported as-is.",
  cardflow: "From CardFlow: 3D profile cards, light effects and infinite canvas tools.",
};

export function seriesOf(item: Pick<RegistryItem, "meta">): Series {
  return item.meta.series ?? "paper";
}
