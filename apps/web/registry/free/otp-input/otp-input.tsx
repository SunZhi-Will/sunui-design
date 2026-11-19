"use client";

import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { Fragment, useEffect, useId, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";

import { Result } from "@/components/ui/stamp";
import { shakeKeyframes, shakeTransition } from "@/lib/sunui-motion";
import { cn } from "@/lib/utils";

export type OtpStatus = "idle" | "success" | "error";

export interface OtpInputProps {
  /** Number of cells */
  length?: number;
  /** Controlled value */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Fires when all cells are filled */
  onComplete?: (value: string) => void;
  /** success lands a "verified" stamp; error shakes once and shows the error text */
  status?: OtpStatus;
  /** numeric accepts digits only; alphanumeric accepts letters and digits */
  mode?: "numeric" | "alphanumeric";
  /** Insert a short divider every this many cells, for example pass 3 for 6 cells */
  groupSize?: number;
  /** Masks the input with dots */
  mask?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  /** UI language: en, zh-TW, zh-CN, ja. Tags like zh-Hant-HK and ja-JP are also accepted */
  locale?: string;
  /** Overrides built-in strings, takes precedence over locale */
  labels?: Partial<OtpInputLabels>;
  className?: string;
}

export interface OtpInputLabels {
  group: string;
  digit: (index: number, total: number) => string;
  success: string;
  error: string;
  stamp: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Maps any language tag to one of the four built-in languages, falling back to English */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, OtpInputLabels> = {
  en: {
    group: "One-time code",
    digit: (i, n) => `Digit ${i} of ${n}`,
    success: "Code verified",
    error: "That code doesn't match. Check the email and try again.",
    stamp: "Verified",
  },
  "zh-TW": {
    group: "一次性驗證碼",
    digit: (i, n) => `第 ${i} 碼，共 ${n} 碼`,
    success: "驗證碼正確",
    error: "驗證碼不符，請檢查信件後再試一次。",
    stamp: "已驗證",
  },
  "zh-CN": {
    group: "一次性验证码",
    digit: (i, n) => `第 ${i} 位，共 ${n} 位`,
    success: "验证码正确",
    error: "验证码不正确，请检查邮件后重试。",
    stamp: "已验证",
  },
  ja: {
    group: "ワンタイムコード",
    digit: (i, n) => `${n} 桁中 ${i} 桁目`,
    success: "コードを確認しました",
    error: "コードが一致しません。メールを確認して、もう一度お試しください。",
    stamp: "認証済み",
  },
};

// Design language (DESIGN.md, craft quality): surface, hairline, text colors, brand accent
const surface = "bg-card shadow-[0_1px_2px_rgb(0_0_0/0.05),0_4px_12px_-6px_rgb(0_0_0/0.06)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]";
const edge = "border-foreground/10";
const ink = "text-foreground";
const inkMuted = "text-muted-foreground";
const vermilion = "text-foreground";
/** Brand accent: follows the theme's --primary by default; buyers set --sunui-spot to use their own brand color. Used only for selection, offers and current progress */
const spot = "text-[color:var(--sunui-spot,var(--primary))]";


// When the caret is not a selection, a new keystroke coexists with the old character, so drop the old one first
function stripExisting(next: string, prev: string) {
  if (!prev || next.length < 2) return next;
  if (next.startsWith(prev)) return next.slice(prev.length);
  if (next.endsWith(prev)) return next.slice(0, -prev.length);
  return next;
}

export function OtpInput({
  length = 6,
  value,
  defaultValue = "",
  onChange,
  onComplete,
  status = "idle",
  mode = "numeric",
  groupSize,
  mask = false,
  disabled = false,
  autoFocus = false,
  locale = "en",
  labels,
  className,
}: OtpInputProps) {
  const reduceMotion = useReducedMotion();
  const text = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const groupId = useId();
  const controls = useAnimationControls();
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const [inner, setInner] = useState(defaultValue.slice(0, length));
  const [focused, setFocused] = useState(-1);
  const code = (value ?? inner).slice(0, length);
  const chars = Array.from({ length }, (_, i) => code[i] ?? "");
  const pattern = mode === "numeric" ? /[0-9]/ : /[0-9a-zA-Z]/;

  // On error the whole row shakes once, like a sheet of paper pushed back; no shake with reduced motion
  useEffect(() => {
    if (status === "error" && !reduceMotion) {
      void controls.start({ ...shakeKeyframes, transition: shakeTransition });
    }
  }, [status, reduceMotion, controls]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const commit = (next: string) => {
    const clean = next.slice(0, length);
    if (value === undefined) setInner(clean);
    onChange?.(clean);
    if (clean.length === length && !clean.includes(" ")) onComplete?.(clean);
  };

  const focusAt = (i: number) => {
    const el = refs.current[Math.max(0, Math.min(length - 1, i))];
    el?.focus();
    el?.select();
  };

  // Gaps in the middle keep their position as spaces; trailing spaces are removed
  const write = (start: number, input: string[]) => {
    const arr = chars.map((c) => c || " ");
    input.slice(0, length - start).forEach((c, k) => (arr[start + k] = c || " "));
    commit(arr.join("").replace(/\s+$/, ""));
  };

  const distribute = (start: number, raw: string) => {
    const filtered = Array.from(raw).filter((c) => pattern.test(c));
    if (filtered.length === 0) return;
    write(start, filtered);
    focusAt(start + filtered.length);
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    const moves: Record<string, number> = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: length - 1 };
    if (e.key === "Backspace") {
      e.preventDefault();
      if (chars[i] && chars[i] !== " ") write(i, [""]);
      else if (i > 0) {
        write(i - 1, [""]);
        focusAt(i - 1);
      }
    } else if (e.key === "Delete") {
      e.preventDefault();
      write(i, [""]);
    } else if (e.key in moves) {
      e.preventDefault();
      focusAt(moves[e.key]);
    }
  };

  const handlePaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    distribute(i, e.clipboardData.getData("text"));
  };

  return (
    <div className={cn("inline-flex flex-col items-start gap-2.5", ink, className)}>
      <div className="relative">
        <motion.div
          role="group"
          aria-label={text.group}
          aria-describedby={status !== "idle" ? `${groupId}-status` : undefined}
          animate={controls}
          className="flex items-center gap-1.5 sm:gap-2"
        >
          {chars.map((ch, i) => {
            const filled = ch !== "" && ch !== " ";
            return (
              <Fragment key={i}>
                {groupSize && i > 0 && i % groupSize === 0 && (
                  <span aria-hidden="true" className={cn("mx-0.5 h-px w-2.5 bg-current", inkMuted)} />
                )}
                <span className="relative">
                  <input
                    ref={(el) => {
                      refs.current[i] = el;
                    }}
                    type={mask ? "password" : "text"}
                    inputMode={mode === "numeric" ? "numeric" : "text"}
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    pattern={mode === "numeric" ? "[0-9]*" : undefined}
                    maxLength={length}
                    disabled={disabled}
                    aria-label={text.digit(i + 1, length)}
                    aria-invalid={status === "error" || undefined}
                    value={filled ? ch : ""}
                    onChange={(e) => {
                      const next = Array.from(stripExisting(e.target.value, filled ? ch : "")).filter((c) => pattern.test(c));
                      if (next.length > 1) distribute(i, next.join(""));
                      else if (next.length === 1) {
                        write(i, next);
                        if (i < length - 1) focusAt(i + 1);
                      }
                    }}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={(e) => handlePaste(i, e)}
                    onFocus={(e) => {
                      setFocused(i);
                      e.target.select();
                    }}
                    onBlur={() => setFocused((f) => (f === i ? -1 : f))}
                    className={cn(
                      "block h-14 w-10 rounded-[3px] border text-center font-mono text-2xl font-medium tabular-nums caret-transparent outline-none transition-colors sm:w-12",
                      surface,
                      edge,
                      "focus:border-foreground/45 selection:bg-transparent",
                      status === "error" && "border-foreground/50",
                      disabled && "cursor-not-allowed opacity-50",
                    )}
                  />
                  {/* Thin line caret: the fill-in position on a printed form */}
                  {focused === i && !disabled && status !== "success" && (
                    <span aria-hidden="true" className={cn("pointer-events-none absolute inset-x-2.5 bottom-2 h-0.5 bg-current sm:inset-x-3", spot)} />
                  )}
                </span>
              </Fragment>
            );
          })}
        </motion.div>

        <AnimatePresence initial={false}>
          {status === "success" && (
            <Result key="stamp" shape="tick" seed={groupId} className="absolute top-full right-1 mt-2">
              {text.stamp}
            </Result>
          )}
        </AnimatePresence>
      </div>

      <p id={`${groupId}-status`} aria-live="polite" className={cn("min-h-5 text-sm", vermilion)}>
        {status === "error" && text.error}
        {status === "success" && <span className="sr-only">{text.success}</span>}
      </p>
    </div>
  );
}
