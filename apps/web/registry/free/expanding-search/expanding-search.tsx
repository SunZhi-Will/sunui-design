"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export type ExpandingSearchSuggestion = {
  id: string;
  label: string;
  /** 右側的輔助文字，例如分類 */
  hint?: string;
  icon?: ReactNode;
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
  /** 展開後的寬度（px） */
  expandedWidth?: number;
  /** 啟用 "/" 快捷鍵開啟搜尋；在其他輸入框打字時不會觸發 */
  slashShortcut?: boolean;
  placeholder?: string;
  labels?: {
    open?: string;
    search?: string;
    clear?: string;
    suggestions?: string;
    results?: (count: number) => string;
  };
  className?: string;
}

const defaultLabels = {
  open: "Open search",
  search: "Search",
  clear: "Clear search",
  suggestions: "Suggestions",
  results: (n: number) => (n === 1 ? "1 suggestion" : `${n} suggestions`),
};

const COLLAPSED = 40;

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

function Match({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  const at = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (at === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className="bg-transparent font-semibold text-foreground">{text.slice(at, at + q.length)}</mark>
      {text.slice(at + q.length)}
    </>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

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
  placeholder = "Search…",
  labels,
  className,
}: ExpandingSearchProps) {
  const reduce = useReducedMotion() ?? false;
  const text = { ...defaultLabels, ...labels };
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
    setActive(-1);
  }, [value]);

  // 鍵盤移動時把高亮建議捲入可視範圍
  useEffect(() => {
    if (active < 0) return;
    document.getElementById(`${baseId}-opt-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, baseId]);

  // "/" 快捷鍵：opt-in，且不搶其他輸入框的按鍵
  useEffect(() => {
    if (!slashShortcut) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
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
    setActive(-1);
    onSuggestionSelect?.(s);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        if (!filtered.length) return;
        e.preventDefault();
        setListOpen(true);
        setActive((i) => (showList ? (i + 1) % filtered.length : 0));
        return;
      case "ArrowUp":
        if (!filtered.length) return;
        e.preventDefault();
        setListOpen(true);
        setActive((i) => (showList ? (i <= 0 ? filtered.length - 1 : i - 1) : filtered.length - 1));
        return;
      case "Home":
      case "End":
        if (!showList) return;
        e.preventDefault();
        setActive(e.key === "Home" ? 0 : filtered.length - 1);
        return;
      case "Enter":
        if (e.nativeEvent.isComposing) return;
        if (showList && active >= 0) {
          e.preventDefault();
          choose(filtered[active]);
        }
        return;
      case "Escape":
        e.preventDefault();
        // 第一下關閉建議清單，第二下收合
        if (showList) {
          setListOpen(false);
          setActive(-1);
        } else {
          collapse(true);
        }
        return;
    }
  };

  const onFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!value.trim()) return;
    setListOpen(false);
    onSubmit?.(value.trim());
  };

  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 34 };

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
      className={cn("relative inline-flex", className)}
    >
      <motion.div
        initial={false}
        animate={{ width: open ? expandedWidth : COLLAPSED }}
        transition={spring}
        className={cn(
          "relative flex h-10 max-w-full items-center overflow-hidden rounded-full border bg-card text-card-foreground transition-colors",
          open ? "border-border shadow-sm focus-within:ring-2 focus-within:ring-ring" : "border-transparent",
        )}
      >
        {open ? (
          <>
            <SearchIcon className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
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
              placeholder={placeholder}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setListOpen(true);
              }}
              onFocus={() => setListOpen(true)}
              onKeyDown={onKeyDown}
              className="h-full w-full min-w-0 bg-transparent pr-9 pl-9 text-sm text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
            />
            <AnimatePresence>
              {value && (
                <motion.button
                  key="clear"
                  type="button"
                  aria-label={text.clear}
                  initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.12 }}
                  onClick={() => {
                    setValue("");
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2 flex size-6 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </motion.button>
              )}
            </AnimatePresence>
          </>
        ) : (
          <button
            ref={triggerRef}
            type="button"
            aria-label={text.open}
            aria-expanded={false}
            aria-keyshortcuts={slashShortcut ? "/" : undefined}
            onClick={() => setOpen(true)}
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            <SearchIcon className="size-[18px]" />
          </button>
        )}
      </motion.div>

      {suggestions && open && (
        <AnimatePresence>
          {showList && (
            <motion.ul
              key="list"
              id={listId}
              role="listbox"
              aria-label={text.suggestions}
              initial={reduce ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -4 }}
              transition={{ duration: 0.14 }}
              className="absolute top-full right-0 left-0 z-20 mt-2 max-h-72 overflow-y-auto rounded-xl border border-border bg-card p-1 text-card-foreground shadow-lg"
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
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground",
                    i === active && "bg-muted text-foreground",
                  )}
                >
                  {s.icon && (
                    <span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center [&>svg]:size-4">
                      {s.icon}
                    </span>
                  )}
                  <span className="flex-1 truncate">
                    <Match text={s.label} query={value} />
                  </span>
                  {s.hint && <span className="shrink-0 text-xs text-muted-foreground">{s.hint}</span>}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      )}

      <span className="sr-only" role="status" aria-live="polite">
        {showList && value.trim() ? text.results(filtered.length) : ""}
      </span>
    </form>
  );
}
