"use client";

import { useState } from "react";

import { CheckinStreak } from "./checkin-streak";

// 方案頁的福利區塊：簽到拿到的張數直接加進額度
function isoDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function CheckinStreakDemo() {
  const [left, setLeft] = useState(42);

  return (
    <section aria-labelledby="rewards-title" className="flex w-full max-w-md min-w-0 flex-col gap-3">
      <div>
        <h2 id="rewards-title" className="text-base font-semibold">
          Get more images for free
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Images you earn go straight into your quota. About <span className="tabular-nums">{left}</span> images left.
        </p>
      </div>
      <CheckinStreak
        fixed={false}
        today={isoDaysAgo(0)}
        week={[isoDaysAgo(6), isoDaysAgo(4), isoDaysAgo(3), isoDaysAgo(2), isoDaysAgo(1)]}
        streak={4}
        reward={5}
        onCheckIn={() => new Promise((resolve) => setTimeout(() => resolve({ reward: 5 }), 700))}
        onClaimed={(n) => setLeft((v) => v + n)}
      />
    </section>
  );
}
