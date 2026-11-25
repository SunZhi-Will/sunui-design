"use client";

import {
  AnimatePresence,
  animate,
  motion,
  Reorder,
  useAnimate,
  useDragControls,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
  type Variants,
} from "framer-motion";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export const microInteractions = [
  "like-burst",
  "confetti",
  "success-check",
  "checkbox-draw",
  "toggle-switch",
  "copy-feedback",
  "notification-badge",
  "floating-label",
  "slide-to-confirm",
  "hold-to-confirm",
  "swipe-to-delete",
  "send-plane",
  "password-reveal",
  "clear-input",
  "radio-select",
  "folder-drop",
  "quick-reply",
  "mute-switch",
  "reaction-tray",
  "focus-lock",
  "pin-toggle",
  "list-to-grid",
  "permission-gate",
  "face-scan",
  "crop-frame",
  "sort-handle",
  "resize-frame",
] as const;

export type MicroInteractionId = (typeof microInteractions)[number];

const pop = { type: "spring", stiffness: 520, damping: 18 } as const;
const gentle = { type: "spring", stiffness: 300, damping: 28 } as const;
const snappy = { type: "spring", stiffness: 520, damping: 34 } as const;

// Default particle colours: all derived from theme tokens, so they follow the theme
const themeColors = [
  "var(--sunui-spot, var(--primary))",
  "color-mix(in oklch, var(--sunui-spot, var(--primary)) 55%, var(--background))",
  "var(--foreground)",
  "color-mix(in oklch, var(--sunui-spot, var(--primary)) 60%, var(--foreground))",
  "var(--muted-foreground)",
];

/** Like burst particles: shades of the semantic like colour (--sunui-like, red by default) */
const likeColors = [
  "var(--sunui-like, #dc3d43)",
  "color-mix(in oklch, var(--sunui-like, #dc3d43) 55%, var(--background))",
  "color-mix(in oklch, var(--sunui-like, #dc3d43) 70%, var(--foreground))",
  "var(--muted-foreground)",
];

/** Boolean state shared by controlled and uncontrolled use */
function useToggle(value: boolean | undefined, defaultValue: boolean, onChange?: (next: boolean) => void) {
  const [inner, setInner] = useState(defaultValue);
  const on = value ?? inner;
  const set = useCallback(
    (next: boolean) => {
      if (value === undefined) setInner(next);
      onChange?.(next);
    },
    [value, onChange],
  );
  return [on, set] as const;
}

/* ------------------------------------------------------------------ */
/* like-burst */

export interface LikeBurstProps {
  liked?: boolean;
  defaultLiked?: boolean;
  onChange?: (liked: boolean) => void;
  label?: string;
  /** Particle colours, default follows --sunui-spot (falls back to --primary) */
  colors?: string[];
  className?: string;
}

export function LikeBurst({ liked, defaultLiked = false, onChange, label = "Like", colors = likeColors, className }: LikeBurstProps) {
  const reduce = useReducedMotion() ?? false;
  const [on, setOn] = useToggle(liked, defaultLiked, onChange);
  const [burst, setBurst] = useState(0);

  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      onClick={() => {
        if (!on) setBurst((n) => n + 1);
        setOn(!on);
      }}
      className={cn(
        "relative grid size-12 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        on && "text-[color:var(--sunui-like,#dc3d43)] dark:text-[color:var(--sunui-like,#ff6b70)] hover:text-[color:var(--sunui-like,#dc3d43)] dark:hover:text-[color:var(--sunui-like,#ff6b70)]",
        className,
      )}
    >
      {burst > 0 && !reduce && (
        <span key={burst} aria-hidden="true" className="pointer-events-none absolute inset-0">
          <motion.span
            className="absolute inset-1 rounded-full border-2 border-current"
            initial={{ scale: 0.3, opacity: 0.9 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return (
              <motion.span
                key={i}
                className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: colors[i % colors.length] }}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{ x: Math.cos(a) * 26, y: Math.sin(a) * 26, scale: 0, opacity: [1, 1, 0] }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
              />
            );
          })}
        </span>
      )}
      <motion.svg
        key={on ? `on-${burst}` : "off"}
        viewBox="0 0 24 24"
        className="relative size-6"
        fill={on ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        aria-hidden="true"
        initial={on && !reduce ? { scale: 0.4 } : false}
        animate={{ scale: 1 }}
        transition={pop}
      >
        <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z" />
      </motion.svg>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* confetti */

interface Piece {
  id: number;
  x: number;
  y: number;
  r: number;
  color: string;
  w: number;
  round: boolean;
}

export interface ConfettiBurstProps {
  children?: ReactNode;
  /** Number of particles per burst */
  count?: number;
  colors?: string[];
  onFire?: () => void;
  className?: string;
}

export function ConfettiBurst({ children = "Celebrate", count = 36, colors = themeColors, onFire, className }: ConfettiBurstProps) {
  const reduce = useReducedMotion() ?? false;
  const [bursts, setBursts] = useState<{ id: number; pieces: Piece[] }[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const fire = () => {
    onFire?.();
    if (reduce) return;
    const id = Date.now();
    const pieces: Piece[] = Array.from({ length: count }, (_, i) => {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
      const v = 60 + Math.random() * 90;
      return {
        id: i,
        x: Math.cos(a) * v,
        y: Math.sin(a) * v,
        r: (Math.random() - 0.5) * 720,
        color: colors[i % colors.length],
        w: 5 + Math.random() * 4,
        round: Math.random() > 0.6,
      };
    });
    setBursts((b) => [...b, { id, pieces }]);
    // Remove the DOM nodes after the animation ends
    timers.current.push(setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 1400));
  };

  return (
    <span className={cn("relative inline-flex", className)}>
      <motion.button
        type="button"
        onClick={fire}
        whileTap={reduce ? undefined : { scale: 0.94 }}
        className="relative z-10 inline-flex h-10 items-center rounded-md bg-[color:var(--sunui-spot,var(--primary))] px-5 text-sm font-medium text-[color:var(--sunui-spot-foreground,var(--primary-foreground))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {children}
      </motion.button>
      <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 z-20">
        {bursts.map((b) =>
          b.pieces.map((p) => (
            <motion.span
              key={`${b.id}-${p.id}`}
              className={cn("absolute block", p.round ? "rounded-full" : "rounded-[1px]")}
              style={{ background: p.color, width: p.w, height: p.round ? p.w : p.w * 0.45 }}
              initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
              animate={{ x: [0, p.x, p.x * 1.15], y: [0, p.y, p.y + 110], rotate: p.r, opacity: [1, 1, 0] }}
              transition={{ duration: 1.25, times: [0, 0.35, 1], ease: ["easeOut", "easeIn"] }}
            />
          )),
        )}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* success-check */

export interface SuccessCheckProps {
  message?: ReactNode;
  /** Icon size (px) */
  size?: number;
  delay?: number;
  className?: string;
}

const drawCircle: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  shown: { pathLength: 1, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};
const drawCheck: Variants = {
  hidden: { pathLength: 0 },
  shown: { pathLength: 1, transition: { delay: 0.45, duration: 0.3, ease: "easeOut" } },
};

/** Plays on mount; change key to replay */
export function SuccessCheck({ message = "Payment complete", size = 64, delay = 0, className }: SuccessCheckProps) {
  const reduce = useReducedMotion() ?? false;
  const initial = reduce ? "shown" : "hidden";
  return (
    <div role="status" className={cn("flex flex-col items-center gap-3 text-[color:var(--sunui-success,#1f9d55)] dark:text-[color:var(--sunui-success,#4cd68a)]", className)}>
      <motion.svg
        viewBox="0 0 52 52"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        initial={reduce ? false : { scale: 1 }}
        animate={reduce ? undefined : { scale: [1, 1, 1.12, 1] }}
        transition={{ delay: delay + 0.6, duration: 0.45, times: [0, 0.01, 0.5, 1] }}
      >
        <motion.circle cx="26" cy="26" r="23" variants={drawCircle} initial={initial} animate="shown" transition={{ delay }} />
        <motion.path d="M15 27l7 7 15-16" variants={drawCheck} initial={initial} animate="shown" />
      </motion.svg>
      <motion.p
        className="text-sm font-medium text-foreground"
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.9, duration: 0.35 }}
      >
        {message}
      </motion.p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* checkbox-draw */

export interface AnimatedCheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  label: ReactNode;
  /** Strike through the text when checked, good for to-do lists */
  strike?: boolean;
  className?: string;
}

export function AnimatedCheckbox({ checked, defaultChecked = false, onChange, label, strike = true, className }: AnimatedCheckboxProps) {
  const reduce = useReducedMotion() ?? false;
  const [on, setOn] = useToggle(checked, defaultChecked, onChange);
  const [box, animateBox] = useAnimate<HTMLSpanElement>();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!reduce) void animateBox(box.current, { scale: [1, 0.8, 1.08, 1] }, { duration: 0.35 });
  }, [on, reduce, animateBox, box]);

  return (
    <label className={cn("group inline-flex cursor-pointer select-none items-center gap-3 text-sm", className)}>
      <input type="checkbox" className="peer sr-only" checked={on} onChange={(e) => setOn(e.target.checked)} />
      <span
        ref={box}
        aria-hidden="true"
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-[5px] border-2 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
          on ? "border-[color:var(--sunui-spot,var(--primary))] bg-[color:var(--sunui-spot,var(--primary))] text-[color:var(--sunui-spot-foreground,var(--primary-foreground))]" : "border-border bg-background",
        )}
      >
        <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <motion.path
            d="M3.5 8.5l3 3 6-7"
            initial={false}
            animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.28, ease: "easeOut", delay: on ? 0.08 : 0 }}
          />
        </svg>
      </span>
      <span className={cn("relative transition-colors", on && strike && "text-muted-foreground")}>
        {label}
        {strike && (
          <motion.span
            aria-hidden="true"
            className="absolute left-0 top-1/2 h-px w-full origin-left bg-current"
            initial={false}
            animate={{ scaleX: on ? 1 : 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.3, ease: "easeOut", delay: on ? 0.2 : 0 }}
          />
        )}
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* toggle-switch */

export interface ToggleSwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  label: string;
  /** Whether the text shows alongside; when hidden it is still the accessible name */
  showLabel?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ToggleSwitch({ checked, defaultChecked = false, onChange, label, showLabel = true, disabled, className }: ToggleSwitchProps) {
  const reduce = useReducedMotion() ?? false;
  const [on, setOn] = useToggle(checked, defaultChecked, onChange);
  const [pressed, setPressed] = useState(false);
  const id = useId();

  // While pressed the knob squashes and stretches toward its target side; on release it toggles and springs into the new position
  const squash = pressed && !reduce && !disabled;
  const width = squash ? 26 : 20;
  const press = (e: KeyboardEvent<HTMLButtonElement>, down: boolean) => {
    if ((e.key === " " || e.key === "Enter") && !e.repeat) setPressed(down);
  };

  return (
    <span className={cn("inline-flex items-center gap-3 text-sm", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={showLabel ? undefined : label}
        aria-labelledby={showLabel ? id : undefined}
        disabled={disabled}
        onClick={() => setOn(!on)}
        onPointerDown={(e) => e.button === 0 && setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
        onBlur={() => setPressed(false)}
        onKeyDown={(e) => press(e, true)}
        onKeyUp={(e) => press(e, false)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50",
          on
            ? "bg-[color:var(--sunui-spot,var(--primary))] shadow-[inset_0_1px_2px_rgb(0_0_0/0.14)]"
            : "bg-muted shadow-[inset_0_1px_2px_rgb(0_0_0/0.06)] hover:bg-foreground/10 dark:shadow-[inset_0_1px_2px_rgb(0_0_0/0.3)]",
        )}
      >
        <motion.span
          initial={false}
          animate={{ x: on ? 40 - width : 0, width, scaleY: squash ? 0.9 : 1 }}
          transition={reduce ? { duration: 0 } : snappy}
          className="block h-5 rounded-full bg-background shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_0_0_1px_rgb(255_255_255/0.08)]"
          style={{ width: 20 }}
        />
      </button>
      {showLabel && <span id={id}>{label}</span>}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* copy-feedback */

export interface CopyFeedbackProps {
  text: string;
  label?: string;
  copiedLabel?: string;
  /** How long "Copied" shows (ms) */
  resetAfter?: number;
  onCopy?: (ok: boolean) => void;
  className?: string;
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Use the fallback below
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function CopyFeedback({ text, label = "Copy", copiedLabel = "Copied", resetAfter = 1600, onCopy, className }: CopyFeedbackProps) {
  const reduce = useReducedMotion() ?? false;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), resetAfter);
    return () => clearTimeout(t);
  }, [copied, resetAfter]);

  const icon = reduce ? { initial: false as const, exit: { opacity: 0 } } : undefined;

  return (
    <span className={cn("relative inline-flex", className)}>
      <button
        type="button"
        aria-label={copied ? copiedLabel : label}
        onClick={async () => {
          const ok = await copyText(text);
          onCopy?.(ok);
          if (ok) setCopied(true);
        }}
        className="grid size-9 place-items-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.svg
              key="check"
              viewBox="0 0 16 16"
              className="size-4 text-[color:var(--sunui-spot,var(--primary))]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              initial={icon?.initial ?? { rotate: -180, scale: 0.4, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={icon?.exit ?? { scale: 0.4, opacity: 0 }}
              transition={pop}
            >
              <path d="M3 8.5l3 3 7-7" />
            </motion.svg>
          ) : (
            <motion.svg
              key="copy"
              viewBox="0 0 16 16"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
              aria-hidden="true"
              initial={icon?.initial ?? { scale: 0.4, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={icon?.exit ?? { rotate: 90, scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
              <path d="M10.5 3.5v-.5a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5" />
            </motion.svg>
          )}
        </AnimatePresence>
      </button>
      <AnimatePresence>
        {copied && (
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-full left-1/2 mb-2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background"
            style={{ x: "-50%" }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.6 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduce ? 0 : -4 }}
            transition={reduce ? { duration: 0.15 } : pop}
          >
            {copiedLabel}
          </motion.span>
        )}
      </AnimatePresence>
      <span className="sr-only" aria-live="polite">
        {copied ? copiedLabel : ""}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* notification-badge */

export interface NotificationBadgeProps {
  count: number;
  /** Shows 99+ above this */
  max?: number;
  /** Screen reader label, e.g. "Notifications" */
  label?: string;
  children?: ReactNode;
  className?: string;
}

export function NotificationBadge({ count, max = 99, label = "Notifications", children, className }: NotificationBadgeProps) {
  const reduce = useReducedMotion() ?? false;
  const [prev, setPrev] = useState(count);
  const [ping, setPing] = useState(0);
  const [bump, setBump] = useState(0);
  if (count !== prev) {
    setPrev(count);
    setBump((n) => n + 1);
    if (count > prev) setPing((n) => n + 1);
  }
  const text = count > max ? `${max}+` : String(count);

  return (
    <span className={cn("relative inline-flex", className)}>
      {children}
      <span className="sr-only" aria-live="polite">{`${label}: ${count}`}</span>
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            aria-hidden="true"
            className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center"
            initial={reduce ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            exit={reduce ? { opacity: 0 } : { scale: 0 }}
            transition={pop}
          >
            {ping > 0 && !reduce && (
              <motion.span
                key={ping}
                className="absolute inset-0 rounded-full bg-[color:var(--sunui-spot,var(--primary))]"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            )}
            <motion.span
              key={bump}
              className="relative grid h-5 min-w-5 place-items-center rounded-full bg-[color:var(--sunui-spot,var(--primary))] px-1.5 text-[11px] font-semibold tabular-nums text-[color:var(--sunui-spot-foreground,var(--primary-foreground))] ring-2 ring-background"
              initial={bump > 0 && !reduce ? { scale: 1 } : false}
              animate={bump > 0 && !reduce ? { scale: [1, 1.35, 0.9, 1.06, 1], y: [0, -4, 0, -1, 0] } : undefined}
              transition={{ duration: 0.5 }}
            >
              {text}
            </motion.span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* floating-label */

export interface FloatingLabelInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "defaultValue"> {
  label: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function FloatingLabelInput({ label, value, defaultValue = "", onChange, className, id, onFocus, onBlur, ...rest }: FloatingLabelInputProps) {
  const reduce = useReducedMotion() ?? false;
  const autoId = useId();
  const inputId = id ?? autoId;
  const [inner, setInner] = useState(defaultValue);
  const [focused, setFocused] = useState(false);
  const current = value ?? inner;
  const floated = focused || current.length > 0;
  const t = reduce ? { duration: 0 } : gentle;

  return (
    <div className={cn("relative w-full pt-4", className)}>
      <input
        {...rest}
        id={inputId}
        value={current}
        onChange={(e) => {
          if (value === undefined) setInner(e.target.value);
          onChange?.(e.target.value);
        }}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        className="peer h-10 w-full border-0 border-b border-border bg-transparent px-0 text-sm text-foreground outline-none"
      />
      <motion.label
        htmlFor={inputId}
        className={cn("pointer-events-none absolute left-0 top-6 origin-left text-sm", floated ? "text-foreground" : "text-muted-foreground")}
        initial={false}
        animate={{ y: floated ? -22 : 0, scale: floated ? 0.8 : 1 }}
        transition={t}
      >
        {label}
      </motion.label>
      <motion.span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-0.5 origin-center bg-[color:var(--sunui-spot,var(--primary))]"
        initial={false}
        animate={{ scaleX: focused ? 1 : 0 }}
        transition={reduce ? { duration: 0 } : { duration: 0.3, ease: "easeOut" }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* slide-to-confirm */

export interface SlideToConfirmProps {
  label?: string;
  confirmedLabel?: string;
  onConfirm?: () => void;
  /** Auto reset this long after confirm (ms); if omitted it stays done */
  resetAfter?: number;
  className?: string;
}

const KNOB = 40;
const PAD = 4;

export function SlideToConfirm({ label = "Slide to confirm", confirmedLabel = "Confirmed", onConfirm, resetAfter, className }: SlideToConfirmProps) {
  const reduce = useReducedMotion() ?? false;
  const track = useRef<HTMLDivElement>(null);
  const [max, setMax] = useState(0);
  const [done, setDone] = useState(false);
  const x = useMotionValue(0);
  const labelOpacity = useTransform(x, (v) => (max > 0 ? Math.max(0, 1 - (v / max) * 1.6) : 1));
  const fill = useTransform(x, (v) => v + KNOB + PAD);

  useLayoutEffect(() => {
    const el = track.current;
    if (!el) return;
    const measure = () => setMax(Math.max(0, el.clientWidth - KNOB - PAD * 2));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!done || resetAfter === undefined) return;
    const t = setTimeout(() => {
      setDone(false);
      if (reduce) x.set(0);
      else animate(x, 0, gentle);
    }, resetAfter);
    return () => clearTimeout(t);
  }, [done, resetAfter, reduce, x]);

  const confirm = () => {
    if (done) return;
    setDone(true);
    if (reduce) x.set(max);
    else animate(x, max, gentle);
    onConfirm?.();
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (x.get() >= max * 0.9 || info.velocity.x > 900) confirm();
    else if (reduce) x.set(0);
    else animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      confirm();
    }
  };

  return (
    <div
      ref={track}
      className={cn("relative h-12 w-full max-w-xs select-none overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-border", className)}
    >
      <motion.div aria-hidden="true" className="absolute inset-y-0 left-0 rounded-full bg-[color:color-mix(in_oklch,var(--sunui-spot,var(--primary))_20%,transparent)]" style={{ width: fill }} />
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 grid place-items-center pl-10 text-sm font-medium text-muted-foreground"
        style={{ opacity: done ? 0 : labelOpacity }}
      >
        {label}
      </motion.span>
      <AnimatePresence>
        {done && (
          <motion.span
            className="absolute inset-0 grid place-items-center pr-10 text-sm font-medium text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {confirmedLabel}
          </motion.span>
        )}
      </AnimatePresence>
      <span className="sr-only" aria-live="polite">
        {done ? confirmedLabel : ""}
      </span>
      <motion.button
        type="button"
        aria-label={label}
        aria-disabled={done}
        drag={done ? false : "x"}
        dragConstraints={{ left: 0, right: max }}
        dragElastic={0.04}
        dragMomentum={false}
        onDragEnd={onDragEnd}
        onKeyDown={onKeyDown}
        style={{ x, width: KNOB, height: KNOB, top: PAD, left: PAD }}
        className="absolute grid cursor-grab touch-none place-items-center rounded-full bg-[color:var(--sunui-spot,var(--primary))] text-[color:var(--sunui-spot-foreground,var(--primary-foreground))] shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:cursor-grabbing"
      >
        <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={done ? "M3 8.5l3 3 7-7" : "M6 3.5 10.5 8 6 12.5"} />
        </svg>
      </motion.button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* hold-to-confirm */

export interface HoldToConfirmProps {
  label?: string;
  doneLabel?: string;
  /** How long to hold (seconds) */
  duration?: number;
  onConfirm?: () => void;
  resetAfter?: number;
  className?: string;
}

export function HoldToConfirm({ label = "Hold to delete", doneLabel = "Deleted", duration = 1.2, onConfirm, resetAfter = 1800, className }: HoldToConfirmProps) {
  const progress = useMotionValue(0);
  const [done, setDone] = useState(false);
  const holding = useRef<ReturnType<typeof animate> | null>(null);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => {
      setDone(false);
      animate(progress, 0, { duration: 0.3 });
    }, resetAfter);
    return () => clearTimeout(t);
  }, [done, resetAfter, progress]);

  useEffect(() => () => holding.current?.stop(), []);

  const start = () => {
    if (done) return;
    holding.current?.stop();
    // Progress is information, so the linear fill stays with reduced motion
    holding.current = animate(progress, 1, {
      duration: duration * (1 - progress.get()),
      ease: "linear",
      onComplete: () => {
        setDone(true);
        onConfirm?.();
      },
    });
  };
  const cancel = () => {
    if (done || progress.get() >= 1) return;
    holding.current?.stop();
    holding.current = animate(progress, 0, { duration: 0.3, ease: "easeOut" });
  };

  return (
    <button
      type="button"
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) {
          e.preventDefault();
          start();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === " " || e.key === "Enter") cancel();
      }}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        "relative inline-flex h-10 select-none items-center overflow-hidden rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground touch-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      <motion.span aria-hidden="true" className="absolute inset-0 origin-left bg-destructive/15" style={{ scaleX: progress }} />
      <span className="relative inline-flex items-center gap-2">
        <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {done ? <path d="M3 8.5l3 3 7-7" /> : <path d="M2.5 4.5h11M6 4.5V3h4v1.5M4 4.5l.7 8.5h6.6l.7-8.5" />}
        </svg>
        {done ? doneLabel : label}
      </span>
      <span className="sr-only" aria-live="polite">
        {done ? doneLabel : ""}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* swipe-to-delete */

export interface SwipeToDeleteProps {
  children: ReactNode;
  onDelete: () => void;
  deleteLabel?: string;
  className?: string;
}

const REVEAL = 80;

/** A list row: swipe left to reveal delete, swipe all the way to delete and collapse the height */
export function SwipeToDelete({ children, onDelete, deleteLabel = "Delete", className }: SwipeToDeleteProps) {
  const reduce = useReducedMotion() ?? false;
  const [scope, animateRow] = useAnimate<HTMLDivElement>();
  const row = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const removing = useRef(false);

  const remove = async () => {
    if (removing.current) return;
    removing.current = true;
    const width = row.current?.offsetWidth ?? 320;
    if (reduce) {
      onDelete();
      return;
    }
    await animate(x, -width, { duration: 0.2, ease: "easeIn" });
    await animateRow(scope.current, { height: 0, opacity: 0 }, { duration: 0.25, ease: "easeInOut" });
    onDelete();
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const width = row.current?.offsetWidth ?? 320;
    if (x.get() < -width * 0.55 || info.velocity.x < -900) void remove();
    else if (x.get() < -REVEAL / 2) animate(x, -REVEAL, gentle);
    else animate(x, 0, gentle);
  };

  return (
    <div ref={scope} className={cn("overflow-hidden", className)}>
      <div className="relative">
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => void remove()}
          className="absolute inset-y-0 right-0 flex w-full items-center justify-end bg-destructive pr-6 text-sm font-medium text-background"
        >
          {deleteLabel}
        </button>
        <motion.div
          ref={row}
          drag="x"
          dragConstraints={{ left: -9999, right: 0 }}
          dragElastic={{ left: 0.9, right: 0.05 }}
          dragMomentum={false}
          onDragEnd={onDragEnd}
          style={{ x }}
          className="relative flex touch-pan-y items-center gap-3 bg-card px-4 py-3 text-sm text-card-foreground"
        >
          <div className="min-w-0 flex-1">{children}</div>
          <button
            type="button"
            aria-label={deleteLabel}
            onClick={() => void remove()}
            className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2.5 4.5h11M6 4.5V3h4v1.5M4 4.5l.7 8.5h6.6l.7-8.5" />
            </svg>
          </button>
        </motion.div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* send-plane */

export interface SendPlaneButtonProps {
  label?: string;
  sentLabel?: string;
  onSend?: () => void;
  resetAfter?: number;
  className?: string;
}

export function SendPlaneButton({ label = "Send", sentLabel = "Sent", onSend, resetAfter = 2000, className }: SendPlaneButtonProps) {
  const reduce = useReducedMotion() ?? false;
  const [phase, setPhase] = useState<"idle" | "flying" | "sent">("idle");
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (phase !== "sent") return;
    const t = setTimeout(() => {
      setPhase("idle");
      setRound((n) => n + 1);
    }, resetAfter);
    return () => clearTimeout(t);
  }, [phase, resetAfter]);

  return (
    <button
      type="button"
      disabled={phase !== "idle"}
      onClick={() => {
        onSend?.();
        setPhase(reduce ? "sent" : "flying");
      }}
      className={cn(
        "relative inline-flex h-10 min-w-28 items-center justify-center gap-2 rounded-md bg-[color:var(--sunui-spot,var(--primary))] px-5 text-sm font-medium text-[color:var(--sunui-spot-foreground,var(--primary-foreground))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-default",
        className,
      )}
    >
      {phase === "sent" ? (
        <motion.svg
          key="check"
          viewBox="0 0 16 16"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <motion.path d="M3 8.5l3 3 7-7" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3 }} />
        </motion.svg>
      ) : (
        <motion.svg
          key={`plane-${round}`}
          viewBox="0 0 16 16"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          aria-hidden="true"
          initial={round > 0 && !reduce ? { x: -14, opacity: 0 } : false}
          animate={
            phase === "flying"
              ? { x: [0, -3, 90], y: [0, 2, -46], rotate: [0, -8, -24], scale: [1, 1, 0.6], opacity: [1, 1, 0] }
              : { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }
          }
          transition={phase === "flying" ? { duration: 0.7, times: [0, 0.2, 1], ease: "easeIn" } : gentle}
          onAnimationComplete={() => {
            if (phase === "flying") setPhase("sent");
          }}
        >
          <path d="M14.5 1.5 1.5 7l5 2 2 5 6-12.5ZM6.5 9l3-3" />
        </motion.svg>
      )}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={phase === "sent" ? "sent" : "send"}
          initial={reduce ? false : { y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { y: -8, opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {phase === "sent" ? sentLabel : label}
        </motion.span>
      </AnimatePresence>
      <span className="sr-only" aria-live="polite">
        {phase === "sent" ? sentLabel : ""}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* password-reveal */

export interface PasswordToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  showLabel?: string;
  hideLabel?: string;
  className?: string;
}

export function PasswordToggle({ label = "Password", showLabel = "Show password", hideLabel = "Hide password", className, id, ...rest }: PasswordToggleProps) {
  const reduce = useReducedMotion() ?? false;
  const [visible, setVisible] = useState(false);
  const autoId = useId();
  const inputId = id ?? autoId;
  const t = reduce ? { duration: 0 } : { duration: 0.25, ease: "easeInOut" as const };

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          {...rest}
          id={inputId}
          type={visible ? "text" : "password"}
          autoComplete={rest.autoComplete ?? "current-password"}
          className="h-10 w-full rounded-md border border-border bg-background pl-3 pr-11 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="button"
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          aria-controls={inputId}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-1 top-1 grid size-8 place-items-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {/* When the eye closes the eye shape flattens, the pupil hides, then a slash is drawn */}
            <motion.g initial={false} animate={{ scaleY: visible ? 1 : 0.18 }} transition={t} style={{ originX: "50%", originY: "50%" }}>
              <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
            </motion.g>
            <motion.circle cx="12" cy="12" r="3" initial={false} animate={{ scale: visible ? 1 : 0, opacity: visible ? 1 : 0 }} transition={t} style={{ originX: "50%", originY: "50%" }} />
            <motion.path d="M4 4l16 16" initial={false} animate={{ pathLength: visible ? 0 : 1, opacity: visible ? 0 : 1 }} transition={t} />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Everyday moments (added 2026-11-26): small controls that answer a press, a type or a drag */

const ring = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const spotBg = "bg-[color:var(--sunui-spot,var(--primary))] text-[color:var(--sunui-spot-foreground,var(--primary-foreground))]";
const press = { scale: 0.97 };
const instant = { duration: 0 } as const;

/** Pick the spring, or switch instantly under reduced motion */
function useSpring(spring: object) {
  const reduce = useReducedMotion() ?? false;
  return reduce ? instant : spring;
}

/** A finished action that resets itself after a pause */
function useTimedFlag(ms: number) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!on) return;
    const id = window.setTimeout(() => setOn(false), ms);
    return () => window.clearTimeout(id);
  }, [on, ms]);
  return [on, () => setOn(true)] as const;
}

/* ---- Clear input: the clear button pops in once there is text, the old text slides out ---- */

export interface ClearInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange"> {
  label: string;
  defaultValue?: string;
  clearLabel?: string;
  onValueChange?: (value: string) => void;
}

export function ClearInput({ label, defaultValue = "", clearLabel = "Clear", onValueChange, className, ...rest }: ClearInputProps) {
  const [value, setValue] = useState(defaultValue);
  const [ghost, setGhost] = useState<{ text: string; key: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const t = useSpring(snappy);
  const change = (v: string) => {
    setValue(v);
    onValueChange?.(v);
  };
  return (
    <div className={cn("w-full max-w-60", className)}>
      <label htmlFor={id} className="mb-1.5 block text-xs text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          {...rest}
          ref={inputRef}
          id={id}
          value={value}
          onChange={(e) => change(e.target.value)}
          className="h-10 w-full rounded-md border border-border bg-background pl-3 pr-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {/* The cleared text leaves to the left so the empty field reads as an action, not a glitch */}
        <AnimatePresence>
          {ghost && (
            <motion.span
              key={ghost.key}
              aria-hidden
              initial={{ x: 0, opacity: 1 }}
              animate={{ x: -14, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              onAnimationComplete={() => setGhost(null)}
              className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm"
            >
              {ghost.text}
            </motion.span>
          )}
        </AnimatePresence>
        <AnimatePresence initial={false}>
          {value && (
            <motion.button
              type="button"
              aria-label={clearLabel}
              aria-controls={id}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              whileTap={press}
              transition={t}
              onClick={() => {
                setGhost({ text: value, key: Date.now() });
                change("");
                inputRef.current?.focus();
              }}
              className={cn("absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-muted text-muted-foreground hover:text-foreground", ring)}
            >
              <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ---- Radio select: one dot travels between the rings instead of two dots fading ---- */

export interface RadioSelectProps {
  label: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function RadioSelect({ label, options, defaultValue, onValueChange, className }: RadioSelectProps) {
  const [value, setValue] = useState(defaultValue ?? options[0]?.value);
  const name = useId();
  const t = useSpring(snappy);
  return (
    <fieldset className={cn("flex flex-col gap-2.5", className)}>
      <legend className="mb-2 text-xs text-muted-foreground">{label}</legend>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <label key={o.value} className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={on}
              onChange={() => {
                setValue(o.value);
                onValueChange?.(o.value);
              }}
              className="peer sr-only"
            />
            <span
              className={cn(
                "relative grid size-5 place-items-center rounded-full border-2 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
                on ? "border-[color:var(--sunui-spot,var(--primary))]" : "border-border",
              )}
            >
              {on && <motion.span layoutId={`${name}-dot`} transition={t} className="size-2.5 rounded-full bg-[color:var(--sunui-spot,var(--primary))]" />}
            </span>
            <span className={on ? "text-foreground" : "text-muted-foreground"}>{o.label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}

/* ---- Folder drop: the file drops behind the front flap, the flap answers with a check ---- */

export interface FolderDropProps {
  label?: string;
  doneLabel?: string;
  onDrop?: () => void;
  className?: string;
}

export function FolderDrop({ label = "Save to folder", doneLabel = "Saved", onDrop, className }: FolderDropProps) {
  const [done, fire] = useTimedFlag(2200);
  const reduce = useReducedMotion() ?? false;
  const t = useSpring(gentle);
  return (
    <motion.button
      type="button"
      whileTap={press}
      transition={snappy}
      onClick={() => {
        if (done) return;
        fire();
        onDrop?.();
      }}
      aria-label={done ? doneLabel : label}
      className={cn("flex flex-col items-center gap-3 rounded-md p-2", ring, className)}
    >
      <span aria-hidden className="relative block h-16 w-20">
        {/* Back of the folder with its tab */}
        <span className="absolute inset-x-0 bottom-0 h-12 rounded-md bg-[color:color-mix(in_oklch,var(--foreground)_22%,var(--card))]" />
        <span className="absolute left-0 top-2 h-3 w-8 rounded-t-md bg-[color:color-mix(in_oklch,var(--foreground)_22%,var(--card))]" />
        {/* The document: sits above, then drops in */}
        <motion.span
          initial={false}
          animate={done ? { y: 18, rotate: 0 } : { y: -2, rotate: -6 }}
          transition={reduce ? instant : { type: "spring", stiffness: 380, damping: 22 }}
          className="absolute left-5 top-0 grid h-11 w-9 place-items-start rounded-[4px] border border-border bg-background p-1.5 shadow-sm"
        >
          <span className="block h-1 w-4 rounded-full bg-muted-foreground/40" />
          <span className="block h-1 w-5 rounded-full bg-muted-foreground/25" />
        </motion.span>
        {/* Front flap: dips when the file lands */}
        <motion.span
          initial={false}
          animate={done ? { rotateX: [0, 18, 0] } : { rotateX: 0 }}
          transition={reduce ? instant : { duration: 0.36, times: [0, 0.4, 1] }}
          style={{ transformOrigin: "50% 100%", transformPerspective: 300 }}
          className="absolute inset-x-0 bottom-0 grid h-9 place-items-center rounded-md border-t border-white/30 bg-[color:color-mix(in_oklch,var(--foreground)_10%,var(--card))] shadow-[0_-1px_0_rgb(0_0_0/0.06)]"
        >
          <svg viewBox="0 0 16 16" className="size-4 text-[color:var(--sunui-spot,var(--primary))]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <motion.path d="M3.5 8.5l3 3 6-6.5" initial={false} animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }} transition={done ? { ...t, delay: reduce ? 0 : 0.18 } : instant} />
          </svg>
        </motion.span>
      </span>
      <span className="text-xs text-muted-foreground" aria-live="polite">
        {done ? doneLabel : label}
      </span>
    </motion.button>
  );
}

/* ---- Quick reply: a suggestion lifts out of its row and lands in the field ---- */

export interface QuickReplyProps {
  suggestions: string[];
  placeholder?: string;
  sendLabel?: string;
  onSend?: (text: string) => void;
  className?: string;
}

export function QuickReply({ suggestions, placeholder = "Reply…", sendLabel = "Send", onSend, className }: QuickReplyProps) {
  const [text, setText] = useState("");
  const [picked, setPicked] = useState<number | null>(null);
  const base = useId();
  const t = useSpring(gentle);
  const send = () => {
    if (!text.trim()) return;
    onSend?.(text);
    setText("");
    setPicked(null);
  };
  return (
    <div className={cn("flex w-full max-w-64 flex-col gap-2", className)}>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((s, i) =>
          picked === i ? (
            <span key={s} className="h-7 rounded-full px-3 text-xs opacity-0" aria-hidden>
              {s}
            </span>
          ) : (
            <motion.button
              key={s}
              type="button"
              layoutId={`${base}-${i}`}
              transition={t}
              whileTap={press}
              onClick={() => {
                setPicked(i);
                setText(s);
              }}
              className={cn("h-7 rounded-full border border-border bg-background px-3 text-xs hover:bg-muted", ring)}
            >
              {s}
            </motion.button>
          ),
        )}
      </div>
      <form
        className="relative"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          aria-label={placeholder}
          placeholder={picked === null ? placeholder : ""}
          value={picked === null ? text : ""}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => {
            // Typing takes over: the landed chip becomes plain editable text
            if (picked !== null) setPicked(null);
          }}
          className="h-10 w-full rounded-full border border-border bg-background pl-3 pr-11 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {picked !== null && (
          <motion.span layoutId={`${base}-${picked}`} transition={t} className="pointer-events-none absolute left-1.5 top-1.5 flex h-7 items-center rounded-full bg-muted px-3 text-xs">
            {text}
          </motion.span>
        )}
        <motion.button
          type="submit"
          aria-label={sendLabel}
          disabled={!text.trim()}
          whileTap={press}
          transition={snappy}
          className={cn("absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full transition-colors disabled:bg-muted disabled:text-muted-foreground", spotBg, ring)}
        >
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 13V3M3.5 7.5L8 3l4.5 4.5" />
          </svg>
        </motion.button>
      </form>
    </div>
  );
}

/* ---- Mute switch: the knob carries the mic across, a slash draws on arrival ---- */

export interface MuteSwitchProps {
  label?: string;
  muted?: boolean;
  defaultMuted?: boolean;
  onMutedChange?: (muted: boolean) => void;
  className?: string;
}

export function MuteSwitch({ label = "Mute microphone", muted, defaultMuted = false, onMutedChange, className }: MuteSwitchProps) {
  const [on, set] = useToggle(muted, defaultMuted, onMutedChange);
  const t = useSpring(snappy);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => set(!on)}
      className={cn(
        "relative inline-flex h-9 w-[4.25rem] shrink-0 items-center rounded-full p-1 transition-colors motion-safe:active:scale-[0.97] [transition-property:background-color,scale]",
        on ? "bg-foreground" : "bg-muted",
        ring,
        className,
      )}
    >
      <motion.span
        initial={false}
        animate={{ x: on ? 32 : 0 }}
        transition={t}
        className={cn("grid size-7 place-items-center rounded-full shadow-sm", on ? "bg-background text-foreground" : "bg-background text-muted-foreground")}
      >
        <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <rect x="6" y="2" width="4" height="7.5" rx="2" />
          <path d="M3.8 8a4.2 4.2 0 0 0 8.4 0M8 12.2V14" />
          <motion.path d="M2.5 2.5l11 11" initial={false} animate={{ pathLength: on ? 1 : 0 }} transition={on ? { ...t, delay: 0.08 } : instant} />
        </svg>
      </motion.span>
    </button>
  );
}

/* ---- Reaction tray: one button opens into a row of reactions, the choice settles back in ---- */

const reactionIcons: Record<string, ReactNode> = {
  heart: <path d="M8 13.5S2.5 10.2 2.5 6.3A2.8 2.8 0 0 1 8 5a2.8 2.8 0 0 1 5.5 1.3C13.5 10.2 8 13.5 8 13.5Z" />,
  like: <path d="M5 13.5V7l3-4.5c1 0 1.5.7 1.3 1.6L9 6.5h3.4a1 1 0 0 1 1 1.2l-1 4.8a1 1 0 0 1-1 .8H5ZM5 7H2.5v6.5H5" />,
  smile: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M5.8 9.4a2.6 2.6 0 0 0 4.4 0M6 6.4h.01M10 6.4h.01" />
    </>
  ),
  spark: <path d="M8 2.5l1.3 4.2 4.2 1.3-4.2 1.3L8 13.5l-1.3-4.2L2.5 8l4.2-1.3L8 2.5Z" />,
};
export type ReactionId = keyof typeof reactionIcons;

export interface ReactionTrayProps {
  /** Reaction id and the label read out for it */
  reactions?: { id: ReactionId; label: string }[];
  label?: string;
  onReact?: (id: ReactionId | null) => void;
  className?: string;
}

const defaultReactions: { id: ReactionId; label: string }[] = [
  { id: "heart", label: "Love" },
  { id: "like", label: "Like" },
  { id: "smile", label: "Smile" },
  { id: "spark", label: "Brilliant" },
];

function ReactionIcon({ id }: { id: ReactionId }) {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {reactionIcons[id]}
    </svg>
  );
}

export function ReactionTray({ reactions = defaultReactions, label = "React", onReact, className }: ReactionTrayProps) {
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<ReactionId | null>(null);
  const reduce = useReducedMotion() ?? false;
  const t = useSpring(gentle);
  const trayId = useId();
  const pick = (id: ReactionId) => {
    const next = chosen === id ? null : id;
    setChosen(next);
    setOpen(false);
    onReact?.(next);
  };
  return (
    <div
      className={cn("relative inline-flex items-center", className)}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <div className="flex items-center rounded-full border border-border bg-card p-1 shadow-sm">
        <motion.button
          type="button"
          aria-expanded={open}
          aria-controls={trayId}
          aria-label={chosen ? `${label}: ${reactions.find((r) => r.id === chosen)?.label}` : label}
          whileTap={press}
          onClick={() => setOpen((o) => !o)}
          className={cn("grid size-9 place-items-center rounded-full transition-colors", chosen ? spotBg : "text-muted-foreground hover:text-foreground", ring)}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={chosen ?? "none"}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={reduce ? instant : pop}
              className="grid place-items-center"
            >
              <ReactionIcon id={chosen ?? "smile"} />
            </motion.span>
          </AnimatePresence>
        </motion.button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id={trayId}
              role="group"
              aria-label={label}
              initial={{ width: 0 }}
              animate={{ width: "auto" }}
              exit={{ width: 0 }}
              transition={t}
              className="flex items-center gap-1 overflow-hidden pl-1"
            >
              {reactions.map((r, i) => (
                <motion.button
                  key={r.id}
                  type="button"
                  aria-label={r.label}
                  aria-pressed={chosen === r.id}
                  initial={{ opacity: 0, scale: 0.7, x: -8 }}
                  animate={{ opacity: 1, scale: 1, x: 0, transition: reduce ? instant : { ...snappy, delay: i * 0.035 } }}
                  exit={{ opacity: 0, scale: 0.7, transition: { duration: reduce ? 0 : 0.1 } }}
                  whileTap={press}
                  onClick={() => pick(r.id)}
                  className={cn("grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground", ring)}
                >
                  <ReactionIcon id={r.id} />
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ---- Focus lock: the shackle swings open on its hinge, drops and settles to lock ---- */

export interface FocusLockProps {
  locked?: boolean;
  defaultLocked?: boolean;
  onLockedChange?: (locked: boolean) => void;
  lockLabel?: string;
  unlockLabel?: string;
  className?: string;
}

export function FocusLock({ locked, defaultLocked = false, onLockedChange, lockLabel = "Lock", unlockLabel = "Unlock", className }: FocusLockProps) {
  const [on, set] = useToggle(locked, defaultLocked, onLockedChange);
  const reduce = useReducedMotion() ?? false;
  return (
    <motion.button
      type="button"
      aria-pressed={on}
      aria-label={on ? unlockLabel : lockLabel}
      whileTap={press}
      transition={snappy}
      onClick={() => set(!on)}
      className={cn("flex flex-col items-center gap-2 rounded-md p-2", ring, className)}
    >
      <svg viewBox="0 0 48 56" className="h-14 w-12" aria-hidden="true">
        {/* Shackle pivots on its right leg, like a real padlock */}
        <motion.path
          d="M14 26V16a10 10 0 0 1 20 0v10"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="text-muted-foreground"
          initial={false}
          animate={on ? { y: 0, rotate: 0 } : { y: -6, rotate: -28 }}
          transition={reduce ? instant : on ? pop : gentle}
          style={{ originX: 1, originY: 1 }}
        />
        <rect x="6" y="24" width="36" height="28" rx="7" className={on ? "fill-[color:var(--sunui-spot,var(--primary))]" : "fill-[color:color-mix(in_oklch,var(--foreground)_14%,var(--card))]"} style={{ transition: "fill 200ms" }} />
        <rect x="6.5" y="24.5" width="35" height="27" rx="6.5" fill="none" stroke="white" strokeOpacity="0.28" />
        <path d="M24 35v5" stroke={on ? "var(--sunui-spot-foreground, var(--primary-foreground))" : "currentColor"} strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="text-xs text-muted-foreground">{on ? unlockLabel : lockLabel}</span>
    </motion.button>
  );
}

/* ---- Pin toggle: the pin straightens and presses in; unpinning tips it back ---- */

export interface PinToggleProps {
  pinned?: boolean;
  defaultPinned?: boolean;
  onPinnedChange?: (pinned: boolean) => void;
  label?: string;
  className?: string;
}

export function PinToggle({ pinned, defaultPinned = false, onPinnedChange, label = "Pin", className }: PinToggleProps) {
  const [on, set] = useToggle(pinned, defaultPinned, onPinnedChange);
  const reduce = useReducedMotion() ?? false;
  return (
    <motion.button
      type="button"
      aria-pressed={on}
      aria-label={label}
      whileTap={press}
      transition={snappy}
      onClick={() => set(!on)}
      className={cn(
        "grid size-14 place-items-center rounded-xl border transition-colors",
        on ? cn("border-transparent shadow-[inset_0_1px_0_rgb(255_255_255/0.35),inset_0_-1px_0_rgb(0_0_0/0.18)]", spotBg) : "border-border bg-card text-muted-foreground hover:text-foreground shadow-sm",
        ring,
        className,
      )}
    >
      <motion.svg
        viewBox="0 0 16 16"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        initial={false}
        animate={on ? { rotate: 0, y: [0, 2, 0] } : { rotate: 40, y: 0 }}
        transition={reduce ? instant : on ? { rotate: pop, y: { duration: 0.28, times: [0, 0.45, 1] } } : gentle}
      >
        <path d="M6 2.5h4M6.8 2.5v3.8L4.5 9h7L9.2 6.3V2.5M8 9v4.5" />
      </motion.svg>
    </motion.button>
  );
}

/* ---- List to grid: the same items change layout, each one travels to its new place ---- */

export interface ListToGridProps {
  items: string[];
  listLabel?: string;
  gridLabel?: string;
  label?: string;
  className?: string;
}

export function ListToGrid({ items, listLabel = "List", gridLabel = "Grid", label = "Layout", className }: ListToGridProps) {
  const [grid, setGrid] = useState(false);
  const base = useId();
  const t = useSpring(gentle);
  const views = [
    { on: !grid, label: listLabel, icon: "M3 4h10M3 8h10M3 12h10", set: () => setGrid(false) },
    { on: grid, label: gridLabel, icon: "M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z", set: () => setGrid(true) },
  ];
  return (
    <div className={cn("flex w-full max-w-56 flex-col gap-3", className)}>
      <div role="radiogroup" aria-label={label} className="flex self-end rounded-full bg-muted p-0.5">
        {views.map((v) => (
          <button
            key={v.label}
            type="button"
            role="radio"
            aria-checked={v.on}
            aria-label={v.label}
            onClick={v.set}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                setGrid((g) => !g);
              }
            }}
            tabIndex={v.on ? 0 : -1}
            className={cn("relative grid h-7 w-9 place-items-center rounded-full", v.on ? "text-foreground" : "text-muted-foreground", ring)}
          >
            {v.on && <motion.span layoutId={`${base}-pill`} transition={t} className="absolute inset-0 rounded-full bg-background shadow-sm" />}
            <svg viewBox="0 0 16 16" className="relative size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <path d={v.icon} />
            </svg>
          </button>
        ))}
      </div>
      <ul className={cn("grid gap-1.5", grid ? "grid-cols-2" : "grid-cols-1")}>
        {items.map((it, i) => (
          <motion.li
            key={it}
            layout
            transition={reduce0(t, i)}
            className={cn("flex rounded-md border border-border bg-card text-xs", grid ? "h-14 flex-col justify-end p-2" : "h-8 items-center gap-2 px-2.5")}
          >
            <motion.span layout="position" transition={t} className={cn("shrink-0 rounded-sm bg-muted", grid ? "mb-auto h-4 w-6" : "size-3.5")} />
            <motion.span layout="position" transition={t} className="truncate">
              {it}
            </motion.span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

/** Stagger each item a little so the reflow reads as a ripple, not one block jump */
function reduce0(t: object, i: number) {
  return "duration" in t ? t : { ...t, delay: i * 0.02 };
}

/* ---- Permission gate: the lock inside the shield turns into a check when access is granted ---- */

export interface PermissionGateProps {
  granted?: boolean;
  defaultGranted?: boolean;
  onGrantedChange?: (granted: boolean) => void;
  label?: string;
  grantedLabel?: string;
  className?: string;
}

export function PermissionGate({ granted, defaultGranted = false, onGrantedChange, label = "Allow access", grantedLabel = "Access allowed", className }: PermissionGateProps) {
  const [on, set] = useToggle(granted, defaultGranted, onGrantedChange);
  const reduce = useReducedMotion() ?? false;
  const t = reduce ? instant : gentle;
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <svg viewBox="0 0 48 56" className="h-16 w-14" aria-hidden="true">
        <path
          d="M24 3l18 7v14c0 13-8 23-18 28C14 47 6 37 6 24V10l18-7Z"
          className={on ? "fill-[color:var(--sunui-spot,var(--primary))]" : "fill-[color:color-mix(in_oklch,var(--foreground)_10%,var(--card))]"}
          stroke={on ? "transparent" : "var(--border)"}
          style={{ transition: "fill 220ms" }}
        />
        <motion.g initial={false} animate={{ scale: on ? 0.6 : 1, opacity: on ? 0 : 1 }} transition={on ? { duration: reduce ? 0 : 0.12 } : { ...t, delay: reduce ? 0 : 0.1 }} style={{ originX: "24px", originY: "28px" }} className="text-muted-foreground">
          <path d="M19 26v-3.5a5 5 0 0 1 10 0V26" fill="none" stroke="currentColor" strokeWidth="2.5" />
          <rect x="16.5" y="25" width="15" height="11" rx="2.5" fill="currentColor" />
        </motion.g>
        <motion.path
          d="M17 28.5l5 5 9-10"
          fill="none"
          stroke="var(--sunui-spot-foreground, var(--primary-foreground))"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
          transition={on ? { ...t, delay: reduce ? 0 : 0.12 } : { duration: reduce ? 0 : 0.1 }}
        />
      </svg>
      <motion.button
        type="button"
        aria-pressed={on}
        whileTap={press}
        transition={snappy}
        onClick={() => set(!on)}
        className={cn("h-8 rounded-md border border-border bg-background px-3 text-xs hover:bg-muted", ring)}
      >
        <span aria-live="polite">{on ? grantedLabel : label}</span>
      </motion.button>
    </div>
  );
}

/* ---- Face scan: a line sweeps the frame, the face draws in, the corners close on the result ---- */

export interface FaceScanProps {
  label?: string;
  scanningLabel?: string;
  doneLabel?: string;
  onDone?: () => void;
  className?: string;
}

export function FaceScan({ label = "Scan face", scanningLabel = "Scanning", doneLabel = "Verified", onDone, className }: FaceScanProps) {
  const [phase, setPhase] = useState<"idle" | "scan" | "done">("idle");
  const reduce = useReducedMotion() ?? false;
  useEffect(() => {
    if (phase === "scan") {
      const id = window.setTimeout(() => {
        setPhase("done");
        onDone?.();
      }, reduce ? 300 : 1400);
      return () => window.clearTimeout(id);
    }
    if (phase === "done") {
      const id = window.setTimeout(() => setPhase("idle"), 2600);
      return () => window.clearTimeout(id);
    }
  }, [phase, reduce, onDone]);
  const inset = phase === "done" ? 10 : 2;
  const t = reduce ? instant : gentle;
  return (
    <motion.button
      type="button"
      whileTap={press}
      transition={snappy}
      disabled={phase !== "idle"}
      onClick={() => setPhase("scan")}
      className={cn("flex flex-col items-center gap-3 rounded-md p-2 disabled:cursor-default", ring, className)}
    >
      <span aria-hidden className="relative block size-20 overflow-hidden rounded-xl bg-[color:color-mix(in_oklch,var(--foreground)_8%,var(--card))]">
        {/* Corner brackets: close in when verified */}
        {(["left-0 top-0 border-l-2 border-t-2 rounded-tl-md", "right-0 top-0 border-r-2 border-t-2 rounded-tr-md", "left-0 bottom-0 border-l-2 border-b-2 rounded-bl-md", "right-0 bottom-0 border-r-2 border-b-2 rounded-br-md"] as const).map((c, i) => (
          <motion.span
            key={c}
            initial={false}
            animate={{ x: (i % 2 ? -1 : 1) * inset, y: (i < 2 ? 1 : -1) * inset }}
            transition={phase === "done" && !reduce ? pop : t}
            className={cn("absolute size-4", c, phase === "done" ? "border-[color:var(--sunui-spot,var(--primary))]" : "border-foreground/70")}
          />
        ))}
        <svg viewBox="0 0 80 80" className={cn("absolute inset-0", phase === "done" ? "text-[color:var(--sunui-spot,var(--primary))]" : "text-foreground/70")} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <motion.path d="M32 34v3M48 34v3M33 48c4 4 10 4 14 0" initial={false} animate={{ pathLength: phase === "idle" ? 0.999 : phase === "scan" ? 0 : 1, opacity: phase === "scan" ? 0.25 : 1 }} transition={phase === "done" ? t : { duration: reduce ? 0 : 0.2 }} />
        </svg>
        {phase === "scan" && !reduce && (
          <motion.span
            className="absolute inset-x-2 h-0.5 rounded-full bg-[color:var(--sunui-spot,var(--primary))]"
            initial={{ top: "12%" }}
            animate={{ top: ["12%", "86%", "12%"] }}
            transition={{ duration: 1.3, ease: "easeInOut" }}
          />
        )}
      </span>
      <span className="text-xs text-muted-foreground" aria-live="polite">
        {phase === "idle" ? label : phase === "scan" ? scanningLabel : doneLabel}
      </span>
    </motion.button>
  );
}

/* ---- Crop frame: choose a ratio and the frame reshapes over the photo, the outside dims ---- */

export interface CropFrameProps {
  ratios?: { label: string; value: number | null }[];
  label?: string;
  /** Image to crop; without one a neutral landscape drawing is shown */
  src?: string;
  alt?: string;
  className?: string;
}

const defaultRatios = [
  { label: "Free", value: null },
  { label: "1:1", value: 1 },
  { label: "4:5", value: 4 / 5 },
  { label: "16:9", value: 16 / 9 },
];

export function CropFrame({ ratios = defaultRatios, label = "Aspect ratio", src, alt = "", className }: CropFrameProps) {
  const [ri, setRi] = useState(0);
  const t = useSpring(gentle);
  const W = 224;
  const H = 150;
  const r = ratios[ri]?.value;
  // Largest box of the chosen ratio that fits with a margin; free keeps a loose inset
  const maxW = W - 24;
  const maxH = H - 24;
  const box = r == null ? { w: W - 40, h: H - 36 } : maxW / maxH > r ? { w: maxH * r, h: maxH } : { w: maxW, h: maxW / r };
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative overflow-hidden rounded-md bg-muted" style={{ width: W, height: H }}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="size-full object-cover" />
        ) : (
          <svg viewBox="0 0 224 150" className="size-full text-muted-foreground/50" aria-hidden="true">
            <circle cx="166" cy="42" r="14" fill="currentColor" />
            <path d="M0 150L62 72l38 42 30-30 94 66Z" fill="currentColor" />
          </svg>
        )}
        <motion.div
          aria-hidden
          initial={false}
          animate={{ width: box.w, height: box.h, x: (W - box.w) / 2, y: (H - box.h) / 2 }}
          transition={t}
          className="absolute left-0 top-0 rounded-[3px] border border-white shadow-[0_0_0_999px_rgb(0_0_0/0.45)]"
        >
          {/* Thirds grid and corner handles */}
          <span className="absolute inset-y-0 left-1/3 w-px bg-white/35" />
          <span className="absolute inset-y-0 left-2/3 w-px bg-white/35" />
          <span className="absolute inset-x-0 top-1/3 h-px bg-white/35" />
          <span className="absolute inset-x-0 top-2/3 h-px bg-white/35" />
          {["-left-0.5 -top-0.5 border-l-[3px] border-t-[3px]", "-right-0.5 -top-0.5 border-r-[3px] border-t-[3px]", "-left-0.5 -bottom-0.5 border-l-[3px] border-b-[3px]", "-right-0.5 -bottom-0.5 border-r-[3px] border-b-[3px]"].map((c) => (
            <span key={c} className={cn("absolute size-3.5 border-white", c)} />
          ))}
        </motion.div>
      </div>
      <SegmentedChoice label={label} options={ratios.map((x) => x.label)} value={ri} onChange={setRi} />
    </div>
  );
}

/** Small segmented control with a sliding pill; arrow keys move the choice */
function SegmentedChoice({ label, options, value, onChange }: { label: string; options: string[]; value: number; onChange: (i: number) => void }) {
  const base = useId();
  const t = useSpring(snappy);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (e: KeyboardEvent, d: number) => {
    e.preventDefault();
    const n = (value + d + options.length) % options.length;
    onChange(n);
    refs.current[n]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-full bg-muted p-0.5">
      {options.map((o, i) => (
        <button
          key={o}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={i === value}
          tabIndex={i === value ? 0 : -1}
          onClick={() => onChange(i)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowDown") move(e, 1);
            if (e.key === "ArrowLeft" || e.key === "ArrowUp") move(e, -1);
          }}
          className={cn("relative h-7 rounded-full px-3 text-xs tabular-nums", i === value ? "text-foreground" : "text-muted-foreground hover:text-foreground", ring)}
        >
          {i === value && <motion.span layoutId={`${base}-pill`} transition={t} className="absolute inset-0 rounded-full bg-background shadow-sm" />}
          <span className="relative">{o}</span>
        </button>
      ))}
    </div>
  );
}

/* ---- Sort handle: drag a row by its grip, or focus the grip and use the arrow keys ---- */

export interface SortHandleProps {
  items: string[];
  onReorder?: (items: string[]) => void;
  /** Accessible name of each grip, the row text is appended */
  moveLabel?: string;
  className?: string;
}

export function SortHandle({ items: initial, onReorder, moveLabel = "Reorder", className }: SortHandleProps) {
  const [items, setItems] = useState(initial);
  const [lifted, setLifted] = useState<string | null>(null);
  const [said, setSaid] = useState("");
  const t = useSpring(gentle);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const commit = (next: string[]) => {
    setItems(next);
    onReorder?.(next);
  };
  const shift = (it: string, d: number) => {
    const i = items.indexOf(it);
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
    setSaid(`${it}: ${j + 1} / ${items.length}`);
    requestAnimationFrame(() => refs.current[it]?.focus());
  };
  return (
    <div className={cn("w-full max-w-56", className)}>
      <Reorder.Group axis="y" values={items} onReorder={commit} className="flex flex-col gap-1.5">
        {items.map((it) => (
          <SortRow key={it} item={it} lifted={lifted === it} setLifted={setLifted} t={t} label={`${moveLabel}: ${it}`} onKey={shift} buttonRef={(el) => (refs.current[it] = el)} />
        ))}
      </Reorder.Group>
      <span className="sr-only" aria-live="polite">
        {said}
      </span>
    </div>
  );
}

function SortRow({ item, lifted, setLifted, t, label, onKey, buttonRef }: { item: string; lifted: boolean; setLifted: (v: string | null) => void; t: object; label: string; onKey: (it: string, d: number) => void; buttonRef: (el: HTMLButtonElement | null) => void }) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      transition={t}
      onDragEnd={() => setLifted(null)}
      animate={{ scale: lifted ? 1.02 : 1 }}
      className={cn("relative flex h-10 items-center gap-2 rounded-md border border-border bg-card pl-3 pr-1 text-xs", lifted ? "z-10 shadow-md" : "shadow-none")}
    >
      <span className="flex-1 truncate">{item}</span>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        onPointerDown={(e) => {
          setLifted(item);
          controls.start(e);
        }}
        onPointerUp={() => setLifted(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") {
            e.preventDefault();
            onKey(item, -1);
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            onKey(item, 1);
          }
        }}
        className={cn("grid size-8 cursor-grab touch-none place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing", ring)}
      >
        <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden="true">
          {[4, 8, 12].map((y) => (
            <g key={y}>
              <circle cx="6" cy={y} r="1.1" />
              <circle cx="10" cy={y} r="1.1" />
            </g>
          ))}
        </svg>
      </button>
    </Reorder.Item>
  );
}

/* ---- Resize frame: drag the corner, the size reads out live and snaps to the grid on release ---- */

export interface ResizeFrameProps {
  label?: string;
  /** Starting and limit sizes in px */
  defaultSize?: { w: number; h: number };
  min?: { w: number; h: number };
  max?: { w: number; h: number };
  /** Snap step on release and arrow key step */
  step?: number;
  onResize?: (size: { w: number; h: number }) => void;
  className?: string;
}

export function ResizeFrame({ label = "Resize", defaultSize = { w: 160, h: 96 }, min = { w: 96, h: 64 }, max = { w: 216, h: 136 }, step = 8, onResize, className }: ResizeFrameProps) {
  const reduce = useReducedMotion() ?? false;
  const w = useMotionValue(defaultSize.w);
  const h = useMotionValue(defaultSize.h);
  const [size, setSize] = useState(defaultSize);
  const start = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
  const apply = (nw: number, nh: number) => {
    const next = { w: clamp(nw, min.w, max.w), h: clamp(nh, min.h, max.h) };
    w.set(next.w);
    h.set(next.h);
    setSize({ w: Math.round(next.w), h: Math.round(next.h) });
    return next;
  };
  const settle = () => {
    const sw = clamp(Math.round(w.get() / step) * step, min.w, max.w);
    const sh = clamp(Math.round(h.get() / step) * step, min.h, max.h);
    const t = reduce ? instant : snappy;
    animate(w, sw, t);
    animate(h, sh, t);
    setSize({ w: sw, h: sh });
    onResize?.({ w: sw, h: sh });
  };
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative grid place-items-start" style={{ width: max.w + 8, height: max.h + 8 }}>
        <motion.div style={{ width: w, height: h }} className="relative m-1 rounded-md border border-[color:var(--sunui-spot,var(--primary))] bg-card p-3 shadow-sm">
          <span className="block h-1.5 w-3/5 rounded-full bg-muted-foreground/35" />
          <span className="mt-1.5 block h-1.5 w-2/5 rounded-full bg-muted-foreground/20" />
          {["-left-1 -top-1", "-right-1 -top-1", "-left-1 -bottom-1"].map((c) => (
            <span key={c} aria-hidden className={cn("absolute size-2 rounded-[2px] border border-[color:var(--sunui-spot,var(--primary))] bg-background", c)} />
          ))}
          <button
            type="button"
            aria-label={`${label}: ${size.w} × ${size.h}`}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              start.current = { x: e.clientX, y: e.clientY, w: w.get(), h: h.get() };
            }}
            onPointerMove={(e) => {
              const s = start.current;
              if (s) apply(s.w + e.clientX - s.x, s.h + e.clientY - s.y);
            }}
            onPointerUp={() => {
              start.current = null;
              settle();
            }}
            onKeyDown={(e) => {
              const d = { ArrowRight: [step, 0], ArrowLeft: [-step, 0], ArrowDown: [0, step], ArrowUp: [0, -step] }[e.key];
              if (!d) return;
              e.preventDefault();
              const next = apply(w.get() + d[0], h.get() + d[1]);
              onResize?.(next);
            }}
            className={cn("absolute -bottom-2.5 -right-2.5 grid size-5 cursor-nwse-resize touch-none place-items-center rounded-full", spotBg, ring)}
          >
            <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <path d="M4 8h4V4" />
            </svg>
          </button>
        </motion.div>
      </div>
      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        {size.w} × {size.h}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component: switch with effect, comes with default content for quick previews */

export interface MicroInteractionProps {
  effect: MicroInteractionId;
  className?: string;
}

export function MicroInteraction({ effect, className }: MicroInteractionProps) {
  const [count, setCount] = useState(3);
  const [rows, setRows] = useState(["Inbox", "Drafts", "Archive"]);
  switch (effect) {
    case "like-burst":
      return <LikeBurst className={className} />;
    case "confetti":
      return <ConfettiBurst className={className} />;
    case "success-check":
      return <SuccessCheck className={className} />;
    case "checkbox-draw":
      return <AnimatedCheckbox label="Ship it" className={className} />;
    case "toggle-switch":
      return <ToggleSwitch label="Notifications" className={className} />;
    case "copy-feedback":
      return <CopyFeedback text="npx shadcn add micro-interactions" className={className} />;
    case "notification-badge":
      return (
        <button type="button" onClick={() => setCount((c) => c + 1)} className={cn("rounded-md p-2", className)}>
          <NotificationBadge count={count}>
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16ZM10 20.5a2 2 0 0 0 4 0" strokeLinejoin="round" />
            </svg>
          </NotificationBadge>
        </button>
      );
    case "floating-label":
      return <FloatingLabelInput label="Email" type="email" className={className} />;
    case "slide-to-confirm":
      return <SlideToConfirm resetAfter={2000} className={className} />;
    case "hold-to-confirm":
      return <HoldToConfirm className={className} />;
    case "swipe-to-delete":
      return (
        <div className={cn("w-full divide-y divide-border rounded-md border border-border", className)}>
          {rows.map((r) => (
            <SwipeToDelete key={r} onDelete={() => setRows((xs) => xs.filter((x) => x !== r))}>
              {r}
            </SwipeToDelete>
          ))}
        </div>
      );
    case "send-plane":
      return <SendPlaneButton className={className} />;
    case "password-reveal":
      return <PasswordToggle className={className} />;
    case "clear-input":
      return <ClearInput label="Name" defaultValue="Alex" className={className} />;
    case "radio-select":
      return <RadioSelect label="Digest" options={[{ value: "daily", label: "Daily" }, { value: "weekly", label: "Weekly" }]} className={className} />;
    case "folder-drop":
      return <FolderDrop className={className} />;
    case "quick-reply":
      return <QuickReply suggestions={["On my way", "Thanks!", "Call you later"]} className={className} />;
    case "mute-switch":
      return <MuteSwitch className={className} />;
    case "reaction-tray":
      return <ReactionTray className={className} />;
    case "focus-lock":
      return <FocusLock className={className} />;
    case "pin-toggle":
      return <PinToggle className={className} />;
    case "list-to-grid":
      return <ListToGrid items={["Inbox", "Drafts", "Sent", "Archive"]} className={className} />;
    case "permission-gate":
      return <PermissionGate className={className} />;
    case "face-scan":
      return <FaceScan className={className} />;
    case "crop-frame":
      return <CropFrame className={className} />;
    case "sort-handle":
      return <SortHandle items={rows} className={className} />;
    case "resize-frame":
      return <ResizeFrame className={className} />;
  }
}
