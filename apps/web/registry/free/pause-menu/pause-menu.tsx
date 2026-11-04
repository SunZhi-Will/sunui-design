"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type StoryVars = Record<`--story-${string}`, string>;

const DEEP = "0 24px 64px rgb(0 0 0 / 0.45)";
const KEYS = ["bg", "panel", "line", "text", "muted", "accent", "danger", "shadow"] as const;
const vars = (...v: string[]) => Object.fromEntries(KEYS.map((k, i) => [`--story-${k}`, v[i]])) as StoryVars;

// 設計語言（DESIGN-story.md）：所有顏色走 --story-* 變數，換 theme 即整套換皮
export const storyThemes = {
  ink: vars("#0b0e14", "rgb(14 18 28 / 0.86)", "rgb(234 228 214 / 0.14)", "#eae4d6", "rgb(234 228 214 / 0.6)", "#c9a063", "#c4553f", DEEP),
  rice: vars("#f4efe3", "rgb(250 246 236 / 0.94)", "rgb(60 48 32 / 0.18)", "#2a2219", "rgb(42 34 25 / 0.6)", "#9a6b2a", "#a33a26", "none"),
  moon: vars("#0a0d14", "rgb(12 16 26 / 0.86)", "rgb(220 228 240 / 0.14)", "#e4e8ef", "rgb(228 232 239 / 0.6)", "#a3b8d9", "#c4553f", DEEP),
};

export type StoryTheme = keyof typeof storyThemes | StoryVars;

export type PauseMenuItem = { id: string; label: ReactNode; onSelect?: () => void; disabled?: boolean };
export type PauseMenuSave = { chapter: ReactNode; scene: ReactNode; at: Date | number | string };

type TextLabel = "title" | "objective" | "resume" | "quickLoad" | "quickLoadArmed" | "exit" | "exitTitle" | "noSave" | "saveAndExit" | "exitWithoutSaving" | "back";

export type PauseMenuLabels = Partial<Record<TextLabel, ReactNode>> & {
  lastSave?: (chapter: ReactNode, scene: ReactNode, ago: string | null) => ReactNode;
  armedAnnouncement?: string;
};

export interface PauseMenuProps {
  open: boolean;
  onResume?: () => void;
  objective?: ReactNode;
  /** 介於「繼續」與「離開」之間的選項，例如日誌、存檔、設定 */
  items?: PauseMenuItem[];
  lastSave?: PauseMenuSave;
  onSaveAndExit?: () => void;
  onExit?: () => void;
  /** 有提供才顯示「快速讀檔」，需在 2.5 秒內再按一次 */
  onQuickLoad?: () => void;
  theme?: StoryTheme;
  /** 開啟時把焦點移進選單；靜態展示時可關閉 */
  autoFocus?: boolean;
  locale?: string;
  labels?: PauseMenuLabels;
  className?: string;
}

const defaultLabels: Required<PauseMenuLabels> = {
  title: "Paused",
  objective: "Objective",
  resume: "Resume",
  quickLoad: "Quick load",
  quickLoadArmed: "Press again to load",
  exit: "Exit to title",
  exitTitle: "Leave this journey?",
  lastSave: (chapter, scene, ago) => <>Your last save was {chapter}, {scene}{ago ? <>, {ago}</> : null}. Progress after that will be lost.</>,
  noSave: "You haven't saved yet. Everything in this session will be lost.",
  saveAndExit: "Save and exit",
  exitWithoutSaving: "Exit without saving",
  back: "Back",
  armedAnnouncement: "Press quick load again within a few seconds to load your last save.",
};

const ease = [0.22, 0.72, 0.2, 1] as const;
const snappy = { type: "spring", stiffness: 520, damping: 34 } as const;
const ARM_MS = 2500;

function relative(at: PauseMenuSave["at"], now: number, locale: string) {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const min = Math.round((now - new Date(at).getTime()) / 60_000);
  if (min < 60) return rtf.format(-Math.max(0, min), "minute");
  if (min < 1440) return rtf.format(-Math.round(min / 60), "hour");
  return rtf.format(-Math.round(min / 1440), "day");
}

export function PauseMenu(props: PauseMenuProps) {
  const { open, onResume, objective, items = [], lastSave, onSaveAndExit, onExit, onQuickLoad } = props;
  const { theme = "ink", autoFocus = true, locale = "en", labels, className } = props;
  const t = { ...defaultLabels, ...labels };
  const reduce = useReducedMotion() ?? false;
  const titleId = useId();
  const [step, setStep] = useState<"main" | "exit">("main");
  const [active, setActive] = useState(0);
  const [armed, setArmed] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const returning = useRef(false);

  // 快速讀檔：第一次按下只是預備，2.5 秒內再按一次才讀檔
  const quickLoad = () => {
    if (armTimer.current) clearTimeout(armTimer.current);
    if (armed) {
      setArmed(false);
      onQuickLoad?.();
      return;
    }
    setArmed(true);
    setAnnouncement(t.armedAnnouncement);
    armTimer.current = setTimeout(() => setArmed(false), ARM_MS);
  };

  const rows: PauseMenuItem[] = [
    { id: "__resume", label: t.resume, onSelect: onResume },
    ...items,
    ...(onQuickLoad ? [{ id: "__quickload", label: armed ? t.quickLoadArmed : t.quickLoad, onSelect: quickLoad }] : []),
    { id: "__exit", label: t.exit, onSelect: () => setStep("exit") },
  ];
  const exitIndex = rows.length - 1;

  // 開啟時記住原本焦點，關閉時歸還
  useEffect(() => {
    if (!open) return;
    setNow(Date.now());
    setStep("main");
    setActive(0);
    const prev = document.activeElement as HTMLElement | null;
    const raf = autoFocus ? requestAnimationFrame(() => rowRefs.current[0]?.focus()) : 0;
    return () => {
      cancelAnimationFrame(raf);
      if (armTimer.current) clearTimeout(armTimer.current);
      if (autoFocus) prev?.focus?.();
    };
  }, [open, autoFocus]);

  // 切換步驟後移動焦點：進入確認頁到主要按鈕，返回時回到「離開」
  useEffect(() => {
    if (!open) return;
    if (step === "exit") primaryRef.current?.focus();
    else if (returning.current) {
      returning.current = false;
      setActive(exitIndex);
      rowRefs.current[exitIndex]?.focus();
    }
  }, [step, open, exitIndex]);

  const back = () => {
    returning.current = true;
    setStep("main");
  };

  const move = (to: number) => {
    const n = rows.length;
    for (let k = 0; k < n; k++) {
      const i = (((to + (to < active ? -k : k)) % n) + n) % n;
      if (rows[i].disabled) continue;
      setActive(i);
      rowRefs.current[i]?.focus();
      return;
    }
  };

  const navKeys: Record<string, number> = { ArrowDown: active + 1, ArrowUp: active - 1, Home: 0, End: rows.length - 1 };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      if (step === "exit") back();
      else onResume?.();
    } else if (e.key === "Tab" && panelRef.current) {
      // 焦點限制在面板內
      const f = [...panelRef.current.querySelectorAll<HTMLElement>("button:not([disabled])")];
      if (!f.length) return;
      e.preventDefault();
      const i = f.indexOf(document.activeElement as HTMLElement);
      f[e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i + 1) % f.length].focus();
    } else if (step === "main" && e.key in navKeys) {
      e.preventDefault();
      move(navKeys[e.key]);
    }
  };

  const themeVars = (typeof theme === "string" ? storyThemes[theme] : theme) as CSSProperties;
  const fade = reduce ? { duration: 0 } : { duration: 0.22, ease };
  const ago = lastSave && now !== null ? relative(lastSave.at, now, locale) : null;
  const panelStyle: CSSProperties = {
    background: "var(--story-panel)",
    borderColor: "var(--story-line)",
    color: "var(--story-text)",
    boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.06), var(--story-shadow)",
  };
  const exitButtons = [
    { label: t.saveAndExit, onClick: onSaveAndExit, primary: true },
    { label: t.exitWithoutSaving, onClick: onExit },
    { label: t.back, onClick: back, quiet: true },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="pause"
          className={cn("absolute inset-0 z-20 flex items-center justify-center p-4 font-sans", className)}
          style={{ ...themeVars, background: "color-mix(in srgb, var(--story-bg) 62%, transparent)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fade}
          onKeyDown={onKeyDown}
        >
          <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className="w-full max-w-xs rounded-[3px] border p-5" style={panelStyle}>
            {step === "main" ? (
              <motion.div key="main" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={fade}>
                <h2 id={titleId} className="text-[11px] font-medium tracking-[0.18em] uppercase" style={{ color: "var(--story-muted)" }}>{t.title}</h2>
                {objective && (
                  <p className="mt-2 font-serif text-[15px] leading-relaxed">
                    <span className="sr-only">{t.objective}: </span>
                    {objective}
                  </p>
                )}
                <ul className="mt-4 border-t pt-2" style={{ borderColor: "var(--story-line)" }}>
                  {rows.map((row, i) => {
                    const on = i === active && !row.disabled;
                    return (
                      <li key={row.id}>
                        <button
                          ref={(el) => void (rowRefs.current[i] = el)}
                          type="button"
                          tabIndex={i === active ? 0 : -1}
                          disabled={row.disabled}
                          onFocus={() => setActive(i)}
                          onMouseEnter={() => !row.disabled && setActive(i)}
                          onClick={() => row.onSelect?.()}
                          className="relative flex w-full items-center py-2 pr-2 pl-4 text-left text-[15px] tracking-[0.06em] outline-none disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {/* 選中列：光條由左往右展開 */}
                          <motion.span
                            aria-hidden="true"
                            className="absolute inset-0 origin-left rounded-[2px] border-l-2"
                            style={{ background: "color-mix(in srgb, var(--story-accent) 16%, transparent)", borderColor: "var(--story-accent)" }}
                            initial={false}
                            animate={{ scaleX: on ? 1 : 0, opacity: on ? 1 : 0 }}
                            transition={reduce ? { duration: 0 } : { duration: 0.18, ease }}
                          />
                          <motion.span
                            className="relative"
                            initial={false}
                            animate={{ x: on && !reduce ? 6 : 0 }}
                            transition={snappy}
                            style={{ color: on ? "var(--story-accent)" : "var(--story-text)" }}
                          >
                            {row.label}
                          </motion.span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            ) : (
              <motion.div key="exit" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={fade}>
                <h2 id={titleId} className="font-serif text-lg tracking-[0.04em]">{t.exitTitle}</h2>
                <p className="mt-2 font-serif text-sm leading-relaxed" style={{ color: "var(--story-muted)" }}>
                  {lastSave ? t.lastSave(lastSave.chapter, lastSave.scene, ago) : t.noSave}
                </p>
                <div className="mt-5 flex flex-col gap-2">
                  {exitButtons.map((b, i) => (
                    <button
                      key={i}
                      ref={b.primary ? primaryRef : undefined}
                      type="button"
                      onClick={() => b.onClick?.()}
                      className={cn(
                        "rounded-[3px] px-3 py-2 text-sm tracking-[0.06em] outline-none focus-visible:ring-2 focus-visible:ring-[var(--story-accent)]",
                        b.primary && "font-medium focus-visible:ring-[var(--story-text)]",
                        !b.primary && !b.quiet && "border",
                        b.quiet && "underline-offset-4 hover:underline",
                      )}
                      style={
                        b.primary
                          ? { background: "var(--story-accent)", color: "var(--story-bg)" }
                          : { borderColor: "var(--story-line)", color: b.quiet ? "var(--story-muted)" : "var(--story-danger)" }
                      }
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
            <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
