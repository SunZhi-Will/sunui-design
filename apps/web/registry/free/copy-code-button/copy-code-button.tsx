"use client";

import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface CopyCodeButtonProps {
  /** 要複製的優惠碼 */
  code: string;
  /** 代碼左側的小標，例如折扣內容 */
  caption?: ReactNode;
  /** 顯示「已複製」多久後復原（ms） */
  resetAfter?: number;
  /** 複製成功後呼叫 */
  onCopy?: (code: string) => void;
  size?: "sm" | "md" | "lg";
  labels?: {
    /** 按鈕的無障礙名稱 */
    copy?: (code: string) => string;
    copied?: string;
    /** 浮出的提示 */
    toast?: ReactNode;
    failed?: string;
  };
  className?: string;
}

const defaultLabels = {
  copy: (code: string) => `Copy code ${code}`,
  copied: "Code copied to clipboard",
  toast: "Copied",
  failed: "Copy failed, select the code to copy manually",
};

const sizes = {
  sm: { root: "h-9 text-xs", code: "px-3 text-sm", icon: "w-9" },
  md: { root: "h-11 text-sm", code: "px-4 text-base", icon: "w-11" },
  lg: { root: "h-14 text-base", code: "px-5 text-lg", icon: "w-14" },
};

const iconVariants: Variants = {
  hidden: { scale: 0.5, opacity: 0, rotate: -30 },
  visible: { scale: 1, opacity: 1, rotate: 0 },
};

async function writeClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // 舊瀏覽器或非安全環境的備案
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.position = "fixed";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.select();
  const ok = document.execCommand("copy");
  el.remove();
  if (!ok) throw new Error("copy failed");
}

export function CopyCodeButton({
  code,
  caption,
  resetAfter = 1800,
  onCopy,
  size = "md",
  labels,
  className,
}: CopyCodeButtonProps) {
  const reduceMotion = useReducedMotion();
  const text = { ...defaultLabels, ...labels };
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const codeId = useId();
  const s = sizes[size];

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function copy() {
    if (timer.current) clearTimeout(timer.current);
    try {
      await writeClipboard(code);
      setStatus("copied");
      onCopy?.(code);
    } catch {
      setStatus("failed");
    }
    timer.current = setTimeout(() => setStatus("idle"), resetAfter);
  }

  const copied = status === "copied";

  return (
    <div className={cn("relative inline-flex", className)}>
      <div
        className={cn(
          "inline-flex items-stretch overflow-hidden rounded-xl border border-dashed bg-card text-card-foreground transition-colors",
          copied ? "border-emerald-500/60" : "border-border",
          s.root,
        )}
      >
        {caption && (
          <span className="flex items-center border-r border-dashed border-border bg-muted px-3 font-medium text-muted-foreground">
            {caption}
          </span>
        )}
        {/* 代碼可直接選取，作為剪貼簿失敗時的退路 */}
        <span
          id={codeId}
          className={cn("flex items-center font-mono font-semibold tracking-[0.18em] uppercase select-all", s.code)}
        >
          {code}
        </span>
        <motion.button
          type="button"
          onClick={copy}
          aria-label={text.copy(code)}
          aria-describedby={codeId}
          whileTap={reduceMotion ? undefined : { scale: 0.9 }}
          className={cn(
            "relative grid place-items-center border-l border-dashed border-border transition-colors",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset",
            copied
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
            s.icon,
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.svg
              key={copied ? "check" : "copy"}
              viewBox="0 0 24 24"
              className="size-[1.15em]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              variants={iconVariants}
              initial={reduceMotion ? false : "hidden"}
              animate="visible"
              exit={reduceMotion ? undefined : "hidden"}
              transition={{ type: "spring", stiffness: 500, damping: 26 }}
              aria-hidden="true"
            >
              {copied ? (
                <motion.path
                  d="M5 12.5l4.5 4.5L19 7.5"
                  initial={reduceMotion ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.28, delay: 0.08 }}
                />
              ) : (
                <>
                  <rect x="8.5" y="8.5" width="11" height="11" rx="2.2" />
                  <path d="M15.5 8.5V6.7a2.2 2.2 0 0 0-2.2-2.2H6.7a2.2 2.2 0 0 0-2.2 2.2v6.6a2.2 2.2 0 0 0 2.2 2.2h1.8" />
                </>
              )}
            </motion.svg>
          </AnimatePresence>
        </motion.button>
      </div>

      <AnimatePresence>
        {copied && (
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute right-0 bottom-full mb-2 inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-xs font-medium whitespace-nowrap text-background shadow-lg"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.95 }}
            transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 30 }}
          >
            <span className="size-1.5 rounded-full bg-emerald-400" />
            {text.toast}
          </motion.span>
        )}
      </AnimatePresence>

      <span className="sr-only" role="status" aria-live="polite">
        {status === "copied" ? text.copied : status === "failed" ? text.failed : ""}
      </span>
    </div>
  );
}
