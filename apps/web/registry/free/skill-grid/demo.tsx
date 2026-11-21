"use client";

import { useDemoText } from "@/lib/demo-locale";

import { SkillGrid, type SkillItem } from "./skill-grid";

// Logos load from the devicon set on jsDelivr (MIT); in your project pass your own files or inline SVGs.
const dev = (path: string) => `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${path}`;

export const demoCopy = {
  en: { title: "What I work with", sub: "Six years of product work, mostly web and a little game prototyping.", all: "All", cats: ["Languages", "Frameworks", "Tools"], label: "Skills" },
  "zh-TW": { title: "我常用的技術", sub: "六年產品開發經驗，以網頁為主，也做一些遊戲原型。", all: "全部", cats: ["程式語言", "框架", "工具"], label: "技能" },
  "zh-CN": { title: "我常用的技术", sub: "六年产品开发经验，以网页为主，也做一些游戏原型。", all: "全部", cats: ["编程语言", "框架", "工具"], label: "技能" },
  ja: { title: "使っている技術", sub: "プロダクト開発 6 年。主に Web、ときどきゲームのプロトタイプも。", all: "すべて", cats: ["言語", "フレームワーク", "ツール"], label: "スキル" },
};

export type DemoCopy = (typeof demoCopy)["en"];

export function skills(t: DemoCopy): SkillItem[] {
  const [lang, fw, tool] = t.cats;
  return [
    { name: "TypeScript", icon: dev("typescript/typescript-original.svg"), category: lang, color: "#3178c6" },
    { name: "Python", icon: dev("python/python-original.svg"), category: lang, color: "#3776ab" },
    { name: "C#", icon: dev("csharp/csharp-original.svg"), category: lang, color: "#9b4f96" },
    { name: "Go", icon: dev("go/go-original-wordmark.svg"), category: lang, color: "#00add8" },
    { name: "React", icon: dev("react/react-original.svg"), category: fw, color: "#149eca" },
    { name: "Next.js", icon: dev("nextjs/nextjs-original.svg"), category: fw, color: "#737373" },
    { name: "Vue", icon: dev("vuejs/vuejs-original.svg"), category: fw, color: "#42b883" },
    { name: "Tailwind", icon: dev("tailwindcss/tailwindcss-original.svg"), category: fw, color: "#06b6d4" },
    { name: "Unity", icon: dev("unity/unity-original.svg"), category: fw, color: "#737373" },
    { name: "Figma", icon: dev("figma/figma-original.svg"), category: tool, color: "#f24e1e" },
    { name: "Docker", icon: dev("docker/docker-original.svg"), category: tool, color: "#2496ed" },
    { name: "Git", icon: dev("git/git-original.svg"), category: tool, color: "#f05032" },
    { name: "PostgreSQL", icon: dev("postgresql/postgresql-original.svg"), category: tool, color: "#4169e1" },
  ];
}

/** The skills section of a developer portfolio: filter chips over a hexagon wall. */
export default function SkillGridDemo() {
  const t = useDemoText(demoCopy);
  return (
    <section className="flex w-full max-w-4xl flex-col items-center gap-8 py-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">{t.title}</h2>
        <p className="max-w-md text-[15px] text-muted-foreground">{t.sub}</p>
      </div>
      <SkillGrid items={skills(t)} allLabel={t.all} categories={t.cats} aria-label={t.label} />
    </section>
  );
}
