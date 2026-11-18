import type { RegistryItem, Series } from "@/lib/registry";

export const seriesIds: Series[] = ["craft", "product", "story", "showcase", "motion"];

/** 外部輸入（網址參數、MCP 參數、舊清單）的系列值：paper 是舊名 */
export function parseSeries(value: string | null | undefined): Series | undefined {
  if (value === "paper") return "craft";
  return (seriesIds as string[]).includes(value ?? "") ? (value as Series) : undefined;
}

export const seriesLabels: Record<Series, string> = {
  craft: "Core",
  product: "Product UI",
  story: "Story",
  showcase: "Showcase",
  motion: "Motion",
};

export const seriesDescriptions: Record<Series, string> = {
  craft: "Everyday pieces for stores and product pages, with depth, light and a press you can feel: carts, coupons, inputs, toasts.",
  product: "Quiet tool UI: neutral surfaces, one accent, status on dots.",
  story: "Signature pieces in ink and lantern light: a readable 3D book and a WebGL cloth curtain for launch reveals.",
  showcase: "Landing-page signature visuals in a quiet editorial dark: tilts, carousels, marquees and recap slides.",
  motion: "Motion effect libraries: text, entrances, buttons, cards, backgrounds, scroll, cursor, loaders and more, each with many variants.",
};

export function seriesOf(item: Pick<RegistryItem, "meta">): Series {
  return item.meta.series ?? "craft";
}
