"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ClassicFilterGrid, GridItem } from "./classic-filter-grid";

const skills = [
  { name: "React", abbr: "Re", category: "Front" },
  { name: "TypeScript", abbr: "Ts", category: "Front" },
  { name: "Tailwind", abbr: "Tw", category: "Front" },
  { name: "Node.js", abbr: "No", category: "Back" },
  { name: "Python", abbr: "Py", category: "Back" },
  { name: "Redis", abbr: "Rd", category: "Back" },
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

/** 型錄卡片：點分類按鈕，徽章淡入重排，只看篩選那一下。 */
type Category = "Front" | "Back" | "Design";

// 卡片只有 w-72，日文分類取短詞避免按鈕換行
const copy: Record<"en" | "zh-TW" | "zh-CN" | "ja", Record<Category, string>> = {
  en: { Front: "Front", Back: "Back", Design: "Design" },
  "zh-TW": { Front: "前端", Back: "後端", Design: "設計" },
  "zh-CN": { Front: "前端", Back: "后端", Design: "设计" },
  ja: { Front: "UI", Back: "サーバー", Design: "デザイン" },
};

export default function ClassicFilterGridCard() {
  const locale = useDemoLocale();
  const cat = useDemoText(copy);
  return (
    <div className="mx-auto w-72 rounded-xl border border-border bg-card px-3 py-4">
      <ClassicFilterGrid
        shape="square"
        width={52}
        height={60}
        showTitle={false}
        className="[&>div:first-child]:mb-4 [&>div:first-child]:gap-1.5 [&>div:last-of-type]:gap-2.5"
        styles={{ button: "px-3 py-1 text-xs", buttonActive: "px-3 py-1 text-xs" }}
        key={locale}
        locale={locale}
        labels={locale === "ja" ? { all: "全て" } : undefined}
      >
        {skills.map((s) => (
          <GridItem key={s.name} name={s.name} category={cat[s.category as Category]} showName={false} icon={<Badge abbr={s.abbr} />} />
        ))}
      </ClassicFilterGrid>
    </div>
  );
}
