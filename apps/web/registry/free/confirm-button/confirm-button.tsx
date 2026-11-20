"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ConfirmButtonVariant = "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
export type ConfirmButtonSize = "default" | "xs" | "sm" | "lg";

/** Same shape as usermeld's ActionResult: ok plus a human-readable message */
export type ConfirmResult = { ok: boolean; message?: string } | void;

export interface ConfirmButtonLabels {
  /** Hint after the first press; {label} is replaced with confirmLabel */
  armedNotice?: string;
  /** On success when the action gave no message */
  done?: string;
  /** When the action throws */
  failed?: string;
}

export interface ConfirmButtonProps {
  /** Normal button text; name the action itself, e.g. "Remove" */
  children: ReactNode;
  /** Button text while awaiting confirmation; name it by the outcome, e.g. "Remove registration", not "OK" */
  confirmLabel: string;
  /** Time limit for the second press (ms); the original's quick read is 2.5 seconds */
  armMs?: number;
  /** How long the hint stays (ms); the original is 1.8 seconds */
  noticeMs?: number;
  /** Called on the second press; returning { ok: false, message } or throwing both count as failure */
  action: () => Promise<ConfirmResult> | ConfirmResult;
  /** When set, a press shows only this line and never enters the pending state (e.g. there is no readable quick save yet) */
  unavailableMessage?: string;
  variant?: ConfirmButtonVariant;
  /** Style swapped in while pending; defaults to destructive */
  armedVariant?: ConfirmButtonVariant;
  size?: ConfirmButtonSize;
  disabled?: boolean;
  /** UI language: en, zh-TW, zh-CN, ja. Tags such as zh-Hant-HK or ja-JP are accepted too */
  locale?: string;
  /** Override the built-in strings; takes priority over locale */
  labels?: ConfirmButtonLabels;
  className?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Map any language tag to one of the four built-in languages; everything else falls back to English */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, Required<ConfirmButtonLabels>> = {
  en: { armedNotice: "Press again to {label}", done: "Done", failed: "That didn't work. Please try again." },
  "zh-TW": { armedNotice: "再按一次以{label}", done: "完成", failed: "沒有成功，請再試一次。" },
  "zh-CN": { armedNotice: "再按一次以{label}", done: "完成", failed: "没有成功，请再试一次。" },
  ja: { armedNotice: "もう一度押すと{label}", done: "完了しました", failed: "うまくいきませんでした。もう一度お試しください。" },
};

// buttonVariants from usermeld's components/ui/button.tsx
const base =
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow] outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

const variants: Record<ConfirmButtonVariant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/80",
  outline:
    "border-border bg-background hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
  secondary: "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]",
  ghost: "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
  destructive:
    "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
  link: "text-primary underline-offset-4 hover:underline",
};

const sizes: Record<ConfirmButtonSize, string> = {
  default: "h-8 gap-1.5 px-2.5",
  xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
  sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
  lg: "h-9 gap-1.5 px-2.5",
};

type Notice = { text: string; tone: "info" | "success" | "error" };

// Motion of the product series: expo-out easing, durations on the 120 / 180ms steps
const ease = [0.23, 1, 0.32, 1] as const;
const snappy = { type: "spring", stiffness: 520, damping: 34 } as const;

export function ConfirmButton({
  children,
  confirmLabel,
  armMs = 2500,
  noticeMs = 1800,
  action,
  unavailableMessage,
  variant = "outline",
  armedVariant = "destructive",
  size = "default",
  disabled = false,
  locale = "en",
  labels,
  className,
}: ConfirmButtonProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const reduce = useReducedMotion() ?? false;
  const swap = reduce ? { duration: 0 } : { duration: 0.18, ease };
  const [armed, setArmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice>();
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const armTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      clearTimeout(noticeTimer.current);
      clearTimeout(armTimer.current);
    };
  }, []);

  function flash(text: string, tone: Notice["tone"] = "info") {
    setNotice({ text, tone });
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(undefined), noticeMs);
  }

  function disarm() {
    clearTimeout(armTimer.current);
    setArmed(false);
  }

  async function run() {
    setPending(true);
    try {
      const res = await action();
      if (!alive.current) return;
      if (!res || res.ok) flash(res?.message ?? t.done, "success");
      else flash(res.message ?? t.failed, "error");
    } catch {
      if (alive.current) flash(t.failed, "error");
    } finally {
      if (alive.current) setPending(false);
    }
  }

  // The first press only earns a hint line; a second press within armMs actually runs the action
  function press() {
    if (pending) return;
    if (unavailableMessage) {
      flash(unavailableMessage);
      return;
    }
    if (!armed) {
      setArmed(true);
      flash(t.armedNotice.replace("{label}", confirmLabel.toLowerCase()));
      clearTimeout(armTimer.current);
      armTimer.current = setTimeout(() => setArmed(false), armMs);
      return;
    }
    disarm();
    void run();
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Escape" && armed) {
      e.preventDefault();
      disarm();
      setNotice(undefined);
    }
  }

  return (
    <span className={cn("relative inline-flex flex-col items-end gap-1", className)}>
      {/* The same button widens and changes colour instead of swapping for another: width uses a layout tween, text wraps up and down, and the hint line follows */}
      <motion.button
        type="button"
        data-slot="button"
        data-active={armed || undefined}
        disabled={disabled || pending}
        aria-busy={pending || undefined}
        layout={!reduce}
        transition={reduce ? { duration: 0 } : snappy}
        onClick={(e) => {
          e.stopPropagation();
          press();
        }}
        onKeyDown={onKeyDown}
        className={cn(base, "overflow-hidden", variants[armed ? armedVariant : variant], sizes[size])}
      >
        <AnimatePresence initial={false}>
          {pending && (
            <motion.span
              key="spin"
              layout={!reduce}
              initial={{ opacity: 0, scale: reduce ? 1 : 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: reduce ? 1 : 0.6, transition: reduce ? { duration: 0 } : { duration: 0.12, ease } }}
              transition={swap}
              className="inline-flex"
            >
              <Spinner />
            </motion.span>
          )}
        </AnimatePresence>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={armed ? "armed" : "idle"}
            layout={!reduce ? "position" : false}
            initial={{ opacity: 0, y: reduce ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -6, transition: reduce ? { duration: 0 } : { duration: 0.12, ease } }}
            transition={swap}
            className="inline-block"
          >
            {armed ? confirmLabel : children}
          </motion.span>
        </AnimatePresence>
      </motion.button>
      <span
        role="status"
        aria-live="polite"
        className={cn(
          "relative min-h-4 max-w-64 text-right text-xs leading-4",
          notice?.tone === "error" ? "text-destructive" : notice?.tone === "success" ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {notice && (
            <motion.span
              key={notice.text}
              initial={{ opacity: 0, y: reduce ? 0 : 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: reduce ? { duration: 0 } : { duration: 0.12, ease } }}
              transition={swap}
              className="block"
            >
              {notice.text}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </span>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin motion-reduce:animate-none" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
    </svg>
  );
}
