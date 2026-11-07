import { getMessages } from "@/lib/messages";
import { ogContentType, ogSize, pageOg } from "@/lib/og";

// 更新紀錄的分享圖。
export const alt = "SunUI changelog";
export const size = ogSize;
export const contentType = ogContentType;
export const dynamic = "force-static";

export default function OpengraphImage() {
  const m = getMessages("en");
  return pageOg({
    eyebrow: "Docs · Changelog",
    title: m.docsChangelog.title,
    description: m.docsChangelog.metaDescription,
  });
}
