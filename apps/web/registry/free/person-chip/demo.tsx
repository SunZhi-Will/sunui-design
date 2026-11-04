"use client";

import { useState } from "react";

import { PersonChip } from "./person-chip";

const crew = [
  { id: 1, name: "Mia" },
  { id: 2, name: "Leo", locked: true },
  { id: 3, name: "Ava", changed: true },
  { id: 4, name: "Noah" },
  { id: 5, name: "王大同" },
];

export default function PersonChipDemo() {
  const [selected, setSelected] = useState<number | null>(3);
  const me = 1;

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap gap-1.5">
        {crew.map((c) => (
          <PersonChip
            key={c.id}
            size="lg"
            name={c.name}
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
