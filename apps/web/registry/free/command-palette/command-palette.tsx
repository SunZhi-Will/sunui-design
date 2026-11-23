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
  /** Extra search keywords; a match lists the item too (without highlighting) */
  keywords?: string[];
  icon?: ReactNode;
  /** Shortcut hint, e.g. ["⌘", "B"]; each element renders as a kbd */
  shortcut?: string[];
  /** Called on select */
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
  /** Register the global ⌘K / Ctrl+K shortcut; it does not fire while typing in other inputs */
  hotkey?: boolean;
  /** Key used with ⌘ / Ctrl, defaults to "k" */
  hotkeyKey?: string;
  placeholder?: string;
  /** How many recent items to show, 0 disables */
  recentLimit?: number;
  /** Initial recent item ids (newest first) */
  defaultRecent?: string[];
  /** Called when the recent list changes, e.g. to write to localStorage */
  onRecentChange?: (ids: string[]) => void;
  /** Close automatically after select */
  closeOnSelect?: boolean;
  /**
   * Render open inside its container, with no portal, overlay or scroll lock; always open.
   * For use within a page (docs, empty states, catalog previews). The open props have no effect then;
   * the shortcut focuses the input instead, and Escape clears the query.
   */
  inline?: boolean;
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

// SunUI springs (DESIGN.md section 5): the popover settle and the highlight slide both use snappy
const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
} as const;

// Elevation e3 (dialog) and e1 (key caps); with a shadow there is no border, dark mode uses a top-edge highlight
const E3 =
  "shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_16px_32px_-8px_rgb(0_0_0/0.10),0_32px_64px_-16px_rgb(0_0_0/0.10)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_0_0_1px_rgb(255_255_255/0.08)]";
// Material (DESIGN.md section 7): key caps are small steel keys, lit from straight above, with a darker 2px bottom edge for
// thickness, so the palette reads as a keyboard instrument at rest. The active row's caps take the brand colour as lacquer
const KEYCAP =
  "bg-[linear-gradient(180deg,color-mix(in_oklch,var(--foreground)_1%,var(--card)),color-mix(in_oklch,var(--foreground)_9%,var(--card)))] dark:bg-[linear-gradient(180deg,color-mix(in_oklch,var(--foreground)_18%,var(--card)),color-mix(in_oklch,var(--foreground)_8%,var(--card)))] " +
  "shadow-[inset_0_1px_0_rgb(255_255_255/0.85),inset_0_-2px_0_rgb(0_0_0/0.1),0_0_0_1px_rgb(0_0_0/0.13),0_1px_1px_rgb(0_0_0/0.08)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.14),inset_0_-2px_0_rgb(0_0_0/0.45),0_0_0_1px_rgb(255_255_255/0.1)]";
const KEYCAP_LIT =
  "bg-[color:var(--sunui-spot,var(--primary))] bg-[linear-gradient(180deg,color-mix(in_oklch,var(--sunui-spot,var(--primary))_74%,white),var(--sunui-spot,var(--primary))_52%,color-mix(in_oklch,var(--sunui-spot,var(--primary))_82%,black))] text-[color:var(--sunui-spot-foreground,var(--primary-foreground))] " +
  "shadow-[inset_0_1px_0_rgb(255_255_255/0.35),inset_0_-2px_0_rgb(0_0_0/0.22),0_0_0_1px_rgb(0_0_0/0.12),0_1px_1px_rgb(0_0_0/0.1)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.35),inset_0_-2px_0_rgb(0_0_0/0.22),0_0_0_1px_rgb(0_0_0/0.3)]";

// Approximate fuzzy match: find each character in order, with bonuses for consecutive and word-start hits
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
  // Extra bonus for a full substring
  if (t.includes(q)) score += 12;
  return { score, indices };
}

/** Detect the platform and return "⌘" or "Ctrl"; defaults to "⌘" during SSR */
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
          <mark key={i} className="bg-transparent font-semibold text-[color:var(--sunui-spot,var(--primary))]">
            {ch}
          </mark>
        ) : (
          <Fragment key={i}>{ch}</Fragment>
        ),
      )}
    </>
  );
}

export function Kbd({ children, className, lit = false }: { children: ReactNode; className?: string; lit?: boolean }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] px-1 pb-px font-sans text-[11px] font-medium tabular-nums transition-colors duration-150",
        lit ? KEYCAP_LIT : cn("text-muted-foreground", KEYCAP),
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
  inline = false,
  labels,
  className,
}: CommandPaletteProps) {
  const reduce = useReducedMotion() ?? false;
  const text = { ...defaultLabels, ...labels };
  const baseId = useId();
  const listId = `${baseId}-list`;
  const [inner, setInner] = useState(defaultOpen);
  // Inline mode is always open
  const open = inline || (openProp ?? inner);
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

  // Global shortcut: registered only when hotkey is on, and never steals keys from other inputs
  useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
      if (e.key.toLowerCase() !== hotkeyKey.toLowerCase()) return;
      const ours = e.target === inputRef.current;
      if (isTypingTarget(e.target) && !ours) return;
      e.preventDefault();
      if (inline) inputRef.current?.focus();
      else setOpen(!open);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey, hotkeyKey, inline, open, setOpen]);

  // Open: remember focus, lock scroll, focus the input. Close: restore focus. (Skipped in inline mode)
  useEffect(() => {
    if (!open || inline) return;
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
  }, [open, inline]);

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
            // Keyword-only matches go last
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

  // When results change, move the highlight to the first selectable item
  useEffect(() => {
    setActiveKey(enabled[0]?.key ?? null);
  }, [enabled]);

  const optionId = (key: string) => `${baseId}-opt-${key.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

  // Scroll the highlighted item into view within the list only, not with scrollIntoView, so inline mode does not scroll the page
  useEffect(() => {
    const list = listRef.current;
    const el = activeKey ? document.getElementById(optionId(activeKey)) : null;
    if (!list || !el) return;
    if (activeKey === enabled[0]?.key) list.scrollTop = 0;
    else if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop - 8;
    else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight + 8;
  }, [activeKey, baseId, enabled]);

  const select = (row: Row) => {
    if (row.item.disabled) return;
    if (recentLimit > 0) {
      const next = [row.item.id, ...recent.filter((id) => id !== row.item.id)].slice(0, Math.max(recentLimit, 10));
      setRecent(next);
      onRecentChange?.(next);
    }
    if (closeOnSelect && !inline) setOpen(false);
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

  // Focus trap: Tab cycles inside the dialog; Escape closes (clears the query when inline)
  const onDialogKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      if (inline) {
        if (query) {
          e.preventDefault();
          setQuery("");
        }
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      return;
    }
    if (e.key !== "Tab" || inline) return;
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

  const panel = (
    <motion.div
      ref={dialogRef}
      role={inline ? "search" : "dialog"}
      aria-modal={inline ? undefined : true}
      aria-label={text.dialog}
      onKeyDown={onDialogKeyDown}
      // Popover settle: from 0.96 with a fade, within 200ms; no entrance when inline
      initial={inline || reduce ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
      transition={reduce ? { duration: 0 } : { ...springs.snappy, opacity: { duration: 0.15 } }}
      className={cn(
        "relative flex w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-card text-card-foreground",
        inline
          ? "has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-ring"
          : "max-h-[min(32rem,76vh)]",
        E3,
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-foreground/10 px-4">
        <svg
          viewBox="0 0 24 24"
          className="size-4 shrink-0 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
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
        {!inline && <Kbd className="shrink-0">Esc</Kbd>}
      </div>

      <div
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label={text.dialog}
        className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain p-2"
      >
        {sections.map((section) => {
          const headingId = `${baseId}-h-${section.key.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
          return (
            <div key={section.key} role="group" aria-labelledby={headingId} className="mb-1 last:mb-0">
              <div id={headingId} className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">
                {section.heading}
              </div>
              {section.rows.map((row) => {
                const active = row.key === activeKey;
                const off = row.item.disabled;
                return (
                  <div
                    key={row.key}
                    id={optionId(row.key)}
                    role="option"
                    aria-selected={active}
                    aria-disabled={off || undefined}
                    onPointerMove={() => {
                      if (!off && !active) setActiveKey(row.key);
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => select(row)}
                    className={cn(
                      // Rows are large surfaces, so 0.99 on press; the highlight background slides with the pointer and arrow keys via layoutId
                      "relative flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-foreground transition-[scale] duration-150 select-none",
                      off ? "cursor-not-allowed opacity-50" : "cursor-pointer motion-safe:active:scale-[0.99]",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId={reduce ? undefined : `${baseId}-active`}
                        aria-hidden="true"
                        className="absolute inset-0 rounded-lg bg-foreground/[0.06] dark:bg-foreground/[0.08]"
                        transition={springs.snappy}
                      />
                    )}
                    {row.item.icon && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "relative flex size-5 shrink-0 items-center justify-center transition-colors duration-150 [&>svg]:size-4",
                          active ? "text-[color:var(--sunui-spot,var(--primary))] duration-0" : "text-muted-foreground",
                        )}
                      >
                        {row.item.icon}
                      </span>
                    )}
                    <span className="relative min-w-0 flex-1 truncate">
                      <Highlight text={row.item.label} indices={row.indices} />
                    </span>
                    {row.item.shortcut && (
                      <span className="relative flex shrink-0 gap-1" aria-hidden="true">
                        {row.item.shortcut.map((k, i) => (
                          <Kbd key={i} lit={active}>
                            {k}
                          </Kbd>
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
              strokeWidth="1.5"
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
        className="flex items-center gap-4 border-t border-foreground/10 bg-muted/50 px-4 py-2 text-xs text-muted-foreground"
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
        {!inline && (
          <span className="flex items-center gap-1.5">
            <Kbd>Esc</Kbd>
            {text.close}
          </span>
        )}
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        {query.trim() ? text.results(rows.length) : ""}
      </span>
    </motion.div>
  );

  if (inline) return panel;
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
          transition={{ duration: reduce ? 0 : 0.15 }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-background/70 backdrop-blur-[2px]"
            onPointerDown={() => setOpen(false)}
          />
          {panel}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
