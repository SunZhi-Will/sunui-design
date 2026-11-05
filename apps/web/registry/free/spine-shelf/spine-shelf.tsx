"use client";

import { motion, useReducedMotion, type Transition } from "framer-motion";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export type SpineItem = {
  id: string;
  title: string;
  subtitle?: string;
  /** Spine face: a ReactNode, or leave it out and use spineColor + title. */
  spine?: ReactNode;
  /** Background of the default spine face (any CSS color). */
  spineColor?: string;
  /** Text color of the default spine face. */
  spineInk?: string;
  /** Front cover: an image src or a ReactNode. */
  cover: string | ReactNode;
  /** Short line under the title, such as a price or edition. */
  meta?: ReactNode;
};

export type SpineShelfProps = {
  items: SpineItem[];
  defaultIndex?: number;
  onSelect?: (item: SpineItem, index: number) => void;
  /** Spine thickness in px. */
  spineWidth?: number;
  /** Spine and cover height in px. Cover width is height x coverRatio. */
  height?: number;
  /** Cover width / height. */
  coverRatio?: number;
  /** Accessible name for the shelf. */
  label?: string;
  /** Names for the arrow buttons. */
  labels?: { previous: string; next: string };
  className?: string;
};

const gentle: Transition = { type: "spring", stiffness: 240, damping: 30 };
const snappy: Transition = { type: "spring", stiffness: 520, damping: 34 };

/**
 * A row of spines on a shelf. Pointing at one tilts it out; choosing one pulls
 * it forward and turns it to its front cover, and the caption below changes.
 */
export function SpineShelf({
  items,
  defaultIndex = 0,
  onSelect,
  spineWidth = 44,
  height = 280,
  coverRatio = 0.68,
  label = "Shelf",
  labels = { previous: "Previous", next: "Next" },
  className,
}: SpineShelfProps) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(() => Math.min(Math.max(defaultIndex, 0), items.length - 1));
  const [hover, setHover] = useState<number | null>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const firstRender = useRef(true);
  const captionId = useId();
  const coverWidth = Math.round(height * coverRatio);
  const item = items[active];

  // Keep the chosen spine in view on narrow screens (not on first paint).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    buttons.current[active]?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", inline: "center", block: "nearest" });
  }, [active, reduce]);

  const choose = (index: number, focus = false) => {
    const next = (index + items.length) % items.length;
    setActive(next);
    onSelect?.(items[next], next);
    if (focus) buttons.current[next]?.focus({ preventScroll: true });
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (event.key in keys) {
      event.preventDefault();
      choose(active + keys[event.key], true);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      choose(event.key === "Home" ? 0 : items.length - 1, true);
    }
  };

  const transition = reduce ? { duration: 0 } : gentle;

  return (
    <div className={cn("w-full", className)}>
      <div
        role="listbox"
        tabIndex={-1}
        aria-label={label}
        aria-orientation="horizontal"
        aria-describedby={captionId}
        onKeyDown={onKeyDown}
        className="relative overflow-x-auto overflow-y-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div
          className="mx-auto flex w-max items-end gap-[3px] px-6 pb-0 pt-10"
          style={{ perspective: 1400, perspectiveOrigin: "50% 40%" }}
        >
          {items.map((entry, i) => {
            const open = i === active;
            const lifted = !open && hover === i && !reduce;
            return (
              <motion.button
                key={entry.id}
                ref={(node) => {
                  buttons.current[i] = node;
                }}
                type="button"
                role="option"
                aria-selected={open}
                aria-label={entry.subtitle ? `${entry.title}, ${entry.subtitle}` : entry.title}
                tabIndex={open ? 0 : -1}
                onClick={() => choose(i)}
                onPointerEnter={(e) => e.pointerType === "mouse" && setHover(i)}
                onPointerLeave={() => setHover((h) => (h === i ? null : h))}
                initial={false}
                animate={{ width: open ? coverWidth : spineWidth }}
                transition={transition}
                className="relative shrink-0 rounded-[2px] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                style={{ height, transformStyle: "preserve-3d" }}
              >
                <motion.span
                  aria-hidden
                  initial={false}
                  animate={{
                    rotateY: open ? -90 : lifted ? -14 : 0,
                    z: open ? -spineWidth / 2 + 36 : lifted ? -coverWidth / 2 + 14 : -coverWidth / 2,
                    y: lifted ? -8 : 0,
                  }}
                  transition={lifted ? snappy : transition}
                  className="absolute left-1/2 top-0 block"
                  style={{
                    width: spineWidth,
                    height,
                    marginLeft: -spineWidth / 2,
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* spine */}
                  <span
                    className="absolute inset-0 overflow-hidden rounded-[2px] border border-black/10 [backface-visibility:hidden]"
                    style={{
                      transform: `translateZ(${coverWidth / 2}px)`,
                      background: entry.spineColor ?? "var(--muted)",
                      color: entry.spineInk ?? "var(--foreground)",
                    }}
                  >
                    {entry.spine ?? (
                      <span className="flex h-full w-full items-center justify-center px-1 py-3">
                        <span className="truncate text-[12px] font-medium tracking-[0.08em] [writing-mode:vertical-rl]">
                          {entry.title}
                        </span>
                      </span>
                    )}
                  </span>
                  {/* cover, on the right-hand side of the box */}
                  <span
                    className="absolute top-0 overflow-hidden rounded-[2px] border border-black/10 bg-card [backface-visibility:hidden]"
                    style={{
                      width: coverWidth,
                      height,
                      left: (spineWidth - coverWidth) / 2,
                      transform: `rotateY(90deg) translateZ(${spineWidth / 2}px)`,
                    }}
                  >
                    {typeof entry.cover === "string" ? (
                      <img src={entry.cover} alt="" draggable={false} className="h-full w-full object-cover" />
                    ) : (
                      entry.cover
                    )}
                  </span>
                  {/* page block on the left-hand side, seen while turning */}
                  <span
                    className="absolute top-[3px] bg-[#f4f1ea] dark:bg-[#d9d4c8]"
                    style={{
                      width: coverWidth - 4,
                      height: height - 6,
                      left: (spineWidth - coverWidth) / 2 + 2,
                      transform: `rotateY(-90deg) translateZ(${spineWidth / 2 - 1}px)`,
                    }}
                  />
                </motion.span>
              </motion.button>
            );
          })}
        </div>
        <div aria-hidden className="mx-6 h-px bg-border" />
      </div>

      <div id={captionId} aria-live="polite" className="mx-auto mt-5 max-w-md px-6 text-center">
        {item && (
          <motion.div
            key={item.id}
            initial={reduce ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
          >
            <p className="text-base font-semibold text-foreground">{item.title}</p>
            {item.subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{item.subtitle}</p>}
            {item.meta && <div className="mt-2 text-sm tabular-nums text-foreground">{item.meta}</div>}
          </motion.div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-center gap-3">
        <ShelfArrow dir={-1} label={labels.previous} onClick={() => choose(active - 1)} />
        <span className="min-w-[4.5rem] text-center text-xs tabular-nums text-muted-foreground">
          {active + 1} / {items.length}
        </span>
        <ShelfArrow dir={1} label={labels.next} onClick={() => choose(active + 1)} />
      </div>
    </div>
  );
}

function ShelfArrow({ dir, label, onClick }: { dir: 1 | -1; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d={dir === 1 ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} />
      </svg>
    </button>
  );
}
