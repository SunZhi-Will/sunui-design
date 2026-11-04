"use client";

import { ClassicFilterGrid, GridItem } from "./classic-filter-grid";

const skills = [
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

export default function ClassicFilterGridDemo() {
  return (
    <section className="w-full max-w-5xl min-w-0 rounded-2xl bg-slate-950 px-4 py-10 sm:px-8">
      <ClassicFilterGrid theme="blue" usePagination itemsPerPage={8} labels={{ title: "Skills" }}>
        {skills.map((s) => (
          <GridItem key={s.name} name={s.name} category={s.category} icon={<Badge abbr={s.abbr} color={s.color} />} />
        ))}
      </ClassicFilterGrid>
    </section>
  );
}
