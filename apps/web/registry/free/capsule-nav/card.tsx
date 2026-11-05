"use client";

import { useRef } from "react";

import { CapsuleNav, type CapsuleNavItem } from "./capsule-nav";

const sections = [
  { id: "capsule-card-work", label: "Work" },
  { id: "capsule-card-services", label: "Services" },
  { id: "capsule-card-about", label: "About" },
];

const items: CapsuleNavItem[] = sections.map((s) => ({ key: s.id, label: s.label, href: `#${s.id}`, sectionId: s.id }));

/** 型錄卡片：在小視窗裡往下捲，滿版標頭收成浮起的膠囊。 */
export default function CapsuleNavCard() {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative mx-auto w-72 overflow-hidden rounded-2xl border border-black/10 bg-white text-slate-900 dark:border-white/10 dark:bg-black dark:text-white/90">
      <div ref={scrollRef} className="h-[220px] overflow-y-auto overscroll-contain">
        <CapsuleNav
          fixed={false}
          scrollContainer={scrollRef}
          brand={<span className="font-bold">Northlight</span>}
          brandHref="#"
          brandLabel="Northlight home"
          items={items}
          cta={{ label: "Start a project", href: "#capsule-card-about" }}
        />
        <p className="px-5 pt-20 pb-10 text-center text-xs text-slate-500 dark:text-white/50">Scroll down</p>
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="min-h-[14rem] border-t border-black/5 px-5 py-8 dark:border-white/[0.06]">
            <h3 className="text-base font-bold tracking-tight">{s.label}</h3>
          </section>
        ))}
      </div>
    </div>
  );
}
