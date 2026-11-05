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
  zoomIn: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
      <path d="M11 8v6" />
      <path d="M8 11h6" />
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
  /** 卡片上的長度變化，例如 -3.4s */
  deltaSeconds: (seconds: string) => string;
  truncatedWarning: string;
  kinds: Partial<Record<SuggestionKind, string>>;
  reasons: Record<string, string>;
  risks: Record<SuggestionRisk, string>;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, DirectorPanelLabels> = {
  en: {
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
    previewOnlySummary: (n) =>
      `${n} accepted ${n === 1 ? "suggestion is" : "suggestions are"} preview-only for now and not applied to the timeline yet.`,
    previewOnlyCard: "Preview only: this kind of suggestion is not applied automatically yet, you still need to do it by hand.",
    autoApplyPaused:
      "You've adjusted the zooms on the timeline by hand, so Director no longer overwrites your edits. Accepting or rejecting below is recorded, but the timeline will not change.",
    resumeAutoApply: "Discard my edits and let Director apply again",
    confidence: (p) => `${p}% confidence`,
    deltaSeconds: (s) => `${s}s`,
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
  },
  "zh-TW": {
    planTitle: "初剪建議",
    analyzing: "正在分析意圖…",
    empty: "這段錄影沒有自動建議",
    emptyHint: "你仍可以在各階段手動調整，或把想要的效果告訴 AI 助理。",
    acceptAllSafe: "接受安全建議",
    acceptAllIncludingCuts: "全部接受（含剪接）",
    rejectAll: "全部不要",
    resetDecisions: "回到預設",
    accept: "接受",
    reject: "不要",
    undoDecision: "撤銷這個決定",
    preview: "預覽",
    pendingReview: (n) => `${n} 項需要你確認`,
    durationDelta: (s) => `影片將縮短 ${s} 秒`,
    previewOnlySummary: (n) => `已接受的 ${n} 項建議目前僅供預覽，尚未套用到時間軸。`,
    previewOnlyCard: "僅預覽：這類建議還不會自動套用，仍需要你手動處理。",
    autoApplyPaused: "你已在時間軸上手動調整過縮放，Director 不會再覆蓋你的編輯。下方的接受或不要仍會記錄，但時間軸不會改變。",
    resumeAutoApply: "捨棄我的編輯，讓 Director 重新套用",
    confidence: (p) => `信心 ${p}%`,
    deltaSeconds: (s) => `${s} 秒`,
    truncatedWarning: "事件太多，只取樣了部分滑鼠移動，建議可能不完整。",
    kinds: { zoom: "放大到操作處", cut: "移除停頓", chapter: "加入章節", shortcut: "顯示快捷鍵" },
    reasons: {
      click_focus: "這裡有一次點擊",
      typing_focus: "這裡正在輸入",
      dwell_focus: "游標在這裡停留",
      manual_marker: "你在錄影時標記了這裡",
      silence_gap: "這段時間沒有任何動作",
      shortcut_used: "使用了快捷鍵，觀眾看不到鍵盤",
      app_switch: "切換到另一個 App",
      long_idle: "長時間沒有活動",
    },
    risks: { safe: "安全", review: "待確認", destructive: "改變長度" },
  },
  "zh-CN": {
    planTitle: "初剪建议",
    analyzing: "正在分析意图…",
    empty: "这段录屏没有自动建议",
    emptyHint: "你仍可以在各阶段手动调整，或把想要的效果告诉 AI 助手。",
    acceptAllSafe: "接受安全建议",
    acceptAllIncludingCuts: "全部接受（含剪辑）",
    rejectAll: "全部不要",
    resetDecisions: "恢复默认",
    accept: "接受",
    reject: "不要",
    undoDecision: "撤销这个决定",
    preview: "预览",
    pendingReview: (n) => `${n} 项需要你确认`,
    durationDelta: (s) => `视频将缩短 ${s} 秒`,
    previewOnlySummary: (n) => `已接受的 ${n} 项建议目前仅供预览，尚未应用到时间线。`,
    previewOnlyCard: "仅预览：这类建议还不会自动应用，仍需要你手动处理。",
    autoApplyPaused: "你已在时间线上手动调整过缩放，Director 不会再覆盖你的编辑。下方的接受或不要仍会记录，但时间线不会改变。",
    resumeAutoApply: "放弃我的编辑，让 Director 重新应用",
    confidence: (p) => `置信度 ${p}%`,
    deltaSeconds: (s) => `${s} 秒`,
    truncatedWarning: "事件太多，只采样了部分鼠标移动，建议可能不完整。",
    kinds: { zoom: "放大到操作处", cut: "移除停顿", chapter: "添加章节", shortcut: "显示快捷键" },
    reasons: {
      click_focus: "这里有一次点击",
      typing_focus: "这里正在输入",
      dwell_focus: "光标在这里停留",
      manual_marker: "你在录制时标记了这里",
      silence_gap: "这段时间没有任何操作",
      shortcut_used: "使用了快捷键，观众看不到键盘",
      app_switch: "切换到另一个应用",
      long_idle: "长时间没有活动",
    },
    risks: { safe: "安全", review: "待确认", destructive: "改变时长" },
  },
  ja: {
    planTitle: "粗編集の提案",
    analyzing: "意図を分析中…",
    empty: "この録画には自動提案がありません",
    emptyHint: "各ステージで手動調整するか、AI アシスタントにやりたいことを伝えてください。",
    acceptAllSafe: "安全な変更を承認",
    acceptAllIncludingCuts: "すべて承認（カットを含む）",
    rejectAll: "すべて却下",
    resetDecisions: "初期状態に戻す",
    accept: "承認",
    reject: "却下",
    undoDecision: "この判断を取り消す",
    preview: "プレビュー",
    pendingReview: (n) => `${n} 件の確認が必要です`,
    durationDelta: (s) => `動画が ${s} 秒短くなります`,
    previewOnlySummary: (n) => `承認した ${n} 件の提案は現在プレビューのみで、まだタイムラインには反映されません。`,
    previewOnlyCard: "プレビューのみ：この種類の提案はまだ自動では反映されないため、手動で行う必要があります。",
    autoApplyPaused:
      "タイムラインのズームを手動で調整したため、Director はあなたの編集を上書きしません。下での承認や却下は記録されますが、タイムラインは変わりません。",
    resumeAutoApply: "自分の編集を破棄して Director に再適用させる",
    confidence: (p) => `確信度 ${p}%`,
    deltaSeconds: (s) => `${s} 秒`,
    truncatedWarning: "イベントが多すぎるため、マウス移動の一部のみをサンプリングしました。提案が不完全な可能性があります。",
    kinds: { zoom: "操作箇所にズーム", cut: "間を削除", chapter: "チャプターを追加", shortcut: "ショートカットを表示" },
    reasons: {
      click_focus: "ここでクリックがあります",
      typing_focus: "ここで入力しています",
      dwell_focus: "カーソルがここで止まっています",
      manual_marker: "録画中にここをマークしました",
      silence_gap: "この区間は何も起きていません",
      shortcut_used: "ショートカットが使われ、視聴者にはキーボードが見えません",
      app_switch: "別のアプリに切り替えました",
      long_idle: "長時間操作がありません",
    },
    risks: { safe: "安全", review: "要確認", destructive: "長さが変わる" },
  },
};

const KIND_ICON: Record<SuggestionKind, ReactNode> = {
  zoom: icons.zoomIn,
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
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
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
  locale = "en",
  labels: labelsProp,
  className,
}: DirectorReviewPanelProps) {
  const l = { ...MESSAGES[resolveLocale(locale)], ...labelsProp };
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
              <Icon className="h-3.5 w-3.5 text-(--al-text-muted)">{KIND_ICON[s.kind] ?? icons.info}</Icon>
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
              {!isPreviewOnly && !!s.impactDurationDeltaMs && <span>{l.deltaSeconds((s.impactDurationDeltaMs / 1000).toFixed(1))}</span>}
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
