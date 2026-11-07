import { getMessages } from "@/lib/messages";
import { ogContentType, ogSize, pageOg, siteHost } from "@/lib/og";

// 安裝說明的分享圖：直接放一行安裝指令。
export const alt = "Install SunUI blocks";
export const size = ogSize;
export const contentType = ogContentType;
export const dynamic = "force-static";

export default function OpengraphImage() {
  const m = getMessages("en");
  return pageOg({
    eyebrow: "Docs · Installation",
    title: m.docsInstall.title,
    description: m.docsInstall.metaDescription,
    command: `npx shadcn@latest add ${siteHost()}/r/coupon.json`,
  });
}
