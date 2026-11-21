"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useId, useMemo, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type SkillShape = "hexagon" | "circle" | "square";

export interface SkillItem {
  name: string;
  /** Image URL or your own element (an inline SVG logo). */
  icon: string | ReactNode;
  category?: string;
  /** Logo colour. Tints the tile lightly, a little more on hover. Falls back to the brand spot colour. */
  color?: string;
}

export interface SkillGridProps {
  items: SkillItem[];
  shape?: SkillShape;
  /** Tile width in px. Hexagons are 1.15 times as tall. */
  size?: number;
  /** Category order. Defaults to the order they first appear in items. */
  categories?: string[];
  /** Label of the chip that shows everything. Pass null to hide the filter row. */
  allLabel?: string | null;
  showNames?: boolean;
  /** Makes tiles pressable buttons. */
  onSelect?: (item: SkillItem) => void;
  "aria-label"?: string;
  className?: string;
}

const gentle = { type: "spring", stiffness: 240, damping: 30 } as const;
const snappy = { type: "spring", stiffness: 520, damping: 34 } as const;
const HEX = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

/** A wall of logo tiles (hexagon, circle or square) with category chips that re-flow the wall when you filter. */
export function SkillGrid({
  items,
  shape = "hexagon",
  size = 112,
  categories,
  allLabel = "All",
  showNames = true,
  onSelect,
  "aria-label": ariaLabel,
  className,
}: SkillGridProps) {
  const reduce = useReducedMotion();
  const group = useId();
  const [active, setActive] = useState<string | null>(null);
  const cats = useMemo(
    () => categories ?? [...new Set(items.map((i) => i.category).filter((c): c is string => !!c))],
    [categories, items],
  );
  const shown = active ? items.filter((i) => i.category === active) : items;
  const height = shape === "hexagon" ? Math.round(size * 1.15) : size;
  const chips: (string | null)[] = [null, ...cats];

  return (
    <div className={cn("flex w-full flex-col items-center gap-8", className)}>
      {allLabel !== null && cats.length > 0 && (
        <LayoutGroup id={group}>
          <div role="group" aria-label={ariaLabel} className="flex flex-wrap justify-center gap-1 rounded-full bg-muted p-1 shadow-[inset_0_1px_2px_rgb(0_0_0/0.06)]">
            {chips.map((c) => {
              const on = c === active;
              return (
                <motion.button
                  key={c ?? "__all"}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setActive(c)}
                  whileTap={reduce ? undefined : { scale: 0.97 }}
                  transition={snappy}
                  className={cn(
                    "relative rounded-full px-3.5 py-1.5 text-sm font-medium outline-none transition-colors duration-150",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-muted",
                    on ? "text-[color:var(--sunui-spot-foreground,var(--primary-foreground))]" : "text-muted-foreground hover:text-foreground hover:duration-0",
                  )}
                >
                  {on && (
                    <motion.span
                      layoutId="skill-grid-chip"
                      className="absolute inset-0 rounded-full bg-[color:var(--sunui-spot,var(--primary))] shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_1px_2px_rgb(0_0_0/0.12)]"
                      transition={reduce ? { duration: 0 } : gentle}
                    />
                  )}
                  <span className="relative">{c ?? allLabel}</span>
                </motion.button>
              );
            })}
          </div>
        </LayoutGroup>
      )}

      <motion.ul layout={!reduce} className="flex flex-wrap justify-center gap-3" aria-label={ariaLabel} aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map((item) => (
            <motion.li
              key={item.name}
              layout={!reduce}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
              transition={reduce ? { duration: 0 } : gentle}
            >
              <Tile item={item} shape={shape} width={size} height={height} showName={showNames} onSelect={onSelect} reduce={!!reduce} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
}

function Tile({ item, shape, width, height, showName, onSelect, reduce }: { item: SkillItem; shape: SkillShape; width: number; height: number; showName: boolean; onSelect?: (item: SkillItem) => void; reduce: boolean }) {
  const clip = shape === "hexagon" ? HEX : undefined;
  const radius = shape === "circle" ? "rounded-full" : shape === "square" ? "rounded-xl" : "";
  const icon = Math.round(width * (showName ? 0.36 : 0.42));
  const Tag = onSelect ? motion.button : motion.div;

  return (
    <Tag
      {...(onSelect ? { type: "button" as const, onClick: () => onSelect(item) } : {})}
      whileHover={reduce ? undefined : { y: -3 }}
      whileTap={onSelect && !reduce ? { scale: 0.97, y: 0 } : undefined}
      transition={snappy}
      style={{ width, height, "--tile": item.color ?? "var(--sunui-spot, var(--primary))" } as CSSProperties}
      className={cn("group/tile relative block outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background", radius)}
    >
      {/* hairline: the outer shape in a faint foreground, the face inset by 1px on top of it */}
      <span aria-hidden="true" className={cn("absolute inset-0 bg-foreground/10", radius)} style={{ clipPath: clip }} />
      <span
        className={cn(
          "absolute inset-px flex flex-col items-center justify-center gap-2 transition-[background-color] duration-200 group-hover/tile:duration-0",
          "bg-[color:color-mix(in_oklab,var(--tile)_9%,var(--card))] group-hover/tile:bg-[color:color-mix(in_oklab,var(--tile)_18%,var(--card))]",
          radius,
        )}
        style={{ clipPath: clip }}
      >
        <span aria-hidden="true" className="grid place-items-center transition-[scale] duration-200 group-hover/tile:scale-[1.06]" style={{ width: icon, height: icon }}>
          {typeof item.icon === "string" ? <img src={item.icon} alt="" width={icon} height={icon} className="size-full object-contain" draggable={false} /> : item.icon}
        </span>
        <span className={cn("max-w-[80%] truncate text-center text-xs font-medium text-foreground/80", !showName && "sr-only")}>{item.name}</span>
      </span>
    </Tag>
  );
}
