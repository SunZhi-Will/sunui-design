"use client";

import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";

import { useDemoAutoplay } from "@/lib/demo-autoplay";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { AppChip, PersonChipGroup } from "./person-chip";

const crew = [
  { id: 1, apps: ["lumen", "tidepool"] },
  { id: 2, locked: true, apps: ["orbit"] },
  { id: 3, highlighted: true, apps: ["lumen", "tidepool", "orbit"] },
  { id: 4, apps: ["tidepool"] },
  { id: 5, apps: ["orbit", "lumen"] },
  { id: 6, apps: ["ledger"] },
  { id: 7, apps: ["tidepool", "ledger"] },
  { id: 8, apps: ["lumen"] },
  { id: 9, locked: true, apps: ["orbit", "ledger"] },
];

const apps: Record<string, { name: string; paid?: boolean }> = {
  lumen: { name: "Lumen Reader", paid: true },
  tidepool: { name: "Tidepool" },
  orbit: { name: "Orbit Notes", paid: true },
  ledger: { name: "Ledger" },
};

// 每種語言一組範例名字，順序對應 crew
const names = {
  en: ["Mia", "Leo", "Ava", "Noah", "王大同", "Iris", "Kai", "Nora", "Theo"],
  "zh-TW": ["小美", "阿傑", "怡君", "志明", "王大同", "雅婷", "家豪", "淑芬", "冠宇"],
  "zh-CN": ["小美", "阿杰", "怡君", "志明", "王大同", "雅婷", "家豪", "淑芬", "冠宇"],
  ja: ["美咲", "蓮", "葵", "湊", "佐藤健", "結衣", "大翔", "陽菜", "悠真"],
};

const copy = {
  en: { team: "Team", count: (n: number) => `${n} people`, uses: (n: string) => `${n} uses`, pick: "Pick a person to see their apps" },
  "zh-TW": { team: "成員", count: (n: number) => `${n} 人`, uses: (n: string) => `${n} 正在使用`, pick: "選一位成員查看使用的 App" },
  "zh-CN": { team: "成员", count: (n: number) => `${n} 人`, uses: (n: string) => `${n} 正在使用`, pick: "选一位成员查看使用的 App" },
  ja: { team: "メンバー", count: (n: number) => `${n} 人`, uses: (n: string) => `${n} が利用中`, pick: "メンバーを選ぶと利用中のアプリを表示" },
};

/** 團隊面板：九位成員只顯示五位，其餘收成「+4」；選中的人下方列出正在使用的專案 */
export default function PersonChipDemo() {
  const [selected, setSelected] = useState<number | string | null>(3);
  const reduce = useReducedMotion();
  const locale = useDemoLocale();
  const crewNames = useDemoText(names);
  const t = useDemoText(copy);
  const index = crew.findIndex((c) => c.id === selected);
  const people = crew.map((c, i) => ({ id: c.id, name: crewNames[i], locked: c.locked, highlighted: c.highlighted }));
  const ref = useRef<HTMLDivElement>(null);
  // 預覽自己演：展開 +4、選一位剛滑出的人、再收合（選中的人仍留著）
  const cursor = useDemoAutoplay(ref, async (d) => {
    const toggle = () => d.find("button[aria-expanded]");
    await d.click(toggle);
    await d.wait(900);
    await d.click(() => d.find("button", crewNames[5]));
    await d.wait(1300);
    await d.click(toggle);
  });
  const slide = reduce ? { duration: 0 } : ({ type: "spring", stiffness: 240, damping: 30 } as const);

  return (
    <div ref={ref} className="relative w-full max-w-md min-w-0">
    <LayoutGroup>
      <motion.div layout transition={slide} className="w-full min-w-0 overflow-hidden rounded-xl border border-border bg-card" style={{ borderRadius: 12 }}>
        <motion.div layout="position" transition={slide} className="p-4">
          <div className="mb-2.5 flex items-baseline justify-between gap-3">
            <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">{t.team}</p>
            <span className="text-xs text-muted-foreground tabular-nums">{t.count(crew.length)}</span>
          </div>
          <PersonChipGroup people={people} max={5} meId={1} selectedId={selected} onSelect={setSelected} size="lg" label={t.team} locale={locale} />
        </motion.div>
        <motion.div layout="position" transition={slide} className="flex min-h-14 min-w-0 flex-wrap items-center gap-1.5 border-t border-border p-4" aria-live="polite">
          {index >= 0 ? (
            <>
              <span className="mr-1 text-xs text-muted-foreground">{t.uses(crewNames[index])}</span>
              {crew[index].apps.map((id) => (
                <AppChip key={id} appId={id} name={apps[id].name} paid={apps[id].paid} locale={locale} />
              ))}
            </>
          ) : (
            <span className="text-xs text-muted-foreground">{t.pick}</span>
          )}
        </motion.div>
      </motion.div>
    </LayoutGroup>
      {cursor}
    </div>
  );
}
