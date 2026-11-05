"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ClassicFilterGrid, GridItem } from "./classic-filter-grid";

const skills = [
  { name: "React", abbr: "Re", color: "#38bdf8", category: "Front" },
  { name: "TypeScript", abbr: "Ts", color: "#3b82f6", category: "Front" },
  { name: "Tailwind", abbr: "Tw", color: "#22d3ee", category: "Front" },
  { name: "Node.js", abbr: "No", color: "#4ade80", category: "Back" },
  { name: "Python", abbr: "Py", color: "#facc15", category: "Back" },
  { name: "Redis", abbr: "Rd", color: "#f87171", category: "Back" },
  { name: "Figma", abbr: "Fg", color: "#f472b6", category: "Design" },
  { name: "Blender", abbr: "Bl", color: "#f97316", category: "Design" },
];

// 與 demo 相同的 SVG 徽章圖示
function Badge({ abbr, color }: { abbr: string; color: string }) {
  return (
    <svg viewBox="0 0 48 48">
      <rect x="4" y="4" width="40" height="40" rx="12" fill={color} opacity="0.18" />
      <rect x="4" y="4" width="40" height="40" rx="12" fill="none" stroke={color} strokeWidth="2" />
      <text x="24" y="30" textAnchor="middle" fontSize="16" fontWeight="700" fontFamily="ui-sans-serif, system-ui" fill={color}>
        {abbr}
      </text>
    </svg>
  );
}

/** 型錄卡片：點分類按鈕，六角形徽章彈跳重排，只看篩選那一下。 */
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
    <div className="mx-auto w-72 rounded-xl bg-slate-950 px-3 py-4">
      <ClassicFilterGrid
        theme="blue"
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
          <GridItem key={s.name} name={s.name} category={cat[s.category as Category]} showName={false} icon={<Badge abbr={s.abbr} color={s.color} />} />
        ))}
      </ClassicFilterGrid>
    </div>
  );
}
