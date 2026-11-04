"use client";

import { useCallback, useMemo, useState, type CSSProperties, type ReactNode } from "react";

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
 * 建議審核面板（autolens Director：改什麼、為什麼、多確定）
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
