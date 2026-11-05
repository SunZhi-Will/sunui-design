"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// 移植自 spliteat-web 的結算頁（result-page-client.tsx）與 dinner-split 的 ResultPanel（零頭說明）。

export interface SettlementLine {
  name: string;
  amount: number;
}

export interface SettlementPerson {
  id: string;
  name: string;
  /** 每道餐點分到的金額 */
  lines: SettlementLine[];
  /** 分到的服務費、折扣 */
  fee?: number;
  discount?: number;
  /** 應付金額 */
  owe: number;
}

export interface SettlementTransfer {
  from: string;
  to: string;
  amount: number;
  /** 轉出者在名單中的位置，決定識別色 */
  fromIndex: number;
}

export interface SettlementOddment {
  item: string;
  people: string[];
}

export interface SettlementReceiptLabels {
  title?: ReactNode;
  description?: ReactNode;
  grand?: ReactNode;
  balanced?: ReactNode;
  unbalanced?: ReactNode;
  meals?: ReactNode;
  counted?: (n: number) => ReactNode;
  fee?: ReactNode;
  discount?: ReactNode;
  pending?: (n: number) => ReactNode;
  perPerson?: ReactNode;
  perPersonList?: string;
  peopleCount?: (n: number) => ReactNode;
  payer?: ReactNode;
  payerMeta?: (name: string) => ReactNode;
  nothing?: ReactNode;
  feeShare?: (amount: string) => string;
  discountShare?: (amount: string) => string;
  sumMatches?: (sum: string) => ReactNode;
  sumMismatch?: (sum: string, grand: string) => ReactNode;
  oddment?: (item: string, people: string[]) => ReactNode;
  transfers?: ReactNode;
  sendsTo?: string;
  noTransfers?: ReactNode;
  copy?: ReactNode;
  print?: ReactNode;
  copied?: ReactNode;
  closeToast?: string;
  /** 餐點明細之間的分隔 */
  separator?: string;
  /** 複製到 LINE 的純文字 */
  textTitle?: string;
  textSummary?: (meals: string, fee: string | null, discount: string | null, total: string) => string;
  textSends?: (from: string, amount: string, to: string) => string;
  textNoTransfers?: string;
  textTransfers?: (payer: string | null) => string;
}

export interface SettlementReceiptProps {
  people: SettlementPerson[];
  transfers: SettlementTransfer[];
  /** 先付整筆帳單的人 */
  payer: string | null;
  /** 餐點小計、服務費、折扣、整筆帳單 */
  subtotal: number;
  fee?: number;
  discount?: number;
  grand: number;
  /** 已算進去的餐點數 */
  counted?: number;
  /** 還沒算進去的餐點數，大於 0 顯示提醒列 */
  pending?: number;
  onFixPending?: () => void;
  /** 分不盡的零頭由誰多付（dinner-split 的說明列） */
  oddments?: SettlementOddment[];
  /** 複製到 LINE 的文字；不給就依資料組出一份 */
  copyText?: string | (() => string);
  onCopied?: (text: string) => void;
  /** 預設呼叫 window.print() */
  onPrint?: () => void;
  showHeader?: boolean;
  formatAmount?: (n: number) => string;
  /** 只用在整筆帳單的數字 */
  accent?: string;
  accentDark?: string;
  /** 成員識別色；預設照 spliteat-web 的色盤 */
  colorOf?: (index: number) => { bg: string; fg: string };
  /** 「已複製」提示是否 fixed 在視窗上方；false 交給父層定位 */
  fixed?: boolean;
  /** 介面語言與數字格式：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: SettlementReceiptLabels;
  className?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, Required<SettlementReceiptLabels>> = {
  en: {
    title: "Settle up",
    description: "What everyone owes and who pays whom. Copy it to LINE and you are done.",
    grand: "Whole bill",
    balanced: "Totals match",
    unbalanced: "Totals do not match",
    meals: "Meals",
    counted: (n) => `${n} counted`,
    fee: "Service fee",
    discount: "Discount",
    pending: (n) => `${n} ${n === 1 ? "dish is" : "dishes are"} not counted yet. Fix them on the dishes step.`,
    perPerson: "What everyone owes",
    perPersonList: "Amount owed by each person",
    peopleCount: (n) => `${n} ${n === 1 ? "person" : "people"}`,
    payer: "Paid",
    payerMeta: (name) => `${name} paid`,
    nothing: "Nothing eaten this time",
    feeShare: (a) => `, service fee ${a}`,
    discountShare: (a) => `, discount −${a}`,
    sumMatches: (sum) => `Everyone adds up to ${sum}, exactly the whole bill`,
    sumMismatch: (sum, grand) => `The total ${sum} differs from the bill ${grand}. Please report this.`,
    oddment: (item, people) => `${item} does not split evenly, so ${people.join(", ")} ${people.length > 1 ? "each pay" : "pays"} 1 more`,
    transfers: "Transfers",
    sendsTo: "sends to",
    noTransfers: "No one needs to transfer.",
    copy: "Copy to LINE",
    print: "Print",
    copied: "Copied. Paste it into the LINE group.",
    closeToast: "Close toast",
    separator: ", ",
    textTitle: "Dinner split",
    textSummary: (m, f, d, t) => `Meals ${m}${f ? ` + service fee ${f}` : ""}${d ? ` − discount ${d}` : ""} = total ${t}`,
    textSends: (from, a, to) => `${from} sends ${a} to ${to}`,
    textNoTransfers: "No one needs to transfer",
    textTransfers: (payer) => `Transfers (${payer} paid):`,
  },
  "zh-TW": {
    title: "結算",
    description: "每個人該付多少、誰轉給誰，複製到 LINE 就完成了。",
    grand: "整筆帳單",
    balanced: "金額相符",
    unbalanced: "金額不符",
    meals: "餐點",
    counted: (n) => `已算 ${n} 道`,
    fee: "服務費",
    discount: "折扣",
    pending: (n) => `還有 ${n} 道餐點沒算進去，請回到餐點步驟處理。`,
    perPerson: "每個人該付",
    perPersonList: "每個人的應付金額",
    peopleCount: (n) => `${n} 人`,
    payer: "先付",
    payerMeta: (name) => `${name} 先付`,
    nothing: "這次沒有點餐",
    feeShare: (a) => `，服務費 ${a}`,
    discountShare: (a) => `，折扣 −${a}`,
    sumMatches: (sum) => `大家加起來 ${sum}，剛好等於整筆帳單`,
    sumMismatch: (sum, grand) => `加總 ${sum} 與帳單 ${grand} 不符，請回報這個問題。`,
    oddment: (item, people) => `${item} 無法整除，由 ${people.join("、")} ${people.length > 1 ? "各" : ""}多付 1 元`,
    transfers: "轉帳",
    sendsTo: "轉給",
    noTransfers: "不需要任何人轉帳。",
    copy: "複製到 LINE",
    print: "列印",
    copied: "已複製，貼到 LINE 群組就好。",
    closeToast: "關閉提示",
    separator: "、",
    textTitle: "聚餐分帳",
    textSummary: (m, f, d, t) => `餐點 ${m}${f ? ` + 服務費 ${f}` : ""}${d ? ` − 折扣 ${d}` : ""} = 總計 ${t}`,
    textSends: (from, a, to) => `${from} 轉 ${a} 給 ${to}`,
    textNoTransfers: "不需要任何人轉帳",
    textTransfers: (payer) => `轉帳（${payer} 先付）：`,
  },
  "zh-CN": {
    title: "结算",
    description: "每个人该付多少、谁转给谁，复制到 LINE 就搞定了。",
    grand: "整笔账单",
    balanced: "金额一致",
    unbalanced: "金额不一致",
    meals: "餐品",
    counted: (n) => `已算 ${n} 道`,
    fee: "服务费",
    discount: "折扣",
    pending: (n) => `还有 ${n} 道菜没算进去，请回到点菜步骤处理。`,
    perPerson: "每个人该付",
    perPersonList: "每个人的应付金额",
    peopleCount: (n) => `${n} 人`,
    payer: "垫付",
    payerMeta: (name) => `${name} 垫付`,
    nothing: "这次没有点餐",
    feeShare: (a) => `，服务费 ${a}`,
    discountShare: (a) => `，折扣 −${a}`,
    sumMatches: (sum) => `大家加起来 ${sum}，正好等于整笔账单`,
    sumMismatch: (sum, grand) => `合计 ${sum} 与账单 ${grand} 不一致，请反馈这个问题。`,
    oddment: (item, people) => `${item} 无法均分，由 ${people.join("、")} ${people.length > 1 ? "各" : ""}多付 1 元`,
    transfers: "转账",
    sendsTo: "转给",
    noTransfers: "不需要任何人转账。",
    copy: "复制到 LINE",
    print: "打印",
    copied: "已复制，粘贴到 LINE 群里就好。",
    closeToast: "关闭提示",
    separator: "、",
    textTitle: "聚餐分账",
    textSummary: (m, f, d, t) => `餐品 ${m}${f ? ` + 服务费 ${f}` : ""}${d ? ` − 折扣 ${d}` : ""} = 合计 ${t}`,
    textSends: (from, a, to) => `${from} 转 ${a} 给 ${to}`,
    textNoTransfers: "不需要任何人转账",
    textTransfers: (payer) => `转账（${payer} 垫付）：`,
  },
  ja: {
    title: "精算",
    description: "それぞれの支払額と送金先をまとめました。LINE にコピーすれば完了です。",
    grand: "お会計",
    balanced: "合計一致",
    unbalanced: "合計が一致しません",
    meals: "料理",
    counted: (n) => `${n} 品を計上`,
    fee: "サービス料",
    discount: "割引",
    pending: (n) => `まだ計上していない料理が ${n} 品あります。料理のステップで直してください。`,
    perPerson: "それぞれの支払額",
    perPersonList: "一人ひとりの支払額",
    peopleCount: (n) => `${n} 人`,
    payer: "立替",
    payerMeta: (name) => `${name} が立替`,
    nothing: "今回は注文なし",
    feeShare: (a) => `、サービス料 ${a}`,
    discountShare: (a) => `、割引 −${a}`,
    sumMatches: (sum) => `全員の合計は ${sum} で、お会計とぴったり一致`,
    sumMismatch: (sum, grand) => `合計 ${sum} がお会計 ${grand} と一致しません。この問題を報告してください。`,
    oddment: (item, people) => `${item}は割り切れないため、${people.join("、")}が${people.length > 1 ? "それぞれ " : " "}1 多く払います`,
    transfers: "送金",
    sendsTo: "から",
    noTransfers: "送金の必要はありません。",
    copy: "LINE にコピー",
    print: "印刷",
    copied: "コピーしました。LINE グループに貼り付けてください。",
    closeToast: "通知を閉じる",
    separator: "、",
    textTitle: "割り勘",
    textSummary: (m, f, d, t) => `料理 ${m}${f ? ` + サービス料 ${f}` : ""}${d ? ` − 割引 ${d}` : ""} = 合計 ${t}`,
    textSends: (from, a, to) => `${from} → ${to}：${a}`,
    textNoTransfers: "送金の必要はありません",
    textTransfers: (payer) => `送金（${payer} が立替）：`,
  },
};

// spliteat-web 的成員色盤（employee-chip.tsx），照名單順序從第 2 色開始
const PALETTE = [
  { bg: "#DBEAFE", fg: "#2563EB" },
  { bg: "#DCFCE7", fg: "#16A34A" },
  { bg: "#FEF3C7", fg: "#D97706" },
  { bg: "#FCE7F3", fg: "#DB2777" },
  { bg: "#EDE9FE", fg: "#7C3AED" },
  { bg: "#CFFAFE", fg: "#0891B2" },
  { bg: "#FFE4E6", fg: "#E11D48" },
  { bg: "#ECFCCB", fg: "#65A30D" },
];
const paletteColor = (index: number) => PALETTE[(index + 1) % PALETTE.length];

/** 頭像用的單字：中文名取最後一字，其他取第一個字母 */
export function personInitial(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return /[一-鿿]/.test(trimmed) ? trimmed.slice(-1) : trimmed.slice(0, 1).toUpperCase();
}

// 狀態色只上在小圓點（spliteat-web globals.css 的 success / warning / destructive）
const dotSuccess = "bg-[#15803D] dark:bg-[#4ADE80]";
const dotWarning = "bg-[#B45309] dark:bg-[#FBBF24]";
const dotDanger = "bg-[#DC2626] dark:bg-[#F87171]";
const focusRing = "outline-none focus-visible:ring-3 focus-visible:ring-[#71717A]/50";
const btnPrimary = cn(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-transparent bg-primary px-2.5 text-sm font-medium whitespace-nowrap text-primary-foreground transition-all hover:bg-primary/80 active:translate-y-px",
  focusRing,
);
const btnOutline = cn(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium whitespace-nowrap transition-all hover:bg-muted hover:text-foreground active:translate-y-px",
  focusRing,
);

function Icon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cn("size-4 shrink-0", className)}>
      {children}
    </svg>
  );
}
const CopyIcon = () => (
  <Icon>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </Icon>
);
const ArrowIcon = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </Icon>
);

/** 標題列卡片（spliteat-web 的 Section） */
function Section({ title, meta, children }: { title: ReactNode; meta?: ReactNode; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="min-w-0 overflow-hidden rounded-xl border border-border bg-card text-sm text-card-foreground">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h3 id={id} className="text-sm font-semibold">
          {title}
        </h3>
        {meta ? <span className="text-xs text-muted-foreground tabular-nums">{meta}</span> : null}
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value, hint, dot }: { label: ReactNode; value: string; hint?: ReactNode; dot?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 bg-card px-5 py-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold text-foreground tabular-nums">{value}</p>
      {hint ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {dot ? <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", dot)} /> : null}
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** 舊瀏覽器或非 https：退回 textarea 複製 */
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

export function SettlementReceipt({
  people,
  transfers,
  payer,
  subtotal,
  fee = 0,
  discount = 0,
  grand,
  counted,
  pending = 0,
  onFixPending,
  oddments = [],
  copyText,
  onCopied,
  onPrint,
  showHeader = true,
  formatAmount,
  accent = "#4F46E5",
  accentDark = "#818CF8",
  colorOf = paletteColor,
  fixed = true,
  locale = "en",
  labels,
  className,
}: SettlementReceiptProps) {
  const l = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const fmt = formatAmount ?? ((n: number) => `NT$${n.toLocaleString(locale)}`);
  const sum = people.reduce((s, p) => s + p.owe, 0);
  const balanced = sum === grand;
  const [toast, setToast] = useState(0);

  const buildText = () => {
    if (typeof copyText === "function") return copyText();
    if (typeof copyText === "string") return copyText;
    const head = `${l.textTitle}\n${l.textSummary(fmt(subtotal), fee ? fmt(fee) : null, discount ? fmt(discount) : null, fmt(grand))}`;
    const rows = people
      .map((p) => `${p.name}: ${fmt(p.owe)}${p.lines.length ? ` (${p.lines.map((x) => `${x.name} ${x.amount}`).join(l.separator)})` : ""}`)
      .join("\n");
    const moves = transfers.length ? transfers.map((t) => l.textSends(t.from, fmt(t.amount), t.to)).join("\n") : l.textNoTransfers;
    return `${head}\n\n${rows}\n\n${l.textTransfers(payer)}\n${moves}`;
  };

  const copy = async () => {
    const text = buildText();
    await copyToClipboard(text);
    setToast((n) => n + 1);
    onCopied?.(text);
  };
  const print = () => (onPrint ? onPrint() : window.print());

  const accentVars = { "--sr-accent": accent, "--sr-accent-dark": accentDark } as CSSProperties;

  return (
    <div className={cn("relative w-full min-w-0 text-foreground", className)} style={accentVars}>
      {showHeader && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-[-0.01em]">{l.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{l.description}</p>
          </div>
          <div className="flex shrink-0 gap-2 print:hidden">
            <button type="button" onClick={copy} className={cn(btnPrimary, "h-8")}>
              <CopyIcon />
              {l.copy}
            </button>
            <button type="button" onClick={print} className={cn(btnOutline, "h-8")}>
              <Icon>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" />
                <rect x="6" y="14" width="12" height="8" rx="1" />
              </Icon>
              {l.print}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* 一排指標放在同一張卡片，用分隔線分開；只有整筆帳單用強調色 */}
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
          <div className="flex min-w-0 flex-col gap-1 bg-card px-5 py-4">
            <p className="text-xs font-medium text-muted-foreground">{l.grand}</p>
            <p className="text-2xl font-semibold text-[var(--sr-accent)] tabular-nums dark:text-[var(--sr-accent-dark)]">{fmt(grand)}</p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", balanced ? dotSuccess : dotDanger)} />
              {balanced ? l.balanced : l.unbalanced}
            </p>
          </div>
          <Metric label={l.meals} value={fmt(subtotal)} hint={counted !== undefined ? l.counted(counted) : undefined} dot={pending ? dotWarning : undefined} />
          <Metric label={l.fee} value={`${fee ? "+" : ""}${fmt(fee)}`} />
          <Metric label={l.discount} value={`${discount ? "−" : ""}${fmt(discount)}`} />
        </div>

        {pending > 0 &&
          (() => {
            const inner = (
              <>
                <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", dotWarning)} />
                <span className="flex-1">{l.pending(pending)}</span>
                {onFixPending ? <ArrowIcon /> : null}
              </>
            );
            const cls = "flex w-full items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-left text-sm text-amber-700 dark:text-amber-400";
            return onFixPending ? (
              <button type="button" onClick={onFixPending} className={cn(cls, "cursor-pointer transition-colors hover:bg-amber-500/15", focusRing)}>
                {inner}
              </button>
            ) : (
              <p className={cls}>{inner}</p>
            );
          })()}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start">
          <Section title={l.perPerson} meta={l.peopleCount(people.length)}>
            <ul className="divide-y divide-border" aria-label={l.perPersonList}>
              {people.map((p, i) => {
                const c = colorOf(i);
                const detail = p.lines.length ? p.lines.map((x) => `${x.name} ${x.amount}`).join(l.separator) : l.nothing;
                const adjust = `${p.fee ? l.feeShare(String(p.fee)) : ""}${p.discount ? l.discountShare(String(p.discount)) : ""}`;
                return (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <span
                      aria-hidden="true"
                      className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium"
                      style={{ backgroundColor: c.bg, color: c.fg }}
                    >
                      {personInitial(p.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                        {p.name}
                        {p.name === payer ? (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{l.payer}</span>
                        ) : null}
                      </p>
                      <p className="text-xs break-words text-muted-foreground tabular-nums">
                        {detail}
                        {adjust}
                      </p>
                    </div>
                    <span className="shrink-0 text-lg font-semibold tabular-nums">{fmt(p.owe)}</span>
                  </li>
                );
              })}
            </ul>
            <ul className="flex flex-col gap-2 border-t border-border px-4 py-3 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span aria-hidden="true" className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", balanced ? dotSuccess : dotDanger)} />
                <span className="tabular-nums">{balanced ? l.sumMatches(fmt(sum)) : l.sumMismatch(fmt(sum), fmt(grand))}</span>
              </li>
              {oddments.map((o) => (
                <li key={o.item} className="flex items-start gap-2">
                  <span aria-hidden="true" className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", dotWarning)} />
                  <span>{l.oddment(o.item, o.people)}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title={l.transfers} meta={payer ? l.payerMeta(payer) : undefined}>
            {transfers.length ? (
              <ol className="divide-y divide-border">
                {transfers.map((t) => (
                  <li key={t.from} className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
                    <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <span aria-hidden="true" className="size-1.5 rounded-full" style={{ backgroundColor: colorOf(t.fromIndex).fg }} />
                      {t.from}
                      <ArrowIcon className="size-3.5 text-muted-foreground" />
                      <span className="sr-only">{l.sendsTo}</span>
                      {t.to}
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums">{fmt(t.amount)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="px-4 py-3 text-xs text-muted-foreground">{l.noTransfers}</p>
            )}
            <div className="border-t border-border p-4 print:hidden">
              <button type="button" onClick={copy} className={cn(btnPrimary, "h-9 w-full")}>
                <CopyIcon />
                {l.copy}
              </button>
            </div>
          </Section>
        </div>
      </div>

      <CopiedToast id={toast} message={l.copied} closeLabel={l.closeToast} fixed={fixed} onClose={() => setToast(0)} />
    </div>
  );
}

/** 原版是 sonner 的 toast.success（上方置中、4 秒、有關閉鈕），這裡做成同樣長相的單張提示 */
function CopiedToast({ id, message, closeLabel, fixed, onClose }: { id: number; message: ReactNode; closeLabel: string; fixed: boolean; onClose: () => void }) {
  const reduce = useReducedMotion() ?? false;
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (!id || hover) return;
    const timer = window.setTimeout(() => closeRef.current(), 4000);
    return () => window.clearTimeout(timer);
  }, [id, hover]);

  return (
    <div aria-live="polite" className={cn("pointer-events-none inset-x-0 top-4 z-[999] flex justify-center px-4 print:hidden sm:top-6", fixed ? "fixed" : "absolute")}>
      <AnimatePresence>
        {id ? (
          <motion.div
            key={id}
            role="status"
            initial={reduce ? { opacity: 0 } : { y: "-100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { y: "-100%", opacity: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            onPointerEnter={() => setHover(true)}
            onPointerLeave={() => setHover(false)}
            className="pointer-events-auto relative flex w-full max-w-[356px] items-center gap-1.5 rounded-lg border border-border bg-card p-4 text-[13px] text-foreground shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
          >
            <Icon className="text-[#15803D] dark:text-[#4ADE80]">
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </Icon>
            <p className="min-w-0 flex-1 leading-normal font-medium">{message}</p>
            <button
              type="button"
              aria-label={closeLabel}
              onClick={onClose}
              className={cn(
                "absolute top-0 left-0 flex size-5 -translate-x-[35%] -translate-y-[35%] cursor-pointer items-center justify-center rounded-full border border-border bg-card transition-colors hover:bg-muted",
                focusRing,
              )}
            >
              <Icon className="size-3">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </Icon>
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
