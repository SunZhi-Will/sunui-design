"use client";

import { useState } from "react";

import { PauseMenu, storyThemes } from "./pause-menu";

// 原創場景：黃昏渡口，河面、遠山與一盞燈
function Scene() {
  return (
    <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden="true">
      <rect width="400" height="250" fill="#141a26" />
      <path d="M0 150 L70 104 L130 136 L210 86 L290 132 L350 108 L400 130 V250 H0Z" fill="#1d2433" />
      <rect y="168" width="400" height="82" fill="#101521" />
      <path d="M0 176 H400 M30 196 H150 M220 210 H370" stroke="#2a3346" strokeWidth="1.5" />
      <rect x="282" y="138" width="4" height="34" fill="#3a3326" />
      <circle cx="284" cy="134" r="5" fill="#c9a063" opacity="0.85" />
    </svg>
  );
}

export default function PauseMenuDemo() {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [atTitle, setAtTitle] = useState(false);
  // 上次存檔時間在初始化時固定
  const [savedAt] = useState(() => Date.now() - 4 * 60_000);
  const lastSave = { chapter: "Chapter 2", scene: "The Ferry", at: savedAt };

  const note = (text: string) => {
    setToast(text);
    setOpen(false);
  };

  const items = [
    { id: "journal", label: "Journal", onSelect: () => note("Journal: 3 new entries") },
    { id: "save", label: "Save", onSelect: () => note("Saved to slot 1") },
    { id: "load", label: "Load", disabled: true },
    { id: "settings", label: "Settings", onSelect: () => note("Settings opened") },
  ];

  return (
    <div className="grid w-full max-w-3xl gap-4 md:grid-cols-2">
      <div className="relative min-h-[26rem] overflow-hidden rounded-[3px] font-sans" style={{ ...storyThemes.ink, color: "var(--story-text)" }}>
        <Scene />
        {atTitle ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
            <p className="font-serif text-2xl tracking-[0.18em]">Lantern Ferry</p>
            <p className="font-serif text-sm" style={{ color: "var(--story-muted)" }}>
              渡口的燈，等你回來。
            </p>
            <button
              type="button"
              onClick={() => setAtTitle(false)}
              className="rounded-[3px] border px-4 py-2 text-sm tracking-[0.1em]"
              style={{ borderColor: "var(--story-line)" }}
            >
              Continue
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setToast(null);
                setOpen(true);
              }}
              className="absolute top-3 right-3 z-10 rounded-[3px] border px-3 py-1.5 text-xs tracking-[0.16em] uppercase"
              style={{ borderColor: "var(--story-line)", background: "var(--story-panel)" }}
            >
              Pause
            </button>
            <p className="absolute right-4 bottom-4 left-4 font-serif text-[15px] leading-relaxed">
              The ferryman&apos;s lamp is still lit. Someone crossed before you.
            </p>
            {toast && (
              <p
                role="status"
                className="absolute top-3 left-3 rounded-[3px] border px-3 py-1.5 text-xs"
                style={{ borderColor: "var(--story-line)", background: "var(--story-panel)" }}
              >
                {toast}
              </p>
            )}
          </>
        )}
        <PauseMenu
          open={open}
          onResume={() => setOpen(false)}
          objective="Find the ferryman before dusk"
          items={items}
          lastSave={lastSave}
          onQuickLoad={() => note("Loaded Chapter 2, The Ferry")}
          onSaveAndExit={() => {
            setOpen(false);
            setAtTitle(true);
          }}
          onExit={() => {
            setOpen(false);
            setAtTitle(true);
          }}
        />
      </div>

      <div className="relative min-h-[26rem] overflow-hidden rounded-[3px]" style={{ background: storyThemes.rice["--story-bg"] }}>
        <PauseMenu
          open
          theme="rice"
          autoFocus={false}
          objective="把信交給山腳的茶棚老闆"
          items={[
            { id: "journal", label: "Journal" },
            { id: "settings", label: "Settings" },
          ]}
        />
      </div>
    </div>
  );
}
