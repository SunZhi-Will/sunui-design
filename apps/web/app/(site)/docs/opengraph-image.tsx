import { getMessages } from "@/lib/messages";
import { ogContentType, ogSize, pageOg } from "@/lib/og";
import { getItems } from "@/lib/registry";

// Docs 首頁的分享圖。
export const alt = "SunUI docs";
export const size = ogSize;
export const contentType = ogContentType;
export const dynamic = "force-static";

export default function OpengraphImage() {
  const m = getMessages("en");
  return pageOg({
    eyebrow: "Docs",
    title: m.docsIntro.title,
    description: m.docsIntro.metaDescription,
    chips: [`${getItems("free").length} free blocks`, `${getItems("pro").length} Pro scenes`, "shadcn registry", "MCP"],
  });
}
