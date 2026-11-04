"use client";

import { useEffect, useState } from "react";

import { RecordingHud } from "./recording-hud";

export default function RecordingHudDemo() {
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [saved, setSaved] = useState<number | null>(null);
  const [pen, setPen] = useState<string | null>(null);

  // 錄影中每 250ms 前進；暫停或停止時凍結
  useEffect(() => {
    if (paused || saved !== null) return;
    const id = setInterval(() => setElapsed((ms) => ms + 250), 250);
    return () => clearInterval(id);
  }, [paused, saved]);

  const clock = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;

  return (
    <div className="w-full max-w-3xl space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Record a product walkthrough</h2>
        <p className="mt-1 text-sm text-muted-foreground">Show your team how the new returns flow works. Drag the controls out of the way.</p>
      </div>

      <div className="relative h-80 overflow-hidden rounded-xl border border-border bg-muted/40">
        {/* 被錄的畫面 */}
        <div className="absolute inset-4 rounded-lg border border-border bg-card p-4 text-sm">
          <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">Returns</p>
          <p className="mt-1 font-semibold">Order SU-48213</p>
          <div className="mt-3 space-y-2">
            {["Stoneware Mug, damaged", "Canvas Tote, wrong size"].map((row) => (
              <div key={row} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <span>{row}</span>
                <span className="text-xs text-muted-foreground">Refund to card</span>
              </div>
            ))}
          </div>
          {pen && (
            <p className="mt-3 text-xs text-muted-foreground">
              Pen <span className="inline-block size-2 rounded-full align-middle" style={{ backgroundColor: pen }} /> ready
            </p>
          )}
        </div>

        {saved === null ? (
          <RecordingHud
            fixed={false}
            elapsed={elapsed}
            paused={paused}
            onPause={() => setPaused(true)}
            onResume={() => setPaused(false)}
            onStop={() => setSaved(elapsed)}
            onSwatch={setPen}
            onClear={() => setPen(null)}
          />
        ) : (
          <div
            role="status"
            className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm shadow-sm"
          >
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            <span>
              Saved, <span className="font-mono tabular-nums">{clock(saved)}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
