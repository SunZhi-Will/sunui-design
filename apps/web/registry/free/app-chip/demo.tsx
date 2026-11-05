"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { AppChip } from "./app-chip";

const apps = [
  { id: "lumen", name: "Lumen Reader", paid: true },
  { id: "tidepool", name: "Tidepool" },
  { id: "orbit", name: "Orbit Notes", paid: true },
];

const copy = {
  en: { person: "Hana Ito", uses: "uses" },
  "zh-TW": { person: "伊藤花", uses: "正在使用" },
  "zh-CN": { person: "伊藤花", uses: "正在使用" },
  ja: { person: "伊藤 花", uses: "が利用中" },
};

export default function AppChipDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  return (
    <div className="flex w-full max-w-md min-w-0 flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card p-4">
      <span className="text-sm font-medium text-foreground">{t.person}</span>
      <span className="text-xs text-muted-foreground">{t.uses}</span>
      {apps.map((a) => (
        <AppChip key={a.id} appId={a.id} name={a.name} paid={a.paid} locale={locale} />
      ))}
    </div>
  );
}
