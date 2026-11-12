"use client";

import { applyThemeMode } from "@/components/ui/theme-picker";
import { THEME_STORAGE_KEY } from "@/lib/theme";

type Labels = { theme: string; themeLight: string; themeDark: string };

function isDark() {
  const root = document.documentElement;
  if (root.classList.contains("dark")) return true;
  if (root.classList.contains("light")) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * 頁首的主題按鈕：點一下在淺色與深色之間切換。
 * 不用整頁 View Transition（頁面有大量預覽 iframe，截圖很重，按下去會卡一下），改成立即換色；
 * 換色那一幀暫停全站 transition，避免各元素以不同速度漸變。圖示由 html 的 dark class 以 CSS 驅動，
 * 和主題同一幀切換，也不會在 hydration 時閃一下。選擇存在 localStorage，預覽 iframe 透過 storage 事件同步。
 */
export function ThemeMenu({ labels }: { labels: Labels }) {
  function toggle() {
    const next = isDark() ? "light" : "dark";
    const freeze = document.createElement("style");
    freeze.textContent = "*:not([data-theme-icon]),*::before,*::after{transition:none!important}";
    document.head.appendChild(freeze);
    applyThemeMode(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* private mode: the class still applies for this page */
    }
    // 強制套用新樣式後再移除，讓 transition 恢復但不補播換色
    void window.getComputedStyle(document.body).opacity;
    requestAnimationFrame(() => freeze.remove());
  }

  const icon =
    "absolute inset-0 m-auto size-4 transition-[opacity,rotate,scale] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none";

  return (
    <button
      type="button"
      onClick={toggle}
      className="group relative grid size-8 place-items-center overflow-hidden rounded-md border border-line text-subtle transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-accent active:scale-95"
    >
      {/* 名稱跟著實際主題走，同樣用 CSS 切換，免去讀狀態 */}
      <span className="sr-only dark:hidden">{`${labels.theme}: ${labels.themeDark}`}</span>
      <span className="sr-only hidden dark:inline">{`${labels.theme}: ${labels.themeLight}`}</span>
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        aria-hidden="true"
        data-theme-icon
        className={`${icon} rotate-0 scale-100 opacity-100 dark:-rotate-90 dark:scale-50 dark:opacity-0`}
      >
        <circle cx="8" cy="8" r="3" />
        <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
      </svg>
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        data-theme-icon
        className={`${icon} rotate-90 scale-50 opacity-0 dark:rotate-0 dark:scale-100 dark:opacity-100`}
      >
        <path d="M13.5 9.6A5.5 5.5 0 1 1 6.4 2.5a4.5 4.5 0 0 0 7.1 7.1Z" />
      </svg>
    </button>
  );
}
