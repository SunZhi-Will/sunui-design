"use client";

import { AnimatePresence, motion, useAnimate, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState, type ChangeEvent, type FocusEvent, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
} as const;

/** 回傳字串代表錯誤訊息；回傳 true 或 undefined 代表通過 */
export type FieldValidator = (value: string) => string | true | undefined | null;

export interface FloatingFieldLabels {
  /** 建議修正的句子，s 是可點的建議值 */
  didYouMean: (s: ReactNode) => ReactNode;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, FloatingFieldLabels> = {
  en: { didYouMean: (s) => <>Did you mean {s}?</> },
  "zh-TW": { didYouMean: (s) => <>是不是 {s}？</> },
  "zh-CN": { didYouMean: (s) => <>是不是 {s}？</> },
  ja: { didYouMean: (s) => <>{s} ではありませんか？</> },
};

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
  /** 格式範本：9 是數字、A 是字母、* 是任意字，其他是自動補上的分隔符，例如 "999-9999"。剩下的格子以灰字顯示 */
  mask?: string;
  /** 離開欄位後提出修正建議（例如 suggestEmail），回傳 null 表示沒有建議 */
  suggest?: (value: string) => string | null | undefined;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<FloatingFieldLabels>;
}

const SLOT: Record<string, RegExp> = { "9": /\d/, A: /[a-z]/i, "*": /\S/ };
const GHOST: Record<string, string> = { "9": "0", A: "A", "*": "_" };

/** 品牌專色：預設跟著主題的 --primary，買家設 --sunui-spot 就換成自己的品牌色。只用在選中、優惠、目前進度 */
const spotBorder = "border-[color:var(--sunui-spot,var(--primary))]";

/** 依範本整理輸入：只留填得進格子的字，分隔符在下一格有字時自動補上 */
export function applyMask(input: string, mask: string): string {
  const chars = input.split("").filter((c) => Object.values(SLOT).some((r) => r.test(c)));
  let out = "";
  let pending = "";
  for (const m of mask) {
    if (!chars.length) break;
    if (SLOT[m]) {
      const i = chars.findIndex((c) => SLOT[m].test(c));
      if (i < 0) break;
      out += pending + chars[i];
      pending = "";
      chars.splice(0, i + 1);
    } else pending += m;
  }
  return out;
}

const DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "live.com", "msn.com", "me.com", "yahoo.com.tw", "yahoo.co.jp", "qq.com", "163.com", "proton.me"];

/** 允許相鄰兩字對調的編輯距離（gmial 對 gmail 只差 1） */
function distance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)] as number[]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  return d[a.length][b.length];
}

/** 常見信箱網域的拼字建議：gmial.com → gmail.com、hotmal.con → hotmail.com */
export function suggestEmail(value: string, domains: string[] = DOMAINS): string | null {
  const at = value.lastIndexOf("@");
  if (at < 1) return null;
  const domain = value.slice(at + 1).toLowerCase();
  if (domain.length < 4 || domains.includes(domain)) return null;
  let best: string | null = null;
  let score = 3;
  for (const d of domains) {
    const s = distance(domain, d);
    if (s < score) [best, score] = [d, s];
  }
  return best ? value.slice(0, at + 1) + best : null;
}

/** 找出新舊字串中間改到的那段，前後相同的部分不動 */
function diff(a: string, b: string) {
  let p = 0;
  while (p < a.length && p < b.length && a[p] === b[p]) p++;
  let s = 0;
  while (s < a.length - p && s < b.length - p && a[a.length - 1 - s] === b[b.length - 1 - s]) s++;
  return [b.slice(0, p), b.slice(p, b.length - s), b.slice(b.length - s)] as const;
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
  mask,
  suggest,
  locale,
  labels,
  className,
  id: idProp,
  onBlur,
  onFocus,
  required,
  maxLength,
  ...rest
}: FloatingFieldProps) {
  const reduce = useReducedMotion();
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const autoId = useId();
  const id = idProp ?? autoId;
  const msgId = `${id}-msg`;
  const [inner, setInner] = useState(defaultValue);
  const value = valueProp ?? inner;
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [dismissed, setDismissed] = useState<string | null>(null);
  // 套用建議後的短暫字母變形：[前段, 改到的字, 後段]
  const [morph, setMorph] = useState<readonly [string, string, string] | null>(null);
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const fieldRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!morph) return;
    const timer = setTimeout(() => setMorph(null), 450);
    return () => clearTimeout(timer);
  }, [morph]);

  const result = validate && value ? validate(value) : undefined;
  const ownError = typeof result === "string" ? result : undefined;
  const showOwn = touched && (validateOn === "change" || !focused);
  const error = errorProp ?? (showOwn ? ownError : undefined);
  // 不在欄位裡就提出建議（含預先帶入的值），正在打字時不打擾
  const suggestion = !error && !focused && suggest && value ? suggest(value) : null;
  const offer = suggestion && suggestion !== value && suggestion !== dismissed ? suggestion : null;
  const valid = !error && !offer && !!validate && !!value && !ownError && (validateOn === "change" || !focused);
  const floated = focused || value.length > 0;
  const ghost = mask && floated ? mask.slice(value.length).replace(/[9A*]/g, (m) => GHOST[m]) : "";
  const count = maxLength && maxLength > 0 ? value.length : null;

  const set = (next: string) => {
    if (valueProp === undefined) setInner(next);
    onValueChange?.(next);
  };

  const shake = () => {
    if (reduce || !scope.current) return;
    void animate(scope.current, { x: [0, -6, 5, -3, 2, 0] }, { duration: 0.32, ease: "easeOut" });
  };

  const accept = (next: string) => {
    if (!reduce) setMorph(diff(value, next));
    setDismissed(next);
    set(next);
    fieldRef.current?.focus();
  };

  const fieldClass = cn(
    "peer w-full bg-transparent px-3 text-sm text-[#171717] outline-none dark:text-[#ededed]",
    multiline ? "min-h-24 resize-y pb-2 pt-6" : "h-14 pb-2 pt-6",
    (trailing || valid) && "pr-10",
    morph && "text-transparent dark:text-transparent",
  );

  const common = {
    ...rest,
    ref: fieldRef,
    id,
    required,
    maxLength,
    value,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error || offer || hint || (valid && successMessage) ? msgId : undefined,
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
    onChange: (e: ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => set(mask ? applyMask(e.target.value, mask) : e.target.value),
    className: fieldClass,
  };

  const messageKey = error ? "e" : offer ? `s-${offer}` : valid && successMessage ? "v" : hint ? "h" : null;

  return (
    <div className={cn("w-full", className)}>
      <div
        ref={scope}
        className={cn(
          "relative rounded-md border bg-[#f7f7f7] transition-colors dark:bg-[#1c1c1c]",
          error ? "border-destructive" : valid ? "border-emerald-700/60 dark:border-emerald-400/60" : focused ? spotBorder : "border-[#e2e2e2] dark:border-[#333333]",
        )}
      >
        {multiline ? <textarea rows={rows} {...common} /> : <input {...common} />}

        {/* 疊在輸入字上的同一行：打過的字透明佔位，後面接灰色的剩餘格子；套用建議時改成顯示變形中的字 */}
        {!multiline && (ghost || morph) && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-3 top-6 flex h-6 items-center overflow-hidden text-sm whitespace-pre">
            {morph ? (
              <span className="text-[#171717] dark:text-[#ededed]">
                {morph[0]}
                {morph[1].split("").map((c, i) => (
                  <motion.span
                    key={i}
                    className="inline-block whitespace-pre"
                    initial={{ y: "-55%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ ...springs.snappy, delay: i * 0.04 }}
                  >
                    {c}
                  </motion.span>
                ))}
                {morph[2]}
              </span>
            ) : (
              <>
                <span className="text-transparent">{value}</span>
                <span className="text-[#171717]/30 dark:text-[#ededed]/30">{ghost}</span>
              </>
            )}
          </div>
        )}

        <motion.label
          htmlFor={id}
          initial={false}
          animate={floated ? { y: -10, scale: 0.86 } : { y: 0, scale: 1 }}
          transition={reduce ? { duration: 0 } : springs.snappy}
          style={{ originX: 0, originY: 0.5 }}
          className={cn(
            "pointer-events-none absolute left-3 text-sm",
            multiline ? "top-4" : "top-[1.05rem]",
            error ? "text-destructive" : floated ? "text-[#171717]/70 dark:text-[#ededed]/70" : "text-[#171717]/50 dark:text-[#ededed]/50",
          )}
        >
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </motion.label>

        {/* 字數：打字是高頻動作，數字不滾動；剩一成時轉為墨色 */}
        {count !== null && floated && (
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute top-1.5 right-3 text-[11px] tabular-nums",
              count >= maxLength! * 0.9 ? "text-[#171717] dark:text-[#ededed]" : "text-[#171717]/45 dark:text-[#ededed]/45",
            )}
          >
            {count}/{maxLength}
          </span>
        )}

        <div className={cn("absolute right-2 flex items-center gap-1", multiline ? "bottom-2" : "top-[1.05rem]")}>
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
          {messageKey && (
            <motion.p
              key={messageKey}
              id={msgId}
              role={error ? "alert" : offer ? "status" : undefined}
              initial={{ opacity: 0, y: reduce ? 0 : -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.14 }}
              className={cn("text-xs", error ? "text-destructive" : valid && successMessage && !offer ? "text-emerald-700 dark:text-emerald-400" : offer ? "text-[#171717] dark:text-[#ededed]" : "text-muted-foreground")}
            >
              {error ??
                (offer
                  ? t.didYouMean(
                      <button
                        type="button"
                        onClick={() => accept(offer)}
                        className="rounded-sm font-medium underline underline-offset-4 outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {offer}
                      </button>,
                    )
                  : valid && successMessage
                    ? successMessage
                    : hint)}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
