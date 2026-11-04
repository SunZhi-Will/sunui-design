"use client";

import { useRef } from "react";

import { CapsuleNav, type CapsuleNavItem } from "./capsule-nav";

const sections = [
  { id: "capsule-work", label: "Work", body: "A booking system for a ceramics studio and a live caption tool for streamers." },
  { id: "capsule-services", label: "Services", body: "Product sites, internal tools and small automations. Fixed scope, weekly demos." },
  { id: "capsule-about", label: "About", body: "Design and engineering in the same room, so what you approve is what ships." },
];

const items: CapsuleNavItem[] = sections.map((s) => ({ key: s.id, label: s.label, href: `#${s.id}`, sectionId: s.id }));

export default function CapsuleNavDemo() {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative w-full max-w-[56rem] min-w-0 overflow-hidden rounded-2xl border border-black/10 bg-white text-slate-900 dark:border-white/10 dark:bg-black dark:text-white/90">
      <div ref={scrollRef} className="h-[28rem] overflow-y-auto overscroll-contain">
        <CapsuleNav
          fixed={false}
          scrollContainer={scrollRef}
          hideOnScroll
          brand={<span className="font-bold">Northlight</span>}
          brandHref="#"
          brandLabel="Northlight home"
          items={items}
          cta={{ label: "Start a project", href: "#capsule-about" }}
        />
        <div className="px-6 pt-28 pb-16 text-center">
          <h2 className="mx-auto max-w-md text-3xl font-black tracking-tight">Small team, finished products</h2>
        </div>
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="min-h-[24rem] scroll-mt-20 border-t border-black/5 px-6 py-14 sm:px-10 dark:border-white/[0.06]">
            <h3 className="text-xl font-bold tracking-tight">{s.label}</h3>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-white/55">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
