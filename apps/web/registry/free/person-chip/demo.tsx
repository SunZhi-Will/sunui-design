"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { AppChip, PersonChip } from "./person-chip";

const crew = [
  { id: 1, apps: ["lumen", "tidepool"] },
  { id: 2, locked: true, apps: ["orbit"] },
  { id: 3, changed: true, apps: ["lumen", "tidepool", "orbit"] },
  { id: 4, apps: ["tidepool"] },
  { id: 5, apps: ["orbit", "lumen"] },
];

const apps: Record<string, { name: string; paid?: boolean }> = {
  lumen: { name: "Lumen Reader", paid: true },
  tidepool: { name: "Tidepool" },
  orbit: { name: "Orbit Notes", paid: true },
};

// 每種語言一組範例名字，順序對應 crew
const names = {
  en: ["Mia", "Leo", "Ava", "Noah", "王大同"],
  "zh-TW": ["小美", "阿傑", "怡君", "志明", "王大同"],
  "zh-CN": ["小美", "阿杰", "怡君", "志明", "王大同"],
  ja: ["美咲", "蓮", "葵", "湊", "佐藤健"],
};

const copy = {
  en: { team: "Team", uses: (n: string) => `${n} uses`, pick: "Pick a person to see their apps" },
  "zh-TW": { team: "成員", uses: (n: string) => `${n} 正在使用`, pick: "選一位成員查看使用的 App" },
  "zh-CN": { team: "成员", uses: (n: string) => `${n} 正在使用`, pick: "选一位成员查看使用的 App" },
  ja: { team: "メンバー", uses: (n: string) => `${n} が利用中`, pick: "メンバーを選ぶと利用中のアプリを表示" },
};

/** 成員名單（PersonChip）與選中成員正在使用的專案（AppChip），兩種標籤共用同一套識別色 */
export default function PersonChipDemo() {
  const [selected, setSelected] = useState<number | null>(3);
  const me = 1;
  const locale = useDemoLocale();
  const crewNames = useDemoText(names);
  const t = useDemoText(copy);
  const index = crew.findIndex((c) => c.id === selected);

  return (
    <div className="w-full max-w-md min-w-0 divide-y divide-border rounded-xl border border-border bg-card">
      <div className="p-4">
        <p className="mb-2.5 text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">{t.team}</p>
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
      <div className="flex min-h-14 min-w-0 flex-wrap items-center gap-1.5 p-4" aria-live="polite">
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
      </div>
    </div>
  );
}
