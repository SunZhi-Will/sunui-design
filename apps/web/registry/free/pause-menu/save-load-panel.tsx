"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

import { storyMenuCss, storyThemes, type StoryTheme } from "./pause-menu";

// 移植自 山河未歸 save/save-load-panel.tsx 與 save-slot-label.ts：覆蓋、刪除都在面板內兩段式確認

export interface SaveSlot {
  id: string;
  /** 例：「第一卷・寒水渡」 */
  chapter?: string;
  /** 例：「渡口・帳房」 */
  scene?: string;
  savedAt: Date | string | number;
  playTimeSeconds: number;
}

export function formatSavedAt(value: Date | string | number) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "時間不明";
  return date.toLocaleString("zh-TW", { hour12: false });
}

export function formatPlayTime(seconds: number) {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const total = Math.floor(safe / 60);
  const hours = Math.floor(total / 60);
  return hours > 0 ? `${hours} 小時 ${total % 60} 分` : `${total % 60} 分鐘`;
}

/** 破壞性確認裡用的一行描述：章 · 場景 · 時間，絕不留空 */
export function saveSlotOneLineLabel(slot: SaveSlot) {
  return [slot.chapter, slot.scene, formatSavedAt(slot.savedAt)].filter(Boolean).join(" · ");
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
  className,
}: SaveLoadPanelProps) {
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
      setError(err instanceof Error && err.message ? err.message : `存檔 ${slotIndex} 寫入失敗，進度未被保存。`);
    }
  };

  const load = async (id: string) => {
    setError(undefined);
    setBusy(true);
    try {
      await onLoad?.(id);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "讀取這個存檔時發生問題，進度未被更動。");
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
        aria-label={mode === "save" ? "存檔" : "讀取紀錄"}
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
          {mode === "save" ? "存檔" : "讀取紀錄"}
        </div>

        {banner && (
          <div role="alert" style={{ fontSize: "0.85rem", lineHeight: 1.6, padding: "0.6rem 0.75rem", border: "1px solid var(--story-accent-bright)", borderRadius: 3, background: "var(--story-alert)" }}>
            {banner}
          </div>
        )}

        {pending ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ fontSize: "1rem", letterSpacing: "0.15em", color: "var(--story-accent-bright)" }}>
              {pending.kind === "overwrite" ? `覆蓋存檔 ${pending.slotIndex}` : `刪除存檔 ${pending.slotIndex}`}
            </div>
            <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.7 }}>
              {pending.kind === "overwrite" ? "這個欄位目前的存檔會被現在的進度取代，且無法復原：" : "這份存檔會被永久刪除，且無法復原："}
            </p>
            <SlotDescription slot={pending.slot} />
            <button
              type="button"
              className="spm-btn-primary"
              onClick={() => {
                setPending(undefined);
                if (pending.kind === "overwrite") write(pending.slotIndex);
                else onDelete?.(pending.slotIndex);
              }}
            >
              {pending.kind === "overwrite" ? "確定覆蓋" : "確定刪除"}
            </button>
            <button type="button" className="spm-btn" onClick={() => setPending(undefined)}>
              取消
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {mode === "load" && (
                <SlotRow label="自動存檔" slot={autosave} disabled={busy} onClick={autosave ? () => void load(autosave.id) : undefined} />
              )}
              {mode === "load" && (
                <SlotRow label="快速存檔" slot={quicksave} disabled={busy} onClick={quicksave ? () => void load(quicksave.id) : undefined} />
              )}
              {manualSlots.map((slot, i) => {
                const slotIndex = i + 1;
                return (
                  <SlotRow
                    key={slotIndex}
                    label={`存檔 ${slotIndex}`}
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
                取消
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SlotDescription({ slot }: { slot: SaveSlot }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", fontSize: "0.85rem", color: "var(--story-secondary)" }}>
      {slot.chapter && <span>{slot.chapter}</span>}
      {slot.scene && <span>{slot.scene}</span>}
      <span>
        {formatSavedAt(slot.savedAt)} · {formatPlayTime(slot.playTimeSeconds)}
      </span>
    </div>
  );
}

// 選取與刪除是同一層的兩顆按鈕，不巢套
function SlotRow({ label, slot, disabled, onClick, onDelete }: { label: string; slot?: SaveSlot; disabled?: boolean; onClick?: () => void; onDelete?: () => void }) {
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
                {formatSavedAt(slot.savedAt)} · {formatPlayTime(slot.playTimeSeconds)}
              </span>
            </>
          ) : (
            <span style={{ fontSize: "0.75rem", color: "var(--story-secondary)" }}>空</span>
          )}
        </span>
      </button>
      {onDelete && (
        <button
          type="button"
          aria-label={`刪除${label}`}
          onClick={onDelete}
          disabled={disabled}
          className="hover:text-[var(--story-accent-bright)] focus-visible:text-[var(--story-accent-bright)] focus-visible:outline-none"
          style={{ flexShrink: 0, alignSelf: "center", fontSize: "0.75rem", color: "var(--story-secondary)", padding: "0.25rem 0.5rem", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}
        >
          刪除
        </button>
      )}
    </div>
  );
}
