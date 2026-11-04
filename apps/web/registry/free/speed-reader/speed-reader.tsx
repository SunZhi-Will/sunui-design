"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/* 文字處理（照原本的 textProcessor） */

const IMPORTANT_SYMBOLS = ["/", ":", "-", ".", ",", "?", "!", "@", "#", "%", "&", "+", "=", "_"];
const CJK_PUNCT = ["【", "】", "《", "》", "「", "」", "『", "』", "，", "。", "、", "：", "；", "！", "？", "（", "）"];

/** 英數字連續視為一個單位，其餘每個字元一個單位；filterSymbols 時只保留重要符號、全形字與中文 */
export function processText(inputText: string, filterSymbols: boolean): string[] {
  const out: string[] = [];
  let currentWord = "";
  for (const char of inputText.split("")) {
    if (/^[a-zA-Z0-9]$/.test(char)) {
      currentWord += char;
      continue;
    }
    if (currentWord) {
      out.push(currentWord);
      currentWord = "";
    }
    if (/\s/.test(char)) continue;
    if (filterSymbols && !IMPORTANT_SYMBOLS.includes(char)) {
      const code = char.charCodeAt(0);
      const isFullWidth = code >= 0xff01 && code <= 0xff5e;
      const isChinese = code >= 0x4e00 && code <= 0x9fa5;
      if (isFullWidth || isChinese || CJK_PUNCT.includes(char)) out.push(char);
    } else {
      out.push(char);
    }
  }
  if (currentWord) out.push(currentWord);
  return out.filter((m) => m && m.trim() !== "");
}

/** 依字數決定字級；數字放大 1.15 倍，單一符號放大 1.3 倍 */
export function getWordSize(word?: string): CSSProperties {
  if (!word) return { fontSize: "7.5rem", lineHeight: "1" };
  const length = word.length;
  let f = 1;
  if (/^\d+$/.test(word)) f = 1.15;
  if (/^[^\w\s]$/.test(word)) f = 1.3;
  const steps: [number, number][] = [
    [1, 7.5],
    [2, 7],
    [3, 6.5],
    [4, 6],
    [5, 5.5],
    [7, 5],
    [9, 4.5],
    [12, 4],
  ];
  const size = steps.find(([max]) => length <= max)?.[1] ?? 3.5;
  return { fontSize: `${size * f}rem`, lineHeight: "1" };
}

const formatReadTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/* 主題（照原本的 ThemeContext） */

function themeStyles(dark: boolean) {
  return {
    bgColor: dark ? "bg-black" : "bg-white",
    textColor: dark ? "text-white" : "text-black",
    elementBgColor: dark ? "bg-neutral-800" : "bg-neutral-200",
    buttonHoverBg: dark ? "hover:bg-neutral-800" : "hover:bg-neutral-200",
    dropdownBgColor: dark ? "bg-black" : "bg-white",
    dropdownHoverBgColor: dark ? "hover:bg-neutral-800" : "hover:bg-neutral-200",
    borderColor: dark ? "border-neutral-700" : "border-neutral-300",
    elementHoverBg: dark ? "hover:bg-neutral-700" : "hover:bg-neutral-300",
    overlayBgColor: dark ? "bg-neutral-900" : "bg-white",
    overlayBorderColor: dark ? "border-neutral-800" : "border-neutral-300",
    titleTextColor: dark ? "text-white" : "text-black",
    contentTextColor: dark ? "text-neutral-400" : "text-neutral-600",
    keyBgColor: dark ? "bg-neutral-800" : "bg-neutral-200",
    keyTextColor: dark ? "text-white" : "text-black",
    hover: dark ? "hover:bg-neutral-700" : "hover:bg-neutral-200",
  };
}
type Theme = ReturnType<typeof themeStyles>;

/* 圖示（heroicons 24 solid） */

const icons = {
  play: "M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z",
  pause:
    "M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z",
  reset:
    "M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z",
  sun: "M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z",
  moon: "M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z",
  exitFs:
    "M3.22 3.22a.75.75 0 0 1 1.06 0l3.97 3.97V4.5a.75.75 0 0 1 1.5 0V9a.75.75 0 0 1-.75.75H4.5a.75.75 0 0 1 0-1.5h2.69L3.22 4.28a.75.75 0 0 1 0-1.06Zm17.56 0a.75.75 0 0 1 0 1.06l-3.97 3.97h2.69a.75.75 0 0 1 0 1.5H15a.75.75 0 0 1-.75-.75V4.5a.75.75 0 0 1 1.5 0v2.69l3.97-3.97a.75.75 0 0 1 1.06 0ZM3.75 15a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-2.69l-3.97 3.97a.75.75 0 0 1-1.06-1.06l3.97-3.97H4.5a.75.75 0 0 1-.75-.75Zm10.5 0a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-2.69l3.97 3.97a.75.75 0 1 1-1.06 1.06l-3.97-3.97v2.69a.75.75 0 0 1-1.5 0V15Z",
  enterFs:
    "M15 3.75a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0V5.56l-3.97 3.97a.75.75 0 1 1-1.06-1.06l3.97-3.97h-2.69a.75.75 0 0 1-.75-.75Zm-12 0A.75.75 0 0 1 3.75 3h4.5a.75.75 0 0 1 0 1.5H5.56l3.97 3.97a.75.75 0 0 1-1.06 1.06L4.5 5.56v2.69a.75.75 0 0 1-1.5 0v-4.5Zm11.47 11.78a.75.75 0 1 1 1.06-1.06l3.97 3.97v-2.69a.75.75 0 0 1 1.5 0v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1 0-1.5h2.69l-3.97-3.97Zm-4.94-1.06a.75.75 0 0 1 0 1.06L5.56 19.5h2.69a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 1 1.5 0v2.69l3.97-3.97a.75.75 0 0 1 1.06 0Z",
  info: "M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z",
  close:
    "M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z",
};

function Icon({ d, className }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d={d} />
    </svg>
  );
}

/* 文案 */

const defaultLabels = {
  region: "Flash reader",
  empty: "Type or paste text to start flash reading",
  play: "Play",
  pause: "Pause",
  reset: "Reset",
  needText: "Enter some text first",
  progress: "Reading position",
  perMinute: "/min",
  speedTitle: "Speed (words per minute)",
  faster: "Fast",
  slower: "Slow",
  filterSymbols: "Filter symbols",
  toLight: "Switch to light theme",
  toDark: "Switch to dark theme",
  enterFullscreen: "Enter fullscreen",
  exitFullscreen: "Exit fullscreen",
  help: "Show help",
  expand: "(click to expand full text)",
  expandTitle: "Click to view full text",
  pickStart: "Choose where to start",
  pickHint: "Click any word to start reading there",
  cancel: "Cancel",
  close: "Close",
  startReading: "Start reading",
  pauseReading: "Pause reading",
  speeds: [
    { value: 60, label: "Very slow (60/min)" },
    { value: 120, label: "Slower (120/min)" },
    { value: 180, label: "Slow (180/min)" },
    { value: 240, label: "Normal (240/min)", isDefault: true },
    { value: 300, label: "Brisk (300/min)" },
    { value: 400, label: "Fast (400/min)" },
    { value: 500, label: "Faster (500/min)" },
    { value: 700, label: "Very fast (700/min)" },
    { value: 1000, label: "Lightning (1000/min)" },
  ] as { value: number; label: string; isDefault?: boolean }[],
  shortcutsTitle: "Keyboard shortcuts",
  shortcuts: [
    ["Space", "Play or pause"],
    ["←", "Previous word"],
    ["→", "Next word"],
    ["F", "Toggle symbol filter"],
    ["H", "Show or hide help"],
    ["ESC", "Exit fullscreen"],
    ["T", "Toggle theme"],
  ] as [string, string][],
  readingTipsTitle: "Reading tips",
  readingTips: [
    "Click the reading area to play or pause",
    "Click the caption below to expand the full text",
    "Click any word in the full text to start there",
    "Adjust the speed to find a comfortable pace",
  ],
  tipsTitle: "Tips",
  tips: [
    "Click the word area to start or pause reading",
    "Click the caption under it to open the full text and pick any starting point",
    "Use the fullscreen button on the right for distraction-free reading",
    "In fullscreen: Space (play or pause), arrow keys (step), H (help)",
    "Drag the progress bar to jump to any position",
    "Filter symbols removes extra punctuation but keeps date and time symbols",
    "Increase the speed gradually as you get comfortable",
  ],
};

export type SpeedReaderLabels = Partial<typeof defaultLabels>;

export interface SpeedReaderProps {
  text: string;
  /** 每個字的間隔毫秒數，預設 250 */
  defaultSpeed?: number;
  defaultFilterSymbols?: boolean;
  /** 播放器主題，預設亮色 */
  defaultDark?: boolean;
  /** 顯示主題切換按鈕（原本的「自定義播放器主題」開啟時） */
  themeToggle?: boolean;
  /** 顯示下方的使用提示卡 */
  showTips?: boolean;
  /** true 時全螢幕鋪滿視窗並鎖住頁面捲動；false 時蓋住最近的定位容器 */
  fixed?: boolean;
  /** 處理後的單位數改變時通知（原本頁面顯示「分割為 N 個閱讀單位」） */
  onWordsChange?: (count: number) => void;
  labels?: SpeedReaderLabels;
  className?: string;
}

export function SpeedReader({
  text,
  defaultSpeed = 250,
  defaultFilterSymbols = false,
  defaultDark = false,
  themeToggle = true,
  showTips = true,
  fixed = false,
  onWordsChange,
  labels,
  className,
}: SpeedReaderProps) {
  const t = { ...defaultLabels, ...labels };
  const [filterSymbols, setFilterSymbols] = useState(defaultFilterSymbols);
  const words = useMemo(() => processText(text, filterSymbols), [text, filterSymbols]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(defaultSpeed);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isDark, setIsDark] = useState(defaultDark);
  const [readTime, setReadTime] = useState(0);
  const [showFullText, setShowFullText] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const mouseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMouseMoveRef = useRef(0);
  const scrollPositionRef = useRef({ x: 0, y: 0 });
  const theme = themeStyles(isDark);

  useEffect(() => onWordsChange?.(words.length), [words.length, onWordsChange]);

  // 文字改變時重置
  useEffect(() => {
    setCurrentWordIndex(0);
    setIsPlaying(false);
    setReadTime(0);
    startTimeRef.current = null;
  }, [text]);

  // 過濾設定改變時，位置不超過新的長度
  useEffect(() => {
    setCurrentWordIndex((prev) => Math.max(0, Math.min(prev, words.length - 1)));
  }, [words.length]);

  const togglePlayPause = useCallback(() => {
    if (words.length === 0) return;
    setIsPlaying((prev) => {
      const next = !prev;
      if (next && !startTimeRef.current) startTimeRef.current = Date.now();
      // 全螢幕開始播放時，短暫延遲後隱藏控制項
      if (isFullscreen && next) setTimeout(() => setShowControls(false), 800);
      else if (!next) setShowControls(true);
      return next;
    });
  }, [isFullscreen, words.length]);

  const handleReset = useCallback(() => {
    setCurrentWordIndex(0);
    setIsPlaying(false);
    setReadTime(0);
    startTimeRef.current = null;
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      if (!prev && typeof window !== "undefined") scrollPositionRef.current = { x: window.scrollX, y: window.scrollY };
      return !prev;
    });
  }, []);

  // 滑鼠移動顯示控制項；播放中靜止 3 秒後隱藏
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    lastMouseMoveRef.current = Date.now();
    if (mouseTimerRef.current) clearTimeout(mouseTimerRef.current);
    if (isPlaying && !showHelp) {
      mouseTimerRef.current = setTimeout(() => {
        if (Date.now() - lastMouseMoveRef.current >= 3000) setShowControls(false);
      }, 3000);
    }
  }, [isPlaying, showHelp]);

  // 播放狀態改變時更新控制項顯示
  useEffect(() => {
    if (!isPlaying || showHelp) {
      setShowControls(true);
      if (mouseTimerRef.current) {
        clearTimeout(mouseTimerRef.current);
        mouseTimerRef.current = null;
      }
    } else if (isFullscreen) {
      const timer = setTimeout(() => setShowControls(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, isFullscreen, showHelp]);

  // 閱讀時間，每秒更新
  useEffect(() => {
    if (!isPlaying || !startTimeRef.current) return;
    const id = setInterval(() => {
      if (startTimeRef.current) setReadTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [isPlaying]);

  // 逐字前進
  useEffect(() => {
    if (!isPlaying || words.length === 0) return;
    const id = setInterval(() => {
      setCurrentWordIndex((prev) => {
        if (prev >= words.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, speed);
    return () => clearInterval(id);
  }, [isPlaying, words, speed]);

  // 全螢幕（fixed）時整個視窗的滑鼠移動都算
  useEffect(() => {
    if (!isFullscreen || !fixed) return;
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isFullscreen, fixed, handleMouseMove]);

  useEffect(
    () => () => {
      if (mouseTimerRef.current) clearTimeout(mouseTimerRef.current);
    },
    [],
  );

  // 全螢幕時的全域快捷鍵
  useEffect(() => {
    if (!isFullscreen) return;
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) && (target as HTMLInputElement).type !== "range") return;
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        togglePlayPause();
        return;
      }
      switch (e.key) {
        case "Escape":
          if (showFullText) setShowFullText(false);
          else setIsFullscreen(false);
          break;
        case "ArrowLeft":
          e.preventDefault();
          setCurrentWordIndex((p) => Math.max(0, p - 1));
          break;
        case "ArrowRight":
          e.preventDefault();
          setCurrentWordIndex((p) => Math.min(words.length - 1, p + 1));
          break;
        case "h":
        case "H":
          setShowHelp((p) => !p);
          break;
        case "f":
        case "F":
          setFilterSymbols((p) => !p);
          break;
        case "t":
        case "T":
          setIsDark((p) => !p);
          break;
      }
    }
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [isFullscreen, togglePlayPause, words.length, showFullText]);

  // fixed 全螢幕時鎖住頁面捲動，離開時回到原本位置
  useEffect(() => {
    if (!fixed || !isFullscreen) return;
    const { body, documentElement } = document;
    const prev = { body: body.style.overflow, html: documentElement.style.overflow };
    body.style.overflow = "hidden";
    documentElement.style.overflow = "hidden";
    return () => {
      body.style.overflow = prev.body;
      documentElement.style.overflow = prev.html;
      const { x, y } = scrollPositionRef.current;
      setTimeout(() => window.scrollTo(x, y), 0);
    };
  }, [fixed, isFullscreen]);

  const progressPercentage = words.length === 0 ? "0" : currentWordIndex >= words.length - 1 ? "100" : ((currentWordIndex / (words.length - 1)) * 100).toFixed(0);
  const wordsPerMinute = (60000 / speed).toFixed(0);
  const focusModeActive = isFullscreen && isPlaying && !showControls;
  const word = words[currentWordIndex];

  const controls = (fs: boolean) => (
    <Controls
      t={t}
      theme={theme}
      isFullscreen={fs}
      showControls={fs ? showControls : true}
      words={words}
      currentWordIndex={currentWordIndex}
      progressPercentage={progressPercentage}
      formattedReadTime={formatReadTime(readTime)}
      isPlaying={isPlaying}
      togglePlayPause={togglePlayPause}
      handleReset={handleReset}
      onProgress={setCurrentWordIndex}
      speed={speed}
      setSpeed={setSpeed}
      wordsPerMinute={wordsPerMinute}
      filterSymbols={filterSymbols}
      toggleFilterSymbols={() => setFilterSymbols((p) => !p)}
      isDark={isDark}
      toggleDark={themeToggle ? () => setIsDark((p) => !p) : undefined}
      toggleShowHelp={() => setShowHelp((p) => !p)}
      toggleFullscreen={toggleFullscreen}
    />
  );

  const preview = (fs: boolean) => {
    if (words.length === 0 || (fs && !showControls)) return null;
    const startIdx = Math.max(0, currentWordIndex - 5);
    const endIdx = Math.min(words.length - 1, currentWordIndex + 5);
    return (
      <button
        type="button"
        title={t.expandTitle}
        className={cn(
          "overflow-x-auto rounded-md px-4 py-2 text-left text-sm transition-colors motion-reduce:transition-none",
          theme.contentTextColor,
          theme.elementBgColor,
          theme.hover,
          fs ? "absolute bottom-16 left-1/2 max-w-2xl -translate-x-1/2" : "my-3 max-h-16 max-w-full",
        )}
        onClick={(e) => {
          e.stopPropagation();
          setShowFullText(true);
          if (fs && !showControls) handleMouseMove();
        }}
      >
        {words.slice(startIdx, endIdx + 1).map((w, idx) => (
          <span key={startIdx + idx} className={cn("px-0.5", startIdx + idx === currentWordIndex && "font-bold text-red-500 underline")}>
            {w}
          </span>
        ))}
        <span className="ml-2 text-xs text-blue-500">{t.expand}</span>
      </button>
    );
  };

  return (
    <div role="region" aria-label={t.region} className={cn("relative flex flex-col font-sans", className)}>
      {/* 標準模式（非 fixed 的全螢幕會蓋在它上面，所以保留在版面中撐住高度） */}
      <div className={cn("flex flex-col", isFullscreen && (fixed ? "hidden" : "invisible"))} inert={isFullscreen || undefined}>
        <div className={cn("relative mb-0 flex flex-col items-center justify-center rounded-t-xl border-0 p-6 shadow-sm", theme.bgColor)}>
          <div
            role="button"
            tabIndex={words.length > 0 ? 0 : -1}
            aria-label={isPlaying ? t.pause : t.play}
            className={cn("mb-4 flex w-full cursor-pointer items-center justify-center overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-red-500/60", theme.textColor)}
            style={{ minWidth: "4rem", minHeight: "15rem" }}
            onClick={() => words.length > 0 && togglePlayPause()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (words.length > 0) togglePlayPause();
              }
            }}
          >
            {words.length > 0 ? (
              <WordDisplay word={word} theme={theme} />
            ) : (
              <div className={cn("flex flex-col items-center", theme.contentTextColor)}>
                <Icon d={icons.play} className="mb-2 h-12 w-12" />
                <span className="text-center text-sm">{t.empty}</span>
              </div>
            )}
          </div>
          {preview(false)}
        </div>
        <div className={cn("relative rounded-b-md", theme.bgColor)}>{controls(false)}</div>

        {showTips && (
          <div className="mt-8 rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="mb-3 text-base font-medium text-neutral-900 dark:text-neutral-100">{t.tipsTitle}</h3>
            <ul className="list-disc space-y-1.5 pl-4 text-sm text-neutral-600 dark:text-neutral-400">
              {t.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 全螢幕模式 */}
      {isFullscreen && (
        <div
          role="dialog"
          aria-modal={fixed || undefined}
          aria-label={t.region}
          className={cn(
            "z-50 flex flex-col items-center justify-center overflow-hidden transition-all duration-500 select-none motion-reduce:transition-none",
            fixed ? "fixed inset-0 h-screen w-screen" : "absolute inset-0 rounded-xl",
            theme.bgColor,
            theme.textColor,
          )}
          onMouseMove={handleMouseMove}
          onClick={() => {
            if (!showControls) {
              setShowControls(true);
              lastMouseMoveRef.current = Date.now();
            }
          }}
        >
          {showHelp && <HelpOverlay t={t} theme={theme} />}

          {/* 專注模式指示點 */}
          {focusModeActive && <div className={cn("absolute top-3 left-3 h-1.5 w-1.5 rounded-full bg-current opacity-30", theme.textColor)} />}

          <div
            className={cn(
              "flex w-full cursor-pointer items-center justify-center font-bold transition-all duration-300 motion-reduce:transition-none",
              focusModeActive && "scale-105",
            )}
            style={{ minHeight: "15rem", flex: "1 1 auto" }}
            onClick={(e) => {
              e.stopPropagation();
              if (words.length > 0) togglePlayPause();
              if (!showControls) handleMouseMove();
            }}
          >
            <WordDisplay word={word || "　"} theme={theme} />
          </div>

          {preview(true)}

          <div className="absolute right-0 bottom-0 left-0" onClick={(e) => e.stopPropagation()}>
            {controls(true)}
          </div>
        </div>
      )}

      {/* 全文選擇面板 */}
      {showFullText && (
        <FullTextPanel
          t={t}
          theme={theme}
          fixed={fixed}
          words={words}
          currentWordIndex={currentWordIndex}
          isPlaying={isPlaying}
          onPick={(i) => {
            setCurrentWordIndex(i);
            setShowFullText(false);
          }}
          onClose={() => setShowFullText(false)}
          onToggle={() => {
            setShowFullText(false);
            togglePlayPause();
          }}
        />
      )}

      <span className="sr-only" aria-live="polite">
        {!isPlaying && words.length > 0 ? `${currentWordIndex + 1} / ${words.length}` : ""}
      </span>
    </div>
  );
}

function WordDisplay({ word, theme }: { word?: string; theme: Theme }) {
  return (
    <div
      className={cn("flex overflow-hidden font-sans font-bold transition-all duration-200 motion-reduce:transition-none", theme.textColor)}
      style={{ ...getWordSize(word), minHeight: "10rem", alignItems: "center", justifyContent: "center" }}
    >
      {word}
    </div>
  );
}

type Labels = typeof defaultLabels;

function Controls(p: {
  t: Labels;
  theme: Theme;
  isFullscreen: boolean;
  showControls: boolean;
  words: string[];
  currentWordIndex: number;
  progressPercentage: string;
  formattedReadTime: string;
  isPlaying: boolean;
  togglePlayPause: () => void;
  handleReset: () => void;
  onProgress: (i: number) => void;
  speed: number;
  setSpeed: (n: number) => void;
  wordsPerMinute: string;
  filterSymbols: boolean;
  toggleFilterSymbols: () => void;
  isDark: boolean;
  toggleDark?: () => void;
  toggleShowHelp: () => void;
  toggleFullscreen: () => void;
}) {
  const { t, theme, isFullscreen, words } = p;
  const [speedOpen, setSpeedOpen] = useState(false);
  const speedRef = useRef<HTMLDivElement>(null);
  const empty = words.length === 0;
  const roundBtn = cn("rounded-full p-1.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 disabled:opacity-50", theme.buttonHoverBg);

  // 點下拉選單外面就關閉
  useEffect(() => {
    if (!speedOpen) return;
    const close = (e: globalThis.MouseEvent) => {
      if (speedRef.current && !speedRef.current.contains(e.target as Node)) setSpeedOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [speedOpen]);

  const stop = (fn: () => void) => (e: MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  };

  return (
    <div className={cn("transition-opacity duration-300 motion-reduce:transition-none", p.showControls ? "opacity-100" : "opacity-0")}>
      {/* 進度條 */}
      <div className="group/progress relative h-1 cursor-pointer overflow-hidden bg-neutral-600 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-red-500/60">
        <div className="h-full bg-red-600 transition-all duration-200 ease-in-out motion-reduce:transition-none" style={{ width: `${p.progressPercentage}%` }} />
        <div
          className="absolute top-0 right-0 h-3 w-3 -translate-x-1/2 -translate-y-1/3 rounded-full bg-red-600 opacity-0 transition-opacity group-hover/progress:opacity-100"
          style={{ left: `${p.progressPercentage}%` }}
        />
        <input
          type="range"
          min={0}
          max={empty ? 0 : words.length - 1}
          value={p.currentWordIndex}
          onChange={(e) => p.onProgress(Number(e.target.value))}
          aria-label={t.progress}
          aria-valuetext={`${p.currentWordIndex + 1} / ${words.length}`}
          className="absolute top-0 right-0 left-0 h-1 w-full cursor-pointer opacity-0"
          disabled={empty}
        />
      </div>

      <div className={cn("px-2 py-2", theme.bgColor)}>
        <div className="mx-auto flex flex-wrap items-center gap-y-2">
          {/* 左側：播放控制 */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={stop(p.togglePlayPause)}
              className={roundBtn}
              disabled={empty}
              aria-label={p.isPlaying ? t.pause : t.play}
              title={empty ? t.needText : p.isPlaying ? t.pause : t.play}
            >
              <Icon d={p.isPlaying ? icons.pause : icons.play} className={cn("h-6 w-6", theme.textColor)} />
            </button>
            <button type="button" onClick={stop(p.handleReset)} className={roundBtn} disabled={empty} aria-label={t.reset} title={empty ? t.needText : t.reset}>
              <Icon d={icons.reset} className={cn("h-5 w-5", theme.textColor)} />
            </button>
            <span className={cn("rounded px-2 py-0.5 text-xs tabular-nums", theme.textColor, theme.elementBgColor)}>
              {p.formattedReadTime} / {empty ? "00:00" : `${Math.floor((words.length / (60000 / p.speed)) * 60)}s`}
            </span>
            <div className={cn("flex items-center rounded px-2 py-0.5", theme.elementBgColor)}>
              <span className={cn("text-xs tabular-nums", theme.textColor)}>
                {empty ? 0 : p.currentWordIndex + 1} / {words.length}
              </span>
              <span className="ml-1 text-xs font-medium text-red-500 tabular-nums">{p.progressPercentage}%</span>
            </div>
          </div>

          {/* 右側：設定 */}
          <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-3 pl-3">
            <div className="relative" ref={speedRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={speedOpen}
                className={cn("flex items-center rounded px-2 py-1 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-red-500/60", theme.textColor, theme.elementBgColor, theme.elementHoverBg)}
                onClick={stop(() => setSpeedOpen((o) => !o))}
              >
                <span>
                  {p.wordsPerMinute}
                  {t.perMinute}
                </span>
                <svg className="ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {speedOpen && (
                <div
                  role="menu"
                  className={cn(
                    "absolute right-0 z-10 w-48 rounded-md border py-1 shadow-lg",
                    isFullscreen ? "bottom-full mb-1" : "mt-1",
                    theme.dropdownBgColor,
                    theme.borderColor,
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={cn("border-b px-3 py-1", theme.borderColor)}>
                    <span className={cn("text-xs font-medium", theme.textColor)}>{t.speedTitle}</span>
                  </div>
                  {t.speeds.map((o) => {
                    const active = Math.abs(60000 / o.value - p.speed) < 10;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        role="menuitemradio"
                        aria-checked={active}
                        className={cn(
                          "w-full px-3 py-1.5 text-left text-xs outline-none focus-visible:bg-neutral-500/20",
                          theme.dropdownHoverBgColor,
                          active ? "font-medium text-red-500" : o.isDefault ? "text-blue-500" : theme.textColor,
                        )}
                        onClick={() => {
                          p.setSpeed(60000 / o.value);
                          setSpeedOpen(false);
                        }}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                  {/* 標準模式多一條自訂速度滑桿（數值是毫秒，越左越快） */}
                  {!isFullscreen && (
                    <div className={cn("border-t px-3 py-2", theme.borderColor)}>
                      <input
                        type="range"
                        min={50}
                        max={1000}
                        step={10}
                        value={p.speed}
                        aria-label={t.speedTitle}
                        onChange={(e) => p.setSpeed(Number(e.target.value))}
                        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-neutral-700 accent-red-600"
                      />
                      <div className="mt-1 flex justify-between text-xs text-neutral-400">
                        <span>{t.faster}</span>
                        <span>{t.slower}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <label className={cn("flex cursor-pointer items-center rounded px-2 py-1 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-red-500/60", theme.elementBgColor, theme.elementHoverBg)}>
              <input type="checkbox" role="switch" checked={p.filterSymbols} onChange={p.toggleFilterSymbols} className="sr-only" />
              <span className={cn("relative h-4 w-8 rounded-full transition-colors", p.filterSymbols ? "bg-red-600" : "bg-neutral-600")}>
                <span className={cn("absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white transition-transform", p.filterSymbols && "translate-x-4")} />
              </span>
              <span className={cn("ml-1 text-xs whitespace-nowrap", theme.textColor)}>{t.filterSymbols}</span>
            </label>

            {p.toggleDark && (
              <button type="button" onClick={stop(p.toggleDark)} className={roundBtn} title={p.isDark ? t.toLight : t.toDark} aria-label={p.isDark ? t.toLight : t.toDark}>
                <Icon d={p.isDark ? icons.sun : icons.moon} className={cn("h-5 w-5", theme.textColor)} />
              </button>
            )}

            {isFullscreen && (
              <button type="button" onClick={stop(p.toggleShowHelp)} className={roundBtn} title={t.help} aria-label={t.help}>
                <Icon d={icons.info} className={cn("h-5 w-5", theme.textColor)} />
              </button>
            )}

            <button
              type="button"
              onClick={stop(p.toggleFullscreen)}
              className={roundBtn}
              title={isFullscreen ? t.exitFullscreen : t.enterFullscreen}
              aria-label={isFullscreen ? t.exitFullscreen : t.enterFullscreen}
            >
              <Icon d={isFullscreen ? icons.exitFs : icons.enterFs} className={cn("h-5 w-5", theme.textColor)} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HelpOverlay({ t, theme }: { t: Labels; theme: Theme }) {
  const key = cn("mr-2 inline-block rounded px-2 py-0.5 font-mono text-xs", theme.keyBgColor, theme.keyTextColor);
  return (
    <div
      className={cn("absolute top-16 right-6 z-50 max-h-[calc(100%-8rem)] w-64 max-w-[calc(100%-3rem)] overflow-y-auto rounded-lg border p-5 shadow-xl", theme.overlayBgColor, theme.overlayBorderColor)}
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className={cn("mb-3 text-base font-medium", theme.titleTextColor)}>{t.shortcutsTitle}</h3>
      <ul className={cn("space-y-1.5 text-sm", theme.contentTextColor)}>
        {t.shortcuts.map(([k, v]) => (
          <li key={k} className="flex items-center">
            <kbd className={key}>{k}</kbd>
            <span>{v}</span>
          </li>
        ))}
      </ul>
      <h3 className={cn("mt-4 mb-2 text-base font-medium", theme.titleTextColor)}>{t.readingTipsTitle}</h3>
      <ul className={cn("space-y-1.5 text-sm", theme.contentTextColor)}>
        {t.readingTips.map((tip) => (
          <li key={tip} className="flex items-start">
            <span className="mt-0.5 mr-2 inline-block" aria-hidden="true">
              •
            </span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FullTextPanel(p: {
  t: Labels;
  theme: Theme;
  fixed: boolean;
  words: string[];
  currentWordIndex: number;
  isPlaying: boolean;
  onPick: (i: number) => void;
  onClose: () => void;
  onToggle: () => void;
}): ReactNode {
  const { t, theme } = p;
  // 每 50 個單位一段
  const paragraphs: string[][] = [];
  for (let i = 0; i < p.words.length; i += 50) paragraphs.push(p.words.slice(i, i + 50));

  return (
    <div
      className={cn("z-[100] flex items-center justify-center bg-black/80 p-3", p.fixed ? "fixed inset-0" : "absolute inset-0 rounded-xl")}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === "Escape") p.onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="speed-reader-pick" className={cn("flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl p-4", p.fixed ? "" : "max-h-full", theme.overlayBgColor)}>
        <div className="mb-4 flex items-center justify-between">
          <h3 id="speed-reader-pick" className={cn("text-lg font-medium", theme.titleTextColor)}>
            {t.pickStart}
          </h3>
          <button type="button" onClick={p.onClose} aria-label={t.close} autoFocus className={cn("rounded-full p-1 outline-none focus-visible:ring-2 focus-visible:ring-red-500/60", theme.hover)}>
            <Icon d={icons.close} className={cn("h-6 w-6", theme.textColor)} />
          </button>
        </div>
        <div className={cn("min-h-0 flex-1 overflow-y-auto px-1 text-sm", theme.contentTextColor)}>
          {paragraphs.map((para, pi) => (
            <p key={pi} className="mb-4">
              {para.map((w, wi) => {
                const gi = pi * 50 + wi;
                return (
                  <span
                    key={gi}
                    className={cn(
                      "cursor-pointer px-0.5",
                      theme.hover,
                      gi === p.currentWordIndex && "rounded bg-red-100 font-medium text-red-600 dark:bg-red-900",
                    )}
                    onClick={() => p.onPick(gi)}
                  >
                    {w}
                  </span>
                );
              })}
            </p>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-neutral-200 pt-3 dark:border-neutral-700">
          <span className="text-xs text-neutral-500">{t.pickHint}</span>
          <div className="flex shrink-0 gap-3">
            <button type="button" onClick={p.onClose} className={cn("rounded-md px-4 py-1.5 text-sm", theme.elementBgColor, theme.hover)}>
              {t.cancel}
            </button>
            <button type="button" onClick={p.onToggle} className="rounded-md bg-red-600 px-4 py-1.5 text-sm text-white hover:bg-red-700">
              {p.isPlaying ? t.pauseReading : t.startReading}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
