"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";

import { ThemePicker, useThemeMode, type ThemeMode } from "@/components/ui/theme-picker";
import { THEME_STORAGE_KEY } from "@/lib/theme";

type Labels = { theme: string; themeSystem: string; themeLight: string; themeDark: string; themeHint: string };

function Glyph({ mode }: { mode: ThemeMode }) {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden="true">
      {mode === "light" && (
        <>
          <circle cx="8" cy="8" r="3" />
          <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
        </>
      )}
      {mode === "dark" && <path d="M13.5 9.6A5.5 5.5 0 1 1 6.4 2.5a4.5 4.5 0 0 0 7.1 7.1Z" strokeLinejoin="round" />}
      {mode === "system" && (
        <>
          <circle cx="8" cy="8" r="5.5" />
          <path d="M8 2.5v11a5.5 5.5 0 0 0 0-11Z" fill="currentColor" stroke="none" />
        </>
      )}
    </svg>
  );
}

/** 頁首的主題按鈕：點開是 theme-picker 卡片。選擇存在 localStorage，block 預覽 iframe 透過 storage 事件同步。 */
export function ThemeMenu({ labels }: { labels: Labels }) {
  const { mode, setMode } = useThemeMode({ storageKey: THEME_STORAGE_KEY });
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-label={labels.theme}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="grid size-8 place-items-center rounded-md border border-line text-subtle hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
      >
        <Glyph mode={mode} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.1 } }}
            transition={{ type: "spring", stiffness: 520, damping: 34 }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 top-10 z-50 rounded-xl border border-line bg-card p-3 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.25)]"
          >
            <ThemePicker
              size="sm"
              value={mode}
              onValueChange={setMode}
              aria-label={labels.theme}
              labels={{ system: labels.themeSystem, light: labels.themeLight, dark: labels.themeDark }}
            />
            <p className="mt-2.5 max-w-[14rem] text-[11px] leading-snug text-subtle">{labels.themeHint}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
