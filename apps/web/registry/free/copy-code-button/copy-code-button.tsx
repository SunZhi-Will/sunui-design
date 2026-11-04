"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface CopyCodeButtonProps {
  /** 要複製的優惠碼 */
  code: string;
  /** 代碼左側的小標，例如折扣內容 */
  caption?: ReactNode;
  /** 印章停留多久後復原（ms） */
  resetAfter?: number;
  /** 複製成功後呼叫 */
  onCopy?: (code: string) => void;
  size?: "sm" | "md" | "lg";
  labels?: {
    /** 按鈕可見文字 */
    button?: ReactNode;
    /** 按鈕的無障礙名稱 */
    copy?: (code: string) => string;
    /** 朗讀給螢幕閱讀器 */
    copied?: string;
    /** 複製後蓋在紙條上的印章字 */
    stamp?: ReactNode;
    failed?: string;
  };
  className?: string;
}

const defaultLabels = {
  button: "Copy",
  copy: (code: string) => `Copy code ${code}`,
  copied: "Code copied to clipboard",
  stamp: "Copied",
  failed: "Copy failed, select the code to copy manually",
};

// 設計語言（DESIGN.md）：紙、紙邊、墨、朱紅
const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const inkMuted = "text-[#1c1917]/60 dark:text-[#ece7dc]/60";
const vermilion = "text-[#c8361d] dark:text-[#ec6a4f]";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  stamp: { type: "spring", stiffness: 620, damping: 20, mass: 0.8 },
} as const;

const sizes = {
  sm: { root: "h-9 text-xs", code: "px-3 text-sm", caption: "px-2.5 text-[10px]", button: "px-2.5", stamp: "text-[10px]" },
  md: { root: "h-11 text-sm", code: "px-4 text-base", caption: "px-3 text-[11px]", button: "px-3.5", stamp: "text-xs" },
  lg: { root: "h-14 text-sm", code: "px-5 text-xl", caption: "px-4 text-xs", button: "px-4", stamp: "text-sm" },
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

export function CopyCodeButton({ code, caption, resetAfter = 1800, onCopy, size = "md", labels, className }: CopyCodeButtonProps) {
  const reduceMotion = useReducedMotion();
  const t = { ...defaultLabels, ...labels };
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [stampKey, setStampKey] = useState(0);
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
      setStampKey((k) => k + 1);
      onCopy?.(code);
    } catch {
      setStatus("failed");
    }
    timer.current = setTimeout(() => setStatus("idle"), resetAfter);
  }

  const copied = status === "copied";

  return (
    <div
      className={cn(
        "relative inline-flex max-w-full items-stretch rounded-md border border-dashed font-sans",
        paper,
        edge,
        ink,
        s.root,
        className,
      )}
    >
      {caption && (
        <span
          className={cn(
            "flex shrink-0 items-center border-r border-dashed font-medium tracking-[0.14em] whitespace-nowrap uppercase",
            edge,
            inkMuted,
            s.caption,
          )}
        >
          {caption}
        </span>
      )}
      {/* 代碼可直接選取，作為剪貼簿失敗時的退路 */}
      <span
        id={codeId}
        className={cn("flex min-w-0 items-center truncate font-mono font-semibold tracking-[0.12em] uppercase select-all", s.code)}
      >
        {code}
      </span>
      <motion.button
        type="button"
        onClick={copy}
        aria-label={t.copy(code)}
        aria-describedby={codeId}
        whileTap={reduceMotion ? undefined : { scale: 0.94 }}
        transition={springs.snappy}
        className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-r-[5px] border-l border-dashed font-medium transition-colors",
          "hover:bg-[#1c1917]/[0.04] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset dark:hover:bg-[#ece7dc]/[0.06]",
          edge,
          copied ? ink : inkMuted,
          s.button,
        )}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
        <span className={cn(size === "sm" && "sr-only")}>{t.button}</span>
      </motion.button>

      {/* 複製成功：在紙條上蓋一個小印章 */}
      <AnimatePresence>
        {copied && (
          <motion.span
            key={stampKey}
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute top-1/2 right-[18%] rounded-[3px] border-2 border-current px-1.5 py-px font-bold tracking-[0.2em] whitespace-nowrap uppercase mix-blend-multiply dark:mix-blend-screen",
              vermilion,
              s.stamp,
            )}
            style={{ translateY: "-50%" }}
            initial={reduceMotion ? false : { scale: 1.6, opacity: 0, rotate: -4 }}
            animate={{ scale: 1, opacity: 0.9, rotate: -10 }}
            exit={{ opacity: 0, transition: { duration: reduceMotion ? 0 : 0.2 } }}
            transition={springs.stamp}
          >
            {t.stamp}
          </motion.span>
        )}
      </AnimatePresence>

      <span className="sr-only" role="status" aria-live="polite">
        {status === "copied" ? t.copied : status === "failed" ? t.failed : ""}
      </span>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="5" y="5" width="8.5" height="8.5" rx="1.5" />
      <path d="M10.5 5V3.5A1.5 1.5 0 0 0 9 2H3.5A1.5 1.5 0 0 0 2 3.5V9A1.5 1.5 0 0 0 3.5 10.5H5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="m3 8.5 3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
