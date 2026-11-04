"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type AvatarPresence = "online" | "away" | "busy" | "offline";

export interface AvatarStackPerson {
  id: string;
  name: string;
  /** 頭像圖片；缺少或載入失敗時顯示姓名縮寫 */
  src?: string;
  /** 線上狀態，需同時開啟 showPresence */
  presence?: AvatarPresence;
}

export interface AvatarStackProps {
  people: AvatarStackPerson[];
  /** 最多顯示幾個頭像，其餘收進 +N */
  max?: number;
  size?: "sm" | "md" | "lg";
  /** 頭像外圈顏色，預設與背景同色以切出間隔 */
  ringColor?: string;
  /** 顯示右下角的線上狀態點 */
  showPresence?: boolean;
  /** 整組頭像的無障礙名稱 */
  label?: string;
  /** 點擊 +N 時觸發；未提供時 +N 僅為文字 */
  onOverflowClick?: () => void;
  className?: string;
}

const sizes = {
  sm: { box: 28, text: "text-[10px]", overlap: -8, dot: 8 },
  md: { box: 36, text: "text-xs", overlap: -10, dot: 10 },
  lg: { box: 48, text: "text-sm", overlap: -14, dot: 12 },
};

const presenceStyles: Record<AvatarPresence, { dot: string; label: string }> = {
  online: { dot: "bg-emerald-500", label: "online" },
  away: { dot: "bg-amber-400", label: "away" },
  busy: { dot: "bg-red-500", label: "busy" },
  offline: { dot: "bg-zinc-400", label: "offline" },
};

/** 依姓名產生固定色相，同一人永遠同色 */
function hueOf(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h % 360;
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function AvatarStack({
  people,
  max = 4,
  size = "md",
  ringColor,
  showPresence = false,
  label = "Team members",
  onOverflowClick,
  className,
}: AvatarStackProps) {
  const reduce = useReducedMotion();
  const s = sizes[size];
  const visible = people.slice(0, Math.max(0, max));
  const hidden = people.slice(visible.length);
  const ring = ringColor ? { boxShadow: `0 0 0 2px ${ringColor}` } : undefined;
  const ringClass = ringColor ? undefined : "ring-2 ring-background";
  const enter = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 28 };

  return (
    <ul aria-label={`${label} (${people.length})`} className={cn("flex items-center", className)}>
      <AnimatePresence initial={false}>
        {visible.map((p, i) => (
          <motion.li
            key={p.id}
            className="relative"
            style={{ marginLeft: i === 0 ? 0 : s.overlap, zIndex: visible.length - i }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
            transition={enter}
          >
            <Lift name={p.name} reduce={!!reduce}>
              <span
                role="img"
                tabIndex={0}
                aria-label={showPresence && p.presence ? `${p.name}, ${presenceStyles[p.presence].label}` : p.name}
                className={cn("relative block rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring", ringClass)}
                style={{ width: s.box, height: s.box, ...ring }}
              >
                <Face person={p} textClass={s.text} />
                {showPresence && p.presence && (
                  <span
                    aria-hidden="true"
                    className={cn("absolute bottom-0 right-0 rounded-full ring-2 ring-background", presenceStyles[p.presence].dot)}
                    style={{ width: s.dot, height: s.dot }}
                  />
                )}
              </span>
            </Lift>
          </motion.li>
        ))}
        {hidden.length > 0 && (
          <motion.li
            key="overflow"
            className="relative"
            style={{ marginLeft: s.overlap, zIndex: 0 }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
            transition={enter}
          >
            <Lift name={hidden.map((h) => h.name).join(", ")} reduce={!!reduce}>
              {onOverflowClick ? (
                <button
                  type="button"
                  onClick={onOverflowClick}
                  aria-label={`Show ${hidden.length} more: ${hidden.map((h) => h.name).join(", ")}`}
                  className={cn(
                    "flex items-center justify-center rounded-full bg-muted font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                    s.text,
                    ringClass,
                  )}
                  style={{ width: s.box, height: s.box, ...ring }}
                >
                  +{hidden.length}
                </button>
              ) : (
                <span
                  role="img"
                  tabIndex={0}
                  aria-label={`${hidden.length} more: ${hidden.map((h) => h.name).join(", ")}`}
                  className={cn(
                    "flex items-center justify-center rounded-full bg-muted font-medium text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    s.text,
                    ringClass,
                  )}
                  style={{ width: s.box, height: s.box, ...ring }}
                >
                  +{hidden.length}
                </span>
              )}
            </Lift>
          </motion.li>
        )}
      </AnimatePresence>
    </ul>
  );
}

/** hover 或聚焦時抬起並顯示名稱 tooltip；tooltip 只是視覺輔助，名稱已在 aria-label 裡 */
function Lift({ name, reduce, children }: { name: string; reduce: boolean; children: ReactNode }) {
  const [active, setActive] = useState(false);
  return (
    <motion.div
      className="relative"
      style={{ zIndex: active ? 50 : undefined }}
      animate={{ y: active && !reduce ? -4 : 0 }}
      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 30 }}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
    >
      {children}
      <AnimatePresence>
        {active && (
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-full left-1/2 mb-2 max-w-48 -translate-x-1/2 truncate whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-md"
            initial={{ opacity: 0, y: reduce ? 0 : 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.12 }}
          >
            {name}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Face({ person, textClass }: { person: AvatarStackPerson; textClass: string }) {
  const [failed, setFailed] = useState(false);
  if (person.src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={person.src} alt="" onError={() => setFailed(true)} className="size-full rounded-full object-cover" />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn("flex size-full items-center justify-center rounded-full font-semibold text-white", textClass)}
      style={{ background: `hsl(${hueOf(person.name)} 55% 45%)` }}
    >
      {initialsOf(person.name)}
    </span>
  );
}
