"use client";

import { TiltedPhonePair } from "./tilted-phone-pair";

// 後方手機：雲端主控台，列出正在跑流程的裝置
const consoleScreen = (
  <>
    <div className="relative mb-3 rounded-lg border border-white/10 bg-zinc-950/80 p-2 text-[11px] text-zinc-200">
      Devices (42/50 Online)
    </div>
    <div className="space-y-2">
      {[1, 2, 3].map((idx) => (
        <div key={idx} className="rounded-lg border border-white/10 bg-zinc-950/70 p-2">
          <div className="h-12 rounded border border-white/10 bg-zinc-800/60" />
          <p className="mt-1 text-[10px] text-zinc-400">Running: Threads_Auto_Reply.json</p>
        </div>
      ))}
    </div>
  </>
);

// 前方手機：即時裝置畫面
const liveScreen = (
  <>
    <div className="relative mb-3 flex items-center justify-between text-[10px] text-zinc-300">
      <span>Live Device Screens</span>
      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-300">Active</span>
    </div>
    <div className="grid gap-2">
      <div className="h-20 rounded border border-white/10 bg-gradient-to-b from-zinc-800 to-zinc-900" />
      <div className="h-16 rounded border border-white/10 bg-gradient-to-b from-zinc-800 to-zinc-900" />
    </div>
  </>
);

export default function TiltedPhonePairDemo() {
  return (
    <section className="relative isolate w-full max-w-2xl min-w-0 overflow-hidden rounded-3xl bg-zinc-950 px-4 py-8 sm:px-8">
      <div className="pointer-events-none absolute -left-40 -top-36 -z-10 h-[26rem] w-[26rem] rounded-full bg-emerald-500/20 blur-[110px]" />
      <div className="pointer-events-none absolute -right-40 top-6 -z-10 h-[24rem] w-[24rem] rounded-full bg-indigo-500/22 blur-[110px]" />
      <TiltedPhonePair
        label="OpenRing Cloud console and live device screens on two phones"
        callout="Build me a dark-mode fleet cockpit for Android automation with live device status, workflow deployment, and execution logs."
        backScreen={consoleScreen}
        frontScreen={liveScreen}
      />
    </section>
  );
}
