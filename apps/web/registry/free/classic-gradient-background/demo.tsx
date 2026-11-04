"use client";

import { GradientBackground, gradientBackgroundPresets } from "./classic-gradient-background";

const swatches = [
  { key: "ocean", name: "Ocean", note: "8s cycle, 16 x 28 grid" },
  { key: "sunset", name: "Sunset", note: "6s cycle, stronger pulse" },
  { key: "forest", name: "Forest", note: "10s cycle, 18 x 26 grid" },
  { key: "purple", name: "Purple", note: "4s cycle, scale to 1.5" },
] as const;

export default function GradientBackgroundDemo() {
  return (
    <div className="flex w-full max-w-5xl flex-col gap-4">
      {/* 首頁 hero：背景填滿 section */}
      <section className="relative isolate overflow-hidden rounded-2xl px-6 py-16 text-center text-white sm:py-24">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {swatches.map((s) => (
          <div key={s.key} className="relative isolate min-w-0 overflow-hidden rounded-xl p-5 text-white">
            <GradientBackground {...gradientBackgroundPresets[s.key]} />
            <div className="relative flex h-28 flex-col justify-end">
              <p className="text-lg font-semibold">{s.name}</p>
              <p className="text-sm text-white/70">{s.note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
