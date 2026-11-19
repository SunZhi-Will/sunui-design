"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { Result } from "@/components/ui/stamp";
import { cn } from "@/lib/utils";

export interface CopyCodeButtonProps {
  /** The discount code to copy */
  code: string;
  /** Small label to the left of the code, e.g. what the discount is */
  caption?: ReactNode;
  /** How long the stamp stays before resetting (ms) */
  resetAfter?: number;
  /** Called after a successful copy */
  onCopy?: (code: string) => void;
  size?: "sm" | "md" | "lg";
  /** UI language: en, zh-TW, zh-CN, ja. Tags such as zh-Hant-HK and ja-JP are also accepted */
  locale?: string;
  /** Overrides the built-in strings. Takes priority over locale */
  labels?: Partial<CopyCodeButtonLabels>;
  className?: string;
}

export interface CopyCodeButtonLabels {
  /** Visible button text */
  button: ReactNode;
  /** Accessible name of the button */
  copy: (code: string) => string;
  /** Announced to screen readers */
  copied: string;
  /** Stamp text pressed onto the slip after copying */
  stamp: ReactNode;
  failed: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** Maps any language tag to one of the four built-in languages, falling back to English */
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

// Design language (DESIGN.md, craft quality): surface, hairline, text colour, brand accent
const surface = "bg-card shadow-[0_1px_2px_rgb(0_0_0/0.05),0_4px_12px_-6px_rgb(0_0_0/0.06)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]";
// The dashed line uses a faint text colour; a border colour would be almost invisible on the surface
const edge = "border-foreground/25";
const ink = "text-foreground";
const inkMuted = "text-muted-foreground";
/** Brand accent: follows the theme's --primary by default; buyers set --sunui-spot to use their own brand colour. Used only for selected state, offers and current progress */
const spot = "text-[color:var(--sunui-spot,var(--primary))]";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
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
    // Without permission, in an old browser, or in an insecure context, fall back to the approach below
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
        "relative inline-flex max-w-full items-stretch rounded-md border font-sans",
        surface,
        edge,
        ink,
        s.root,
        className,
      )}
    >
      {caption && (
        <span
          className={cn(
            "flex min-w-0 items-center border-r font-medium tracking-[0.14em] whitespace-nowrap uppercase",
            edge,
            inkMuted,
            s.caption,
          )}
        >
          <span className="truncate">{caption}</span>
        </span>
      )}
      {/* The code stays selectable as a fallback when the clipboard fails; after copying the stamp lands on the code and the code fades into an ink impression */}
      <span className={cn("relative flex shrink-0 items-center", s.code)}>
        <span
          id={codeId}
          className={cn(
            "font-mono font-semibold tracking-[0.12em] uppercase transition-opacity select-all",
            spot,
            copied && "opacity-20",
          )}
        >
          {code}
        </span>
        <AnimatePresence>
          {copied && (
            <motion.span key={stampKey} exit={{ opacity: 0, transition: { duration: 0.15 } }} className="pointer-events-none absolute inset-0 grid place-items-center font-sans">
              <Result shape="tick" seed={code} size={size}>
                {t.stamp}
              </Result>
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
          "flex shrink-0 items-center gap-1.5 rounded-r-[5px] border-l font-medium transition-colors",
          "hover:bg-[#171717]/[0.04] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset dark:hover:bg-[#ededed]/[0.06]",
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
