"use client";

import { useDemoText } from "@/lib/demo-locale";

import { SocialLink, SocialLinks, type SocialLinkItem } from "./social-links";
import { LookArt } from "@/registry/_demo/product-art";

export const demoCopy = {
  en: {
    name: "Iris Chen",
    role: "Type designer and illustrator, Taipei",
    bio: "I draw typefaces for small presses and post the process every week: sketches, spacing tests and the fonts that did not make it.",
    profiles: "Social profiles",
    footer: "Footer links",
    hint: "(opens in a new tab)",
    labels: { github: "GitHub", x: "X", instagram: "Instagram", youtube: "YouTube", email: "Email", site: "Website" },
    newsletter: "Weekly letter",
    nav: ["Work", "Fonts", "Writing", "About"],
    rights: "© 2026 Iris Chen",
  },
  "zh-TW": {
    name: "Iris Chen",
    role: "字體設計師、插畫家，台北",
    bio: "為小型出版社設計字體，每週分享製作過程：草稿、字距測試，還有最後沒被採用的字。",
    profiles: "社群帳號",
    footer: "頁尾連結",
    hint: "（在新分頁開啟）",
    labels: { github: "GitHub", x: "X", instagram: "Instagram", youtube: "YouTube", email: "電子郵件", site: "個人網站" },
    newsletter: "每週電子報",
    nav: ["作品", "字體", "文章", "關於"],
    rights: "© 2026 Iris Chen",
  },
  "zh-CN": {
    name: "Iris Chen",
    role: "字体设计师、插画师，台北",
    bio: "为小型出版社设计字体，每周分享制作过程：草稿、字距测试，还有最后没被采用的字。",
    profiles: "社交账号",
    footer: "页脚链接",
    hint: "（在新标签页打开）",
    labels: { github: "GitHub", x: "X", instagram: "Instagram", youtube: "YouTube", email: "电子邮件", site: "个人网站" },
    newsletter: "每周邮件",
    nav: ["作品", "字体", "文章", "关于"],
    rights: "© 2026 Iris Chen",
  },
  ja: {
    name: "Iris Chen",
    role: "書体デザイナー、イラストレーター（台北）",
    bio: "小さな出版社のために書体をつくり、毎週その過程を公開しています。スケッチ、字間のテスト、採用されなかった文字まで。",
    profiles: "SNS アカウント",
    footer: "フッターリンク",
    hint: "（新しいタブで開きます）",
    labels: { github: "GitHub", x: "X", instagram: "Instagram", youtube: "YouTube", email: "メール", site: "ウェブサイト" },
    newsletter: "週刊レター",
    nav: ["作品", "書体", "文章", "プロフィール"],
    rights: "© 2026 Iris Chen",
  },
};

export type DemoCopy = (typeof demoCopy)["en"];

export function profileLinks(t: DemoCopy): SocialLinkItem[] {
  return [
    { platform: "instagram", href: "https://www.instagram.com/", label: t.labels.instagram },
    { platform: "youtube", href: "https://www.youtube.com/", label: t.labels.youtube },
    { platform: "x", href: "https://x.com/", label: t.labels.x },
    { platform: "github", href: "https://github.com/", label: t.labels.github },
    { platform: "email", href: "mailto:hello@example.com", label: t.labels.email },
  ];
}

/** A creator's portfolio page: expanding links in the profile header, a pill for the newsletter, quiet icons in the footer. */
export default function SocialLinksDemo() {
  const t = useDemoText(demoCopy);
  const links = profileLinks(t);

  return (
    <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-background shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(255_255_255/0.08)]">
      <section className="flex flex-col gap-5 p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <div aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-full bg-muted text-lg font-semibold tracking-tight">
            IC
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight">{t.name}</h2>
            <p className="text-sm text-muted-foreground">{t.role}</p>
          </div>
        </div>
        <p className="max-w-prose text-[15px] leading-relaxed text-foreground/80">{t.bio}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <SocialLinks links={links} variant="expanding" brand aria-label={t.profiles} newTabHint={t.hint} />
          <SocialLink platform="link" href="https://example.com/letter" label={t.newsletter} variant="pill" newTabHint={t.hint} />
        </div>
      </section>

      {/* placeholder work grid so the footer sits where it would on a real page */}
      <div aria-hidden="true" className="grid grid-cols-3 gap-3 px-6 sm:px-8">
        {[0, 1, 2].map((i) => (
          <LookArt key={i} look={(["coat-camel", "field-jacket", "boots-black"] as const)[i]} className="aspect-[4/3] rounded-xl" />
        ))}
      </div>

      <footer className="mt-6 flex flex-col gap-4 border-t border-foreground/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex flex-col gap-1">
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {t.nav.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </nav>
          <p className="text-xs tabular-nums text-muted-foreground">{t.rights}</p>
        </div>
        <SocialLinks links={links.slice(0, 4)} size="sm" aria-label={t.footer} newTabHint={t.hint} />
      </footer>
    </div>
  );
}
