import type { MetadataRoute } from "next";

import { getItems } from "@/lib/registry";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const pages = ["", "/icons", "/pricing", "/license", "/docs", "/docs/installation", "/docs/pro", "/docs/ai-agents", "/docs/motion", "/docs/changelog"];
  return [
    ...pages.map((path) => ({ url: `${base}${path}`, changeFrequency: "weekly" as const, priority: path ? 0.6 : 1 })),
    ...getItems().map((item) => ({
      url: `${base}/blocks/${item.name}`,
      lastModified: new Date(`${item.meta.addedAt}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
