import type { RegistryItem, Series } from "@/lib/registry";

export const seriesLabels: Record<Series, string> = {
  paper: "Paper",
  product: "Product UI",
  story: "Story",
  showcase: "Showcase",
  motion: "Motion",
};

export const seriesDescriptions: Record<Series, string> = {
  paper: "Paper and ink for storefronts and campaigns: coupons, receipts and loyalty cards.",
  product: "Quiet tool UI: neutral surfaces, one accent, status on dots.",
  story: "Signature pieces in ink and lantern light: a readable 3D book and a WebGL cloth curtain for launch reveals.",
  showcase: "Landing-page signature visuals in a quiet editorial dark: tilts, carousels, marquees and recap slides.",
  motion: "Motion effect libraries: text, entrances, buttons, cards, backgrounds, scroll, cursor, loaders and more, each with many variants.",
};

export function seriesOf(item: Pick<RegistryItem, "meta">): Series {
  return item.meta.series ?? "paper";
}
