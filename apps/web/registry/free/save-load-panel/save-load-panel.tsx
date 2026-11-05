"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

// 移植自 山河未歸 save/save-load-panel.tsx 與 save-slot-label.ts：覆蓋、刪除都在面板內兩段式確認

// story 系列主題變數（與暫停選單相同）
export const storyThemes = {
  ink: {
    "--story-bg": "#08090c",
    "--story-panel": "rgba(10, 12, 16, 0.82)",
    "--story-line": "rgba(234, 228, 214, 0.14)",
    "--story-text": "#eae4d6",
    "--story-secondary": "#b3aa97",
    "--story-muted": "#837d6f",
    "--story-accent": "#c9a063",
    "--story-accent-bright": "#e7c489",
    "--story-accent-dim": "rgba(201, 160, 99, 0.38)",
    "--story-glow": "201 160 99",
    "--story-on-accent": "#17130d",
    "--story-band": "10 12 16",
    "--story-scrim": "6 7 10",
    "--story-scrim-deep": "4 5 7",
    "--story-text-shadow": "rgba(0, 0, 0, 0.75)",
    "--story-alert": "rgba(52, 18, 14, 0.94)",
    "--story-danger": "#c04a3d",
    "--story-panel-shadow": "0 24px 64px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(231, 196, 137, 0.1)",
    "--story-font": '"Noto Serif TC", "Songti TC", "PingFang TC", "Microsoft JhengHei", "Heiti TC", serif',
    "--story-font-display": '"LXGW WenKai TC", "Kaiti TC", "BiauKai", "DFKai-SB", "Noto Serif TC", "Songti TC", serif',
  },
  moon: {
    "--story-bg": "#070a12",
    "--story-panel": "rgba(12, 17, 28, 0.84)",
    "--story-line": "rgba(233, 237, 245, 0.12)",
    "--story-text": "#e9edf5",
    "--story-secondary": "#aab4c7",
    "--story-muted": "#808ba1",
    "--story-accent": "#a3b8d9",
    "--story-accent-bright": "#d5e1f5",
    "--story-accent-dim": "rgba(163, 184, 217, 0.38)",
    "--story-glow": "117 141 183",
    "--story-on-accent": "#0b0f18",
    "--story-band": "10 12 16",
    "--story-scrim": "6 7 10",
    "--story-scrim-deep": "4 5 7",
    "--story-text-shadow": "rgba(0, 0, 0, 0.75)",
    "--story-alert": "rgba(52, 18, 30, 0.94)",
    "--story-danger": "#cb5579",
    "--story-panel-shadow": "0 24px 64px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(157, 177, 211, 0.1)",
    "--story-font": '"PingFang TC", "Noto Sans TC", "Microsoft JhengHei", "Heiti TC", sans-serif',
    "--story-font-display": '"Noto Serif TC", "Songti TC", "PMingLiU", serif',
  },
  rice: {
    "--story-bg": "#f4efe3",
    "--story-panel": "rgba(250, 246, 236, 0.94)",
    "--story-line": "rgba(60, 48, 32, 0.18)",
    "--story-text": "#2a2219",
    "--story-secondary": "rgba(42, 34, 25, 0.72)",
    "--story-muted": "rgba(42, 34, 25, 0.6)",
    "--story-accent": "#9a6b2a",
    "--story-accent-bright": "#7a4f17",
    "--story-accent-dim": "rgba(154, 107, 42, 0.38)",
    "--story-glow": "154 107 42",
    "--story-on-accent": "#fbf6ea",
    "--story-band": "250 246 236",
    "--story-scrim": "244 239 227",
    "--story-scrim-deep": "232 224 206",
    "--story-text-shadow": "rgba(250, 246, 236, 0.6)",
    "--story-alert": "rgba(250, 226, 214, 0.96)",
    "--story-danger": "#a33a26",
    "--story-panel-shadow": "0 12px 32px rgba(60, 48, 32, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
    "--story-font": '"Noto Serif TC", "Songti TC", serif',
    "--story-font-display": '"LXGW WenKai TC", "Kaiti TC", "Noto Serif TC", "Songti TC", serif',
  },
} as const;

export type StoryTheme = keyof typeof storyThemes;

/** 存讀檔面板的按鈕樣式（與暫停選單同一套） */
const storyMenuCss = `
.spm-root{container-type:size;container-name:spm}
.spm-btn{padding:.6rem 1.6rem;font:inherit;font-size:1rem;letter-spacing:.12em;background:linear-gradient(90deg,rgb(var(--story-glow) / .2),rgb(var(--story-glow) / .04)) left center / 0% 100% no-repeat,rgb(var(--story-band) / .7);color:var(--story-text);border:1px solid var(--story-line);border-radius:3px;cursor:pointer;transition:border-color 120ms ease-out,color 120ms ease-out,background-size 320ms cubic-bezier(.22,.72,.2,1),transform 80ms ease-out}
.spm-btn:hover:not(:disabled),.spm-btn:focus-visible:not(:disabled){border-color:var(--story-accent-dim);color:var(--story-accent-bright);background-size:100% 100%,auto;outline:none}
.spm-btn:active:not(:disabled){transform:translateY(1px) scale(.985)}
.spm-btn:disabled{color:var(--story-muted);cursor:not-allowed}
.spm-btn-primary{padding:.6rem 1.8rem;font:inherit;font-size:1rem;letter-spacing:.14em;background:linear-gradient(180deg,rgb(var(--story-glow) / .24),rgb(var(--story-glow) / .08));color:var(--story-accent-bright);border:1px solid var(--story-accent-dim);border-radius:3px;box-shadow:inset 0 1px 0 rgb(var(--story-glow) / .12);cursor:pointer;transition:border-color 120ms ease-out,box-shadow 120ms ease-out,filter 120ms ease-out,transform 80ms ease-out}
.spm-btn-primary:hover:not(:disabled),.spm-btn-primary:focus-visible:not(:disabled){border-color:var(--story-accent);filter:brightness(1.12);box-shadow:inset 0 1px 0 rgb(var(--story-glow) / .18);outline:none}
.spm-btn-primary:active:not(:disabled){transform:translateY(1px) scale(.985)}
.spm-btn-primary:disabled{opacity:.45;cursor:not-allowed}
@container spm (max-width:700px) or (max-height:500px){.spm-btn,.spm-btn-primary{min-height:44px;padding:.35rem .6rem}}
@media (prefers-reduced-motion:reduce){.spm-btn,.spm-btn-primary{transition:none}}
`;

export interface SaveSlot {
  id: string;
  /** 例：「第一卷・寒水渡」 */
  chapter?: string;
  /** 例：「渡口・帳房」 */
  scene?: string;
  savedAt: Date | string | number;
  playTimeSeconds: number;
}

export interface SaveLoadPanelLabels {
  saveTitle: string;
  loadTitle: string;
  unknownTime: string;
  playTime: (hours: number, minutes: number) => string;
  writeFailed: (slotIndex: number) => string;
  loadFailed: string;
  slot: (slotIndex: number) => string;
  overwriteTitle: (slotIndex: number) => string;
  deleteTitle: (slotIndex: number) => string;
  overwriteBody: string;
  deleteBody: string;
  confirmOverwrite: string;
  confirmDelete: string;
  cancel: string;
  autosave: string;
  quicksave: string;
  empty: string;
  delete: string;
  deleteSlot: (label: string) => string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, SaveLoadPanelLabels> = {
  en: {
    saveTitle: "Save",
    loadTitle: "Load",
    unknownTime: "Unknown time",
    playTime: (h, m) => (h > 0 ? `${h} h ${m} min` : `${m} min`),
    writeFailed: (n) => `Couldn't write Save ${n}. Your progress was not saved.`,
    loadFailed: "Something went wrong loading this save. Your progress was not changed.",
    slot: (n) => `Save ${n}`,
    overwriteTitle: (n) => `Overwrite Save ${n}`,
    deleteTitle: (n) => `Delete Save ${n}`,
    overwriteBody: "The save in this slot will be replaced with your current progress. This can't be undone:",
    deleteBody: "This save will be permanently deleted. This can't be undone:",
    confirmOverwrite: "Overwrite",
    confirmDelete: "Delete",
    cancel: "Cancel",
    autosave: "Autosave",
    quicksave: "Quicksave",
    empty: "Empty",
    delete: "Delete",
    deleteSlot: (label) => `Delete ${label}`,
  },
  "zh-TW": {
    saveTitle: "存檔",
    loadTitle: "讀取紀錄",
    unknownTime: "時間不明",
    playTime: (h, m) => (h > 0 ? `${h} 小時 ${m} 分` : `${m} 分鐘`),
    writeFailed: (n) => `存檔 ${n} 寫入失敗，進度未被保存。`,
    loadFailed: "讀取這個存檔時發生問題，進度未被更動。",
    slot: (n) => `存檔 ${n}`,
    overwriteTitle: (n) => `覆蓋存檔 ${n}`,
    deleteTitle: (n) => `刪除存檔 ${n}`,
    overwriteBody: "這個欄位目前的存檔會被現在的進度取代，且無法復原：",
    deleteBody: "這份存檔會被永久刪除，且無法復原：",
    confirmOverwrite: "確定覆蓋",
    confirmDelete: "確定刪除",
    cancel: "取消",
    autosave: "自動存檔",
    quicksave: "快速存檔",
    empty: "空",
    delete: "刪除",
    deleteSlot: (label) => `刪除${label}`,
  },
  "zh-CN": {
    saveTitle: "存档",
    loadTitle: "读取记录",
    unknownTime: "时间不明",
    playTime: (h, m) => (h > 0 ? `${h} 小时 ${m} 分` : `${m} 分钟`),
    writeFailed: (n) => `存档 ${n} 写入失败，进度未保存。`,
    loadFailed: "读取这个存档时出现问题，进度未被改动。",
    slot: (n) => `存档 ${n}`,
    overwriteTitle: (n) => `覆盖存档 ${n}`,
    deleteTitle: (n) => `删除存档 ${n}`,
    overwriteBody: "这个存档位当前的存档会被现在的进度覆盖，且无法恢复：",
    deleteBody: "这份存档会被永久删除，且无法恢复：",
    confirmOverwrite: "确定覆盖",
    confirmDelete: "确定删除",
    cancel: "取消",
    autosave: "自动存档",
    quicksave: "快速存档",
    empty: "空",
    delete: "删除",
    deleteSlot: (label) => `删除${label}`,
  },
  ja: {
    saveTitle: "セーブ",
    loadTitle: "ロード",
    unknownTime: "日時不明",
    playTime: (h, m) => (h > 0 ? `${h} 時間 ${m} 分` : `${m} 分`),
    writeFailed: (n) => `セーブ ${n} への書き込みに失敗しました。進行状況は保存されていません。`,
    loadFailed: "このセーブデータの読み込みに失敗しました。進行状況は変更されていません。",
    slot: (n) => `セーブ ${n}`,
    overwriteTitle: (n) => `セーブ ${n} を上書き`,
    deleteTitle: (n) => `セーブ ${n} を削除`,
    overwriteBody: "このスロットのセーブデータは現在の進行状況で置き換えられます。元に戻せません：",
    deleteBody: "このセーブデータは完全に削除されます。元に戻せません：",
    confirmOverwrite: "上書きする",
    confirmDelete: "削除する",
    cancel: "キャンセル",
    autosave: "オートセーブ",
    quicksave: "クイックセーブ",
    empty: "空き",
    delete: "削除",
    deleteSlot: (label) => `${label}を削除`,
  },
};

/** locale 同時決定日期格式與文字 */
export function formatSavedAt(value: Date | string | number, locale = "en") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return MESSAGES[resolveLocale(locale)].unknownTime;
  return date.toLocaleString(locale, { hour12: false });
}

export function formatPlayTime(seconds: number, locale = "en") {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const total = Math.floor(safe / 60);
  const hours = Math.floor(total / 60);
  return MESSAGES[resolveLocale(locale)].playTime(hours, total % 60);
}

/** 破壞性確認裡用的一行描述：章 · 場景 · 時間，絕不留空 */
export function saveSlotOneLineLabel(slot: SaveSlot, locale = "en") {
  return [slot.chapter, slot.scene, formatSavedAt(slot.savedAt, locale)].filter(Boolean).join(" · ");
}

export interface SaveLoadPanelProps {
  mode: "save" | "load";
  onClose: () => void;
  autosave?: SaveSlot;
  quicksave?: SaveSlot;
  /** 手動欄位，索引 0 是「存檔 1」；undefined 表示空欄 */
  manualSlots: (SaveSlot | undefined)[];
  /** 寫入第 n 格（從 1 起算）；丟出錯誤時訊息會顯示在面板上，面板不關 */
  onSave?: (slotIndex: number) => void;
  /** 讀取；reject 時就地顯示原因 */
  onLoad?: (slotId: string) => void | Promise<void>;
  onDelete?: (slotIndex: number) => void;
  /** 先前留下的存檔錯誤（存檔模式顯示在頂端） */
  lastError?: string;
  theme?: StoryTheme;
  fixed?: boolean;
  /** 介面語言與日期格式：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<SaveLoadPanelLabels>;
  className?: string;
}

type Pending = { kind: "overwrite" | "delete"; slotIndex: number; slot: SaveSlot };

export function SaveLoadPanel({
  mode,
  onClose,
  autosave,
  quicksave,
  manualSlots,
  onSave,
  onLoad,
  onDelete,
  lastError,
  theme = "ink",
  fixed = false,
  locale = "en",
  labels,
  className,
}: SaveLoadPanelProps) {
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const [pending, setPending] = useState<Pending>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      e.preventDefault();
      closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    cardRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
  }, [pending]);

  const write = (slotIndex: number) => {
    try {
      onSave?.(slotIndex);
      onClose();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t.writeFailed(slotIndex));
    }
  };

  const load = async (id: string) => {
    setError(undefined);
    setBusy(true);
    try {
      await onLoad?.(id);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t.loadFailed);
    } finally {
      setBusy(false);
    }
  };

  const banner = error ?? (mode === "save" ? lastError : undefined);
  const vars = storyThemes[theme] as unknown as CSSProperties;

  return (
    <div
      className={cn("spm-root inset-0 flex items-center justify-center", fixed ? "fixed" : "absolute", className)}
      style={{ ...vars, zIndex: 70, background: "rgb(var(--story-scrim) / 0.82)", fontFamily: "var(--story-font)", color: "var(--story-text)" }}
    >
      <style>{storyMenuCss}</style>
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label={mode === "save" ? t.saveTitle : t.loadTitle}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          width: "min(34rem, 90%)",
          maxHeight: "86%",
          overflowY: "auto",
          padding: "clamp(1rem, 4cqw, 2rem) clamp(1rem, 4.5cqw, 2.25rem)",
          boxSizing: "border-box",
          background: "var(--story-panel)",
          border: "1px solid var(--story-line)",
          borderRadius: 4,
          boxShadow: "var(--story-panel-shadow)",
        }}
      >
        <div style={{ fontFamily: "var(--story-font-display)", fontSize: "1.2rem", letterSpacing: "0.2em", color: "var(--story-accent-bright)" }}>
          {mode === "save" ? t.saveTitle : t.loadTitle}
        </div>

        {banner && (
          <div role="alert" style={{ fontSize: "0.85rem", lineHeight: 1.6, padding: "0.6rem 0.75rem", border: "1px solid var(--story-accent-bright)", borderRadius: 3, background: "var(--story-alert)" }}>
            {banner}
          </div>
        )}

        {pending ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ fontSize: "1rem", letterSpacing: "0.15em", color: "var(--story-accent-bright)" }}>
              {pending.kind === "overwrite" ? t.overwriteTitle(pending.slotIndex) : t.deleteTitle(pending.slotIndex)}
            </div>
            <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.7 }}>
              {pending.kind === "overwrite" ? t.overwriteBody : t.deleteBody}
            </p>
            <SlotDescription slot={pending.slot} locale={locale} t={t} />
            <button
              type="button"
              className="spm-btn-primary"
              onClick={() => {
                setPending(undefined);
                if (pending.kind === "overwrite") write(pending.slotIndex);
                else onDelete?.(pending.slotIndex);
              }}
            >
              {pending.kind === "overwrite" ? t.confirmOverwrite : t.confirmDelete}
            </button>
            <button type="button" className="spm-btn" onClick={() => setPending(undefined)}>
              {t.cancel}
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {mode === "load" && (
                <SlotRow label={t.autosave} locale={locale} t={t} slot={autosave} disabled={busy} onClick={autosave ? () => void load(autosave.id) : undefined} />
              )}
              {mode === "load" && (
                <SlotRow label={t.quicksave} locale={locale} t={t} slot={quicksave} disabled={busy} onClick={quicksave ? () => void load(quicksave.id) : undefined} />
              )}
              {manualSlots.map((slot, i) => {
                const slotIndex = i + 1;
                return (
                  <SlotRow
                    key={slotIndex}
                    label={t.slot(slotIndex)}
                    locale={locale}
                    t={t}
                    slot={slot}
                    disabled={busy}
                    onClick={
                      mode === "save"
                        ? () => {
                            setError(undefined);
                            if (slot) setPending({ kind: "overwrite", slotIndex, slot });
                            else write(slotIndex);
                          }
                        : slot
                          ? () => void load(slot.id)
                          : undefined
                    }
                    onDelete={slot && onDelete ? () => setPending({ kind: "delete", slotIndex, slot }) : undefined}
                  />
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button type="button" className="spm-btn" onClick={onClose}>
                {t.cancel}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SlotDescription({ slot, locale, t }: { slot: SaveSlot; locale: string; t: SaveLoadPanelLabels }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", fontSize: "0.85rem", color: "var(--story-secondary)" }}>
      {slot.chapter && <span>{slot.chapter}</span>}
      {slot.scene && <span>{slot.scene}</span>}
      <span>
        {formatSavedAt(slot.savedAt, locale)} · {formatPlayTime(slot.playTimeSeconds, locale)}
      </span>
    </div>
  );
}

// 選取與刪除是同一層的兩顆按鈕，不巢套
function SlotRow({
  label,
  locale,
  t,
  slot,
  disabled,
  onClick,
  onDelete,
}: {
  label: string;
  locale: string;
  t: SaveLoadPanelLabels;
  slot?: SaveSlot;
  disabled?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "stretch", gap: "0.4rem", minWidth: 0 }}>
      <button
        type="button"
        className="spm-btn"
        onClick={onClick}
        disabled={!onClick || disabled}
        style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left", gap: "0.75rem", padding: "0.75rem 1rem" }}
      >
        <span style={{ display: "flex", flexDirection: "column", gap: "0.15rem", minWidth: 0 }}>
          <span>{label}</span>
          {slot ? (
            <>
              {slot.chapter && <span style={{ fontSize: "0.8rem", color: "var(--story-accent-dim)" }}>{slot.chapter}</span>}
              {slot.scene && <span style={{ fontSize: "0.8rem", color: "var(--story-secondary)" }}>{slot.scene}</span>}
              <span style={{ fontSize: "0.75rem", color: "var(--story-secondary)" }}>
                {formatSavedAt(slot.savedAt, locale)} · {formatPlayTime(slot.playTimeSeconds, locale)}
              </span>
            </>
          ) : (
            <span style={{ fontSize: "0.75rem", color: "var(--story-secondary)" }}>{t.empty}</span>
          )}
        </span>
      </button>
      {onDelete && (
        <button
          type="button"
          aria-label={t.deleteSlot(label)}
          onClick={onDelete}
          disabled={disabled}
          className="hover:text-[var(--story-accent-bright)] focus-visible:text-[var(--story-accent-bright)] focus-visible:outline-none"
          style={{ flexShrink: 0, alignSelf: "center", fontSize: "0.75rem", color: "var(--story-secondary)", padding: "0.25rem 0.5rem", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}
        >
          {t.delete}
        </button>
      )}
    </div>
  );
}
