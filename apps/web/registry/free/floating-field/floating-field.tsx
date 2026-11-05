"use client";

import { AnimatePresence, motion, useAnimate, useReducedMotion } from "framer-motion";
import { useId, useState, type ChangeEvent, type FocusEvent, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
} as const;

/** 回傳字串代表錯誤訊息；回傳 true 或 undefined 代表通過 */
export type FieldValidator = (value: string) => string | true | undefined | null;

export interface FloatingFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement & HTMLTextAreaElement>, "value" | "defaultValue" | "onChange" | "size"> {
  label: ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** 同步驗證；錯誤時回傳訊息字串 */
  validate?: FieldValidator;
  /** change：打字時即時驗證（第一次離開欄位之後）；blur：只在離開時驗證 */
  validateOn?: "change" | "blur";
  /** 通過驗證時顯示的訊息，例如「可以使用」 */
  successMessage?: ReactNode;
  /** 一律顯示的說明文字，錯誤時被錯誤訊息取代 */
  hint?: ReactNode;
  /** 外部給的錯誤（例如伺服器回傳），優先於 validate */
  error?: ReactNode;
  multiline?: boolean;
  rows?: number;
  /** 欄位右側的附加元素，例如顯示密碼按鈕 */
  trailing?: ReactNode;
}

export function FloatingField({
  label,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  validate,
  validateOn = "change",
  successMessage,
  hint,
  error: errorProp,
  multiline = false,
  rows = 3,
  trailing,
  className,
  id: idProp,
  onBlur,
  onFocus,
  required,
  ...rest
}: FloatingFieldProps) {
  const reduce = useReducedMotion();
  const autoId = useId();
  const id = idProp ?? autoId;
  const msgId = `${id}-msg`;
  const [inner, setInner] = useState(defaultValue);
  const value = valueProp ?? inner;
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [scope, animate] = useAnimate<HTMLDivElement>();

  const result = validate && value ? validate(value) : undefined;
  const ownError = typeof result === "string" ? result : undefined;
  const showOwn = touched && (validateOn === "change" || !focused);
  const error = errorProp ?? (showOwn ? ownError : undefined);
  const valid = !error && !!validate && !!value && !ownError && (validateOn === "change" || !focused);
  const floated = focused || value.length > 0;
  const message = error ?? (valid && successMessage ? successMessage : hint);

  const set = (next: string) => {
    if (valueProp === undefined) setInner(next);
    onValueChange?.(next);
  };

  const shake = () => {
    if (reduce || !scope.current) return;
    void animate(scope.current, { x: [0, -6, 5, -3, 2, 0] }, { duration: 0.32, ease: "easeOut" });
  };

  const fieldClass = cn(
    "peer w-full bg-transparent px-3 text-sm text-[#1c1917] outline-none dark:text-[#ece7dc]",
    multiline ? "min-h-24 resize-y pb-2 pt-6" : "h-14 pb-2 pt-6",
    trailing && "pr-10",
  );

  const common = {
    ...rest,
    id,
    required,
    value,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": message ? msgId : undefined,
    onFocus: (e: FocusEvent<HTMLInputElement & HTMLTextAreaElement>) => {
      setFocused(true);
      onFocus?.(e);
    },
    onBlur: (e: FocusEvent<HTMLInputElement & HTMLTextAreaElement>) => {
      setFocused(false);
      setTouched(true);
      if (validate && value && typeof validate(value) === "string") shake();
      onBlur?.(e);
    },
    onChange: (e: ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => set(e.target.value),
    className: fieldClass,
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        ref={scope}
        className={cn(
          "relative rounded-md border bg-[#faf7f0] transition-colors dark:bg-[#1f1c18]",
          error ? "border-destructive" : valid ? "border-emerald-700/60 dark:border-emerald-400/60" : focused ? "border-[#1c1917] dark:border-[#ece7dc]" : "border-[#e7e0d0] dark:border-[#38332b]",
        )}
      >
        {multiline ? <textarea rows={rows} {...common} /> : <input {...common} />}
        <motion.label
          htmlFor={id}
          initial={false}
          animate={floated ? { y: -9, scale: 0.78 } : { y: 0, scale: 1 }}
          transition={reduce ? { duration: 0 } : springs.snappy}
          style={{ originX: 0, originY: 0.5 }}
          className={cn(
            "pointer-events-none absolute left-3 text-sm",
            multiline ? "top-4" : "top-[1.05rem]",
            error ? "text-destructive" : floated ? "text-[#1c1917]/70 dark:text-[#ece7dc]/70" : "text-[#1c1917]/50 dark:text-[#ece7dc]/50",
          )}
        >
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </motion.label>
        <div className="absolute right-2 top-[1.05rem] flex items-center gap-1">
          <AnimatePresence initial={false}>
            {valid && !trailing && (
              <motion.svg
                key="ok"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5 text-emerald-700 dark:text-emerald-400"
                aria-hidden="true"
                initial={{ scale: reduce ? 1 : 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={reduce ? { duration: 0 } : springs.snappy}
              >
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </motion.svg>
            )}
          </AnimatePresence>
          {trailing}
        </div>
      </div>
      <div className="min-h-5 px-1 pt-1">
        <AnimatePresence mode="wait" initial={false}>
          {message && (
            <motion.p
              key={error ? "e" : valid ? "v" : "h"}
              id={msgId}
              role={error ? "alert" : undefined}
              initial={{ opacity: 0, y: reduce ? 0 : -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.14 }}
              className={cn("text-xs", error ? "text-destructive" : valid && successMessage ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground")}
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
