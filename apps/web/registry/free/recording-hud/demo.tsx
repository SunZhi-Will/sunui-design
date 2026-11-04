"use client";

import { useEffect, useState } from "react";

import { RecordingHud } from "./recording-hud";

export default function RecordingHudDemo() {
  const [seconds, setSeconds] = useState(83);
  const [paused, setPaused] = useState(false);
  const [stopped, setStopped] = useState(false);

  // 主視窗每秒推一次計時給 HUD
  useEffect(() => {
    if (paused || stopped) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [paused, stopped]);

  return (
    <div className="relative h-72 w-full max-w-3xl overflow-hidden rounded-[14px] border border-white/5 bg-[#1c1c1c] text-[#e5e5e5]">
      {/* 正在錄的畫面 */}
      <div className="absolute inset-4 rounded-lg bg-[#252525] p-4">
        <div className="h-3 w-24 rounded bg-white/15" />
        <div className="mt-4 h-20 rounded-md bg-white/5" />
      </div>

      {stopped ? (
        <p role="status" className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-[rgba(15,15,15,0.88)] px-4 py-2.5 text-sm whitespace-nowrap backdrop-blur-[8px]">
          Saved recording, {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
        </p>
      ) : (
        <RecordingHud
          fixed={false}
          seconds={seconds}
          paused={paused}
          onPauseToggle={() => setPaused((p) => !p)}
          onStop={() => setStopped(true)}
        />
      )}
    </div>
  );
}
