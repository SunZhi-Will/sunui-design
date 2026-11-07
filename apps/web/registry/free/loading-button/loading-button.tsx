"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** 品牌專色：預設跟著主題的 --primary，買家設 --sunui-spot 就換成自己的品牌色。只用在選中、優惠、目前進度 */
const spotFill = "bg-[color:var(--sunui-spot,var(--primary))] text-[color:var(--sunui-spot-foreground,var(--primary-foreground))]";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  gentle: { type: "spring", stiffness: 240, damping: 30 },
} as const;

export type LoadingButtonState = "idle" | "loading" | "success" | "error";

export interface LoadingButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> {
  children: ReactNode;
  /** 回傳 Promise 時自動切換 loading → success（resolve）或 error（reject） */
  onClick?: () => unknown;
  /** 受控狀態；給了就不再自己管理 */
  state?: LoadingButtonState;
  successLabel?: ReactNode;
  errorLabel?: ReactNode;
  /** 螢幕閱讀器在 loading 時讀到的字 */
  loadingLabel?: string;
  /** shrink：載入時縮成圓形；inline：保持寬度，轉圈出現在文字前 */
  loadingStyle?: "shrink" | "inline";
  /** 成功或失敗後多久回到 idle（毫秒），0 表示停在結果 */
  resetAfter?: number;
  variant?: "primary" | "paper";
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("size-4 animate-spin", className)} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Check({ reduce }: { reduce: boolean | null }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
      <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : 0.28, ease: "easeOut" }} />
    </svg>
  );
}

export function LoadingButton({
  children,
  onClick,
  state: stateProp,
  successLabel = "Done",
  errorLabel = "Try again",
  loadingLabel = "Loading",
  loadingStyle = "shrink",
  resetAfter = 2000,
  variant = "primary",
  className,
  disabled,
  type = "button",
  ...rest
}: LoadingButtonProps) {
  const reduce = useReducedMotion();
  const [inner, setInner] = useState<LoadingButtonState>("idle");
  const state = stateProp ?? inner;
  const alive = useRef(true);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      window.clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (stateProp !== undefined || resetAfter <= 0 || (state !== "success" && state !== "error")) return;
    timer.current = window.setTimeout(() => alive.current && setInner("idle"), resetAfter);
    return () => window.clearTimeout(timer.current);
  }, [state, stateProp, resetAfter]);

  const handle = async () => {
    if (state === "loading") return;
    const result = onClick?.();
    if (stateProp !== undefined || !(result instanceof Promise)) return;
    setInner("loading");
    try {
      await result;
      if (alive.current) setInner("success");
    } catch {
      if (alive.current) setInner("error");
    }
  };

  const shrunk = loadingStyle === "shrink" && state === "loading";
  const t = reduce ? { duration: 0 } : springs.gentle;
  const fade = reduce ? { duration: 0 } : { duration: 0.14 };

  return (
    <motion.button
      {...rest}
      type={type}
      layout={!reduce}
      transition={t}
      onClick={handle}
      disabled={disabled}
      aria-busy={state === "loading" || undefined}
      aria-disabled={state === "loading" || undefined}
      whileTap={reduce || state === "loading" ? undefined : { scale: 0.97 }}
      style={{ borderRadius: shrunk ? 999 : 6 }}
      className={cn(
        "relative inline-flex h-10 items-center justify-center overflow-hidden whitespace-nowrap text-sm font-medium outline-offset-2 focus-visible:outline-2 disabled:pointer-events-none disabled:opacity-50",
        shrunk ? "w-10 px-0" : "px-4",
        variant === "primary" && state !== "error" && spotFill,
        variant === "paper" && "border border-[#e2e2e2] bg-[#f7f7f7] text-[#171717] dark:border-[#333333] dark:bg-[#1c1c1c] dark:text-[#ededed]",
        state === "error" && "bg-destructive text-white",
        className,
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={shrunk ? "spin" : state}
          initial={{ opacity: 0, y: reduce ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduce ? 0 : -6 }}
          transition={fade}
          className="inline-flex items-center gap-2"
        >
          {shrunk ? (
            <Spinner />
          ) : state === "loading" ? (
            <>
              <Spinner />
              {children}
            </>
          ) : state === "success" ? (
            <>
              <Check reduce={reduce} />
              {successLabel}
            </>
          ) : state === "error" ? (
            errorLabel
          ) : (
            children
          )}
        </motion.span>
      </AnimatePresence>
      <span className="sr-only" aria-live="polite">
        {state === "loading" ? loadingLabel : state === "success" ? successLabel : state === "error" ? errorLabel : ""}
      </span>
    </motion.button>
  );
}
