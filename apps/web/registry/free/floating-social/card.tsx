"use client";

import { useDemoText } from "@/lib/demo-locale";

import { bakeryLinks, demoCopy, PageFrame } from "./demo";

/** Catalog card: one page with the petal menu open. */
export default function FloatingSocialCard() {
  const t = useDemoText(demoCopy);
  return (
    <div className="w-[22rem]">
      <PageFrame title={t.page} layout="petal" items={bakeryLinks} label={t.label} hint={t.hint} />
    </div>
  );
}
