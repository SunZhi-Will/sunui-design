"use client";

import { useCallback, useState } from "react";

import { ClassicFilterGrid, GridItem, type FilterGridShape, type FilterGridTheme } from "./classic-filter-grid";

type Skill = { name: string; abbr: string; color: string; category: string };

const skills: Skill[] = [
  { name: "React", abbr: "Re", color: "#38bdf8", category: "Frontend" },
  { name: "Next.js", abbr: "Nx", color: "#e2e8f0", category: "Frontend" },
  { name: "TypeScript", abbr: "Ts", color: "#3b82f6", category: "Frontend" },
  { name: "Tailwind", abbr: "Tw", color: "#22d3ee", category: "Frontend" },
  { name: "Framer", abbr: "Fm", color: "#c084fc", category: "Frontend" },
  { name: "Node.js", abbr: "No", color: "#4ade80", category: "Backend" },
  { name: "Python", abbr: "Py", color: "#facc15", category: "Backend" },
  { name: "PostgreSQL", abbr: "Pg", color: "#60a5fa", category: "Backend" },
  { name: "Redis", abbr: "Rd", color: "#f87171", category: "Backend" },
  { name: "Docker", abbr: "Dk", color: "#0ea5e9", category: "Tools" },
  { name: "Git", abbr: "Gt", color: "#fb923c", category: "Tools" },
  { name: "Figma", abbr: "Fg", color: "#f472b6", category: "Design" },
  { name: "Blender", abbr: "Bl", color: "#f97316", category: "Design" },
];

// 以 SVG 畫出的徽章圖示，取代外部圖檔
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

const libraries = [
  "Zustand", "Zod", "tRPC", "Prisma", "Vitest", "Playwright", "Radix", "SWR", "Vite",
  "Turbo", "Drizzle", "Hono", "Three.js", "D3", "Lottie", "Storybook", "ESLint", "Biome",
];

const shapes: FilterGridShape[] = ["hexagon", "square", "circle"];
const themes: FilterGridTheme[] = ["light", "dark", "blue", "green", "purple"];

export default function ClassicFilterGridDemo() {
  const [libCount, setLibCount] = useState(6);
  const [loading, setLoading] = useState(false);

  // 模擬分批載入：每批 6 個，約 0.9 秒
  const loadMore = useCallback(() => {
    if (libCount >= libraries.length) return;
    setLoading(true);
    setTimeout(() => {
      setLibCount((n) => Math.min(libraries.length, n + 6));
      setLoading(false);
    }, 900);
  }, [libCount]);

  return (
    <div className="w-full max-w-5xl space-y-6">
      {/* 技能牆：分類篩選與分頁 */}
      <section className="rounded-2xl bg-slate-950 px-4 py-10 sm:px-8">
        <ClassicFilterGrid theme="blue" usePagination itemsPerPage={8} labels={{ title: "Skills" }}>
          {skills.map((s) => (
            <GridItem key={s.name} name={s.name} category={s.category} icon={<Badge abbr={s.abbr} color={s.color} />} />
          ))}
        </ClassicFilterGrid>
      </section>

      {/* 形狀 */}
      <section aria-label="Shapes" className="grid grid-cols-1 gap-4 rounded-2xl bg-slate-900 p-4 sm:grid-cols-3 sm:p-6">
        {shapes.map((shape) => (
          <div key={shape} className="min-w-0 space-y-3">
            <p className="text-center text-sm font-medium text-slate-300 capitalize">{shape}</p>
            <ClassicFilterGrid theme="dark" shape={shape} width={96} height={110} showCategories={false}>
              {skills.slice(0, 3).map((s) => (
                <GridItem key={s.name} name={s.name} icon={<Badge abbr={s.abbr} color={s.color} />} />
              ))}
            </ClassicFilterGrid>
          </div>
        ))}
      </section>

      {/* 主題：light 放在淺色底，其餘放在深色底 */}
      <section aria-label="Themes" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {themes.map((theme) => (
          <div key={theme} className={`min-w-0 space-y-3 rounded-2xl p-4 ${theme === "light" ? "bg-white" : "bg-slate-950"}`}>
            <p className={`text-center text-sm font-medium capitalize ${theme === "light" ? "text-slate-600" : "text-slate-300"}`}>{theme}</p>
            <ClassicFilterGrid theme={theme} shape="circle" width={64} height={64} showCategories={false}>
              {skills.slice(5, 7).map((s) => (
                <GridItem key={s.name} name={s.name} showName={false} icon={<Badge abbr={s.abbr} color={s.color} />} />
              ))}
            </ClassicFilterGrid>
          </div>
        ))}
      </section>

      {/* 無限捲動與載入骨架 */}
      <section className="rounded-2xl bg-slate-950 px-4 py-8 sm:px-8">
        <p className="mb-6 text-center text-sm font-medium text-pink-200">Libraries I reach for</p>
        <ClassicFilterGrid theme="purple" shape="square" width={104} height={104} loading={loading} loadingItemCount={3} loadMore={loadMore}>
          {libraries.slice(0, libCount).map((name) => (
            <GridItem key={name} name={name} icon={<Badge abbr={name.slice(0, 2)} color="#f9a8d4" />} />
          ))}
        </ClassicFilterGrid>
      </section>
    </div>
  );
}
