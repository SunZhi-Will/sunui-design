import { getMessages } from "@/lib/messages";
import { ogContentType, ogSize, pageOg } from "@/lib/og";

// 圖示頁的分享圖：圖示的幾種樣式做成 chips。
export const alt = "SunUI icons";
export const size = ogSize;
export const contentType = ogContentType;
export const dynamic = "force-static";

export default function OpengraphImage() {
  const m = getMessages("en");
  return pageOg({
    eyebrow: "Icons",
    title: m.icons.title,
    description: m.icons.metaDescription,
    chips: ["Line icons", "Pixel icons", "Animated states", "24px grid"],
  });
}
