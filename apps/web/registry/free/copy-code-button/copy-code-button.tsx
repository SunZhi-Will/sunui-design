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
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<CopyCodeButtonLabels>;
  className?: string;
}

export interface CopyCodeButtonLabels {
  /** 按鈕可見文字 */
  button: ReactNode;
  /** 按鈕的無障礙名稱 */
  copy: (code: string) => string;
  /** 朗讀給螢幕閱讀器 */
  copied: string;
  /** 複製後蓋在紙條上的印章字 */
  stamp: ReactNode;
  failed: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, CopyCodeButtonLabels> = {
  en: {
    button: "Copy",
    copy: (code) => `Copy code ${code}`,
    copied: "Code copied to clipboard",
    stamp: "Copied",
    failed: "Copy failed, select the code to copy manually",
  },
  "zh-TW": {
    button: "複製",
    copy: (code) => `複製代碼 ${code}`,
    copied: "代碼已複製到剪貼簿",
    stamp: "已複製",
    failed: "複製失敗，請選取代碼手動複製",
  },
  "zh-CN": {
    button: "复制",
    copy: (code) => `复制代码 ${code}`,
    copied: "代码已复制到剪贴板",
    stamp: "已复制",
    failed: "复制失败，请选中代码手动复制",
  },
  ja: {
    button: "コピー",
    copy: (code) => `コード ${code} をコピー`,
    copied: "コードをクリップボードにコピーしました",
    stamp: "コピー済",
    failed: "コピーできませんでした。コードを選択して手動でコピーしてください",
  },
};

// 設計語言（DESIGN.md）：紙、紙邊、墨、朱紅
const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
// 虛線用淡墨色，紙邊色在紙面上幾乎看不見
const edge = "border-[#1c1917]/25 dark:border-[#ece7dc]/25";
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
  lg: { root: "h-14 text-sm", code: "px-4 text-lg sm:px-5 sm:text-xl", caption: "px-4 text-xs", button: "px-4", stamp: "text-sm" },
};

async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    // 沒有權限、舊瀏覽器或非安全環境時改用下面的備案
  }
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

export function CopyCodeButton({ code, caption, resetAfter = 1800, onCopy, size = "md", locale = "en", labels, className }: CopyCodeButtonProps) {
  const reduceMotion = useReducedMotion();
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
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
            "flex min-w-0 items-center border-r border-dashed font-medium tracking-[0.14em] whitespace-nowrap uppercase",
            edge,
            inkMuted,
            s.caption,
          )}
        >
          <span className="truncate">{caption}</span>
        </span>
      )}
      {/* 代碼可直接選取，作為剪貼簿失敗時的退路；複製後印章蓋在代碼上，代碼淡成墨印 */}
      <span className={cn("relative flex shrink-0 items-center", s.code)}>
        <span
          id={codeId}
          className={cn(
            "font-mono font-semibold tracking-[0.12em] uppercase transition-opacity select-all",
            copied && "opacity-20",
          )}
        >
          {code}
        </span>
        <AnimatePresence>
          {copied && (
            <motion.span
              key={stampKey}
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute top-1/2 left-1/2 rounded-[3px] border-2 border-current px-1.5 py-px font-sans font-bold tracking-[0.2em] whitespace-nowrap uppercase",
                vermilion,
                s.stamp,
              )}
              style={{ x: "-50%", y: "-50%" }}
              initial={reduceMotion ? false : { scale: 1.6, opacity: 0, rotate: -4 }}
              animate={{ scale: 1, opacity: 0.9, rotate: -8 }}
              exit={{ opacity: 0, transition: { duration: reduceMotion ? 0 : 0.2 } }}
              transition={springs.stamp}
            >
              {t.stamp}
            </motion.span>
          )}
        </AnimatePresence>
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

      <span className="sr-only" role="status" aria-live="polite">
        {status === "copied" ? t.copied : status === "failed" ? t.failed : ""}
      </span>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-3.5">
      <rect x="8.5" y="8.5" width="11" height="11" rx="1.5" />
      <path d="M15.5 8.5V6A1.5 1.5 0 0 0 14 4.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-3.5">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}
