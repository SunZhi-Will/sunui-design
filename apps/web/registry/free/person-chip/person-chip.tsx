"use client";

import { AnimatePresence, motion, useReducedMotion, type Transition } from "framer-motion";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// 固定的識別色盤，只用在標籤前的小圓點。用 id 取餘數決定顏色，同一個對象在不同畫面永遠是同一個顏色。
// 八個色相同明度、同低彩度（OKLCH），沒有哪一個特別跳；bg 與 ring 用半透明，淺色與深色底上都讀得出來。
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
 * 頭像用的單字：中文名取最後一字（小明→明、王大同→同），因為常見的「小」「阿」字首無法區分人；
 * 非中文名取第一個字母。
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

/** 字串 id 轉成穩定的整數，供 personColor 使用 */
export function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/** 專案的識別色，同一個專案在所有畫面永遠是同一個顏色 */
export function appColor(appId: string) {
  return personColor(hashId(appId));
}

/** 人與專案共用的 6px 識別色圓點，顏色只出現在這裡 */
function IdentityDot({ color, className }: { color: string; className?: string }) {
  return <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", className)} style={{ backgroundColor: color }} />;
}

// 所有標籤共用的外框：圓角、邊線、字級。字一律是墨色，顏色只在圓點
const chipBase = "inline-flex max-w-full items-center gap-1.5 rounded-md border font-medium whitespace-nowrap";
const chipSize = { default: "h-6 px-2 text-xs", lg: "h-8 px-2.5 text-sm" } as const;
const pressable = "cursor-pointer transition-colors hover:border-foreground/30 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none";

// 數值同 registry/lib/sunui-motion
const snappy: Transition = { type: "spring", stiffness: 520, damping: 34 };
const gentle: Transition = { type: "spring", stiffness: 240, damping: 30 };
const instant: Transition = { duration: 0 };

// lucide Lock，線寬 1.5
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
  /** 付費標記「$」的無障礙名稱 */
  paid: string;
}

export interface PersonChipGroupLabels extends PersonChipLabels {
  /** 收起來的人數標籤，例如「+3」 */
  more: (n: number) => string;
  /** 展開後收回的標籤 */
  less: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
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
  /** 異動過的項目：虛線墨框 */
  highlighted?: boolean;
  /** 「自己的」項目：實心深色強調 */
  emphasized?: boolean;
  locked?: boolean;
  /** 正在側邊面板中檢視：深色外框 */
  selected?: boolean;
  /** 弱化「非自己」的項目 */
  muted?: boolean;
  onClick?: () => void;
  /** lg：手機版較大的觸控範圍 */
  size?: "default" | "lg";
  /** false 時 selected 不畫自己的外框（由外層畫共用的選取框，例如 PersonChipGroup），aria-pressed 照常 */
  selectedRing?: boolean;
  /** 給鍵盤巡覽（roving tabindex）用 */
  tabIndex?: number;
  /** 舊的寫法，等同 labels.locked */
  lockedLabel?: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
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

/** spliteat、Schedary 的命名，與 PersonChip 完全相同 */
export function EmployeeChip({ employeeId, ...props }: Omit<PersonChipProps, "personId"> & { employeeId: number }) {
  return <PersonChip personId={employeeId} {...props} />;
}

/* PersonChipGroup：超出 max 的人收成「+3」，點開時從那顆標籤滑出；選取框在標籤之間滑動 */

export interface PersonChipGroupPerson {
  id: number | string;
  name: string;
  locked?: boolean;
  highlighted?: boolean;
  muted?: boolean;
}

export interface PersonChipGroupProps {
  people: PersonChipGroupPerson[];
  /** 收合時最多顯示幾位；選中的人一定會顯示 */
  max?: number;
  selectedId?: number | string | null;
  /** 給了才可點選；點已選中的人會傳回 null */
  onSelect?: (id: number | string | null) => void;
  /** 「自己」：實心強調 */
  meId?: number | string;
  size?: "default" | "lg";
  /** 群組的無障礙名稱 */
  label?: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
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

  // 方向鍵在標籤之間移動，Home、End 到頭尾；整組只佔一個 Tab 停駐點
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

/* AppDot、AppChip（usermeld app-chip）：同一套雜湊色，用字串 id */

/** 專案的識別色圓點，顏色只出現在這個小圓點 */
export function AppDot({ appId, className }: { appId: string; className?: string }) {
  return <IdentityDot color={appColor(appId).fg} className={className} />;
}

export interface AppChipProps {
  appId: string;
  /** 顯示名稱，預設用 appId */
  name?: ReactNode;
  paid?: boolean;
  /** 舊版寫法，等同 labels.paid */
  paidLabel?: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<AppChipLabels>;
  className?: string;
}

/** 專案標籤：圓點加名稱，付費的帶「$」 */
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
