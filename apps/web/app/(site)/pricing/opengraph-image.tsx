import { getMessages } from "@/lib/messages";
import { ogContentType, ogSize, pageOg } from "@/lib/og";
import { prices } from "@/lib/site";

// 定價頁的分享圖：價格直接放在 chips 上。
export const alt = "SunUI pricing";
export const size = ogSize;
export const contentType = ogContentType;
export const dynamic = "force-static";

export default function OpengraphImage() {
  const m = getMessages("en");
  return pageOg({
    eyebrow: "Pricing",
    title: m.pricing.title,
    description: m.pricing.metaDescription,
    chips: [`Pro $${prices.pro}`, `Team $${prices.team}`, "One-time, no subscription"],
  });
}
