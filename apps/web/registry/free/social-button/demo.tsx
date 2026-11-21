"use client";

import { useDemoText } from "@/lib/demo-locale";

import { SocialButton, SocialButtons, type SocialButtonItem } from "./social-button";

export const demoCopy = {
  en: {
    studio: "Northbound Studio",
    tagline: "Small product team in Taichung. We post work in progress most weeks.",
    follow: "Follow the studio",
    team: "Team",
    people: [
      { name: "Mei Lin", role: "Design lead" },
      { name: "Kai Wu", role: "Front-end" },
    ],
    share: "Where to find us",
    hint: "(opens in a new tab)",
    labels: { instagram: "Instagram", youtube: "YouTube", linkedin: "LinkedIn", github: "GitHub", x: "X", facebook: "Facebook", email: "Email us", link: "Journal" },
  },
  "zh-TW": {
    studio: "北行工作室",
    tagline: "台中的小型產品團隊，幾乎每週分享進行中的作品。",
    follow: "追蹤工作室",
    team: "團隊",
    people: [
      { name: "林美", role: "設計主管" },
      { name: "吳凱", role: "前端工程" },
    ],
    share: "在這些地方找到我們",
    hint: "（在新分頁開啟）",
    labels: { instagram: "Instagram", youtube: "YouTube", linkedin: "LinkedIn", github: "GitHub", x: "X", facebook: "Facebook", email: "寄信給我們", link: "工作日誌" },
  },
  "zh-CN": {
    studio: "北行工作室",
    tagline: "台中的小型产品团队，几乎每周分享进行中的作品。",
    follow: "关注工作室",
    team: "团队",
    people: [
      { name: "林美", role: "设计主管" },
      { name: "吴凯", role: "前端工程" },
    ],
    share: "在这些地方找到我们",
    hint: "（在新标签页打开）",
    labels: { instagram: "Instagram", youtube: "YouTube", linkedin: "LinkedIn", github: "GitHub", x: "X", facebook: "Facebook", email: "给我们写信", link: "工作日志" },
  },
  ja: {
    studio: "ノースバウンド・スタジオ",
    tagline: "台中の小さなプロダクトチーム。制作途中の作品をほぼ毎週公開しています。",
    follow: "スタジオをフォロー",
    team: "チーム",
    people: [
      { name: "リン・メイ", role: "デザインリード" },
      { name: "ウー・カイ", role: "フロントエンド" },
    ],
    share: "わたしたちの居場所",
    hint: "（新しいタブで開きます）",
    labels: { instagram: "Instagram", youtube: "YouTube", linkedin: "LinkedIn", github: "GitHub", x: "X", facebook: "Facebook", email: "メールする", link: "日誌" },
  },
};

export type DemoCopy = (typeof demoCopy)["en"];

export function studioLinks(t: DemoCopy): SocialButtonItem[] {
  return [
    { platform: "instagram", href: "https://www.instagram.com/", title: t.labels.instagram },
    { platform: "youtube", href: "https://www.youtube.com/", title: t.labels.youtube },
    { platform: "linkedin", href: "https://www.linkedin.com/", title: t.labels.linkedin },
    { platform: "facebook", href: "https://www.facebook.com/", title: t.labels.facebook },
    { platform: "github", href: "https://github.com/", title: t.labels.github },
  ];
}

const card =
  "rounded-xl bg-card shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(255_255_255/0.08)]";

/** A studio contact section: a row with hover titles, team cards with small buttons, and a labelled grid. */
export default function SocialButtonDemo() {
  const t = useDemoText(demoCopy);
  const links = studioLinks(t);

  return (
    <div className="grid w-full max-w-3xl gap-4 md:grid-cols-[1.4fr_1fr]">
      <section className={`${card} flex flex-col gap-6 p-6`}>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-semibold tracking-tight">{t.studio}</h2>
          <p className="max-w-prose text-[15px] leading-relaxed text-muted-foreground">{t.tagline}</p>
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">{t.follow}</p>
          <SocialButtons items={links} aria-label={t.follow} newTabHint={t.hint} />
        </div>
        <div className="flex flex-col gap-3 border-t border-foreground/10 pt-5">
          <p className="text-sm font-medium">{t.team}</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {t.people.map((p, i) => (
              <li key={p.name} className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.role}</p>
                </div>
                <div className="flex gap-1.5">
                  <SocialButton platform={i === 0 ? "instagram" : "github"} href="https://example.com/" size="sm" title={i === 0 ? t.labels.instagram : t.labels.github} newTabHint={t.hint} />
                  <SocialButton platform="linkedin" href="https://www.linkedin.com/" size="sm" title={t.labels.linkedin} newTabHint={t.hint} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={`${card} flex flex-col items-center gap-5 p-6`}>
        <p className="self-start text-sm font-medium">{t.share}</p>
        <SocialButtons
          items={[
            ...links.slice(0, 4),
            { platform: "x", href: "https://x.com/", title: t.labels.x },
            { platform: "email", href: "mailto:hello@example.com", title: t.labels.email },
          ]}
          layout={{ columns: 3 }}
          size="lg"
          titleDisplay="always"
          titleSide="bottom"
          aria-label={t.share}
          newTabHint={t.hint}
          className="gap-x-7 gap-y-10 pb-6"
        />
      </section>
    </div>
  );
}
