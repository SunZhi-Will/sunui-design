"use client";

import { useState } from "react";

import { TiltCard } from "./tilt-card";

function SneakerArt({ from, to }: { from: string; to: string }) {
  return (
    <div className="grid size-full place-items-center" style={{ background: `linear-gradient(145deg, ${from}, ${to})` }}>
      <svg viewBox="0 0 120 60" className="w-3/4 drop-shadow-xl" aria-hidden="true">
        <path d="M8 44c0-8 6-14 14-16l22-6c6-2 10-8 14-12 4 4 10 8 18 10l24 6c8 2 12 8 12 14v4H8z" fill="#fff" />
        <path d="M8 46h104v6a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2z" fill="rgb(15 23 42 / 0.85)" />
        <path d="M50 22l6 8M58 18l6 8M66 16l6 8" stroke="rgb(15 23 42 / 0.5)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function TiltCardDemo() {
  const [bag, setBag] = useState(0);

  return (
    <div className="w-full max-w-3xl space-y-4">
      <div className="grid gap-6 sm:grid-cols-2">
        <TiltCard
          media={<SneakerArt from="#fb7185" to="#f59e0b" />}
          title="Aero Runner 2"
          subtitle="Road running"
          price="$129"
          badge="New"
          action={{ label: "Add to bag", onClick: () => setBag((b) => b + 1) }}
        />
        <TiltCard
          media={<SneakerArt from="#22d3ee" to="#6366f1" />}
          title="Trail Lite"
          subtitle="Trail, waterproof"
          price="$149"
          href="#"
          maxTilt={14}
        />
      </div>
      <p className="text-center text-xs text-muted-foreground" aria-live="polite">
        Hover to tilt. Tab to focus. Bag: {bag}
      </p>
    </div>
  );
}
