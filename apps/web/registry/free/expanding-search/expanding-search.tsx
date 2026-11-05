"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ExpandingSearchSuggestion = {
  id: string;
  label: string;
  /** 第二行的說明，例如分類或款式 */
  description?: string;
  /** 右側的輔助文字，例如價格 */
  hint?: string;
  /** 左側縮圖，例如商品圖 */
  thumbnail?: ReactNode;
};

export interface ExpandingSearchProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** 按 Enter（且沒有選取建議）時呼叫 */
  onSubmit?: (query: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 建議清單；不給則不顯示下拉選單 */
  suggestions?: ExpandingSearchSuggestion[];
  /** 是否依輸入內容過濾建議（不分大小寫的子字串比對）；自行過濾時設為 false */
  filterSuggestions?: boolean;
  onSuggestionSelect?: (suggestion: ExpandingSearchSuggestion) => void;
  /** 展開後的寬度（px），窄螢幕時不會超出父層 */
  expandedWidth?: number;
  /** 啟用 "/" 快捷鍵開啟搜尋；在其他輸入框打字時不會觸發 */
  slashShortcut?: boolean;
  /** 不給時用 labels.placeholder */
  placeholder?: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<ExpandingSearchLabels>;
  className?: string;
}

export interface ExpandingSearchLabels {
  open: string;
  search: string;
  clear: string;
  suggestions: string;
  results: (count: number) => string;
  placeholder: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, ExpandingSearchLabels> = {
  en: {
    open: "Open search",
    search: "Search",
    clear: "Clear search",
    suggestions: "Suggestions",
    results: (n) => (n === 1 ? "1 suggestion" : `${n} suggestions`),
    placeholder: "Search…",
  },
  "zh-TW": {
    open: "開啟搜尋",
    search: "搜尋",
    clear: "清除搜尋",
    suggestions: "建議",
    results: (n) => `${n} 項建議`,
    placeholder: "搜尋…",
  },
  "zh-CN": {
    open: "打开搜索",
    search: "搜索",
    clear: "清除搜索",
    suggestions: "建议",
    results: (n) => `${n} 条建议`,
    placeholder: "搜索…",
  },
  ja: {
    open: "検索を開く",
    search: "検索",
    clear: "検索をクリア",
    suggestions: "候補",
    results: (n) => `候補 ${n} 件`,
    placeholder: "検索…",
  },
};

// 設計語言（DESIGN.md）：紙、紙邊、墨
const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const paperUnder = "bg-[#f1ebdd] dark:bg-[#29251f]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const inkMuted = "text-[#1c1917]/60 dark:text-[#ece7dc]/60";

const springs = {
  gentle: { type: "spring", stiffness: 240, damping: 30 },
} as const;

const COLLAPSED = 40;

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || el.isContentEditable;
}

function Match({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  const at = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (at === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className="bg-transparent text-current underline decoration-current/40 underline-offset-[3px]">{text.slice(at, at + q.length)}</mark>
      {text.slice(at + q.length)}
    </>
  );
}

const SearchIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </svg>
);

export function ExpandingSearch({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onSubmit,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  suggestions,
  filterSuggestions = true,
  onSuggestionSelect,
  expandedWidth = 280,
  slashShortcut = false,
  placeholder,
  locale = "en",
  labels,
  className,
}: ExpandingSearchProps) {
  const reduce = useReducedMotion() ?? false;
  const text = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const baseId = useId();
  const listId = `${baseId}-list`;
  const [innerValue, setInnerValue] = useState(defaultValue);
  const value = valueProp ?? innerValue;
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const open = openProp ?? innerOpen;
  const [listOpen, setListOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const focusTrigger = useRef(false);

  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setInnerOpen(next);
      onOpenChange?.(next);
    },
    [openProp, onOpenChange],
  );

  const setValue = (next: string) => {
    if (valueProp === undefined) setInnerValue(next);
    onValueChange?.(next);
    setActive(-1);
  };

  const filtered = useMemo(() => {
    if (!suggestions) return [];
    const q = value.trim().toLowerCase();
    if (!filterSuggestions || !q) return suggestions;
    return suggestions.filter((s) => s.label.toLowerCase().includes(q));
  }, [suggestions, value, filterSuggestions]);

  const showList = open && listOpen && filtered.length > 0;

  // 展開時自動聚焦；收合時視情況把焦點還給圖示按鈕
  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(raf);
    }
    setListOpen(false);
    setActive(-1);
    if (focusTrigger.current) {
      focusTrigger.current = false;
      requestAnimationFrame(() => triggerRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (active >= 0) document.getElementById(`${baseId}-opt-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, baseId]);

  useEffect(() => {
    if (!slashShortcut) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      e.preventDefault();
      if (open) inputRef.current?.focus();
      else setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slashShortcut, open, setOpen]);

  const collapse = (restoreFocus: boolean) => {
    focusTrigger.current = restoreFocus;
    setOpen(false);
  };

  const choose = (s: ExpandingSearchSuggestion) => {
    setValue(s.label);
    setListOpen(false);
    onSuggestionSelect?.(s);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const n = filtered.length;
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && n) {
      e.preventDefault();
      setListOpen(true);
      const down = e.key === "ArrowDown";
      setActive((i) => (!showList ? (down ? 0 : n - 1) : down ? (i + 1) % n : i <= 0 ? n - 1 : i - 1));
    } else if ((e.key === "Home" || e.key === "End") && showList) {
      e.preventDefault();
      setActive(e.key === "Home" ? 0 : n - 1);
    } else if (e.key === "Enter" && !e.nativeEvent.isComposing && showList && active >= 0) {
      e.preventDefault();
      choose(filtered[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      // 第一下關閉建議清單，第二下收合
      if (showList) {
        setListOpen(false);
        setActive(-1);
      } else collapse(true);
    }
  };

  const onFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!value.trim()) return;
    setListOpen(false);
    onSubmit?.(value.trim());
  };

  return (
    <form
      ref={rootRef}
      role="search"
      onSubmit={onFormSubmit}
      onBlur={(e) => {
        // 焦點離開整個元件：關閉清單，若沒有內容則收合
        if (rootRef.current?.contains(e.relatedTarget as Node)) return;
        setListOpen(false);
        if (!value.trim()) collapse(false);
      }}
      className={cn("relative inline-flex max-w-full min-w-0", ink, className)}
    >
      <motion.div
        initial={false}
        animate={{ width: open ? expandedWidth : COLLAPSED }}
        transition={reduce ? { duration: 0 } : springs.gentle}
        className={cn(
          "relative flex h-10 max-w-full items-center overflow-hidden rounded-md border transition-colors",
          open ? cn(paper, edge, "focus-within:border-[#1c1917]/40 dark:focus-within:border-[#ece7dc]/40") : "border-transparent",
        )}
      >
        {open ? (
          <>
            <SearchIcon className={cn("pointer-events-none absolute left-3 size-4", inkMuted)} />
            <input
              ref={inputRef}
              type="search"
              role="combobox"
              aria-label={text.search}
              aria-expanded={showList}
              aria-controls={suggestions ? listId : undefined}
              aria-autocomplete={suggestions ? "list" : "none"}
              aria-activedescendant={showList && active >= 0 ? `${baseId}-opt-${active}` : undefined}
              autoComplete="off"
              enterKeyHint="search"
              placeholder={placeholder ?? text.placeholder}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setListOpen(true);
              }}
              onFocus={() => setListOpen(true)}
              onKeyDown={onKeyDown}
              className="h-full w-full min-w-0 bg-transparent pr-9 pl-9 text-sm outline-none placeholder:text-current/45 [&::-webkit-search-cancel-button]:hidden"
            />
            {value && (
              <button
                type="button"
                aria-label={text.clear}
                onClick={() => {
                  setValue("");
                  inputRef.current?.focus();
                }}
                className={cn("absolute right-2 flex size-6 items-center justify-center rounded-[3px] outline-none hover:bg-current/5 focus-visible:ring-2 focus-visible:ring-ring", inkMuted)}
              >
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" strokeLinejoin="round">
                  <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
                </svg>
              </button>
            )}
          </>
        ) : (
          <button
            ref={triggerRef}
            type="button"
            aria-label={text.open}
            aria-expanded={false}
            aria-keyshortcuts={slashShortcut ? "/" : undefined}
            onClick={() => setOpen(true)}
            className="flex size-10 shrink-0 items-center justify-center rounded-md outline-none transition-colors hover:bg-current/5 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <SearchIcon className="size-[18px]" />
          </button>
        )}
      </motion.div>

      <AnimatePresence>
        {showList && (
          <motion.ul
            key="list"
            id={listId}
            role="listbox"
            aria-label={text.suggestions}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: reduce ? 0 : 0.1 } }}
            transition={{ duration: 0.12 }}
            className={cn("absolute top-full right-0 left-0 z-20 mt-1.5 max-h-80 overflow-y-auto rounded-md border p-1 shadow-[0_1px_0_rgb(0_0_0/0.04)]", paper, edge)}
          >
            {filtered.map((s, i) => (
              <li
                key={s.id}
                id={`${baseId}-opt-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onPointerMove={() => i !== active && setActive(i)}
                onClick={() => choose(s)}
                className={cn("flex cursor-pointer items-center gap-3 rounded-[3px] px-2 py-1.5 text-sm", i === active && paperUnder)}
              >
                {s.thumbnail && (
                  <span aria-hidden="true" className={cn("size-10 shrink-0 overflow-hidden rounded-[3px] border", edge)}>
                    {s.thumbnail}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate">
                    <Match text={s.label} query={value} />
                  </span>
                  {s.description && <span className={cn("block truncate text-xs", inkMuted)}>{s.description}</span>}
                </span>
                {s.hint && <span className="shrink-0 text-sm tracking-tight tabular-nums">{s.hint}</span>}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      <span className="sr-only" role="status" aria-live="polite">
        {showList && value.trim() ? text.results(filtered.length) : ""}
      </span>
    </form>
  );
}
