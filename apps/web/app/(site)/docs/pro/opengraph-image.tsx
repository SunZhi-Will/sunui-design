import { getMessages } from "@/lib/messages";
import { ogContentType, ogSize, pageOg } from "@/lib/og";

// Pro 使用說明的分享圖。
export const alt = "Using SunUI Pro blocks";
export const size = ogSize;
export const contentType = ogContentType;
export const dynamic = "force-static";

export default function OpengraphImage() {
  const m = getMessages("en");
  return pageOg({
    eyebrow: "Docs · Pro",
    title: m.docsPro.title,
    description: m.docsPro.metaDescription,
    command: "npx shadcn@latest add @sunui-pro/<block>",
  });
}
