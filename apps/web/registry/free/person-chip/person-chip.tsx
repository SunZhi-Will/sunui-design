"use client";

import { AnimatePresence, motion, useReducedMotion, type Transition } from "framer-motion";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// Fixed identity palette, used only for the small dot before a chip. The colour is picked by id modulo, so the same entity is always the same colour on every screen.
// Eight hues with the same lightness and the same low chroma (OKLCH), so none stands out; bg and ring are semi-transparent so they read on both light and dark backgrounds.
const hue = (h: number) => ({ bg: `oklch(0.62 0.08 ${h} / 0.14)`, fg: `oklch(0.62 0.08 ${h})`, ring: `oklch(0.62 0.08 ${h} / 0.45)` });
export const PERSON_PALETTE = [
  hue(255), // blue
  hue(150), // green
  hue(85), // ochre
  hue(35), // clay
  hue(190), // teal
  hue(225), // slate
  hue(120), // moss
  hue(60), // sand
] as const;

/**
 * Single character for an avatar: for Chinese names take the last character, because common given-name prefixes (such as the diminutive markers) cannot tell people apart;
 * for non-Chinese names take the first letter.
 */
export function personInitial(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return /[一-鿿]/.test(trimmed) ? trimmed.slice(-1) : trimmed.slice(0, 1).toUpperCase();
}

export function personColor(personId: number) {
  const idx = ((personId % PERSON_PALETTE.length) + PERSON_PALETTE.length) % PERSON_PALETTE.length;
  return PERSON_PALETTE[idx];
}

/** Turn a string id into a stable integer, for use by personColor */
export function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/** Identity colour of a project; the same project is always the same colour on every screen */
export function appColor(appId: string) {
  return personColor(hashId(appId));
}

/** 6px identity dot shared by people and projects; colour appears only here */
function IdentityDot({ color, className }: { color: string; className?: string }) {
  return <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", className)} style={{ backgroundColor: color }} />;
}

// Shared frame for all chips: radius, border, font size. Text is always ink colour; colour appears only in the dot
const chipBase = "inline-flex max-w-full items-center gap-1.5 rounded-md border font-medium whitespace-nowrap";
const chipSize = { default: "h-6 px-2 text-xs", lg: "h-8 px-2.5 text-sm" } as const;
const pressable = "cursor-pointer transition-colors hover:border-foreground/30 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none";

// Values match registry/lib/sunui-motion
const snappy: Transition = { type: "spring", stiffness: 520, damping: 34 };
const gentle: Transition = { type: "spring", stiffness: 240, damping: 30 };
const instant: Transition = { duration: 0 };

// lucide Lock, 1.5 stroke width
function LockIcon({ label }: { label: string }) {
  return (
    <svg role="img" aria-label={label} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-3 shrink-0 opacity-70">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export interface PersonChipLabels {
  locked: string;
}

export interface AppChipLabels {
  /** Accessible name for the paid marker "$" */
  paid: string;
}

export interface PersonChipGroupLabels extends PersonChipLabels {
  /** Label for the collapsed count, for example "+3" */
  more: (n: number) => string;
  /** Label for collapsing again after expanding */
  less: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Map any language tag to one of the four built-in languages; everything else falls back to English */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const more = (n: number) => `+${n}`;
const MESSAGES: Record<SunLocale, PersonChipGroupLabels & AppChipLabels> = {
  en: { locked: "Locked", paid: "Paid", more, less: "Less" },
  "zh-TW": { locked: "已鎖定", paid: "付費", more, less: "收合" },
  "zh-CN": { locked: "已锁定", paid: "付费", more, less: "收起" },
  ja: { locked: "ロック中", paid: "有料", more, less: "閉じる" },
};

export interface PersonChipProps {
  name: string;
  personId: number;
  /** Changed item: dashed ink border */
  highlighted?: boolean;
  /** "Own" item: solid dark emphasis */
  emphasized?: boolean;
  locked?: boolean;
  /** Being viewed in the side panel: dark outline */
  selected?: boolean;
  /** Dim items that are not the user's own */
  muted?: boolean;
  onClick?: () => void;
  /** lg: larger touch target for mobile */
  size?: "default" | "lg";
  /** When false, selected does not draw its own outline (the parent draws a shared selection frame, for example PersonChipGroup); aria-pressed still applies */
  selectedRing?: boolean;
  /** For keyboard navigation (roving tabindex) */
  tabIndex?: number;
  /** Legacy form, equivalent to labels.locked */
  lockedLabel?: string;
  /** UI language: en, zh-TW, zh-CN, ja. Tags such as zh-Hant-HK or ja-JP are also accepted */
  locale?: string;
  /** Override built-in strings; takes precedence over locale */
  labels?: Partial<PersonChipLabels>;
  className?: string;
}

export function PersonChip({
  name,
  personId,
  highlighted,
  emphasized,
  locked,
  selected,
  muted,
  onClick,
  size = "default",
  selectedRing = true,
  tabIndex,
  lockedLabel,
  locale = "en",
  labels,
  className,
}: PersonChipProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...(lockedLabel ? { locked: lockedLabel } : null), ...labels };
  const Comp = onClick ? "button" : "span";

  return (
    <Comp
      type={onClick ? "button" : undefined}
      aria-pressed={onClick ? Boolean(selected) : undefined}
      onClick={onClick}
      tabIndex={tabIndex}
      className={cn(
        chipBase,
        chipSize[size],
        emphasized ? "border-foreground bg-foreground text-background" : "border-border bg-card text-foreground",
        muted && "text-muted-foreground opacity-60",
        highlighted && "border-dashed border-foreground/60",
        selected && selectedRing && "ring-2 ring-foreground ring-offset-1 ring-offset-card",
        onClick && pressable,
        onClick && emphasized && "hover:border-foreground hover:bg-foreground/90",
        className,
      )}
    >
      <IdentityDot color={emphasized ? "currentColor" : personColor(personId).fg} />
      {locked ? <LockIcon label={t.locked} /> : null}
      {name}
    </Comp>
  );
}

/** Naming from spliteat and Schedary, identical to PersonChip */
export function EmployeeChip({ employeeId, ...props }: Omit<PersonChipProps, "personId"> & { employeeId: number }) {
  return <PersonChip personId={employeeId} {...props} />;
}

/* PersonChipGroup: people beyond max collapse into "+3", which slides out of that chip when opened; the selection frame slides between chips */

export interface PersonChipGroupPerson {
  id: number | string;
  name: string;
  locked?: boolean;
  highlighted?: boolean;
  muted?: boolean;
}

export interface PersonChipGroupProps {
  people: PersonChipGroupPerson[];
  /** Maximum number shown when collapsed; the selected person is always shown */
  max?: number;
  selectedId?: number | string | null;
  /** Selectable only when given; clicking the selected person reports null */
  onSelect?: (id: number | string | null) => void;
  /** "Own": solid emphasis */
  meId?: number | string;
  size?: "default" | "lg";
  /** Accessible name of the group */
  label?: string;
  /** UI language: en, zh-TW, zh-CN, ja. Tags such as zh-Hant-HK or ja-JP are also accepted */
  locale?: string;
  /** Override built-in strings; takes precedence over locale */
  labels?: Partial<PersonChipGroupLabels>;
  className?: string;
}

const colorKey = (id: number | string) => (typeof id === "number" ? id : hashId(id));

export function PersonChipGroup({ people, max, selectedId = null, onSelect, meId, size = "default", label, locale = "en", labels, className }: PersonChipGroupProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const reduce = useReducedMotion() ?? false;
  const uid = useId();
  const root = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [focusKey, setFocusKey] = useState<string | null>(null);

  const limit = max !== undefined && max < people.length ? Math.max(0, max) : people.length;
  const shown = expanded ? people : people.filter((p, i) => i < limit || p.id === selectedId);
  const hidden = people.length - shown.length;
  const hasToggle = limit < people.length;
  const keys = [...(onSelect ? shown.map((p) => String(p.id)) : []), ...(hasToggle ? ["toggle"] : [])];
  const tabKey = focusKey !== null && keys.includes(focusKey) ? focusKey : keys[0];
  const move = reduce ? instant : gentle;

  // Arrow keys move between chips, Home and End jump to the ends; the whole group is a single Tab stop
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (step === undefined && e.key !== "Home" && e.key !== "End") return;
    const at = keys.indexOf(tabKey);
    const next = e.key === "Home" ? 0 : e.key === "End" ? keys.length - 1 : (at + (step ?? 0) + keys.length) % keys.length;
    e.preventDefault();
    setFocusKey(keys[next]);
    root.current?.querySelector<HTMLElement>(`[data-key="${CSS.escape(keys[next])}"] button`)?.focus();
  };

  return (
    <motion.div ref={root} layout transition={move} role="group" aria-label={label} onKeyDown={onKeyDown} className={cn("relative flex flex-wrap gap-1.5", className)}>
      <AnimatePresence initial={false} mode="popLayout">
        {shown.map((p, i) => {
          const key = String(p.id);
          const selected = p.id === selectedId;
          return (
            <motion.span
              key={key}
              data-key={key}
              layout="position"
              className="relative inline-flex"
              onFocus={() => setFocusKey(key)}
              initial={reduce ? false : { opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0, transition: reduce ? instant : { ...gentle, delay: Math.max(0, i - limit) * 0.03 } }}
              exit={{ opacity: 0, x: -12, transition: reduce ? instant : { duration: 0.12 } }}
              transition={move}
            >
              {selected && (
                <motion.span aria-hidden layoutId={`${uid}-frame`} transition={reduce ? instant : snappy} className="pointer-events-none absolute -inset-[3px] rounded-[8px] border-2 border-foreground" />
              )}
              <PersonChip
                name={p.name}
                personId={colorKey(p.id)}
                size={size}
                locked={p.locked}
                highlighted={p.highlighted}
                muted={p.muted}
                emphasized={meId !== undefined && p.id === meId}
                selected={selected}
                selectedRing={false}
                tabIndex={onSelect ? (tabKey === key ? 0 : -1) : undefined}
                onClick={onSelect ? () => onSelect(selected ? null : p.id) : undefined}
                locale={locale}
                labels={labels}
              />
            </motion.span>
          );
        })}
        {hasToggle && (
          <motion.span key="toggle" data-key="toggle" layout="position" transition={move} className="inline-flex" onFocus={() => setFocusKey("toggle")}>
            <button
              type="button"
              aria-expanded={expanded}
              tabIndex={tabKey === "toggle" ? 0 : -1}
              onClick={() => setExpanded((v) => !v)}
              className={cn(chipBase, chipSize[size], pressable, "border-border bg-card text-muted-foreground tabular-nums")}
            >
              {expanded ? t.less : t.more(hidden)}
            </button>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* AppDot, AppChip (usermeld app-chip): the same hash colours, keyed by string id */

/** Identity-colour dot of a project; colour appears only in this small dot */
export function AppDot({ appId, className }: { appId: string; className?: string }) {
  return <IdentityDot color={appColor(appId).fg} className={className} />;
}

export interface AppChipProps {
  appId: string;
  /** Display name, defaults to appId */
  name?: ReactNode;
  paid?: boolean;
  /** Legacy form, equivalent to labels.paid */
  paidLabel?: string;
  /** UI language: en, zh-TW, zh-CN, ja. Tags such as zh-Hant-HK or ja-JP are also accepted */
  locale?: string;
  /** Override built-in strings; takes precedence over locale */
  labels?: Partial<AppChipLabels>;
  className?: string;
}

/** Project chip: dot plus name, with a "$" for paid ones */
export function AppChip({ appId, name, paid, paidLabel, locale = "en", labels, className }: AppChipProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const paidName = paidLabel ?? t.paid;
  return (
    <span className={cn(chipBase, chipSize.default, "border-border bg-card text-foreground", className)}>
      <AppDot appId={appId} />
      <span className="truncate">{name ?? appId}</span>
      {paid ? (
        <span role="img" aria-label={paidName} className="text-muted-foreground">
          $
        </span>
      ) : null}
    </span>
  );
}
