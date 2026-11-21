import type { Metadata } from "next";

import { InteractionWall } from "@/components/interaction-wall";
import { getI18n } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getI18n();
  return { title: m.wall.metaTitle, description: m.wall.metaDescription, alternates: { canonical: "/interactions" } };
}

/** 同屏微互動牆：二十個免費區塊一起播。規劃見 reports/微互動同屏牆深度分析-2026-11-22.md */
export default async function InteractionsPage() {
  const { locale, m } = await getI18n();
  const t = m.wall;
  return (
    <div className="pt-8 pb-24 sm:pt-16">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-subtle">{t.eyebrow}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-balance [word-break:auto-phrase] sm:text-5xl">{t.title}</h1>
        <p className="mt-3 text-base leading-relaxed text-pretty text-subtle sm:mt-4 sm:text-lg">{t.lead}</p>
      </div>
      <div className="mt-8 sm:mt-10">
        <InteractionWall copy={t} locale={locale} />
      </div>
    </div>
  );
}
