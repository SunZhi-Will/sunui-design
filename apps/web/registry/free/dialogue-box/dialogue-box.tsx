"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";

import { cn } from "@/lib/utils";

// 移植自 山河未歸／DeathsBlessing dialogue-box.tsx（NarrationOverlay）與 use-dialogue-playback.ts，
// 自動播放倒數環與選項群組取自互動小說平台 reader/dialogue、reader/choice
export const storyThemes = {
  ink: {
    "--story-bg": "#08090c",
    "--story-line": "rgba(234, 228, 214, 0.14)",
    "--story-rule": "rgba(201, 160, 99, 0.28)",
    "--story-text": "#eae4d6",
    "--story-secondary": "#b3aa97",
    "--story-muted": "#837d6f",
    "--story-accent": "#c9a063",
    "--story-accent-bright": "#e7c489",
    "--story-accent-dim": "rgba(201, 160, 99, 0.38)",
    "--story-glow": "201 160 99",
    "--story-glow-bright": "231 196 137",
    "--story-seal": "#b23a2e",
    "--story-seal-soft": "rgba(178, 58, 46, 0.55)",
    "--story-danger": "#b86a5a",
    "--story-scrim": "5 6 8",
    "--story-shade": "8 10 13",
    "--story-text-shadow": "rgba(0, 0, 0, 0.9)",
    "--story-plate-dot": "0",
    "--story-plate-turn": "45deg",
    "--story-plate-tracking": "0.24em",
    "--story-tracking": "0.07em",
    "--story-font": '"Noto Serif TC", "Songti TC", "PingFang TC", "Microsoft JhengHei", "Heiti TC", serif',
    "--story-font-display": '"LXGW WenKai TC", "Kaiti TC", "BiauKai", "DFKai-SB", "Noto Serif TC", "Songti TC", serif',
  },
  moon: {
    "--story-bg": "#070a12",
    "--story-line": "rgba(233, 237, 245, 0.12)",
    "--story-rule": "rgba(163, 184, 217, 0.26)",
    "--story-text": "#e9edf5",
    "--story-secondary": "#aab4c7",
    "--story-muted": "#808ba1",
    "--story-accent": "#a3b8d9",
    "--story-accent-bright": "#d5e1f5",
    "--story-accent-dim": "rgba(163, 184, 217, 0.38)",
    "--story-glow": "117 141 183",
    "--story-glow-bright": "157 177 211",
    "--story-seal": "#e6a4b8",
    "--story-seal-soft": "rgba(230, 164, 184, 0.5)",
    "--story-danger": "#af637a",
    "--story-scrim": "7 10 18",
    "--story-shade": "12 17 28",
    "--story-text-shadow": "rgba(0, 0, 0, 0.9)",
    "--story-plate-dot": "50%",
    "--story-plate-turn": "0deg",
    "--story-plate-tracking": "0.08em",
    "--story-tracking": "0.03em",
    "--story-font": '"Noto Serif TC", "Songti TC", "PMingLiU", serif',
    "--story-font-display": '"Noto Serif TC", "Songti TC", "PMingLiU", serif',
  },
  rice: {
    "--story-bg": "#f4efe3",
    "--story-line": "rgba(60, 48, 32, 0.18)",
    "--story-rule": "rgba(154, 107, 42, 0.3)",
    "--story-text": "#2a2219",
    "--story-secondary": "rgba(42, 34, 25, 0.72)",
    "--story-muted": "rgba(42, 34, 25, 0.6)",
    "--story-accent": "#9a6b2a",
    "--story-accent-bright": "#7a4f17",
    "--story-accent-dim": "rgba(154, 107, 42, 0.38)",
    "--story-glow": "154 107 42",
    "--story-glow-bright": "154 107 42",
    "--story-seal": "#a33a26",
    "--story-seal-soft": "rgba(163, 58, 38, 0.4)",
    "--story-danger": "#a33a26",
    "--story-scrim": "244 239 227",
    "--story-shade": "250 246 236",
    "--story-text-shadow": "rgba(250, 246, 236, 0.9)",
    "--story-plate-dot": "0",
    "--story-plate-turn": "45deg",
    "--story-plate-tracking": "0.24em",
    "--story-tracking": "0.07em",
    "--story-font": '"Noto Serif TC", "Songti TC", serif',
    "--story-font-display": '"LXGW WenKai TC", "Kaiti TC", "Noto Serif TC", "Songti TC", serif',
  },
} as const;

export type StoryTheme = keyof typeof storyThemes;

export interface DialogueChoice {
  id: string;
  text: ReactNode;
  /** 屬性門檻，顯示成【膽識】前綴（英文為 [Courage]） */
  requirement?: string;
  locked?: boolean;
  /** 鎖住時接在門檻後的字，預設依語言（「不足」） */
  lockedSuffix?: string;
  /** 鎖住時的第二行說明 */
  lockedHint?: ReactNode;
  /** 以前選過，標上「・曾選」這類標記 */
  seen?: boolean;
}

export interface DialogueBoxLabels {
  continue?: string;
  openLog?: string;
  autoPlayOn?: string;
  autoPlayOff?: string;
  fastForwardOn?: string;
  fastForwardOff?: string;
  choices?: string;
  needs?: string;
  lockedSuffix?: string;
  seen?: string;
  seenLabel?: string;
  separator?: string;
  /** 門檻前綴，例如【膽識・不足】、[Courage · not enough] */
  requirementTag?: (requirement: string, lockedSuffix?: string) => string;
  /** 按鈕提示加上快捷鍵，例如「停止快轉（Ctrl）」 */
  shortcut?: (label: string, key: string) => string;
}

export interface DialogueBoxProps {
  /** 沒有或 "narrator" 時是無框的連續敘事；否則是名牌加台詞 */
  speaker?: string;
  text: string;
  /** 每一行的穩定 id，用來判斷已讀與重新開始打字 */
  lineId?: string;
  choices?: DialogueChoice[];
  onAdvance: () => void;
  onChoose?: (index: number) => void;
  /** 這一行以前讀過：進場時就以次要色顯示，快轉也只跳過讀過的行 */
  read?: boolean;
  onLineRead?: (lineId: string) => void;
  autoPlay?: boolean;
  defaultAutoPlay?: boolean;
  onAutoPlayChange?: (on: boolean) => void;
  fastForward?: boolean;
  onFastForwardChange?: (on: boolean) => void;
  /** 快轉只跳過已讀的行，遇到未讀停下 */
  skipReadOnly?: boolean;
  /** 0 到 1，預設 0.5；對應每字 68ms 到 6ms */
  textSpeed?: number;
  /** 0 到 1，預設 0.5；對應自動推進的等待 */
  autoAdvanceSpeed?: number;
  onOpenLog?: () => void;
  /** 凍結打字機與自動播放（不重設），也不渲染；例如選單蓋在上面時 */
  hidden?: boolean;
  /** 「下一句」提示符號；預設 ink 用 ▾，moon 用羽毛 */
  cue?: "caret" | "feather";
  /** 右下控制列最前面的額外按鈕，例如快存、快讀 */
  quickControls?: ReactNode;
  theme?: StoryTheme;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: DialogueBoxLabels;
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

// 中日文用全形括號與中點，英文用半形
const cjkTag = (r: string, suffix?: string) => (suffix ? `【${r}・${suffix}】` : `【${r}】`);
const cjkShortcut = (label: string, key: string) => `${label}（${key}）`;

const MESSAGES: Record<SunLocale, Required<DialogueBoxLabels>> = {
  en: {
    continue: "Continue",
    openLog: "Open story log",
    autoPlayOn: "Start auto-play",
    autoPlayOff: "Stop auto-play",
    fastForwardOn: "Start fast-forward",
    fastForwardOff: "Stop fast-forward",
    choices: "Choices",
    needs: "Requires ",
    lockedSuffix: "not enough",
    seen: "· chosen",
    seenLabel: "Chosen before",
    separator: ": ",
    requirementTag: (r, suffix) => (suffix ? `[${r} · ${suffix}]` : `[${r}]`),
    shortcut: (label, key) => `${label} (${key})`,
  },
  "zh-TW": {
    continue: "繼續",
    openLog: "開啟劇情回顧",
    autoPlayOn: "開始自動播放",
    autoPlayOff: "停止自動播放",
    fastForwardOn: "開始快轉",
    fastForwardOff: "停止快轉",
    choices: "選項",
    needs: "需要",
    lockedSuffix: "不足",
    seen: "・曾選",
    seenLabel: "以前選過",
    separator: "：",
    requirementTag: cjkTag,
    shortcut: cjkShortcut,
  },
  "zh-CN": {
    continue: "继续",
    openLog: "打开剧情回顾",
    autoPlayOn: "开始自动播放",
    autoPlayOff: "停止自动播放",
    fastForwardOn: "开始快进",
    fastForwardOff: "停止快进",
    choices: "选项",
    needs: "需要",
    lockedSuffix: "不足",
    seen: "・曾选",
    seenLabel: "以前选过",
    separator: "：",
    requirementTag: cjkTag,
    shortcut: cjkShortcut,
  },
  ja: {
    continue: "次へ",
    openLog: "バックログを開く",
    autoPlayOn: "オート再生を開始",
    autoPlayOff: "オート再生を停止",
    fastForwardOn: "スキップを開始",
    fastForwardOff: "スキップを停止",
    choices: "選択肢",
    needs: "必要：",
    lockedSuffix: "不足",
    seen: "・選択済み",
    seenLabel: "以前に選んだ選択肢",
    separator: "：",
    requirementTag: cjkTag,
    shortcut: cjkShortcut,
  },
};

const CONTROLS_RIGHT = "1.25rem";
const CONTROLS_BOTTOM = "0.75rem";
// 台詞與選項共用同一條基準線，選項出現時現行台詞才不會跳位
const BASELINE = `calc(${CONTROLS_BOTTOM} + 3.5rem)`;
const MAX_FF_ADVANCES = 300;
const FF_TICK_MS = 10;
const FF_TARGET_MS = 40;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const msPerCharFor = (speed: number) => 68 - clamp01(speed) * 62;
const autoplayDelayFor = (speed: number, length: number) =>
  2600 - clamp01(speed) * 2200 + length * (60 - clamp01(speed) * 50);

// 不可出現在行首的標點（避頭點）
const CANNOT_START_LINE = /[、。，．！？：；）】》」』〉〕｝\])"'”’…～·]/;

/** 把結尾一段切出來：往回略過所有不能起行的標點，再多拉一個字當錨點 */
function splitForCue(text: string) {
  let i = text.length;
  while (i > 0 && CANNOT_START_LINE.test(text[i - 1])) i--;
  const tailStart = i > 0 ? i - 1 : 0;
  return { head: text.slice(0, tailStart), tail: text.slice(tailStart) };
}

/** 量出結尾那段落在哪裡，提示符號畫在它後面，不參與文字排版 */
function useCuePosition(active: boolean, text: string) {
  const tailRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  useLayoutEffect(() => {
    if (!active || !tailRef.current) {
      setPos(null);
      return;
    }
    const el = tailRef.current;
    setPos({ top: el.offsetTop, left: el.offsetLeft + el.offsetWidth });
  }, [active, text]);
  return { tailRef, pos };
}

function renderRevealed(visible: string, showCue: boolean, tailRef: RefObject<HTMLSpanElement | null>) {
  if (!showCue || visible.length === 0) return visible;
  const { head, tail } = splitForCue(visible);
  return (
    <span>
      {head}
      <span ref={tailRef} style={{ whiteSpace: "nowrap" }}>
        {tail}
      </span>
    </span>
  );
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
}

/** 自動播放倒數環：滿圈開始，在等待時間內描邊排空 */
function AutoPlayRing({ durationMs }: { durationMs: number }) {
  const r = 7.5;
  const c = 2 * Math.PI * r;
  return (
    <svg className="sdb-ring" width="18" height="18" viewBox="0 0 18 18" style={{ ["--sdb-ring-ms" as string]: `${durationMs}ms`, ["--sdb-ring-c" as string]: `${c}` }}>
      <circle cx="9" cy="9" r={r} fill="none" stroke="var(--story-line)" strokeWidth="1.6" />
      <circle className="sdb-ring-fill" cx="9" cy="9" r={r} fill="none" stroke="var(--story-accent)" strokeWidth="1.6" strokeLinecap="round" strokeDasharray={c} />
    </svg>
  );
}

function NextLineCue({ top, left, glyph, ringMs }: { top: number; left: number; glyph: "caret" | "feather"; ringMs: number | null }) {
  let content: ReactNode;
  if (ringMs !== null) {
    content = prefersReducedMotion() ? <span className="sdb-dot" /> : <AutoPlayRing durationMs={ringMs} />;
  } else if (glyph === "feather") {
    content = (
      <svg width="11" height="15" viewBox="0 0 11 15" fill="currentColor" aria-hidden="true" style={{ verticalAlign: "-0.1em" }}>
        <path d="M9.6 0.4C5.4 1.2 1.8 4.6 1.4 9.2L0.4 14.6L1.3 14.8L2.2 10.6C6.8 10.4 10.2 6 9.6 0.4Z" />
      </svg>
    );
  } else {
    content = "▾";
  }
  return (
    <span aria-hidden="true" className={cn(ringMs === null && "sdb-cue")} style={{ position: "absolute", top, left: left + 6, color: "var(--story-accent)", fontSize: "0.85em", pointerEvents: "none" }}>
      {ringMs !== null ? <span style={{ display: "inline-flex", verticalAlign: "middle" }}>{content}</span> : content}
    </span>
  );
}

/** 先用完整台詞撐出最終高度（隱形），再把已顯示的部分疊上去，換行時不會跳 */
function RevealedLine({ fullText, children, wrapStyle, visibleStyle }: { fullText: string; children: ReactNode; wrapStyle: CSSProperties; visibleStyle: CSSProperties }) {
  return (
    <div style={{ position: "relative" }}>
      <p style={{ ...wrapStyle, ...visibleStyle, position: "absolute", inset: 0, margin: 0 }}>{children}</p>
      <p aria-hidden="true" style={{ ...wrapStyle, visibility: "hidden", margin: 0 }}>
        {fullText}
      </p>
    </div>
  );
}

const Icon = ({ children }: { children: ReactNode }) => (
  <svg className="sdb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {children}
  </svg>
);

const css = `
.sdb-root{container-type:size;container-name:sdb}
.sdb-col{position:absolute;left:6%;right:6%;bottom:${BASELINE}}
.sdb-plate{display:inline-flex;align-items:center;gap:.65rem;margin-bottom:.8rem;padding:0 3rem .4rem 0;font-family:var(--story-font-display);font-size:1.15rem;letter-spacing:var(--story-plate-tracking);color:var(--story-accent-bright);text-shadow:0 1px 8px var(--story-text-shadow);background:linear-gradient(90deg,var(--story-accent-dim),rgb(var(--story-glow) / 0)) left bottom / 100% 1px no-repeat}
.sdb-plate::before{flex-shrink:0;width:.4rem;height:.4rem;content:"";background:var(--story-seal);border-radius:var(--story-plate-dot);transform:rotate(var(--story-plate-turn))}
.sdb-choice{display:block;width:100%;box-sizing:border-box;text-align:left;padding:.85rem 1.2rem;font:inherit;font-size:1.06rem;line-height:1.6;letter-spacing:.05em;position:relative;background:linear-gradient(90deg,rgb(var(--story-glow) / .16),rgb(var(--story-glow) / 0) 70%) left center / 0% 100% no-repeat,linear-gradient(90deg,rgb(var(--story-shade) / .84) 0%,rgb(var(--story-shade) / .6) 60%,rgb(var(--story-shade) / .18) 100%);color:var(--story-text);border:1px solid transparent;border-left:2px solid var(--story-rule);border-radius:2px;cursor:pointer;transition:border-color 120ms ease-out,color 120ms ease-out,background-size 320ms cubic-bezier(.22,.72,.2,1),transform 200ms cubic-bezier(.05,.7,.1,1);animation:sdb-choice-in 360ms cubic-bezier(.05,.7,.1,1) backwards}
.sdb-choice:nth-child(2){animation-delay:50ms}.sdb-choice:nth-child(3){animation-delay:100ms}.sdb-choice:nth-child(4){animation-delay:150ms}.sdb-choice:nth-child(n+5){animation-delay:200ms}
.sdb-choice:hover,.sdb-choice:focus-visible{border-left-color:var(--story-seal);background-size:100% 100%,auto;color:var(--story-accent-bright);transform:translateX(.35rem);outline:none}
.sdb-choice:active{transform:translateY(1px)}
.sdb-choice--seen{color:var(--story-secondary)}
.sdb-choice--locked{cursor:not-allowed;opacity:.45}
.sdb-req{margin-right:.35em;color:var(--story-accent);letter-spacing:.08em}
.sdb-choice--locked .sdb-req{color:var(--story-danger)}
.sdb-seen{margin-left:.5em;color:var(--story-secondary);font-size:.82em;opacity:.7}
.sdb-hint{display:block;margin-top:.3rem;color:var(--story-muted);font-size:.8em;letter-spacing:.06em}
.sdb-controls{position:absolute;right:${CONTROLS_RIGHT};bottom:${CONTROLS_BOTTOM};display:flex;align-items:center;gap:.1rem;padding:0 .6rem;background:linear-gradient(90deg,rgb(var(--story-shade) / 0) 0%,rgb(var(--story-shade) / .6) 16%,rgb(var(--story-shade) / .6) 84%,rgb(var(--story-shade) / 0) 100%);border-top:1px solid;border-image:linear-gradient(90deg,transparent,rgb(var(--story-glow) / .32) 25%,rgb(var(--story-glow) / .32) 75%,transparent) 1}
.sdb-btn{position:relative;width:2.75rem;height:2.75rem;display:flex;align-items:center;justify-content:center;padding:0;border:0;border-radius:50%;background:transparent;color:var(--story-secondary);line-height:1;cursor:pointer;filter:drop-shadow(0 1px 3px var(--story-text-shadow));transition:color 120ms ease-out,filter 120ms ease-out,transform 80ms ease-out}
.sdb-btn:hover,.sdb-btn:focus-visible{color:var(--story-accent-bright);outline:none}
.sdb-btn:active{transform:translateY(1px) scale(.94)}
.sdb-btn[data-active="true"]{color:var(--story-accent-bright)}
.sdb-btn[data-active="true"]::after{position:absolute;bottom:.3rem;left:50%;width:4px;height:4px;margin-left:-2px;content:"";border-radius:50%;background:var(--story-seal)}
.sdb-icon{display:block;width:1.25rem;height:1.25rem}
.sdb-divider{width:1px;height:1.1rem;margin:0 .3rem;background:rgb(var(--story-glow) / .3)}
.sdb-cue{animation:sdb-cue 1.6s ease-in-out infinite}
.sdb-ring{transform:rotate(-90deg)}
.sdb-ring-fill{animation:sdb-ring var(--sdb-ring-ms,3000ms) linear forwards}
.sdb-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--story-accent)}
@keyframes sdb-cue{0%,100%{transform:translateY(0);opacity:.75}50%{transform:translateY(4px);opacity:1}}
@keyframes sdb-choice-in{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
@keyframes sdb-ring{from{stroke-dashoffset:0}to{stroke-dashoffset:var(--sdb-ring-c,47)}}
@media (hover:none){.sdb-choice:hover:not(:active){background-size:0% 100%,auto;border-left-color:var(--story-rule);color:var(--story-text);transform:none}.sdb-choice:active{border-left-color:var(--story-accent);color:var(--story-accent-bright)}}
@container sdb (max-width:700px) or (max-height:500px){.sdb-col{left:2rem;right:2rem;bottom:calc(.6rem + 3rem)}.sdb-choices{max-height:82%;overflow-y:auto;overscroll-behavior:contain;gap:.35rem!important;scrollbar-width:none}.sdb-choices .sdb-choice{min-height:44px;padding:.5rem .85rem;font-size:.95rem;line-height:1.3}.sdb-recap{margin-top:.3rem!important}.sdb-recap-speaker{font-size:.8rem!important;margin-bottom:.2rem!important}.sdb-recap-text{font-size:.92rem!important;line-height:1.3!important}.sdb-controls{right:2rem;bottom:.6rem}}
@media (prefers-reduced-motion:reduce){.sdb-choice,.sdb-cue{animation:none}.sdb-choice{transition-duration:1ms}}
`;

function isEditable(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
}

export function DialogueBox({
  speaker,
  text,
  lineId,
  choices = [],
  onAdvance,
  onChoose,
  read = false,
  onLineRead,
  autoPlay: autoPlayProp,
  defaultAutoPlay = false,
  onAutoPlayChange,
  fastForward: fastForwardProp,
  onFastForwardChange,
  skipReadOnly = true,
  textSpeed = 0.5,
  autoAdvanceSpeed = 0.5,
  onOpenLog,
  hidden = false,
  cue,
  quickControls,
  theme = "ink",
  locale = "en",
  labels: labelsProp,
  className,
}: DialogueBoxProps) {
  const labels = { ...MESSAGES[resolveLocale(locale)], ...labelsProp };
  const isNarrator = !speaker || speaker === "narrator";
  const speakerName = isNarrator ? "" : speaker;
  const hasChoices = choices.length > 0;
  const glyph = cue ?? (theme === "moon" ? "feather" : "caret");

  const [autoPlayInner, setAutoPlayInner] = useState(defaultAutoPlay);
  const autoPlay = autoPlayProp ?? autoPlayInner;
  const setAutoPlay = (on: boolean) => {
    setAutoPlayInner(on);
    onAutoPlayChange?.(on);
  };
  const [ffInner, setFfInner] = useState(false);
  const fastForward = fastForwardProp ?? ffInner;
  const setFastForward = (on: boolean) => {
    setFfInner(on);
    onFastForwardChange?.(on);
  };
  const [ffButton, setFfButton] = useState(false);
  const ffHeldRef = useRef(false);

  // 進場那一刻記下是否讀過；打完字不會原地變灰，下次再看到才用次要色
  const lineKey = `${lineId ?? ""}\u0000${text}`;
  const visitRef = useRef<{ key: string; wasRead: boolean } | null>(null);
  if (visitRef.current?.key !== lineKey) visitRef.current = { key: lineKey, wasRead: read };
  const wasRead = visitRef.current.wasRead;
  const textColor = wasRead ? "var(--story-secondary)" : "var(--story-text)";

  // 打字機：換行時歸零；第一下補完整句，第二下才推進
  const [reveal, setReveal] = useState({ key: lineKey, count: 0 });
  const count = reveal.key === lineKey ? reveal.count : 0;
  const countRef = useRef(0);
  const markedRef = useRef(false);
  const isRevealing = count < text.length;

  const markRead = () => {
    if (lineId && !markedRef.current) {
      markedRef.current = true;
      onLineRead?.(lineId);
    }
  };
  const markReadRef = useRef(markRead);
  markReadRef.current = markRead;
  const advanceRef = useRef(onAdvance);
  advanceRef.current = onAdvance;

  useEffect(() => {
    countRef.current = 0;
    markedRef.current = false;
    setReveal({ key: lineKey, count: 0 });
  }, [lineKey]);

  const msPerChar = msPerCharFor(textSpeed);
  useEffect(() => {
    if (hidden || text.length === 0) return;
    if (countRef.current >= text.length) {
      markReadRef.current();
      return;
    }
    // 快轉遇到選項：直接補完題目，讓選項同一格出現
    if (fastForward && hasChoices) {
      countRef.current = text.length;
      setReveal({ key: lineKey, count: text.length });
      markReadRef.current();
      return;
    }
    const step = fastForward ? Math.max(1, Math.ceil(text.length / Math.max(1, Math.round(FF_TARGET_MS / FF_TICK_MS)))) : 1;
    const timer = window.setInterval(
      () => {
        const next = Math.min(text.length, countRef.current + step);
        countRef.current = next;
        setReveal({ key: lineKey, count: next });
        if (next >= text.length) {
          window.clearInterval(timer);
          markReadRef.current();
        }
      },
      fastForward ? FF_TICK_MS : msPerChar,
    );
    return () => window.clearInterval(timer);
  }, [hidden, text, lineKey, hasChoices, fastForward, msPerChar]);

  const completeReveal = () => {
    countRef.current = text.length;
    setReveal({ key: lineKey, count: text.length });
    markReadRef.current();
  };

  // 自動播放：整句顯示完、沒有選項時，依字數等待後推進
  const autoDelay = autoplayDelayFor(autoAdvanceSpeed, text.length);
  useEffect(() => {
    if (hidden || fastForward || !autoPlay || isRevealing || hasChoices || text.length === 0) return;
    const timer = window.setTimeout(() => advanceRef.current(), autoDelay);
    return () => window.clearTimeout(timer);
  }, [hidden, fastForward, autoPlay, isRevealing, hasChoices, text, autoDelay]);

  // 快轉：讀過的行直接推進；未讀的行停下等玩家
  const ffCountRef = useRef(0);
  useEffect(() => {
    if (!fastForward) ffCountRef.current = 0;
  }, [fastForward]);
  useEffect(() => {
    if (hidden || !fastForward || isRevealing || hasChoices || text.length === 0) return;
    if (skipReadOnly && !wasRead) return;
    if (ffCountRef.current >= MAX_FF_ADVANCES) return;
    ffCountRef.current += 1;
    advanceRef.current();
  }, [hidden, fastForward, isRevealing, hasChoices, text, skipReadOnly, wasRead]);

  // 選項一定會關掉快轉，玩家要重新開
  useEffect(() => {
    if (!hidden && hasChoices && (fastForward || ffButton)) {
      ffHeldRef.current = false;
      setFfButton(false);
      setFastForward(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden, hasChoices, fastForward, ffButton]);

  // 選項剛出現的 350ms 內忽略點擊，避免連點推進時誤選
  const choicesVisible = hasChoices && !isRevealing;
  const [choicesLocked, setChoicesLocked] = useState(true);
  useEffect(() => {
    if (!choicesVisible) {
      setChoicesLocked(true);
      return;
    }
    const timer = window.setTimeout(() => setChoicesLocked(false), 350);
    return () => window.clearTimeout(timer);
  }, [choicesVisible, lineKey]);

  // 鍵盤：數字鍵選選項、A 自動播放、L 回顧、按住 Ctrl 快轉
  const enabled = !hidden && text.length > 0;
  const keyState = useRef({ choices, choicesVisible, autoPlay, onChoose, onOpenLog, setAutoPlay, setFastForward });
  keyState.current = { choices, choicesVisible, autoPlay, onChoose, onOpenLog, setAutoPlay, setFastForward };
  useEffect(() => {
    if (!enabled) return;
    const down = (e: KeyboardEvent) => {
      if (e.defaultPrevented || isEditable(e.target)) return;
      const s = keyState.current;
      if (e.key === "Control" && !e.repeat) {
        ffHeldRef.current = true;
        setFfButton(false);
        s.setFastForward(true);
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const n = Number(e.key);
      if (s.choicesVisible && Number.isInteger(n) && n >= 1 && n <= s.choices.length) {
        if (!s.choices[n - 1].locked) s.onChoose?.(n - 1);
        return;
      }
      if (e.key === "a" || e.key === "A") s.setAutoPlay(!s.autoPlay);
      if ((e.key === "l" || e.key === "L") && s.onOpenLog) s.onOpenLog();
    };
    const up = (e: KeyboardEvent) => {
      if (e.key !== "Control" || !ffHeldRef.current) return;
      ffHeldRef.current = false;
      keyState.current.setFastForward(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [enabled]);

  const showCue = !hasChoices && !isRevealing;
  const visibleText = text.slice(0, count);
  const { tailRef, pos } = useCuePosition(showCue, visibleText);
  const ringMs = autoPlay && !fastForward ? autoDelay : null;

  if (hidden || text.length === 0) return null;

  const handleSurface = () => {
    if (isRevealing) return completeReveal();
    if (!hasChoices) onAdvance();
  };

  const vars = storyThemes[theme] as unknown as CSSProperties;
  const lineSize = isNarrator ? "1.2rem" : "1.34rem";
  const shadow = isNarrator ? "0 1px 6px var(--story-text-shadow)" : "0 1px 8px var(--story-text-shadow)";
  const wrapStyle: CSSProperties = { fontSize: lineSize, lineHeight: 1.95, letterSpacing: "var(--story-tracking)", whiteSpace: "pre-wrap" };
  const cueNode = showCue && pos && <NextLineCue top={pos.top} left={pos.left} glyph={glyph} ringMs={ringMs} />;

  return (
    <div className={cn("sdb-root absolute inset-0 overflow-hidden", className)} style={{ ...vars, fontFamily: "var(--story-font)", color: "var(--story-text)" }}>
      <style>{css}</style>
      {/* 螢幕閱讀器一次收到整句，不逐字播報 */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        <span key={lineKey}>{speakerName ? `${speakerName}${labels.separator}${text}` : text}</span>
      </div>

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "42%",
          zIndex: 28,
          pointerEvents: "none",
          background: "linear-gradient(180deg, rgb(var(--story-scrim) / 0) 0%, rgb(var(--story-scrim) / 0.55) 55%, rgb(var(--story-scrim) / 0.86) 100%)",
        }}
      />

      <div
        role="button"
        tabIndex={0}
        aria-label={labels.continue}
        onClick={handleSurface}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          handleSurface();
        }}
        className="outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--story-accent-dim)]"
        style={{ position: "absolute", inset: 0, zIndex: 29, cursor: "pointer" }}
      />

      {choicesVisible ? (
        <div className="sdb-col sdb-choices" role="group" aria-label={labels.choices} style={{ zIndex: 31, display: "flex", flexDirection: "column", gap: "0.7rem" }}>
          {choices.map((choice, index) => (
            <button
              key={choice.id}
              type="button"
              className={cn("sdb-choice", choice.locked && "sdb-choice--locked", choice.seen && "sdb-choice--seen")}
              disabled={choice.locked}
              aria-disabled={choice.locked || undefined}
              title={choice.locked && choice.requirement ? `${labels.needs}${choice.requirement}` : undefined}
              onClick={(e) => {
                e.stopPropagation();
                if (choicesLocked || choice.locked) return;
                onChoose?.(index);
              }}
            >
              {choice.requirement && (
                <span className="sdb-req">
                  {labels.requirementTag(choice.requirement, choice.locked ? (choice.lockedSuffix ?? labels.lockedSuffix) : undefined)}
                </span>
              )}
              {choice.text}
              {choice.locked && choice.lockedHint && <span className="sdb-hint">{choice.lockedHint}</span>}
              {choice.seen && !choice.locked && (
                <span className="sdb-seen" aria-label={labels.seenLabel}>
                  {labels.seen}
                </span>
              )}
            </button>
          ))}
          {/* 現行台詞跟原本同字級，選項出現時字不會縮放 */}
          <div className="sdb-recap" style={{ marginTop: "0.6rem" }}>
            {speakerName && (
              <div className="sdb-recap-speaker" style={{ color: "var(--story-accent)", fontFamily: "var(--story-font-display)", letterSpacing: "0.2em", marginBottom: "0.5rem", fontSize: "1rem" }}>
                {speakerName}
              </div>
            )}
            <div className="sdb-recap-text" style={{ ...wrapStyle, color: textColor, textShadow: shadow }}>
              {text}
            </div>
          </div>
        </div>
      ) : (
        <div className="sdb-col" style={{ zIndex: 30, pointerEvents: "none" }}>
          {!isNarrator && <div className="sdb-plate">{speakerName}</div>}
          <RevealedLine fullText={text} wrapStyle={wrapStyle} visibleStyle={{ color: textColor, textShadow: shadow }}>
            {renderRevealed(visibleText, showCue, tailRef)}
            {cueNode}
          </RevealedLine>
        </div>
      )}

      {!hasChoices && (
        <div className="sdb-controls" style={{ zIndex: 31 }}>
          {quickControls && (
            <>
              {quickControls}
              <span className="sdb-divider" aria-hidden="true" />
            </>
          )}
          {onOpenLog && (
            <button
              type="button"
              className="sdb-btn"
              aria-label={labels.openLog}
              title={labels.shortcut(labels.openLog, "L")}
              aria-keyshortcuts="L"
              onClick={(e) => {
                e.stopPropagation();
                onOpenLog();
              }}
            >
              <Icon>
                <path d="M5 5.5h14M5 10h14M5 14.5h9M5 19h6" />
              </Icon>
            </button>
          )}
          <button
            type="button"
            className="sdb-btn"
            data-active={autoPlay}
            aria-label={autoPlay ? labels.autoPlayOff : labels.autoPlayOn}
            title={labels.shortcut(autoPlay ? labels.autoPlayOff : labels.autoPlayOn, "A")}
            aria-keyshortcuts="A"
            onClick={(e) => {
              e.stopPropagation();
              setAutoPlay(!autoPlay);
            }}
          >
            <Icon>
              {autoPlay ? (
                <path d="M9 6v12M15 6v12" />
              ) : (
                <path d="M8.5 5.8v12.4a.4.4 0 0 0 .6.35l9.6-6.2a.4.4 0 0 0 0-.7l-9.6-6.2a.4.4 0 0 0-.6.35z" />
              )}
            </Icon>
          </button>
          <button
            type="button"
            className="sdb-btn"
            data-active={fastForward}
            aria-pressed={ffButton}
            aria-keyshortcuts="Control"
            aria-label={ffButton ? labels.fastForwardOff : labels.fastForwardOn}
            title={ffButton ? labels.fastForwardOff : labels.shortcut(labels.fastForwardOn, "Ctrl")}
            onClick={(e) => {
              e.stopPropagation();
              const next = !ffButton;
              setFfButton(next);
              setFastForward(next || ffHeldRef.current);
            }}
          >
            <Icon>
              <path d="M5.5 6.5l5.5 5.5-5.5 5.5M12.5 6.5l5.5 5.5-5.5 5.5" />
            </Icon>
          </button>
        </div>
      )}
    </div>
  );
}
