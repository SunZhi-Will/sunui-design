"use client";

import { useEffect, useRef, useState } from "react";

import { QuotaMeter, toQuotaUsage, useQuotaUsage } from "./quota-meter";

// 側邊欄底部的額度與方案頁的額度卡：一張圖生成完（進行中的任務變少）就重新讀取
export default function QuotaMeterDemo() {
  const left = useRef(18);
  const [active, setActive] = useState(1);

  // 模擬正在跑的一次生成，幾秒後完成並用掉一張
  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => {
      left.current -= 1;
      setActive(0);
    }, 4000);
    return () => clearTimeout(id);
  }, [active]);

  const usage = useQuotaUsage(
    () => Promise.resolve(toQuotaUsage({ enforced: true, total: 30, left: left.current, checkin: 5 })),
    { refreshKey: active },
  );

  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-4 md:grid-cols-[14rem_minmax(0,1fr)]">
      <nav aria-label="App" className="flex min-w-0 flex-col rounded-xl border border-border bg-[#FAFAFA] p-2 dark:bg-[#09090B]">
        {["Create", "My images", "Characters", "Plans"].map((item, i) => (
          <span key={item} className={i === 0 ? "rounded-md bg-muted px-2 py-1.5 text-sm font-medium" : "px-2 py-1.5 text-sm text-muted-foreground"}>
            {item}
          </span>
        ))}
        <div className="mt-6 border-t border-border pt-2">
          <p className="px-0.5 pb-1 text-[11px] text-muted-foreground" aria-live="polite">
            {active ? "1 image generating" : "Generation finished"}
          </p>
          <QuotaMeter usage={usage} href="#plans" />
        </div>
      </nav>
      <QuotaMeter
        className="min-w-0"
        variant="card"
        usage={usage}
        title="Today's free quota"
        hint="30 a day, resets at midnight"
        nudgeHref="#rewards"
      />
    </div>
  );
}
