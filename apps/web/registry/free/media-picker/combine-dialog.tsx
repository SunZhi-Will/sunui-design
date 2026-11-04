"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { Thumb, type PickMediaItem } from "./media-picker";

/*
 * 合併下載視窗：移植自 PostVault 的 combine/combine-dialog.ts 與 combine/layout.ts。
 * 挑版面（還原全景 / N 欄 / 橫向一排）、拿掉不要的圖、看預覽，按儲存才產出檔案。
 */

/* ---------- 排版計算（純函式，照 layout.ts） ---------- */

type Size = { width: number; height: number };
export interface Placement {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface Sheet {
  width: number;
  height: number;
  placements: Placement[];
}
type Limits = { maxLongSide: number; maxArea: number; maxAspect: number };

const POSTABLE_LIMITS: Limits = { maxLongSide: 4096, maxArea: 16_777_216, maxAspect: 10 };
const PANORAMA_LIMITS: Limits = { maxLongSide: 16_384, maxArea: 16_777_216, maxAspect: Number.POSITIVE_INFINITY };
export const MAX_GRID_COLUMNS = 5;
// 圖與圖之間的留白（成品縮放前的像素）
const GAP_PX = 12;
const PREVIEW_MAX_WIDTH = 520;
const PREVIEW_MAX_HEIGHT = 340;

const aspectOf = (s: Size) => (s.width > 0 && s.height > 0 ? s.width / s.height : 1);

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function fitToLimits(sheet: Sheet, limits: Limits): Sheet {
  const scale = Math.min(1, limits.maxLongSide / Math.max(sheet.width, sheet.height), Math.sqrt(limits.maxArea / (sheet.width * sheet.height)));
  const width = Math.max(1, Math.floor(sheet.width * scale));
  const height = Math.max(1, Math.floor(sheet.height * scale));
  const placements = sheet.placements.map((p) => {
    const x = Math.round(p.x * scale);
    const y = Math.round(p.y * scale);
    const right = Math.min(width, Math.round((p.x + p.width) * scale));
    const bottom = Math.min(height, Math.round((p.y + p.height) * scale));
    return { index: p.index, x, y, width: Math.max(1, right - x), height: Math.max(1, bottom - y) };
  });
  return { width, height, placements };
}

function layoutGridSheet(sizes: Size[], indices: number[], columns: number, gap: number): Sheet {
  const cols = Math.max(1, Math.min(columns, indices.length));
  const cellWidth = median(indices.map((i) => sizes[i].width)) || 1080;
  const totalWidth = cols * cellWidth + (cols - 1) * gap;
  const rows: number[][] = [];
  for (let i = 0; i < indices.length; i += cols) rows.push(indices.slice(i, i + cols));
  const fullRowHeights: number[] = [];
  const rowHeights = rows.map((row) => {
    const aspectSum = row.reduce((sum, i) => sum + aspectOf(sizes[i]), 0);
    const h = (totalWidth - (row.length - 1) * gap) / aspectSum;
    if (row.length === cols) fullRowHeights.push(h);
    return h;
  });
  const placements: Placement[] = [];
  let y = 0;
  rows.forEach((row, r) => {
    // 不滿的最後一列：用完整列的平均高度、置中
    const isPartial = row.length < cols && fullRowHeights.length > 0;
    const height = isPartial ? Math.min(rowHeights[r], fullRowHeights.reduce((a, b) => a + b, 0) / fullRowHeights.length) : rowHeights[r];
    const rowWidth = row.reduce((sum, i) => sum + aspectOf(sizes[i]) * height, 0) + (row.length - 1) * gap;
    let x = isPartial ? (totalWidth - rowWidth) / 2 : 0;
    for (const i of row) {
      const width = aspectOf(sizes[i]) * height;
      placements.push({ index: i, x, y, width, height });
      x += width + gap;
    }
    y += height + (r < rows.length - 1 ? gap : 0);
  });
  return { width: totalWidth, height: y, placements };
}

function layoutRowSheet(sizes: Size[], indices: number[], gap: number, heightBasis?: number): Sheet {
  const height = heightBasis ?? (median(indices.map((i) => sizes[i].height)) || 1080);
  const placements: Placement[] = [];
  let x = 0;
  indices.forEach((i, n) => {
    const width = aspectOf(sizes[i]) * height;
    placements.push({ index: i, x, y: 0, width, height });
    x += width + (n < indices.length - 1 ? gap : 0);
  });
  return { width: x, height, placements };
}

/** 自動欄數：讓成品最接近正方形，至少兩欄 */
export function autoColumns(sizes: Size[], gap = 0): number {
  const n = sizes.length;
  if (n <= 2) return Math.max(1, n);
  const all = sizes.map((_, i) => i);
  let best = 2;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let cols = 2; cols <= Math.min(MAX_GRID_COLUMNS, n); cols++) {
    const sheet = layoutGridSheet(sizes, all, cols, gap);
    const empty = (cols - (n % cols)) % cols;
    const score = Math.abs(Math.log(sheet.width / sheet.height)) + 0.4 * (empty / cols);
    if (score < bestScore - 1e-9) {
      bestScore = score;
      best = cols;
    }
  }
  return best;
}

function splitRowByAspect(sizes: Size[], maxAspect: number): number[][] {
  if (!Number.isFinite(maxAspect)) return [sizes.map((_, i) => i)];
  const groups: number[][] = [];
  let current: number[] = [];
  let aspectSum = 0;
  sizes.forEach((size, i) => {
    const a = aspectOf(size);
    if (current.length > 0 && aspectSum + a > maxAspect) {
      groups.push(current);
      current = [];
      aspectSum = 0;
    }
    current.push(i);
    aspectSum += a;
  });
  if (current.length > 0) groups.push(current);
  // 各段張數盡量平均
  if (groups.length > 1) {
    const per = Math.ceil(sizes.length / groups.length);
    const balanced: number[][] = [];
    for (let i = 0; i < sizes.length; i += per) balanced.push(sizes.map((_, k) => k).slice(i, i + per));
    const fits = balanced.every((g) => g.reduce((s, k) => s + aspectOf(sizes[k]), 0) <= maxAspect);
    if (fits && balanced.length === groups.length) return balanced;
  }
  return groups;
}

export type CombineLayout = "grid" | "row" | "panorama";
export interface CombineChoice {
  layout: CombineLayout;
  columns?: number;
  gap?: boolean;
  /** 要放進成品的圖（索引，依順序） */
  include: number[];
}

/** 依選擇算出一或多張成品（太寬時橫向一排會切張） */
export function planCombine(sizes: Size[], choice: CombineChoice): Sheet[] {
  const indices = choice.include;
  if (indices.length === 0) return [];
  const sub = indices.map((i) => sizes[i]);
  const gap = choice.layout === "panorama" || !choice.gap ? 0 : GAP_PX;
  let sheets: Sheet[];
  if (choice.layout === "panorama") {
    const minHeight = Math.min(...sub.map((s) => s.height));
    sheets = [fitToLimits(layoutRowSheet(sub, sub.map((_, i) => i), 0, minHeight), PANORAMA_LIMITS)];
  } else if (choice.layout === "row") {
    sheets = splitRowByAspect(sub, POSTABLE_LIMITS.maxAspect).map((g) => fitToLimits(layoutRowSheet(sub, g, gap), POSTABLE_LIMITS));
  } else {
    const cols = choice.columns ?? autoColumns(sub, gap);
    sheets = [fitToLimits(layoutGridSheet(sub, sub.map((_, i) => i), Math.max(1, Math.min(cols, sub.length)), gap), POSTABLE_LIMITS)];
  }
  return sheets.map((s) => ({ ...s, placements: s.placements.map((p) => ({ ...p, index: indices[p.index] })) }));
}

/* ---------- 視窗 ---------- */

type LayoutChoiceId = "panorama" | "row" | `cols-${number}`;

export interface CombineDialogLabels {
  title: string;
  subtitle: (count: number) => string;
  layout: string;
  columns: (count: number) => string;
  row: string;
  panorama: string;
  panoramaHint: string;
  gap: string;
  size: (w: number, h: number) => string;
  split: (count: number) => string;
  videosSkipped: string;
  needTwo: string;
  imageAlt: (index: number) => string;
  saveImage: string;
  saveImages: (count: number) => string;
  savePdf: string;
  working: string;
  cancel: string;
  locked: string;
}

export const defaultCombineLabels: CombineDialogLabels = {
  title: "Combine images",
  subtitle: (n) => `${n} images. Tap a thumbnail to leave it out or add it back`,
  layout: "Layout",
  columns: (n) => `${n} columns`,
  row: "Single row",
  panorama: "Restore panorama",
  panoramaHint: "These look like slices of one panorama, so \"Restore panorama\" is selected",
  gap: "Space between images",
  size: (w, h) => `${w} × ${h} px`,
  split: (n) => `Too wide, will be split into ${n} images (posting limit is 10:1)`,
  videosSkipped: "Videos are not included in the combined image",
  needTwo: "Pick at least two images",
  imageAlt: (i) => `Image ${i}`,
  saveImage: "Save image",
  saveImages: (n) => `Save ${n} images`,
  savePdf: "Save as PDF",
  working: "Working…",
  cancel: "Cancel",
  locked: "Supporter feature",
};

export interface CombineDialogProps {
  open: boolean;
  /** 只放圖片；需要 width / height 才排得出版面 */
  images: (PickMediaItem & { width: number; height: number })[];
  /** 看起來是切開的全景照 */
  panorama?: boolean;
  /** 還原全景是付費功能：未解鎖時在選項上畫鎖頭（真正的檢查在 onSaveImages 裡） */
  panoramaLocked?: boolean;
  hasVideos?: boolean;
  /** 丟出錯誤時視窗留著，讓使用者換版面或改存 PDF */
  onSaveImages: (choice: CombineChoice, sheets: Sheet[]) => Promise<void> | void;
  onSavePdf?: (include: number[]) => Promise<void> | void;
  onClose: () => void;
  /** 成品底色 */
  background?: string;
  fixed?: boolean;
  labels?: Partial<CombineDialogLabels>;
  className?: string;
}

const LockIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="block size-3.5">
    <rect x="5" y="11" width="14" height="9" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function CombineDialog({
  open,
  images,
  panorama = false,
  panoramaLocked = false,
  hasVideos = false,
  onSaveImages,
  onSavePdf,
  onClose,
  background = "#ffffff",
  fixed = true,
  labels: labelsProp,
  className,
}: CombineDialogProps) {
  const l = { ...defaultCombineLabels, ...labelsProp };
  const reduce = useReducedMotion() ?? false;
  const titleId = useId();
  const saveRef = useRef<HTMLButtonElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const sizes = useMemo(() => images.map((i) => ({ width: i.width, height: i.height })), [images]);

  const defaultLayout = (include: number[]): LayoutChoiceId => {
    if (panorama) return "panorama";
    const cols = autoColumns(include.map((i) => sizes[i]));
    return cols >= include.length ? "row" : `cols-${cols}`;
  };

  const [include, setInclude] = useState<number[]>(() => images.map((_, i) => i));
  const [layoutId, setLayoutId] = useState<LayoutChoiceId>(() => defaultLayout(images.map((_, i) => i)));
  const [gap, setGap] = useState(true);
  const [busy, setBusy] = useState<"image" | "pdf" | null>(null);
  const [box, setBox] = useState({ w: PREVIEW_MAX_WIDTH, h: PREVIEW_MAX_HEIGHT });

  useEffect(() => {
    if (!open) return;
    const all = images.map((_, i) => i);
    setInclude(all);
    setLayoutId(defaultLayout(all));
    setGap(true);
    saveRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, images.length]);

  // 預覽框跟著容器寬度；矮的視窗把預覽縮小，按鈕才不會被擠到畫面外
  useLayoutEffect(() => {
    if (!open) return;
    const el = previewRef.current;
    if (!el) return;
    const measure = () => {
      const h = Math.max(160, Math.min(PREVIEW_MAX_HEIGHT, Math.round(window.innerHeight * 0.36)));
      setBox({ w: Math.min(PREVIEW_MAX_WIDTH, el.clientWidth - 24), h });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  // 欄數等於張數時與「橫向一排」相同，不重複列出
  const chips: { id: LayoutChoiceId; label: string; locked?: boolean }[] = [];
  if (panorama) chips.push({ id: "panorama", label: l.panorama, locked: panoramaLocked });
  for (let cols = 2; cols <= Math.min(MAX_GRID_COLUMNS, include.length - 1); cols++) chips.push({ id: `cols-${cols}`, label: l.columns(cols) });
  chips.push({ id: "row", label: l.row });
  const activeId = chips.some((c) => c.id === layoutId) ? layoutId : defaultLayout(include);

  const choice: CombineChoice =
    activeId === "panorama"
      ? { layout: "panorama", include }
      : activeId === "row"
        ? { layout: "row", gap, include }
        : { layout: "grid", columns: Number(activeId.slice(5)), gap, include };

  const enough = include.length >= 2;
  const sheets = enough ? planCombine(sizes, choice) : [];
  const first = sheets[0];
  const hints: string[] = [];
  if (sheets.length > 1) hints.push(l.split(sheets.length));
  if (panorama && activeId === "panorama") hints.push(l.panoramaHint);
  if (hasVideos) hints.push(l.videosSkipped);

  const scale = first ? Math.min(1, box.w / first.width, box.h / first.height) : 1;

  const run = async (kind: "image" | "pdf") => {
    if (busy) return;
    setBusy(kind);
    try {
      if (kind === "image") await onSaveImages(choice, sheets);
      else await onSavePdf?.(include);
      setBusy(null);
      onClose();
    } catch {
      // 錯誤訊息交給呼叫端顯示；視窗留著
      setBusy(null);
    }
  };

  if (!open) return null;

  const t = reduce ? { duration: 0 } : { duration: 0.3, ease: "easeOut" as const };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={t}
      className={cn(fixed ? "fixed" : "absolute", "inset-0 z-[60] flex items-center justify-center")}
      style={{ background: "rgba(0, 0, 0, 0.7)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: reduce ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={t}
        className={cn("flex w-[90%] max-w-[600px] max-h-[92%] flex-col overflow-hidden rounded-xl border text-left text-white", className)}
        style={{ background: "#1a1a1a", borderColor: "#404040", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
      >
        {/* 內容區自己捲動，按鈕固定在底部 */}
        <div className="flex min-h-0 flex-auto flex-col gap-2.5 overflow-y-auto overscroll-contain px-5 pb-3 pt-5 [&>*]:shrink-0">
          <h2 id={titleId} className="m-0 text-lg font-semibold text-white">
            {l.title}
          </h2>
          <p className="m-0 text-[13px] leading-normal" style={{ color: "#a3a3a3" }}>
            {l.subtitle(images.length)}
          </p>

          <div ref={previewRef} className="flex min-h-[120px] items-center justify-center rounded-[10px] p-3" style={{ background: "#0d0d0d" }}>
            {first && (
              <div
                className="relative overflow-hidden rounded"
                style={{ width: Math.round(first.width * scale), height: Math.round(first.height * scale), background, boxShadow: "0 2px 12px rgba(0, 0, 0, 0.6)" }}
              >
                {first.placements.map((p) => (
                  <div key={p.index} className="absolute overflow-hidden" style={{ left: Math.floor(p.x * scale), top: Math.floor(p.y * scale), width: Math.ceil((p.x + p.width) * scale) - Math.floor(p.x * scale), height: Math.ceil((p.y + p.height) * scale) - Math.floor(p.y * scale) }}>
                    <Thumb item={images[p.index]} className="[&>svg]:size-full" />
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="m-0 text-[13px] leading-normal" style={{ color: "#a3a3a3" }} aria-live="polite">
            {first ? l.size(first.width, first.height) : l.needTwo}
          </p>
          {hints.length > 0 && (
            <p className="m-0 text-[13px] leading-normal" style={{ color: "#ffd666" }}>
              {hints.join("　")}
            </p>
          )}

          <p className="m-0 mt-1 text-[13px] font-medium leading-normal" style={{ color: "#e5e5e5" }}>
            {l.layout}
          </p>
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => {
              const on = chip.id === activeId;
              return (
                <button
                  key={chip.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => !busy && setLayoutId(chip.id)}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                    on ? "border-white bg-white text-black" : "border-[#404040] bg-transparent text-[#e5e5e5] hover:border-[#737373]",
                  )}
                >
                  <span>{chip.label}</span>
                  {chip.locked && (
                    <span className="inline-flex" style={{ color: "#f5b400" }} title={l.locked}>
                      <LockIcon />
                      <span className="sr-only">{l.locked}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {activeId !== "panorama" && (
            <label className="inline-flex cursor-pointer items-center gap-2 text-[13px]" style={{ color: "#e5e5e5" }}>
              <input type="checkbox" checked={gap} onChange={(e) => setGap(e.target.checked)} className="m-0 size-4" style={{ accentColor: "#ffffff" }} />
              <span>{l.gap}</span>
            </label>
          )}

          <div className="flex gap-2 overflow-x-auto px-0.5 pb-2 pt-1">
            {images.map((image, index) => {
              const on = include.includes(index);
              return (
                <button
                  key={image.id}
                  type="button"
                  aria-pressed={on}
                  aria-label={l.imageAlt(index + 1)}
                  onClick={() => {
                    if (busy) return;
                    setInclude((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index].sort((a, b) => a - b)));
                  }}
                  className="relative flex-none cursor-pointer overflow-hidden rounded-md border-2 p-0 leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  style={{ background: "#0d0d0d", borderColor: on ? "#ffffff" : "#404040", opacity: on ? 1 : 0.35 }}
                >
                  <span className="relative block h-16" style={{ width: Math.round((64 * image.width) / image.height) }}>
                    <Thumb item={image} className="[&>svg]:size-full" />
                  </span>
                  <span className="absolute left-[3px] top-[3px] min-w-[18px] rounded-[9px] px-[5px] py-px text-center text-[11px] leading-4 text-white" style={{ background: "rgba(0, 0, 0, 0.75)" }}>
                    {index + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-none flex-col gap-1 border-t px-5 pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-3" style={{ borderColor: "#2e2e2e", background: "#1a1a1a" }}>
          <div className="flex flex-col gap-2.5 min-[481px]:flex-row">
            <button
              ref={saveRef}
              type="button"
              disabled={!enough || busy !== null}
              onClick={() => void run("image")}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border-none bg-white px-5 py-3 text-sm font-semibold text-black transition-all duration-200 enabled:hover:-translate-y-0.5 enabled:hover:shadow-[0_4px_12px_rgba(255,255,255,0.3)] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:enabled:hover:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]"
            >
              {busy === "image" ? l.working : sheets.length > 1 ? l.saveImages(sheets.length) : l.saveImage}
            </button>
            {onSavePdf && (
              <button
                type="button"
                disabled={include.length === 0 || busy !== null}
                onClick={() => void run("pdf")}
                className="flex items-center justify-center gap-2 rounded-lg border bg-transparent px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:border-[#404040] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                style={{ borderColor: "#404040" }}
              >
                {busy === "pdf" ? l.working : l.savePdf}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => !busy && onClose()}
            className="m-0 cursor-pointer self-center border-none bg-transparent px-4 py-2 text-xs transition-colors duration-200 hover:text-white focus:outline-none focus-visible:text-white"
            style={{ color: "#999999" }}
          >
            {l.cancel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
