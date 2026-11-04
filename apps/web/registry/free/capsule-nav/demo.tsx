"use client";

import { useRef } from "react";

import { CapsuleNav, type CapsuleNavItem } from "./capsule-nav";

const items: CapsuleNavItem[] = [
  {
    key: "work",
    label: "Work",
    href: "#capsule-work",
    sectionId: "capsule-work",
  },
  {
    key: "services",
    label: "Services",
    href: "#capsule-services",
    sectionId: "capsule-services",
  },
  {
    key: "about",
    label: "About",
    href: "#capsule-about",
    sectionId: "capsule-about",
  },
  {
    key: "updates",
    label: "Updates",
    href: "#capsule-updates",
    sectionId: "capsule-updates",
  },
];

const sections = [
  {
    id: "capsule-work",
    title: "Selected work",
    body: "A booking system for a ceramics studio, a live caption tool for streamers and a course platform that sells its own tickets.",
  },
  {
    id: "capsule-services",
    title: "What we build",
    body: "Product sites, internal tools and the small automations that save a team an hour a day. Fixed scope, weekly demos.",
  },
  {
    id: "capsule-about",
    title: "A two person studio",
    body: "Design and engineering in the same room, so the thing you approve is the thing that ships.",
  },
  {
    id: "capsule-updates",
    title: "Updates",
    body: "Notes from recent launches: what we measured, what we cut and what we would do again.",
  },
];

function Logo() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 transition-transform duration-500 group-hover:rotate-180"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="5" fill="#F5C045" />
      <g stroke="#F5C045" strokeWidth="2" strokeLinecap="round">
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </g>
    </svg>
  );
}

export default function CapsuleNavDemo() {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative w-full max-w-[56rem] overflow-hidden rounded-2xl border border-black/10 bg-white text-slate-900 dark:border-white/10 dark:bg-black dark:text-white/90">
      <div
        ref={scrollRef}
        className="h-[32rem] overflow-y-auto overscroll-contain"
      >
        <CapsuleNav
          fixed={false}
          scrollContainer={scrollRef}
          hideOnScroll
          brand={
            <>
              <Logo />
              <span>Northlight</span>
            </>
          }
          brandHref="#"
          brandLabel="Northlight home"
          items={items}
          cta={{ label: "Start a project", href: "#capsule-updates" }}
        />

        <div className="px-6 pt-28 pb-16 text-center sm:px-10">
          <p className="text-[12px] font-bold tracking-[0.2em] text-amber-600 uppercase dark:text-[#F5C045]">
            Product studio
          </p>
          <h2 className="mx-auto mt-3 max-w-md text-3xl font-black tracking-tight">
            Small team, finished products
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-600 dark:text-white/55">
            Scroll down: the bar turns into a capsule, hides while you read and
            comes back when you scroll up.
          </p>
        </div>

        {sections.map((s) => (
          <section
            key={s.id}
            id={s.id}
            className="min-h-[26rem] scroll-mt-20 border-t border-black/5 px-6 py-14 sm:px-10 dark:border-white/[0.06]"
          >
            <h3 className="text-xl font-bold tracking-tight">{s.title}</h3>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-white/55">
              {s.body}
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  aria-hidden="true"
                  className="h-24 min-w-0 rounded-xl bg-slate-100 dark:bg-white/[0.05]"
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
