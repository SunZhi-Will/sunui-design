"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";

import { cn } from "@/lib/utils";

export type ThemeMode = "system" | "light" | "dark";

const MODES: ThemeMode[] = ["system", "light", "dark"];

const defaultLabels: Record<ThemeMode, string> = { system: "System", light: "Light", dark: "Dark" };

/* ------------------------------------------------------------------ */
/* Theme plumbing: same convention as next-themes and shadcn/ui.       */
/* <html class="dark"> or class="light" forces a theme, no class means */
/* follow the OS. Your Tailwind `dark:` variant should match it:       */
/*   @custom-variant dark (&:where(.dark, .dark *));                   */
/* Inline themeScript() from theme-script.ts in <head> to avoid a     */
/* flash of the wrong theme on reload.                                */
/* ------------------------------------------------------------------ */

/** Put the theme class on <html>. "system" removes it so media queries decide. */
export function applyThemeMode(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (mode !== "system") root.classList.add(mode);
  root.style.colorScheme = mode === "system" ? "" : mode;
}

function readStored(storageKey: string): ThemeMode {
  try {
    const v = localStorage.getItem(storageKey);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

export interface UseThemeModeOptions {
  storageKey?: string;
  /** Crossfade the whole page with the View Transitions API. Skipped for reduced motion. */
  crossfade?: boolean;
}

/** Read and set the theme mode. `resolved` is what is actually showing: "light" or "dark". */
export function useThemeMode({ storageKey = "theme", crossfade = true }: UseThemeModeOptions = {}) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    setModeState(readStored(storageKey));
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(media.matches);
    const onMedia = () => setSystemDark(media.matches);
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey) setModeState(readStored(storageKey));
    };
    media.addEventListener("change", onMedia);
    window.addEventListener("storage", onStorage);
    return () => {
      media.removeEventListener("change", onMedia);
      window.removeEventListener("storage", onStorage);
    };
  }, [storageKey]);

  const setMode = useCallback(
    (next: ThemeMode) => {
      const commit = () => {
        applyThemeMode(next);
        try {
          if (next === "system") localStorage.removeItem(storageKey);
          else localStorage.setItem(storageKey, next);
        } catch {
          /* private mode: the class still applies for this page */
        }
        flushSync(() => setModeState(next));
      };
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (crossfade && !reduce && typeof document.startViewTransition === "function") document.startViewTransition(commit);
      else commit();
    },
    [storageKey, crossfade],
  );

  const resolved: "light" | "dark" = mode === "system" ? (systemDark ? "dark" : "light") : mode;
  return { mode, setMode, resolved };
}

/* ------------------------------------------------------------------ */
/* Picker: each option is a tiny version of the real interface, so    */
/* people see the result before they choose. System is split in half. */
/* ------------------------------------------------------------------ */

// The previews show a specific theme, so their colors are fixed on purpose.
const SWATCH = {
  light: { bg: "#f4f4f4", bar: "#ffffff", edge: "#e4e4e4", ink: "#a3a3a3" },
  dark: { bg: "#262626", bar: "#3a3a3a", edge: "#444444", ink: "#8f8f8f" },
} as const;

function MiniUi({ tone }: { tone: "light" | "dark" }) {
  const c = SWATCH[tone];
  return (
    <div className="absolute inset-0 flex items-center px-[14%]" style={{ background: c.bg }}>
      <div className="flex h-[38%] w-full items-center gap-[8%] rounded-full px-[10%]" style={{ background: c.bar, boxShadow: `inset 0 0 0 1px ${c.edge}` }}>
        <svg viewBox="0 0 12 12" className="h-[55%] shrink-0" fill="none" stroke={c.ink} strokeWidth={1.6} aria-hidden="true">
          <circle cx="5.2" cy="5.2" r="3.4" />
          <path d="m7.8 7.8 2.6 2.6" strokeLinecap="round" />
        </svg>
        <span className="h-[18%] w-[45%] rounded-full" style={{ background: c.edge }} />
      </div>
    </div>
  );
}

function Preview({ mode }: { mode: ThemeMode }) {
  if (mode !== "system") return <MiniUi tone={mode} />;
  return (
    <>
      <MiniUi tone="light" />
      <div className="absolute inset-0" style={{ clipPath: "inset(0 50% 0 0)" }}>
        <MiniUi tone="dark" />
      </div>
    </>
  );
}

export interface ThemePickerProps {
  value: ThemeMode;
  onValueChange: (mode: ThemeMode) => void;
  labels?: Partial<Record<ThemeMode, string>>;
  /** sm fits a header popover, md fits a settings page */
  size?: "sm" | "md";
  "aria-label"?: string;
  className?: string;
}

export function ThemePicker({ value, onValueChange, labels, size = "md", "aria-label": ariaLabel = "Theme", className }: ThemePickerProps) {
  const reduce = useReducedMotion();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const text = { ...defaultLabels, ...labels };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = MODES[(MODES.indexOf(value) + step + MODES.length) % MODES.length];
    onValueChange(next);
    refs.current[MODES.indexOf(next)]?.focus();
  };

  return (
    <div role="radiogroup" aria-label={ariaLabel} onKeyDown={onKeyDown} className={cn("flex", size === "sm" ? "gap-2" : "gap-3", className)}>
      {MODES.map((mode, i) => {
        const on = value === mode;
        return (
          <button
            key={mode}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onValueChange(mode)}
            className="group flex flex-col items-center gap-1.5 rounded-lg outline-none"
          >
            <span
              className={cn(
                "relative block overflow-hidden rounded-md transition-[box-shadow,transform] duration-150 group-hover:-translate-y-px group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background",
                size === "sm" ? "h-10 w-16" : "h-14 w-24",
                on ? "shadow-[0_0_0_2px_var(--foreground)]" : "shadow-[0_0_0_1px_var(--border)] group-hover:shadow-[0_0_0_1px_var(--muted-foreground)]",
              )}
            >
              <Preview mode={mode} />
              <AnimatePresence initial={false}>
                {on && (
                  <motion.span
                    key="check"
                    initial={reduce ? false : { scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={reduce ? { opacity: 0 } : { scale: 0.4, opacity: 0, transition: { duration: 0.1 } }}
                    transition={{ type: "spring", stiffness: 520, damping: 30 }}
                    className="absolute bottom-1 right-1 grid size-4 place-items-center rounded-full bg-foreground text-background shadow-[0_0_0_2px_var(--background)]"
                  >
                    <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m2.5 6.2 2.3 2.3 4.7-5" />
                    </svg>
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
            <span className={cn("text-xs transition-colors", on ? "font-medium text-foreground" : "text-muted-foreground group-hover:text-foreground")}>{text[mode]}</span>
          </button>
        );
      })}
    </div>
  );
}
