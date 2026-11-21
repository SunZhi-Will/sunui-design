"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useAnimate,
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
  }
}
