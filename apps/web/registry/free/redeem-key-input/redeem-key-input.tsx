"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useId, useState, type FormEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type RedeemStatus = "idle" | "checking" | "error" | "redeemed";

export interface RedeemResult {
  title?: ReactNode;
  detail?: ReactNode;
}

export interface RedeemKeyFormat {
  name: ReactNode;
  /** 收到去掉分隔符號後的大寫字串 */
  test: (raw: string) => boolean;
}

export interface RedeemKeyInputLabels {
  title?: ReactNode;
  hint?: ReactNode;
  field?: string;
  redeem?: ReactNode;
  checking?: ReactNode;
  stamp?: ReactNode;
  incomplete?: (remaining: number) => ReactNode;
  fallbackError?: string;
  redeemedAnnouncement?: (code: string) => string;
}

export interface RedeemKeyInputProps {
  /** 每組字元數 */
  groupSize?: number;
  /** 不含分隔符號的總長度 */
  length?: number;
  formats?: RedeemKeyFormat[];
  onRedeem?: (code: string) => Promise<RedeemResult | void> | RedeemResult | void;
  redeemed?: boolean;
  defaultRedeemed?: boolean;
  defaultCode?: string;
  /** 已兌換時顯示的結果（受控或預設已兌換時使用） */
  result?: RedeemResult;
  placeholder?: string;
  labels?: RedeemKeyInputLabels;
  className?: string;
}

const defaultLabels: Required<RedeemKeyInputLabels> = {
  title: "Redeem a code",
  hint: "Gift cards, license keys and promo codes",
  field: "Code",
  redeem: "Redeem",
  checking: "Checking",
  stamp: "Redeemed",
  incomplete: (n) => <>{n} more characters</>,
  fallbackError: "Couldn't redeem this code. Try again.",
  redeemedAnnouncement: (code) => `Code ${code} redeemed.`,
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

const clean = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

function group(raw: string, size: number) {
  return raw.match(new RegExp(`.{1,${size}}`, "g"))?.join("-") ?? "";
}

export function RedeemKeyInput({
  groupSize = 4,
  length = 12,
  formats,
  onRedeem,
  redeemed: redeemedProp,
  defaultRedeemed = false,
  defaultCode = "",
  result: resultProp,
  placeholder,
  labels,
  className,
}: RedeemKeyInputProps) {
  const t = { ...defaultLabels, ...labels };
  const reduceMotion = useReducedMotion();
  const id = useId();

  const [raw, setRaw] = useState(() => clean(defaultCode).slice(0, length));
  const [redeemedState, setRedeemedState] = useState(defaultRedeemed);
  const redeemed = redeemedProp ?? redeemedState;
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RedeemResult | undefined>(resultProp);
  const [announcement, setAnnouncement] = useState("");

  const status: RedeemStatus = redeemed ? "redeemed" : checking ? "checking" : error ? "error" : "idle";
  const code = group(raw, groupSize);
  const complete = raw.length === length;
  const format = raw ? formats?.find((f) => f.test(raw)) : undefined;
  const shown = resultProp ?? result;

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!complete || status === "checking" || redeemed) return;
    setChecking(true);
    setError(null);
    try {
      const r = await onRedeem?.(code);
      if (r) setResult(r);
      setRedeemedState(true);
      setAnnouncement(t.redeemedAnnouncement(code));
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : t.fallbackError;
      setError(message);
      setAnnouncement(message);
    } finally {
      setChecking(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className={cn("relative w-full max-w-md min-w-[18rem] rounded-md border p-4 font-sans", paper, edge, ink, className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn("text-[11px] font-medium tracking-[0.14em] uppercase", inkMuted)}>{t.title}</p>
          <p className={cn("mt-1 text-sm", inkMuted)}>{t.hint}</p>
        </div>
        <KeyIcon />
      </div>

      <div className={cn("mt-4 border-t border-dashed pt-4", edge)}>
        {redeemed ? (
          <div className="min-h-[5.5rem] pr-24">
            <p className="font-mono text-lg font-semibold tracking-[0.12em] tabular-nums select-all">{code}</p>
            {shown?.title && <p className="mt-2 text-sm font-medium">{shown.title}</p>}
            {shown?.detail && <p className={cn("mt-0.5 text-xs", inkMuted)}>{shown.detail}</p>}
          </div>
        ) : (
          <>
            <label htmlFor={`${id}-field`} className="sr-only">
              {t.field}
            </label>
            <div className="flex gap-2">
              <input
                id={`${id}-field`}
                value={code}
                onChange={(e) => {
                  setRaw(clean(e.target.value).slice(0, length));
                  if (error) setError(null);
                }}
                placeholder={placeholder ?? group("X".repeat(length), groupSize)}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                disabled={status === "checking"}
                aria-invalid={status === "error"}
                aria-describedby={`${id}-meta`}
                className={cn(
                  "h-10 min-w-0 flex-1 rounded-md border bg-transparent px-3 font-mono text-[15px] tracking-[0.12em] uppercase tabular-nums outline-none",
                  "placeholder:text-current/25 focus-visible:ring-2 focus-visible:ring-ring",
                  edge,
                  status === "error" && "border-destructive",
                )}
              />
              <motion.button
                type="submit"
                aria-disabled={!complete || status === "checking"}
                whileTap={reduceMotion || !complete ? undefined : { scale: 0.96 }}
                transition={springs.snappy}
                className="h-10 shrink-0 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
              >
                {status === "checking" ? t.checking : t.redeem}
              </motion.button>
            </div>
            <p id={`${id}-meta`} className="mt-2 min-h-[2.5rem] text-xs leading-5">
              {status === "error" ? (
                <span className="text-destructive">{error}</span>
              ) : (
                <span className={cn("flex flex-wrap gap-x-3 tabular-nums", inkMuted)}>
                  {format && <span className="font-medium">{format.name}</span>}
                  {raw && !complete && <span>{t.incomplete(length - raw.length)}</span>}
                </span>
              )}
            </p>
          </>
        )}
      </div>

      <AnimatePresence initial={false}>
        {redeemed && (
          <motion.span
            key="stamp"
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute right-5 bottom-5 rounded-[3px] border-2 border-current px-2 py-0.5 text-xs font-bold tracking-[0.2em] whitespace-nowrap uppercase mix-blend-multiply dark:mix-blend-screen",
              vermilion,
            )}
            initial={reduceMotion ? false : { scale: 1.6, opacity: 0, rotate: -4 }}
            animate={{ scale: 1, opacity: 0.9, rotate: -10 }}
            transition={springs.stamp}
          >
            {t.stamp}
          </motion.span>
        )}
      </AnimatePresence>

      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </form>
  );
}

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0 opacity-50" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 8-8M16 7l2 2M14 9l2 2" strokeLinecap="round" />
    </svg>
  );
}
