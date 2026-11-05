"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useState, type CSSProperties, type ReactNode } from "react";

import { Stamp } from "@/components/ui/stamp";
import { cn } from "@/lib/utils";

export interface CookieCategory {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  /** 必要類別永遠開啟，不能關 */
  required?: boolean;
}

export type CookieConsentValue = Record<string, boolean>;

export interface CookieConsentLabels {
  eyebrow?: ReactNode;
  title?: ReactNode;
  body?: ReactNode;
  policy?: ReactNode;
  rejectAll?: ReactNode;
  acceptAll?: ReactNode;
  customize?: ReactNode;
  save?: ReactNode;
  alwaysOn?: ReactNode;
  stamp?: ReactNode;
}

export interface CookieConsentProps {
  categories: CookieCategory[];
  /** 使用者做出選擇時呼叫，在這裡寫 cookie 或通知分析工具 */
  onChange: (consent: CookieConsentValue) => void;
  /** 有值時把選擇記在 localStorage，已選過的人不再出現 */
  storageKey?: string;
  policyHref?: string;
  /** fixed：貼在視窗底部；contained：貼在最近的 relative 容器底部 */
  position?: "fixed" | "contained";
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 ja-JP 這類標籤 */
  locale?: string;
  labels?: CookieConsentLabels;
  className?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, Required<CookieConsentLabels>> = {
  en: {
    eyebrow: "Cookies",
    title: "Your choice, either way",
    body: "We use necessary cookies to keep the cart and checkout working. Others are optional and only set if you allow them.",
    policy: "Cookie policy",
    rejectAll: "Reject all",
    acceptAll: "Accept all",
    customize: "Customize",
    save: "Save choices",
    alwaysOn: "Always on",
    stamp: "Saved",
  },
  "zh-TW": {
    eyebrow: "Cookie",
    title: "接受或拒絕，都由你決定",
    body: "必要的 Cookie 用來維持購物車與結帳正常運作，其他類別都是選用，只有你同意才會設定。",
    policy: "Cookie 政策",
    rejectAll: "全部拒絕",
    acceptAll: "全部接受",
    customize: "自訂",
    save: "儲存選擇",
    alwaysOn: "一律開啟",
    stamp: "已記錄",
  },
  "zh-CN": {
    eyebrow: "Cookie",
    title: "接受或拒绝，都由你决定",
    body: "必要的 Cookie 用于维持购物车和结账正常运行，其他类别均为可选，只有你同意才会设置。",
    policy: "Cookie 政策",
    rejectAll: "全部拒绝",
    acceptAll: "全部接受",
    customize: "自定义",
    save: "保存选择",
    alwaysOn: "始终开启",
    stamp: "已记录",
  },
  ja: {
    eyebrow: "Cookie",
    title: "許可も拒否も、お客様の自由です",
    body: "カートと決済を動かすために必要な Cookie を使います。それ以外は任意で、許可された場合のみ設定します。",
    policy: "Cookie ポリシー",
    rejectAll: "すべて拒否",
    acceptAll: "すべて許可",
    customize: "カスタマイズ",
    save: "選択を保存",
    alwaysOn: "常に有効",
    stamp: "記録済み",
  },
};

const paper = "bg-[#f7f7f7] dark:bg-[#1c1c1c]";
const edge = "border-[#e2e2e2] dark:border-[#333333]";
const ink = "text-[#171717] dark:text-[#ededed]";
const inkMuted = "text-[#171717]/65 dark:text-[#ededed]/65";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  gentle: { type: "spring", stiffness: 240, damping: 30 },
} as const;

/** 紙條頂端的打孔線兩端各挖一個半圓缺口 */
const notches: CSSProperties = (() => {
  const mask = "radial-gradient(circle 7px at 0 28px, #0000 97%, #000), radial-gradient(circle 7px at 100% 28px, #0000 97%, #000)";
  return { maskImage: mask, WebkitMaskImage: mask, maskComposite: "intersect", WebkitMaskComposite: "source-in" };
})();

/** 蓋完章停留多久再收起 */
const STAMP_HOLD = 700;

export function CookieConsent({ categories, onChange, storageKey, policyHref, position = "fixed", locale = "en", labels, className }: CookieConsentProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const reduce = useReducedMotion() ?? false;
  const id = useId();
  // 有 storageKey 時掛載後才知道是否選過，先不渲染，避免選過的人看到一閃
  const [open, setOpen] = useState(!storageKey);
  const [customizing, setCustomizing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [choice, setChoice] = useState<CookieConsentValue>(() => Object.fromEntries(categories.map((c) => [c.id, !!c.required])));

  useEffect(() => {
    if (!storageKey) return;
    try {
      setOpen(window.localStorage.getItem(storageKey) === null);
    } catch {
      setOpen(true);
    }
  }, [storageKey]);

  function commit(value: CookieConsentValue) {
    if (saved) return;
    setChoice(value);
    setSaved(true);
    onChange(value);
    if (storageKey) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(value));
      } catch {
        // 隱私模式時只在這次瀏覽生效
      }
    }
    window.setTimeout(() => setOpen(false), STAMP_HOLD);
  }

  const all = (on: boolean) => Object.fromEntries(categories.map((c) => [c.id, on || !!c.required]));

  // 拒絕與接受必須同等份量，不用顏色或大小誘導（GDPR、台灣個資法）
  const choiceButton = cn(
    "min-h-10 rounded-md border px-4 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-60",
    edge,
    "bg-background hover:bg-accent",
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.section
          role="region"
          aria-labelledby={`${id}-title`}
          initial={reduce ? false : { y: "110%" }}
          animate={{ y: 0 }}
          exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { y: "110%" }}
          transition={springs.gentle}
          className={cn(position === "fixed" ? "fixed" : "absolute", "inset-x-3 bottom-3 z-50 mx-auto max-w-xl font-sans sm:inset-x-6", ink, className)}
        >
          <div style={notches} className={cn("relative overflow-hidden rounded-md border", paper, edge)}>
            <div className={cn("flex h-14 items-center gap-2 border-b border-dashed px-5", edge)}>
              <span className={cn("text-[11px] font-semibold tracking-[0.14em] uppercase", inkMuted)}>{t.eyebrow}</span>
            </div>

            <div className="flex flex-col gap-4 px-5 pt-4 pb-5">
              <div>
                <h2 id={`${id}-title`} className="text-base font-semibold tracking-tight">
                  {t.title}
                </h2>
                <p className={cn("mt-1 text-sm leading-6 text-pretty", inkMuted)}>
                  {t.body}
                  {policyHref && (
                    <a href={policyHref} className="ml-1 whitespace-nowrap underline decoration-1 underline-offset-4 hover:decoration-2 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                      {t.policy}
                    </a>
                  )}
                </p>
              </div>

              <AnimatePresence initial={false}>
                {customizing && (
                  <motion.ul
                    initial={reduce ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { height: 0, opacity: 0 }}
                    transition={springs.gentle}
                    className={cn("divide-y divide-dashed overflow-hidden border-y border-dashed", edge, "divide-[#e2e2e2] dark:divide-[#333333]")}
                  >
                    {categories.map((c) => (
                      <li key={c.id} className="flex items-start justify-between gap-4 py-3">
                        <div className="min-w-0 text-sm">
                          <p id={`${id}-${c.id}`} className="font-medium">
                            {c.label}
                          </p>
                          {c.description && <p className={cn("mt-0.5 text-xs leading-5", inkMuted)}>{c.description}</p>}
                        </div>
                        {c.required ? (
                          <span className={cn("shrink-0 pt-0.5 text-xs", inkMuted)}>{t.alwaysOn}</span>
                        ) : (
                          <Switch
                            on={choice[c.id]}
                            labelledBy={`${id}-${c.id}`}
                            reduce={reduce}
                            onToggle={() => setChoice((v) => ({ ...v, [c.id]: !v[c.id] }))}
                          />
                        )}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-2 items-center gap-2 sm:flex">
                <button type="button" disabled={saved} onClick={() => commit(all(false))} className={choiceButton}>
                  {t.rejectAll}
                </button>
                <button type="button" disabled={saved} onClick={() => commit(all(true))} className={choiceButton}>
                  {t.acceptAll}
                </button>
                <button
                  type="button"
                  disabled={saved}
                  aria-expanded={customizing}
                  onClick={() => (customizing ? commit(choice) : setCustomizing(true))}
                  className="min-h-10 rounded-md px-3 text-sm font-medium underline decoration-1 underline-offset-4 hover:decoration-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-60 max-sm:col-span-2 sm:ml-auto"
                >
                  {customizing ? t.save : t.customize}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {saved && (
                <Stamp key="saved" shape="tick" seed="consent" className="absolute top-5 right-5">
                  {t.stamp}
                </Stamp>
              )}
            </AnimatePresence>
            <span role="status" className="sr-only">
              {saved ? t.stamp : ""}
            </span>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

function Switch({ on, labelledBy, reduce, onToggle }: { on: boolean; labelledBy: string; reduce: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-labelledby={labelledBy}
      onClick={onToggle}
      className={cn(
        "relative flex h-6 w-10 shrink-0 items-center rounded-full border px-0.5 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        on ? "justify-end border-primary bg-primary" : cn("justify-start bg-background", edge),
      )}
    >
      <motion.span layout transition={reduce ? { duration: 0 } : springs.snappy} className={cn("block size-4 rounded-full", on ? "bg-primary-foreground" : "bg-muted-foreground/50")} />
    </button>
  );
}
