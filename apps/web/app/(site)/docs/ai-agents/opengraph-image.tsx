import { getMessages } from "@/lib/messages";
import { ogContentType, ogSize, pageOg } from "@/lib/og";

// AI agent 說明的分享圖。
export const alt = "SunUI for AI agents";
export const size = ogSize;
export const contentType = ogContentType;
export const dynamic = "force-static";

export default function OpengraphImage() {
  const m = getMessages("en");
  return pageOg({
    eyebrow: "Docs · AI agents",
    title: m.docsAgents.title,
    description: m.docsAgents.metaDescription,
    chips: ["MCP server", "llms.txt", "Agent skill", "shadcn MCP"],
  });
}
