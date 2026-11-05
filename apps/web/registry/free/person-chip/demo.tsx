"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { PersonChip } from "./person-chip";

const crew = [
  { id: 1 },
  { id: 2, locked: true },
  { id: 3, changed: true },
  { id: 4 },
  { id: 5 },
];

// 每種語言一組範例名字，順序對應 crew
const names = {
  en: ["Mia", "Leo", "Ava", "Noah", "王大同"],
  "zh-TW": ["小美", "阿傑", "怡君", "志明", "王大同"],
  "zh-CN": ["小美", "阿杰", "怡君", "志明", "王大同"],
  ja: ["美咲", "蓮", "葵", "湊", "佐藤健"],
};

export default function PersonChipDemo() {
  const [selected, setSelected] = useState<number | null>(3);
  const me = 1;
  const locale = useDemoLocale();
  const crewNames = useDemoText(names);

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap gap-1.5">
        {crew.map((c, i) => (
          <PersonChip
            key={c.id}
            size="lg"
            name={crewNames[i]}
            locale={locale}
            personId={c.id}
            locked={c.locked}
            highlighted={c.changed}
            emphasized={c.id === me}
            muted={c.id !== me && c.id !== selected}
            selected={c.id === selected}
            onClick={() => setSelected((s) => (s === c.id ? null : c.id))}
          />
        ))}
      </div>
    </div>
  );
}
