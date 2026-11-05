"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** 三條路（每一章同一套）：讓它停下、跟它講好、拿走力量 */
export type ChoicePath = "stop" | "talk" | "take";
/** 三條路的顏色全部走 --story-* 變數：中性、強調、代價 */
export const CHOICE_PATH_COLOR: Record<ChoicePath, string> = { stop: "var(--story-text)", talk: "var(--story-accent)", take: "var(--story-danger)" };

/** DESIGN-story.md 的 token；ink 是預設暗色，rice 是宣紙亮色，moon 是月光藍 */
export const storyThemes = {
  ink: {
    "--story-bg": "#0b0e14",
    "--story-panel": "rgb(14 18 28 / 0.86)",
    "--story-line": "rgb(234 228 214 / 0.14)",
    "--story-text": "#eae4d6",
    "--story-muted": "rgb(234 228 214 / 0.6)",
    "--story-accent": "#c9a063",
    "--story-on-accent": "#17130d",
    "--story-danger": "#c4553f",
    "--story-shadow": "0 24px 64px rgb(0 0 0 / 0.45)",
    "--story-highlight": "rgb(255 255 255 / 0.06)",
  },
  rice: {
    "--story-bg": "#f4efe3",
    "--story-panel": "rgb(250 246 236 / 0.94)",
    "--story-line": "rgb(60 48 32 / 0.18)",
    "--story-text": "#2a2219",
    "--story-muted": "rgb(42 34 25 / 0.6)",
    "--story-accent": "#9a6b2a",
    "--story-on-accent": "#fbf6ea",
    "--story-danger": "#a33a26",
    "--story-shadow": "0 8px 24px rgb(60 48 32 / 0.12)",
    "--story-highlight": "rgb(255 255 255 / 0.6)",
  },
  moon: {
    "--story-bg": "#070a12",
    "--story-panel": "rgb(12 17 28 / 0.86)",
    "--story-line": "rgb(233 237 245 / 0.12)",
    "--story-text": "#e9edf5",
    "--story-muted": "rgb(233 237 245 / 0.6)",
    "--story-accent": "#a3b8d9",
    "--story-on-accent": "#0b0f18",
    "--story-danger": "#af637a",
    "--story-shadow": "0 24px 64px rgb(0 0 0 / 0.45)",
    "--story-highlight": "rgb(255 255 255 / 0.06)",
  },
} as const;

export type StoryTheme = keyof typeof storyThemes;

export interface ChoiceRow {
  id: string;
  label: ReactNode;
  /** 三條路的哪一條，決定卡片顏色 */
  path?: ChoicePath;
  /** 自訂顏色，蓋過 path 的顏色 */
  color?: string;
  /** 名字下面一行簡述 */
  brief?: ReactNode;
  /** 選到這張時顯示在底下對話框的那一句，不畫在卡上 */
  meaning?: ReactNode;
  /** 得到什麼，一行一件（綠色＋） */
  gains?: ReactNode[];
  /** 代價，一行一件（紅色－） */
  costs?: ReactNode[];
  /** 卡片上半的圖（像素圖、inline SVG） */
  art?: ReactNode;
  disabled?: boolean;
  /** 做不到的原因，寫成短標籤 */
  reason?: ReactNode;
}

export interface ChoiceCardsLabels {
  close?: string;
  /** 卡片群組的無障礙名稱 */
  group?: string;
}

export interface ChoiceCardsProps {
  /** 對話框名牌上的名字 */
  name: ReactNode;
  /** 對話框裡的那段話 */
  line: ReactNode;
  rows: ChoiceRow[];
  /** 卡片下面「先不動它」的字；沒給就不列 */
  leaveLabel?: ReactNode;
  /** 小卡模式：卡片縮小，畫面中間留給別的東西 */
  compact?: boolean;
  onChoose: (id: string) => void;
  /** 有給才顯示關閉鈕；手把 B 也呼叫它 */
  onClose?: () => void;
  /** 名牌底色，預設是 --story-accent */
  nameplate?: string;
  /** 配色主題，預設 ink */
  theme?: StoryTheme;
  /** 手把操作（十字鍵移動、A 選、B 關），只在焦點在元件內時生效 */
  gamepad?: boolean;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: ChoiceCardsLabels;
  className?: string;
}

const LEAVE_ID = "__leave__";

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, Required<ChoiceCardsLabels>> = {
  en: { close: "Close", group: "Choices" },
  "zh-TW": { close: "關閉", group: "選項" },
  "zh-CN": { close: "关闭", group: "选项" },
  ja: { close: "閉じる", group: "選択肢" },
};

export function ChoiceCards({
  name,
  line,
  rows: choiceRows,
  leaveLabel,
  compact = false,
  onChoose,
  onClose,
  nameplate = "var(--story-accent)",
  theme = "ink",
  gamepad = true,
  locale = "en",
  labels,
  className,
}: ChoiceCardsProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const id = useId();
  const rows: (ChoiceRow & { accent: string })[] = [
    ...choiceRows.map((r) => ({ ...r, accent: r.color ?? (r.path ? CHOICE_PATH_COLOR[r.path] : "var(--story-text)") })),
    ...(leaveLabel ? [{ id: LEAVE_ID, label: leaveLabel, accent: "var(--story-text)" }] : []),
  ];
  const [focus, setFocus] = useState(() => Math.max(0, rows.findIndex((r) => !r.disabled)));
  const focusRef = useRef(focus);
  focusRef.current = focus;
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const pick = (i: number) => {
    const row = rows[i];
    if (!row || row.disabled) return;
    if (row.id === LEAVE_ID) onClose?.();
    else onChoose(row.id);
  };
  const move = (i: number, moveDomFocus = false) => {
    setFocus(i);
    if (moveDomFocus) btnRefs.current[i]?.focus();
  };
  const step = (from: number, dir: 1 | -1) => {
    for (let k = 1; k <= rows.length; k++) {
      const i = (((from + dir * k) % rows.length) + rows.length) % rows.length;
      if (!rows[i].disabled) return i;
    }
    return from;
  };

  // 數字鍵直選、左右或上下移動（也吃 WASD）、Enter／空白確認
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.repeat) return;
    const digit = /^Digit[1-9]$/.test(e.code) ? Number(e.code.slice(5)) : /^Numpad[1-9]$/.test(e.code) ? Number(e.code.slice(6)) : 0;
    if (digit >= 1 && digit <= rows.length) {
      e.preventDefault();
      if (rows[digit - 1].disabled) move(digit - 1, true);
      else {
        move(digit - 1, true);
        pick(digit - 1);
      }
      return;
    }
    const next = ["ArrowRight", "ArrowDown", "KeyD", "KeyS"].includes(e.code);
    const prev = ["ArrowLeft", "ArrowUp", "KeyA", "KeyW"].includes(e.code);
    if (next) {
      e.preventDefault();
      move(step(focusRef.current, 1), true);
    } else if (prev) {
      e.preventDefault();
      move(step(focusRef.current, -1), true);
    } else if (e.code === "Enter" || e.code === "NumpadEnter" || e.code === "Space") {
      e.preventDefault();
      pick(focusRef.current);
    } else if (e.code === "Escape" && onClose) {
      e.preventDefault();
      onClose();
    }
  };

  // 手把：十字鍵／左搖桿移動（按住 350ms 後每 110ms 連發），A 選，B 關
  const latest = useRef({ pick, move, step, onClose });
  latest.current = { pick, move, step, onClose };
  useEffect(() => {
    if (!gamepad || typeof navigator === "undefined" || !navigator.getGamepads) return;
    let raf = 0;
    let prevA = true;
    let prevB = true;
    let dir = 0;
    let nextRepeat = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const root = rootRef.current;
      if (!root || !root.contains(document.activeElement)) {
        prevA = prevB = true;
        dir = 0;
        return;
      }
      const pad = Array.from(navigator.getGamepads()).find((p) => p && p.connected);
      if (!pad) return;
      const b = (i: number) => Boolean(pad.buttons[i]?.pressed);
      const ax = pad.axes[0] ?? 0;
      const ay = pad.axes[1] ?? 0;
      const d = b(15) || b(13) || ax > 0.5 || ay > 0.5 ? 1 : b(14) || b(12) || ax < -0.5 || ay < -0.5 ? -1 : 0;
      const L = latest.current;
      if (d !== 0 && (d !== dir || now >= nextRepeat)) {
        nextRepeat = now + (d !== dir ? 350 : 110);
        L.move(L.step(focusRef.current, d as 1 | -1), true);
      }
      dir = d;
      if (b(0) && !prevA) L.pick(focusRef.current);
      if (b(1) && !prevB) L.onClose?.();
      prevA = b(0);
      prevB = b(1);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [gamepad]);

  const leaveIndex = leaveLabel ? rows.length - 1 : -1;
  const focused = rows[focus];
  const meaningId = `${id}-meaning`;

  return (
    <div
      ref={rootRef}
      onKeyDown={onKeyDown}
      className={cn("cc-root flex w-full flex-col items-center select-none", compact && "cc-compact", className)}
      style={storyThemes[theme] as unknown as CSSProperties}
    >
      <style>{STYLES}</style>
      <div className="cc-cards" role="group" aria-label={t.group}>
        {choiceRows.map((r, i) => {
          const row = rows[i];
          const sel = focus === i && !r.disabled;
          return (
            <button
              key={r.id}
              ref={(el) => {
                btnRefs.current[i] = el;
              }}
              type="button"
              tabIndex={focus === i ? 0 : -1}
              aria-disabled={r.disabled || undefined}
              aria-current={sel || undefined}
              aria-describedby={[sel && focused?.meaning ? meaningId : "", r.disabled && r.reason ? `${id}-reason-${i}` : ""].filter(Boolean).join(" ") || undefined}
              className={cn("cc-card", sel && "sel", r.disabled && "disabled")}
              style={{ "--cc-accent": row.accent } as CSSProperties}
              onClick={() => {
                move(i);
                pick(i);
              }}
              onMouseEnter={() => move(i)}
              onFocus={() => setFocus(i)}
            >
              <span className="cc-art">
                {r.art && <span className="cc-art-img">{r.art}</span>}
                <span className="cc-num" aria-hidden="true">
                  {i + 1}
                </span>
              </span>
              <span className="cc-banner">
                <span className="cc-label">{r.label}</span>
              </span>
              <span className="cc-body">
                {r.brief && <span className="cc-brief">{r.brief}</span>}
                {r.gains?.map((g, k) => (
                  <span key={`g${k}`} className="cc-line gain">
                    <b aria-hidden="true">＋</b>
                    {g}
                  </span>
                ))}
                {r.costs?.map((c, k) => (
                  <span key={`c${k}`} className="cc-line cost">
                    <b aria-hidden="true">－</b>
                    {c}
                  </span>
                ))}
                {r.disabled && r.reason && (
                  <span id={`${id}-reason-${i}`} className="cc-reason">
                    {r.reason}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {leaveLabel && (
        <div className="cc-leave-row">
          <button
            ref={(el) => {
              btnRefs.current[leaveIndex] = el;
            }}
            type="button"
            tabIndex={focus === leaveIndex ? 0 : -1}
            className={cn("cc-leave", focus === leaveIndex && "sel")}
            onClick={() => pick(leaveIndex)}
            onMouseEnter={() => move(leaveIndex)}
            onFocus={() => setFocus(leaveIndex)}
          >
            <span className="cc-num" aria-hidden="true">
              {leaveIndex + 1}
            </span>
            {leaveLabel}
          </button>
        </div>
      )}

      <div className="cc-box">
        <div className="cc-head">
          <div className="cc-name" style={{ background: nameplate }}>
            {name}
          </div>
          {onClose && (
            <button type="button" className="cc-close" aria-label={t.close} title={t.close} onClick={onClose}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true" shapeRendering="crispEdges">
                <path d="M5 5h2v2H5zm4 4H7V7h2zm2 2H9V9h2zm2 0h-2v2H9v2H7v2H5v2h2v-2h2v-2h2v-2h2v2h2v2h2v2h2v-2h-2v-2h-2v-2h-2zm2-2v2h-2V9zm2-2v2h-2V7zm0 0V5h2v2z" />
              </svg>
            </button>
          )}
        </div>
        <div className="cc-text">
          {line}
          <span id={meaningId} aria-live="polite" className="cc-meaning" style={{ color: focused?.accent }}>
            {focused?.meaning}
          </span>
        </div>
      </div>
    </div>
  );
}

// 結構沿用原作 ChoiceDialogue.tsx 的 CHOICE_CARD_STYLES 與 gameMenuKit 的對話框；
// 顏色全部改走 --story-*，保留方角、像素圖與一層內光，拿掉彩色外發光與霓虹色
const STYLES = `
  .cc-root { container-type: inline-size; color: var(--story-text); }
  .cc-cards { width: 100%; max-width: 960px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: stretch; gap: 18px; margin-bottom: 10px; padding-top: 12px; box-sizing: border-box; }
  @keyframes cc-in-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
  .cc-card { position: relative; display: flex; flex-direction: column; align-items: stretch; min-width: 0;
    padding: 6px; text-align: left; font: inherit; cursor: pointer; color: var(--story-text); border-radius: 2px;
    background: var(--story-panel); border: 1px solid var(--story-line); outline: none;
    box-shadow: inset 0 1px 0 var(--story-highlight);
    animation: cc-in-up 0.24s cubic-bezier(0.22,0.72,0.2,1) backwards;
    transition: transform 0.12s cubic-bezier(0.22,0.72,0.2,1), border-color 0.12s; }
  .cc-card:hover:not(.disabled), .cc-card.sel { transform: translateY(-6px); }
  .cc-card.sel { border-color: var(--cc-accent); box-shadow: inset 0 1px 0 var(--story-highlight), inset 0 0 0 1px var(--cc-accent); }
  .cc-card:focus-visible { border-color: var(--cc-accent); box-shadow: inset 0 0 0 1px var(--cc-accent), 0 0 0 2px var(--story-bg), 0 0 0 3px var(--story-accent); }
  .cc-card.disabled { cursor: default; opacity: 0.55; }
  .cc-art { position: relative; display: flex; align-items: center; justify-content: center;
    height: clamp(96px, 20vh, 168px); margin: 0; overflow: hidden;
    background: var(--story-bg); border: 1px solid var(--story-line); border-radius: 2px; }
  .cc-art-img { display: flex; height: 72%; aspect-ratio: 1; image-rendering: pixelated; color: var(--cc-accent); }
  .cc-art-img > * { width: 100%; height: 100%; }
  .cc-banner { position: relative; z-index: 1; display: flex; justify-content: center; margin: -12px 0 0; padding: 0 6px; }
  .cc-label { display: block; max-width: 100%; padding: 3px 12px 4px; font-size: 16px; font-weight: 700; text-align: center; letter-spacing: 0.04em;
    color: var(--story-text); background: var(--story-bg); border: 1px solid var(--story-line); border-radius: 2px; }
  .cc-card.sel .cc-label { border-color: var(--cc-accent); }
  .cc-body { display: flex; flex-direction: column; gap: 4px; padding: 8px 10px 6px; flex: 1; }
  .cc-num { position: absolute; top: 6px; left: 6px; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: var(--story-muted); background: var(--story-panel); border: 1px solid var(--story-line); border-radius: 2px; }
  .cc-card.sel .cc-num, .cc-leave.sel .cc-num { color: var(--story-on-accent); background: var(--story-accent); border-color: var(--story-accent); }
  .cc-brief { font-size: 13px; color: var(--story-muted); line-height: 1.45; margin-bottom: 2px; text-align: center; }
  .cc-line { display: flex; gap: 6px; font-size: 13px; font-weight: 500; line-height: 1.45; color: var(--story-text); }
  .cc-line b { flex: none; font-weight: 700; }
  .cc-line.gain b { color: var(--story-accent); }
  .cc-line.cost b { color: var(--story-danger); }
  .cc-reason { display: block; align-self: stretch; margin-top: 2px; padding: 3px 8px; font-size: 12px; font-weight: 600; line-height: 1.45;
    letter-spacing: 0.02em; color: var(--story-danger); background: transparent; border: 1px solid var(--story-line); border-radius: 2px; }
  .cc-label, .cc-brief, .cc-line { overflow-wrap: anywhere; }
  .cc-leave-row { width: 100%; max-width: 1100px; display: flex; justify-content: flex-end; margin-bottom: 10px; box-sizing: border-box; }
  .cc-leave { display: inline-flex; align-items: center; gap: 8px; padding: 5px 14px; font: inherit; font-size: 13px; font-weight: 500;
    color: var(--story-muted); background: var(--story-panel); border: 1px solid var(--story-line); cursor: pointer; outline: none; border-radius: 2px;
    transition: color 0.12s, border-color 0.12s; }
  .cc-leave .cc-num { position: static; width: 18px; height: 18px; font-size: 11px; }
  .cc-leave.sel { color: var(--story-text); border-color: var(--story-accent); }
  .cc-leave:focus-visible { box-shadow: 0 0 0 2px var(--story-bg), 0 0 0 3px var(--story-accent); }
  .cc-box { position: relative; width: 100%; max-width: 1100px; margin-top: 14px; padding: 0 12px 10px 22px; box-sizing: border-box;
    background: var(--story-panel); border: 1px solid var(--story-line); border-radius: 2px;
    box-shadow: inset 0 1px 0 var(--story-highlight), var(--story-shadow); animation: cc-in-up 0.24s cubic-bezier(0.22,0.72,0.2,1) backwards; }
  .cc-head { display: flex; align-items: center; gap: 10px; min-height: 40px; }
  .cc-name { position: relative; z-index: 1; align-self: flex-start; flex-shrink: 0; max-width: 55%; margin-top: -12px; padding: 3px 12px 3px;
    font-size: 15px; font-weight: 700; letter-spacing: 0.18em; line-height: 1.3; color: var(--story-on-accent);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border-radius: 2px; }
  .cc-close { margin-left: auto; display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; padding: 0;
    cursor: pointer; color: var(--story-muted); background: transparent; border: 1px solid var(--story-line); border-radius: 2px;
    transition: color 0.12s, border-color 0.12s, transform 0.08s; }
  .cc-close:hover { color: var(--story-text); border-color: var(--story-muted); }
  .cc-close:active { transform: translateY(1px); }
  .cc-close:focus-visible { outline: 1px solid var(--story-accent); outline-offset: 2px; }
  .cc-text { min-height: 92px; margin: 2px 10px 8px 0; font-size: 17px; line-height: 1.8; color: var(--story-text); white-space: pre-line;
    font-family: "Noto Serif TC", "Songti TC", serif; max-width: 34em; }
  .cc-meaning { display: block; margin-top: 8px; font-weight: 600; }
  .cc-meaning:empty { display: none; }
  .cc-compact .cc-cards { max-width: 720px; gap: 12px; margin-bottom: 6px; }
  .cc-compact .cc-art { height: clamp(40px, 7vh, 64px); }
  .cc-compact .cc-banner { margin-top: -8px; }
  .cc-compact .cc-label { font-size: 14px; padding: 2px 10px 3px; }
  .cc-compact .cc-body { gap: 1px; padding: 5px 8px 3px; }
  .cc-compact .cc-brief, .cc-compact .cc-line { font-size: 12px; line-height: 1.35; }
  .cc-compact .cc-num { width: 18px; height: 18px; font-size: 11px; top: 4px; left: 4px; }
  .cc-compact .cc-card:hover:not(.disabled), .cc-compact .cc-card.sel { transform: translateY(-4px); }
  .cc-compact .cc-leave-row { max-width: 720px; margin-bottom: 6px; }
  @container (max-width: 720px) { .cc-cards { grid-template-columns: minmax(0, 1fr); } .cc-art { height: 80px; } }
  @media (prefers-reduced-motion: reduce) {
    .cc-card, .cc-box { animation: none; }
    .cc-card, .cc-close, .cc-leave { transition: none; }
    .cc-card:hover:not(.disabled), .cc-card.sel { transform: none; }
  }
`;
