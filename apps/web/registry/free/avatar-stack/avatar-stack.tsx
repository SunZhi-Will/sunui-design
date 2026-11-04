"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface AvatarStackPerson {
  id: string;
  /** 顯示用名稱；建議只給名加姓氏首字，例如「Mina P.」 */
  name: string;
  /** 頭像圖片；缺少或載入失敗時顯示姓名縮寫 */
  src?: string;
  /** 提示框第二行，例如「Taipei, 2 hours ago」 */
  note?: string;
}

export interface AvatarStackProps {
  people: AvatarStackPerson[];
  /** 實際總人數；大於 people 數量時，差額併入 +N */
  total?: number;
  /** 最多顯示幾個頭像，其餘收進 +N */
  max?: number;
  size?: "sm" | "md" | "lg";
  /** 整組頭像的無障礙名稱 */
  label?: string;
  /** 點擊 +N 時觸發；未提供時 +N 僅為文字 */
  onOverflowClick?: () => void;
  locale?: string;
  className?: string;
}

// 設計語言（DESIGN.md）：紙、墨
const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const inkOutline = "border-[#1c1917]/70 dark:border-[#ece7dc]/70";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
} as const;

const sizes = {
  sm: { box: 28, text: "text-[10px]", overlap: -7 },
  md: { box: 36, text: "text-xs", overlap: -9 },
  lg: { box: 44, text: "text-sm", overlap: -11 },
};

function initialsOf(name: string) {
  const parts = name.replace(/\./g, "").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** 1,000 以上縮成 1.3K，維持圓片寬度 */
function compact(n: number, locale: string) {
  return new Intl.NumberFormat(locale, n >= 1_000 ? { notation: "compact", maximumFractionDigits: 1 } : {}).format(n);
}

export function AvatarStack({ people, total, max = 4, size = "md", label = "Recent buyers", onOverflowClick, locale = "en-US", className }: AvatarStackProps) {
  const reduce = useReducedMotion() ?? false;
  const s = sizes[size];
  const visible = people.slice(0, Math.max(0, max));
  const hidden = people.slice(visible.length);
  const count = Math.max(total ?? people.length, people.length);
  const extra = count - visible.length;
  const extraText = `+${compact(extra, locale)}`;
  const hiddenNames = hidden.map((h) => h.name).join(", ");
  const extraLabel = hiddenNames ? `${extra} more, including ${hiddenNames}` : `${extra} more`;
  const disc = cn("flex items-center justify-center rounded-full border font-medium tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", paper, ink, inkOutline, s.text);

  return (
    <ul aria-label={`${label} (${count})`} className={cn("flex items-center", className)}>
      <AnimatePresence initial={false}>
        {visible.map((p, i) => (
          <motion.li
            key={p.id}
            className="relative"
            style={{ marginLeft: i === 0 ? 0 : s.overlap, zIndex: visible.length - i + 1 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.15 }}
          >
            <Lift title={p.name} note={p.note} reduce={reduce}>
              <span role="img" tabIndex={0} aria-label={p.note ? `${p.name}, ${p.note}` : p.name} className={cn(disc, "overflow-hidden")} style={{ width: s.box, height: s.box }}>
                <Face person={p} />
              </span>
            </Lift>
          </motion.li>
        ))}
        {extra > 0 && (
          <motion.li key="overflow" className="relative" style={{ marginLeft: s.overlap, zIndex: 1 }}>
            <Lift title={hiddenNames || `${compact(extra, locale)} more`} reduce={reduce}>
              {onOverflowClick ? (
                <button type="button" onClick={onOverflowClick} aria-label={`Show ${extraLabel}`} className={cn(disc, "px-1.5 hover:bg-[#f1ebdd] dark:hover:bg-[#29251f]")} style={{ minWidth: s.box, height: s.box }}>
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

/** hover 或聚焦時抬起並顯示名稱；提示框只是視覺輔助，名稱已在 aria-label 裡 */
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
          className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-max max-w-52 -translate-x-1/2 rounded-[3px] bg-[#1c1917] px-2 py-1 text-xs text-[#faf7f0] dark:bg-[#ece7dc] dark:text-[#1c1917]"
        >
          <span className="block truncate font-medium">{title}</span>
          {note && <span className="block truncate opacity-70">{note}</span>}
        </span>
      )}
    </motion.div>
  );
}

function Face({ person }: { person: AvatarStackPerson }) {
  const [failed, setFailed] = useState(false);
  if (person.src && !failed) {
    return <img src={person.src} alt="" onError={() => setFailed(true)} className="size-full object-cover" />;
  }
  return <span aria-hidden="true">{initialsOf(person.name)}</span>;
}
