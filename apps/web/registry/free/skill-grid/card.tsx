"use client";

import { useDemoText } from "@/lib/demo-locale";

import { demoCopy, skills } from "./demo";
import { SkillGrid } from "./skill-grid";

/** Catalog card: the chips and a small hexagon wall; press a chip to watch the wall re-flow. */
export default function SkillGridCard() {
  const t = useDemoText(demoCopy);
  return (
    <div className="w-[21rem]">
      <SkillGrid items={skills(t).slice(0, 8)} size={72} allLabel={t.all} aria-label={t.label} />
    </div>
  );
}
