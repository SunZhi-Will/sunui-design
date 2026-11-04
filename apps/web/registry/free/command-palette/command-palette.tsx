"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

export type CommandItem = {
  id: string;
  label: string;
  /** 額外的搜尋關鍵字，命中時也會列出（但不標示高亮） */
  keywords?: string[];
  icon?: ReactNode;
  /** 快捷鍵提示，例如 ["⌘", "B"]，每個元素渲染成一個 kbd */
  shortcut?: string[];
  /** 選取時呼叫 */
  onSelect?: () => void;
  disabled?: boolean;
};

export type CommandGroup = {
  id: string;
  heading: string;
  items: CommandItem[];
};

export interface CommandPaletteProps {
  groups: CommandGroup[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 是否註冊全域 ⌘K / Ctrl+K 快捷鍵；在其他輸入框打字時不會觸發 */
  hotkey?: boolean;
  /** 搭配 ⌘ / Ctrl 的按鍵，預設 "k" */
  hotkeyKey?: string;
  placeholder?: string;
  /** 顯示幾筆最近使用的項目，0 表示停用 */
  recentLimit?: number;
  /** 初始的最近使用項目 id（由新到舊） */
  defaultRecent?: string[];
  /** 最近使用清單變動時呼叫，可用來寫入 localStorage */
  onRecentChange?: (ids: string[]) => void;
  /** 選取後是否自動關閉 */
  closeOnSelect?: boolean;
  labels?: {
    dialog?: string;
    recent?: string;
    empty?: (query: string) => ReactNode;
    navigate?: string;
    select?: string;
    close?: string;
    results?: (count: number) => string;
  };
  className?: string;
}

const defaultLabels = {
  dialog: "Command palette",
  recent: "Recent",
  empty: (q: string) => (
    <>
      No results for <span className="font-medium text-foreground">&ldquo;{q}&rdquo;</span>
    </>
  ),
  navigate: "Navigate",
  select: "Select",
  close: "Close",
  results: (n: number) => (n === 1 ? "1 result" : `${n} results`),
};

type Match = { score: number; indices: number[] };

// 近似模糊比對：依序找出每個字元，連續命中與字首命中加分
export function fuzzyMatch(text: string, query: string): Match | null {
  const q = query.trim().toLowerCase();
  if (!q) return { score: 0, indices: [] };
  const t = text.toLowerCase();
  const indices: number[] = [];
  let score = 0;
  let from = 0;
  for (const ch of q) {
    if (ch === " ") continue;
    const at = t.indexOf(ch, from);
    if (at === -1) return null;
    const prev = indices[indices.length - 1];
    if (prev !== undefined && at === prev + 1) score += 5;
    if (at === 0 || /[\s\-_/.]/.test(t[at - 1])) score += 8;
    score -= Math.min(at - from, 6);
    indices.push(at);
    from = at + 1;
  }
  // 完整子字串額外加分
  if (t.includes(q)) score += 12;
  return { score, indices };
}

/** 偵測平台，回傳 "⌘" 或 "Ctrl"，SSR 時預設 "⌘" */
export function useModKey() {
  const [mod, setMod] = useState("⌘");
  useEffect(() => {
    const platform =
      (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
      navigator.platform ??
      "";
    setMod(/mac|iphone|ipad|ipod/i.test(platform) ? "⌘" : "Ctrl");
  }, []);
  return mod;
}

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

type Row = {
  key: string;
  groupKey: string;
  item: CommandItem;
  indices: number[];
};

type Section = { key: string; heading: string; rows: Row[] };

function Highlight({ text, indices }: { text: string; indices: number[] }) {
  if (!indices.length) return <>{text}</>;
  const set = new Set(indices);
  return (
    <>
      {Array.from(text).map((ch, i) =>
        set.has(i) ? (
          <mark key={i} className="bg-transparent font-semibold text-primary">
            {ch}
          </mark>
        ) : (
          <Fragment key={i}>{ch}</Fragment>
        ),
      )}
    </>
  );
}

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted px-1 font-sans text-[11px] font-medium text-muted-foreground",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

export function CommandPalette({
  groups,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  hotkey = true,
  hotkeyKey = "k",
  placeholder = "Type a command or search…",
  recentLimit = 3,
  defaultRecent = [],
  onRecentChange,
  closeOnSelect = true,
  labels,
  className,
}: CommandPaletteProps) {
  const reduce = useReducedMotion() ?? false;
  const text = { ...defaultLabels, ...labels };
  const baseId = useId();
  const listId = `${baseId}-list`;
  const [inner, setInner] = useState(defaultOpen);
  const open = openProp ?? inner;
  const [query, setQuery] = useState("");
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>(defaultRecent);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);

  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setInner(next);
      onOpenChange?.(next);
    },
    [openProp, onOpenChange],
  );

  // 全域快捷鍵：只在 hotkey 開啟時註冊，且不搶其他輸入框的按鍵
  useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
      if (e.key.toLowerCase() !== hotkeyKey.toLowerCase()) return;
      const ours = e.target === inputRef.current;
      if (isTypingTarget(e.target) && !ours) return;
      e.preventDefault();
      setOpen(!open);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey, hotkeyKey, open, setOpen]);

  // 開啟：記住焦點、鎖住捲動、聚焦輸入框；關閉：還原焦點
  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    setQuery("");
    const { body, documentElement } = document;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      cancelAnimationFrame(raf);
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
      const target = restoreRef.current;
      if (target && document.contains(target)) target.focus();
    };
  }, [open]);

  const sections = useMemo<Section[]>(() => {
    const q = query.trim();
    if (!q) {
      const out: Section[] = [];
      if (recentLimit > 0 && recent.length) {
        const all = new Map(groups.flatMap((g) => g.items.map((it) => [it.id, it] as const)));
        const rows = recent
          .map((id) => all.get(id))
          .filter((it): it is CommandItem => Boolean(it))
          .slice(0, recentLimit)
          .map((item) => ({ key: `recent:${item.id}`, groupKey: "recent", item, indices: [] }));
        if (rows.length) out.push({ key: "recent", heading: text.recent, rows });
      }
      for (const g of groups) {
        out.push({
          key: g.id,
          heading: g.heading,
          rows: g.items.map((item) => ({ key: `${g.id}:${item.id}`, groupKey: g.id, item, indices: [] })),
        });
      }
      return out.filter((s) => s.rows.length);
    }
    return groups
      .map((g) => {
        const scored = g.items
          .map((item) => {
            const onLabel = fuzzyMatch(item.label, q);
            if (onLabel) return { item, score: onLabel.score, indices: onLabel.indices };
            const onKeyword = (item.keywords ?? [])
              .map((k) => fuzzyMatch(k, q))
              .filter((m): m is Match => Boolean(m))
              .sort((a, b) => b.score - a.score)[0];
            // 只命中關鍵字的排在後面
            return onKeyword ? { item, score: onKeyword.score - 20, indices: [] } : null;
          })
          .filter((r): r is { item: CommandItem; score: number; indices: number[] } => Boolean(r))
          .sort((a, b) => b.score - a.score);
        return {
          key: g.id,
          heading: g.heading,
          rows: scored.map(({ item, indices }) => ({ key: `${g.id}:${item.id}`, groupKey: g.id, item, indices })),
        };
      })
      .filter((s) => s.rows.length);
  }, [groups, query, recent, recentLimit, text.recent]);

  const rows = useMemo(() => sections.flatMap((s) => s.rows), [sections]);
  const enabled = useMemo(() => rows.filter((r) => !r.item.disabled), [rows]);

  // 結果改變時，把高亮移到第一個可選項目
  useEffect(() => {
    setActiveKey(enabled[0]?.key ?? null);
  }, [enabled]);

  const optionId = (key: string) => `${baseId}-opt-${key.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

  // 高亮項目捲入可視範圍
  useEffect(() => {
    if (!activeKey) return;
    const el = document.getElementById(optionId(activeKey));
    el?.scrollIntoView({ block: "nearest" });
  }, [activeKey, baseId]);

  const select = (row: Row) => {
    if (row.item.disabled) return;
    if (recentLimit > 0) {
      const next = [row.item.id, ...recent.filter((id) => id !== row.item.id)].slice(0, Math.max(recentLimit, 10));
      setRecent(next);
      onRecentChange?.(next);
    }
    if (closeOnSelect) setOpen(false);
    row.item.onSelect?.();
  };

  const move = (delta: number | "first" | "last") => {
    if (!enabled.length) return;
    const current = enabled.findIndex((r) => r.key === activeKey);
    let next: number;
    if (delta === "first") next = 0;
    else if (delta === "last") next = enabled.length - 1;
    else next = (current + delta + enabled.length) % enabled.length;
    setActiveKey(enabled[next].key);
  };

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        return move(1);
      case "ArrowUp":
        e.preventDefault();
        return move(-1);
      case "Home":
        e.preventDefault();
        return move("first");
      case "End":
        e.preventDefault();
        return move("last");
      case "Enter": {
        if (e.nativeEvent.isComposing) return;
        const row = enabled.find((r) => r.key === activeKey);
        if (row) {
          e.preventDefault();
          select(row);
        }
        return;
      }
    }
  };

  // 焦點陷阱：Tab 只在對話框內循環；Escape 關閉
  const onDialogKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      return;
    }
    if (e.key !== "Tab") return;
    const nodes = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'input, button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const fade = reduce ? { duration: 0 } : { duration: 0.15 };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="command-palette"
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fade}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onPointerDown={() => setOpen(false)}
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={text.dialog}
            onKeyDown={onDialogKeyDown}
            initial={reduce ? false : { opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: -4 }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 34 }}
            className={cn(
              "relative flex max-h-[min(32rem,76vh)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl",
              className,
            )}
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <svg
                viewBox="0 0 24 24"
                className="size-4 shrink-0 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={activeKey ? optionId(activeKey) : undefined}
                aria-label={text.dialog}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKeyDown}
                className="h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <Kbd className="shrink-0">Esc</Kbd>
            </div>

            <div ref={listRef} id={listId} role="listbox" aria-label={text.dialog} className="flex-1 overflow-y-auto p-2">
              {sections.map((section) => {
                const headingId = `${baseId}-h-${section.key.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
                return (
                  <div key={section.key} role="group" aria-labelledby={headingId} className="mb-1 last:mb-0">
                    <div id={headingId} className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">
                      {section.heading}
                    </div>
                    {section.rows.map((row) => {
                      const active = row.key === activeKey;
                      return (
                        <div
                          key={row.key}
                          id={optionId(row.key)}
                          role="option"
                          aria-selected={active}
                          aria-disabled={row.item.disabled || undefined}
                          onPointerMove={() => {
                            if (!row.item.disabled && !active) setActiveKey(row.key);
                          }}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => select(row)}
                          className={cn(
                            "relative flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-foreground select-none",
                            row.item.disabled && "cursor-not-allowed opacity-50",
                          )}
                        >
                          {active && (
                            <motion.span
                              layoutId={reduce ? undefined : `${baseId}-active`}
                              aria-hidden="true"
                              className="absolute inset-0 rounded-lg bg-muted"
                              transition={{ type: "spring", stiffness: 600, damping: 40 }}
                            />
                          )}
                          {row.item.icon && (
                            <span
                              aria-hidden="true"
                              className="relative flex size-5 shrink-0 items-center justify-center text-muted-foreground [&>svg]:size-4"
                            >
                              {row.item.icon}
                            </span>
                          )}
                          <span className="relative flex-1 truncate">
                            <Highlight text={row.item.label} indices={row.indices} />
                          </span>
                          {row.item.shortcut && (
                            <span className="relative flex shrink-0 gap-1" aria-hidden="true">
                              {row.item.shortcut.map((k, i) => (
                                <Kbd key={i}>{k}</Kbd>
                              ))}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {!rows.length && (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
                  <svg
                    viewBox="0 0 24 24"
                    className="size-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5M8.5 11h5" />
                  </svg>
                  <p>{text.empty(query.trim())}</p>
                </div>
              )}
            </div>

            <div
              className="flex items-center gap-4 border-t border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground"
              aria-hidden="true"
            >
              <span className="flex items-center gap-1.5">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                {text.navigate}
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>↵</Kbd>
                {text.select}
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>Esc</Kbd>
                {text.close}
              </span>
            </div>

            <span className="sr-only" role="status" aria-live="polite">
              {query.trim() ? text.results(rows.length) : ""}
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
