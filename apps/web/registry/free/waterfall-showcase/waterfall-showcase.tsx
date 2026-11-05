"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * 作品展示：流動的瀑布牆。幾欄作品上下緩慢流動，滑鼠移上去暫停，點開看大圖與當初那一句話。
 * 每欄內容複製一份接在後面，位移 -50% 剛好接回開頭；複製的那份對輔助技術隱藏、不可聚焦。
 * reduced motion 時整面牆靜止，燈箱改為立即出現。
 */

export type WaterfallWork = {
  id: string;
  /** 圖片網址；沒有時改用 art */
  src?: string;
  /** 自訂畫面（例如 SVG 或漸層），依 width / height 的比例撐開 */
  art?: ReactNode;
  width: number;
  height: number;
  /** 風格名稱，顯示在膠囊標籤 */
  styleName: string;
  /** 使用者當初說的那一句（風格預覽圖沒有） */
  text?: string;
  /** AI 改寫後的描述 */
  prompt?: string;
  model?: string;
};

export type WaterfallShowcaseLabels = {
  view: (work: WaterfallWork) => string;
  youSaid: string;
  style: string;
  rewrittenAs: string;
  model: string;
  styleNote: string;
  footnote: string;
  close: string;
};

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, WaterfallShowcaseLabels> = {
  en: {
    view: (w) => `View artwork: ${w.text ?? w.styleName}`,
    youSaid: "You said",
    style: "Style",
    rewrittenAs: "AI rewrote it as",
    model: "Model",
    styleNote: "The same window-side portrait composition, drawn in this style.",
    footnote: "Generated on this site, passed the output check and labelled as AI-generated.",
    close: "Close",
  },
  "zh-TW": {
    view: (w) => `查看作品：${w.text ?? w.styleName}`,
    youSaid: "你說的",
    style: "風格",
    rewrittenAs: "AI 改寫成",
    model: "模型",
    styleNote: "同一張窗邊人像構圖，以這個風格繪製。",
    footnote: "於本站生成，已通過輸出檢查，並標示為 AI 生成。",
    close: "關閉",
  },
  "zh-CN": {
    view: (w) => `查看作品：${w.text ?? w.styleName}`,
    youSaid: "你说的",
    style: "风格",
    rewrittenAs: "AI 改写为",
    model: "模型",
    styleNote: "同一张窗边人像构图，用这种风格绘制。",
    footnote: "在本站生成，已通过输出审核，并标注为 AI 生成。",
    close: "关闭",
  },
  ja: {
    view: (w) => `作品を見る：${w.text ?? w.styleName}`,
    youSaid: "あなたの言葉",
    style: "スタイル",
    rewrittenAs: "AI による書き直し",
    model: "モデル",
    styleNote: "同じ窓辺のポートレート構図を、このスタイルで描いたものです。",
    footnote: "このサイトで生成され、出力チェックを通過し、AI 生成と表示されています。",
    close: "閉じる",
  },
};

export type WaterfallShowcaseProps = {
  works: WaterfallWork[];
  /** 欄數；手機只顯示前 2 欄，平板前 4 欄 */
  columns?: number;
  /** true：燈箱蓋滿視窗並鎖捲動；false：只蓋住元件本身 */
  fixed?: boolean;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<WaterfallShowcaseLabels>;
  className?: string;
};

const WALL_CSS = `
@keyframes wf-wall-up { from { transform: translateY(0); } to { transform: translateY(-50%); } }
.wf-wall-col { animation: wf-wall-up var(--wall-duration, 80s) linear infinite; }
.wf-wall-col-down { animation-direction: reverse; }
@keyframes wf-swap-in {
  from { opacity: 0; transform: translateY(6px); filter: blur(4px); }
  to { opacity: 1; transform: none; filter: none; }
}
.wf-swap-in { animation: wf-swap-in 500ms cubic-bezier(0.23, 1, 0.32, 1) both; }
@media (prefers-reduced-motion: reduce) {
  .wf-wall-col, .wf-swap-in { animation: none; }
}
`;

function WorkMedia({ work, alt, className, eager }: { work: WaterfallWork; alt: string; className?: string; eager?: boolean }) {
  if (work.src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={work.src} alt={alt} width={work.width} height={work.height} loading={eager ? "eager" : "lazy"} className={className} />
    );
  }
  return (
    <div
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      className={cn("relative overflow-hidden", className)}
      style={{ aspectRatio: `${work.width} / ${work.height}` }}
    >
      {work.art}
    </div>
  );
}

export function WaterfallShowcase({ works, columns: cols = 5, fixed = true, locale = "en", labels, className }: WaterfallShowcaseProps) {
  const l = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const reduce = useReducedMotion() ?? false;
  const [open, setOpen] = useState<WaterfallWork | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const uid = useId();
  const titleId = `${uid}-title`;
  const descId = `${uid}-desc`;

  const close = useCallback(() => setOpen(null), []);

  const openWork = (w: WaterfallWork, el: HTMLElement) => {
    returnFocus.current = el;
    setOpen(w);
  };

  // 燈箱：聚焦關閉鈕、Esc 關閉、Tab 留在框內，關閉後焦點回到原本的作品
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    if (fixed) document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const items = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (fixed) document.body.style.overflow = prevOverflow;
      returnFocus.current?.focus();
    };
  }, [open, fixed, close]);

  if (!works.length) return <div className="h-[40rem]" aria-hidden />;

  // 依欄數分配，每欄錯開起點；內容複製一份接在後面，捲到一半剛好接回開頭
  const perCol = Math.max(5, Math.ceil(works.length / 2));
  const columns = Array.from({ length: cols }, (_, c) =>
    Array.from({ length: perCol }, (_, k) => works[(c * 3 + k * 2) % works.length]),
  );
  const fade = reduce ? { duration: 0 } : { duration: 0.1 };

  return (
    <div className={cn("relative", className)}>
      <style>{WALL_CSS}</style>
      <div className="group/wall relative h-[36rem] overflow-hidden [mask-image:linear-gradient(180deg,transparent,#000_12%,#000_88%,transparent)] sm:h-[44rem]">
        <div className="mx-auto flex max-w-7xl justify-center gap-3 px-4 sm:gap-4 sm:px-6">
          {columns.map((col, c) => (
            <div key={c} className={cn("min-w-0 flex-1", c >= 2 && "max-sm:hidden", c >= 4 && "max-lg:hidden")}>
              <ul
                className={cn(
                  "wf-wall-col m-0 flex list-none flex-col p-0 group-hover/wall:[animation-play-state:paused] group-focus-within/wall:[animation-play-state:paused]",
                  c % 2 === 1 && "wf-wall-col-down",
                )}
                style={{ "--wall-duration": `${60 + (c % 3) * 14}s` } as CSSProperties}
              >
                {[...col, ...col].map((w, k) => {
                  const copy = k >= col.length;
                  return (
                    <li key={k} className="mb-3 sm:mb-4" aria-hidden={copy || undefined}>
                      <button
                        type="button"
                        tabIndex={copy ? -1 : 0}
                        onClick={(e) => openWork(w, e.currentTarget)}
                        aria-label={l.view(w)}
                        aria-haspopup="dialog"
                        className="group relative block w-full overflow-hidden rounded-2xl border border-border bg-card text-left transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_18px_40px_-20px_rgba(0,0,0,0.22)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        <WorkMedia
                          work={w}
                          alt=""
                          eager={k < 3}
                          className="h-auto w-full transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                        />
                        {/* 說明：有滑鼠時移上去才出現，觸控裝置一直顯示風格 */}
                        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 pt-10 text-white opacity-100 transition-opacity duration-300 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-visible:opacity-100">
                          {w.text ? <span className="line-clamp-2 text-[13px] leading-snug">{w.text}</span> : null}
                          <span className="mt-1.5 inline-flex rounded-full bg-white/20 px-2 py-0.5 text-[11px] backdrop-blur">
                            {w.styleName}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="lightbox"
            className={cn("isolate z-50 flex items-center justify-center p-4", fixed ? "fixed inset-0" : "absolute inset-0")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fade}
          >
            <div className="absolute inset-0 bg-black/10 supports-[backdrop-filter]:backdrop-blur-xs" onClick={close} aria-hidden />
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={descId}
              className={cn(
                "relative w-full max-w-[calc(100%-2rem)] overflow-y-auto rounded-xl bg-popover p-0 text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none sm:max-w-3xl",
                fixed ? "max-h-[92svh]" : "max-h-full",
              )}
              initial={reduce ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
              transition={fade}
            >
              <div className="grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                <div className="flex items-center justify-center bg-muted">
                  <WorkMedia
                    work={open}
                    alt={open.text ?? open.styleName}
                    eager
                    className={cn("wf-swap-in w-full", open.src ? "max-h-[70svh] object-contain" : "max-h-[70svh]")}
                  />
                </div>
                <div className="flex flex-col gap-4 p-5 sm:p-6">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{open.text ? l.youSaid : l.style}</p>
                    <h2 id={titleId} className="mt-1 text-base leading-relaxed font-semibold">
                      {open.text ?? open.styleName}
                    </h2>
                  </div>
                  {open.prompt ? (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">{l.rewrittenAs}</p>
                      <p id={descId} className="mt-1 rounded-lg bg-muted/60 p-3 font-mono text-[11px] leading-relaxed break-words text-foreground">
                        {open.prompt}
                      </p>
                    </div>
                  ) : (
                    <p id={descId} className="text-sm text-muted-foreground">
                      {l.styleNote}
                    </p>
                  )}
                  {open.text ? (
                    <dl className="grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
                      <div>
                        <dt className="text-xs text-muted-foreground">{l.style}</dt>
                        <dd className="mt-0.5">{open.styleName}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">{l.model}</dt>
                        <dd className="mt-0.5">{open.model}</dd>
                      </div>
                    </dl>
                  ) : null}
                  <p className="mt-auto text-xs text-muted-foreground">{l.footnote}</p>
                </div>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                className="absolute top-2 right-2 inline-flex size-7 items-center justify-center rounded-[min(var(--radius-md,0.5rem),12px)] text-foreground outline-none transition-all hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
                <span className="sr-only">{l.close}</span>
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
