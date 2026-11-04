"use client";

import { useState } from "react";

import { AvatarStack, type AvatarStackPerson, type AvatarStackProps } from "./avatar-stack";

const team: AvatarStackPerson[] = [
  { id: "1", name: "Mina Park", presence: "online" },
  { id: "2", name: "Leo Chen", presence: "away" },
  { id: "3", name: "Ava Lin", presence: "online" },
  { id: "4", name: "Noah Wu", presence: "busy" },
  { id: "5", name: "Sara Kim", presence: "offline" },
];

const pool = ["Kai Tan", "Iris Ho", "Theo Lee", "June Sato", "Omar Aziz", "Lena Wolf"];
const presences: AvatarStackPerson["presence"][] = ["online", "away", "busy", "offline"];

type Size = NonNullable<AvatarStackProps["size"]>;

export default function AvatarStackDemo() {
  const [people, setPeople] = useState(team);
  const [size, setSize] = useState<Size>("md");
  const [presence, setPresence] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const add = () => {
    const name = pool[(people.length - team.length) % pool.length];
    setPeople((prev) => [
      ...prev,
      { id: `p-${prev.length + 1}`, name, presence: presences[prev.length % presences.length] },
    ]);
  };

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div role="radiogroup" aria-label="Avatar size" className="flex gap-2">
          {(["sm", "md", "lg"] as Size[]).map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={size === s}
              onClick={() => setSize(s)}
              className={
                size === s
                  ? "rounded-full bg-primary px-3 py-1 text-sm text-primary-foreground"
                  : "rounded-full border border-border bg-card px-3 py-1 text-sm text-card-foreground hover:bg-muted"
              }
            >
              {s}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={presence} onChange={(e) => setPresence(e.target.checked)} className="accent-primary" />
          Presence
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5">
        <div>
          <p className="text-sm font-semibold text-card-foreground">Design team</p>
          <p className="text-xs text-muted-foreground">{people.length} members</p>
        </div>
        <div className="flex items-center gap-3">
          <AvatarStack
            people={people}
            max={expanded ? people.length : 4}
            size={size}
            showPresence={presence}
            label="Design team"
            onOverflowClick={() => setExpanded(true)}
          />
          <button
            type="button"
            onClick={add}
            className="rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            + Add teammate
          </button>
        </div>
      </div>

      {expanded && (
        <button type="button" onClick={() => setExpanded(false)} className="text-sm text-muted-foreground underline hover:text-foreground">
          Collapse
        </button>
      )}
    </div>
  );
}
