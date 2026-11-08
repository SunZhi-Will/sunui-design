"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { useThemeMode } from "@/components/ui/theme-picker";
import { THEME_STORAGE_KEY } from "@/lib/theme";

type Labels = { theme: string; themeLight: string; themeDark: string };

function Glyph({ dark }: { dark: boolean }) {
  return dark ? (
    <path d="M13.5 9.6A5.5 5.5 0 1 1 6.4 2.5a4.5 4.5 0 0 0 7.1 7.1Z" strokeLinejoin="round" />
  ) : (
    <>
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
    </>
  );
}

/** 頁首的主題按鈕：點一下直接在淺色與深色之間切換。選擇存在 localStorage，block 預覽 iframe 透過 storage 事件同步。 */
export function ThemeMenu({ labels }: { labels: Labels }) {
  const { resolved, setMode } = useThemeMode({ storageKey: THEME_STORAGE_KEY });
  const reduce = useReducedMotion();
  const dark = resolved === "dark";
  const next = dark ? labels.themeLight : labels.themeDark;

  return (
    <button
      type="button"
      aria-label={`${labels.theme}: ${next}`}
      title={next}
      onClick={() => setMode(dark ? "light" : "dark")}
      className="grid size-8 place-items-center overflow-hidden rounded-md border border-line text-subtle hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.svg
          key={dark ? "dark" : "light"}
          viewBox="0 0 16 16"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          aria-hidden="true"
          initial={reduce ? { opacity: 0 } : { opacity: 0, rotate: -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, rotate: 90, scale: 0.6 }}
          transition={{ type: "spring", stiffness: 520, damping: 30 }}
        >
          <Glyph dark={dark} />
        </motion.svg>
      </AnimatePresence>
    </button>
  );
}
