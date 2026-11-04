"use client";

import { motion, useAnimationControls, useReducedMotion, type Variants } from "framer-motion";
import { useEffect, useId, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

export type OtpStatus = "idle" | "success" | "error";

export interface OtpInputProps {
  /** 格數 */
  length?: number;
  /** 受控值 */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** 填滿時觸發 */
  onComplete?: (value: string) => void;
  /** success 會變綠，error 會搖晃並變紅 */
  status?: OtpStatus;
  /** numeric 只收數字；alphanumeric 收英數字 */
  mode?: "numeric" | "alphanumeric";
  /** 在中間插入分隔線，例如 6 格時在第 3 格後 */
  groupSize?: number;
  /** 以圓點遮蔽輸入內容 */
  mask?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  labels?: {
    group?: string;
    digit?: (index: number, total: number) => string;
    success?: string;
    error?: string;
  };
  className?: string;
}

const defaultLabels = {
  group: "One-time code",
  digit: (i: number, n: number) => `Digit ${i} of ${n}`,
  success: "Code verified",
  error: "Code is incorrect, please try again",
};

// 游標不在選取狀態時，新輸入會與舊字元並存，先去掉舊字元
function stripExisting(next: string, prev: string) {
  if (!prev || next.length < 2) return next;
  if (next.startsWith(prev)) return next.slice(prev.length);
  if (next.endsWith(prev)) return next.slice(0, -prev.length);
  return next;
}

const cellVariants: Variants = {
  empty: { scale: 1 },
  filled: { scale: [1, 1.08, 1], transition: { duration: 0.18 } },
};

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
  labels,
  className,
}: OtpInputProps) {
  const reduceMotion = useReducedMotion();
  const text = { ...defaultLabels, ...labels };
  const groupId = useId();
  const controls = useAnimationControls();
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const [inner, setInner] = useState(defaultValue.slice(0, length));
  const code = (value ?? inner).slice(0, length);
  const chars = Array.from({ length }, (_, i) => code[i] ?? "");
  const pattern = mode === "numeric" ? /[0-9]/ : /[0-9a-zA-Z]/;

  // error 時整排搖晃；減少動態時不搖
  useEffect(() => {
    if (status === "error" && !reduceMotion) {
      void controls.start({ x: [0, -8, 8, -6, 6, -3, 0], transition: { duration: 0.42 } });
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

  const setCharAt = (i: number, ch: string) => {
    // 中間的空洞以空白保留位置，尾端空白去掉
    const arr = chars.map((c) => c || " ");
    arr[i] = ch || " ";
    commit(arr.join("").replace(/\s+$/, ""));
  };

  const handleInput = (i: number, raw: string) => {
    const filtered = Array.from(raw).filter((c) => pattern.test(c));
    if (filtered.length === 0) return;
    if (filtered.length > 1) {
      distribute(i, filtered.join(""));
      return;
    }
    setCharAt(i, filtered[0]);
    if (i < length - 1) focusAt(i + 1);
  };

  const distribute = (start: number, raw: string) => {
    const filtered = Array.from(raw).filter((c) => pattern.test(c));
    if (filtered.length === 0) return;
    const arr = chars.map((c) => c || " ");
    filtered.slice(0, length - start).forEach((c, k) => {
      arr[start + k] = c;
    });
    commit(arr.join("").replace(/\s+$/, ""));
    focusAt(Math.min(start + filtered.length, length - 1));
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (chars[i] && chars[i] !== " ") {
        setCharAt(i, "");
      } else if (i > 0) {
        setCharAt(i - 1, "");
        focusAt(i - 1);
      }
    } else if (e.key === "Delete") {
      e.preventDefault();
      setCharAt(i, "");
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusAt(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusAt(i + 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusAt(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusAt(length - 1);
    }
  };

  const handlePaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    distribute(i, e.clipboardData.getData("text"));
  };

  const statusMessage = status === "success" ? text.success : status === "error" ? text.error : "";

  return (
    <div className={cn("inline-flex flex-col items-center gap-3", className)}>
      <motion.div
        role="group"
        aria-label={text.group}
        aria-describedby={statusMessage ? `${groupId}-status` : undefined}
        animate={controls}
        className="flex items-center gap-2"
      >
        {chars.map((ch, i) => {
          const filled = ch !== "" && ch !== " ";
          return (
            <span key={i} className="flex items-center gap-2">
              {groupSize && i > 0 && i % groupSize === 0 && (
                <span aria-hidden="true" className="h-0.5 w-3 rounded-full bg-border" />
              )}
              <motion.input
                ref={(el) => {
                  refs.current[i] = el;
                }}
                variants={cellVariants}
                animate={filled && !reduceMotion ? "filled" : "empty"}
                type={mask ? "password" : "text"}
                inputMode={mode === "numeric" ? "numeric" : "text"}
                autoComplete={i === 0 ? "one-time-code" : "off"}
                pattern={mode === "numeric" ? "[0-9]*" : undefined}
                maxLength={length}
                disabled={disabled}
                aria-label={text.digit(i + 1, length)}
                aria-invalid={status === "error" || undefined}
                value={filled ? ch : ""}
                onChange={(e) => handleInput(i, stripExisting(e.target.value, filled ? ch : ""))}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={(e) => handlePaste(i, e)}
                onFocus={(e) => e.target.select()}
                className={cn(
                  "size-12 rounded-xl border bg-background text-center text-xl font-semibold tabular-nums text-foreground caret-primary shadow-sm outline-none transition-colors sm:size-14 sm:text-2xl",
                  "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  status === "idle" && (filled ? "border-foreground/30" : "border-border"),
                  status === "success" && "border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
                  status === "error" && "border-red-500 bg-red-500/5 text-red-700 dark:text-red-300",
                )}
              />
            </span>
          );
        })}
      </motion.div>
      <p
        id={`${groupId}-status`}
        aria-live="polite"
        className={cn(
          "min-h-5 text-sm",
          status === "success" && "text-emerald-600 dark:text-emerald-400",
          status === "error" && "text-red-600 dark:text-red-400",
        )}
      >
        {statusMessage}
      </p>
    </div>
  );
}
