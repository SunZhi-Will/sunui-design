"use client";

import { useDemoText } from "@/lib/demo-locale";

import { demoCopy, profileLinks } from "./demo";
import { SocialLink, SocialLinks } from "./social-links";

/** Catalog card: a compact creator header with expanding links (hover one to see the label slide out) and a pill below. */
export default function SocialLinksCard() {
  const t = useDemoText(demoCopy);
  return (
    <div className="flex w-[22rem] flex-col gap-4 rounded-xl bg-background p-5 shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(255_255_255/0.08)]">
      <div className="flex items-center gap-3">
        <div aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-muted font-semibold tracking-tight">
          IC
        </div>
        <div className="min-w-0">
          <p className="font-semibold tracking-tight">{t.name}</p>
          <p className="truncate text-sm text-muted-foreground">{t.role}</p>
        </div>
      </div>
      <SocialLinks links={profileLinks(t)} variant="expanding" brand aria-label={t.profiles} newTabHint={t.hint} className="flex-nowrap" />
      <SocialLink platform="link" href="https://example.com/letter" label={t.newsletter} variant="pill" newTabHint={t.hint} className="self-start" />
    </div>
  );
}
