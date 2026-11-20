"use client";

import { AnimatePresence, motion, useAnimate, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState, type ChangeEvent, type FocusEvent, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  gentle: { type: "spring", stiffness: 240, damping: 30 },
  pop: { type: "spring", stiffness: 620, damping: 20, mass: 0.8 },
} as const;

/** Returning a string means an error message; returning true or undefined means it passed */
export type FieldValidator = (value: string) => string | true | undefined | null;

export interface FloatingFieldLabels {
  /** Sentence for the suggested fix; s is the clickable suggested value */
  didYouMean: (s: ReactNode) => ReactNode;
  /** Strength mode: status words for strength 0 to 4 (0 is empty) */
  strength: [string, string, string, string, string];
  /** Prefix when screen readers announce the strength */
  strengthPrefix: string;
  met: string;
  unmet: string;
  /** Text of the four built-in password rules */
  rules: { length: string; case: string; number: string; symbol: string };
}

export interface PasswordRule {
  id: string;
  label: ReactNode;
  /** Return true when met */
  test: (value: string) => boolean;
}

/** 0: empty; 1: weak; 2: fair; 3: good; 4: strong (all rules met) */
export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, FloatingFieldLabels> = {
  en: {
    didYouMean: (s) => <>Did you mean {s}?</>,
    strength: ["", "Weak", "Fair", "Good", "Strong"],
    strengthPrefix: "Password strength",
    met: "met",
    unmet: "not met",
    rules: { length: "At least 8 characters", case: "Upper and lowercase", number: "A number", symbol: "A symbol" },
  },
  "zh-TW": {
    didYouMean: (s) => <>是不是 {s}？</>,
    strength: ["", "弱", "普通", "良好", "強"],
    strengthPrefix: "密碼強度",
    met: "已符合",
    unmet: "未符合",
    rules: { length: "至少 8 個字元", case: "大小寫字母", number: "包含數字", symbol: "包含符號" },
  },
  "zh-CN": {
    didYouMean: (s) => <>是不是 {s}？</>,
    strength: ["", "弱", "一般", "良好", "强"],
    strengthPrefix: "密码强度",
    met: "已符合",
    unmet: "未符合",
    rules: { length: "至少 8 个字符", case: "大小写字母", number: "包含数字", symbol: "包含符号" },
  },
  ja: {
    didYouMean: (s) => <>{s} ではありませんか？</>,
    strength: ["", "弱い", "普通", "良い", "強い"],
    strengthPrefix: "パスワードの強度",
    met: "達成",
    unmet: "未達成",
    rules: { length: "8 文字以上", case: "大文字と小文字", number: "数字を含む", symbol: "記号を含む" },
  },
};

/** The four built-in password rules, text follows locale */
export function passwordRules(locale?: string): PasswordRule[] {
  const r = MESSAGES[resolveLocale(locale)].rules;
  return [
    { id: "length", label: r.length, test: (v) => v.length >= 8 },
    { id: "case", label: r.case, test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
    { id: "number", label: r.number, test: (v) => /\d/.test(v) },
    { id: "symbol", label: r.symbol, test: (v) => /[^A-Za-z0-9\s]/.test(v) },
  ];
}

/** Strength bar fill: the first three levels are shades of the foreground; only all-met uses the brand spot colour */
const FILL = ["", "bg-foreground/30", "bg-foreground/50", "bg-foreground/70", "bg-[color:var(--sunui-spot,var(--primary))]"];

export interface FloatingFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement & HTMLTextAreaElement>, "value" | "defaultValue" | "onChange" | "size"> {
  label: ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Synchronous validation; return a message string on error */
  validate?: FieldValidator;
  /** change: validate live while typing (after the first time the field is left); blur: validate only on leaving */
  validateOn?: "change" | "blur";
  /** Message shown when validation passes, e.g. "Looks good" */
  successMessage?: ReactNode;
  /** Helper text that is always shown; replaced by the error message on error */
  hint?: ReactNode;
  /** Error supplied from outside (e.g. returned by a server); takes priority over validate */
  error?: ReactNode;
  multiline?: boolean;
  rows?: number;
  /** Extra element on the right of the field, e.g. a show-password button */
  trailing?: ReactNode;
  /** Format template: 9 is a digit, A is a letter, * is any character, anything else is a separator inserted automatically, e.g. "999-9999". Remaining slots show in grey */
  mask?: string;
  /** Offers a fix suggestion after leaving the field (e.g. suggestEmail); return null for no suggestion */
  suggest?: (value: string) => string | null | undefined;
  /** UI language: en, zh-TW, zh-CN, ja. Tags such as zh-Hant-HK and ja-JP are also accepted */
  locale?: string;
  /** Overrides the built-in strings. Takes priority over locale */
  labels?: Partial<FloatingFieldLabels>;
  /** Password strength mode: a four-segment strength bar and a live checklist below the field. The show-password button still goes in trailing */
  strength?: boolean;
  /** Rules for strength mode, defaults to passwordRules(locale) */
  rules?: PasswordRule[];
  /** Fires when the strength level changes; allPassed means every rule is met */
  onStrengthChange?: (strength: PasswordStrength, allPassed: boolean) => void;
}

const SLOT: Record<string, RegExp> = { "9": /\d/, A: /[a-z]/i, "*": /\S/ };
const GHOST: Record<string, string> = { "9": "0", A: "A", "*": "_" };

/** Brand accent: follows the theme's --primary by default; buyers set --sunui-spot to use their own brand colour. Used only for selected state, offers and current progress */
const spotBorder = "border-[color:var(--sunui-spot,var(--primary))]";

/** Normalizes input by the template: keeps only characters that fit a slot, and inserts a separator once the next slot has a character */
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

/** Edit distance that allows swapping two adjacent characters (gmial vs gmail differ by only 1) */
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

/** Spelling suggestions for common mail domains: gmial.com → gmail.com, hotmal.con → hotmail.com */
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

/** Finds the middle segment that changed between the old and new strings; the unchanged prefix and suffix are left alone */
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
  strength: strengthMode = false,
  rules: rulesProp,
  onStrengthChange,
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
  const meterId = `${id}-meter`;
  const [inner, setInner] = useState(defaultValue);
  const value = valueProp ?? inner;
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [dismissed, setDismissed] = useState<string | null>(null);
  // Brief letter morph after applying a suggestion: [prefix, changed characters, suffix]
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
  // Offer a suggestion when not in the field (including pre-filled values); do not interrupt while typing
  const suggestion = !error && !focused && suggest && value ? suggest(value) : null;
  const offer = suggestion && suggestion !== value && suggestion !== dismissed ? suggestion : null;
  const valid = !error && !offer && !!validate && !!value && !ownError && (validateOn === "change" || !focused);
  const floated = focused || value.length > 0;
  const ghost = mask && floated ? mask.slice(value.length).replace(/[9A*]/g, (m) => GHOST[m]) : "";
  const count = maxLength && maxLength > 0 ? value.length : null;

  const rules = strengthMode ? (rulesProp ?? passwordRules(locale)) : [];
  const checks = rules.map((r) => ({ ...r, passed: r.test(value) }));
  const passed = checks.filter((c) => c.passed).length;
  const allPassed = rules.length > 0 && passed === rules.length;
  // Any input that meets no rule still counts as 1, so the user sees feedback
  const level = (value && rules.length ? Math.max(1, Math.round((passed / rules.length) * 4)) : 0) as PasswordStrength;
  const strengthCb = useRef(onStrengthChange);
  strengthCb.current = onStrengthChange;
  useEffect(() => {
    if (strengthMode) strengthCb.current?.(level, allPassed);
  }, [strengthMode, level, allPassed]);

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
    "peer w-full bg-transparent px-3 text-sm text-foreground outline-none",
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
    "aria-describedby":
      [error || offer || hint || (valid && successMessage) ? msgId : null, strengthMode ? meterId : null].filter(Boolean).join(" ") || undefined,
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
          "relative rounded-xl border bg-card transition-colors shadow-[0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]",
          error ? "border-destructive" : valid ? "border-emerald-700/60 dark:border-emerald-400/60" : focused ? spotBorder : "border-foreground/10",
        )}
      >
        {multiline ? <textarea rows={rows} {...common} /> : <input {...common} />}

        {/* A line stacked over the input text: typed characters are transparent placeholders followed by the grey remaining slots; when a suggestion is applied it shows the morphing characters instead */}
        {!multiline && (ghost || morph) && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-3 top-6 flex h-6 items-center overflow-hidden text-sm whitespace-pre">
            {morph ? (
              <span className="text-foreground">
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
                <span className="text-foreground/30">{ghost}</span>
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
            error ? "text-destructive" : floated ? "text-muted-foreground" : "text-muted-foreground",
          )}
        >
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </motion.label>

        {/* Character count: typing is high frequency, so the number does not scroll; turns to text colour when a tenth remains */}
        {count !== null && floated && (
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute top-1.5 right-3 text-[11px] tabular-nums",
              count >= maxLength! * 0.9 ? "text-foreground" : "text-foreground/45",
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
      {strengthMode && (
        <div id={meterId} className="px-1 pt-2">
          <div className="flex items-center gap-3">
            <div aria-hidden="true" className="flex flex-1 gap-1">
              {[1, 2, 3, 4].map((seg) => (
                <span key={seg} className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted shadow-[inset_0_1px_2px_rgb(0_0_0/0.06)]">
                  <motion.span
                    className={cn("absolute inset-0 origin-left rounded-full transition-colors duration-200", FILL[level])}
                    initial={false}
                    animate={{ scaleX: level >= seg ? 1 : 0 }}
                    transition={reduce ? { duration: 0 } : { ...springs.gentle, delay: (level >= seg ? seg - 1 : 4 - seg) * 0.04 }}
                  />
                </span>
              ))}
            </div>
            <span aria-hidden="true" className={cn("min-w-10 text-right text-xs font-medium", level === 4 ? "text-[color:var(--sunui-spot,var(--primary))]" : level ? "text-foreground" : "text-muted-foreground")}>
              {t.strength[level]}
            </span>
          </div>
          {/* Text changes only when the level changes, so it is not announced on every keystroke */}
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {level ? `${t.strengthPrefix}: ${t.strength[level]}` : ""}
          </p>
          <ul className="grid gap-x-3 gap-y-1 pt-2 text-xs sm:grid-cols-2">
            {checks.map((c) => (
              <li key={c.id} className={cn("flex items-center gap-1.5 transition-colors", c.passed ? "text-foreground" : "text-muted-foreground")}>
                <motion.span
                  aria-hidden="true"
                  initial={false}
                  animate={{ scale: c.passed && !reduce ? [0.7, 1] : 1 }}
                  transition={springs.pop}
                  className={cn(
                    "grid size-3.5 shrink-0 place-items-center rounded-full transition-colors",
                    c.passed
                      ? "bg-[color:var(--sunui-spot,var(--primary))] text-[color:var(--sunui-spot-foreground,var(--primary-foreground))] shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]"
                      : "bg-muted shadow-[inset_0_1px_2px_rgb(0_0_0/0.06)]",
                  )}
                >
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-2.5">
                    <motion.path
                      d="M3 6.2l2 2L9 4"
                      initial={false}
                      animate={{ pathLength: c.passed ? 1 : 0, opacity: c.passed ? 1 : 0 }}
                      transition={{ duration: reduce ? 0 : 0.2, ease: "easeOut" }}
                    />
                  </svg>
                </motion.span>
                <span>
                  {c.label}
                  <span className="sr-only">, {c.passed ? t.met : t.unmet}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
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
              className={cn("text-xs", error ? "text-destructive" : valid && successMessage && !offer ? "text-emerald-700 dark:text-emerald-400" : offer ? "text-foreground" : "text-muted-foreground")}
            >
              {error ??
                (offer
                  ? t.didYouMean(
                      <button
                        type="button"
                        onClick={() => accept(offer)}
                        className="rounded-sm font-medium underline underline-offset-4 outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-[0.97] transition-[color,background-color,border-color,opacity,scale]"
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
