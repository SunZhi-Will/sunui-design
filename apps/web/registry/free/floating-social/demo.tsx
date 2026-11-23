"use client";

import type { SocialButtonItem } from "@/components/ui/social-button";
import { useDemoText } from "@/lib/demo-locale";

import { FloatingSocial, type FloatingLayout } from "./floating-social";
import { LookArt } from "@/registry/_demo/product-art";

export const demoCopy = {
  en: {
    label: "Follow us",
    hint: "(opens in a new tab)",
    layouts: { petal: "Petal", column: "Column", grid: "Grid" },
    page: "Spring menu, pastry and coffee",
  },
  "zh-TW": { label: "追蹤我們", hint: "（在新分頁開啟）", layouts: { petal: "花瓣", column: "直排", grid: "格狀" }, page: "春季菜單：甜點與咖啡" },
  "zh-CN": { label: "关注我们", hint: "（在新标签页打开）", layouts: { petal: "花瓣", column: "竖排", grid: "格状" }, page: "春季菜单：甜点与咖啡" },
  ja: { label: "フォローする", hint: "（新しいタブで開きます）", layouts: { petal: "花びら", column: "縦並び", grid: "グリッド" }, page: "春のメニュー：焼き菓子とコーヒー" },
};

export const bakeryLinks: SocialButtonItem[] = [
  { platform: "instagram", href: "https://www.instagram.com/" },
  { platform: "facebook", href: "https://www.facebook.com/" },
  { platform: "youtube", href: "https://www.youtube.com/" },
  { platform: "x", href: "https://x.com/" },
  { platform: "email", href: "mailto:hello@example.com" },
];

/** A page-shaped frame with the floating button pinned to its corner. */
export function PageFrame({ title, layout, items, label, hint }: { title: string; layout: FloatingLayout; items: SocialButtonItem[]; label: string; hint: string }) {
  return (
    <div className="relative h-80 overflow-hidden rounded-xl bg-card shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(255_255_255/0.08)]">
      <div aria-hidden="true" className="flex flex-col gap-3 p-5">
        <p className="text-sm font-semibold tracking-tight text-foreground">{title}</p>
        <LookArt look={layout === "petal" ? "coat-camel" : layout === "column" ? "field-jacket" : "scarf-oat"} className="aspect-[16/7] rounded-lg" />
        <div className="h-2 w-4/5 rounded-full bg-muted" />
        <div className="h-2 w-3/5 rounded-full bg-muted" />
      </div>
      <FloatingSocial items={items} layout={layout} strategy="absolute" defaultOpen label={label} newTabHint={hint} />
    </div>
  );
}

/** Three cafe pages, one per layout, each with its menu already open. Press the main button to fold it. */
export default function FloatingSocialDemo() {
  const t = useDemoText(demoCopy);
  const layouts: FloatingLayout[] = ["petal", "column", "grid"];
  return (
    <div className="grid w-full max-w-4xl gap-4 md:grid-cols-3">
      {layouts.map((layout) => (
        <figure key={layout} className="flex flex-col gap-2">
          <PageFrame title={t.page} layout={layout} items={layout === "column" ? bakeryLinks.slice(0, 3) : bakeryLinks} label={t.label} hint={t.hint} />
          <figcaption className="text-xs text-muted-foreground">{t.layouts[layout]}</figcaption>
        </figure>
      ))}
    </div>
  );
}
