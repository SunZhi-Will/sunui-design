"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// 移植自 山河未歸 save/pause-menu.tsx、save-error-banner.tsx 與 main.css 的暫停選單段落，
// 操作說明的寫法參考互動小說平台 reader/modals/PauseModal.tsx
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

// 筆刷形狀：原作用一張金色筆刷圖，這裡改成 SVG 遮罩，顏色跟著 accent 走
const brushMask =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 40' preserveAspectRatio='none'%3E%3Cpath d='M9 8C38 4 92 3 140 4l50 2-6 3 12 2-9 3 13 3-12 3 10 4-8 3 11 4-14 2C140 37 70 38 14 35l-10-1 7-3-9-3 8-3-8-4 9-2-7-4 9-2-8-3z'/%3E%3C/svg%3E\")";

/** 暫停選單的按鈕與動畫 */
export const storyMenuCss = `
.spm-root{container-type:size;container-name:spm}
.spm-overlay{display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at center,rgb(var(--story-scrim) / .55) 0%,rgb(var(--story-scrim-deep) / .86) 100%);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);animation:spm-fade 240ms ease-out both}
.spm-card{display:flex;flex-direction:column;gap:.75rem;width:clamp(18rem,26vw,23rem);max-width:92%;max-height:calc(100% - 2rem);overflow-y:auto;padding:2rem 3rem 1.75rem;box-sizing:border-box;background:linear-gradient(90deg,rgb(var(--story-band) / 0) 0%,rgb(var(--story-band) / .9) 18%,rgb(var(--story-band) / .9) 82%,rgb(var(--story-band) / 0) 100%);border-top:1px solid;border-bottom:1px solid;border-image:linear-gradient(90deg,transparent,var(--story-accent-dim) 30%,var(--story-accent-dim) 70%,transparent) 1;animation:spm-rise 280ms cubic-bezier(.05,.7,.1,1) both}
.spm-title{display:flex;align-items:center;justify-content:center;gap:.9rem;margin-bottom:.4rem;color:var(--story-accent-bright);font-family:var(--story-font-display);font-size:1.15rem;letter-spacing:.5em;text-indent:.5em}
.spm-title::before,.spm-title::after{width:2.2rem;height:1px;content:"";background:linear-gradient(90deg,transparent,var(--story-accent-dim))}
.spm-title::after{background:linear-gradient(90deg,var(--story-accent-dim),transparent)}
.spm-objective{margin:-.4rem 0 1.2rem;color:var(--story-secondary);font-size:.9rem;letter-spacing:.1em;line-height:1.7;text-align:center}
.spm-nav{display:flex;flex-direction:column;gap:.15rem}
.spm-item{position:relative;isolation:isolate;width:100%;min-height:2.75rem;padding:.5rem 1.25rem .55rem;overflow:hidden;color:var(--story-text);font:inherit;font-size:1.05rem;letter-spacing:.18em;text-align:center;text-shadow:0 2px 8px var(--story-text-shadow);background:transparent;border:0;border-bottom:1px solid rgb(var(--story-glow) / .22);cursor:pointer;transition:color 180ms ease,text-shadow 180ms ease,border-color 180ms ease}
.spm-item:last-child{border-bottom-color:transparent}
.spm-item::before{position:absolute;inset:.12rem 0;z-index:-1;content:"";background:linear-gradient(180deg,var(--story-accent-bright),var(--story-accent) 55%,var(--story-accent-bright));-webkit-mask:${brushMask} center / 100% 100% no-repeat;mask:${brushMask} center / 100% 100% no-repeat;clip-path:inset(0 100% 0 0);opacity:0;filter:brightness(.82) saturate(.78);transition:clip-path 380ms cubic-bezier(.22,.72,.2,1),opacity 90ms ease;will-change:clip-path}
.spm-item>span{position:relative;z-index:1}
.spm-item:hover:not(:disabled),.spm-item:focus-visible:not(:disabled){color:var(--story-on-accent);text-shadow:0 1px 1px rgba(255,232,184,.28);border-bottom-color:transparent;outline:none}
.spm-item:hover:not(:disabled)::before,.spm-item:focus-visible:not(:disabled)::before{clip-path:inset(0 0 0 0);opacity:.94}
.spm-item:disabled{color:var(--story-muted);cursor:not-allowed;opacity:.52}
.spm-item--resume{color:var(--story-accent-bright)}
.spm-btn{padding:.6rem 1.6rem;font:inherit;font-size:1rem;letter-spacing:.12em;background:linear-gradient(90deg,rgb(var(--story-glow) / .2),rgb(var(--story-glow) / .04)) left center / 0% 100% no-repeat,rgb(var(--story-band) / .7);color:var(--story-text);border:1px solid var(--story-line);border-radius:3px;cursor:pointer;transition:border-color 120ms ease-out,color 120ms ease-out,background-size 320ms cubic-bezier(.22,.72,.2,1),transform 80ms ease-out}
.spm-btn:hover:not(:disabled),.spm-btn:focus-visible:not(:disabled){border-color:var(--story-accent-dim);color:var(--story-accent-bright);background-size:100% 100%,auto;outline:none}
.spm-btn:active:not(:disabled){transform:translateY(1px) scale(.985)}
.spm-btn:disabled{color:var(--story-muted);cursor:not-allowed}
.spm-btn-primary{padding:.6rem 1.8rem;font:inherit;font-size:1rem;letter-spacing:.14em;background:linear-gradient(180deg,rgb(var(--story-glow) / .24),rgb(var(--story-glow) / .08));color:var(--story-accent-bright);border:1px solid var(--story-accent-dim);border-radius:3px;box-shadow:inset 0 1px 0 rgba(255,232,184,.12);cursor:pointer;transition:border-color 120ms ease-out,box-shadow 120ms ease-out,filter 120ms ease-out,transform 80ms ease-out}
.spm-btn-primary:hover:not(:disabled),.spm-btn-primary:focus-visible:not(:disabled){border-color:var(--story-accent);filter:brightness(1.12);box-shadow:0 0 18px rgb(var(--story-glow) / .28),inset 0 1px 0 rgba(255,232,184,.18);outline:none}
.spm-btn-primary:active:not(:disabled){transform:translateY(1px) scale(.985)}
.spm-btn-primary:disabled{opacity:.45;cursor:not-allowed}
@keyframes spm-fade{from{opacity:0}to{opacity:1}}
@keyframes spm-rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@container spm (max-width:700px) or (max-height:500px){.spm-card{padding:.9rem 2.5rem .8rem;gap:.35rem}.spm-title{margin-bottom:.1rem;font-size:1rem}.spm-btn,.spm-btn-primary{min-height:44px;padding:.35rem .6rem}}
@media (prefers-reduced-motion:reduce){.spm-overlay,.spm-card{animation:none}.spm-item::before{transition:opacity 90ms ease}}
`;

export interface PauseMenuLabels {
  title?: string;
  dialog?: string;
  nav?: string;
  objective?: string;
  resume?: string;
  journal?: string;
  save?: string;
  load?: string;
  settings?: string;
  exit?: string;
  confirmDialog?: string;
  confirmTitle?: string;
  confirmBody?: string;
  /** 有自動存檔時：「回到主選單後可讀取的自動存檔停在：」 */
  autosaveAt?: string;
  noAutosave?: string;
  saveFirst?: string;
  discardAndExit?: string;
  cancel?: string;
  saveErrorTitle?: string;
  saveErrorDismiss?: string;
  saveErrorDismissLabel?: string;
}

const defaultLabels: Required<PauseMenuLabels> = {
  title: "選單",
  dialog: "暫停選單",
  nav: "暫停選項",
  objective: "目標・",
  resume: "繼續遊戲",
  journal: "山河錄",
  save: "存檔",
  load: "讀檔",
  settings: "設定",
  exit: "返回主選單",
  confirmDialog: "返回主選單確認",
  confirmTitle: "返回主選單",
  confirmBody: "遊戲只在劇情節點自動存檔。上次自動存檔之後的進度將不會保留。",
  autosaveAt: "回到主選單後可讀取的自動存檔停在：",
  noAutosave: "目前沒有任何自動存檔，這段遊玩進度將全部消失。",
  saveFirst: "先去存檔",
  discardAndExit: "捨棄進度並返回主選單",
  cancel: "取消",
  saveErrorTitle: "存檔失敗",
  saveErrorDismiss: "知道了",
  saveErrorDismissLabel: "關閉存檔失敗提示",
};

export interface PauseMenuProps {
  open: boolean;
  onResume: () => void;
  /** 冊子（山河錄、手帳）；沒給就不顯示這一項 */
  onOpenJournal?: () => void;
  onOpenSave: () => void;
  onOpenLoad: () => void;
  onOpenSettings: () => void;
  onExitToMenu: () => void;
  /** 目前目標；暫停時一定看得到 */
  objective?: ReactNode;
  /** 目標下方的摘要區，例如主角狀態一行 */
  summary?: ReactNode;
  /** 最近一筆自動存檔的一行描述，例如「第一卷・寒水渡 · 帳房 · 2026/11/5 21:14:03」；null 表示沒有 */
  lastAutosave?: string | null;
  /** 自動存檔失敗的訊息；換一則訊息時橫幅會重新出現 */
  saveError?: string;
  theme?: StoryTheme;
  /** true 時貼著視窗；預設 absolute 蓋滿最近的 relative 容器 */
  fixed?: boolean;
  labels?: PauseMenuLabels;
  className?: string;
}

/** 自動存檔失敗時唯一的提醒；關掉的只是「這一次」的失敗 */
export function SaveErrorBanner({ message, labels }: { message?: string; labels?: PauseMenuLabels }) {
  const l = { ...defaultLabels, ...labels };
  const [dismissed, setDismissed] = useState(false);
  const [seen, setSeen] = useState(message);
  if (seen !== message) {
    setSeen(message);
    setDismissed(false);
  }
  if (!message || dismissed) return null;
  return (
    <div
      role="alert"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 75,
        pointerEvents: "auto",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: "0.75rem",
        padding: "0.6rem 1rem",
        background: "var(--story-alert)",
        borderBottom: "1px solid var(--story-accent-bright)",
        color: "var(--story-text)",
        fontSize: "0.85rem",
        lineHeight: 1.5,
      }}
    >
      <span style={{ flex: 1, minWidth: 0, maxWidth: "48rem" }}>
        <strong style={{ color: "var(--story-accent-bright)" }}>{l.saveErrorTitle}</strong>
        <span> - {message}</span>
      </span>
      <button
        type="button"
        className="spm-btn"
        aria-label={l.saveErrorDismissLabel}
        onClick={() => setDismissed(true)}
        style={{ flex: "0 0 auto", padding: "0.2rem 0.6rem", fontSize: "0.8rem", minHeight: 0 }}
      >
        {l.saveErrorDismiss}
      </button>
    </div>
  );
}

export function PauseMenu({
  open,
  onResume,
  onOpenJournal,
  onOpenSave,
  onOpenLoad,
  onOpenSettings,
  onExitToMenu,
  objective,
  summary,
  lastAutosave,
  saveError,
  theme = "ink",
  fixed = false,
  labels: labelsProp,
  className,
}: PauseMenuProps) {
  const l = { ...defaultLabels, ...labelsProp };
  const [confirmingExit, setConfirmingExit] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  // 重新打開選單時，不能直接落在先前已經退出的確認卡上
  if (!open && confirmingExit) setConfirmingExit(false);

  // 開啟時把焦點移進卡片，關閉時還給原本的元素
  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    return () => returnFocus.current?.focus?.();
  }, [open]);
  useEffect(() => {
    if (open) cardRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [open, confirmingExit]);

  // Esc 關閉選單（原作同一個鍵開關暫停）
  const resumeRef = useRef(onResume);
  resumeRef.current = onResume;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      e.preventDefault();
      resumeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const vars = storyThemes[theme] as unknown as CSSProperties;

  return (
    <div
      className={cn("spm-root inset-0", fixed ? "fixed" : "absolute", !open && "pointer-events-none", className)}
      style={{ ...vars, zIndex: 60, fontFamily: "var(--story-font)", color: "var(--story-text)" }}
    >
      <style>{storyMenuCss}</style>
      <SaveErrorBanner message={saveError} labels={labelsProp} />
      {open && (
        <div className="spm-overlay absolute inset-0">
          <div ref={cardRef} className="spm-card" role="dialog" aria-modal="true" aria-label={confirmingExit ? l.confirmDialog : l.dialog}>
            {confirmingExit ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ fontSize: "1.1rem", letterSpacing: "0.2em", textAlign: "center", color: "var(--story-accent-bright)", fontFamily: "var(--story-font-display)" }}>
                  {l.confirmTitle}
                </div>
                <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.7 }}>{l.confirmBody}</p>
                {lastAutosave ? (
                  <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.7, color: "var(--story-secondary)" }}>
                    {l.autosaveAt}
                    {lastAutosave}
                  </p>
                ) : (
                  <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.7, color: "var(--story-accent-bright)" }}>{l.noAutosave}</p>
                )}
                <button
                  type="button"
                  className="spm-btn-primary"
                  onClick={() => {
                    setConfirmingExit(false);
                    onOpenSave();
                  }}
                >
                  {l.saveFirst}
                </button>
                <button
                  type="button"
                  className="spm-btn"
                  onClick={() => {
                    setConfirmingExit(false);
                    onExitToMenu();
                  }}
                >
                  {l.discardAndExit}
                </button>
                <button type="button" className="spm-btn" onClick={() => setConfirmingExit(false)}>
                  {l.cancel}
                </button>
              </div>
            ) : (
              <>
                <div className="spm-title">{l.title}</div>
                {objective && (
                  <p className="spm-objective">
                    {l.objective}
                    {objective}
                  </p>
                )}
                {summary}
                <nav className="spm-nav" aria-label={l.nav}>
                  <button type="button" className="spm-item spm-item--resume" onClick={onResume}>
                    <span>{l.resume}</span>
                  </button>
                  {onOpenJournal && (
                    <button type="button" className="spm-item" onClick={onOpenJournal}>
                      <span>{l.journal}</span>
                    </button>
                  )}
                  <button type="button" className="spm-item" onClick={onOpenSave}>
                    <span>{l.save}</span>
                  </button>
                  <button type="button" className="spm-item" onClick={onOpenLoad}>
                    <span>{l.load}</span>
                  </button>
                  <button type="button" className="spm-item" onClick={onOpenSettings}>
                    <span>{l.settings}</span>
                  </button>
                  <button type="button" className="spm-item" onClick={() => setConfirmingExit(true)}>
                    <span>{l.exit}</span>
                  </button>
                </nav>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
