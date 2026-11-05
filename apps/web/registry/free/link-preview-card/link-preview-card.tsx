"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/* 原版用 emoji 當圖示，改成 1.5px 線條圖示，形狀對應原意 */
const svg = (className: string, children: ReactNode) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const glyphs = {
  link: (c: string) => svg(c, <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />),
  alert: (c: string) => svg(c, <><path d="M12 3 2.5 20h19L12 3z" /><path d="M12 10v4M12 17h.01" /></>),
  globe: (c: string) => svg(c, <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>),
  external: (c: string) => svg(c, <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>),
  card: (c: string) => svg(c, <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9h10M7 13h6" /></>),
};

export interface LinkPreviewData {
  title?: string;
  description?: string;
  image?: string;
  url: string;
  siteName?: string;
}

export interface LinkPreviewCardProps {
  url: string;
  title?: string;
  description?: string;
  /** 已取得的 Open Graph 資料；有給就直接使用 */
  preview?: LinkPreviewData | null;
  /** 依網址抓取 Open Graph 資料（例如呼叫自己的 /api/link-preview） */
  fetchPreview?: (url: string) => Promise<LinkPreviewData>;
  /** 預覽抓到後，若標題或描述原本是空的，回傳補上的值 */
  onAutoFill?: (updates: { title?: string; description?: string }) => void;
  /** 開啟連結；預設 window.open 新分頁 */
  onOpen?: (url: string) => void;
  /** 是否提供網頁（iframe）視圖切換 */
  allowEmbed?: boolean;
  /** 從同源 iframe 拖出連結時的回呼 */
  onDragExtract?: (url: string, text: string) => void;
  /** 套用 CardFlow 畫布卡片外框（白底、圓角、陰影） */
  framed?: boolean;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<LinkPreviewCardLabels>;
  className?: string;
}

export interface LinkPreviewCardLabels {
  emptyTitle: string;
  emptyHint: string;
  invalidTitle: string;
  invalidHint: string;
  untitled: string;
  loading: string;
  open: (title: string) => string;
  switchToWeb: string;
  switchToCard: string;
  openInNewTab: string;
  webFallbackTitle: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, LinkPreviewCardLabels> = {
  en: {
    emptyTitle: "Link",
    emptyHint: "Add a link URL and description in the editor",
    invalidTitle: "Invalid link",
    invalidHint: "Enter a valid URL (for example: https://example.com)",
    untitled: "Untitled link",
    loading: "Loading preview...",
    open: (title) => `Open link: ${title} (double-click or right-click to open)`,
    switchToWeb: "Switch to web view",
    switchToCard: "Switch to preview card",
    openInNewTab: "Open in new tab",
    webFallbackTitle: "Link preview",
  },
  "zh-TW": {
    emptyTitle: "連結",
    emptyHint: "在編輯器中加入連結網址與說明",
    invalidTitle: "無效的連結",
    invalidHint: "請輸入有效的網址（例如：https://example.com）",
    untitled: "未命名連結",
    loading: "正在載入預覽...",
    open: (title) => `開啟連結：${title}（雙擊或按右鍵開啟）`,
    switchToWeb: "切換到網頁檢視",
    switchToCard: "切換到預覽卡片",
    openInNewTab: "在新分頁開啟",
    webFallbackTitle: "連結預覽",
  },
  "zh-CN": {
    emptyTitle: "链接",
    emptyHint: "在编辑器中添加链接网址和说明",
    invalidTitle: "无效的链接",
    invalidHint: "请输入有效的网址（例如：https://example.com）",
    untitled: "未命名链接",
    loading: "正在加载预览...",
    open: (title) => `打开链接：${title}（双击或右键打开）`,
    switchToWeb: "切换到网页视图",
    switchToCard: "切换到预览卡片",
    openInNewTab: "在新标签页打开",
    webFallbackTitle: "链接预览",
  },
  ja: {
    emptyTitle: "リンク",
    emptyHint: "エディタでリンクの URL と説明を追加してください",
    invalidTitle: "無効なリンク",
    invalidHint: "有効な URL を入力してください（例：https://example.com）",
    untitled: "無題のリンク",
    loading: "プレビューを読み込み中...",
    open: (title) => `リンクを開く：${title}（ダブルクリックまたは右クリックで開きます）`,
    switchToWeb: "ウェブ表示に切り替え",
    switchToCard: "プレビューカードに切り替え",
    openInNewTab: "新しいタブで開く",
    webFallbackTitle: "リンクプレビュー",
  },
};

// 已知會設定 X-Frame-Options: deny 的網站
const BLOCKED_DOMAINS = [
  "threads.com",
  "facebook.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "instagram.com",
  "pinterest.com",
  "tiktok.com",
  "youtube.com",
  "reddit.com",
];
const SOCIAL_DOMAINS = BLOCKED_DOMAINS.slice(0, 6);

const isBlockedDomain = (url: string) => BLOCKED_DOMAINS.some((d) => url.toLowerCase().includes(d));

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export function LinkPreviewCard({
  url,
  title = "",
  description = "",
  preview: previewProp,
  fetchPreview,
  onAutoFill,
  onOpen,
  allowEmbed = true,
  onDragExtract,
  framed = true,
  locale = "en",
  labels: labelsProp,
  className,
}: LinkPreviewCardProps) {
  const labels = { ...MESSAGES[resolveLocale(locale)], ...labelsProp };
  const [showIframe, setShowIframe] = useState(true);
  // 預設使用預覽卡片
  const [viewMode, setViewMode] = useState<"iframe" | "preview">("preview");
  const [iframeError, setIframeError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [cspBlocked, setCspBlocked] = useState(false);
  const [fetched, setFetched] = useState<LinkPreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ title, description, onAutoFill, fetchPreview });
  latest.current = { title, description, onAutoFill, fetchPreview };

  // 追蹤拖動狀態，防止拖動時觸發連結
  const drag = useRef({ x: 0, y: 0, hasMoved: false, isMouseDown: false });

  const preview = previewProp ?? fetched;

  const markBlocked = useCallback(() => {
    setCspBlocked(true);
    setIframeError(true);
    setShowIframe(false);
    setViewMode("preview");
  }, []);

  // 網址改變時重新抓預覽並重置 iframe
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    const fetcher = latest.current.fetchPreview;
    if (fetcher && isValidUrl(url)) {
      setLoadingPreview(true);
      fetcher(url)
        .then((data) => {
          if (cancelled) return;
          setFetched(data);
          // 自動補上空白的標題與描述
          const { title: t, description: d, onAutoFill: fill } = latest.current;
          const updates: { title?: string; description?: string } = {};
          if (data.title && !t) updates.title = data.title;
          if (data.description && !d) updates.description = data.description;
          if (Object.keys(updates).length > 0) fill?.(updates);
        })
        .catch(() => {
          // 失敗時退回使用 title / description
          if (!cancelled) setFetched(null);
        })
        .finally(() => {
          if (!cancelled) setLoadingPreview(false);
        });
    }

    if (isBlockedDomain(url)) {
      setViewMode("preview");
      setShowIframe(false);
      setCspBlocked(true);
      setIframeError(false);
    } else {
      setIframeKey((k) => k + 1);
      setIframeError(false);
      setCspBlocked(false);
      setShowIframe(true);
    }

    return () => {
      cancelled = true;
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, [url]);

  // 全域追蹤滑鼠移動，超過 3px 視為拖動
  useEffect(() => {
    const t = drag.current;
    const onMove = (e: globalThis.MouseEvent) => {
      if (!t.isMouseDown) return;
      if (Math.abs(e.clientX - t.x) > 3 || Math.abs(e.clientY - t.y) > 3) t.hasMoved = true;
    };
    const onUp = () => {
      t.isMouseDown = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      t.hasMoved = false;
      t.isMouseDown = false;
    };
  }, []);

  // 監聽 CSP / X-Frame-Options 阻擋，自動切回預覽卡片
  useEffect(() => {
    if (!allowEmbed) return;
    const onError = (event: ErrorEvent) => {
      const m = event.message || "";
      if (
        m.includes("frame-ancestors") ||
        m.includes("Content Security Policy") ||
        m.includes("Refused to frame") ||
        m.includes("X-Frame-Options") ||
        m.includes("sameorigin") ||
        m.includes("deny")
      ) {
        markBlocked();
      }
    };
    const onViolation = (event: SecurityPolicyViolationEvent) => {
      if (event.violatedDirective === "frame-ancestors" || event.blockedURI?.includes("frame")) markBlocked();
    };
    window.addEventListener("error", onError);
    document.addEventListener("securitypolicyviolation", onViolation);
    return () => {
      window.removeEventListener("error", onError);
      document.removeEventListener("securitypolicyviolation", onViolation);
    };
  }, [allowEmbed, markBlocked]);

  const openLink = () => {
    if (!url) return;
    if (onOpen) onOpen(url);
    else window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleMouseDown = (e: MouseEvent) => {
    drag.current.x = e.clientX;
    drag.current.y = e.clientY;
    drag.current.hasMoved = false;
    drag.current.isMouseDown = true;
    // 按在按鈕上才阻止冒泡，其餘讓外層處理拖動
    if ((e.target as HTMLElement).closest("button")) e.stopPropagation();
  };

  // 雙擊一律開啟（雙擊本身就是明確意圖）
  const handleDoubleClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    drag.current.hasMoved = false;
    drag.current.isMouseDown = false;
    openLink();
  };

  // 右鍵開啟，拖動中則略過
  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!drag.current.hasMoved) openLink();
    drag.current.hasMoved = false;
    drag.current.isMouseDown = false;
  };

  const frame = framed && "rounded-lg bg-card shadow-sm overflow-hidden";

  if (!url || !isValidUrl(url)) {
    const empty = !url;
    return (
      <div className={cn("relative h-full w-full", frame, className)}>
        <div className="flex h-full w-full flex-col items-center justify-center rounded-lg border border-border bg-muted/40 p-6">
          <span className="mb-4 text-muted-foreground">{empty ? glyphs.link("h-10 w-10") : glyphs.alert("h-10 w-10")}</span>
          <h3 className="mb-2 text-lg font-semibold text-foreground">{empty ? labels.emptyTitle : labels.invalidTitle}</h3>
          <p className="text-center text-sm text-muted-foreground">{empty ? labels.emptyHint : labels.invalidHint}</p>
        </div>
      </div>
    );
  }

  const blocked = isBlockedDomain(url);

  if (!allowEmbed || viewMode === "preview" || !showIframe || iframeError || cspBlocked) {
    const displayTitle = preview?.title || title || labels.untitled;
    const displayDescription = preview?.description || description;
    const displayImage = preview?.image;
    const displaySiteName = preview?.siteName;

    return (
      <div className={cn("relative h-full w-full", frame, className)}>
        <div
          className="group relative h-full w-full cursor-pointer overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-colors hover:border-foreground/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          onContextMenu={handleContextMenu}
          role="button"
          tabIndex={0}
          aria-busy={loadingPreview || undefined}
          onKeyDown={(e: KeyboardEvent) => {
            if (e.target !== e.currentTarget) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openLink();
            }
          }}
          aria-label={labels.open(displayTitle)}
        >
          {displayImage && (
            <div className="pointer-events-none h-40 w-full overflow-hidden border-b border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayImage}
                alt=""
                className="h-full w-full object-cover"
                onError={(e) => {
                  // 圖片載入失敗時隱藏圖片區域
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}

          {/* 原始碼意圖：有圖片時內容不撐滿高度，網址列才不會被裁掉 */}
          <div className={cn("flex flex-col p-4", !displayImage && "h-full")}>
            {/* 工具列：滑過或鍵盤聚焦時出現 */}
            <div className="absolute right-2 top-2 z-10 flex gap-2 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none">
              {allowEmbed && !blocked && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewMode("iframe");
                    setShowIframe(true);
                    setIframeError(false);
                    setCspBlocked(false);
                  }}
                  className="rounded-md border border-border bg-card px-1.5 py-1 text-muted-foreground shadow-sm hover:text-foreground"
                  title={labels.switchToWeb}
                  aria-label={labels.switchToWeb}
                >
                  {glyphs.globe("h-3.5 w-3.5")}
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openLink();
                }}
                className="rounded-md border border-border bg-card px-1.5 py-1 text-muted-foreground shadow-sm hover:text-foreground"
                title={labels.openInNewTab}
                aria-label={labels.openInNewTab}
              >
                {glyphs.external("h-3.5 w-3.5")}
              </button>
            </div>

            {displaySiteName && <div className="mb-1 text-xs font-medium text-muted-foreground">{displaySiteName}</div>}

            <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-foreground">{displayTitle}</h3>

            {displayDescription && <p className="mb-3 line-clamp-3 flex-1 text-sm text-muted-foreground">{displayDescription}</p>}

            <div className="mt-auto border-t border-border pt-2">
              <div className="truncate font-mono text-xs text-muted-foreground">{url}</div>
            </div>
          </div>

          {loadingPreview && (
            <div className="absolute inset-0 flex items-center justify-center bg-card/90" role="status">
              <div className="text-sm text-muted-foreground">{labels.loading}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // iframe 嵌入視圖
  return (
    <div className={cn("relative h-full w-full", frame, className)}>
      <div
        className="relative h-full w-full overflow-hidden rounded-lg border border-border bg-muted"
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between border-b border-border bg-card px-3 py-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="truncate text-sm font-medium text-foreground">{title || labels.webFallbackTitle}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setViewMode("preview");
                setShowIframe(false);
              }}
              className="rounded px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              title={labels.switchToCard}
              aria-label={labels.switchToCard}
            >
              {glyphs.card("h-3.5 w-3.5")}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openLink();
              }}
              className="rounded px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              title={labels.openInNewTab}
              aria-label={labels.openInNewTab}
            >
              {glyphs.external("h-3.5 w-3.5")}
            </button>
          </div>
        </div>

        {!blocked && (
          <div style={{ marginTop: "36px", height: "calc(100% - 36px)" }}>
            <iframe
              key={iframeKey}
              src={url}
              className="h-full w-full border-0"
              onError={markBlocked}
              onLoad={(e) => {
                if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
                const iframe = e.currentTarget;
                const getDoc = () => iframe.contentDocument || iframe.contentWindow?.document;

                // 同源頁面：讓 iframe 內的連結可拖出
                try {
                  const doc = getDoc();
                  doc?.querySelectorAll("a").forEach((link) => {
                    link.setAttribute("draggable", "true");
                    link.addEventListener("dragstart", (event: DragEvent) => {
                      const a = event.target as HTMLAnchorElement;
                      if (!a.href) return;
                      event.dataTransfer?.setData("text/plain", a.href);
                      event.dataTransfer?.setData("text/url", a.href);
                      event.dataTransfer?.setData("text/html", a.outerHTML);
                      if (onDragExtract) setTimeout(() => onDragExtract(a.href, a.textContent || ""), 0);
                    });
                  });
                } catch {
                  // 跨域無法存取，屬正常情況
                }

                // 1.5 秒後檢查是否為空白頁（可能被 CSP / X-Frame-Options 阻擋）
                loadTimeoutRef.current = setTimeout(() => {
                  try {
                    const doc = getDoc();
                    if (doc) {
                      const body = doc.body;
                      if (body && body.innerHTML.trim().length === 0 && body.children.length === 0) markBlocked();
                      else {
                        setIframeError(false);
                        setCspBlocked(false);
                      }
                    } else {
                      // 有些頁面較慢，再等 1 秒
                      setTimeout(() => {
                        try {
                          if (!getDoc()) markBlocked();
                        } catch {
                          markBlocked();
                        }
                      }, 1000);
                    }
                  } catch {
                    // 跨域：社群網站多半是 deny，2 秒後再判斷
                    setTimeout(() => {
                      try {
                        if (!getDoc() && SOCIAL_DOMAINS.some((d) => url.toLowerCase().includes(d))) markBlocked();
                      } catch {
                        // 無法判斷時保留網頁視圖，讓使用者自行切換
                      }
                    }, 2000);
                  }
                }, 1500);
              }}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="no-referrer-when-downgrade"
              title={title || labels.webFallbackTitle}
            />
          </div>
        )}
      </div>
    </div>
  );
}
