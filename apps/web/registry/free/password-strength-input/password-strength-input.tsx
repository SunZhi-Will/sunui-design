"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useMemo, useState, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface PasswordRule {
  id: string;
  /** 清單上顯示的文字 */
  label: string;
  /** 回傳 true 代表符合 */
  test: (value: string) => boolean;
}

/** 0：空白；1：弱；2：普通；3：良好；4：強 */
export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

export interface PasswordStrengthInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "defaultValue" | "onChange" | "size"> {
  /** 受控值 */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** 強度改變時觸發，allPassed 代表所有規則都符合 */
  onStrengthChange?: (strength: PasswordStrength, allPassed: boolean) => void;
  /** 自訂規則，強度依符合比例換算成 0 到 4 */
  rules?: PasswordRule[];
  /** 欄位上方的標籤 */
  label?: ReactNode;
  /** 是否顯示規則清單 */
  showChecklist?: boolean;
  labels?: {
    show?: string;
    hide?: string;
    /** 依強度 0 到 4 的文字 */
    strength?: [string, string, string, string, string];
    /** 螢幕閱讀器播報的前綴 */
    strengthPrefix?: string;
    met?: string;
    unmet?: string;
  };
  /** 外層的 className */
  className?: string;
  /** 輸入框的 className */
  inputClassName?: string;
}

export const defaultPasswordRules: PasswordRule[] = [
  { id: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { id: "case", label: "Upper and lowercase letters", test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { id: "number", label: "At least one number", test: (v) => /\d/.test(v) },
  { id: "symbol", label: "At least one symbol", test: (v) => /[^A-Za-z0-9\s]/.test(v) },
];

const defaultLabels = {
  show: "Show password",
  hide: "Hide password",
  strength: ["", "Weak", "Fair", "Good", "Strong"] as [string, string, string, string, string],
  strengthPrefix: "Password strength",
  met: "met",
  unmet: "not met",
};

// 各強度的顏色（填色與文字）
const tones: Record<PasswordStrength, { bar: string; text: string }> = {
  0: { bar: "bg-muted-foreground/30", text: "text-muted-foreground" },
  1: { bar: "bg-red-500", text: "text-red-600 dark:text-red-400" },
  2: { bar: "bg-orange-500", text: "text-orange-600 dark:text-orange-400" },
  3: { bar: "bg-amber-400", text: "text-amber-600 dark:text-amber-400" },
  4: { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
};

export function PasswordStrengthInput({
  value,
  defaultValue = "",
  onValueChange,
  onStrengthChange,
  rules = defaultPasswordRules,
  label = "Password",
  showChecklist = true,
  labels,
  className,
  inputClassName,
  id,
  disabled,
  autoComplete = "new-password",
  "aria-describedby": describedBy,
  ...rest
}: PasswordStrengthInputProps) {
  const reduceMotion = useReducedMotion();
  const text = { ...defaultLabels, ...labels };
  const autoId = useId();
  const inputId = id ?? `${autoId}-input`;
  const meterId = `${autoId}-meter`;
  const listId = `${autoId}-rules`;
  const [inner, setInner] = useState(defaultValue);
  const [visible, setVisible] = useState(false);
  const password = value ?? inner;

  const results = useMemo(() => rules.map((r) => ({ ...r, passed: r.test(password) })), [rules, password]);
  const passedCount = results.filter((r) => r.passed).length;
  const allPassed = rules.length > 0 && passedCount === rules.length;
  // 有輸入但都不符合時仍算 1（弱），讓使用者看到回饋
  const strength = (
    password.length === 0 ? 0 : Math.max(1, Math.round((passedCount / Math.max(rules.length, 1)) * 4))
  ) as PasswordStrength;
  const tone = tones[strength];

  useEffect(() => {
    onStrengthChange?.(strength, allPassed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strength, allPassed]);

  const update = (next: string) => {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };

  const describedByIds = [describedBy, meterId, showChecklist ? listId : undefined].filter(Boolean).join(" ");
  const ease = { duration: reduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div className={cn("w-full space-y-2", className)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          {...rest}
          id={inputId}
          type={visible ? "text" : "password"}
          value={password}
          onChange={(e) => update(e.target.value)}
          disabled={disabled}
          autoComplete={autoComplete}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-describedby={describedByIds}
          className={cn(
            "h-11 w-full rounded-xl border border-border bg-background pr-12 pl-3.5 text-sm text-foreground shadow-sm transition-colors outline-none placeholder:text-muted-foreground",
            "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
            "disabled:cursor-not-allowed disabled:opacity-50",
            inputClassName,
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          aria-label={text.show}
          aria-pressed={visible}
          aria-controls={inputId}
          className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
            <circle cx="12" cy="12" r="3" />
            {/* 隱藏狀態時畫出斜線 */}
            <motion.path
              d="M4 4l16 16"
              initial={false}
              animate={{ pathLength: visible ? 0 : 1, opacity: visible ? 0 : 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
            />
          </svg>
        </button>
      </div>

      {/* 四段強度條 */}
      <div className="flex items-center gap-3">
        <div aria-hidden="true" className="flex flex-1 gap-1.5">
          {[1, 2, 3, 4].map((seg) => (
            <span key={seg} className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.span
                className={cn("absolute inset-0 origin-left rounded-full transition-colors duration-300", tone.bar)}
                initial={false}
                animate={{ scaleX: strength >= seg ? 1 : 0 }}
                transition={{ ...ease, delay: reduceMotion ? 0 : (strength >= seg ? seg - 1 : 4 - seg) * 0.04 }}
              />
            </span>
          ))}
        </div>
        <span className={cn("min-w-12 text-right text-xs font-medium transition-colors", tone.text)} aria-hidden="true">
          {text.strength[strength]}
        </span>
      </div>
      {/* 只有強度等級改變時文字才會變，避免每次按鍵都播報 */}
      <p id={meterId} className="sr-only" aria-live="polite" aria-atomic="true">
        {strength > 0 ? `${text.strengthPrefix}: ${text.strength[strength]}` : ""}
      </p>

      {showChecklist && (
        <ul id={listId} className="grid gap-1.5 pt-1 text-sm sm:grid-cols-2">
          {results.map((r) => (
            <li
              key={r.id}
              className={cn("flex items-center gap-2 transition-colors", r.passed ? "text-foreground" : "text-muted-foreground")}
            >
              <motion.span
                aria-hidden="true"
                className={cn(
                  "grid size-4 shrink-0 place-items-center rounded-full border transition-colors duration-200",
                  r.passed ? "border-emerald-500 bg-emerald-500 text-white" : "border-border bg-background",
                )}
                initial={false}
                animate={r.passed && !reduceMotion ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                transition={{ duration: 0.25 }}
              >
                <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                  <motion.path
                    d="M5 12.5l4.5 4.5L19 7.5"
                    initial={false}
                    animate={{ pathLength: r.passed ? 1 : 0, opacity: r.passed ? 1 : 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.25 }}
                  />
                </svg>
              </motion.span>
              <span>
                {r.label}
                <span className="sr-only">, {r.passed ? text.met : text.unmet}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
