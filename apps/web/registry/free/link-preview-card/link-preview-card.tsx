"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const springs = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  gentle: { type: "spring", stiffness: 240, damping: 30 },
  pop: { type: "spring", stiffness: 620, damping: 20, mass: 0.8 },
} as const;

export interface LinkMeta {
  /** 站名（og:site_name）；沒有時顯示網域 */
  siteName?: string;
  title?: string;
  description?: string;
  /** 預覽圖（og:image） */
  image?: string;
  /** 網站小圖示；沒有時顯示地球圖示 */
  favicon?: string;
}

export interface LinkPreviewCardProps {
  /** 使用者貼上的網址；沒有通訊協定時會補 https:// */
  url: string;
  /** 已取得的資料，有給就不呼叫 fetchMeta */
  meta?: LinkMeta | null;
  /** 依網址取資料，應呼叫你自己的伺服器路由（瀏覽器讀不到別站的 HTML）。換網址時 signal 會中止 */
  fetchMeta?: (url: string, signal: AbortSignal) => Promise<LinkMeta>;
  /** 取得資料後回呼，可用來補上空白的標題 */
  onResolve?: (meta: LinkMeta) => void;
  /** 有給才出現移除按鈕，例如撰寫框裡收掉預覽 */
  onRemove?: () => void;
  /** row：文字在左、縮圖在右；stacked：圖在上 */
  layout?: "row" | "stacked";
  target?: string;
  labels?: Partial<typeof defaultLabels>;
  className?: string;
}

const defaultLabels = {
  empty: "Paste a link to preview it",
  invalid: "That does not look like a link",
  invalidHint: "Try a full address, like https://example.com",
  loading: "Loading preview",
  remove: "Remove preview",
};

/** 補上 https:// 並確認是 http(s) 網址；不是就回傳 null */
export function normalizeUrl(input: string): URL | null {
  const raw = input.trim();
  if (!raw || /\s/.test(raw)) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withScheme);
    if (!/^https?:$/.test(u.protocol) || !u.hostname.includes(".")) return null;
    return u;
  } catch {
    return null;
  }
}

const svg = (children: ReactNode, className = "size-3.5") => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {children}
  </svg>
);
const glyphs = {
  link: svg(<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />),
  alert: svg(<><circle cx="12" cy="12" r="9" /><path d="M12 8v4.5M12 16h.01" /></>),
  globe: svg(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>),
  close: svg(<path d="M6 6l12 12M18 6 6 18" />),
};

const e1 =
  "shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(255_255_255/0.08)]";
const e2 =
  "shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_4px_8px_-4px_rgb(0_0_0/0.06),0_12px_20px_-8px_rgb(0_0_0/0.08)] dark:shadow-none dark:bg-white/[0.03]";
const bar = "rounded-full bg-muted motion-safe:animate-pulse";

type Status = "empty" | "invalid" | "loading" | "ready";

export function LinkPreviewCard({
  url,
  meta: metaProp,
  fetchMeta,
  onResolve,
  onRemove,
  layout = "row",
  target = "_blank",
  labels: labelsProp,
  className,
}: LinkPreviewCardProps) {
  const labels = { ...defaultLabels, ...labelsProp };
  const reduce = useReducedMotion();
  const parsed = normalizeUrl(url);
  const href = parsed?.href ?? "";
  const domain = parsed?.hostname.replace(/^www\./, "") ?? "";

  // 抓到的結果跟網址綁在一起，換網址時自然回到載入中
  const [result, setResult] = useState<{ href: string; meta: LinkMeta | null } | null>(null);
  const [brokenImage, setBrokenImage] = useState<string | null>(null);
  const latest = useRef({ fetchMeta, onResolve });
  latest.current = { fetchMeta, onResolve };

  const willFetch = !metaProp && !!fetchMeta;
  useEffect(() => {
    const fetcher = latest.current.fetchMeta;
    if (!href || metaProp || !fetcher) return;
    const controller = new AbortController();
    fetcher(href, controller.signal)
      .then((m) => {
        if (controller.signal.aborted) return;
        setResult({ href, meta: m });
        latest.current.onResolve?.(m);
      })
      // 失敗時退回只有網域與網址的卡，連結照樣能開
      .catch(() => !controller.signal.aborted && setResult({ href, meta: null }));
    return () => controller.abort();
  }, [href, metaProp, willFetch]);

  const status: Status = !url.trim() ? "empty" : !parsed ? "invalid" : willFetch && result?.href !== href ? "loading" : "ready";
  const meta = metaProp ?? (result?.href === href ? result.meta : null);
  const image = status === "ready" && meta?.image && brokenImage !== meta.image ? meta.image : undefined;
  const showThumb = status === "loading" || !!image;
  const linkable = status === "ready";
  const stacked = layout === "stacked";

  const fade = (delay = 0) =>
    reduce
      ? { initial: false as const, transition: { duration: 0 } }
      : {
          initial: { opacity: 0, y: 4 },
          animate: { opacity: 1, y: 0, transition: { ...springs.gentle, delay } },
          exit: { opacity: 0, transition: { duration: 0.1 } },
        };

  // 錨點：小圖示加網域，載入前後都在同一個位置
  const anchorIcon =
    status === "empty" ? glyphs.link : status === "invalid" ? glyphs.alert : meta?.favicon ? (
      <img src={meta.favicon} alt="" className="size-3.5 rounded-[3px]" />
    ) : (
      glyphs.globe
    );
  const anchorText =
    status === "empty" ? labels.empty : status === "invalid" ? labels.invalid : (status === "ready" && meta?.siteName) || domain;

  let body: ReactNode = null;
  if (status === "invalid") {
    body = (
      <motion.div key="invalid" {...fade()} className="space-y-1">
        <p className="truncate font-mono text-xs text-foreground">{url.trim()}</p>
        <p className="text-xs text-muted-foreground">{labels.invalidHint}</p>
      </motion.div>
    );
  } else if (status === "loading") {
    body = (
      <motion.div key="loading" {...fade()} className="space-y-2 pt-0.5" aria-hidden="true">
        <div className={cn(bar, "h-3.5 w-4/5")} />
        <div className={cn(bar, "h-2.5 w-full")} />
        <div className={cn(bar, "h-2.5 w-3/5")} />
      </motion.div>
    );
  } else if (status === "ready") {
    body = (
      <motion.div key="ready" exit={{ opacity: 0, transition: { duration: reduce ? 0 : 0.1 } }}>
        <motion.p {...fade()} className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-foreground">
          {meta?.title || href}
        </motion.p>
        {meta?.description && (
          <motion.p {...fade(0.06)} className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {meta.description}
          </motion.p>
        )}
        {meta?.title && (
          <motion.p {...fade(0.06)} className="mt-1.5 truncate text-[11px] text-muted-foreground/80">
            {domain + parsed!.pathname.replace(/\/$/, "")}
          </motion.p>
        )}
      </motion.div>
    );
  }

  return (
    <div className={cn("group/lp relative w-full min-w-0", className)}>
      <motion.a
        layout={!reduce}
        transition={springs.gentle}
        href={linkable ? href : undefined}
        target={linkable ? target : undefined}
        rel={linkable ? "noopener noreferrer" : undefined}
        aria-busy={status === "loading" || undefined}
        whileTap={linkable && !reduce ? { scale: 0.99 } : undefined}
        style={{ borderRadius: 12 }}
        className={cn(
          "group relative flex w-full overflow-hidden bg-card text-left outline-none",
          stacked ? "flex-col" : "min-h-[104px] flex-row-reverse",
          e1,
          linkable && "cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        {/* e2 疊在 e1 上，懸停時切換透明度，陰影本身不做動畫 */}
        {linkable && (
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-hover:duration-0 group-focus-visible:opacity-100",
              e2,
            )}
          />
        )}
        {showThumb && (
          <motion.div
            layout={reduce ? false : "position"}
            className={cn("shrink-0 p-1", stacked ? "w-full" : "w-28 self-stretch sm:w-36")}
          >
            <div className={cn("relative overflow-hidden rounded-lg bg-muted", stacked ? "aspect-[1.91/1]" : "h-full min-h-24")}>
              {image ? (
                <motion.img
                  key={image}
                  src={image}
                  alt=""
                  draggable={false}
                  onError={() => setBrokenImage(image)}
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 size-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 motion-safe:animate-pulse" />
              )}
            </div>
          </motion.div>
        )}
        <motion.div layout={reduce ? false : "position"} className="flex min-w-0 flex-1 flex-col gap-2 px-4 py-3.5">
          <div
            className={cn(
              "flex min-w-0 items-center gap-2 text-xs",
              status === "invalid" ? "text-foreground" : "text-muted-foreground",
              onRemove && !showThumb && "pr-7",
            )}
          >
            <span className="grid size-5 shrink-0 place-items-center rounded-md bg-muted">{anchorIcon}</span>
            <span className={cn("truncate", status === "invalid" ? "font-medium" : "font-medium text-muted-foreground")}>{anchorText}</span>
          </div>
          <AnimatePresence initial={false} mode="wait">
            {body}
          </AnimatePresence>
          {status === "loading" && (
            <span role="status" className="sr-only">
              {labels.loading}
            </span>
          )}
        </motion.div>
      </motion.a>
      {onRemove && status !== "empty" && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={labels.remove}
          className={cn(
            "absolute right-2 top-2 z-20 grid size-6 place-items-center rounded-md bg-card text-muted-foreground outline-none transition-[opacity,color,scale] duration-150",
            "opacity-0 group-hover/lp:opacity-100 group-hover/lp:duration-0 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring hover:text-foreground motion-safe:active:scale-[0.97] [@media(hover:none)]:opacity-100",
            e1,
          )}
        >
          {glyphs.close}
        </button>
      )}
    </div>
  );
}
