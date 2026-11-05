"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────
 * 共用 inline icon（形狀照 lucide 原圖）
 * ────────────────────────────────────────────────────────────── */

function Icon({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
    >
      {children}
    </svg>
  );
}

const icons = {
  calendarOff: (
    <>
      <path d="M4.2 4.2A2 2 0 0 0 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 1.82-1.18" />
      <path d="M21 15.5V6a2 2 0 0 0-2-2H9.5" />
      <path d="M16 2v4" />
      <path d="M3 10h7" />
      <path d="M21 10h-5.5" />
      <path d="m2 2 20 20" />
    </>
  ),
  trash: (
    <>
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>
  ),
  userSearch: (
    <>
      <circle cx="10" cy="8" r="5" />
      <path d="M2 21a8 8 0 0 1 10.434-7.62" />
      <circle cx="18" cy="18" r="3" />
      <path d="m22 22-1.9-1.9" />
    </>
  ),
  x: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
};

/* ──────────────────────────────────────────────────────────────
 * 排班說明 Sheet（Schedary：為什麼是這個人、其他候選、找代班）
 * ────────────────────────────────────────────────────────────── */

// Schedary 的狀態色，淺色與深色各一組
const SHEET_TOKENS =
  "[--ep-success:#15803D] [--ep-warning:#B45309] [--ep-danger:#DC2626] [--ep-input:#D4D4D8] dark:[--ep-success:#4ADE80] dark:[--ep-warning:#FBBF24] dark:[--ep-danger:#F87171] dark:[--ep-input:rgba(255,255,255,0.12)]";

export type ReasonType = "positive" | "negative" | "neutral";
export type CandidateStatus = "available" | "warning" | "excluded";
export type Recommendation = "RECOMMENDED" | "SUITABLE" | "OVERTIME_RISK" | "NOT_RECOMMENDED";

export interface ExplainReason {
  type: ReasonType;
  message: string;
}

export interface AssignmentExplanation {
  shift: string;
  shiftTime: string;
  locked: boolean;
  reasons: ExplainReason[];
  candidates: { id: number | string; name: string; status: CandidateStatus; reasons: string[] }[];
}

export interface ReplacementCandidates {
  candidates: {
    id: number | string;
    name: string;
    recommendation: Recommendation;
    /** 白話推薦程度，例如 Recommended、Suitable、May go overtime */
    label: string;
    reasons: { type: "positive" | "negative"; message: string }[];
  }[];
  excluded: { id: number | string; name: string; message: string }[];
}

export interface AssignmentSheetLabels {
  fallbackTitle: string;
  fallbackDescription: string;
  close: string;
  loading: string;
  requestLeave: string;
  lock: string;
  findReplacement: string;
  remove: string;
  replacementTitle: string;
  lockedHint: string;
  draftHint: string;
  reasons: string;
  otherCandidates: string;
  findingReplacement: string;
  noReplacement: string;
  excluded: (n: number) => string;
  assign: string;
  assigning: string;
  assignAria: (name: string) => string;
  lockOn: string;
  lockOff: string;
  lockFailed: string;
  removed: string;
  removeFailed: string;
  assigned: (name: string) => string;
  assignFailed: string;
  /** 候選人多個原因之間的分隔 */
  separator: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, AssignmentSheetLabels> = {
  en: {
    fallbackTitle: "Shift details",
    fallbackDescription: "See why this shift was scheduled",
    close: "Close",
    loading: "Loading shift explanation",
    requestLeave: "Request leave for this day",
    lock: "Lock this shift",
    findReplacement: "Find a replacement",
    remove: "Remove this shift",
    replacementTitle: "Replacement options",
    lockedHint: "This shift is locked. Unlock it before making changes.",
    draftHint: "Changes are saved as a draft. Staff only see them after you publish.",
    reasons: "Why",
    otherCandidates: "Other candidates",
    findingReplacement: "Finding replacements",
    noReplacement: "No one can take this shift. Adjust someone's availability, or borrow staff from another store.",
    excluded: (n) => `${n} cannot take this shift`,
    assign: "Assign",
    assigning: "Assigning",
    assignAria: (name) => `Have ${name} work this shift`,
    lockOn: "Shift locked",
    lockOff: "Shift unlocked",
    lockFailed: "Could not update the lock. Try again later.",
    removed: "Shift removed. The change is saved in your draft",
    removeFailed: "Could not remove. Try again later.",
    assigned: (name) => `${name} now works this shift. The change is saved in your draft`,
    assignFailed: "Could not assign. Try again later.",
    separator: ", ",
  },
  "zh-TW": {
    fallbackTitle: "班次詳情",
    fallbackDescription: "看看這個班為什麼這樣排",
    close: "關閉",
    loading: "正在載入排班說明",
    requestLeave: "這天請假",
    lock: "鎖定這個班",
    findReplacement: "找代班",
    remove: "移除這個班",
    replacementTitle: "可代班人選",
    lockedHint: "這個班已鎖定，要先解鎖才能修改。",
    draftHint: "變更會存成草稿，發布後員工才看得到。",
    reasons: "排班理由",
    otherCandidates: "其他候選人",
    findingReplacement: "正在尋找代班人選",
    noReplacement: "目前沒有人能接這個班。可以調整某人的可上班時間，或向其他門市借人。",
    excluded: (n) => `${n} 人無法接這個班`,
    assign: "指派",
    assigning: "指派中",
    assignAria: (name) => `讓 ${name} 上這個班`,
    lockOn: "已鎖定班次",
    lockOff: "已解除鎖定",
    lockFailed: "無法更新鎖定狀態，請稍後再試。",
    removed: "已移除班次，變更已存入草稿",
    removeFailed: "無法移除，請稍後再試。",
    assigned: (name) => `已改由 ${name} 上這個班，變更已存入草稿`,
    assignFailed: "無法指派，請稍後再試。",
    separator: "、",
  },
  "zh-CN": {
    fallbackTitle: "班次详情",
    fallbackDescription: "看看这个班为什么这样排",
    close: "关闭",
    loading: "正在加载排班说明",
    requestLeave: "这天请假",
    lock: "锁定这个班",
    findReplacement: "找人替班",
    remove: "移除这个班",
    replacementTitle: "可替班人选",
    lockedHint: "这个班已锁定，需要先解锁才能修改。",
    draftHint: "改动会保存为草稿，发布后员工才能看到。",
    reasons: "排班理由",
    otherCandidates: "其他候选人",
    findingReplacement: "正在查找替班人选",
    noReplacement: "目前没有人能接这个班。可以调整某人的可上班时间，或从其他门店借调人手。",
    excluded: (n) => `${n} 人无法接这个班`,
    assign: "指派",
    assigning: "指派中",
    assignAria: (name) => `让 ${name} 上这个班`,
    lockOn: "班次已锁定",
    lockOff: "已解除锁定",
    lockFailed: "无法更新锁定状态，请稍后再试。",
    removed: "班次已移除，改动已保存到草稿",
    removeFailed: "无法移除，请稍后再试。",
    assigned: (name) => `已改由 ${name} 上这个班，改动已保存到草稿`,
    assignFailed: "无法指派，请稍后再试。",
    separator: "、",
  },
  ja: {
    fallbackTitle: "シフトの詳細",
    fallbackDescription: "このシフトが組まれた理由を確認",
    close: "閉じる",
    loading: "シフトの説明を読み込み中",
    requestLeave: "この日の休みを申請",
    lock: "このシフトをロック",
    findReplacement: "代わりを探す",
    remove: "このシフトを削除",
    replacementTitle: "代わりの候補",
    lockedHint: "このシフトはロック中です。変更するには先にロックを解除してください。",
    draftHint: "変更は下書きとして保存され、公開するまでスタッフには表示されません。",
    reasons: "理由",
    otherCandidates: "ほかの候補",
    findingReplacement: "代わりの候補を検索中",
    noReplacement: "このシフトに入れる人がいません。誰かの勤務可能時間を調整するか、他店舗から応援を頼んでください。",
    excluded: (n) => `${n}人はこのシフトに入れません`,
    assign: "割り当て",
    assigning: "割り当て中",
    assignAria: (name) => `${name}さんをこのシフトに割り当てる`,
    lockOn: "シフトをロックしました",
    lockOff: "ロックを解除しました",
    lockFailed: "ロックを更新できませんでした。しばらくしてからお試しください。",
    removed: "シフトを削除しました。変更は下書きに保存されています",
    removeFailed: "削除できませんでした。しばらくしてからお試しください。",
    assigned: (name) => `${name}さんがこのシフトに入ります。変更は下書きに保存されています`,
    assignFailed: "割り当てできませんでした。しばらくしてからお試しください。",
    separator: "、",
  },
};

export interface AssignmentExplainSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 員工姓名 */
  title?: string;
  /** 例如 "9/28 (Mon)" */
  dateLabel?: string;
  explanation?: AssignmentExplanation | null;
  loading?: boolean;
  /** 員工檢視隱藏鎖定開關 */
  hideLock?: boolean;
  onToggleLock?: (next: boolean) => void | Promise<void>;
  showLeaveRequestButton?: boolean;
  onRequestLeave?: () => void;
  /** 管理者可以找代班或移除 */
  canEdit?: boolean;
  /** 按下「找代班」時呼叫，外層開始載入候選人 */
  onFindReplacement?: () => void;
  /** null 代表載入中 */
  replacement?: ReplacementCandidates | null;
  onAssign?: (id: number | string, name: string) => void | Promise<void>;
  onRemove?: () => void | Promise<void>;
  /** true：貼右側的全螢幕 Sheet（含遮罩）；false：在容器內就地顯示 */
  fixed?: boolean;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<AssignmentSheetLabels>;
  className?: string;
}

function ReasonIcon({ type }: { type: ReasonType }) {
  if (type === "positive") return <span aria-hidden className="text-(--ep-success)">✓</span>;
  if (type === "negative") return <span aria-hidden className="text-(--ep-danger)">✗</span>;
  return <span aria-hidden className="text-muted-foreground">•</span>;
}

function CandidateIcon({ status }: { status: CandidateStatus }) {
  if (status === "excluded") return <span aria-hidden className="text-(--ep-danger)">×</span>;
  if (status === "warning") return <span aria-hidden className="text-(--ep-warning)">△</span>;
  return <span aria-hidden className="text-(--ep-success)">○</span>;
}

const btnBase =
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none";
const btnVariant = {
  default: "bg-primary text-primary-foreground hover:bg-primary/80",
  outline: "border-border bg-background hover:bg-muted hover:text-foreground",
  ghost: "hover:bg-muted hover:text-foreground",
};
const btnSize = { default: "h-8 px-2.5 text-sm", sm: "h-7 gap-1 rounded-md px-2.5 text-[0.8rem]" };

const badgeTone: Record<Recommendation, string> = {
  RECOMMENDED: "bg-primary text-primary-foreground",
  SUITABLE: "bg-muted text-foreground",
  OVERTIME_RISK: "border-border text-foreground",
  NOT_RECOMMENDED: "border-border text-foreground",
};

function LoadingRows({ rows, label }: { rows: number; label: string }) {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label={label}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-11 w-full animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
      ))}
    </div>
  );
}

type Notice = { tone: "success" | "error"; text: string } | null;

/** 點選班表上的人名時開啟：排班理由、其他候選人，管理者可找代班或移除 */
export function AssignmentExplainSheet({
  open,
  onOpenChange,
  title,
  dateLabel,
  explanation,
  loading,
  hideLock,
  onToggleLock,
  showLeaveRequestButton,
  onRequestLeave,
  canEdit,
  onFindReplacement,
  replacement = null,
  onAssign,
  onRemove,
  fixed = false,
  locale = "en",
  labels: labelsProp,
  className,
}: AssignmentExplainSheetProps) {
  const l = { ...MESSAGES[resolveLocale(locale)], ...labelsProp };
  const reduce = useReducedMotion() ?? false;
  const [findingReplacement, setFindingReplacement] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [lockPending, setLockPending] = useState(false);
  const [assigning, setAssigning] = useState<number | string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // 換人或關閉時回到初始狀態
  useEffect(() => {
    setFindingReplacement(false);
    setRemoving(false);
    setAssigning(null);
  }, [open, title, dateLabel]);

  // 提示訊息 4 秒後自動消失（原專案用 sonner 的預設時間）
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    if (!open) return;
    // 只有浮在畫面上的 Sheet 才搶焦點，就地顯示時不打斷頁面
    if (fixed) closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, fixed, onOpenChange]);

  async function toggleLock(next: boolean) {
    if (!onToggleLock) return;
    setLockPending(true);
    try {
      await onToggleLock(next);
      setNotice({ tone: "success", text: next ? l.lockOn : l.lockOff });
    } catch (err) {
      setNotice({ tone: "error", text: err instanceof Error && err.message ? err.message : l.lockFailed });
    } finally {
      setLockPending(false);
    }
  }

  async function remove() {
    if (!onRemove) return;
    setRemoving(true);
    try {
      await onRemove();
      setNotice({ tone: "success", text: l.removed });
    } catch (err) {
      setNotice({ tone: "error", text: err instanceof Error && err.message ? err.message : l.removeFailed });
      setRemoving(false);
    }
  }

  async function assign(id: number | string, name: string) {
    if (!onAssign) return;
    setAssigning(id);
    try {
      await onAssign(id, name);
      setNotice({ tone: "success", text: l.assigned(name) });
    } catch (err) {
      setNotice({ tone: "error", text: err instanceof Error && err.message ? err.message : l.assignFailed });
      setAssigning(null);
    }
  }

  const titleId = useId();
  const ease = [0.42, 0, 0.58, 1] as const;

  const panel = (
    <motion.div
      key="sheet"
      role="dialog"
      aria-modal={fixed || undefined}
      aria-labelledby={titleId}
      initial={reduce ? { opacity: 0 } : { opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, x: 40 }}
      transition={{ duration: reduce ? 0 : 0.2, ease }}
      className={cn(
        SHEET_TOKENS,
        "flex flex-col gap-4 overflow-y-auto bg-card bg-clip-padding text-sm text-card-foreground shadow-lg",
        fixed ? "fixed inset-y-0 right-0 z-50 h-full w-3/4 border-l border-border sm:max-w-md" : "relative w-full max-w-md border border-border",
        className,
      )}
    >
      <div className="flex flex-col gap-0.5 p-4 pr-12">
        <h2 id={titleId} className="text-base font-medium text-foreground">
          {title ?? l.fallbackTitle}
        </h2>
        <p className="text-sm text-muted-foreground">{explanation && dateLabel ? dateLabel : l.fallbackDescription}</p>
      </div>

      <button
        ref={closeRef}
        type="button"
        onClick={() => onOpenChange(false)}
        className={cn(btnBase, btnVariant.ghost, "absolute top-3 right-3 size-7 rounded-md")}
      >
        <Icon className="size-4">{icons.x}</Icon>
        <span className="sr-only">{l.close}</span>
      </button>

      <div className="flex flex-col gap-4 px-4 pb-6">
        {loading ? (
          <LoadingRows rows={4} label={l.loading} />
        ) : explanation ? (
          <>
            <p className="text-base font-medium text-foreground">
              {explanation.shift} {explanation.shiftTime}
            </p>

            {showLeaveRequestButton ? (
              <button type="button" onClick={onRequestLeave} className={cn(btnBase, btnVariant.outline, btnSize.default)}>
                <Icon className="size-4">{icons.calendarOff}</Icon>
                {l.requestLeave}
              </button>
            ) : null}

            {hideLock ? null : (
              <>
                <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <label htmlFor="assignment-lock-switch" className="text-sm leading-none font-medium select-none">
                    {l.lock}
                  </label>
                  <button
                    id="assignment-lock-switch"
                    type="button"
                    role="switch"
                    aria-checked={explanation.locked}
                    disabled={lockPending}
                    onClick={() => void toggleLock(!explanation.locked)}
                    className={cn(
                      "relative inline-flex h-[18.4px] w-[32px] shrink-0 items-center rounded-full border border-transparent transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
                      explanation.locked ? "bg-primary" : "bg-(--ep-input)",
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none block size-4 rounded-full bg-background transition-transform motion-reduce:transition-none",
                        explanation.locked ? "translate-x-[calc(100%-2px)] dark:bg-primary-foreground" : "translate-x-0 dark:bg-foreground",
                      )}
                    />
                  </button>
                </div>
                <div role="separator" className="h-px bg-border" />
              </>
            )}

            {canEdit ? (
              <>
                <div className="flex flex-col gap-2">
                  {findingReplacement ? (
                    <>
                      <p className="text-sm font-medium text-foreground">{l.replacementTitle}</p>
                      {replacement ? (
                        <div className="flex flex-col gap-3">
                          {replacement.candidates.length === 0 ? (
                            <p className="text-sm text-muted-foreground">{l.noReplacement}</p>
                          ) : (
                            <ul className="flex flex-col gap-2">
                              {replacement.candidates.map((c) => (
                                <li key={c.id} className="flex items-start gap-3 rounded-md border border-border px-3 py-2.5">
                                  <div className="min-w-0 flex-1">
                                    <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-foreground">
                                      {c.name}
                                      <span
                                        className={cn(
                                          "inline-flex h-5 w-fit shrink-0 items-center rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap",
                                          badgeTone[c.recommendation],
                                        )}
                                      >
                                        {c.label}
                                      </span>
                                    </p>
                                    <ul className="mt-1 flex flex-col gap-0.5 text-xs">
                                      {c.reasons.map((r) => (
                                        <li key={r.message} className={r.type === "positive" ? "text-muted-foreground" : "text-(--ep-warning)"}>
                                          <span aria-hidden>{r.type === "positive" ? "✓ " : "△ "}</span>
                                          {r.message}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <button
                                    type="button"
                                    disabled={assigning !== null}
                                    onClick={() => void assign(c.id, c.name)}
                                    aria-label={l.assignAria(c.name)}
                                    className={cn(btnBase, btnSize.sm, c.recommendation === "RECOMMENDED" ? btnVariant.default : btnVariant.outline)}
                                  >
                                    {assigning === c.id ? l.assigning : l.assign}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                          {replacement.excluded.length > 0 ? (
                            <details className="text-sm">
                              <summary className="cursor-pointer text-xs text-muted-foreground">{l.excluded(replacement.excluded.length)}</summary>
                              <ul className="mt-1.5 flex flex-col gap-1">
                                {replacement.excluded.map((item) => (
                                  <li key={item.id} className="text-sm">
                                    <span className="text-foreground">{item.name}</span>
                                    <span className="ml-1 text-muted-foreground">{item.message}</span>
                                  </li>
                                ))}
                              </ul>
                            </details>
                          ) : null}
                        </div>
                      ) : (
                        <LoadingRows rows={3} label={l.findingReplacement} />
                      )}
                    </>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={explanation.locked}
                        onClick={() => {
                          setFindingReplacement(true);
                          onFindReplacement?.();
                        }}
                        className={cn(btnBase, btnVariant.outline, btnSize.default)}
                      >
                        <Icon className="size-4">{icons.userSearch}</Icon>
                        {l.findReplacement}
                      </button>
                      <button
                        type="button"
                        disabled={explanation.locked || removing}
                        onClick={() => void remove()}
                        className={cn(
                          btnBase,
                          btnSize.default,
                          "text-muted-foreground hover:bg-(--ep-danger)/10 hover:text-(--ep-danger)",
                        )}
                      >
                        <Icon className="size-4">{icons.trash}</Icon>
                        {l.remove}
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">{explanation.locked ? l.lockedHint : l.draftHint}</p>
                </div>
                <div role="separator" className="h-px bg-border" />
              </>
            ) : null}

            <div>
              <p className="mb-2 text-sm font-medium text-foreground">{l.reasons}</p>
              <ul className="flex flex-col gap-1.5">
                {explanation.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <ReasonIcon type={r.type} />
                    <span className="text-foreground">{r.message}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div role="separator" className="h-px bg-border" />

            <div>
              <p className="mb-2 text-sm font-medium text-foreground">{l.otherCandidates}</p>
              <ul className="flex flex-col gap-2">
                {explanation.candidates.map((c) => (
                  <li key={c.id} className="flex items-start gap-2 text-sm">
                    <CandidateIcon status={c.status} />
                    <div>
                      <span className="font-medium text-foreground">{c.name}</span>
                      {c.reasons.length > 0 ? <span className="ml-1 text-muted-foreground">{c.reasons.join(l.separator)}</span> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : null}
      </div>

      <div aria-live="polite" className="sticky bottom-0 mt-auto px-4 pb-4 empty:hidden">
        {notice ? (
          <p
            className={cn(
              "rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-lg",
              notice.tone === "error" ? "text-(--ep-danger)" : "text-foreground",
            )}
          >
            {notice.text}
          </p>
        ) : null}
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {open ? (
        fixed ? (
          <>
            <motion.div
              key="overlay"
              aria-hidden
              onClick={() => onOpenChange(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.1 }}
              className="fixed inset-0 z-50 bg-black/10"
            />
            {panel}
          </>
        ) : (
          panel
        )
      ) : null}
    </AnimatePresence>
  );
}
