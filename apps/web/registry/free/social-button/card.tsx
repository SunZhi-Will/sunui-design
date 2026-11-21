"use client";

import { useDemoText } from "@/lib/demo-locale";

import { demoCopy, studioLinks } from "./demo";
import { SocialButtons } from "./social-button";

/** Catalog card: one row of coloured buttons; hover one to see its title. */
export default function SocialButtonCard() {
  const t = useDemoText(demoCopy);
  return (
    <div className="flex w-[22rem] flex-col gap-4 rounded-xl bg-card p-5 shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(255_255_255/0.08)]">
      <div className="min-w-0">
        <p className="font-semibold tracking-tight">{t.studio}</p>
        <p className="text-sm text-muted-foreground">{t.follow}</p>
      </div>
      <SocialButtons items={studioLinks(t)} aria-label={t.follow} newTabHint={t.hint} className="flex-nowrap" />
    </div>
  );
}
