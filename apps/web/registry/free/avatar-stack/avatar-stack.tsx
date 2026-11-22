"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface AvatarStackPerson {
  id: string;
  /** Display name; give only the first name plus the initial of the surname, for example "Mina P." */
  name: string;
  /** Avatar image; when missing or failed to load, the initials are shown */
  src?: string;
  /** Second line of the tooltip, for example "Taipei, 2 hours ago" */
  note?: string;
}

export interface AvatarStackProps {
  people: AvatarStackPerson[];
  /** Actual total count; when larger than the number of people, the difference is added to +N */
  total?: number;
  /** Maximum number of avatars shown, the rest go into +N */
  max?: number;
  size?: "sm" | "md" | "lg";
  /** Accessible name for the whole group of avatars, same as labels.label */
  label?: string;
  /** Fired when +N is clicked; when not provided, +N is plain text */
  onOverflowClick?: () => void;
  /** UI language and number format: en, zh-TW, zh-CN, ja; tags such as zh-Hant-HK and ja-JP are also accepted */
  locale?: string;
  /** Override the built-in strings, takes priority over locale */
  labels?: Partial<AvatarStackLabels>;
  /** What people without a photo show: initials on a soft tint of their own content colour (default), or a soft gradient of the brand spot picked from their id, the same on every render, for invite lists and team rows that should feel alive without photos */
  fallback?: "initials" | "gradient";
  className?: string;
}

export interface AvatarStackLabels {
  label: string;
  /** Name for +N; names are the collapsed people, and may be an empty string */
  more: (count: string, names: string) => string;
  /** Name of the clickable +N button */
  showMore: (count: string, names: string) => string;
  /** Separator used to join names */
  separator: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Map any language tag to one of the four built-in languages; everything else falls back to English */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, AvatarStackLabels> = {
  en: {
    label: "Recent buyers",
    more: (n, names) => (names ? `${n} more, including ${names}` : `${n} more`),
    showMore: (n, names) => (names ? `Show ${n} more, including ${names}` : `Show ${n} more`),
    separator: ", ",
  },
  "zh-TW": {
    label: "最近購買",
    more: (n, names) => (names ? `還有 ${n} 人，包括 ${names}` : `還有 ${n} 人`),
    showMore: (n, names) => (names ? `查看其餘 ${n} 人，包括 ${names}` : `查看其餘 ${n} 人`),
    separator: "、",
  },
  "zh-CN": {
    label: "最近购买",
    more: (n, names) => (names ? `还有 ${n} 人，包括 ${names}` : `还有 ${n} 人`),
    showMore: (n, names) => (names ? `查看其余 ${n} 人，包括 ${names}` : `查看其余 ${n} 人`),
    separator: "、",
  },
  ja: {
    label: "最近の購入者",
    more: (n, names) => (names ? `ほか ${n} 人（${names} など）` : `ほか ${n} 人`),
    showMore: (n, names) => (names ? `ほか ${n} 人を表示（${names} など）` : `ほか ${n} 人を表示`),
    separator: "、",
  },
};

// Design language (DESIGN.md): neutral surfaces and text colors
const surface = "bg-card shadow-[0_1px_2px_rgb(0_0_0/0.05),0_4px_12px_-6px_rgb(0_0_0/0.06)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]";
const ink = "text-foreground";
const inkOutline = "border-foreground/70";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  pop: { type: "spring", stiffness: 460, damping: 26 },
} as const;

/** Content colours: shades of the brand spot, picked by hashing a name, so avatars and tags follow the buyer's brand instead of a palette of their own (see the 2026-11-22 colour unification report in reports/) */
const CONTENT_SHADES = [12, 20, 28] as const;
function contentTone(key: string) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  const mix = CONTENT_SHADES[h % CONTENT_SHADES.length];
  return { backgroundColor: `color-mix(in oklch, var(--sunui-spot, var(--primary)) ${mix}%, transparent)`, color: "var(--sunui-spot, var(--primary))", borderColor: `color-mix(in oklch, var(--sunui-spot, var(--primary)) 30%, transparent)` };
}

/** Gradient discs for fallback="gradient": the brand spot from a light tint to full or slightly deeper, one hue only, picked by hashing the id */
const GRADIENTS = [
  [40, 0],
  [55, 15],
  [28, 8],
  [65, 22],
  [48, 4],
] as const;

/** Stable index from the id, so a person keeps the same gradient everywhere */
function gradientOf(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const [tint, deep] = GRADIENTS[h % GRADIENTS.length];
  return `linear-gradient(135deg, color-mix(in oklch, var(--sunui-spot, var(--primary)) ${tint}%, white), color-mix(in oklch, var(--sunui-spot, var(--primary)), black ${deep}%))`;
}

const sizes = {
  sm: { box: 28, text: "text-[10px]", overlap: -7 },
  md: { box: 36, text: "text-xs", overlap: -9 },
  lg: { box: 44, text: "text-sm", overlap: -11 },
};

function initialsOf(name: string) {
  const parts = name.replace(/\./g, "").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** From 1,000 up it is shortened to 1.3K, keeping the disc width */
function compact(n: number, locale: string) {
  return new Intl.NumberFormat(locale, n >= 1_000 ? { notation: "compact", maximumFractionDigits: 1 } : {}).format(n);
}

export function AvatarStack({ people, total, max = 4, size = "md", label, onOverflowClick, locale = "en-US", labels, fallback = "initials", className }: AvatarStackProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...(label !== undefined ? { label } : null), ...labels };
  const reduce = useReducedMotion() ?? false;
  const s = sizes[size];
  const visible = people.slice(0, Math.max(0, max));
  const hidden = people.slice(visible.length);
  const count = Math.max(total ?? people.length, people.length);
  const extra = count - visible.length;
  const extraText = `+${compact(extra, locale)}`;
  const hiddenNames = hidden.map((h) => h.name).join(t.separator);
  const extraLabel = t.more(String(extra), hiddenNames);
  const disc = cn("flex items-center justify-center rounded-full border font-medium tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", surface, ink, inkOutline, s.text);

  return (
    <ul aria-label={`${t.label} (${count})`} className={cn("flex items-center", className)}>
      <AnimatePresence initial={false}>
        {visible.map((p, i) => (
          <motion.li
            key={p.id}
            className="relative"
            style={{ marginLeft: i === 0 ? 0 : s.overlap, zIndex: visible.length - i + 1 }}
            // A new person slides in from the stack and settles; leaving just fades
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, x: -8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={reduce ? { duration: 0 } : springs.pop}
          >
            <Lift title={p.name} note={p.note} reduce={reduce}>
              <span
                role="img"
                tabIndex={0}
                aria-label={p.note ? `${p.name}, ${p.note}` : p.name}
                className={cn(disc, "overflow-hidden", fallback === "gradient" && !p.src && "border-2 border-card")}
                style={{ width: s.box, height: s.box, ...(p.src ? null : fallback === "gradient" ? { backgroundImage: gradientOf(p.id) } : contentTone(p.id)) }}
              >
                <Face person={p} gradient={fallback === "gradient"} />
              </span>
            </Lift>
          </motion.li>
        ))}
        {extra > 0 && (
          <motion.li key="overflow" className="relative" style={{ marginLeft: s.overlap, zIndex: 1 }}>
            <Lift title={hiddenNames || t.more(compact(extra, locale), "")} reduce={reduce}>
              {onOverflowClick ? (
                <button type="button" onClick={onOverflowClick} aria-label={t.showMore(String(extra), hiddenNames)} className={cn(disc, "px-1.5 hover:bg-muted dark:hover:bg-foreground/10 motion-safe:active:scale-[0.97] transition-[color,background-color,border-color,opacity,scale]")} style={{ minWidth: s.box, height: s.box }}>
                  {extraText}
                </button>
              ) : (
                <span role="img" tabIndex={0} aria-label={extraLabel} className={cn(disc, "px-1.5")} style={{ minWidth: s.box, height: s.box }}>
                  {extraText}
                </span>
              )}
            </Lift>
          </motion.li>
        )}
      </AnimatePresence>
    </ul>
  );
}

/** Lifts and shows the name on hover or focus; the tooltip is only a visual aid, the name is already in aria-label */
function Lift({ title, note, reduce, children }: { title: string; note?: string; reduce: boolean; children: ReactNode }) {
  const [active, setActive] = useState(false);
  return (
    <motion.div
      className="relative"
      style={{ zIndex: active ? 50 : undefined }}
      animate={{ y: active && !reduce ? -3 : 0 }}
      transition={reduce ? { duration: 0 } : springs.snappy}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
    >
      {children}
      {active && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-max max-w-52 -translate-x-1/2 rounded-[3px] bg-foreground px-2 py-1 text-xs text-background"
        >
          <span className="block truncate font-medium">{title}</span>
          {note && <span className="block truncate opacity-70">{note}</span>}
        </span>
      )}
    </motion.div>
  );
}

function Face({ person, gradient }: { person: AvatarStackPerson; gradient: boolean }) {
  const [failed, setFailed] = useState(false);
  if (person.src && !failed) {
    return <img src={person.src} alt="" onError={() => setFailed(true)} className="size-full object-cover" />;
  }
  // The gradient disc carries no letters; the name is already in aria-label and the tooltip
  if (gradient && !person.src) return null;
  return <span aria-hidden="true">{initialsOf(person.name)}</span>;
}
