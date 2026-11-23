"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * 幾條安裝指令收成一個框：上面一排切換，一次只顯示一條。
 * 指令本身（Command）是伺服器元件，所以由外面全部畫好傳進來，這裡只決定顯示哪一條。
 */
export function CommandTabs({ label, tabs, children }: { label: string; tabs: string[]; children: ReactNode[] }) {
  const [index, setIndex] = useState(0);
  return (
    <div>
      <div role="tablist" aria-label={label} className="mb-2.5 inline-flex max-w-full gap-0.5 overflow-x-auto rounded-md bg-stage p-0.5 text-[13px]">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={index === i}
            onClick={() => setIndex(i)}
            className={cn(
              "shrink-0 rounded-[4px] px-2.5 py-1 whitespace-nowrap transition-colors",
              index === i ? "bg-card font-medium text-fg shadow-e1" : "text-subtle hover:text-fg",
            )}
          >
            {tab}
          </button>
        ))}
      </div>
      {children.map((child, i) => (
        <div key={i} role="tabpanel" hidden={index !== i}>
          {child}
        </div>
      ))}
    </div>
  );
}
