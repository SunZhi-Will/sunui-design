"use client";

import { GradientBackground } from "./classic-gradient-background";

export default function GradientBackgroundDemo() {
  // 首頁 hero：背景填滿 section
  return (
    <section className="relative isolate w-full max-w-5xl min-w-0 overflow-hidden rounded-2xl px-6 py-16 text-center text-white sm:py-24">
      <GradientBackground />
      <div className="relative">
        <p className="text-sm font-medium tracking-widest text-blue-300 uppercase">SunUI Design</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">Build interfaces that glow</h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-blue-100/80">
          An animated radial gradient with two breathing glow layers and a fine grid overlay.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="#get-started" className="rounded-lg bg-blue-500 px-5 py-2.5 font-semibold text-white shadow-lg shadow-blue-500/30 transition-colors hover:bg-blue-400">
            Get started
          </a>
          <a href="#components" className="rounded-lg border border-white/20 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-white/10">
            Browse components
          </a>
        </div>
      </div>
    </section>
  );
}
