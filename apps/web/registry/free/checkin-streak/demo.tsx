"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { CheckinStreak } from "./checkin-streak";

// 方案頁的福利區塊：簽到拿到的張數直接加進額度
function isoDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const copy = {
  en: { title: "Get more images for free", before: "Images you earn go straight into your quota. About ", after: " images left." },
  "zh-TW": { title: "免費多拿幾張", before: "拿到的張數會直接加進額度。目前約剩 ", after: " 張。" },
  "zh-CN": { title: "免费多领几张", before: "领到的张数会直接加进额度。目前约剩 ", after: " 张。" },
  ja: { title: "無料で枚数を増やす", before: "獲得した枚数はそのまま利用枠に加算されます。残り約 ", after: " 枚。" },
};

export default function CheckinStreakDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [left, setLeft] = useState(42);

  return (
    <section aria-labelledby="rewards-title" className="flex w-full max-w-md min-w-0 flex-col gap-3">
      <div>
        <h2 id="rewards-title" className="text-base font-semibold">
          {t.title}
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t.before}
          <span className="tabular-nums">{left}</span>
          {t.after}
        </p>
      </div>
      <CheckinStreak
        fixed={false}
        locale={locale}
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
