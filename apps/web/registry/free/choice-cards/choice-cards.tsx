"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** 三條路（每一章同一套）：讓它停下、跟它講好、拿走力量 */
export type ChoicePath = "stop" | "talk" | "take";
export const CHOICE_PATH_COLOR: Record<ChoicePath, string> = { stop: "#e5e7eb", talk: "#34d399", take: "#f87171" };

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
  /** 名牌底色，預設是原作的紅色漸層 */
  nameplate?: string;
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
  nameplate = "linear-gradient(180deg, #f87171 0%, #dc2626 50%, #7f1d1d 100%)",
  gamepad = true,
  locale = "en",
  labels,
  className,
}: ChoiceCardsProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const id = useId();
  const rows: (ChoiceRow & { accent: string })[] = [
    ...choiceRows.map((r) => ({ ...r, accent: r.color ?? (r.path ? CHOICE_PATH_COLOR[r.path] : "#e8edf5") })),
    ...(leaveLabel ? [{ id: LEAVE_ID, label: leaveLabel, accent: "#e8edf5" }] : []),
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
              style={{ "--cc-accent": row.accent, animationDelay: `${0.08 + i * 0.09}s` } as CSSProperties}
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
              <i className="cc-rivet tl" />
              <i className="cc-rivet tr" />
              <i className="cc-rivet bl" />
              <i className="cc-rivet br" />
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

// 原作 ChoiceDialogue.tsx 的 CHOICE_CARD_STYLES，加上 gameMenuKit 的面板與 NPC 對話框樣式
const STYLES = `
  .cc-root { container-type: inline-size; color: #e8edf5; }
  .cc-cards { width: 100%; max-width: 960px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: stretch; gap: 18px; margin-bottom: 10px; padding-top: 12px; box-sizing: border-box; perspective: 900px; }
  @keyframes cc-deal { from { opacity: 0; transform: translateY(46px) rotateX(35deg) scale(0.92); } to { opacity: 1; transform: none; } }
  @keyframes cc-glow { 0%, 100% { filter: drop-shadow(0 0 6px var(--cc-accent)); } 50% { filter: drop-shadow(0 0 14px var(--cc-accent)); } }
  @keyframes cc-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
  @keyframes cc-in-up { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
  .cc-card { position: relative; display: flex; flex-direction: column; align-items: stretch; min-width: 0;
    padding: 6px; text-align: left; font: inherit; cursor: pointer; color: #d8dee9; border-radius: 0;
    background: linear-gradient(180deg, #1b2233 0%, #0c111c 100%);
    border: 3px solid #05070c; outline: none;
    box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--cc-accent) 55%, #2a3346), inset 0 0 0 4px #05070c,
      inset 0 0 0 5px rgba(255,255,255,0.06), 6px 6px 0 rgba(0,0,0,0.45);
    animation: cc-deal 0.45s cubic-bezier(0.22,1,0.36,1) backwards; transform-origin: 50% 100%;
    transition: transform 0.2s cubic-bezier(0.22,1,0.36,1), box-shadow 0.2s; }
  .cc-card:hover:not(.disabled), .cc-card.sel { transform: translateY(-10px); }
  .cc-card.sel { box-shadow: inset 0 0 0 2px var(--cc-accent), inset 0 0 0 4px #05070c,
      inset 0 0 0 5px rgba(255,255,255,0.12), 0 0 0 2px #f5c542, 0 0 26px color-mix(in srgb, var(--cc-accent) 55%, transparent), 6px 14px 0 rgba(0,0,0,0.45); }
  .cc-card:focus-visible { box-shadow: inset 0 0 0 2px var(--cc-accent), inset 0 0 0 4px #05070c, 0 0 0 2px #f5c542, 0 0 0 4px #000; }
  .cc-card.disabled { cursor: default; filter: grayscale(0.85) brightness(0.7); }
  .cc-art { position: relative; display: flex; align-items: center; justify-content: center;
    height: clamp(96px, 20vh, 168px); margin: 4px 4px 0; overflow: hidden;
    background: radial-gradient(circle at 50% 55%, color-mix(in srgb, var(--cc-accent) 38%, transparent) 0%, transparent 62%),
      repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0 4px, transparent 4px 8px),
      linear-gradient(180deg, #121a2b 0%, #070a12 100%);
    border: 2px solid #05070c; box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--cc-accent) 35%, transparent), inset 0 -10px 18px rgba(0,0,0,0.5); }
  .cc-art-img { display: flex; height: 96%; aspect-ratio: 1; image-rendering: pixelated; filter: drop-shadow(0 0 6px var(--cc-accent)); }
  .cc-art-img > * { width: 100%; height: 100%; }
  .cc-card.sel .cc-art-img { animation: cc-glow 1.6s ease-in-out infinite, cc-float 1.6s ease-in-out infinite; }
  .cc-banner { position: relative; z-index: 1; display: flex; justify-content: center; margin: -12px 0 0; padding: 0 6px; }
  .cc-label { display: block; max-width: 100%; padding: 4px 14px 5px; font-size: 17px; font-weight: 900; text-align: center;
    color: #fff; text-shadow: 0 2px 0 rgba(0,0,0,0.7);
    background: linear-gradient(180deg, color-mix(in srgb, var(--cc-accent) 70%, #000) 0%, color-mix(in srgb, var(--cc-accent) 38%, #000) 100%);
    border: 2px solid #05070c; box-shadow: inset 0 2px 0 rgba(255,255,255,0.25), inset 0 -2px 0 rgba(0,0,0,0.35), 3px 3px 0 rgba(0,0,0,0.4); }
  .cc-body { display: flex; flex-direction: column; gap: 4px; padding: 8px 10px 6px; flex: 1; }
  .cc-num { position: absolute; top: 6px; left: 6px; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 900; color: #1a1205; background: #f5c542; border: 2px solid #05070c;
    box-shadow: inset 0 2px 0 rgba(255,255,255,0.5), inset 0 -2px 0 rgba(0,0,0,0.25); }
  .cc-rivet { position: absolute; width: 6px; height: 6px; background: color-mix(in srgb, var(--cc-accent) 60%, #b8c0d0);
    border: 1px solid #05070c; pointer-events: none; }
  .cc-rivet.tl { top: 2px; left: 2px; } .cc-rivet.tr { top: 2px; right: 2px; }
  .cc-rivet.bl { bottom: 2px; left: 2px; } .cc-rivet.br { bottom: 2px; right: 2px; }
  .cc-brief { font-size: 13px; color: #e8edf5; line-height: 1.45; margin-bottom: 2px; text-align: center; }
  .cc-line { display: flex; gap: 6px; font-size: 13px; font-weight: 700; line-height: 1.45; }
  .cc-line b { flex: none; font-weight: 900; }
  .cc-line.gain { color: #86efac; }
  .cc-line.cost { color: #fca5a5; }
  .cc-reason { display: block; align-self: stretch; margin-top: 2px; padding: 3px 8px; font-size: 12px; font-weight: 900; line-height: 1.45;
    letter-spacing: 0.02em; color: #fca5a5; background: rgba(6,10,18,0.7); border: 1px solid rgba(248,113,113,0.5); }
  .cc-label, .cc-brief, .cc-line { overflow-wrap: anywhere; }
  .cc-leave-row { width: 100%; max-width: 1100px; display: flex; justify-content: flex-end; margin-bottom: 10px; box-sizing: border-box; }
  .cc-leave { display: inline-flex; align-items: center; gap: 8px; padding: 5px 14px; font: inherit; font-size: 13px; font-weight: 700;
    color: #d8dee9; background: rgba(6,10,18,0.8); border: 1px solid rgba(61,79,107,0.6); cursor: pointer; outline: none; border-radius: 0; }
  .cc-leave .cc-num { position: static; width: 18px; height: 18px; font-size: 11px; }
  .cc-leave.sel { color: #fff; border-color: rgba(245,197,66,0.7); background: rgba(24,22,14,0.9); }
  .cc-leave:focus-visible { box-shadow: 0 0 0 2px #f5c542; }
  .cc-box { position: relative; width: 100%; max-width: 1100px; margin-top: 14px; padding: 0 12px 10px 22px; box-sizing: border-box;
    background: linear-gradient(180deg, rgba(17,24,35,0.93), rgba(9,13,20,0.93));
    border-top: 2px solid #3d4f6b; border-left: 2px solid #3d4f6b; border-bottom: 2px solid #05070b; border-right: 2px solid #05070b;
    box-shadow: 0 0 0 1px #000, 5px 5px 0 rgba(0,0,0,0.45); animation: cc-in-up 0.5s cubic-bezier(0.22,1,0.36,1) backwards; }
  .cc-box::before { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 2px; pointer-events: none;
    background: linear-gradient(90deg, rgba(245,197,66,0.7), rgba(245,197,66,0) 60%); }
  .cc-head { display: flex; align-items: center; gap: 10px; min-height: 40px; }
  .cc-name { position: relative; z-index: 1; align-self: flex-start; flex-shrink: 0; max-width: 55%; margin-top: -12px; padding: 4px 14px 3px;
    font-size: 17px; font-weight: 900; letter-spacing: 0.08em; line-height: 1.3; color: #fff7ed;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 1px 0 rgba(0,0,0,0.5);
    border-top: 2px solid #fff1bf; border-left: 2px solid #ffe7a0; border-bottom: 3px solid #7a4d08; border-right: 2px solid #8f5e10;
    box-shadow: 0 0 0 1px #000, 3px 3px 0 rgba(0,0,0,0.45); }
  .cc-close { margin-left: auto; display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; padding: 0;
    cursor: pointer; color: #d8dee9; background: rgba(14,20,30,0.9); border-radius: 0;
    border-top: 2px solid #4a5d7c; border-left: 2px solid #4a5d7c; border-bottom: 2px solid #05070b; border-right: 2px solid #05070b;
    box-shadow: 0 0 0 1px #000; transition: color 0.15s, background 0.15s, transform 0.08s; }
  .cc-close:hover { color: #fff; background: rgba(28,38,56,0.95); }
  .cc-close:active { transform: translateY(2px); }
  .cc-close:focus-visible { outline: 2px solid #f5c542; outline-offset: 1px; }
  .cc-text { min-height: 92px; margin: 2px 10px 8px 0; font-size: 17px; line-height: 1.7; color: #e8edf5; white-space: pre-line; }
  .cc-meaning { display: block; margin-top: 8px; font-weight: 700; }
  .cc-meaning:empty { display: none; }
  .cc-compact .cc-cards { max-width: 720px; gap: 12px; margin-bottom: 6px; }
  .cc-compact .cc-art { height: clamp(40px, 7vh, 64px); margin: 2px 2px 0; }
  .cc-compact .cc-banner { margin-top: -8px; }
  .cc-compact .cc-label { font-size: 14px; padding: 2px 10px 3px; }
  .cc-compact .cc-body { gap: 1px; padding: 5px 8px 3px; }
  .cc-compact .cc-brief, .cc-compact .cc-line { font-size: 12px; line-height: 1.35; }
  .cc-compact .cc-num { width: 18px; height: 18px; font-size: 11px; top: 4px; left: 4px; }
  .cc-compact .cc-card:hover:not(.disabled), .cc-compact .cc-card.sel { transform: translateY(-6px); }
  .cc-compact .cc-leave-row { max-width: 720px; margin-bottom: 6px; }
  @container (max-width: 720px) { .cc-cards { grid-template-columns: minmax(0, 1fr); } .cc-art { height: 80px; } }
  @media (prefers-reduced-motion: reduce) {
    .cc-card, .cc-box, .cc-card.sel .cc-art-img { animation: none; }
    .cc-card, .cc-close { transition: none; }
  }
`;
