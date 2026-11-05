"use client";

import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

// 移植自 死神的祝福 src/presentation/memoir/journey-shelf.tsx 與 main.css 的 shelf- / memoir-library- 樣式：
// 歸檔櫃，兩層拉開的抽屜。每一格是一份檔案夾，前後排列，索引標籤錯開，
// 後面的從前面的上緣露出來；空格是一片只有編號的深色隔板。

export interface ArchiveCabinetItem {
  /** 放在第幾格（從 1 開始，先填滿左邊抽屜再換右邊） */
  slot: number;
  /** store 模式比對 highlightId 用 */
  id?: string;
  /** 索引標籤上的短名 */
  label: string;
  /** 完整名稱，給螢幕閱讀器與預覽讀出 */
  title: string;
  /** 檔案夾上的日期或補充說明 */
  meta?: string;
  /** complete：蓋章；paused：未完待續，褪色也不蓋章 */
  status?: "complete" | "paused";
  /** 覆寫這一份的印章文字 */
  stamp?: string;
}

export interface ArchiveCabinetProps {
  items: readonly ArchiveCabinetItem[];
  /** 總格數，平分到兩層抽屜，預設 10（每層 5 格前後排列） */
  slotCount?: number;
  /** read：只有放了檔案的格子能點；store：每一格都能點，用來選位置 */
  mode?: "read" | "store";
  onPick?: (slot: number, item: ArchiveCabinetItem | undefined) => void;
  /** 指到或聚焦某一格時呼叫，離開時傳 undefined */
  onPreview?: (slot: number | undefined, item: ArchiveCabinetItem | undefined) => void;
  /** store 模式下，已經放著同一份檔案的那一格會標出來 */
  highlightId?: string;
  /** 聚焦外框與空隔板高亮色，預設原本的月光藍 */
  accent?: string;
  labels?: {
    cabinet?: string;
    /** 檔案夾本體上的固定標題 */
    folderTitle?: string;
    /** complete 狀態的印章 */
    stamp?: string;
    slot?: (slot: number) => string;
    empty?: string;
  };
  className?: string;
  style?: CSSProperties;
}

const defaultLabels = {
  cabinet: "Memoir archive cabinet",
  folderTitle: "Case file",
  stamp: "FAILED",
  slot: (slot: number) => `Slot ${slot}`,
  empty: "empty",
};

const MONO = '"SF Mono", "Menlo", "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", "Heiti TC", sans-serif';
const SANS = '"PingFang TC", "Noto Sans TC", "Microsoft JhengHei", "Heiti TC", sans-serif';

const css = `
@layer components{.sac{height:clamp(11rem,48vh,22rem)}}
.sac{--drawer-lip:clamp(1.5rem,5.5vh,2.6rem);position:relative;box-sizing:border-box;display:grid;grid-auto-flow:column;grid-template-rows:repeat(var(--shelf-depth,5),minmax(0,1fr));grid-template-columns:repeat(2,minmax(0,1fr));column-gap:clamp(.8rem,3vw,2.2rem);margin:0;padding:.7rem clamp(.5rem,1.6vw,1.1rem) var(--drawer-lip);overflow:hidden;list-style:none}
.sac::before{position:absolute;inset:0;background:linear-gradient(90deg,#070a10 0 49.2%,transparent 49.2% 50.8%,#070a10 50.8%);content:""}
.sac::after{position:absolute;z-index:3;right:0;bottom:0;left:0;height:var(--drawer-lip);background:radial-gradient(ellipse 11% 22% at 25% 58%,#0d1119 0 96%,transparent 100%),radial-gradient(ellipse 11% 22% at 75% 58%,#0d1119 0 96%,transparent 100%),linear-gradient(90deg,#39445a 0 49.2%,#0f131c 49.2% 50.8%,#39445a 50.8%);box-shadow:0 -.5rem 1rem rgba(0,0,0,.55);content:""}
.sac .shelf-slot{position:relative;z-index:1;box-sizing:border-box;min-width:0;min-height:0;margin:0 calc((var(--shelf-depth,5) - 1 - var(--row,0)) * 1.3%);container-type:size}
.sac .shelf-spine,.sac .shelf-empty{position:relative;display:block;box-sizing:border-box;width:100%;height:100%;margin:0;padding:0;border:0;background:none;color:inherit;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.sac .shelf-spine:focus-visible,.sac .shelf-empty:focus-visible{outline:none}
.sac .shelf-folder{position:absolute;top:0;right:0;left:0;height:340%;color:#252a35;font-family:${MONO};font-size:clamp(9px,21cqh,16px);pointer-events:none;transition:transform .28s cubic-bezier(.22,1,.36,1)}
.sac .shelf-spine:hover .shelf-folder,.sac .shelf-spine:focus-visible .shelf-folder{transform:translateY(-16cqh)}
.sac .shelf-folder-tab{position:absolute;top:0;left:calc(5% + var(--row,0) * 15%);box-sizing:border-box;height:1.75em;padding:.28em .8em 0;overflow:hidden;background:#c3c8d2;border-radius:.35em .35em 0 0;font-weight:600;line-height:1.2;white-space:nowrap}
.sac .shelf-folder-body{position:absolute;top:1.7em;right:0;bottom:0;left:0;box-sizing:border-box;display:flex;align-items:flex-start;gap:1em;padding:.5em 1em 0;background:#b4bac6;border-top:1px solid rgba(255,255,255,.4);border-radius:.2em .2em 0 0;box-shadow:0 -.3em .7em rgba(0,0,0,.4)}
.sac .shelf-folder-title{font-weight:700;white-space:nowrap}
.sac .shelf-folder-date{overflow:hidden;color:#4b5262;white-space:nowrap}
.sac .shelf-folder-stamp{flex:none;margin:-.1em 0 0 auto;padding:0 .35em;color:#a02c49;font-family:${SANS};font-weight:700;border:1.5px solid #a02c49;opacity:.85;transform:rotate(-6deg)}
.sac .shelf-spine[data-status="paused"] .shelf-folder{filter:brightness(.62)}
.sac .shelf-spine:focus-visible .shelf-folder-tab,.sac .shelf-spine:focus-visible .shelf-folder-body{outline:2px solid var(--sac-accent);outline-offset:-2px}
.sac .shelf-empty{color:rgba(195,200,210,.42);font-family:${MONO};font-size:clamp(9px,21cqh,13px);background:linear-gradient(180deg,#161b26,#0b0e15 60%);border-top:1px solid rgba(143,157,182,.22);transition:background-color .2s ease,border-color .2s ease}
.sac .shelf-empty:disabled{cursor:default}
.sac .shelf-empty-tab{position:absolute;top:.3em;left:calc(5% + var(--row,0) * 15%)}
.sac .shelf-empty:not(:disabled):hover,.sac .shelf-empty:not(:disabled):focus-visible{color:var(--sac-accent);border-color:var(--sac-accent);background:rgba(170,187,216,.14)}
.sac .shelf-slot-highlight .shelf-folder-tab{background:#f4f3ef;box-shadow:0 0 0 2px var(--sac-accent)}
@media (prefers-reduced-motion:reduce){.sac .shelf-folder{transition:none}}
@media (max-width:700px),(max-height:500px){.sac .shelf-folder-title{display:none}.sac .shelf-folder-date{margin-left:auto}.sac .shelf-folder-stamp{margin-left:0}}
`;

function FolderFace({ item, folderTitle, stamp }: { item: ArchiveCabinetItem; folderTitle: string; stamp: string }) {
  return (
    <span className="shelf-folder" aria-hidden="true">
      <span className="shelf-folder-tab">{item.label}</span>
      <span className="shelf-folder-body">
        <span className="shelf-folder-title">{folderTitle}</span>
        {item.meta && <span className="shelf-folder-date">{item.meta}</span>}
        {(item.status ?? "complete") === "complete" && <span className="shelf-folder-stamp">{item.stamp ?? stamp}</span>}
      </span>
    </span>
  );
}

export function ArchiveCabinet({
  items,
  slotCount = 10,
  mode = "read",
  onPick,
  onPreview,
  highlightId,
  accent = "#d5e1f5",
  labels: labelsProp,
  className,
  style,
}: ArchiveCabinetProps) {
  const labels = { ...defaultLabels, ...labelsProp };
  // 一層抽屜放幾格；前後排列，越靠前的越大。
  const depth = Math.max(1, Math.ceil(slotCount / 2));
  const bySlot = new Map(items.map((item) => [item.slot, item]));

  return (
    <>
      <style>{css}</style>
      <ul
        className={cn("sac", className)}
        aria-label={labels.cabinet}
        onMouseLeave={() => onPreview?.(undefined, undefined)}
        style={{ "--shelf-depth": depth, "--sac-accent": accent, ...style } as CSSProperties}
      >
        {Array.from({ length: slotCount }, (_, index) => index + 1).map((slot) => {
          const item = bySlot.get(slot);
          const slotName = labels.slot(slot);
          const highlighted = mode === "store" && item !== undefined && item.id !== undefined && item.id === highlightId;
          const previewHandlers = {
            onMouseEnter: () => onPreview?.(slot, item),
            onFocus: () => onPreview?.(slot, item),
            onBlur: () => onPreview?.(undefined, undefined),
          };

          return (
            <li key={slot} className={cn("shelf-slot", highlighted && "shelf-slot-highlight")} style={{ "--row": (slot - 1) % depth } as CSSProperties}>
              {item ? (
                <button type="button" className="shelf-spine" data-status={item.status ?? "complete"} onClick={() => onPick?.(slot, item)} {...previewHandlers}>
                  <FolderFace item={item} folderTitle={labels.folderTitle} stamp={labels.stamp} />
                  <span className="sr-only">
                    {slotName}: {item.title}
                  </span>
                  {item.meta && <span className="sr-only">{item.meta}</span>}
                </button>
              ) : (
                <button type="button" className="shelf-empty" disabled={mode === "read"} onClick={() => onPick?.(slot, undefined)} {...previewHandlers}>
                  <span className="shelf-empty-tab" aria-hidden="true">
                    {String(slot).padStart(2, "0")}
                  </span>
                  <span className="sr-only">
                    {slotName}: {labels.empty}
                  </span>
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
