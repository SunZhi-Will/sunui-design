"use client";

import { useCallback, useEffect, useState } from "react";

import { RecordingHud, VolumeBar } from "./recording-hud";

// 模擬音訊引擎：每 80ms 推一次系統聲音與麥克風音量（0 到 100）
type Listener = (sys: number, mic: number) => void;
const listeners = new Set<Listener>();
let engine: ReturnType<typeof setInterval> | null = null;
let sys = 40;
let mic = 20;
function subscribeVolume(cb: Listener) {
  listeners.add(cb);
  if (!engine) {
    engine = setInterval(() => {
      sys = Math.max(5, Math.min(95, sys + (Math.random() - 0.5) * 30));
      mic = Math.random() < 0.3 ? Math.random() * 80 : mic * 0.6;
      listeners.forEach((l) => l(sys, mic));
    }, 80);
  }
  return () => {
    listeners.delete(cb);
    if (!listeners.size && engine) {
      clearInterval(engine);
      engine = null;
    }
  };
}

export default function RecordingHudDemo() {
  const [seconds, setSeconds] = useState(83);
  const [paused, setPaused] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [pen, setPen] = useState(false);
  const [color, setColor] = useState("#ef4444");
  const [strokes, setStrokes] = useState(true);

  // 主視窗每秒推一次計時給 HUD
  useEffect(() => {
    if (paused || stopped) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [paused, stopped]);

  const subSystem = useCallback((cb: (v: number) => void) => subscribeVolume((s) => cb(s)), []);
  const subMic = useCallback((cb: (v: number) => void) => subscribeVolume((_, m) => cb(m)), []);

  return (
    <div className="w-full max-w-3xl overflow-hidden rounded-[14px] border border-white/5 bg-[#111111] text-[#e5e5e5]">
      {/* 正在錄的畫面 */}
      <div className="relative h-80 overflow-hidden bg-[#1c1c1c]">
        <div className="absolute inset-4 rounded-lg bg-[#252525] p-4">
          <div className="h-3 w-24 rounded bg-white/15" />
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 min-w-0 rounded-md bg-white/5" />
            ))}
          </div>
          {strokes && pen && (
            <svg viewBox="0 0 200 60" className="absolute top-10 left-6 h-16 w-48" fill="none" aria-hidden="true">
              <path d="M6 40c30-30 60-34 90-14s60 18 98-12" stroke={color} strokeWidth="4" strokeLinecap="round" />
            </svg>
          )}
        </div>

        {stopped ? (
          <p role="status" className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-[rgba(15,15,15,0.88)] px-4 py-2.5 text-sm backdrop-blur-[8px]">
            Saved recording, {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
          </p>
        ) : (
          <RecordingHud
            fixed={false}
            seconds={seconds}
            paused={paused}
            onPauseToggle={() => setPaused((p) => !p)}
            onStop={() => setStopped(true)}
            drawEnabled
            penActive={pen}
            onPenActiveChange={(a) => {
              setPen(a);
              if (a) setStrokes(true);
            }}
            color={color}
            onColorChange={setColor}
            onClear={() => setStrokes(false)}
          />
        )}
      </div>

      {/* 錄製控制列的音量條 */}
      <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-white/5 bg-[#0F0F0F] px-6 py-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-medium text-slate-400">System audio</span>
          <VolumeBar gain={0.8} enabled color="#eab308" subscribe={subSystem} label="System audio level" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-medium text-slate-400">Microphone</span>
          <VolumeBar gain={1} enabled color="#d4d4d4" subscribe={subMic} label="Microphone level" />
        </div>
      </div>
    </div>
  );
}
