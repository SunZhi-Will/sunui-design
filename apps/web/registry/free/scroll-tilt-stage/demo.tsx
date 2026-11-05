"use client";

import { useRef } from "react";

import { ScrollTiltStage } from "./scroll-tilt-stage";

export default function ScrollTiltStageDemo() {
  const scroller = useRef<HTMLDivElement>(null);

  return (
    <div ref={scroller} className="h-[520px] w-full max-w-4xl overflow-y-auto rounded-xl bg-[#0d0f13] text-[#eceef2]">
      <header className="flex min-h-[420px] flex-col justify-center px-6 md:px-10">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#f5b324]">Watch it work</p>
        <h2 className="mt-3 max-w-[16em] text-3xl font-black tracking-tight text-balance">Two streams, one timeline, perfectly in sync.</h2>
        <p className="mt-3 text-sm text-[#8f97a6]">Scroll down to bring the demo upright.</p>
      </header>

      <section className="px-4 pb-24 md:px-10">
        <ScrollTiltStage scrollContainer={scroller}>
          {/* 替身畫面：擴充功能的對齊視窗 */}
          <div className="overflow-hidden rounded-xl border border-[#2a2f3a] bg-[#161920] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-2 border-b border-[#2a2f3a] px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-[#ff4d5e]" />
              <span className="text-sm font-semibold">Video Aligner</span>
              <span className="ml-auto rounded-full bg-[rgba(245,179,36,0.14)] px-2 py-0.5 font-mono text-[10px] text-[#f5b324]">+1.42s</span>
            </div>
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
              {["linear-gradient(135deg, #3a2a10, #1e222b)", "linear-gradient(135deg, #10263a, #1e222b)"].map((bg, i) => (
                <div key={i} className="relative aspect-video min-w-0 rounded-lg" style={{ background: bg }}>
                  <span className="absolute bottom-2 left-2 rounded bg-black/50 px-1.5 py-0.5 font-mono text-[10px]">{i ? "Twitch" : "YouTube"}</span>
                </div>
              ))}
            </div>
            <div className="px-4 pb-4">
              <div className="relative h-8 rounded-md bg-[#1e222b]">
                <span className="absolute inset-y-1 left-[6%] w-[52%] rounded bg-[#f5b324]/70" />
                <span className="absolute inset-y-1 left-[12%] w-[44%] rounded bg-[#d9730b]/50" />
                <span className="absolute inset-y-0 left-[38%] w-px bg-[#ffdd7a]" />
              </div>
            </div>
          </div>
        </ScrollTiltStage>
      </section>
    </div>
  );
}
