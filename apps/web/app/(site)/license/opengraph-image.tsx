import { getMessages } from "@/lib/messages";
import { ogContentType, ogSize, pageOg } from "@/lib/og";

// 授權頁的分享圖。
export const alt = "SunUI license";
export const size = ogSize;
export const contentType = ogContentType;
export const dynamic = "force-static";

export default function OpengraphImage() {
  const m = getMessages("en");
  return pageOg({
    eyebrow: "License",
    title: m.license.title,
    description: m.license.metaDescription,
    chips: ["Free blocks · MIT", "Pro · one-time license"],
  });
}
