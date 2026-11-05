import type { RegistryItem, Series } from "@/lib/registry";

export const seriesLabels: Record<Series, string> = {
  paper: "Paper",
  product: "Product UI",
  story: "Story",
  showcase: "Showcase",
  classic: "Classic SunUI",
  cardflow: "CardFlow",
};

export const seriesDescriptions: Record<Series, string> = {
  paper: "Paper, ink and vermilion stamps for storefronts and campaigns.",
  product: "Quiet tool UI: neutral surfaces, one accent, status on dots.",
  story: "Ink and lantern UI for narrative games, themeable with CSS variables.",
  showcase: "Landing-page signature visuals in a quiet editorial dark: tilts, carousels, marquees and recap slides.",
  classic: "The original SunUI packages, rebuilt on neutral tokens with one accent.",
  cardflow: "From CardFlow: 3D profile cards, light effects and infinite canvas tools.",
};

export function seriesOf(item: Pick<RegistryItem, "meta">): Series {
  return item.meta.series ?? "paper";
}
