"use client";

import { useRef, useState, type CSSProperties, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

// 移植自 死神的祝福 src/presentation/memoir/records-panel.tsx 與 records-panel.css：
// 檔案室的「結局與成就」頁。左邊是結局的任務檔案，右邊是一條靈魂之絲蛇行穿過絲結。
// 指到或選到哪一項，下方讀出列就說明那一項；方向鍵照畫面位置移動。全畫面的暖色只給靈魂之絲。

export interface RecordsEnding {
  id: string;
  title: string;
  description: string;
  /** 已抵達：檔案翻成白紙並蓋上歸檔章 */
  seen: boolean;
}

export interface RecordsAchievement {
  id: string;
  title: string;
  description: string;
  /** 未達成時只顯示提示，名稱達成後才顯示 */
  hint: string;
  done: boolean;
  /** 24x24 viewBox 的 path d，畫在菱形封印裡 */
  icon?: string;
}

export type RecordsSelection = { kind: "ending"; index: number } | { kind: "achievement"; index: number };

export interface RecordsThreadBoardProps {
  endings: readonly RecordsEnding[];
  /** 依絲線順序排列，三個一排蛇行（上排往右，下排往左） */
  achievements: readonly RecordsAchievement[];
  onSelect?: (selection: RecordsSelection) => void;
  /** 靈魂之絲的顏色，預設原本的玫瑰色 */
  thread?: string;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<RecordsThreadBoardLabels>;
  className?: string;
  style?: CSSProperties;
}

export interface RecordsThreadBoardLabels {
  endings: string;
  achievements: string;
  fileTab: (index: number) => string;
  unfiled: string;
  stamp: string;
  unreached: string;
  unreachedTitle: string;
  unreachedBody: string;
  knotLocked: string;
  knotLockedTitle: string;
  knotLockedPrefix: string;
  /** 已完成項目的無障礙名稱：標題加說明 */
  entry: (title: string, description: string) => string;
  /** 標題旁的進度，例如 3／6 */
  count: (done: number, total: number) => string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const pad = (index: number) => String(index + 1).padStart(2, "0");
const cjkEntry = (title: string, description: string) => `${title}：${description}`;
const cjkCount = (done: number, total: number) => `${done}／${total}`;

const MESSAGES: Record<SunLocale, RecordsThreadBoardLabels> = {
  en: {
    endings: "Endings",
    achievements: "Achievements",
    fileTab: (index) => `File ${pad(index)}`,
    unfiled: "Unfiled",
    stamp: "Filed",
    unreached: "Ending not reached",
    unreachedTitle: "Not reached yet",
    unreachedBody: "This file has no ending written yet.",
    knotLocked: "Untied",
    knotLockedTitle: "An untied knot",
    knotLockedPrefix: "Not achieved: ",
    entry: (title, description) => `${title}: ${description}`,
    count: (done, total) => `${done}/${total}`,
  },
  "zh-TW": {
    endings: "結局",
    achievements: "成就",
    fileTab: (index) => `檔案 ${pad(index)}`,
    unfiled: "未歸檔",
    stamp: "已歸檔",
    unreached: "未抵達的結局",
    unreachedTitle: "尚未抵達",
    unreachedBody: "這份檔案還沒有寫下結尾。",
    knotLocked: "未解開",
    knotLockedTitle: "未解開的絲結",
    knotLockedPrefix: "未達成：",
    entry: cjkEntry,
    count: cjkCount,
  },
  "zh-CN": {
    endings: "结局",
    achievements: "成就",
    fileTab: (index) => `档案 ${pad(index)}`,
    unfiled: "未归档",
    stamp: "已归档",
    unreached: "未抵达的结局",
    unreachedTitle: "尚未抵达",
    unreachedBody: "这份档案还没有写下结尾。",
    knotLocked: "未解开",
    knotLockedTitle: "未解开的丝结",
    knotLockedPrefix: "未达成：",
    entry: cjkEntry,
    count: cjkCount,
  },
  ja: {
    endings: "結末",
    achievements: "実績",
    fileTab: (index) => `ファイル ${pad(index)}`,
    unfiled: "未保管",
    stamp: "保管済",
    unreached: "未到達の結末",
    unreachedTitle: "未到達",
    unreachedBody: "このファイルにはまだ結末が書かれていません。",
    knotLocked: "未解放",
    knotLockedTitle: "ほどけていない結び目",
    knotLockedPrefix: "未達成：",
    entry: cjkEntry,
    count: cjkCount,
  },
};

const FALLBACK_ICON = "M20 4c-7 0-13 5-14 12l-2 4M6 16l9-9M9 13h6M12 10h5";
const THREAD_COLUMNS = 3;

function knotCell(index: number): { column: number; row: number } {
  const row = Math.floor(index / THREAD_COLUMNS);
  const offset = index % THREAD_COLUMNS;
  return { column: row % 2 === 0 ? offset : THREAD_COLUMNS - 1 - offset, row };
}

function threadSegment(from: readonly number[], to: readonly number[], index: number): string {
  const sag = index % 2 === 0 ? 5 : -5;
  const controlX = from[0] === to[0] ? from[0] + 13 : (from[0] + to[0]) / 2;
  const controlY = from[0] === to[0] ? (from[1] + to[1]) / 2 : from[1] + sag;
  return `M${from[0]} ${from[1]}Q${controlX} ${controlY} ${to[0]} ${to[1]}`;
}

const DISPLAY = '"Noto Serif TC", "Songti TC", "PMingLiU", serif';
const UI = '"PingFang TC", "Noto Sans TC", "Microsoft JhengHei", "Heiti TC", sans-serif';

const css = `
@layer components{.rtb{height:clamp(22rem,62vh,30rem)}}
.rtb{--thread-soft:color-mix(in srgb,var(--thread) 50%,transparent);--moon-bright:#d5e1f5;position:relative;box-sizing:border-box;display:flex;flex-direction:column;min-height:0;overflow:hidden;color:#d7deeb;font-family:${UI};border:1px solid rgba(143,157,182,.42);border-top-width:3px;border-radius:2px;background:radial-gradient(ellipse 60% 110% at 100% 0%,rgba(163,184,217,.14),transparent 70%),linear-gradient(180deg,#151b28,#0c1019);box-shadow:0 1.2rem 2.5rem rgba(0,0,0,.6)}
.rtb *,.rtb *::before,.rtb *::after{box-sizing:border-box}
.rtb .records-board{flex:1 1 auto;display:grid;grid-template-columns:minmax(0,3fr) minmax(0,7fr);gap:clamp(.8rem,2.5vw,2rem);min-height:0;padding:clamp(.5rem,2vh,1.1rem) clamp(.8rem,2.5vw,1.8rem)}
.rtb .records-endings,.rtb .records-knots{display:flex;flex-direction:column;min-width:0;min-height:0}
.rtb .records-heading{display:flex;align-items:baseline;gap:.7rem;margin:0 0 clamp(.3rem,1vh,.6rem);color:#8fa3c6;font-family:${DISPLAY};font-size:clamp(.82rem,1.2vw,.98rem);font-weight:400;letter-spacing:.16em}
.rtb .records-heading span{color:var(--thread);font-size:.9em;letter-spacing:.04em}
.rtb .records-ending-list{flex:1 1 auto;display:flex;flex-direction:column;gap:.5rem;min-height:0;padding:.35rem .4rem .35rem 0;container-type:size}
.rtb .records-file{position:relative;flex:1 1 0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:0;overflow:hidden;margin:0;padding:1.5rem .5rem .5rem;color:rgba(215,222,235,.45);font:inherit;background:repeating-linear-gradient(0deg,transparent 0 1.3rem,rgba(143,157,182,.07) 1.3rem calc(1.3rem + 1px)),linear-gradient(160deg,#1b2231,#10141e);border:1px solid rgba(143,157,182,.3);border-radius:2px;box-shadow:0 .5rem 1rem rgba(0,0,0,.45);cursor:pointer;transition:transform 200ms ease,box-shadow 200ms ease,border-color 200ms ease;animation:rtb-rise 360ms ease both;-webkit-tap-highlight-color:transparent}
.rtb .records-file.is-done{color:#2a2f3a;background:repeating-linear-gradient(0deg,transparent 0 1.3rem,rgba(73,93,128,.14) 1.3rem calc(1.3rem + 1px)),linear-gradient(160deg,#dfe3ea,#c3cad7);border-color:#e8ecf3}
.rtb .records-file.is-selected,.rtb .records-file:focus-visible{outline:none;border-color:var(--thread);box-shadow:0 .7rem 1.4rem rgba(0,0,0,.55),0 0 .9rem var(--thread-soft);transform:translateY(-.2rem) rotate(-.8deg)}
.rtb .records-file-tab{position:absolute;top:.5rem;left:.7rem;font-size:.68rem;letter-spacing:.14em;opacity:.7}
.rtb .records-file-title{font-family:${DISPLAY};font-size:clamp(.95rem,13cqw,1.5rem);letter-spacing:.1em;line-height:1.3;text-align:center}
.rtb .records-file-stamp{position:absolute;right:.7rem;bottom:.7rem;padding:.05em .45em;color:#a33a57;font-family:${DISPLAY};font-size:clamp(.7rem,9cqw,.95rem);letter-spacing:.14em;border:2px solid currentColor;border-radius:2px;opacity:.85;transform:rotate(-11deg);animation:rtb-stamp 320ms 260ms cubic-bezier(.2,1.5,.4,1) both}
.rtb .records-knot-field{position:relative;flex:1 1 auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));min-height:0;container-type:size;--seal:min(11cqw,24cqh)}
.rtb .records-thread{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.rtb .records-thread-segment{fill:none;stroke:rgba(158,177,209,.22);stroke-width:1.5;vector-effect:non-scaling-stroke;animation:rtb-thread-show 420ms calc(var(--i) * 110ms + 120ms) ease-out both}
.rtb .records-thread-segment.is-lit{stroke:var(--thread);stroke-width:2;filter:drop-shadow(0 0 3px var(--thread-soft))}
.rtb .records-knot{position:relative;min-width:0;min-height:0;margin:0;padding:0;color:rgba(158,177,209,.42);font:inherit;background:none;border:0;cursor:pointer;animation:rtb-rise 320ms calc(var(--i) * 70ms + 80ms) ease both;-webkit-tap-highlight-color:transparent}
.rtb .records-knot:focus-visible{outline:none}
.rtb .records-knot-seal{position:absolute;top:50%;left:50%;display:grid;place-items:center;width:var(--seal);height:var(--seal);background:#10141e;border:1px dashed rgba(158,177,209,.38);transform:translate(-50%,-50%) rotate(45deg);transition:transform 180ms ease,border-color 180ms ease,box-shadow 180ms ease}
.rtb .records-knot-seal svg{width:62%;height:62%;fill:none;stroke:currentColor;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round;transform:rotate(-45deg)}
.rtb .records-knot.is-done{color:var(--thread)}
.rtb .records-knot.is-done .records-knot-seal{background:radial-gradient(circle,#3a2632,#171420);border:1px solid var(--thread);box-shadow:0 0 .8rem var(--thread-soft),inset 0 0 .6rem rgba(230,164,184,.2)}
.rtb .records-knot.is-selected .records-knot-seal,.rtb .records-knot:focus-visible .records-knot-seal{border-color:var(--moon-bright);transform:translate(-50%,-50%) rotate(45deg) scale(1.16)}
.rtb .records-knot.is-done.is-selected .records-knot-seal{border-color:#fbdde6;box-shadow:0 0 1.4rem var(--thread),inset 0 0 .8rem rgba(230,164,184,.35)}
.rtb .records-knot-name{position:absolute;top:calc(50% + var(--seal) * .78);right:0;left:0;overflow:hidden;color:rgba(158,177,209,.55);font-size:clamp(.68rem,1.05vw,.85rem);letter-spacing:.08em;text-align:center;text-overflow:ellipsis;white-space:nowrap}
.rtb .records-knot.is-done .records-knot-name{color:#eef2f9;font-family:${DISPLAY}}
.rtb .records-readout{flex:none;display:flex;align-items:baseline;gap:1rem;min-height:2.6rem;padding:.45rem clamp(.8rem,2.5vw,1.8rem);color:rgba(215,222,235,.72);font-size:clamp(.76rem,1.1vw,.9rem);letter-spacing:.05em;background:rgba(5,6,7,.45);border-top:1px solid rgba(143,157,182,.28)}
.rtb .records-readout strong{flex:none;color:#8fa3c6;font-family:${DISPLAY};font-size:1.12em;font-weight:500;letter-spacing:.08em}
.rtb .records-readout.is-done strong{color:var(--thread)}
@keyframes rtb-rise{from{opacity:0;transform:translateY(.5rem)}}
@keyframes rtb-stamp{from{opacity:0;transform:rotate(-11deg) scale(1.9)}}
@keyframes rtb-thread-show{from{opacity:0}}
@media (prefers-reduced-motion:reduce){.rtb .records-file,.rtb .records-file-stamp,.rtb .records-knot,.rtb .records-thread-segment{animation:none}.rtb .records-file,.rtb .records-knot-seal{transition:none}}
@media (max-width:700px),(max-height:500px){.rtb .records-board{padding:.35rem .8rem}.rtb .records-file{padding:1.2rem .3rem .3rem}.rtb .records-readout{min-height:2rem;padding:.25rem .8rem}}
`;

/**
 * 結局檔案與靈魂之絲。左欄上下鍵換檔案、右鍵跳到第一枚絲結；絲結照畫面格子上下左右移動，
 * 最左一欄再按左鍵回到第一份檔案。焦點只放在目前選到的那一項（roving tabindex）。
 */
export function RecordsThreadBoard({
  endings,
  achievements,
  onSelect,
  thread = "#e6a4b8",
  locale = "en",
  labels: labelsProp,
  className,
  style,
}: RecordsThreadBoardProps) {
  const labels = { ...MESSAGES[resolveLocale(locale)], ...labelsProp };
  const [selection, setSelection] = useState<RecordsSelection>({ kind: "ending", index: 0 });
  const endingRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const knotRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const rows = Math.max(1, Math.ceil(achievements.length / THREAD_COLUMNS));
  // 絲結剛好在每格正中央；六枚時就是原本的 (16.67, 25) 到 (16.67, 75)
  const knotPoints = achievements.map((_, index) => {
    const { column, row } = knotCell(index);
    return [((column + 0.5) / THREAD_COLUMNS) * 100, ((row + 0.5) / rows) * 100] as const;
  });

  const seenEndings = endings.filter((ending) => ending.seen).length;
  const unlocked = achievements.filter((achievement) => achievement.done).length;
  const firstEndingSeen = Boolean(endings[0]?.seen);

  function select(next: RecordsSelection) {
    setSelection(next);
    onSelect?.(next);
  }

  function move(next: RecordsSelection) {
    select(next);
    (next.kind === "ending" ? endingRefs : knotRefs).current[next.index]?.focus();
  }

  function onKnotKey(event: KeyboardEvent, index: number) {
    const { column, row } = knotCell(index);
    const cellIndex = (nextColumn: number, nextRow: number) =>
      achievements.findIndex((_, candidate) => {
        const cell = knotCell(candidate);
        return cell.column === nextColumn && cell.row === nextRow;
      });
    const target =
      event.key === "ArrowRight" ? cellIndex(column + 1, row)
      : event.key === "ArrowLeft" ? cellIndex(column - 1, row)
      : event.key === "ArrowDown" ? cellIndex(column, row + 1)
      : event.key === "ArrowUp" ? cellIndex(column, row - 1)
      : undefined;
    if (target === undefined) return;
    event.preventDefault();
    if (target >= 0) move({ kind: "achievement", index: target });
    else if (event.key === "ArrowLeft" && endings.length > 0) move({ kind: "ending", index: 0 });
  }

  function onEndingKey(event: KeyboardEvent, index: number) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      if (achievements.length > 0) move({ kind: "achievement", index: 0 });
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = index + (event.key === "ArrowDown" ? 1 : -1);
      if (next >= 0 && next < endings.length) move({ kind: "ending", index: next });
    }
  }

  const selectedEnding = selection.kind === "ending" ? endings[selection.index] : undefined;
  const selectedAchievement = selection.kind === "achievement" ? achievements[selection.index] : undefined;
  const selectedDone = selectedEnding ? selectedEnding.seen : Boolean(selectedAchievement?.done);

  return (
    <div className={cn("rtb", className)} style={{ "--thread": thread, ...style } as CSSProperties}>
      <style>{css}</style>
      <div className="records-board">
        <section className="records-endings" aria-label={labels.endings}>
          <h3 className="records-heading">
            {labels.endings}
            <span>{labels.count(seenEndings, endings.length)}</span>
          </h3>
          <div className="records-ending-list">
            {endings.map((ending, index) => {
              const selected = selection.kind === "ending" && selection.index === index;
              return (
                <button
                  key={ending.id}
                  ref={(element) => {
                    endingRefs.current[index] = element;
                  }}
                  type="button"
                  className={cn("records-file", ending.seen && "is-done", selected && "is-selected")}
                  tabIndex={selected || selection.kind === "achievement" ? 0 : -1}
                  aria-label={ending.seen ? labels.entry(ending.title, ending.description) : labels.unreached}
                  onMouseEnter={() => select({ kind: "ending", index })}
                  onFocus={() => select({ kind: "ending", index })}
                  onClick={() => select({ kind: "ending", index })}
                  onKeyDown={(event) => onEndingKey(event, index)}
                >
                  <span className="records-file-tab">{labels.fileTab(index)}</span>
                  <span className="records-file-title">{ending.seen ? ending.title : labels.unfiled}</span>
                  {ending.seen && <span className="records-file-stamp">{labels.stamp}</span>}
                </button>
              );
            })}
          </div>
        </section>

        <section className="records-knots" aria-label={labels.achievements}>
          <h3 className="records-heading">
            {labels.achievements}
            <span>{labels.count(unlocked, achievements.length)}</span>
          </h3>
          <div className="records-knot-field" style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>
            <svg className="records-thread" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {knotPoints.map((point, index) => {
                const from = index === 0 ? [-6, point[1]] : knotPoints[index - 1];
                const lit = (index === 0 ? firstEndingSeen : achievements[index - 1].done) && achievements[index].done;
                return (
                  <path
                    key={index}
                    className={cn("records-thread-segment", lit && "is-lit")}
                    d={threadSegment(from, point, index)}
                    style={{ "--i": index } as CSSProperties}
                  />
                );
              })}
            </svg>
            {achievements.map((achievement, index) => {
              const selected = selection.kind === "achievement" && selection.index === index;
              const { column, row } = knotCell(index);
              return (
                <button
                  key={achievement.id}
                  ref={(element) => {
                    knotRefs.current[index] = element;
                  }}
                  type="button"
                  className={cn("records-knot", achievement.done && "is-done", selected && "is-selected")}
                  style={{ gridColumn: column + 1, gridRow: row + 1, "--i": index } as CSSProperties}
                  tabIndex={selected ? 0 : -1}
                  aria-label={
                    achievement.done
                      ? labels.entry(achievement.title, achievement.description)
                      : `${labels.knotLockedPrefix}${achievement.hint}`
                  }
                  onMouseEnter={() => select({ kind: "achievement", index })}
                  onFocus={() => select({ kind: "achievement", index })}
                  onClick={() => select({ kind: "achievement", index })}
                  onKeyDown={(event) => onKnotKey(event, index)}
                >
                  <span className="records-knot-seal" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d={achievement.icon ?? FALLBACK_ICON} />
                    </svg>
                  </span>
                  <span className="records-knot-name" aria-hidden="true">
                    {achievement.done ? achievement.title : labels.knotLocked}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className={cn("records-readout", selectedDone && "is-done")} aria-live="polite">
        <strong>
          {selectedEnding
            ? selectedDone ? selectedEnding.title : labels.unreachedTitle
            : selectedDone ? selectedAchievement?.title : labels.knotLockedTitle}
        </strong>
        <span>
          {selectedEnding
            ? selectedDone ? selectedEnding.description : labels.unreachedBody
            : selectedDone ? selectedAchievement?.description : selectedAchievement?.hint}
        </span>
      </div>
    </div>
  );
}
