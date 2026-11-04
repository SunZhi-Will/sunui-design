"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";

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
  sparkles: (
    <>
      <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
      <path d="M20 2v4" />
      <path d="M22 4h-4" />
      <circle cx="4" cy="20" r="2" />
    </>
  ),
  scissors: (
    <>
      <circle cx="6" cy="6" r="3" />
      <path d="M8.12 8.12 12 12" />
      <path d="M20 4 8.12 15.88" />
      <circle cx="6" cy="18" r="3" />
      <path d="M14.8 14.8 20 20" />
    </>
  ),
  skipForward: (
    <>
      <path d="M21 4v16" />
      <path d="M6.029 4.285A2 2 0 0 0 3 6v12a2 2 0 0 0 3.029 1.715l9.997-5.998a2 2 0 0 0 .003-3.432z" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  undo: (
    <>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" />
    </>
  ),
};

/* ──────────────────────────────────────────────────────────────
 * 1. 排班說明 Sheet（Schedary：為什麼是這個人、其他候選、找代班）
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
}

const sheetLabels: AssignmentSheetLabels = {
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
  labels: labelsProp,
  className,
}: AssignmentExplainSheetProps) {
  const l = { ...sheetLabels, ...labelsProp };
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
                      {c.reasons.length > 0 ? <span className="ml-1 text-muted-foreground">{c.reasons.join(", ")}</span> : null}
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

/* ──────────────────────────────────────────────────────────────
 * 2. 建議審核面板（autolens Director：改什麼、為什麼、多確定）
 * ────────────────────────────────────────────────────────────── */

// autolens 只有暗色，色值照 styles/index.css
const DIRECTOR_TOKENS: CSSProperties = {
  ["--al-bg-app" as string]: "#111111",
  ["--al-bg-surface" as string]: "#1c1c1c",
  ["--al-bg-elevated" as string]: "#252525",
  ["--al-text-primary" as string]: "#e5e5e5",
  ["--al-text-secondary" as string]: "#a3a3a3",
  ["--al-text-muted" as string]: "#8a8a8a",
  ["--al-border-base" as string]: "rgba(255, 255, 255, 0.06)",
  ["--al-border-subtle" as string]: "rgba(255, 255, 255, 0.04)",
  ["--al-danger" as string]: "#dc2626",
  ["--al-warning" as string]: "#f59e0b",
  ["--al-success" as string]: "#22c55e",
  ["--al-radius" as string]: "8px",
};

export type SuggestionKind = "zoom" | "cut" | "chapter" | "shortcut" | "speed" | "caption" | "blur" | "style";
export type SuggestionRisk = "safe" | "review" | "destructive";
export type SuggestionDecision = "accepted" | "rejected";

export interface DirectorSuggestion {
  id: string;
  kind: SuggestionKind;
  /** 例如 click_focus、silence_gap，對應 labels.reasons */
  reasonCode: string;
  /** 0 到 1 */
  confidence: number;
  risk: SuggestionRisk;
  startMs: number;
  /** 套用後影片長度變化（毫秒，負值代表變短） */
  impactDurationDeltaMs?: number;
}

export interface DirectorPanelLabels {
  planTitle: string;
  analyzing: string;
  empty: string;
  emptyHint: string;
  acceptAllSafe: string;
  acceptAllIncludingCuts: string;
  rejectAll: string;
  resetDecisions: string;
  accept: string;
  reject: string;
  undoDecision: string;
  preview: string;
  pendingReview: (count: number) => string;
  durationDelta: (seconds: string) => string;
  previewOnlySummary: (count: number) => string;
  previewOnlyCard: string;
  autoApplyPaused: string;
  resumeAutoApply: string;
  confidence: (percent: number) => string;
  truncatedWarning: string;
  kinds: Partial<Record<SuggestionKind, string>>;
  reasons: Record<string, string>;
  risks: Record<SuggestionRisk, string>;
}

const directorLabels: DirectorPanelLabels = {
  planTitle: "First cut suggestions",
  analyzing: "Analyzing intent…",
  empty: "No automatic suggestions for this recording",
  emptyHint: "You can still adjust manually in each stage, or describe what you want to the AI assistant.",
  acceptAllSafe: "Accept safe changes",
  acceptAllIncludingCuts: "Accept all (including cuts)",
  rejectAll: "Reject all",
  resetDecisions: "Reset to defaults",
  accept: "Accept",
  reject: "Reject",
  undoDecision: "Undo this decision",
  preview: "Preview",
  pendingReview: (n) => `${n} need your review`,
  durationDelta: (s) => `Video will be ${s}s shorter`,
  previewOnlySummary: (n) => `${n} accepted suggestion(s) are preview-only for now and are not applied to the timeline yet.`,
  previewOnlyCard: "Preview only: this kind of suggestion is not applied automatically yet, you still need to do it by hand.",
  autoApplyPaused:
    "You've adjusted the zooms on the timeline by hand, so Director no longer overwrites your edits. Accepting or rejecting below is recorded, but the timeline will not change.",
  resumeAutoApply: "Discard my edits and let Director apply again",
  confidence: (p) => `${p}% confidence`,
  truncatedWarning: "Too many events. Only part of the mouse movement was sampled, so suggestions may be incomplete.",
  kinds: { zoom: "Zoom to the action", cut: "Remove pause", chapter: "Add chapter", shortcut: "Show shortcut" },
  reasons: {
    click_focus: "There is a click here",
    typing_focus: "Typing happens here",
    dwell_focus: "The cursor rests here",
    manual_marker: "You marked this while recording",
    silence_gap: "Nothing happens in this stretch",
    shortcut_used: "A shortcut was used and viewers cannot see the keyboard",
    app_switch: "Switched to another app",
    long_idle: "No activity for a long time",
  },
  risks: { safe: "Safe", review: "Review", destructive: "Changes length" },
};

const KIND_ICON: Record<SuggestionKind, ReactNode> = {
  zoom: icons.sparkles,
  cut: icons.scissors,
  chapter: icons.skipForward,
  shortcut: icons.info,
  speed: icons.skipForward,
  caption: icons.info,
  blur: icons.info,
  style: icons.info,
};

function formatTime(ms: number) {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, "0")}`;
}

/**
 * 建議 × 決策 → 面板數字。safe 且未被拒絕就是預選；review 與 destructive 必須逐項接受。
 * 長度變化只加總真的會套用的種類，其餘算成「僅預覽」。
 */
export function computePlanTotals(
  suggestions: DirectorSuggestion[],
  decisions: Record<string, SuggestionDecision>,
  appliedKinds: ReadonlySet<SuggestionKind>,
) {
  const acceptedIds = new Set<string>();
  const rejectedIds = new Set<string>();
  let pendingReviewCount = 0;
  let durationDeltaMs = 0;
  let previewOnlyCount = 0;
  for (const s of suggestions) {
    const decision = decisions[s.id];
    if (decision === "rejected") {
      rejectedIds.add(s.id);
      continue;
    }
    if (decision === "accepted" || s.risk === "safe") {
      acceptedIds.add(s.id);
      if (appliedKinds.has(s.kind)) durationDeltaMs += s.impactDurationDeltaMs ?? 0;
      else previewOnlyCount++;
    } else {
      pendingReviewCount++;
    }
  }
  return { acceptedIds, rejectedIds, pendingReviewCount, durationDeltaMs, previewOnlyCount };
}

export interface DirectorReviewPanelProps {
  suggestions: DirectorSuggestion[];
  isAnalyzing?: boolean;
  /** 輸入被截斷時提醒使用者分析不完整 */
  truncated?: boolean;
  /** 點時間碼預覽 */
  onSeek?: (timeSec: number) => void;
  /** 真的會套用到時間軸的種類，其餘卡片標示「僅預覽」 */
  appliedKinds?: SuggestionKind[];
  /** 受控決策，不傳則元件自己保存 */
  decisions?: Record<string, SuggestionDecision>;
  onDecisionsChange?: (next: Record<string, SuggestionDecision>) => void;
  /** 使用者一貫接受移除停頓時才提供「全部接受（含剪接）」 */
  offerAcceptAllIncludingCuts?: boolean;
  /** 自動套用被手動編輯接管 */
  autoApplyPaused?: boolean;
  onResumeAutoApply?: () => void;
  /** 強調色，預設 autolens 的金黃 */
  accent?: string;
  accentForeground?: string;
  labels?: Partial<DirectorPanelLabels>;
  className?: string;
}

/** 第一版剪輯建議：批次只有「接受安全建議」與「全部不要」，改長度的修改必須逐項接受 */
export function DirectorReviewPanel({
  suggestions,
  isAnalyzing = false,
  truncated,
  onSeek,
  appliedKinds = ["zoom"],
  decisions: decisionsProp,
  onDecisionsChange,
  offerAcceptAllIncludingCuts = false,
  autoApplyPaused,
  onResumeAutoApply,
  accent = "#eab308",
  accentForeground = "#111111",
  labels: labelsProp,
  className,
}: DirectorReviewPanelProps) {
  const l = { ...directorLabels, ...labelsProp };
  const [inner, setInner] = useState<Record<string, SuggestionDecision>>({});
  const decisions = decisionsProp ?? inner;
  const applied = useMemo(() => new Set(appliedKinds), [appliedKinds]);
  const plan = useMemo(() => computePlanTotals(suggestions, decisions, applied), [suggestions, decisions, applied]);

  const set = useCallback(
    (next: Record<string, SuggestionDecision>) => {
      if (decisionsProp === undefined) setInner(next);
      onDecisionsChange?.(next);
    },
    [decisionsProp, onDecisionsChange],
  );

  const accept = (id: string) => set({ ...decisions, [id]: "accepted" });
  const reject = (id: string) => set({ ...decisions, [id]: "rejected" });
  const clearDecision = (id: string) => {
    if (!(id in decisions)) return;
    const next = { ...decisions };
    delete next[id];
    set(next);
  };
  const acceptAllSafe = () => {
    const next = { ...decisions };
    for (const s of suggestions) if (s.risk === "safe" && !next[s.id]) next[s.id] = "accepted";
    set(next);
  };
  const acceptAllIncludingCuts = () => {
    const next = { ...decisions };
    for (const s of suggestions) if (!next[s.id]) next[s.id] = "accepted";
    set(next);
  };
  const rejectAll = () => {
    const next: Record<string, SuggestionDecision> = {};
    for (const s of suggestions) next[s.id] = "rejected";
    set(next);
  };

  const style: CSSProperties = {
    ...DIRECTOR_TOKENS,
    ["--al-accent" as string]: accent,
    ["--al-accent-hover" as string]: `color-mix(in srgb, ${accent} 80%, white)`,
    ["--al-accent-muted" as string]: `color-mix(in srgb, ${accent} 15%, transparent)`,
    ["--al-accent-fg" as string]: accentForeground,
  };
  const root = cn("w-full max-w-xs rounded-[14px] bg-(--al-bg-app) px-3 py-4 text-(--al-text-primary) [color-scheme:dark]", className);
  const smallBtn = "rounded-(--al-radius) px-2.5 py-1 text-[10px] transition-colors motion-reduce:transition-none";

  if (isAnalyzing && suggestions.length === 0) {
    return (
      <div className={root} style={style}>
        <div role="status" className="flex flex-col items-center gap-2 py-8 text-xs text-(--al-text-muted)">
          <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-(--al-accent) motion-reduce:animate-none" />
          {l.analyzing}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className={root} style={style}>
        <div className="flex flex-col gap-2 py-8 text-center">
          <p className="text-xs text-(--al-text-secondary)">{l.empty}</p>
          <p className="text-[10px] text-(--al-text-muted)">{l.emptyHint}</p>
        </div>
      </div>
    );
  }

  const shortenSeconds = Math.abs(plan.durationDeltaMs) / 1000;

  return (
    <div className={cn(root, "flex flex-col gap-3")} style={style}>
      <div className="flex flex-col gap-2 rounded-(--al-radius) border border-(--al-border-base) bg-(--al-bg-elevated) p-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-semibold text-(--al-text-primary)">{l.planTitle}</span>
          <span className="text-[10px] text-(--al-text-muted) tabular-nums">
            {plan.acceptedIds.size}/{suggestions.length}
          </span>
        </div>
        <div aria-live="polite" className="flex flex-col gap-2 empty:hidden">
          {plan.pendingReviewCount > 0 && <span className="text-[10px] text-(--al-warning)">{l.pendingReview(plan.pendingReviewCount)}</span>}
          {shortenSeconds > 0 && <span className="text-[10px] text-(--al-text-secondary)">{l.durationDelta(shortenSeconds.toFixed(1))}</span>}
          {plan.previewOnlyCount > 0 && <span className="text-[10px] text-(--al-warning)">{l.previewOnlySummary(plan.previewOnlyCount)}</span>}
        </div>
        {autoApplyPaused && (
          <div className="flex flex-col items-start gap-1">
            <span className="text-[10px] text-(--al-warning)">{l.autoApplyPaused}</span>
            {onResumeAutoApply && (
              <button
                type="button"
                onClick={onResumeAutoApply}
                className="rounded-(--al-radius) border border-(--al-border-base) px-2 py-0.5 text-[10px] text-(--al-text-secondary) transition-colors hover:text-(--al-text-primary) motion-reduce:transition-none"
              >
                {l.resumeAutoApply}
              </button>
            )}
          </div>
        )}
        {truncated && <span className="text-[10px] text-(--al-warning)">{l.truncatedWarning}</span>}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            type="button"
            onClick={acceptAllSafe}
            className={cn(smallBtn, "bg-(--al-accent) font-medium text-(--al-accent-fg) hover:bg-(--al-accent-hover)")}
          >
            {l.acceptAllSafe}
          </button>
          {offerAcceptAllIncludingCuts && (
            <button
              type="button"
              onClick={acceptAllIncludingCuts}
              className={cn(smallBtn, "border border-(--al-accent) font-medium text-(--al-accent) hover:bg-(--al-accent-muted)")}
            >
              {l.acceptAllIncludingCuts}
            </button>
          )}
          <button
            type="button"
            onClick={rejectAll}
            className={cn(smallBtn, "border border-(--al-border-base) text-(--al-text-secondary) hover:text-(--al-text-primary)")}
          >
            {l.rejectAll}
          </button>
          <button type="button" onClick={() => set({})} className={cn(smallBtn, "text-(--al-text-muted) hover:text-(--al-text-primary)")}>
            {l.resetDecisions}
          </button>
        </div>
      </div>

      {suggestions.map((s) => {
        const decision = decisions[s.id];
        const isRejected = plan.rejectedIds.has(s.id);
        const isApplied = plan.acceptedIds.has(s.id);
        const isPreviewOnly = !applied.has(s.kind);
        const kindLabel = l.kinds[s.kind] ?? s.kind;
        return (
          <div
            key={s.id}
            role="group"
            aria-label={`${kindLabel} ${formatTime(s.startMs)}`}
            className={cn(
              "flex flex-col gap-1.5 rounded-(--al-radius) border p-2.5 transition-opacity motion-reduce:transition-none",
              isRejected ? "border-(--al-border-subtle) opacity-45" : "border-(--al-border-base) bg-(--al-bg-surface)",
            )}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 text-(--al-accent)">{KIND_ICON[s.kind] ?? icons.info}</Icon>
              <span className="flex-1 truncate text-[11px] font-medium text-(--al-text-primary)">{kindLabel}</span>
              <button
                type="button"
                onClick={() => onSeek?.(s.startMs / 1000)}
                title={l.preview}
                aria-label={`${l.preview} ${formatTime(s.startMs)}`}
                className="shrink-0 font-mono text-[10px] text-(--al-text-muted) underline-offset-2 hover:text-(--al-accent) hover:underline"
              >
                {formatTime(s.startMs)}
              </button>
            </div>

            <p className="text-[10px] leading-snug text-(--al-text-secondary)">{l.reasons[s.reasonCode] ?? s.reasonCode}</p>

            <div className="flex items-center gap-2 text-[9px] text-(--al-text-muted)">
              <span>{l.confidence(Math.round(s.confidence * 100))}</span>
              <span className={s.risk === "destructive" ? "text-(--al-danger)" : "text-(--al-text-muted)"}>{l.risks[s.risk]}</span>
              {!isPreviewOnly && !!s.impactDurationDeltaMs && <span>{(s.impactDurationDeltaMs / 1000).toFixed(1)}s</span>}
            </div>

            {isPreviewOnly && <p className="text-[9px] leading-snug text-(--al-warning)">{l.previewOnlyCard}</p>}

            <div className="flex items-center gap-1.5 pt-0.5">
              {decision ? (
                <button
                  type="button"
                  onClick={() => clearDecision(s.id)}
                  className="flex items-center gap-1 rounded-(--al-radius) px-2 py-1 text-[10px] text-(--al-text-muted) transition-colors hover:text-(--al-text-primary) motion-reduce:transition-none"
                >
                  <Icon className="h-3 w-3">{icons.undo}</Icon>
                  {l.undoDecision}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => accept(s.id)}
                    className={cn(
                      "flex items-center gap-1 rounded-(--al-radius) px-2 py-1 text-[10px] transition-colors motion-reduce:transition-none",
                      isApplied ? "text-(--al-success)" : "text-(--al-text-secondary) hover:text-(--al-text-primary)",
                    )}
                  >
                    <Icon className="h-3 w-3">{icons.check}</Icon>
                    {l.accept}
                  </button>
                  <button
                    type="button"
                    onClick={() => reject(s.id)}
                    className="flex items-center gap-1 rounded-(--al-radius) px-2 py-1 text-[10px] text-(--al-text-secondary) transition-colors hover:text-(--al-danger) motion-reduce:transition-none"
                  >
                    <Icon className="h-3 w-3">{icons.x}</Icon>
                    {l.reject}
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
