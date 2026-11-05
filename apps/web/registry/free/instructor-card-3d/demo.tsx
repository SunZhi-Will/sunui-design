"use client";

import { useState } from "react";

import { InstructorCard3D, type InstructorCardData } from "./instructor-card-3d";

// 去背人像的替身插畫：暖色剪影，貼齊名片左欄底部
function Portrait({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 130" className={className} aria-hidden="true">
      <path d="M10 130c4-30 24-44 50-44s46 14 50 44z" fill="#2b2f3a" />
      <path d="M48 78h24v14c0 6-24 6-24 0z" fill="#e9b48f" />
      <ellipse cx="60" cy="52" rx="24" ry="28" fill="#f2c4a0" />
      <path d="M35 50c-2-22 14-32 27-32 16 0 26 10 24 30-6-8-16-12-26-12s-19 6-25 14z" fill="#3a2a22" />
    </svg>
  );
}

const card: InstructorCardData = {
  name: "Mira Chen",
  portrait: <Portrait className="w-[96%]" />,
  roles: ["AI workflow coach", "Product designer", "Ex-agency lead"],
  bio: "Mira has run hands-on AI workshops for 2,000+ designers and marketers. She teaches by building real deliverables in class, so every prompt you write ends up in your own toolkit.",
  chips: ["40+ workshops", "4.9 average rating", "Small cohorts"],
  href: "#instructor",
};

export default function InstructorCard3DDemo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex min-h-[34rem] w-full max-w-2xl min-w-0 items-center overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e0e] p-4 text-white/90 sm:p-6">
      <section className="grid w-full min-w-0 grid-cols-1 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] sm:grid-cols-[170px_1fr]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Open ${card.name}'s instructor card`}
          className="relative flex h-44 items-end justify-center overflow-hidden sm:h-full"
          style={{ background: "linear-gradient(168deg, #fff8ee 0%, #ffecd9 54%, #f7dabd 100%)" }}
        >
          <Portrait className="w-36" />
        </button>
        <div className="min-w-0 p-6">
          <p className="text-[11px] font-black tracking-[0.2em] text-[#e0a100]">YOUR INSTRUCTOR</p>
          <h2 className="mt-1 text-[22px] font-black leading-tight">I teach the way I work every day</h2>
          <p className="mt-3 text-[12.5px] leading-6 text-white/55">
            Every exercise comes from client projects. Tap the portrait to see my card.
          </p>
        </div>
      </section>
      <InstructorCard3D card={card} open={open} onClose={() => setOpen(false)} fixed={false} />
    </div>
  );
}
