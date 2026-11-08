"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { CopyButton } from "@/components/copy-button";
import { previewUrl } from "@/lib/demo-locale";
import { format, type Locale } from "@/lib/i18n";
import type { Messages } from "@/lib/messages";

export type BlockSheetItem = {
  name: string;
  /** 從效果庫的單一樣式卡片展開時帶著它，面板只跑這一種 */
  variant?: string;
  title: string;
  description: string;
  tier: "free" | "pro";
  install: string | null;
  /** 網站目前的語言，帶進預覽 iframe 的網址（預覽頁是靜態檔，自己讀不到 cookie） */
  locale: Locale;
};

const spring = { type: "spring", stiffness: 240, damping: 30 } as const;

/**
 * 從型錄點卡片時，卡片就地展開成這個面板，網址同時變成 /blocks/<name>。
 * 直接打開或重新整理該網址時不會經過這裡，而是完整的 block 頁，方便分享。
 */
export function BlockSheet({ item, labels }: { item: BlockSheetItem; labels: Messages["sheet"] }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [run, setRun] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef(false);

  // 關閉：先播退場動畫再回上一頁；分頁在背景時動畫不會跑，所以加一個保險計時器
  const leave = () => {
    if (leftRef.current) return;
    leftRef.current = true;
    const sheetPath = window.location.pathname;
    // 連點展開可能疊出兩筆同樣的 /blocks/<name>，退一步網址沒變就再退；
    // 沒有上一頁可退（例如歷史被換掉）時改回首頁，面板才會真的卸下
    const back = (tries: number) => {
      router.back();
      window.setTimeout(() => {
        if (window.location.pathname !== sheetPath) return;
        if (tries > 1) back(tries - 1);
        else router.replace("/", { scroll: false });
      }, 400);
    };
    back(3);
  };
  const close = () => {
    setOpen(false);
    window.setTimeout(leave, 600);
  };

  const closeRef = useRef(close);
  closeRef.current = close;

  // 鎖捲動只跟著面板開著：一關就還原，不等路由切換才卸下元件
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && closeRef.current();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <AnimatePresence onExitComplete={leave}>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            onClick={close}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="block-sheet-title"
            tabIndex={-1}
            layoutId={reduce ? undefined : `block-card-${item.variant ? `${item.name}~${item.variant}` : item.name}`}
            transition={spring}
            style={{ borderRadius: 12 }}
            className="relative flex h-full max-h-[860px] w-full max-w-5xl flex-col overflow-hidden bg-card shadow-2xl ring-1 ring-line outline-none"
          >
            <header className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-5">
              <div className="min-w-0 flex-1">
                <h2 id="block-sheet-title" className="flex items-center gap-2 font-medium tracking-tight">
                  <span className="truncate">{item.title}</span>
                  {item.tier === "pro" && (
                    <span className="rounded-sm bg-fg px-2 py-0.5 text-[11px] font-medium text-bg">Pro</span>
                  )}
                </h2>
              </div>
              <IconButton label={labels.replay} onClick={() => { setLoaded(false); setRun((n) => n + 1); }}>
                <path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4" />
              </IconButton>
              <CopyLink label={labels.copyLink} />
              {/* 用一般連結強制整頁載入，才會離開彈窗、進到完整的 block 頁 */}
              <a
                href={`/blocks/${item.name}`}
                className="hidden rounded-sm px-3 py-1.5 text-sm text-subtle transition-colors hover:bg-stage hover:text-fg sm:inline-block"
              >
                {labels.docs}
              </a>
              <IconButton label={labels.close} onClick={close}>
                <path d="M6 6l12 12M18 6 6 18" />
              </IconButton>
            </header>

            <div className="relative min-h-0 flex-1">
              <iframe
                key={run}
                src={previewUrl(
                  item.variant
                    ? `/preview/${item.name}/v/${encodeURIComponent(item.variant)}/sheet`
                    : `/preview/${item.name}/sheet`,
                  item.locale,
                )}
                title={format(labels.frameTitle, { title: item.title })}
                onLoad={() => setLoaded(true)}
                className="size-full border-0 transition-opacity duration-300"
                style={{ opacity: loaded ? 1 : 0 }}
              />
            </div>

            <footer className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:px-5">
              <p className="line-clamp-2 min-w-0 flex-1 text-sm text-pretty text-subtle">{item.description}</p>
              {/* 窄螢幕的頂部列放不下說明連結，改放這裡，手機才有路到程式碼與用法 */}
              <a
                href={`/blocks/${item.name}`}
                className="text-sm font-medium text-fg underline underline-offset-4 sm:hidden"
              >
                {labels.docs}
              </a>
              {item.install ? (
                <div className="flex min-w-0 items-center gap-2 rounded-md border border-line bg-bg py-1.5 pr-1.5 pl-3 sm:max-w-md">
                  <code className="min-w-0 flex-1 overflow-x-auto font-mono text-xs whitespace-nowrap">{item.install}</code>
                  <CopyButton value={item.install} />
                </div>
              ) : (
                <Link
                  href="/pricing"
                  className="shrink-0 rounded-sm bg-fg px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90"
                >
                  {labels.getPro}
                </Link>
              )}
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-8 shrink-0 place-items-center rounded-sm text-subtle transition-colors hover:bg-stage hover:text-fg"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}

// 複製目前網址，分享出去的人會直接看到完整的 block 頁
function CopyLink({ label }: { label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          // 剪貼簿被瀏覽器拒絕時不顯示勾勾，使用者仍可從網址列複製
        }
      }}
      className="grid size-8 shrink-0 place-items-center rounded-sm text-subtle transition-colors hover:bg-stage hover:text-fg"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {copied ? <path d="m5 12 4.5 4.5L19 7" /> : <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />}
      </svg>
    </button>
  );
}
