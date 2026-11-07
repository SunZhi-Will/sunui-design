import { motionPageCopy } from "@/content/motion-dictionary";
import { ogContentType, ogSize, pageOg } from "@/lib/og";

// 動效辭典的分享圖：三種判定做成 chips。
export const alt = "SunUI motion dictionary";
export const size = ogSize;
export const contentType = ogContentType;
export const dynamic = "force-static";

export default function OpengraphImage() {
  const t = motionPageCopy.en;
  return pageOg({
    eyebrow: "Docs · Motion",
    title: t.title,
    description: t.metaDescription,
    chips: ["Allowed", "Limited", "Avoided"],
  });
}
