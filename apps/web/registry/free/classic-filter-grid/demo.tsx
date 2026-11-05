"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ClassicFilterGrid, GridItem } from "./classic-filter-grid";

const skills = [
  { name: "React", abbr: "Re", category: "Frontend" },
  { name: "Next.js", abbr: "Nx", category: "Frontend" },
  { name: "TypeScript", abbr: "Ts", category: "Frontend" },
  { name: "Tailwind", abbr: "Tw", category: "Frontend" },
  { name: "Framer", abbr: "Fm", category: "Frontend" },
  { name: "Node.js", abbr: "No", category: "Backend" },
  { name: "Python", abbr: "Py", category: "Backend" },
  { name: "PostgreSQL", abbr: "Pg", category: "Backend" },
  { name: "Redis", abbr: "Rd", category: "Backend" },
  { name: "Docker", abbr: "Dk", category: "Tools" },
  { name: "Git", abbr: "Gt", category: "Tools" },
  { name: "Figma", abbr: "Fg", category: "Design" },
  { name: "Blender", abbr: "Bl", category: "Design" },
];

// 單色徽章：跟著文字色，不用各家品牌色，避免一整排霓虹
function Badge({ abbr }: { abbr: string }) {
  return (
    <svg viewBox="0 0 48 48">
      <rect x="5" y="5" width="38" height="38" rx="9" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1.5" />
      <text x="24" y="29.5" textAnchor="middle" fontSize="15" fontWeight="600" fontFamily="ui-sans-serif, system-ui" fill="currentColor">
        {abbr}
      </text>
    </svg>
  );
}

type Category = "Frontend" | "Backend" | "Tools" | "Design";

const copy: Record<"en" | "zh-TW" | "zh-CN" | "ja", { title: string; cat: Record<Category, string> }> = {
  en: { title: "Skills", cat: { Frontend: "Frontend", Backend: "Backend", Tools: "Tools", Design: "Design" } },
  "zh-TW": { title: "技能", cat: { Frontend: "前端", Backend: "後端", Tools: "工具", Design: "設計" } },
  "zh-CN": { title: "技能", cat: { Frontend: "前端", Backend: "后端", Tools: "工具", Design: "设计" } },
  ja: { title: "スキル", cat: { Frontend: "フロントエンド", Backend: "バックエンド", Tools: "ツール", Design: "デザイン" } },
};

export default function ClassicFilterGridDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <section className="w-full max-w-5xl min-w-0 rounded-xl border border-border bg-card px-4 py-10 sm:px-8">
      <ClassicFilterGrid key={locale} locale={locale} shape="square" usePagination itemsPerPage={8} labels={{ title: t.title }}>
        {skills.map((s) => (
          <GridItem key={s.name} name={s.name} category={t.cat[s.category as Category]} icon={<Badge abbr={s.abbr} />} />
        ))}
      </ClassicFilterGrid>
    </section>
  );
}
