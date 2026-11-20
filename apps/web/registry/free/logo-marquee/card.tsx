"use client";

import { useDemoText } from "@/lib/demo-locale";

import { marks } from "./demo";
import { LogoMarquee } from "./logo-marquee";

const copy = {
  en: { heading: "Trusted by independent shops", region: "Customers" },
  "zh-TW": { heading: "獨立商店都在用", region: "客戶" },
  "zh-CN": { heading: "独立商店都在用", region: "客户" },
  ja: { heading: "個人店に選ばれています", region: "導入企業" },
};

/** Catalog card: a row of monochrome wordmarks moving at constant speed; stops on hover, the hovered logo lights up. */
export default function LogoMarqueeCard() {
  const t = useDemoText(copy);
  return (
    <section className="w-80 py-4 text-foreground">
      <p className="mb-4 text-center text-sm font-medium text-muted-foreground">{t.heading}</p>
      <LogoMarquee items={marks} gap={32} speed={32} showPauseControl={false} labels={{ region: t.region }} />
    </section>
  );
}
