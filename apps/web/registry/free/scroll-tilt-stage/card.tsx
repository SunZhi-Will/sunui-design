"use client";

import { useEffect, useRef } from "react";

import { useDemoText } from "@/lib/demo-locale";

import { ScrollTiltStage } from "./scroll-tilt-stage";

const copy = {
  en: { eyebrow: "Watch it work", heading: "Two streams, one timeline." },
  "zh-TW": { eyebrow: "實際看看", heading: "兩路直播，一條時間軸。" },
  "zh-CN": { eyebrow: "实际看看", heading: "两路直播，一条时间轴。" },
  ja: { eyebrow: "動きを見る", heading: "2 つの配信を 1 本のタイムラインで。" },
};

const ease = (p: number) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);

/** 型錄卡片：小捲動框自己往下捲，倒著放的畫面立起來再倒回去；滾輪或觸控一碰就交給你捲。 */
export default function ScrollTiltStageCard() {
  const t = useDemoText(copy);
  const scroller = useRef<HTMLDivElement>(null);

  // 卡片是靜止的縮圖，沒人會去捲它：自己來回捲一次又一次，讓「捲動時立起來」看得到
  useEffect(() => {
    const el = scroller.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let stopped = false;
    const stop = () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
    // [起點比例, 終點比例, 毫秒]：往下捲、停、捲回、停
    const legs: [number, number, number][] = [
      [0, 1, 2200],
      [1, 1, 1600],
      [1, 0, 1400],
      [0, 0, 1000],
    ];
    let leg = 0;
    let start = performance.now();
    const tick = (now: number) => {
      if (stopped) return;
      const [from, to, ms] = legs[leg];
      const p = Math.min(1, (now - start) / ms);
      const max = el.scrollHeight - el.clientHeight;
      el.scrollTop = (from + (to - from) * ease(p)) * max;
      if (p === 1) {
        leg = (leg + 1) % legs.length;
        start = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    el.addEventListener("wheel", stop, { passive: true });
    el.addEventListener("touchstart", stop, { passive: true });
    el.addEventListener("pointerdown", stop);
    return () => {
      stop();
      el.removeEventListener("wheel", stop);
      el.removeEventListener("touchstart", stop);
      el.removeEventListener("pointerdown", stop);
    };
  }, []);

  return (
    <div ref={scroller} className="h-[250px] w-[340px] overflow-y-auto rounded-xl bg-[#0a0a0a] text-[#f5f5f5]">
      <header className="flex min-h-[200px] flex-col justify-center px-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#d4a24c]">{t.eyebrow}</p>
        <h2 className="mt-2 max-w-[14em] font-serif text-xl font-normal tracking-tight text-balance">{t.heading}</h2>
      </header>

      <section className="px-5 pb-12">
        <ScrollTiltStage scrollContainer={scroller}>
          <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#141414] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-2 border-b border-white/[0.08] px-3 py-2">
              <span className="size-1.5 rounded-full bg-[#a3a3a3]" />
              <span className="text-xs font-semibold">Video Aligner</span>
              <span className="ml-auto rounded-full bg-[rgba(212,162,76,0.12)] px-1.5 py-0.5 font-mono text-[9px] tabular-nums text-[#d4a24c]">+1.42s</span>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3">
              {[0, 1].map((i) => (
                <div key={i} className="relative aspect-video min-w-0 overflow-hidden rounded-md border border-white/[0.08] bg-[#0a0a0a]">
                  <span className="absolute inset-x-0 top-[62%] h-px bg-white/[0.08]" />
                  <span className={i ? "absolute left-[58%] top-[30%] h-[32%] w-[18%] rounded-sm bg-white/10" : "absolute left-[22%] top-[24%] h-[38%] w-[24%] rounded-sm bg-white/10"} />
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-px font-mono text-[8px] text-[#d4d4d4]">{i ? "Twitch" : "YouTube"}</span>
                </div>
              ))}
            </div>
            <div className="px-3 pb-3">
              <div className="relative h-6 rounded bg-[#0a0a0a]">
                <span className="absolute left-[6%] top-1 h-[7px] w-[52%] rounded-sm bg-[#d4a24c]/70" />
                <span className="absolute bottom-1 left-[12%] h-[7px] w-[44%] rounded-sm bg-white/20" />
                <span className="absolute inset-y-0 left-[38%] w-px bg-[#f5f5f5]" />
              </div>
            </div>
          </div>
        </ScrollTiltStage>
      </section>
    </div>
  );
}
